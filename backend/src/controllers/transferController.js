const { query, getClient } = require('../config/db');
const { createLog } = require('../models/activityLog');
const { createNotification } = require('../models/notification');

const TRANSFER_SELECT = `
  SELECT t.id, t.asset_id, a.tag AS asset_tag, a.name AS asset_name,
         t.from_user_id, fu.name AS from_user_name,
         t.to_user_id,   tu.name AS to_user_name,
         t.requested_by, rb.name AS requested_by_name,
         t.status, t.reason, t.resolved_at, t.resolved_by,
         rv.name AS resolved_by_name, t.created_at
  FROM transfer_requests t
  JOIN assets a ON a.id = t.asset_id
  LEFT JOIN users fu ON fu.id = t.from_user_id
  LEFT JOIN users tu ON tu.id = t.to_user_id
  LEFT JOIN users rb ON rb.id = t.requested_by
  LEFT JOIN users rv ON rv.id = t.resolved_by
`;

// GET /transfers
async function listTransfers(req, res, next) {
  try {
    const { status, asset_id } = req.query;
    const conditions = [];
    const params = [];

    if (status)   { params.push(status);   conditions.push(`t.status = $${params.length}`); }
    if (asset_id) { params.push(asset_id); conditions.push(`t.asset_id = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`${TRANSFER_SELECT} ${where} ORDER BY t.created_at DESC`, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /transfers
async function requestTransfer(req, res, next) {
  try {
    const { asset_id, to_user_id, reason } = req.body;

    const assetRes = await query('SELECT assigned_to, name, tag FROM assets WHERE id = $1', [asset_id]);
    if (!assetRes.rows.length) return res.status(404).json({ error: 'Asset not found' });
    const asset = assetRes.rows[0];

    const { rows } = await query(
      `INSERT INTO transfer_requests (asset_id, from_user_id, to_user_id, requested_by, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [asset_id, asset.assigned_to || null, to_user_id || null, req.user.id, reason || null]
    );

    await createLog({
      type: 'Transfer', userId: req.user.id, targetId: rows[0].id,
      message: `Transfer request raised for ${asset.name} (${asset.tag})`,
    });

    // Notify asset managers and admins
    const mgrsRes = await query(
      `SELECT id FROM users WHERE role IN ('Admin','Asset Manager') AND status = 'Active'`
    );
    await Promise.all(mgrsRes.rows.map(u =>
      createNotification({
        userId: u.id, type: 'Approval',
        message: `Transfer request for ${asset.name} (${asset.tag}) needs your review`,
      })
    ));

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /transfers/:id/resolve  (Admin | Asset Manager | Dept Head)
async function resolveTransfer(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { approved } = req.body; // boolean

    const tRes = await client.query(
      `SELECT * FROM transfer_requests WHERE id = $1 AND status = 'Requested' FOR UPDATE`,
      [req.params.id]
    );
    if (!tRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending transfer request not found' });
    }
    const transfer = tRes.rows[0];
    const newStatus = approved ? 'Approved' : 'Rejected';

    const { rows } = await client.query(
      `UPDATE transfer_requests
       SET status = $1, resolved_at = NOW(), resolved_by = $2
       WHERE id = $3 RETURNING *`,
      [newStatus, req.user.id, req.params.id]
    );

    if (approved && transfer.to_user_id) {
      await client.query(
        `UPDATE assets SET assigned_to = $1, updated_at = NOW() WHERE id = $2`,
        [transfer.to_user_id, transfer.asset_id]
      );
    }

    await client.query('COMMIT');

    const assetRes = await query('SELECT name, tag FROM assets WHERE id = $1', [transfer.asset_id]);
    const asset = assetRes.rows[0];
    await createLog({
      type: 'Approval', userId: req.user.id, targetId: req.params.id,
      message: `${approved ? 'Approved' : 'Rejected'} transfer for ${asset?.name}`,
    });

    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { listTransfers, requestTransfer, resolveTransfer };
