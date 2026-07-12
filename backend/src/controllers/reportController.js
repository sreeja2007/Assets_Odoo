const { query } = require('../config/db');

// GET /reports/summary
async function summary(req, res, next) {
  try {
    const [assetStats, maintStats, bookingStats, overdueRes] = await Promise.all([
      query(`
        SELECT status, COUNT(*) AS count
        FROM assets GROUP BY status
      `),
      query(`
        SELECT status, COUNT(*) AS count
        FROM maintenance_requests GROUP BY status
      `),
      query(`
        SELECT status, COUNT(*) AS count
        FROM bookings GROUP BY status
      `),
      query(`
        SELECT COUNT(*) AS count FROM allocations
        WHERE return_date IS NULL AND expected_return_date < CURRENT_DATE
      `),
    ]);

    const assetMap = {};
    assetStats.rows.forEach(r => { assetMap[r.status] = parseInt(r.count, 10); });
    const maintMap = {};
    maintStats.rows.forEach(r => { maintMap[r.status] = parseInt(r.count, 10); });
    const bookingMap = {};
    bookingStats.rows.forEach(r => { bookingMap[r.status] = parseInt(r.count, 10); });

    res.json({
      assets: assetMap,
      maintenance: maintMap,
      bookings: bookingMap,
      overdue_allocations: parseInt(overdueRes.rows[0].count, 10),
    });
  } catch (err) {
    next(err);
  }
}

// GET /reports/utilization
async function utilization(req, res, next) {
  try {
    const [byDept, byCat, mostUsed, idle] = await Promise.all([
      // Allocated assets per department
      query(`
        SELECT d.name AS department, COUNT(*) AS count
        FROM assets a JOIN departments d ON d.id = a.department_id
        WHERE a.status = 'Allocated'
        GROUP BY d.name ORDER BY count DESC
      `),
      // Allocated assets per category
      query(`
        SELECT c.name AS category, COUNT(*) AS count
        FROM assets a JOIN asset_categories c ON c.id = a.category_id
        WHERE a.status = 'Allocated'
        GROUP BY c.name ORDER BY count DESC
      `),
      // Most allocated assets (by historical allocation count)
      query(`
        SELECT a.id, a.tag, a.name, COUNT(al.id) AS allocation_count
        FROM assets a JOIN allocations al ON al.asset_id = a.id
        GROUP BY a.id, a.tag, a.name
        ORDER BY allocation_count DESC LIMIT 10
      `),
      // Currently idle
      query(`
        SELECT id, tag, name, location, updated_at
        FROM assets WHERE status = 'Available'
        ORDER BY updated_at ASC LIMIT 10
      `),
    ]);

    res.json({
      by_department: byDept.rows,
      by_category:   byCat.rows,
      most_used:     mostUsed.rows,
      idle:          idle.rows,
    });
  } catch (err) {
    next(err);
  }
}

// GET /reports/maintenance-frequency
async function maintenanceFrequency(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT a.id, a.tag, a.name, c.name AS category, COUNT(m.id) AS request_count
      FROM assets a
      JOIN maintenance_requests m ON m.asset_id = a.id
      LEFT JOIN asset_categories c ON c.id = a.category_id
      GROUP BY a.id, a.tag, a.name, c.name
      ORDER BY request_count DESC LIMIT 20
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /reports/overdue
async function overdue(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT al.id, al.asset_id, a.tag, a.name AS asset_name,
             al.assigned_to, u.name AS assigned_to_name,
             al.expected_return_date,
             (CURRENT_DATE - al.expected_return_date) AS days_overdue
      FROM allocations al
      JOIN assets a ON a.id = al.asset_id
      LEFT JOIN users u ON u.id = al.assigned_to
      WHERE al.return_date IS NULL AND al.expected_return_date < CURRENT_DATE
      ORDER BY al.expected_return_date ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /reports/logs
async function activityLogs(req, res, next) {
  try {
    const { type, user_id, limit = 50, offset = 0 } = req.query;
    const conditions = [];
    const params = [];

    if (type)    { params.push(type);    conditions.push(`l.type = $${params.length}`); }
    if (user_id) { params.push(user_id); conditions.push(`l.user_id = $${params.length}`); }

    params.push(parseInt(limit, 10));
    params.push(parseInt(offset, 10));

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT l.id, l.type, l.user_id, u.name AS user_name,
              l.target_id, l.message, l.metadata, l.created_at
       FROM activity_logs l
       LEFT JOIN users u ON u.id = l.user_id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, utilization, maintenanceFrequency, overdue, activityLogs };
