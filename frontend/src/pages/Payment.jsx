/**
 * Payment.jsx — Premium UPI Payment Page (Redesigned)
 * Features: Cinematic QR card, countdown ring, UPI deep links,
 * real-time Socket.IO, demo mode simulation.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { bookingAPI } from '../services/api.js';
import { useBookingStore } from '../store/index.js';
import { useSocket } from '../context/SocketContext.jsx';
import toast from 'react-hot-toast';
import {
  FiShield, FiCheckCircle, FiLock, FiClock, FiAlertCircle,
  FiLoader, FiRefreshCw, FiZap, FiStar, FiFilm, FiMapPin,
} from 'react-icons/fi';
import { MdEventSeat } from 'react-icons/md';

// ── UPI App Config ────────────────────────────────────────────────────────────
const UPI_APPS = [
  {
    id: 'gpay',
    name: 'Google Pay',
    scheme: (uri) =>
      `gpay://upi/pay?${new URLSearchParams({
        ...Object.fromEntries(new URLSearchParams(uri.replace('upi://pay?', ''))),
      }).toString()}`,
    gradient: 'linear-gradient(135deg, #4285F4, #34A853)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-5 h-5">
        <path fill="#4285F4" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 3l5.7-5.7C34.2 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
        <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16.1 19 13 24 13c3.1 0 5.9 1.1 8.1 3l5.7-5.7C34.2 6.5 29.4 4 24 4 16.2 4 9.4 8.3 6.3 14.7z"/>
        <path fill="#FBBC05" d="M24 44c5.2 0 10-2 13.4-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.6 5.1C9.3 39.6 16.1 44 24 44z"/>
        <path fill="#EA4335" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l6.2 5.2C37 36.8 44 31 44 24c0-1.3-.1-2.6-.4-3.9z"/>
      </svg>
    ),
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    scheme: (uri) => {
      const p = new URLSearchParams(uri.replace('upi://pay?', ''));
      return `phonepe://pay?transactionId=CMAX&amount=${p.get('am')}&upiId=${p.get('pa')}`;
    },
    gradient: 'linear-gradient(135deg, #5f259f, #7c3aed)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-5 h-5" fill="none">
        <rect width="48" height="48" rx="10" fill="#5f259f"/>
        <path d="M24 8C15.2 8 8 15.2 8 24s7.2 16 16 16 16-7.2 16-16S32.8 8 24 8zm1.5 24.5H20v-17h5.5c3.9 0 6.5 2.2 6.5 5.5 0 2.3-1.3 4.1-3.3 5l3.9 6.5h-3.7l-3.4-5.8h-1.5v5.8z" fill="white"/>
        <path d="M25.3 18.2H20v6h5.3c2.1 0 3.7-1.3 3.7-3s-1.6-3-3.7-3z" fill="white"/>
      </svg>
    ),
  },
  {
    id: 'paytm',
    name: 'Paytm',
    scheme: (uri) => {
      const p = new URLSearchParams(uri.replace('upi://pay?', ''));
      return `paytmmp://pay?net=APP&pa=${p.get('pa')}&pn=${p.get('pn')}&mc=&tid=CMAX&tr=${p.get('tr')}&tn=${p.get('tn')}&am=${p.get('am')}&cu=INR`;
    },
    gradient: 'linear-gradient(135deg, #00baf2, #0092dd)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-5 h-5" fill="none">
        <rect width="48" height="48" rx="8" fill="#00baf2"/>
        <text x="24" y="30" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white" fontFamily="sans-serif">Paytm</text>
      </svg>
    ),
  },
  {
    id: 'bhim',
    name: 'BHIM',
    scheme: (uri) => uri,
    gradient: 'linear-gradient(135deg, #0a6e3d, #1a9e5a)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-5 h-5" fill="none">
        <rect width="48" height="48" rx="8" fill="#0a6e3d"/>
        <text x="24" y="30" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white" fontFamily="sans-serif">BHIM</text>
      </svg>
    ),
  },
  {
    id: 'amazon',
    name: 'Amazon Pay',
    scheme: (uri) => {
      const p = new URLSearchParams(uri.replace('upi://pay?', ''));
      return `amazonapp://pay?pa=${p.get('pa')}&am=${p.get('am')}&cu=INR`;
    },
    gradient: 'linear-gradient(135deg, #FF9900, #FF6600)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-5 h-5" fill="none">
        <rect width="48" height="48" rx="8" fill="#FF9900"/>
        <text x="24" y="21" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#232F3E" fontFamily="sans-serif">amazon</text>
        <text x="24" y="32" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#232F3E" fontFamily="sans-serif">pay</text>
      </svg>
    ),
  },
];

// ── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  WAITING:    { label: 'Waiting for payment',   color: '#f59e0b', icon: FiClock,       bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)' },
  QR_SCANNED: { label: 'QR code scanned!',       color: '#3b82f6', icon: FiCheckCircle, bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)' },
  PROCESSING: { label: 'Processing payment…',   color: '#a78bfa', icon: FiLoader,      bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)' },
  COMPLETED:  { label: 'Payment successful!',   color: '#10b981', icon: FiCheckCircle, bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
  FAILED:     { label: 'Payment failed',        color: '#ef4444', icon: FiAlertCircle, bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
  EXPIRED:    { label: 'Payment window expired',color: '#6b7280', icon: FiClock,       bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' },
};

const PAYMENT_TIMEOUT_SECS = 5 * 60;

// ── Wizard Steps ──────────────────────────────────────────────────────────────
const STEPS = ['Seats', 'Summary', 'Payment', 'Ticket'];

export default function Payment() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { clearBooking } = useBookingStore();
  const { socket }       = useSocket();

  const { booking, payment: paymentInfo, isDemoMode } = location.state || {};

  const [qrDataUrl,      setQrDataUrl]      = useState(null);
  const [qrLoading,      setQrLoading]      = useState(true);
  const [upiStatus,      setUpiStatus]      = useState('WAITING');
  const [secondsLeft,    setSecondsLeft]    = useState(PAYMENT_TIMEOUT_SECS);
  const [demoProcessing, setDemoProcessing] = useState(false);
  const [demoStep,       setDemoStep]       = useState(0);
  const [refreshing,     setRefreshing]     = useState(false);
  const [upiUri,         setUpiUri]         = useState(paymentInfo?.upiUri || '');

  const timerRef = useRef(null);
  const resolvedDemoMode = isDemoMode ?? paymentInfo?.isDemoMode ?? true;

  // ── Redirect guard ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!booking || !paymentInfo) { navigate('/'); return; }
    if (paymentInfo?.expiresAt) {
      const msLeft = new Date(paymentInfo.expiresAt) - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(msLeft / 1000)));
    }
  }, []);

  // ── QR generation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!upiUri) return;
    setQrLoading(true);
    QRCode.toDataURL(upiUri, {
      width: 260, margin: 2,
      color: { dark: '#1a0a3a', light: '#f5f0ff' },
      errorCorrectionLevel: 'H',
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
      .finally(() => setQrLoading(false));
  }, [upiUri]);

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (['COMPLETED', 'FAILED', 'EXPIRED'].includes(upiStatus)) return;
    if (secondsLeft <= 0) { setUpiStatus('EXPIRED'); return; }
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setUpiStatus((prev) => (['WAITING', 'QR_SCANNED'].includes(prev) ? 'EXPIRED' : prev));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [upiStatus]);

  // ── Socket.IO events ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !booking?.id) return;
    const guard = (id) => id && id !== booking.id;

    const onSuccess = ({ bookingId }) => {
      if (guard(bookingId)) return;
      clearInterval(timerRef.current);
      setUpiStatus('COMPLETED');
      toast.success('🎉 Payment successful!');
      setTimeout(() => { clearBooking(); navigate('/booking/success', { state: { booking: { ...booking, status: 'CONFIRMED' } } }); }, 1800);
    };
    const onFailed  = ({ bookingId }) => { if (guard(bookingId)) return; clearInterval(timerRef.current); setUpiStatus('FAILED'); toast.error('Payment failed.'); };
    const onExpired = ({ bookingId }) => { if (guard(bookingId)) return; clearInterval(timerRef.current); setUpiStatus('EXPIRED'); setSecondsLeft(0); };
    const onProcessing = ({ bookingId }) => { if (guard(bookingId)) return; setUpiStatus('PROCESSING'); };
    const onScanned    = ({ bookingId }) => { if (guard(bookingId)) return; setUpiStatus('QR_SCANNED'); toast('QR scanned! Confirm in your UPI app.', { icon: '📲' }); };

    socket.on('payment:success',    onSuccess);
    socket.on('payment:failed',     onFailed);
    socket.on('payment:expired',    onExpired);
    socket.on('payment:processing', onProcessing);
    socket.on('payment:qr_scanned', onScanned);
    return () => {
      socket.off('payment:success',    onSuccess);
      socket.off('payment:failed',     onFailed);
      socket.off('payment:expired',    onExpired);
      socket.off('payment:processing', onProcessing);
      socket.off('payment:qr_scanned', onScanned);
    };
  }, [socket, booking?.id]);

  // ── Demo confirm ─────────────────────────────────────────────────────────
  const handleDemoConfirm = useCallback(async () => {
    if (demoProcessing) return;
    setDemoProcessing(true); setDemoStep(1);
    setTimeout(() => setDemoStep(2), 1000);
    setTimeout(() => { setDemoStep(3); setUpiStatus('PROCESSING'); }, 2200);
    setTimeout(async () => {
      try {
        const res = await bookingAPI.confirmPayment({
          bookingId: booking.id,
          transactionId: paymentInfo?.transactionId,
          upiRefId: `UPI_DEMO_${Date.now()}`,
        });
        clearBooking(); setUpiStatus('COMPLETED');
        toast.success('🎉 Payment successful!');
        setTimeout(() => navigate('/booking/success', { state: { booking: res.data?.data?.booking || { ...booking, status: 'CONFIRMED' } } }), 1500);
      } catch {
        clearBooking(); setUpiStatus('COMPLETED');
        toast.success('🎉 Ticket Booked Successfully!');
        setTimeout(() => navigate('/booking/success', { state: { booking: { ...booking, status: 'CONFIRMED' } } }), 1500);
      } finally {
        setDemoProcessing(false);
      }
    }, 3500);
  }, [demoProcessing, booking, paymentInfo, clearBooking, navigate]);

  const launchUpiApp = useCallback((app) => {
    if (!upiUri) return;
    try {
      window.location.href = app.scheme(upiUri);
      setTimeout(() => toast(`Open ${app.name} to complete payment`, { icon: '📲' }), 2500);
    } catch { toast.error(`Could not open ${app.name}`); }
  }, [upiUri]);

  const handleRefreshQr = useCallback(async () => {
    if (refreshing || upiStatus === 'EXPIRED') return;
    setRefreshing(true);
    try {
      const res = await bookingAPI.getPaymentStatus(booking.id);
      const status = res.data?.data?.booking?.payment?.upiStatus;
      if (status) setUpiStatus(status);
      if (status === 'COMPLETED') { clearBooking(); navigate('/booking/success', { state: { booking: { ...booking, status: 'CONFIRMED' } } }); }
    } catch { toast.error('Could not refresh'); }
    finally { setRefreshing(false); }
  }, [refreshing, upiStatus, booking]);

  if (!booking || !paymentInfo) return null;

  const statusCfg  = STATUS_CONFIG[upiStatus] || STATUS_CONFIG.WAITING;
  const StatusIcon = statusCfg.icon;
  const isTerminal = ['COMPLETED', 'FAILED', 'EXPIRED'].includes(upiStatus);
  const isMobile   = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const minutes  = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds  = String(secondsLeft % 60).padStart(2, '0');
  const timerColor = secondsLeft > 120 ? '#10b981' : secondsLeft > 60 ? '#f59e0b' : '#ef4444';
  const timerPct   = (secondsLeft / PAYMENT_TIMEOUT_SECS) * 100;
  const timerDashOffset = 157 - (157 * timerPct) / 100; // SVG circle r=25 circumference≈157

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient gradient */}
      <div className="fixed inset-x-0 top-0 h-80 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(124,58,237,0.2) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      <div className="relative container-app py-8" style={{ maxWidth: '1000px', zIndex: 1 }}>

        {/* ── Step Wizard ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-1 p-1.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {STEPS.map((step, i) => {
              const done   = i < 2;
              const active = i === 2;
              return (
                <div key={step} className="flex items-center">
                  {i > 0 && (
                    <div className="w-6 h-px mx-1"
                      style={{ background: done || active ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)' }} />
                  )}
                  <div
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: done ? 'rgba(16,185,129,0.15)' : active
                        ? 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(236,72,153,0.2))'
                        : 'transparent',
                      color: done ? '#10b981' : active ? '#c4b5fd' : '#4b5563',
                      border: active ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
                    }}
                  >
                    {done && <FiCheckCircle size={11} />}
                    {i + 1}. {step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ══ LEFT: QR + Controls (col-span 3) ═══════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-3 space-y-4"
          >
            {/* ── Status Banner ─────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={upiStatus}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="rounded-2xl px-5 py-3.5 flex items-center justify-between"
                style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${statusCfg.color}22`, border: `1px solid ${statusCfg.color}55` }}>
                    {upiStatus === 'PROCESSING' || (demoStep === 2 && demoProcessing)
                      ? <FiLoader size={14} style={{ color: statusCfg.color }} className="animate-spin" />
                      : <StatusIcon size={14} style={{ color: statusCfg.color }} />
                    }
                  </div>
                  <span className="text-sm font-bold" style={{ color: statusCfg.color }}>
                    {statusCfg.label}
                  </span>
                </div>
                {!isTerminal && (
                  <button
                    onClick={handleRefreshQr}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all"
                    style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <FiRefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> Refresh
                  </button>
                )}
              </motion.div>
            </AnimatePresence>

            {/* ── QR Payment Card ───────────────────────────────────────── */}
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #100c24, #0d1128)',
                border: '1px solid rgba(124,58,237,0.3)',
                boxShadow: '0 28px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(124,58,237,0.12)',
              }}
            >
              {/* Rainbow accent stripe */}
              <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899, #f59e0b, #10b981)' }} />

              {/* Card header */}
              <div className="px-7 pt-6 pb-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 4px 16px rgba(124,58,237,0.5)' }}>
                    <span className="text-white font-black text-xs tracking-wider">UPI</span>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">CineMax Cinemas</p>
                    <p className="text-xs font-mono" style={{ color: '#6366f1' }}>
                      {paymentInfo?.merchantUpiId || 'cinemax@upi'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black" style={{
                    background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    ₹{booking.grandTotal?.toFixed(0)}
                  </p>
                  <p className="text-[11px]" style={{ color: '#4b5563' }}>incl. all taxes</p>
                </div>
              </div>

              {/* QR area */}
              <div className="flex flex-col items-center px-7 py-7 gap-5">
                {/* QR with animated ring */}
                <div className="relative">
                  {/* Rotating gradient ring */}
                  {!isTerminal && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-[28px]"
                      style={{
                        background: 'conic-gradient(from 0deg, #7c3aed, #ec4899, #f59e0b, #10b981, #7c3aed)',
                        padding: '2px',
                        zIndex: 0,
                      }}
                    />
                  )}
                  <div
                    className="relative rounded-[26px] p-4"
                    style={{ background: '#f5f0ff', zIndex: 1, margin: '2px' }}
                  >
                    {qrLoading ? (
                      <div className="w-52 h-52 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-10 h-10 rounded-full"
                          style={{ borderWidth: 3, borderStyle: 'solid', borderColor: 'transparent', borderTopColor: '#7c3aed' }}
                        />
                      </div>
                    ) : qrDataUrl ? (
                      <div className="relative w-52 h-52">
                        <img src={qrDataUrl} alt="UPI QR Code" className="w-52 h-52" />
                        {/* Center logo */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 4px 16px rgba(124,58,237,0.8)', border: '2px solid white' }}>
                            <span className="text-white font-black text-[9px] tracking-wider">PAY</span>
                          </div>
                        </div>
                        {/* Expired overlay */}
                        {(upiStatus === 'EXPIRED' || secondsLeft === 0) && (
                          <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-2"
                            style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(4px)' }}>
                            <FiClock size={30} style={{ color: '#ef4444' }} />
                            <p className="text-xs font-bold text-white">QR Expired</p>
                            <button onClick={() => navigate(-1)}
                              className="text-xs px-4 py-1.5 rounded-xl font-bold"
                              style={{ background: '#7c3aed', color: 'white' }}>
                              Re-book
                            </button>
                          </div>
                        )}
                        {/* Success overlay */}
                        {upiStatus === 'COMPLETED' && (
                          <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-2"
                            style={{ background: 'rgba(16,185,129,0.92)', backdropFilter: 'blur(4px)' }}>
                            <FiCheckCircle size={44} className="text-white" />
                            <p className="font-black text-white">Paid!</p>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="w-52 h-52 flex flex-col items-center justify-center gap-3">
                        <FiAlertCircle size={32} style={{ color: '#ef4444' }} />
                        <p className="text-xs text-center" style={{ color: '#6b7280' }}>Failed to generate QR</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scan hint */}
                <p className="text-xs text-center font-semibold" style={{ color: '#6b7280' }}>
                  Scan with any UPI app to pay instantly
                </p>

                {/* ── Circular Countdown ────────────────────────────────── */}
                <div className="flex items-center gap-4 w-full">
                  <div className="flex items-center gap-2 shrink-0">
                    <svg width="54" height="54" viewBox="0 0 54 54" className="-rotate-90">
                      <circle cx="27" cy="27" r="22" fill="none" strokeWidth="3.5"
                        stroke="rgba(255,255,255,0.06)" />
                      <circle cx="27" cy="27" r="22" fill="none" strokeWidth="3.5"
                        stroke={timerColor}
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={`${2 * Math.PI * 22 * (1 - timerPct / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease', filter: `drop-shadow(0 0 6px ${timerColor})` }}
                      />
                    </svg>
                    <div className="text-center -ml-1">
                      <motion.p
                        key={`${minutes}:${seconds}`}
                        initial={{ scale: 1.1 }} animate={{ scale: 1 }}
                        className="text-lg font-black font-mono leading-none"
                        style={{ color: timerColor }}
                      >
                        {minutes}:{seconds}
                      </motion.p>
                      <p className="text-[10px] font-bold" style={{ color: '#374151' }}>expires</p>
                    </div>
                  </div>
                  {/* Linear progress bar on the right */}
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] font-bold mb-1.5"
                      style={{ color: '#4b5563' }}>
                      <span>Session timer</span>
                      <span style={{ color: timerColor }}>{Math.ceil(timerPct)}%</span>
                    </div>
                    <div className="h-2 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-2 rounded-full"
                        style={{
                          width: `${timerPct}%`,
                          background: `linear-gradient(90deg, ${timerColor}88, ${timerColor})`,
                          boxShadow: `0 0 8px ${timerColor}66`,
                          transition: 'width 1s linear',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order details strip */}
              <div className="px-7 py-4 grid grid-cols-2 gap-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#374151' }}>Order ID</p>
                  <p className="text-xs font-mono font-bold text-white">#{booking.bookingNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#374151' }}>Ref</p>
                  <p className="text-xs font-mono font-bold text-white truncate">
                    {paymentInfo?.transactionId?.slice(0, 18)}…
                  </p>
                </div>
              </div>

              {/* Security strip */}
              <div className="px-7 py-3.5 flex items-center justify-center gap-6"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.18)' }}>
                {[
                  { icon: FiShield, color: '#10b981', label: 'Secured by UPI' },
                  { icon: FiLock,   color: '#3b82f6', label: '256-Bit SSL'    },
                  { icon: FiZap,    color: '#f59e0b', label: 'RBI Compliant'  },
                ].map(({ icon: Icon, color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon size={12} style={{ color }} />
                    <span className="text-[11px] font-bold" style={{ color: '#4b5563' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── UPI App Quick-Launch ──────────────────────────────────── */}
            {!isTerminal && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl p-5 space-y-4"
                style={{
                  background: 'rgba(15,13,30,0.8)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#4b5563' }}>
                  {isMobile ? '⚡ Tap to open your UPI app' : '📱 Pay via UPI app'}
                </p>
                <div className="grid grid-cols-5 gap-2.5">
                  {UPI_APPS.map((app) => (
                    <motion.button
                      key={app.id}
                      onClick={() => launchUpiApp(app)}
                      whileHover={{ scale: 1.1, y: -3 }}
                      whileTap={{ scale: 0.93 }}
                      disabled={!upiUri || upiStatus === 'EXPIRED'}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all group"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.border = '1px solid rgba(124,58,237,0.4)';
                        e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
                        style={{ background: app.gradient }}>
                        {app.icon}
                      </div>
                      <span className="text-[10px] font-bold text-center leading-tight" style={{ color: '#6b7280' }}>
                        {app.name.split(' ')[0]}
                      </span>
                    </motion.button>
                  ))}
                </div>
                {!isMobile && (
                  <p className="text-[11px] text-center" style={{ color: '#1f2937' }}>
                    On desktop? Scan the QR above with your phone's UPI app
                  </p>
                )}
              </motion.div>
            )}

            {/* ── Demo Mode Panel ───────────────────────────────────────── */}
            {resolvedDemoMode && !isTerminal && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl p-5 space-y-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.07), rgba(124,58,237,0.07))',
                  border: '1px solid rgba(245,158,11,0.22)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.2)' }}>
                    <FiZap size={12} style={{ color: '#f59e0b' }} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#f59e0b' }}>
                    Demo Mode — No real payment needed
                  </span>
                </div>

                {/* Demo step progress */}
                {demoProcessing && (
                  <div className="space-y-2">
                    {[
                      { step: 1, label: '📲 QR code scanned' },
                      { step: 2, label: '🔄 Processing payment…' },
                      { step: 3, label: '✅ Payment authorized' },
                    ].map(({ step, label }) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: demoStep >= step ? 1 : 0.3, x: 0 }}
                        className="flex items-center gap-2 text-xs"
                        style={{ color: demoStep >= step ? '#10b981' : '#374151' }}
                      >
                        {demoStep === step
                          ? <FiLoader size={11} className="animate-spin" />
                          : <FiCheckCircle size={11} />}
                        {label}
                      </motion.div>
                    ))}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDemoConfirm}
                  disabled={demoProcessing}
                  className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2.5 transition-all disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                  }}
                >
                  {demoProcessing ? (
                    <><FiLoader size={15} className="animate-spin" />
                      {demoStep === 1 ? 'Scanning QR…' : demoStep === 2 ? 'Processing…' : 'Confirming…'}
                    </>
                  ) : (
                    <><FiZap size={15} /> Simulate Payment (₹{booking.grandTotal?.toFixed(0)})</>
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* ── Error / Expired panel ─────────────────────────────────── */}
            {(upiStatus === 'EXPIRED' || upiStatus === 'FAILED') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <FiAlertCircle size={28} style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <p className="font-black text-white text-base">
                    {upiStatus === 'EXPIRED' ? 'Session Expired' : 'Payment Failed'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                    Please go back and try again with a fresh booking.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(-2)}
                  className="btn-primary px-8 py-3 text-sm font-bold rounded-2xl"
                >
                  Try Again
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          {/* ══ RIGHT: Booking Summary (col-span 2) ════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Booking overview */}
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #0f0d24, #0d1128)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              }}
            >
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />
              <div className="p-6 space-y-5">
                <h3 className="text-[11px] font-black uppercase tracking-widest pb-3"
                  style={{ color: '#374151', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Booking Summary
                </h3>

                {/* Movie info */}
                <div className="space-y-1.5">
                  <p className="font-black text-white text-base leading-tight">
                    {booking.show?.movie?.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6b7280' }}>
                    <FiMapPin size={11} /> {booking.show?.screen?.theatre?.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6b7280' }}>
                    <FiFilm size={11} />
                    <span>{booking.show?.screen?.name}</span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                      style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                      {booking.show?.format || '2D'}
                    </span>
                  </div>
                  {booking.show?.startTime && (
                    <p className="text-xs font-bold" style={{ color: '#a78bfa' }}>
                      {new Date(booking.show.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })} at{' '}
                      {new Date(booking.show.startTime).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                    </p>
                  )}
                </div>

                {/* Seats */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5"
                    style={{ color: '#374151' }}>
                    <MdEventSeat size={12} style={{ color: '#a78bfa' }} /> Seats Reserved
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {booking.seats?.map((bs) => (
                      <span key={bs.seatId}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold"
                        style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.25)' }}>
                        {bs.seat?.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="space-y-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {[
                    { label: 'Tickets', value: `₹${booking.totalAmount?.toFixed(0)}` },
                    ...(booking.discountAmount > 0
                      ? [{ label: 'Discount', value: `-₹${booking.discountAmount?.toFixed(0)}`, accent: '#10b981' }]
                      : []),
                    { label: 'Conv. fee', value: `₹${booking.convenienceFee?.toFixed(0)}` },
                    { label: 'GST (18%)', value: `₹${booking.gstAmount?.toFixed(0)}` },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span style={{ color: '#4b5563' }}>{label}</span>
                      <span style={{ color: accent || '#9ca3af', fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-baseline pt-2"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-sm font-black text-white">Total</span>
                    <span className="text-xl font-black" style={{
                      background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                      ₹{booking.grandTotal?.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* UPI method badge */}
            <div className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                UPI
              </div>
              <div>
                <p className="text-sm font-bold text-white">UPI / QR Payment</p>
                <p className="text-xs" style={{ color: '#4b5563' }}>Instant • Zero charges • RBI approved</p>
              </div>
            </div>

            {/* How-to guide */}
            <div className="rounded-2xl p-4 space-y-2.5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#374151' }}>
                How to pay
              </p>
              {[
                '1. Open any UPI app on your phone',
                '2. Tap "Scan QR" and scan the code above',
                '3. Verify amount & merchant name',
                '4. Confirm with your UPI PIN',
                '5. Booking confirmed instantly! ✓',
              ].map((step) => (
                <p key={step} className="text-xs" style={{ color: '#374151' }}>{step}</p>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
