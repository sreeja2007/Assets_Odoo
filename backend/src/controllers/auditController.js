const { query, getClient } = require('../config/db');
const { createLog } = require('../models/activityLog');

// GET /audit
async function listCycles(req, res, next) {
  try {
    const { status } = req.query;
    const params = [];
    const conditions = [];
    if (status) { params.push(status); conditions.push(`ac.status = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT ac.id, ac.name, ac.department_id, d.name AS department_name,
              ac.location, ac.start_date, ac.end_date, ac.status,
              ac.created_by, u.name AS created_by_name,
              ac.closed_by, ac.closed_at, ac.created_at
       FROM audit_cycles ac
       LEFT JOIN departments d ON d.id = ac.department_id
       LEFT JOIN users u ON u.id = ac.created_by
       ${where}
       ORDER BY ac.created_at DESC`,
      params
    );

    // Attach auditors and item counts to each cycle
    const cycleIds = rows.map(r => r.id);
    if (!cycleIds.length) return res.json([]);

    const auditorRes = await query(
      `SELECT aca.cycle_id, u.id, u.name, u.role
       FROM audit_cycle_auditors aca
       JOIN users u ON u.id = aca.user_id
       WHERE aca.cycle_id = ANY($1)`,
      [cycleIds]
    );

    const itemsRes = await query(
      `SELECT cycle_id,
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'Verified') AS verified,
              COUNT(*) FILTER (WHERE status = 'Missing')  AS missing,
              COUNT(*) FILTER (WHERE status = 'Damaged')  AS damaged
       FROM audit_items
       WHERE cycle_id = ANY($1)
       GROUP BY cycle_id`,
      [cycleIds]
    );

    const auditorMap = {};
    auditorRes.rows.forEach(a => {
      if (!auditorMap[a.cycle_id]) auditorMap[a.cycle_id] = [];
      auditorMap[a.cycle_id].push({ id: a.id, name: a.name, role: a.role });
    });
    const itemMap = {};
    itemsRes.rows.forEach(i => { itemMap[i.cycle_id] = i; });

    const enriched = rows.map(r => ({
      ...r,
      auditors: auditorMap[r.id] || [],
      counts: itemMap[r.id] || { total: 0, verified: 0, missing: 0, damaged: 0 },
    }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
}

// GET /audit/:id
async function getCycle(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT ac.*, d.name AS department_name
       FROM audit_cycles ac
       LEFT JOIN departments d ON d.id = ac.department_id
       WHERE ac.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Audit cycle not found' });

    const [auditorsRes, itemsRes] = await Promise.all([
      query(
        `SELECT u.id, u.name, u.role FROM audit_cycle_auditors aca
         JOIN users u ON u.id = aca.user_id WHERE aca.cycle_id = $1`,
        [req.params.id]
      ),
      query(
        `SELECT ai.*, a.tag, a.name AS asset_name, a.location
         FROM audit_items ai
         JOIN assets a ON a.id = ai.asset_id
         WHERE ai.cycle_id = $1 ORDER BY a.tag`,
        [req.params.id]
      ),
    ]);

    res.json({ ...rows[0], auditors: auditorsRes.rows, items: itemsRes.rows });
  } catch (err) {
    next(err);
  }
}

// POST /audit  (Admin | Asset Manager)
async function createCycle(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { name, department_id, location, start_date, end_date, auditor_ids = [] } = req.body;

    const { rows } = await client.query(
      `INSERT INTO audit_cycles (name, department_id, location, start_date, end_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name.trim(), department_id || null, location?.trim() || null, start_date, end_date, req.user.id]
    );
    const cycle = rows[0];

    if (auditor_ids.length) {
      const values = auditor_ids.map((uid, i) => `($1, $${i + 2})`).join(',');
      await client.query(
        `INSERT INTO audit_cycle_auditors (cycle_id, user_id) VALUES ${values}`,
        [cycle.id, ...auditor_ids]
      );
    }

    await client.query('COMMIT');

    await createLog({
      type: 'Audit', userId: req.user.id, targetId: cycle.id,
      message: `Created audit cycle: ${cycle.name}`,
    });

    res.status(201).json(cycle);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PATCH /audit/:id/items/:assetId  (auditor or Admin/Asset Manager)
async function updateItem(req, res, next) {
  try {
    const { cycle_id, asset_id } = req.params;
    const { status, notes } = req.body;

    // Verify cycle is open
    const cycleRes = await query('SELECT status FROM audit_cycles WHERE id = $1', [cycle_id]);
    if (!cycleRes.rows.length) return res.status(404).json({ error: 'Cycle not found' });
    if (cycleRes.rows[0].status === 'Closed') {
      return res.status(409).json({ error: 'Cannot update items in a closed audit cycle' });
    }

    const { rows } = await query(
      `INSERT INTO audit_items (cycle_id, asset_id, status, notes, updated_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cycle_id, asset_id) DO UPDATE
         SET status = $3, notes = $4, updated_by = $5, updated_at = NOW()
       RETURNING *`,
      [cycle_id, asset_id, status, notes || null, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /audit/:id/close  (Admin | Asset Manager)
async function closeCycle(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const cycleRes = await client.query(
      `SELECT * FROM audit_cycles WHERE id = $1 AND status = 'Open' FOR UPDATE`,
      [req.params.id]
    );
    if (!cycleRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Open audit cycle not found' });
    }
    const cycle = cycleRes.rows[0];

    // Flip missing items → Lost
    const missingRes = await client.query(
      `SELECT asset_id FROM audit_items WHERE cycle_id = $1 AND status = 'Missing'`,
      [req.params.id]
    );
    if (missingRes.rows.length) {
      const missingIds = missingRes.rows.map(r => r.asset_id);
      await client.query(
        `UPDATE assets SET status = 'Lost', updated_at = NOW() WHERE id = ANY($1)`,
        [missingIds]
      );
    }

    const { rows } = await client.query(
      `UPDATE audit_cycles SET status = 'Closed', closed_by = $1, closed_at = NOW()
       WHERE id = $2 RETURNING *`,
      [req.user.id, req.params.id]
    );

    await client.query('COMMIT');

    await createLog({
      type: 'Audit', userId: req.user.id, targetId: req.params.id,
      message: `Closed audit cycle: ${cycle.name} (${missingRes.rows.length} asset(s) marked Lost)`,
    });

    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { listCycles, getCycle, createCycle, updateItem, closeCycle };
