/**
 * UPI Payment Service
 * Supports: Demo mode (client-side QR), Razorpay UPI QR (production)
 * All card / net banking flows removed — UPI only.
 */
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';

// ─── Config ──────────────────────────────────────────────────────────────────
const MERCHANT_UPI_ID   = process.env.MERCHANT_UPI_ID   || 'cinemax@upi';
const MERCHANT_NAME     = process.env.MERCHANT_NAME     || 'CineMax Cinemas';
const UPI_PAYMENT_EXPIRY_MINUTES = 5;

// ─── Razorpay (optional, only for production UPI QR) ─────────────────────────
let razorpay = null;
const isRazorpayConfigured = !!(config.razorpay?.keyId && config.razorpay?.keySecret);
const isDemoMode = !isRazorpayConfigured;

if (isRazorpayConfigured) {
  try {
    const Razorpay = (await import('razorpay')).default;
    razorpay = new Razorpay({
      key_id:     config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
    logger.info('[PaymentService] Razorpay UPI QR mode active');
  } catch (err) {
    logger.warn('[PaymentService] Razorpay not available, falling back to demo mode:', err.message);
  }
} else {
  logger.info('[PaymentService] Demo mode — UPI QR generated client-side');
}

// ─── Service ─────────────────────────────────────────────────────────────────
class PaymentService {
  get isDemo() { return isDemoMode; }
  get merchantUpiId() { return MERCHANT_UPI_ID; }
  get merchantName() { return MERCHANT_NAME; }
  get expiryMinutes() { return UPI_PAYMENT_EXPIRY_MINUTES; }

  /**
   * Generate a unique transaction ID for UPI "tr" param
   */
  generateTransactionId(bookingNumber) {
    const suffix = uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
    return `CMAX${bookingNumber.replace(/[^A-Z0-9]/g, '')}${suffix}`;
  }

  /**
   * Build a standard UPI deep-link URI.
   * Format: upi://pay?pa=<vpa>&pn=<name>&tr=<txnRef>&tn=<note>&am=<amount>&cu=INR
   */
  buildUpiUri({ amount, transactionId, bookingNumber, note }) {
    const params = new URLSearchParams({
      pa:  MERCHANT_UPI_ID,
      pn:  MERCHANT_NAME,
      tr:  transactionId,
      tn:  note || `Movie ticket booking ${bookingNumber}`,
      am:  amount.toFixed(2),
      cu:  'INR',
      mc:  '7832',   // MCC for movie theatres
    });
    return `upi://pay?${params.toString()}`;
  }

  /**
   * Initiate UPI payment — creates order record data.
   * In demo mode: returns URI (frontend generates QR client-side).
   * In production: calls Razorpay UPI QR API for hosted QR URL.
   */
  async initiateUpiPayment({ amount, bookingNumber, userId }) {
    const transactionId = this.generateTransactionId(bookingNumber);
    const expiresAt     = new Date(Date.now() + UPI_PAYMENT_EXPIRY_MINUTES * 60 * 1000);
    const upiUri        = this.buildUpiUri({ amount, transactionId, bookingNumber });

    if (isDemoMode || !razorpay) {
      logger.info(`[PAYMENT DEMO] UPI initiated: ${transactionId} for ₹${amount}`);
      return {
        transactionId,
        upiUri,
        expiresAt,
        merchantUpiId: MERCHANT_UPI_ID,
        merchantName:  MERCHANT_NAME,
        provider:      'DEMO',
        qrCodeDataUrl: null, // Frontend generates QR from upiUri
        isDemoMode:    true,
      };
    }

    // Production: Razorpay UPI QR
    try {
      const qrPayload = {
        type:         'upi_qr',
        name:         `Booking ${bookingNumber}`,
        usage:        'single_use',
        fixed_amount:  true,
        payment_amount: Math.round(amount * 100), // paise
        description:  `CineMax ticket booking ${bookingNumber}`,
        close_by:     Math.floor(expiresAt.getTime() / 1000),
        notes: {
          transactionId,
          bookingNumber,
          userId: userId || '',
        },
      };
      const rzpQr = await razorpay.qrCode.create(qrPayload);
      logger.info(`[PaymentService] Razorpay UPI QR created: ${rzpQr.id}`);
      return {
        transactionId,
        upiUri,
        expiresAt,
        merchantUpiId:       MERCHANT_UPI_ID,
        merchantName:        MERCHANT_NAME,
        provider:            'RAZORPAY_UPI',
        razorpayQrId:        rzpQr.id,
        razorpayQrImageUrl:  rzpQr.image_url,
        qrCodeDataUrl:       rzpQr.image_url,
        isDemoMode:          false,
      };
    } catch (error) {
      logger.error('[PaymentService] Razorpay UPI QR creation failed:', error);
      // Fallback to demo mode QR
      return {
        transactionId,
        upiUri,
        expiresAt,
        merchantUpiId: MERCHANT_UPI_ID,
        merchantName:  MERCHANT_NAME,
        provider:      'DEMO',
        qrCodeDataUrl: null,
        isDemoMode:    true,
      };
    }
  }

  /**
   * Verify a UPI payment via Razorpay API.
   * Returns payment details if found, null if not yet paid.
   */
  async verifyUpiPayment({ transactionId, razorpayQrId }) {
    if (isDemoMode) {
      if (transactionId?.startsWith('DEMO')) return { status: 'captured', isDemoMode: true };
      return null;
    }
    try {
      if (razorpayQrId) {
        const payments = await razorpay.qrCode.fetchAllPayments(razorpayQrId);
        const captured = payments.items?.find(p => p.status === 'captured');
        return captured || null;
      }
      return null;
    } catch (error) {
      logger.error('[PaymentService] UPI payment verify failed:', error);
      return null;
    }
  }

  /**
   * Process refund for a UPI payment.
   */
  async processRefund({ paymentId, amount, notes = {} }) {
    if (isDemoMode) {
      logger.info(`[PAYMENT DEMO] Mock refund for ${paymentId}: ₹${amount}`);
      return { id: `refund_demo_${Date.now()}`, status: 'processed' };
    }
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: Math.round(amount * 100),
        notes,
      });
      return refund;
    } catch (error) {
      logger.error('[PaymentService] Refund failed:', error);
      throw new ApiError(500, 'Refund processing failed. Please contact support.');
    }
  }

  /**
   * Verify Razorpay UPI webhook signature.
   */
  verifyWebhookSignature(rawBody, signature) {
    const secret = config.razorpay?.webhookSecret;
    if (!secret) return true; // Skip in dev

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return expectedSig === signature;
  }

  /**
   * Legacy: verify standard Razorpay payment signature (demo compat)
   */
  verifySignature({ orderId, paymentId, signature }) {
    if (isDemoMode) return paymentId?.startsWith('pay_demo_');
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body)
      .digest('hex');
    return expected === signature;
  }
}

export const paymentService = new PaymentService();
