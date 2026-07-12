const router = require('express').Router();
const { body } = require('express-validator');
const { listAllocations, allocate, returnAsset } = require('../controllers/allocationController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', listAllocations);

router.post('/',
  authorize('Admin', 'Asset Manager'),
  body('asset_id').isUUID().withMessage('Valid asset_id required'),
  validate,
  allocate
);

router.post('/:id/return',
  authorize('Admin', 'Asset Manager', 'Department Head'),
  returnAsset
);

module.exports = router;
