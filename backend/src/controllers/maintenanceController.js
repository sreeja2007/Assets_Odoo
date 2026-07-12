const { query, getClient } = require('../config/db');
const { createLog } = require('../models/activityLog');
const { createNotification } = require('../models/notification');

const MAINT_SELECT = `
  SELECT m.id, m.asset_id, a.tag AS asset_tag, a.name AS asset_name,
         m.requested_by, ru.name AS requested_by_name,
         m.assigned_technician, tu.name AS technician_name,
         m.status, m.priority, m.issue, m.notes, m.photo_url,
         m.resolved_at, m.created_at, m.updated_at
  FROM maintenance_requests m
  JOIN assets a ON a.id = m.asset_id
  LEFT JOIN users ru ON ru.id = m.requested_by
  LEFT JOIN users tu ON tu.id = m.assigned_technician
`;

// Allowed status transitions
const TRANSITIONS = {
  'Pending':              ['Approved', 'Rejected'],
  'Approved':             ['Technician Assigned'],
  'Technician Assigned':  ['In Progress'],
  'In Progress':          ['Resolved'],
  'Resolved':             [],
  'Rejected':             [],
};

// GET /maintenance
async function listMaintenance(req, res, next) {
  try {
    const { status, asset_id, priority } = req.query;
    const conditions = [];
    const params = [];

    if (status)   { params.push(status);   conditions.push(`m.status = $${params.length}`); }
    if (asset_id) { params.push(asset_id); conditions.push(`m.asset_id = $${params.length}`); }
    if (priority) { params.push(priority); conditions.push(`m.priority = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`${MAINT_SELECT} ${where} ORDER BY m.created_at DESC`, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /maintenance/:id
async function getMaintenance(req, res, next) {
  try {
    const { rows } = await query(`${MAINT_SELECT} WHERE m.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Maintenance request not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /maintenance
async function createMaintenance(req, res, next) {
  try {
    const { asset_id, issue, priority = 'Medium', photo_url } = req.body;

    const assetRes = await query('SELECT id, name FROM assets WHERE id = $1', [asset_id]);
    if (!assetRes.rows.length) return res.status(404).json({ error: 'Asset not found' });

    const { rows } = await query(
      `INSERT INTO maintenance_requests (asset_id, requested_by, issue, priority, photo_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [asset_id, req.user.id, issue.trim(), priority, photo_url || null]
    );

    await createLog({
      type: 'Maintenance', userId: req.user.id, targetId: rows[0].id,
      message: `Raised maintenance request for ${assetRes.rows[0].name}: ${issue.trim().slice(0, 60)}`,
    });

    // Notify asset managers
    const mgrsRes = await query(
      `SELECT id FROM users WHERE role IN ('Admin','Asset Manager') AND status = 'Active'`
    );
    await Promise.all(mgrsRes.rows.map(u =>
      createNotification({
        userId: u.id, type: 'Maintenance',
        message: `New maintenance request for ${assetRes.rows[0].name}: ${priority} priority`,
      })
    ));

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /maintenance/:id/status  (Admin | Asset Manager)
async function updateStatus(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { status, assigned_technician, notes } = req.body;

    const mRes = await client.query(
      `SELECT * FROM maintenance_requests WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );
    if (!mRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Maintenance request not found' });
    }
    const current = mRes.rows[0];
    const allowed = TRANSITIONS[current.status] || [];

    if (!allowed.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot move from '${current.status}' to '${status}'`,
        allowed,
      });
    }

    const resolvedAt = status === 'Resolved' ? new Date().toISOString() : current.resolved_at;
    const tech = assigned_technician !== undefined ? assigned_technician : current.assigned_technician;
    const updatedNotes = notes !== undefined ? notes : current.notes;

    const { rows } = await client.query(
      `UPDATE maintenance_requests
       SET status = $1, assigned_technician = $2, notes = $3,
           resolved_at = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [status, tech, updatedNotes, resolvedAt, req.params.id]
    );

    // Asset status side-effects
    if (status === 'Approved') {
      await client.query(
        `UPDATE assets SET status = 'Under Maintenance', updated_at = NOW() WHERE id = $1`,
        [current.asset_id]
      );
    }
    if (status === 'Resolved') {
      await client.query(
        `UPDATE assets SET status = 'Available', updated_at = NOW() WHERE id = $1`,
        [current.asset_id]
      );
    }

    await client.query('COMMIT');

    const assetRes = await query('SELECT name FROM assets WHERE id = $1', [current.asset_id]);
    await createLog({
      type: 'Maintenance', userId: req.user.id, targetId: req.params.id,
      message: `Maintenance for ${assetRes.rows[0]?.name} updated to ${status}`,
    });

    // Notify the requester
    if (current.requested_by) {
      await createNotification({
        userId: current.requested_by, type: 'Maintenance',
        message: `Your maintenance request for ${assetRes.rows[0]?.name} is now: ${status}`,
      });
    }

    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { listMaintenance, getMaintenance, createMaintenance, updateStatus };
