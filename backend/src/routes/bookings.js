const router = require('express').Router();
const { body } = require('express-validator');
const { listBookings, getBooking, createBooking, updateBooking } = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', listBookings);
router.get('/:id', getBooking);

router.post('/',
  body('asset_id').isUUID().withMessage('Valid asset_id required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('start_time').isISO8601().withMessage('Valid start_time required'),
  body('end_time').isISO8601().withMessage('Valid end_time required'),
  validate,
  createBooking
);

router.patch('/:id',
  body('status').optional().isIn(['Upcoming', 'Ongoing', 'Completed', 'Cancelled']),
  body('start_time').optional().isISO8601(),
  body('end_time').optional().isISO8601(),
  validate,
  updateBooking
);

module.exports = router;
