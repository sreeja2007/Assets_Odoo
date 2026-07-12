const router = require('express').Router();
const { body } = require('express-validator');
const { listDepartments, getDepartment, createDepartment, updateDepartment } = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', listDepartments);
router.get('/:id', getDepartment);

router.post('/',
  authorize('Admin'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  validate,
  createDepartment
);

router.patch('/:id',
  authorize('Admin'),
  validate,
  updateDepartment
);

module.exports = router;
