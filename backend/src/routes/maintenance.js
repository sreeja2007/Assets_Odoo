const router = require('express').Router();
const { body } = require('express-validator');
const { listMaintenance, getMaintenance, createMaintenance, updateStatus } = require('../controllers/maintenanceController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', listMaintenance);
router.get('/:id', getMaintenance);

router.post('/',
  body('asset_id').isUUID().withMessage('Valid asset_id required'),
  body('issue').trim().notEmpty().withMessage('Issue description is required'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']),
  validate,
  createMaintenance
);

router.patch('/:id/status',
  authorize('Admin', 'Asset Manager'),
  body('status').isIn([
    'Pending', 'Approved', 'Rejected',
    'Technician Assigned', 'In Progress', 'Resolved',
  ]).withMessage('Invalid status value'),
  validate,
  updateStatus
);

module.exports = router;
