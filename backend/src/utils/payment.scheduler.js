/**
 * Payment Expiry Scheduler
 * Runs every 30 seconds. Expires pending UPI payments older than their expiresAt,
 * releases seat locks, and emits real-time socket events.
 */
import prisma from '../config/database.js';
import { getIO } from '../socket/index.js';
import logger from '../config/logger.js';

let schedulerInterval = null;

export async function runExpiryCheck() {
  try {
    const now = new Date();

    // Find all payments that have expired but are still PENDING
    const expiredPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now },
        upiStatus: { in: ['WAITING', 'QR_SCANNED', 'PROCESSING'] },
      },
      include: {
        booking: {
          include: {
            seats: { include: { seat: true } },
            user: { select: { id: true } },
          },
        },
      },
    });

    if (expiredPayments.length === 0) return;

    logger.info(`[Scheduler] Expiring ${expiredPayments.length} stale UPI payment(s)...`);

    const io = getIO();

    for (const payment of expiredPayments) {
      const { booking } = payment;
      if (!booking) continue;

      try {
        await prisma.$transaction([
          // Mark payment expired
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED', upiStatus: 'EXPIRED', failureReason: 'Payment window expired (5 minutes)' },
          }),
          // Mark booking expired
          prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'EXPIRED' },
          }),
          // Release seat locks
          prisma.seatLock.updateMany({
            where: { showId: booking.showId, userId: booking.userId, isReleased: false },
            data: { isReleased: true },
          }),
        ]);

        logger.info(`[Scheduler] Expired booking ${booking.bookingNumber} — seats released`);

        // Notify user via socket
        if (io) {
          // Emit payment expired
          io.to(`user:${booking.userId}`).emit('payment:expired', {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            message: 'Payment window expired. Please try booking again.',
          });

          // Release seats on seat map for other users
          booking.seats.forEach(({ seat }) => {
            io.to(`show:${booking.showId}`).emit('seat:released', {
              seatId: seat.id,
              showId: booking.showId,
            });
          });

          io.emit('show:update', { showId: booking.showId });
        }
      } catch (err) {
        logger.error(`[Scheduler] Failed to expire payment ${payment.id}:`, err.message);
      }
    }
  } catch (err) {
    logger.error('[Scheduler] Expiry check failed:', err.message);
  }
}

export function startPaymentScheduler() {
  if (schedulerInterval) return;
  schedulerInterval = setInterval(runExpiryCheck, 30 * 1000); // every 30s
  logger.info('[Scheduler] Payment expiry scheduler started (30s interval)');
  // Run immediately on start to catch any already-expired payments
  runExpiryCheck().catch(() => {});
}

export function stopPaymentScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('[Scheduler] Payment expiry scheduler stopped');
  }
}
