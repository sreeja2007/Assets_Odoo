const { query, getClient } = require('../config/db');
const { createLog } = require('../models/activityLog');
const { createNotification } = require('../models/notification');

const ALLOC_SELECT = `
  SELECT al.id, al.asset_id, a.tag AS asset_tag, a.name AS asset_name,
         al.assigned_to, u.name AS assigned_to_name,
         al.assigned_by, b.name AS assigned_by_name,
         al.department_id, d.name AS department_name,
         al.allocation_date, al.expected_return_date,
         al.return_date, al.condition_on_return, al.notes, al.created_at
  FROM allocations al
  JOIN assets a ON a.id = al.asset_id
  LEFT JOIN users u ON u.id = al.assigned_to
  LEFT JOIN users b ON b.id = al.assigned_by
  LEFT JOIN departments d ON d.id = al.department_id
`;

// GET /allocations
async function listAllocations(req, res, next) {
  try {
    const { active, asset_id, user_id, overdue } = req.query;
    const conditions = [];
    const params = [];

    if (active === 'true')  conditions.push('al.return_date IS NULL');
    if (active === 'false') conditions.push('al.return_date IS NOT NULL');
    if (asset_id) { params.push(asset_id); conditions.push(`al.asset_id = $${params.length}`); }
    if (user_id)  { params.push(user_id);  conditions.push(`al.assigned_to = $${params.length}`); }
    if (overdue === 'true') {
      conditions.push('al.return_date IS NULL AND al.expected_return_date < CURRENT_DATE');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`${ALLOC_SELECT} ${where} ORDER BY al.allocation_date DESC`, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /allocations  (Admin | Asset Manager)
async function allocate(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { asset_id, assigned_to, department_id, expected_return_date, notes } = req.body;

    // Conflict check — block double-allocation
    const assetRes = await client.query(
      'SELECT id, name, tag, status, assigned_to FROM assets WHERE id = $1 FOR UPDATE',
      [asset_id]
    );
    const asset = assetRes.rows[0];
    if (!asset) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Asset not found' });
    }
    if (asset.status === 'Allocated') {
      const holderRes = await client.query(
        'SELECT name FROM users WHERE id = $1', [asset.assigned_to]
      );
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Asset is already allocated`,
        holder: holderRes.rows[0]?.name || 'Unknown',
        assetName: asset.name,
      });
    }
    if (!['Available', 'Reserved'].includes(asset.status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Asset cannot be allocated while in status: ${asset.status}` });
    }

    const { rows } = await client.query(
      `INSERT INTO allocations
         (asset_id, assigned_to, assigned_by, department_id, expected_return_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [asset_id, assigned_to || null, req.user.id, department_id || null,
       expected_return_date || null, notes || null]
    );

    await client.query(
      `UPDATE assets SET status = 'Allocated', assigned_to = $1,
       department_id = $2, updated_at = NOW() WHERE id = $3`,
      [assigned_to || null, department_id || null, asset_id]
    );

    await client.query('COMMIT');

    // Side-effects (fire and forget — outside transaction)
    const toUserRes = await query('SELECT name FROM users WHERE id = $1', [assigned_to]);
    const toName = toUserRes.rows[0]?.name || 'Unknown';
    await createLog({
      type: 'Allocation', userId: req.user.id, targetId: asset_id,
      message: `Allocated ${asset.name} to ${toName}`,
    });
    if (assigned_to) {
      await createNotification({
        userId: assigned_to, type: 'Approval',
        message: `${asset.name} (${asset.tag}) has been allocated to you`,
      });
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// POST /allocations/:id/return  (Admin | Asset Manager | Dept Head)
async function returnAsset(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { condition_on_return, notes } = req.body;

    const allocRes = await client.query(
      'SELECT * FROM allocations WHERE id = $1 AND return_date IS NULL FOR UPDATE',
      [req.params.id]
    );
    if (!allocRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Active allocation not found' });
    }
    const alloc = allocRes.rows[0];

    const { rows } = await client.query(
      `UPDATE allocations
       SET return_date = CURRENT_DATE, condition_on_return = $1, notes = COALESCE($2, notes)
       WHERE id = $3 RETURNING *`,
      [condition_on_return || null, notes, req.params.id]
    );

    await client.query(
      `UPDATE assets SET status = 'Available', assigned_to = NULL,
       department_id = NULL, updated_at = NOW() WHERE id = $1`,
      [alloc.asset_id]
    );

    await client.query('COMMIT');

    const assetRes = await query('SELECT name, tag FROM assets WHERE id = $1', [alloc.asset_id]);
    const asset = assetRes.rows[0];
    await createLog({
      type: 'Return', userId: req.user.id, targetId: alloc.asset_id,
      message: `${asset?.name} returned. Condition: ${condition_on_return || 'Good'}`,
    });

    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { listAllocations, allocate, returnAsset };
