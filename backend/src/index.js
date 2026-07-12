require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// ── Route modules ─────────────────────────────────────────────
const authRoutes          = require('./routes/auth');
const userRoutes          = require('./routes/users');
const departmentRoutes    = require('./routes/departments');
const categoryRoutes      = require('./routes/categories');
const assetRoutes         = require('./routes/assets');
const allocationRoutes    = require('./routes/allocations');
const transferRoutes      = require('./routes/transfers');
const maintenanceRoutes   = require('./routes/maintenance');
const bookingRoutes       = require('./routes/bookings');
const auditRoutes         = require('./routes/audit');
const reportRoutes        = require('./routes/reports');
const notificationRoutes  = require('./routes/notifications');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security & logging ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/users`,         userRoutes);
app.use(`${API}/departments`,   departmentRoutes);
app.use(`${API}/categories`,    categoryRoutes);
app.use(`${API}/assets`,        assetRoutes);
app.use(`${API}/allocations`,   allocationRoutes);
app.use(`${API}/transfers`,     transferRoutes);
app.use(`${API}/maintenance`,   maintenanceRoutes);
app.use(`${API}/bookings`,      bookingRoutes);
app.use(`${API}/audit`,         auditRoutes);
app.use(`${API}/reports`,       reportRoutes);
app.use(`${API}/notifications`, notificationRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AssetFlow API running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
