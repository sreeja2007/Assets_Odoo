const router = require('express').Router();
const { body } = require('express-validator');
const { listCycles, getCycle, createCycle, updateItem, closeCycle } = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', listCycles);
router.get('/:id', getCycle);

router.post('/',
  authorize('Admin', 'Asset Manager'),
  body('name').trim().notEmpty().withMessage('Cycle name is required'),
  body('start_date').isDate().withMessage('Valid start_date required'),
  body('end_date').isDate().withMessage('Valid end_date required'),
  validate,
  createCycle
);

// PATCH /audit/:cycle_id/items/:asset_id
router.patch('/:cycle_id/items/:asset_id',
  body('status').isIn(['Pending', 'Verified', 'Missing', 'Damaged']).withMessage('Invalid item status'),
  validate,
  updateItem
);

router.post('/:id/close',
  authorize('Admin', 'Asset Manager'),
  closeCycle
);

module.exports = router;
