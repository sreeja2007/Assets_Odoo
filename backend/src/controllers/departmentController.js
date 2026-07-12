const { query } = require('../config/db');
const { createLog } = require('../models/activityLog');

// GET /departments
async function listDepartments(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT d.id, d.name, d.parent_id, p.name AS parent_name,
              d.head_id, u.name AS head_name, d.status, d.created_at
       FROM departments d
       LEFT JOIN departments p ON p.id = d.parent_id
       LEFT JOIN users u ON u.id = d.head_id
       ORDER BY d.name`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /departments/:id
async function getDepartment(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT d.id, d.name, d.parent_id, p.name AS parent_name,
              d.head_id, u.name AS head_name, d.status, d.created_at
       FROM departments d
       LEFT JOIN departments p ON p.id = d.parent_id
       LEFT JOIN users u ON u.id = d.head_id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Department not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /departments  (Admin only)
async function createDepartment(req, res, next) {
  try {
    const { name, parent_id, head_id, status = 'Active' } = req.body;
    const { rows } = await query(
      `INSERT INTO departments (name, parent_id, head_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), parent_id || null, head_id || null, status]
    );
    await createLog({
      type: 'Admin', userId: req.user.id, targetId: rows[0].id,
      message: `Created department: ${rows[0].name}`,
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /departments/:id  (Admin only)
async function updateDepartment(req, res, next) {
  try {
    const { name, parent_id, head_id, status } = req.body;
    const { rows } = await query(
      `UPDATE departments
       SET name      = COALESCE($1, name),
           parent_id = $2,
           head_id   = $3,
           status    = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name?.trim(), parent_id ?? null, head_id ?? null, status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Department not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listDepartments, getDepartment, createDepartment, updateDepartment };
