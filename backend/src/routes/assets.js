const router = require('express').Router();
const { body } = require('express-validator');
const { listAssets, getAsset, getAssetHistory, createAsset, updateAsset } = require('../controllers/assetController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', listAssets);
router.get('/:id', getAsset);
router.get('/:id/history', getAssetHistory);

router.post('/',
  authorize('Admin', 'Asset Manager'),
  body('name').trim().notEmpty().withMessage('Asset name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  validate,
  createAsset
);

router.patch('/:id',
  authorize('Admin', 'Asset Manager'),
  validate,
  updateAsset
);

module.exports = router;
