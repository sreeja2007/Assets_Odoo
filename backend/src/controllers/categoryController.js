const { query } = require('../config/db');

// GET /categories
async function listCategories(req, res, next) {
  try {
    const { rows } = await query(
      'SELECT * FROM asset_categories ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /categories/:id
async function getCategory(req, res, next) {
  try {
    const { rows } = await query(
      'SELECT * FROM asset_categories WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /categories  (Admin only)
async function createCategory(req, res, next) {
  try {
    const { name, custom_fields = [] } = req.body;
    const { rows } = await query(
      `INSERT INTO asset_categories (name, custom_fields)
       VALUES ($1, $2) RETURNING *`,
      [name.trim(), JSON.stringify(custom_fields)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /categories/:id  (Admin only)
async function updateCategory(req, res, next) {
  try {
    const { name, custom_fields } = req.body;
    const { rows } = await query(
      `UPDATE asset_categories
       SET name          = COALESCE($1, name),
           custom_fields = COALESCE($2, custom_fields),
           updated_at    = NOW()
       WHERE id = $3 RETURNING *`,
      [name?.trim(), custom_fields ? JSON.stringify(custom_fields) : null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listCategories, getCategory, createCategory, updateCategory };
