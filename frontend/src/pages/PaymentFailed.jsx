import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PaymentFailed() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const booking = state?.booking;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full mx-4 text-center"
      >
        <motion.div
          animate={{ shake: [0, -10, 10, -10, 10, 0] }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(239,68,68,0.2)', border: '2px solid #ef4444' }}
        >
          <span className="text-4xl">😞</span>
        </motion.div>

        <h1 className="text-3xl font-black mb-2" style={{ color: '#f0f0f8' }}>Payment Failed</h1>
        <p className="mb-8" style={{ color: '#606080' }}>
          We couldn't process your payment. No amount has been charged.
        </p>

        {booking && (
          <div className="card p-4 mb-6 text-left">
            <p className="text-sm" style={{ color: '#a0a0c0' }}>Booking Reference: <span style={{ color: '#f0f0f8', fontWeight: 600 }}>{booking.bookingNumber}</span></p>
          </div>
        )}

        <div className="space-y-3">
          <button onClick={() => navigate(-2)} className="btn-primary w-full py-4">
            🔄 Try Again
          </button>
          <Link to="/" className="btn-secondary w-full py-4 flex items-center justify-center">
            Return to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
