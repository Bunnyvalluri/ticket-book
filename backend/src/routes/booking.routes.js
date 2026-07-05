import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as bookingCtrl from '../controllers/booking.controller.js';
import { getAllBookings } from '../controllers/admin.controller.js';

const router = express.Router();

// Webhook (raw body, no auth)
router.post('/webhook', express.raw({ type: 'application/json' }), bookingCtrl.paymentWebhook);

// Authenticated user routes
router.post('/',
  authenticate,
  validate([
    body('showId').notEmpty().withMessage('Show ID required'),
    body('seatIds').isArray({ min: 1, max: 10 }).withMessage('1-10 seats required'),
  ]),
  bookingCtrl.createBooking
);

router.post('/confirm-payment', authenticate, bookingCtrl.confirmPayment);
router.post('/validate-coupon', authenticate, bookingCtrl.validateCoupon);

router.get('/my', authenticate, bookingCtrl.getUserBookings);
router.get('/:id', authenticate, bookingCtrl.getBookingById);
router.post('/:id/cancel', authenticate, bookingCtrl.cancelBooking);
router.get('/:id/ticket', authenticate, bookingCtrl.downloadTicket);

// Admin routes
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getAllBookings);

export default router;
