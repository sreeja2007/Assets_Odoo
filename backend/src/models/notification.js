const { query } = require('../config/db');

/**
 * Create a notification for a user.
 */
async function createNotification({ userId, type, message }) {
  await query(
    `INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)`,
    [userId, type, message]
  );
}

module.exports = { createNotification };
