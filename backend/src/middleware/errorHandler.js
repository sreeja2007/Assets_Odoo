/**
 * Global error handler — must be registered last in Express.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.method}] ${req.path} →`, err);
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with this value already exists', detail: err.detail });
  }

  // PostgreSQL exclusion violation (booking overlap)
  if (err.code === '23P01') {
    return res.status(409).json({ error: 'Booking overlaps with an existing booking' });
  }

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
