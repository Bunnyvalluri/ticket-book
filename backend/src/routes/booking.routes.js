import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as bookingCtrl from '../controllers/booking.controller.js';
import { getAllBookings } from '../controllers/admin.controller.js';

const router = express.Router();

// ── UPI Webhook (raw body, no auth) ──────────────────────────────────────────
router.post(
  '/webhook',
  express.raw({ type: ['application/json', 'text/plain', '*/*'] }),
  bookingCtrl.upiWebhook
);

// ── Authenticated user routes ─────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  validate([
    body('showId').notEmpty().withMessage('Show ID required'),
    body('seatIds').isArray({ min: 1, max: 10 }).withMessage('1-10 seats required'),
  ]),
  bookingCtrl.createBooking
);

// Confirm UPI payment (demo button + production verification)
router.post('/confirm-payment', authenticate, bookingCtrl.confirmPayment);

// Validate coupon code
router.post('/validate-coupon', authenticate, bookingCtrl.validateCoupon);

// Get user's bookings
router.get('/my', authenticate, bookingCtrl.getUserBookings);

// Get single booking details
router.get('/:id', authenticate, bookingCtrl.getBookingById);

// Get live payment status for polling
router.get('/:id/payment-status', authenticate, bookingCtrl.getPaymentStatus);

// Cancel booking
router.post('/:id/cancel', authenticate, bookingCtrl.cancelBooking);

// Download PDF ticket
router.get('/:id/ticket', authenticate, bookingCtrl.downloadTicket);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getAllBookings);

export default router;
