const { query } = require('../config/db');

/**
 * Append an entry to the activity log.
 * @param {object} opts
 * @param {string} opts.type       - log_type enum value
 * @param {string} opts.userId     - acting user's UUID
 * @param {string} opts.targetId   - referenced entity ID (any string)
 * @param {string} opts.message
 * @param {object} [opts.metadata]
 */
async function createLog({ type, userId, targetId, message, metadata = {} }) {
  await query(
    `INSERT INTO activity_logs (type, user_id, target_id, message, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [type, userId, targetId, message, JSON.stringify(metadata)]
  );
}

module.exports = { createLog };
