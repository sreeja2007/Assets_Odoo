const { query } = require('../config/db');

// GET /notifications  — current user's notifications
async function listNotifications(req, res, next) {
  try {
    const { is_read, type } = req.query;
    const conditions = ['n.user_id = $1'];
    const params = [req.user.id];

    if (is_read !== undefined) {
      params.push(is_read === 'true');
      conditions.push(`n.is_read = $${params.length}`);
    }
    if (type) {
      params.push(type);
      conditions.push(`n.type = $${params.length}`);
    }

    const { rows } = await query(
      `SELECT * FROM notifications n
       WHERE ${conditions.join(' AND ')}
       ORDER BY n.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /notifications/:id/read
async function markRead(req, res, next) {
  try {
    const { rows } = await query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Notification not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /notifications/read-all
async function markAllRead(req, res, next) {
  try {
    const { rowCount } = await query(
      `UPDATE notifications SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    res.json({ updated: rowCount });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markRead, markAllRead };
