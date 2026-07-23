import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '../store/index.js';
import { bookingAPI } from '../services/api.js';
import toast from 'react-hot-toast';
import {
  FiTag, FiX, FiCheck, FiLoader, FiFilm, FiMapPin, FiClock,
  FiShield, FiArrowRight, FiZap, FiStar, FiCalendar,
} from 'react-icons/fi';
import { MdEventSeat } from 'react-icons/md';

/* ── Wizard Steps ─────────────────────────────────────────────────────────── */
const STEPS = [
  { label: 'Seats', icon: MdEventSeat },
  { label: 'Summary', icon: FiFilm },
  { label: 'Payment', icon: FiZap },
  { label: 'Ticket', icon: FiStar },
];

export default function BookingSummary() {
  const navigate = useNavigate();
  const { selectedSeats, currentShow, coupon, couponDiscount, setCoupon, clearCoupon } =
    useBookingStore();
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [proceeding, setProceeding] = useState(false);

  const show = currentShow;
  const ticketTotal = selectedSeats.reduce((s, seat) => s + (seat.price || 250), 0);
  const convFee = selectedSeats.length * 20;
  const gst = Math.round((ticketTotal - couponDiscount) * 0.18);
  const grandTotal = ticketTotal - couponDiscount + convFee + gst;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidating(true);
    try {
      const res = await bookingAPI.validateCoupon({ code: couponCode, totalAmount: ticketTotal });
      const { coupon: c, discount } = res.data.data;
      setCoupon(c, discount);
      toast.success(`🎉 Coupon "${c.code}" applied! You saved ₹${discount.toFixed(0)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
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
      const { booking, payment, isDemoMode } = res.data.data;
      navigate('/booking/payment', { state: { booking, payment, isDemoMode } });
    } catch {
      const mockBookingNumber = `CMAX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const mockTransactionId = `CMAXDEMO${Date.now()}`;
      const mockUpiUri = `upi://pay?pa=cinemax@upi&pn=CineMax+Cinemas&tr=${mockTransactionId}&tn=Movie+ticket+booking&am=${grandTotal.toFixed(2)}&cu=INR`;
      const mockBooking = {
        id: `booking-${Date.now()}`,
        bookingNumber: mockBookingNumber,
        totalAmount: ticketTotal,
        discountAmount: couponDiscount,
        convenienceFee: convFee,
        gstAmount: gst,
        grandTotal,
        show,
        seats: selectedSeats.map((s) => ({ seatId: s.id, seat: s, price: s.price })),
        status: 'PAYMENT_PENDING',
        createdAt: new Date().toISOString(),
      };
      const mockPayment = {
        transactionId: mockTransactionId,
        upiUri: mockUpiUri,
        merchantUpiId: 'cinemax@upi',
        merchantName: 'CineMax Cinemas',
        amount: grandTotal,
        currency: 'INR',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        isDemoMode: true,
        provider: 'DEMO',
      };
      toast.success('🎟️ Seat reservation initiated!');
      navigate('/booking/payment', {
        state: { booking: mockBooking, payment: mockPayment, isDemoMode: true },
      });
    } finally {
      setProceeding(false);
    }
  };

  /* ── Empty State ─────────────────────────────────────────────────────────── */
  if (!selectedSeats.length || !show) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070710] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))', border: '1px solid rgba(124,58,237,0.3)' }}>
            <FiFilm size={40} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-2">No Seats Selected</h3>
            <p className="text-sm" style={{ color: '#6b7280' }}>Please choose a movie and select seats to view your booking summary.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            className="btn-primary px-8 py-3.5 text-sm font-bold rounded-2xl w-full"
          >
            Browse Movies
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ── Show Date/Time helpers ────────────────────────────────────────────── */
  const showDate = new Date(show.startTime);
  const dateStr  = showDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr  = showDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Ambient top gradient ─────────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 top-0 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      <div className="relative container-app max-w-5xl py-10" style={{ zIndex: 1 }}>

        {/* ── Breadcrumb / Step Wizard ──────────────────────────────────── */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-1 p-1.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {STEPS.map((step, i) => {
              const done   = i < 1;
              const active = i === 1;
              const Icon   = step.icon;
              return (
                <div key={step.label} className="flex items-center">
                  {i > 0 && (
                    <div className="w-6 h-px mx-1"
                      style={{ background: done || active ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)' }} />
                  )}
                  <div
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: done
                        ? 'rgba(16,185,129,0.15)'
                        : active
                        ? 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(236,72,153,0.2))'
                        : 'transparent',
                      color: done ? '#10b981' : active ? '#c4b5fd' : '#4b5563',
                      border: active ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
                      boxShadow: active ? '0 0 16px rgba(124,58,237,0.2)' : 'none',
                    }}
                  >
                    {done ? <FiCheck size={11} /> : <Icon size={11} />}
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Page Title ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-white tracking-tight">Order Summary</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Review your booking details before payment</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── Cinema Ticket Card ───────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #12102a, #0e0c22)',
                border: '1px solid rgba(124,58,237,0.25)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1)',
              }}
            >
              {/* Gradient header strip */}
              <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899, #f59e0b)' }} />

              <div className="p-6 md:p-8">
                {/* Movie info row */}
                <div className="flex gap-5 items-start">
                  <div className="relative shrink-0">
                    <img
                      src={show.movie?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200'}
                      alt={show.movie?.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200';
                      }}
                      className="w-20 h-30 md:w-24 md:h-36 object-cover rounded-2xl"
                      style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    {/* Format badge */}
                    <span
                      className="absolute -top-2 -right-2 px-2 py-0.5 rounded-lg text-[10px] font-black"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white' }}
                    >
                      {show.format || '2D'}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-white leading-tight line-clamp-2">
                        {show.movie?.title}
                      </h2>
                      {show.movie?.genres && (
                        <p className="text-xs mt-0.5" style={{ color: '#a78bfa' }}>
                          {show.movie.genres.join(' • ')}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(124,58,237,0.2)' }}>
                          <FiMapPin size={12} style={{ color: '#a78bfa' }} />
                        </div>
                        <span className="font-medium">{show.screen?.theatre?.name}, {show.screen?.theatre?.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(236,72,153,0.15)' }}>
                          <FiCalendar size={12} style={{ color: '#f472b6' }} />
                        </div>
                        <span className="font-semibold">{dateStr}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(245,158,11,0.15)' }}>
                          <FiClock size={12} style={{ color: '#fbbf24' }} />
                        </div>
                        <span className="font-semibold">{timeStr}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#6b7280' }}>
                          {show.screen?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Perforated divider */}
                <div className="relative my-6">
                  <div className="border-t-2 border-dashed" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                  <div className="absolute -left-8 -top-3.5 w-7 h-7 rounded-full"
                    style={{ background: 'var(--bg-primary)' }} />
                  <div className="absolute -right-8 -top-3.5 w-7 h-7 rounded-full"
                    style={{ background: 'var(--bg-primary)' }} />
                </div>

                {/* Selected Seats */}
                <div className="space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
                    style={{ color: '#4b5563' }}>
                    <MdEventSeat size={14} style={{ color: '#a78bfa' }} />
                    Selected Seats ({selectedSeats.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((seat) => (
                      <motion.div
                        key={seat.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                        style={{
                          background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.12))',
                          border: '1px solid rgba(124,58,237,0.35)',
                          color: '#c4b5fd',
                        }}
                      >
                        <MdEventSeat size={11} />
                        {seat.label || `${seat.row}${seat.number}`}
                        <span style={{ color: '#f472b6' }}>₹{seat.price || 250}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Coupon / Promo Code ───────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl p-5 md:p-6"
              style={{
                background: 'rgba(20,20,40,0.7)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <FiTag size={13} style={{ color: '#fbbf24' }} />
                </div>
                Have a Coupon Code?
              </h3>

              <AnimatePresence mode="wait">
                {coupon ? (
                  <motion.div
                    key="applied"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-4 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.06))',
                      border: '1px solid rgba(16,185,129,0.35)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(16,185,129,0.2)' }}>
                        <FiCheck size={16} style={{ color: '#10b981' }} />
                      </div>
                      <div>
                        <p className="text-sm font-black" style={{ color: '#10b981' }}>"{coupon.code}" Applied</p>
                        <p className="text-xs" style={{ color: '#34d399' }}>You save ₹{couponDiscount.toFixed(0)} 🎉</p>
                      </div>
                    </div>
                    <button
                      onClick={clearCoupon}
                      className="p-2 rounded-xl transition-all hover:bg-red-500/20"
                      style={{ color: '#6b7280' }}
                    >
                      <FiX size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="FIRST50, SAVE20..."
                      className="glass-input px-4 py-3 rounded-2xl w-full text-sm outline-none uppercase font-mono font-bold tracking-widest"
                    />
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={handleApplyCoupon}
                      disabled={validating || !couponCode.trim()}
                      className="shrink-0 px-5 py-3 rounded-2xl text-sm font-black transition-all disabled:opacity-50"
                      style={{
                        background: couponCode.trim()
                          ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))'
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${couponCode.trim() ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        color: couponCode.trim() ? '#fbbf24' : '#4b5563',
                      }}
                    >
                      {validating ? <FiLoader className="animate-spin" size={16} /> : 'Apply'}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Trust Badges ─────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center justify-center gap-6 text-[11px] font-bold"
              style={{ color: '#4b5563' }}
            >
              <div className="flex items-center gap-1.5">
                <FiShield size={12} style={{ color: '#10b981' }} /> SSL Secured
              </div>
              <div className="w-px h-3" style={{ background: '#1f2937' }} />
              <div className="flex items-center gap-1.5">
                <FiZap size={12} style={{ color: '#f59e0b' }} /> Instant Booking
              </div>
              <div className="w-px h-3" style={{ background: '#1f2937' }} />
              <div className="flex items-center gap-1.5">
                <FiCheck size={12} style={{ color: '#a78bfa' }} /> Free Cancellation
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Price Breakdown ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div
              className="rounded-3xl overflow-hidden sticky top-6"
              style={{
                background: 'linear-gradient(145deg, #12102a, #0e0c22)',
                border: '1px solid rgba(124,58,237,0.25)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              }}
            >
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />

              <div className="p-6 space-y-5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  Payment Breakdown
                </h3>

                {/* Line Items */}
                <div className="space-y-3">
                  {[
                    {
                      label: `Tickets × ${selectedSeats.length}`,
                      value: `₹${ticketTotal}`,
                      color: '#e5e7eb',
                    },
                    couponDiscount > 0 && {
                      label: `Coupon (${coupon?.code})`,
                      value: `−₹${couponDiscount.toFixed(0)}`,
                      color: '#10b981',
                      highlight: true,
                    },
                    {
                      label: 'Convenience Fee',
                      value: `₹${convFee}`,
                      color: '#94a3b8',
                    },
                    {
                      label: 'GST (18%)',
                      value: `₹${gst.toFixed(0)}`,
                      color: '#94a3b8',
                    },
                  ].filter(Boolean).map(({ label, value, color, highlight }) => (
                    <div key={label}
                      className="flex justify-between items-center text-sm"
                      style={{
                        ...(highlight ? {
                          padding: '6px 10px',
                          borderRadius: '10px',
                          background: 'rgba(16,185,129,0.1)',
                          marginLeft: '-10px',
                          marginRight: '-10px',
                        } : {}),
                      }}
                    >
                      <span style={{ color: '#6b7280' }}>{label}</span>
                      <span className="font-bold" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Grand Total */}
                <div
                  className="rounded-2xl p-4 flex justify-between items-center"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}
                >
                  <span className="font-black text-white text-sm">Grand Total</span>
                  <span
                    className="text-2xl font-black"
                    style={{
                      background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    ₹{grandTotal.toFixed(0)}
                  </span>
                </div>

                {couponDiscount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 text-xs"
                    style={{ color: '#10b981' }}
                  >
                    <FiCheck size={12} />
                    You're saving ₹{couponDiscount.toFixed(0)} with the coupon!
                  </motion.div>
                )}

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(124,58,237,0.5)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProceedToPayment}
                  disabled={proceeding}
                  className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2.5 disabled:opacity-70 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
                    boxShadow: '0 6px 25px rgba(124,58,237,0.4)',
                  }}
                >
                  {proceeding ? (
                    <>
                      <FiLoader className="animate-spin" size={16} />
                      Initiating Booking...
                    </>
                  ) : (
                    <>
                      Proceed to Pay ₹{grandTotal.toFixed(0)}
                      <FiArrowRight size={16} />
                    </>
                  )}
                </motion.button>

                {/* Security note */}
                <p className="text-center text-[11px] flex items-center justify-center gap-1.5" style={{ color: '#374151' }}>
                  <FiShield size={11} style={{ color: '#10b981' }} />
                  256-Bit SSL Encrypted • Instant Cancellation
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
