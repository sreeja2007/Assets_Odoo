const router = require('express').Router();
const { body } = require('express-validator');
const { listCategories, getCategory, createCategory, updateCategory } = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', listCategories);
router.get('/:id', getCategory);

router.post('/',
  authorize('Admin'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  validate,
  createCategory
);

router.patch('/:id',
  authorize('Admin'),
  validate,
  updateCategory
);

module.exports = router;
