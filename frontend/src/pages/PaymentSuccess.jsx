import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { bookingAPI } from '../services/api.js';
import { FiDownload, FiHome, FiFilm, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PaymentSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(state?.booking);
  const [downloading, setDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (!booking) navigate('/');
    setTimeout(() => setShowConfetti(false), 5000);
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await bookingAPI.downloadTicket(booking.id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${booking.bookingNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Ticket downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="min-h-screen flex items-center justify-center py-10 relative overflow-hidden">
      {showConfetti && <Confetti numberOfPieces={200} colors={['#7c3aed', '#ec4899', '#f59e0b', '#10b981']} />}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="max-w-md w-full mx-4"
      >
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 12 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 pulse-glow"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #10b981)' }}
        >
          <span className="text-4xl">🎉</span>
        </motion.div>

        <h1 className="text-3xl font-black text-center mb-2 gradient-text">Booking Confirmed!</h1>
        <p className="text-center text-sm mb-8" style={{ color: '#606080' }}>
          Your ticket has been sent to your email
        </p>

        {/* Ticket Card */}
        <div className="card overflow-hidden mb-6">
          {/* Header */}
          <div className="gradient-bg p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Movie</p>
                <h2 className="text-white font-bold text-lg">{booking.show?.movie?.title}</h2>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Booking ID</p>
                <p className="text-white font-mono font-bold text-sm">{booking.bookingNumber}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Date', value: new Date(booking.show?.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' }) },
                { label: 'Time', value: new Date(booking.show?.startTime).toLocaleTimeString('en-IN', { timeStyle: 'short' }) },
                { label: 'Theatre', value: booking.show?.screen?.theatre?.name },
                { label: 'Screen', value: `${booking.show?.screen?.name} • ${booking.show?.format || '2D'}` },
                { label: 'Seats', value: booking.seats?.map((s) => s.seat?.label).join(', ') },
                { label: 'Amount', value: `₹${booking.grandTotal?.toFixed(0)}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs mb-0.5" style={{ color: '#606080' }}>{label}</p>
                  <p className="font-semibold" style={{ color: '#f0f0f8' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* QR Code */}
            {booking.qrCodeUrl && (
              <div className="mt-4 flex flex-col items-center">
                <div className="ticket-divider w-full" />
                <img
                  src={booking.qrCodeUrl}
                  alt="QR Code"
                  className="w-32 h-32 mt-4 rounded-xl"
                  style={{ background: 'white', padding: '8px' }}
                />
                <p className="text-xs mt-2" style={{ color: '#606080' }}>Scan at theatre entrance</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2"
          >
            <FiDownload size={18} />
            {downloading ? 'Downloading...' : 'Download PDF Ticket'}
          </motion.button>

          <div className="grid grid-cols-2 gap-3">
            <Link to="/bookings" className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm">
              <FiFilm size={16} />
              My Bookings
            </Link>
            <Link to="/" className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm">
              <FiHome size={16} />
              Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
