const { query, getClient } = require('../config/db');
const { createLog } = require('../models/activityLog');

const BOOKING_SELECT = `
  SELECT b.id, b.asset_id, a.tag AS asset_tag, a.name AS asset_name,
         b.booked_by, u.name AS booked_by_name,
         b.title, b.start_time, b.end_time, b.status, b.notes,
         b.created_at, b.updated_at
  FROM bookings b
  JOIN assets a ON a.id = b.asset_id
  LEFT JOIN users u ON u.id = b.booked_by
`;

// GET /bookings
async function listBookings(req, res, next) {
  try {
    const { asset_id, status, user_id, from, to } = req.query;
    const conditions = [];
    const params = [];

    if (asset_id) { params.push(asset_id); conditions.push(`b.asset_id = $${params.length}`); }
    if (status)   { params.push(status);   conditions.push(`b.status = $${params.length}`); }
    if (user_id)  { params.push(user_id);  conditions.push(`b.booked_by = $${params.length}`); }
    if (from)     { params.push(from);     conditions.push(`b.start_time >= $${params.length}`); }
    if (to)       { params.push(to);       conditions.push(`b.end_time <= $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`${BOOKING_SELECT} ${where} ORDER BY b.start_time`, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /bookings/:id
async function getBooking(req, res, next) {
  try {
    const { rows } = await query(`${BOOKING_SELECT} WHERE b.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /bookings
async function createBooking(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { asset_id, title, start_time, end_time, notes } = req.body;

    const start = new Date(start_time);
    const end   = new Date(end_time);
    if (end <= start) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'end_time must be after start_time' });
    }

    // Verify asset is bookable
    const assetRes = await client.query(
      'SELECT id, name, tag, is_bookable FROM assets WHERE id = $1',
      [asset_id]
    );
    if (!assetRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Asset not found' });
    }
    if (!assetRes.rows[0].is_bookable) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This asset is not marked as bookable' });
    }

    // The DB EXCLUDE constraint handles overlap — attempt insert and let it fail naturally
    const { rows } = await client.query(
      `INSERT INTO bookings (asset_id, booked_by, title, start_time, end_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [asset_id, req.user.id, title.trim(), start_time, end_time, notes || null]
    );

    await client.query('COMMIT');

    const asset = assetRes.rows[0];
    await createLog({
      type: 'Booking', userId: req.user.id, targetId: rows[0].id,
      message: `Booked ${asset.name} for "${title}"`,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    // Let errorHandler translate the exclusion constraint violation (23P01)
    next(err);
  } finally {
    client.release();
  }
}

// PATCH /bookings/:id  (owner or Admin/Asset Manager)
async function updateBooking(req, res, next) {
  try {
    const { status, title, start_time, end_time, notes } = req.body;

    // Ownership check
    const existing = await query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Booking not found' });

    const booking = existing.rows[0];
    const isOwner  = booking.booked_by === req.user.id;
    const isAdmin  = ['Admin', 'Asset Manager'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only modify your own bookings' });
    }

    const { rows } = await query(
      `UPDATE bookings
       SET status     = COALESCE($1, status),
           title      = COALESCE($2, title),
           start_time = COALESCE($3, start_time),
           end_time   = COALESCE($4, end_time),
           notes      = COALESCE($5, notes),
           updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [status, title?.trim(), start_time, end_time, notes, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listBookings, getBooking, createBooking, updateBooking };
