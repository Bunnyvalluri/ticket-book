/**
 * Booking Controller — UPI-Only Payment Flow
 * All card / net banking removed. UPI QR deep-link based checkout only.
 */
import prisma from '../config/database.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { paymentService } from '../services/payment.service.js';
import { emailService } from '../services/email.service.js';
import { ticketService } from '../services/ticket.service.js';
import { getIO } from '../socket/index.js';
import { createNotification } from '../services/notification.service.js';
import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────────────
// Create booking + initiate UPI payment
// ─────────────────────────────────────────────────────────────────────────────
export const createBooking = async (req, res, next) => {
  try {
    const { showId, seatIds, couponCode } = req.body;
    const userId    = req.user.id;
    const sessionId = uuidv4();

    if (!seatIds?.length)    throw new ApiError(400, 'At least one seat required');
    if (seatIds.length > 10) throw new ApiError(400, 'Maximum 10 seats per booking');

    // Validate show
    const show = await prisma.show.findUnique({
      where: { id: showId, isActive: true },
      include: { screen: { include: { theatre: true } }, movie: true, language: true },
    });
    if (!show) throw new ApiError(404, 'Show not found or unavailable');
    if (show.startTime < new Date()) throw new ApiError(400, 'Show already started');

    // Check seat availability
    const bookedOrLocked = await prisma.$transaction(async (tx) => {
      const booked = await tx.bookingSeat.count({
        where: {
          seatId: { in: seatIds },
          booking: { showId, status: { in: ['CONFIRMED', 'PENDING', 'PAYMENT_PENDING'] } },
        },
      });
      const locked = await tx.seatLock.count({
        where: {
          seatId: { in: seatIds },
          showId,
          isReleased: false,
          expiresAt: { gt: new Date() },
          userId: { not: userId },
        },
      });
      return booked + locked;
    });

    if (bookedOrLocked > 0) throw new ApiError(409, 'One or more seats are no longer available');

    // Seat pricing
    const seatPricings = await prisma.seatPricing.findMany({
      where: { showId, seatId: { in: seatIds } },
      include: { seat: true },
    });
    const seats = await prisma.seat.findMany({ where: { id: { in: seatIds } } });

    const getPrice = (seatId) => {
      const pricing = seatPricings.find((sp) => sp.seatId === seatId);
      if (pricing) return { price: pricing.price, convenienceFee: pricing.convenienceFee };
      const seat = seats.find((s) => s.id === seatId);
      const defaults = { SILVER: 150, GOLD: 200, PREMIUM: 280, PLATINUM: 350, VIP: 450, RECLINER: 500, COUPLE: 600, WHEELCHAIR: 150 };
      return { price: defaults[seat?.seatType] || 200, convenienceFee: 20 };
    };

    let totalAmount = 0, totalConvenience = 0;
    const seatBookings = seatIds.map((seatId) => {
      const { price, convenienceFee } = getPrice(seatId);
      const seat = seats.find((s) => s.id === seatId);
      totalAmount     += price;
      totalConvenience += convenienceFee;
      return { seatId, price, seatType: seat?.seatType || 'SILVER' };
    });

    // Apply coupon
    let discountAmount = 0, appliedCoupon = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code:      couponCode.toUpperCase(),
          status:    'ACTIVE',
          isActive:  true,
          startDate: { lte: new Date() },
          endDate:   { gte: new Date() },
        },
      });
      if (!coupon) throw new ApiError(400, 'Invalid or expired coupon');
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached');
      if (totalAmount < coupon.minOrderAmount) throw new ApiError(400, `Minimum order amount ₹${coupon.minOrderAmount}`);

      const userUsed = await prisma.booking.count({
        where: { userId, couponCode: couponCode.toUpperCase(), status: { not: 'CANCELLED' } },
      });
      if (userUsed >= coupon.userUsageLimit) throw new ApiError(400, 'Coupon already used by this account');

      if (coupon.type === 'PERCENTAGE') {
        discountAmount = (totalAmount * coupon.value) / 100;
        if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      } else if (coupon.type === 'FLAT') {
        discountAmount = Math.min(coupon.value, totalAmount);
      }
      appliedCoupon = coupon;
    }

    const gstAmount  = (totalAmount - discountAmount) * 0.18;
    const grandTotal = totalAmount - discountAmount + totalConvenience + gstAmount;

    // Generate booking number
    const date          = new Date();
    const bookingNumber = `CMAX-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // ── Initiate UPI payment details ─────────────────────────────────────────
    const upiPayment = await paymentService.initiateUpiPayment({
      amount:        grandTotal,
      bookingNumber,
      userId,
    });

    // ── Create booking + seat locks + payment record in a transaction ─────────
    const booking = await prisma.$transaction(async (tx) => {
      // Lock seats
      await tx.seatLock.createMany({
        data: seatIds.map((seatId) => ({
          showId,
          seatId,
          userId,
          sessionId,
          expiresAt: upiPayment.expiresAt, // Lock until payment window expires
        })),
        skipDuplicates: true,
      });

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          userId,
          showId,
          status:          'PAYMENT_PENDING',
          totalAmount,
          discountAmount,
          convenienceFee:  totalConvenience,
          gstAmount,
          grandTotal,
          couponId:        appliedCoupon?.id || null,
          couponCode:      couponCode?.toUpperCase() || null,
          sessionId,
          seats: { create: seatBookings },
        },
        include: {
          seats: { include: { seat: true } },
          show:  { include: { movie: true, screen: { include: { theatre: true } }, language: true } },
          user:  { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      // Create payment record with UPI details
      await tx.payment.create({
        data: {
          bookingId:     newBooking.id,
          amount:        grandTotal,
          currency:      'INR',
          method:        'UPI',
          status:        'PENDING',
          upiStatus:     'WAITING',
          provider:      upiPayment.provider,
          transactionId: upiPayment.transactionId,
          merchantUpiId: upiPayment.merchantUpiId,
          upiUri:        upiPayment.upiUri,
          expiresAt:     upiPayment.expiresAt,
          ...(upiPayment.razorpayOrderId && { razorpayOrderId: upiPayment.razorpayOrderId }),
        },
      });

      return newBooking;
    });

    // ── Socket notifications ──────────────────────────────────────────────────
    const io = getIO();
    if (io) {
      // Lock seats on all connected seat maps
      seatIds.forEach((seatId) => {
        io.to(`show:${showId}`).emit('seat:locked', {
          seatId,
          showId,
          userId,
          sessionId,
          expiresAt: upiPayment.expiresAt,
        });
      });
      // Notify user — payment initiated
      io.to(`user:${userId}`).emit('payment:initiated', {
        bookingId:     booking.id,
        bookingNumber: booking.bookingNumber,
        transactionId: upiPayment.transactionId,
        expiresAt:     upiPayment.expiresAt,
        isDemoMode:    upiPayment.isDemoMode,
      });
    }

    sendResponse(res, 201, {
      booking,
      payment: {
        transactionId: upiPayment.transactionId,
        upiUri:        upiPayment.upiUri,
        merchantUpiId: upiPayment.merchantUpiId,
        merchantName:  upiPayment.merchantName,
        amount:        grandTotal,
        currency:      'INR',
        expiresAt:     upiPayment.expiresAt,
        isDemoMode:    upiPayment.isDemoMode,
        provider:      upiPayment.provider,
      },
      sessionId,
    }, 'Booking initiated. Scan QR to complete payment.');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Confirm UPI payment (demo + production webhook result)
// ─────────────────────────────────────────────────────────────────────────────
export const confirmPayment = async (req, res, next) => {
  try {
    const { bookingId, transactionId, upiRefId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId: req.user.id },
      include: {
        payment: true,
        seats:   { include: { seat: true } },
        show:    { include: { movie: true, screen: { include: { theatre: true } }, language: true } },
        user:    true,
      },
    });

    if (!booking)                            throw new ApiError(404, 'Booking not found');
    if (booking.status === 'CONFIRMED')      throw new ApiError(400, 'Booking already confirmed');
    if (booking.status === 'EXPIRED')        throw new ApiError(400, 'Payment window expired. Please re-book.');
    if (booking.status === 'CANCELLED')      throw new ApiError(400, 'Booking was cancelled');
    if (!booking.payment)                    throw new ApiError(400, 'Payment record not found');

    const payment = booking.payment;

    // Prevent replay attacks — ensure transactionId matches
    if (transactionId && payment.transactionId !== transactionId) {
      logger.warn(`[Payment] TransactionId mismatch: expected ${payment.transactionId}, got ${transactionId}`);
      throw new ApiError(400, 'Invalid transaction reference');
    }

    // Check payment window
    if (payment.expiresAt && new Date() > new Date(payment.expiresAt)) {
      throw new ApiError(400, 'Payment window expired. Please re-book.');
    }

    // In production: verify via Razorpay API
    if (payment.provider !== 'DEMO' && !paymentService.isDemo) {
      const verified = await paymentService.verifyUpiPayment({
        transactionId: payment.transactionId,
        razorpayQrId:  payment.metadata?.razorpayQrId,
      });
      if (!verified) {
        throw new ApiError(402, 'Payment not yet received. Please complete the UPI payment.');
      }
    }

    // ── Confirm booking in transaction ────────────────────────────────────────
    const [updatedBooking] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data:  { status: 'CONFIRMED' },
      }),
      prisma.payment.update({
        where: { bookingId },
        data: {
          status:     'COMPLETED',
          upiStatus:  'COMPLETED',
          paidAt:     new Date(),
          method:     'UPI',
          ...(upiRefId && { merchantTransactionId: upiRefId }),
        },
      }),
      prisma.seatLock.updateMany({
        where: { showId: booking.showId, userId: req.user.id },
        data:  { isReleased: true },
      }),
      ...(booking.couponId
        ? [prisma.coupon.update({ where: { id: booking.couponId }, data: { usedCount: { increment: 1 } } })]
        : []),
    ]);

    // ── Generate QR ticket ────────────────────────────────────────────────────
    const qrDataUrl = await ticketService.generateQRCode({
      bookingId:     booking.id,
      bookingNumber: booking.bookingNumber,
      userId:        req.user.id,
      showId:        booking.showId,
      seats:         booking.seats.map((s) => s.seat.label),
    });

    const pdfBuffer = await ticketService.generatePDFTicket({
      ...booking,
      payment: { razorpayPaymentId: upiRefId || payment.transactionId },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data:  { qrCodeUrl: qrDataUrl },
    });

    // ── Send confirmation email ───────────────────────────────────────────────
    emailService.sendBookingConfirmation(
      booking.user.email,
      booking.user.firstName,
      { ...booking, qrCodeUrl: qrDataUrl },
      pdfBuffer
    ).catch(() => {});

    // ── Emit socket events ────────────────────────────────────────────────────
    const io = getIO();
    if (io) {
      booking.seats.forEach(({ seat }) => {
        io.to(`show:${booking.showId}`).emit('seat:booked', {
          seatId: seat.id,
          showId: booking.showId,
        });
      });
      io.to(`user:${req.user.id}`).emit('payment:success', {
        bookingId:     booking.id,
        bookingNumber: booking.bookingNumber,
        transactionId: payment.transactionId,
        message:       'Payment successful! Your tickets are confirmed.',
      });
      io.to(`user:${req.user.id}`).emit('booking:confirmed', {
        bookingId:     booking.id,
        bookingNumber: booking.bookingNumber,
      });
      io.to('admin:dashboard').emit('admin:dashboard_update', {
        type:    'BOOKING_CONFIRMED',
        booking: { id: booking.id, grandTotal: booking.grandTotal },
      });
      io.emit('show:update', { showId: booking.showId });
    }

    // ── Create notification ───────────────────────────────────────────────────
    await createNotification({
      userId: req.user.id,
      type:   'BOOKING_CONFIRMED',
      title:  'Booking Confirmed! 🎫',
      message: `Your booking ${booking.bookingNumber} for ${booking.show.movie.title} is confirmed.`,
      data:   { bookingId: booking.id },
    }).catch((err) => logger.error('Notification failed:', err));

    sendResponse(res, 200, {
      booking: { ...updatedBooking, qrCodeUrl: qrDataUrl },
      pdfUrl:  `/api/bookings/${bookingId}/ticket`,
    }, 'Payment confirmed. Booking successful!');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get payment status (polling endpoint)
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentStatus = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        id:     req.params.id,
        userId: req.user.id,
      },
      select: {
        id:            true,
        bookingNumber: true,
        status:        true,
        payment: {
          select: {
            status:        true,
            upiStatus:     true,
            transactionId: true,
            expiresAt:     true,
            paidAt:        true,
            provider:      true,
          },
        },
      },
    });

    if (!booking) throw new ApiError(404, 'Booking not found');
    sendResponse(res, 200, { booking });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPI Webhook (Razorpay UPI QR payment captured)
// ─────────────────────────────────────────────────────────────────────────────
export const upiWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody   = req.body; // raw buffer

    const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.warn('[Webhook] Invalid UPI webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const body  = JSON.parse(rawBody.toString());
    const event = body.event;
    logger.info(`[Webhook] Received: ${event}`);

    if (event === 'qr_code.credited' || event === 'payment.captured') {
      const entity    = body.payload?.payment?.entity || body.payload?.qr_code?.entity;
      const notes     = entity?.notes || {};
      const transactionId = notes.transactionId;

      if (!transactionId) {
        logger.warn('[Webhook] No transactionId in notes, skipping');
        return res.json({ received: true });
      }

      const payment = await prisma.payment.findFirst({
        where: { transactionId },
        include: {
          booking: {
            include: {
              seats: { include: { seat: true } },
              user:  true,
              show:  { include: { movie: true } },
            },
          },
        },
      });

      if (!payment || payment.status === 'COMPLETED') {
        return res.json({ received: true }); // Already processed or not found
      }

      const booking = payment.booking;

      // Confirm payment & booking
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status:               'COMPLETED',
            upiStatus:            'COMPLETED',
            paidAt:               new Date(),
            merchantTransactionId: entity?.id,
          },
        }),
        prisma.booking.update({
          where: { id: booking.id },
          data:  { status: 'CONFIRMED' },
        }),
        prisma.seatLock.updateMany({
          where: { showId: booking.showId, userId: booking.userId, isReleased: false },
          data:  { isReleased: true },
        }),
      ]);

      // Generate ticket + send email
      const qrDataUrl = await ticketService.generateQRCode({
        bookingId:     booking.id,
        bookingNumber: booking.bookingNumber,
        userId:        booking.userId,
        showId:        booking.showId,
        seats:         booking.seats.map((s) => s.seat.label),
      }).catch(() => null);

      if (qrDataUrl) {
        await prisma.booking.update({ where: { id: booking.id }, data: { qrCodeUrl: qrDataUrl } });
      }

      emailService.sendBookingConfirmation(
        booking.user.email, booking.user.firstName,
        { ...booking, qrCodeUrl: qrDataUrl }, null
      ).catch(() => {});

      // Notify user via socket
      const io = getIO();
      if (io) {
        io.to(`user:${booking.userId}`).emit('payment:success', {
          bookingId:     booking.id,
          bookingNumber: booking.bookingNumber,
          transactionId: payment.transactionId,
          message:       'Payment received via UPI!',
        });
        booking.seats.forEach(({ seat }) => {
          io.to(`show:${booking.showId}`).emit('seat:booked', { seatId: seat.id, showId: booking.showId });
        });
        io.emit('show:update', { showId: booking.showId });
      }

      await createNotification({
        userId: booking.userId,
        type:   'BOOKING_CONFIRMED',
        title:  '🎫 Booking Confirmed!',
        message: `Your booking ${booking.bookingNumber} for ${booking.show?.movie?.title} is confirmed.`,
        data:   { bookingId: booking.id },
      }).catch(() => {});
    }

    if (event === 'payment.failed') {
      const entity    = body.payload?.payment?.entity;
      const notes     = entity?.notes || {};
      const transactionId = notes.transactionId;
      if (transactionId) {
        const payment = await prisma.payment.findFirst({ where: { transactionId } });
        if (payment && payment.status !== 'COMPLETED') {
          await prisma.payment.update({
            where: { id: payment.id },
            data:  { status: 'FAILED', upiStatus: 'FAILED', failureReason: entity?.error_description },
          });
          const io = getIO();
          if (io && payment.booking?.userId) {
            io.to(`user:${payment.booking.userId}`).emit('payment:failed', { transactionId });
          }
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('[Webhook] Processing error:', error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get user bookings
// ─────────────────────────────────────────────────────────────────────────────
export const getUserBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { userId: req.user.id, ...(status && { status }) };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take:    parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          seats: { include: { seat: true } },
          show: {
            include: {
              movie:  { select: { title: true, posterUrl: true, slug: true } },
              screen: { include: { theatre: { select: { name: true, city: true } } } },
              language: true,
            },
          },
          payment: { select: { status: true, upiStatus: true, method: true, paidAt: true, transactionId: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    sendResponse(res, 200, {
      bookings,
      pagination: { page: parseInt(page), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get single booking
// ─────────────────────────────────────────────────────────────────────────────
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.user.id },
          ...(req.user.role !== 'CUSTOMER' ? [{}] : []),
        ],
      },
      include: {
        seats:   { include: { seat: true } },
        show:    { include: { movie: true, screen: { include: { theatre: true } }, language: true } },
        payment: true,
        user:    { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });
    if (!booking) throw new ApiError(404, 'Booking not found');
    sendResponse(res, 200, { booking });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Cancel booking
// ─────────────────────────────────────────────────────────────────────────────
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        payment: true,
        show:    { include: { movie: true } },
        user:    true,
        seats:   { include: { seat: true } },
      },
    });

    if (!booking)                              throw new ApiError(404, 'Booking not found');
    if (booking.status === 'CANCELLED')        throw new ApiError(400, 'Booking already cancelled');
    if (booking.status === 'CONFIRMED') {
      const hoursUntilShow = (booking.show.startTime - new Date()) / (1000 * 60 * 60);
      if (hoursUntilShow < 2) throw new ApiError(400, 'Cannot cancel within 2 hours of show');
    }

    const { reason } = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason },
      });

      if (booking.payment?.status === 'COMPLETED' && booking.payment.transactionId) {
        const refund = await paymentService.processRefund({
          paymentId: booking.payment.razorpayPaymentId || booking.payment.transactionId,
          amount:    booking.grandTotal,
          notes:     { reason: reason || 'Customer requested cancellation' },
        });
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status:        'REFUNDED',
            refundId:      refund.id,
            refundAmount:  booking.grandTotal,
            refundStatus:  'PROCESSED',
            refundedAt:    new Date(),
          },
        });
      }
    });

    const io = getIO();
    if (io) {
      booking.seats.forEach(({ seat }) => {
        io.to(`show:${booking.showId}`).emit('seat:released', { seatId: seat.id, showId: booking.showId });
      });
      io.to('admin:dashboard').emit('admin:dashboard_update', { type: 'BOOKING_CANCELLED', bookingId: booking.id });
      io.emit('show:update', { showId: booking.showId });
    }

    emailService.sendCancellationEmail(booking.user.email, booking.user.firstName, booking).catch(() => {});

    await createNotification({
      userId:  req.user.id,
      type:    'BOOKING_CANCELLED',
      title:   'Booking Cancelled ❌',
      message: `Your booking for ${booking.show.movie.title} has been cancelled. Refund initiated.`,
      data:    { bookingId: booking.id },
    }).catch(() => {});

    sendResponse(res, 200, null, 'Booking cancelled. Refund will be processed in 3-5 business days.');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Download PDF ticket
// ─────────────────────────────────────────────────────────────────────────────
export const downloadTicket = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user.id, status: 'CONFIRMED' },
      include: {
        seats:   { include: { seat: true } },
        show:    { include: { movie: true, screen: { include: { theatre: true } }, language: true } },
        payment: true,
        user:    { select: { firstName: true, email: true } },
      },
    });
    if (!booking) throw new ApiError(404, 'Booking not found or not confirmed');
    const pdfBuffer = await ticketService.generatePDFTicket(booking);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.bookingNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Validate coupon
// ─────────────────────────────────────────────────────────────────────────────
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, totalAmount } = req.body;
    const coupon = await prisma.coupon.findFirst({
      where: {
        code:      code.toUpperCase(),
        status:    'ACTIVE',
        isActive:  true,
        startDate: { lte: new Date() },
        endDate:   { gte: new Date() },
      },
    });
    if (!coupon)                                           throw new ApiError(400, 'Invalid or expired coupon');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon limit reached');
    if (totalAmount < coupon.minOrderAmount)               throw new ApiError(400, `Minimum order ₹${coupon.minOrderAmount} required`);

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (totalAmount * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === 'FLAT') {
      discount = Math.min(coupon.value, totalAmount);
    }

    sendResponse(res, 200, {
      coupon:      { code: coupon.code, title: coupon.title, type: coupon.type, value: coupon.value },
      discount,
      finalAmount: totalAmount - discount,
    }, 'Coupon applied!');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy: Razorpay webhook (kept for any existing payments)
// ─────────────────────────────────────────────────────────────────────────────
export const paymentWebhook = upiWebhook;
