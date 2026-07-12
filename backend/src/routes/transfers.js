const router = require('express').Router();
const { body } = require('express-validator');
const { listTransfers, requestTransfer, resolveTransfer } = require('../controllers/transferController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', listTransfers);

router.post('/',
  body('asset_id').isUUID().withMessage('Valid asset_id required'),
  validate,
  requestTransfer
);

router.patch('/:id/resolve',
  authorize('Admin', 'Asset Manager', 'Department Head'),
  body('approved').isBoolean().withMessage('approved must be a boolean'),
  validate,
  resolveTransfer
);

module.exports = router;
