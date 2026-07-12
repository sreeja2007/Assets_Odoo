const { query } = require('../config/db');
const { createLog } = require('../models/activityLog');

// ── Helpers ───────────────────────────────────────────────────
const ASSET_SELECT = `
  SELECT a.id, a.tag, a.name, a.category_id, c.name AS category_name,
         a.serial_number, a.acquisition_date, a.acquisition_cost,
         a.condition, a.location, a.status, a.is_bookable,
         a.department_id, d.name AS department_name,
         a.assigned_to, u.name AS assigned_to_name,
         a.photo_url, a.custom_fields, a.created_at, a.updated_at
  FROM assets a
  LEFT JOIN asset_categories c ON c.id = a.category_id
  LEFT JOIN departments d ON d.id = a.department_id
  LEFT JOIN users u ON u.id = a.assigned_to
`;

// GET /assets
async function listAssets(req, res, next) {
  try {
    const { status, category_id, department_id, is_bookable, q } = req.query;
    const conditions = [];
    const params = [];

    if (status)        { params.push(status);        conditions.push(`a.status = $${params.length}`); }
    if (category_id)   { params.push(category_id);   conditions.push(`a.category_id = $${params.length}`); }
    if (department_id) { params.push(department_id); conditions.push(`a.department_id = $${params.length}`); }
    if (is_bookable !== undefined) {
      params.push(is_bookable === 'true');
      conditions.push(`a.is_bookable = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      const n = params.length;
      conditions.push(`(a.name ILIKE $${n} OR a.tag ILIKE $${n} OR a.serial_number ILIKE $${n})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`${ASSET_SELECT} ${where} ORDER BY a.tag`, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /assets/:id
async function getAsset(req, res, next) {
  try {
    const { rows } = await query(`${ASSET_SELECT} WHERE a.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Asset not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /assets/:id/history
async function getAssetHistory(req, res, next) {
  try {
    const { id } = req.params;
    const [allocRes, maintRes] = await Promise.all([
      query(
        `SELECT al.*, u.name AS assigned_to_name, b.name AS assigned_by_name
         FROM allocations al
         LEFT JOIN users u ON u.id = al.assigned_to
         LEFT JOIN users b ON b.id = al.assigned_by
         WHERE al.asset_id = $1 ORDER BY al.allocation_date DESC`,
        [id]
      ),
      query(
        `SELECT m.*, u.name AS requested_by_name, t.name AS technician_name
         FROM maintenance_requests m
         LEFT JOIN users u ON u.id = m.requested_by
         LEFT JOIN users t ON t.id = m.assigned_technician
         WHERE m.asset_id = $1 ORDER BY m.created_at DESC`,
        [id]
      ),
    ]);
    res.json({ allocations: allocRes.rows, maintenance: maintRes.rows });
  } catch (err) {
    next(err);
  }
}

// POST /assets  (Admin | Asset Manager)
async function createAsset(req, res, next) {
  try {
    const {
      name, category_id, serial_number, acquisition_date, acquisition_cost,
      condition = 'Good', location, is_bookable = false, custom_fields = {},
    } = req.body;

    // Auto-generate tag using the sequence
    const seqRes = await query("SELECT nextval('asset_tag_seq') AS n");
    const tag = `AF-${String(seqRes.rows[0].n).padStart(4, '0')}`;

    const { rows } = await query(
      `INSERT INTO assets
         (tag, name, category_id, serial_number, acquisition_date, acquisition_cost,
          condition, location, is_bookable, custom_fields)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [tag, name.trim(), category_id || null, serial_number || null,
       acquisition_date || null, acquisition_cost || null,
       condition, location?.trim() || null, is_bookable,
       JSON.stringify(custom_fields)]
    );

    await createLog({
      type: 'Registration', userId: req.user.id, targetId: rows[0].id,
      message: `Registered new asset: ${rows[0].name} (${rows[0].tag})`,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /assets/:id  (Admin | Asset Manager)
async function updateAsset(req, res, next) {
  try {
    const {
      name, category_id, serial_number, acquisition_date, acquisition_cost,
      condition, location, is_bookable, status, custom_fields, photo_url,
    } = req.body;

    const { rows } = await query(
      `UPDATE assets SET
         name             = COALESCE($1,  name),
         category_id      = COALESCE($2,  category_id),
         serial_number    = COALESCE($3,  serial_number),
         acquisition_date = COALESCE($4,  acquisition_date),
         acquisition_cost = COALESCE($5,  acquisition_cost),
         condition        = COALESCE($6,  condition),
         location         = COALESCE($7,  location),
         is_bookable      = COALESCE($8,  is_bookable),
         status           = COALESCE($9,  status),
         custom_fields    = COALESCE($10, custom_fields),
         photo_url        = COALESCE($11, photo_url),
         updated_at       = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        name?.trim(), category_id, serial_number, acquisition_date,
        acquisition_cost, condition, location?.trim(), is_bookable,
        status, custom_fields ? JSON.stringify(custom_fields) : null,
        photo_url, req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Asset not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listAssets, getAsset, getAssetHistory, createAsset, updateAsset };
