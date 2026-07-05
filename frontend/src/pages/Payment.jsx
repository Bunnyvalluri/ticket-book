import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { bookingAPI } from '../services/api.js';
import { useBookingStore } from '../store/index.js';
import toast from 'react-hot-toast';
import { FiLoader, FiAlertCircle } from 'react-icons/fi';

// Load Razorpay script
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, order, razorpayKeyId, isDemoMode } = location.state || {};
  const { clearBooking } = useBookingStore();
  const [loading, setLoading] = useState(false);
  const [demoProcessing, setDemoProcessing] = useState(false);

  useEffect(() => {
    if (!booking || !order) {
      navigate('/');
      return;
    }
    initPayment();
  }, []);

  const initPayment = async () => {
    setLoading(true);

    if (isDemoMode || !razorpayKeyId) {
      setLoading(false);
      return; // Show demo button
    }

    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error('Payment gateway failed to load');
      setLoading(false);
      return;
    }

    const options = {
      key: razorpayKeyId,
      amount: order.amount * 100,
      currency: order.currency || 'INR',
      name: 'CineMax',
      description: `Booking ${booking.bookingNumber}`,
      image: '/favicon.ico',
      order_id: order.id,
      handler: async (response) => {
        await confirmPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
      },
      prefill: {
        name: `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`,
        email: booking.user?.email || '',
      },
      theme: {
        color: '#7c3aed',
        backdrop_color: '#0a0a12',
      },
      modal: {
        ondismiss: () => {
          navigate('/booking/failed', { state: { booking } });
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setLoading(false);
  };

  const confirmPayment = async (orderId, paymentId, signature) => {
    try {
      const res = await bookingAPI.confirmPayment({
        bookingId: booking.id,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      });

      clearBooking();
      navigate('/booking/success', { state: { booking: res.data.data.booking } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment confirmation failed');
      navigate('/booking/failed', { state: { booking } });
    }
  };

  const handleDemoPayment = async () => {
    setDemoProcessing(true);
    try {
      // Simulate demo payment
      const fakePaymentId = `pay_demo_${Date.now()}`;
      const fakeSignature = `sig_demo_${Date.now()}`;

      await confirmPayment(order.id, fakePaymentId, fakeSignature);
    } catch {
      toast.error('Demo payment failed');
    } finally {
      setDemoProcessing(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full mx-4"
      >
        <div className="card p-8 text-center">
          {loading ? (
            <>
              <div className="text-5xl mb-4">💳</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0f8' }}>Opening Payment Gateway</h2>
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mt-6" />
            </>
          ) : (isDemoMode || !razorpayKeyId) ? (
            <>
              <div className="text-5xl mb-4">🎭</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0f8' }}>Demo Payment Mode</h2>
              <p className="text-sm mb-6" style={{ color: '#606080' }}>
                Razorpay credentials not configured. This is a demo payment.
              </p>

              <div className="mb-6 p-4 rounded-xl text-left" style={{ background: '#1e1e35', border: '1px solid #2d2d4a' }}>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: '#a0a0c0' }}>Booking ID</span>
                  <span style={{ color: '#f0f0f8' }}>{booking.bookingNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#a0a0c0' }}>Amount</span>
                  <span className="font-bold text-lg gradient-text">₹{order.amount?.toFixed(0)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl mb-6"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <FiAlertCircle className="text-yellow-400" size={16} />
                <p className="text-xs" style={{ color: '#fbbf24' }}>
                  This simulates a real payment. In production, Razorpay handles actual transactions.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDemoPayment}
                disabled={demoProcessing}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
              >
                {demoProcessing ? <FiLoader className="animate-spin" size={18} /> : '✅'}
                {demoProcessing ? 'Processing...' : 'Simulate Successful Payment'}
              </motion.button>

              <button
                onClick={() => navigate('/booking/failed', { state: { booking } })}
                className="w-full mt-3 text-sm"
                style={{ color: '#ef4444' }}
              >
                Simulate Payment Failure
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">🔄</div>
              <h2 className="text-xl font-bold" style={{ color: '#f0f0f8' }}>Payment Window Opened</h2>
              <p className="text-sm mt-2" style={{ color: '#606080' }}>Complete your payment in the Razorpay window</p>
              <button onClick={initPayment} className="btn-primary mt-6 px-6 py-3">
                Reopen Payment
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
