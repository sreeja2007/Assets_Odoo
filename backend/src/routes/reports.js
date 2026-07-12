const router = require('express').Router();
const { summary, utilization, maintenanceFrequency, overdue, activityLogs } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
// Reports visible to Admin and Asset Manager only
router.use(authorize('Admin', 'Asset Manager'));

router.get('/summary',               summary);
router.get('/utilization',           utilization);
router.get('/maintenance-frequency', maintenanceFrequency);
router.get('/overdue',               overdue);
router.get('/logs',                  activityLogs);

module.exports = router;
