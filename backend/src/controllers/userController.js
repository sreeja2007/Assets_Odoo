const { query } = require('../config/db');
const { createLog } = require('../models/activityLog');

// GET /users
async function listUsers(req, res, next) {
  try {
    const { role, department_id, status } = req.query;
    const conditions = [];
    const params = [];

    if (role)          { params.push(role);          conditions.push(`u.role = $${params.length}`); }
    if (department_id) { params.push(department_id); conditions.push(`u.department_id = $${params.length}`); }
    if (status)        { params.push(status);        conditions.push(`u.status = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, d.name AS department_name,
              u.status, u.avatar, u.created_at
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       ${where}
       ORDER BY u.name`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /users/:id
async function getUser(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, d.name AS department_name,
              u.status, u.avatar, u.created_at
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /users/:id/role  (Admin only)
async function updateRole(req, res, next) {
  try {
    const { role } = req.body;
    const validRoles = ['Employee', 'Department Head', 'Asset Manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    const { rows } = await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, name, email, role, department_id, status, avatar`,
      [role, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    await createLog({
      type: 'Admin',
      userId: req.user.id,
      targetId: req.params.id,
      message: `Promoted ${rows[0].name} to ${role}`,
    });

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /users/:id/status  (Admin only)
async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Active or Inactive' });
    }

    const { rows } = await query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, name, email, role, status`,
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, getUser, updateRole, updateStatus };
