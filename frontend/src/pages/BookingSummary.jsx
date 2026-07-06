import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBookingStore } from '../store/index.js';
import { bookingAPI } from '../services/api.js';
import toast from 'react-hot-toast';
import { FiTag, FiX, FiCheck, FiLoader, FiFilm, FiMapPin, FiClock } from 'react-icons/fi';
import { MdEventSeat } from 'react-icons/md';

export default function BookingSummary() {
  const navigate = useNavigate();
  const { selectedSeats, currentShow, coupon, couponDiscount, setCoupon, clearCoupon } = useBookingStore();
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [proceeding, setProceeding] = useState(false);

  const show = currentShow;
  const ticketTotal = selectedSeats.reduce((s, seat) => s + (seat.price || 200), 0);
  const convFee = selectedSeats.length * 20;
  const gst = ((ticketTotal - couponDiscount) * 0.18);
  const grandTotal = ticketTotal - couponDiscount + convFee + gst;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidating(true);
    try {
      const res = await bookingAPI.validateCoupon({ code: couponCode, totalAmount: ticketTotal });
      const { coupon: c, discount } = res.data.data;
      setCoupon(c, discount);
      toast.success(`✅ Coupon "${c.code}" applied! Saved ₹${discount.toFixed(0)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setValidating(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedSeats.length || !show) return;
    setProceeding(true);

    try {
      const res = await bookingAPI.create({
        showId: show.id,
        seatIds: selectedSeats.map((s) => s.id),
        couponCode: coupon?.code,
      });

      const { booking, order, razorpayKeyId, isDemoMode } = res.data.data;
      navigate('/booking/payment', {
        state: { booking, order, razorpayKeyId, isDemoMode },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setProceeding(false);
    }
  };

  if (!selectedSeats.length || !show) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎫</div>
          <p style={{ color: '#606080' }}>No booking in progress</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4 px-6 py-3">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container-app max-w-5xl">
        <h1 className="text-3xl font-black mb-8" style={{ color: '#f0f0f8' }}>
          📋 Booking Summary
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Movie Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="card p-6 flex gap-6">
              <img
                src={show.movie?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200'}
                alt={show.movie?.title}
                className="w-20 h-28 object-cover rounded-xl flex-shrink-0"
              />
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: '#f0f0f8' }}>{show.movie?.title}</h2>
                <div className="space-y-2 text-sm" style={{ color: '#a0a0c0' }}>
                  <div className="flex items-center gap-2">
                    <FiMapPin size={14} className="text-purple-400" />
                    <span>{show.screen?.theatre?.name}, {show.screen?.theatre?.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiFilm size={14} className="text-purple-400" />
                    <span>{show.screen?.name} • {show.format} • {show.language?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock size={14} className="text-purple-400" />
                    <span>{new Date(show.startTime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Seats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#f0f0f8' }}>
                <MdEventSeat className="text-purple-400" size={18} />
                Selected Seats ({selectedSeats.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {selectedSeats.map((seat) => (
                  <div key={seat.id} className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl"
                    style={{ background: '#1e1e35', border: '1px solid #3d3d5c' }}>
                    <span className="font-bold text-lg" style={{ color: '#7c3aed' }}>{seat.label}</span>
                    <span className="text-xs" style={{ color: '#606080' }}>{seat.seatType}</span>
                    <span className="text-xs font-semibold" style={{ color: '#f0f0f8' }}>₹{seat.price || 200}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Coupon */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#f0f0f8' }}>
                <FiTag className="text-purple-400" size={18} />
                Coupon Code
              </h3>

              {coupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <div className="flex items-center gap-2">
                    <FiCheck className="text-green-400" size={16} />
                    <span className="font-bold text-sm" style={{ color: '#34d399' }}>{coupon.code}</span>
                    <span className="text-sm" style={{ color: '#a0a0c0' }}>-₹{couponDiscount.toFixed(0)} off</span>
                  </div>
                  <button onClick={clearCoupon} className="text-red-400 hover:text-red-300"><FiX size={16} /></button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code (e.g. CINEMAX20)"
                    className="input-field flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validating || !couponCode}
                    className="btn-primary px-6 py-3 text-sm flex items-center gap-2 rounded-lg"
                  >
                    {validating ? <FiLoader className="animate-spin" size={14} /> : null}
                    Apply
                  </button>
                </div>
              )}

              <div className="mt-3 flex gap-2 flex-wrap">
                {['CINEMAX20', 'FLAT100'].map((c) => (
                  <button key={c} onClick={() => { setCouponCode(c); }}
                    className="text-xs px-2 py-1 rounded-full transition-all"
                    style={{ background: '#1e1e35', border: '1px solid #3d3d5c', color: '#7c3aed' }}>
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Price breakdown */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="card p-6 sticky top-24">
              <h3 className="font-bold text-lg mb-6" style={{ color: '#f0f0f8' }}>Price Breakdown</h3>

              <div className="space-y-4">
                {[
                  { label: `Tickets (${selectedSeats.length}×)`, value: `₹${ticketTotal.toFixed(0)}` },
                  ...(couponDiscount > 0 ? [{ label: `Discount (${coupon?.code})`, value: `-₹${couponDiscount.toFixed(0)}`, green: true }] : []),
                  { label: 'Convenience Fee', value: `₹${convFee.toFixed(0)}` },
                  { label: 'GST (18%)', value: `₹${gst.toFixed(0)}` },
                ].map(({ label, value, green }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span style={{ color: '#a0a0c0' }}>{label}</span>
                    <span style={{ color: green ? '#10b981' : '#f0f0f8', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}

                <div className="border-t pt-4" style={{ borderColor: '#2d2d4a' }}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold" style={{ color: '#f0f0f8' }}>Total Amount</span>
                    <span className="text-2xl font-black gradient-text">₹{grandTotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProceedToPayment}
                disabled={proceeding}
                className="btn-primary w-full py-4 text-base mt-8 flex items-center justify-center gap-2"
              >
                {proceeding ? <FiLoader className="animate-spin" size={18} /> : '💳'}
                {proceeding ? 'Creating booking...' : 'Proceed to Payment'}
              </motion.button>

              <p className="text-xs text-center mt-4" style={{ color: '#606080' }}>
                🔒 Secured by Razorpay • 256-bit SSL
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
