/**
 * PaymentSuccess.jsx — Premium Booking Confirmation Page (Redesigned)
 * Cinematic ticket reveal, confetti burst, animated timeline,
 * QR code display, and polished action buttons.
 */
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { bookingAPI } from '../services/api.js';
import {
  FiDownload, FiHome, FiFilm, FiShare2, FiCalendar,
  FiMapPin, FiClock, FiCheck, FiStar, FiChevronRight,
} from 'react-icons/fi';
import { MdEventSeat, MdQrCode } from 'react-icons/md';
import toast from 'react-hot-toast';

/* ── Particle burst component ─────────────────────────────────────────────── */
function SuccessParticles({ active }) {
  if (!active) return null;
  return (
    <Confetti
      numberOfPieces={280}
      recycle={false}
      gravity={0.22}
      initialVelocityX={6}
      initialVelocityY={14}
      colors={['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#60a5fa', '#fbbf24', '#f472b6']}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 50 }}
    />
  );
}

/* ── Ticket timeline item ─────────────────────────────────────────────────── */
function TicketField({ label, value, icon: Icon, color = '#6b7280', highlight = false }) {
  return (
    <div
      className="flex items-center justify-between py-2.5 px-3 rounded-xl"
      style={{
        background: highlight ? 'rgba(124,58,237,0.08)' : 'transparent',
        border: highlight ? '1px solid rgba(124,58,237,0.15)' : '1px solid transparent',
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}18` }}
        >
          <Icon size={13} style={{ color }} />
        </div>
        <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{label}</span>
      </div>
      <span className="text-xs font-bold text-right ml-3 leading-tight" style={{ color: '#e5e7eb', maxWidth: '55%' }}>
        {value}
      </span>
    </div>
  );
}

export default function PaymentSuccess() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const [booking,       setBooking]       = useState(state?.booking);
  const [downloading,   setDownloading]   = useState(false);
  const [showConfetti,  setShowConfetti]  = useState(true);
  const [ticketVisible, setTicketVisible] = useState(false);

  useEffect(() => {
    if (!booking) { navigate('/'); return; }
    // Delay ticket reveal for dramatic effect
    const t1 = setTimeout(() => setTicketVisible(true), 600);
    const t2 = setTimeout(() => setShowConfetti(false), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await bookingAPI.downloadTicket(booking.id);
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      a.href = url; a.download = `ticket-${booking.bookingNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Ticket downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const text = `🎬 Just booked tickets for ${booking.show?.movie?.title} at ${booking.show?.screen?.theatre?.name}! Booking ID: ${booking.bookingNumber}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'CineMax Ticket', text }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Booking details copied!');
    }
  };

  if (!booking) return null;

  const showDate = booking.show?.startTime ? new Date(booking.show.startTime) : null;
  const dateStr  = showDate?.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr  = showDate?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const seatLabels = booking.seats?.map((s) => s.seat?.label).filter(Boolean).join(', ') || '—';

  return (
    <div
      className="min-h-screen py-12 pb-28 flex flex-col items-center relative overflow-x-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Confetti */}
      <SuccessParticles active={showConfetti} />

      {/* Ambient glow */}
      <div className="fixed inset-x-0 top-0 h-72 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.15) 0%, rgba(124,58,237,0.1) 40%, transparent 70%)',
        zIndex: 0,
      }} />

      <div className="relative w-full max-w-md mx-auto px-4" style={{ zIndex: 1 }}>

        {/* ── Success Hero ──────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          {/* Animated checkmark ring */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 0.1 }}
            className="relative w-28 h-28 mx-auto mb-5"
          >
            {/* Outer pulse ring */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5 }}
              className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(16,185,129,0.25)' }}
            />
            {/* Main circle */}
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 0 0 6px rgba(16,185,129,0.15), 0 20px 50px rgba(16,185,129,0.4)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.3, damping: 12 }}
              >
                <FiCheck size={48} className="text-white" strokeWidth={2.5} />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h1
              className="text-4xl font-black mb-2"
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #10b981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Booking Confirmed!
            </h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              Your ticket has been sent to your email ✉️
            </p>
          </motion.div>
        </div>

        {/* ── Cinema Ticket Card ────────────────────────────────────────── */}
        <AnimatePresence>
          {ticketVisible && (
            <motion.div
              initial={{ opacity: 0, y: 40, rotateX: -8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 160 }}
              style={{ perspective: '1000px' }}
              className="mb-6"
            >
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #12102a, #0e0c22)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.15)',
                }}
              >
                {/* Rainbow stripe */}
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899, #f59e0b, #10b981)' }} />

                {/* Ticket header — gradient bg */}
                <div className="p-6" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.15))' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-black"
                          style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.4)' }}
                        >
                          {booking.show?.format || '2D'}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1"
                          style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)' }}
                        >
                          <FiCheck size={9} /> CONFIRMED
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-white leading-tight line-clamp-2">
                        {booking.show?.movie?.title}
                      </h2>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Booking ID
                      </p>
                      <p className="text-xs font-mono font-black text-white">
                        {booking.bookingNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Perforated divider */}
                <div className="relative mx-0" style={{ borderTop: '2px dashed rgba(255,255,255,0.08)' }}>
                  <div className="absolute -left-4 -top-4 w-8 h-8 rounded-full" style={{ background: 'var(--bg-primary)' }} />
                  <div className="absolute -right-4 -top-4 w-8 h-8 rounded-full" style={{ background: 'var(--bg-primary)' }} />
                </div>

                {/* Ticket body — details */}
                <div className="px-5 py-5 space-y-1">
                  <TicketField
                    label="Theatre" value={booking.show?.screen?.theatre?.name}
                    icon={FiMapPin} color="#a78bfa" highlight
                  />
                  <TicketField
                    label="Date" value={dateStr || '—'}
                    icon={FiCalendar} color="#f472b6"
                  />
                  <TicketField
                    label="Show Time" value={timeStr || '—'}
                    icon={FiClock} color="#fbbf24"
                  />
                  <TicketField
                    label="Screen" value={booking.show?.screen?.name || '—'}
                    icon={FiFilm} color="#60a5fa"
                  />
                  <TicketField
                    label="Seats" value={seatLabels}
                    icon={MdEventSeat} color="#10b981" highlight
                  />
                  <TicketField
                    label="Amount Paid" value={`₹${booking.grandTotal?.toFixed(0)}`}
                    icon={FiStar} color="#f59e0b" highlight
                  />
                </div>

                {/* QR code section */}
                {booking.qrCodeUrl && (
                  <>
                    <div className="relative mx-5" style={{ borderTop: '2px dashed rgba(255,255,255,0.08)' }}>
                      <div className="absolute -left-9 -top-4 w-8 h-8 rounded-full" style={{ background: 'var(--bg-primary)' }} />
                      <div className="absolute -right-9 -top-4 w-8 h-8 rounded-full" style={{ background: 'var(--bg-primary)' }} />
                    </div>
                    <div className="px-6 py-5 flex flex-col items-center gap-3">
                      <div
                        className="p-3 rounded-2xl"
                        style={{ background: '#f5f0ff', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
                      >
                        <img
                          src={booking.qrCodeUrl}
                          alt="Entry QR Code"
                          className="w-32 h-32 rounded-xl"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#4b5563' }}>
                        <MdQrCode size={13} style={{ color: '#6366f1' }} />
                        <span>Scan at theatre entrance</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Footer strip */}
                <div className="px-6 py-3.5 flex items-center justify-between"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                      <FiFilm size={12} className="text-white" />
                    </div>
                    <span className="text-xs font-black text-white">CineMax</span>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: '#374151' }}>
                    Enjoy the show! 🎬
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action Buttons ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-3"
        >
          {/* Primary: Download */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 10px 35px rgba(124,58,237,0.5)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2.5 transition-all disabled:opacity-70"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
              boxShadow: '0 6px 25px rgba(124,58,237,0.4)',
            }}
          >
            <FiDownload size={16} />
            {downloading ? 'Downloading…' : 'Download PDF Ticket'}
          </motion.button>

          {/* Secondary row */}
          <div className="grid grid-cols-3 gap-2.5">
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={handleShare}
              className="py-3.5 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all"
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: '#818cf8',
              }}
            >
              <FiShare2 size={15} />
              Share
            </motion.button>

            <Link
              to="/bookings"
              className="py-3.5 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all no-underline"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
              }}
            >
              <FiFilm size={15} />
              My Bookings
            </Link>

            <Link
              to="/"
              className="py-3.5 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all no-underline"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
              }}
            >
              <FiHome size={15} />
              Home
            </Link>
          </div>

          {/* Browse more CTA */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl p-4 flex items-center justify-between cursor-pointer group"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(124,58,237,0.08))',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
            onClick={() => navigate('/')}
          >
            <div>
              <p className="text-sm font-black text-white">🍿 Browse More Movies</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>Discover what's showing this week</p>
            </div>
            <FiChevronRight size={18} style={{ color: '#f59e0b' }} className="group-hover:translate-x-1 transition-transform" />
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
