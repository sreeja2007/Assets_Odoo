const router = require('express').Router();
const { body } = require('express-validator');
const { listUsers, getUser, updateRole, updateStatus } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', listUsers);
router.get('/:id', getUser);

router.patch('/:id/role',
  authorize('Admin'),
  body('role').isIn(['Employee', 'Department Head', 'Asset Manager']),
  validate,
  updateRole
);

router.patch('/:id/status',
  authorize('Admin'),
  body('status').isIn(['Active', 'Inactive']),
  validate,
  updateStatus
);

module.exports = router;
