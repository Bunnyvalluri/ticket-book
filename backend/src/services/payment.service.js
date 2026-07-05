import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';

const isDemoMode = !config.razorpay.keyId || !config.razorpay.keySecret;

let razorpay;
if (!isDemoMode) {
  razorpay = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
}

class PaymentService {
  // Create Razorpay order
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    if (isDemoMode) {
      // Return mock order for demo mode
      const mockOrderId = `order_demo_${Date.now()}`;
      logger.info(`[PAYMENT DEMO] Creating mock order: ${mockOrderId} for ₹${amount / 100}`);
      return {
        id: mockOrderId,
        amount,
        currency,
        receipt,
        status: 'created',
        isDemoMode: true,
      };
    }

    try {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Razorpay in paise
        currency,
        receipt,
        notes,
      });
      return order;
    } catch (error) {
      logger.error('Razorpay order creation failed:', error);
      throw new ApiError(500, 'Payment gateway error. Please try again.');
    }
  }

  // Verify payment signature
  verifySignature({ orderId, paymentId, signature }) {
    if (isDemoMode) {
      // Accept demo payments
      if (paymentId?.startsWith('pay_demo_')) return true;
      return false;
    }

    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  // Process refund
  async processRefund({ paymentId, amount, notes = {} }) {
    if (isDemoMode) {
      logger.info(`[PAYMENT DEMO] Mock refund for payment ${paymentId}: ₹${amount}`);
      return { id: `refund_demo_${Date.now()}`, status: 'processed' };
    }

    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: Math.round(amount * 100),
        notes,
      });
      return refund;
    } catch (error) {
      logger.error('Razorpay refund failed:', error);
      throw new ApiError(500, 'Refund processing failed. Please contact support.');
    }
  }

  // Fetch payment details
  async fetchPayment(paymentId) {
    if (isDemoMode) return null;
    try {
      return await razorpay.payments.fetch(paymentId);
    } catch (error) {
      logger.error('Fetch payment failed:', error);
      return null;
    }
  }

  // Verify webhook
  verifyWebhook(body, signature) {
    if (!config.razorpay.webhookSecret) return true; // Skip in dev

    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    return expectedSignature === signature;
  }

  get keyId() {
    return config.razorpay.keyId;
  }

  get isDemo() {
    return isDemoMode;
  }
}

export const paymentService = new PaymentService();
