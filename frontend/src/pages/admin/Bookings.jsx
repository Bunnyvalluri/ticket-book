/**
 * Admin Bookings — UPI Payment Management Dashboard
 * Features: Payment filters, transaction search, refund actions, CSV export, invoice download
 */
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI, bookingAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import {
  FiSearch, FiFilter, FiEye, FiX, FiCheckCircle, FiLoader,
  FiRefreshCw, FiDownload, FiAlertCircle, FiDollarSign,
  FiClock, FiShield, FiTrendingUp,
} from 'react-icons/fi';
import { HiOutlineTicket } from 'react-icons/hi2';

const STATUS_CONFIG = {
  CONFIRMED:      { label: 'Confirmed',       color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)' },
  PENDING:        { label: 'Pending',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  PAYMENT_PENDING:{ label: 'Awaiting UPI',    color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)' },
  CANCELLED:      { label: 'Cancelled',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
  REFUNDED:       { label: 'Refunded',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
  EXPIRED:        { label: 'Expired',         color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' },
};

const UPI_STATUS_CONFIG = {
  WAITING:    { label: '⏳ Waiting',    color: '#f59e0b' },
  QR_SCANNED: { label: '📲 Scanned',   color: '#3b82f6' },
  PROCESSING: { label: '🔄 Processing', color: '#a78bfa' },
  COMPLETED:  { label: '✅ Completed', color: '#10b981' },
  FAILED:     { label: '❌ Failed',     color: '#ef4444' },
  EXPIRED:    { label: '⏰ Expired',   color: '#6b7280' },
};

const FILTER_TABS = [
  { id: '', label: 'All', icon: '📋' },
  { id: 'CONFIRMED', label: 'Confirmed', icon: '✅' },
  { id: 'PAYMENT_PENDING', label: 'UPI Pending', icon: '⏳' },
  { id: 'CANCELLED', label: 'Cancelled', icon: '❌' },
  { id: 'REFUNDED', label: 'Refunded', icon: '💰' },
  { id: 'EXPIRED', label: 'Expired', icon: '⏰' },
];

export default function AdminBookings() {
  const [search,          setSearch]         = useState('');
  const [status,          setStatus]         = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refunding,       setRefunding]       = useState(false);
  const [downloading,     setDownloading]     = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-bookings', search, status],
    queryFn:  () => adminAPI.getBookings({ search: search || undefined, status: status || undefined }),
  });

  const bookings = data?.data?.data?.bookings || [];

  // ── Refund booking ─────────────────────────────────────────────────────────
  const handleRefund = useCallback(async (bookingId) => {
    if (refunding) return;
    if (!window.confirm('Confirm refund for this booking?')) return;
    setRefunding(true);
    try {
      await bookingAPI.cancel(bookingId, 'Admin-initiated refund');
      toast.success('✅ Refund initiated successfully');
      queryClient.invalidateQueries(['admin-bookings']);
      setSelectedBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  }, [refunding, queryClient]);

  // ── Download ticket ────────────────────────────────────────────────────────
  const handleDownloadTicket = useCallback(async (bookingId, bookingNumber) => {
    setDownloading(bookingId);
    try {
      const res = await bookingAPI.downloadTicket(bookingId);
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `ticket-${bookingNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Ticket downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(null);
    }
  }, []);

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExportCsv = useCallback(() => {
    const headers = ['Booking#', 'Customer', 'Email', 'Movie', 'Theatre', 'Seats', 'Amount', 'Status', 'Payment', 'UPI TxnID', 'Date'];
    const rows = bookings.map((b) => [
      b.bookingNumber,
      `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim(),
      b.user?.email || '',
      b.show?.movie?.title || '',
      b.show?.screen?.theatre?.name || '',
      b.seats?.length || 0,
      `₹${b.grandTotal?.toFixed(0) || b.totalAmount?.toFixed(0)}`,
      b.status,
      b.payment?.upiStatus || b.payment?.status || '',
      b.payment?.transactionId || '',
      new Date(b.createdAt).toLocaleString('en-IN'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `bookings-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  }, [bookings]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const stats = {
    total:     bookings.length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    pending:   bookings.filter(b => ['PENDING', 'PAYMENT_PENDING'].includes(b.status)).length,
    revenue:   bookings.filter(b => b.status === 'CONFIRMED').reduce((s, b) => s + (b.grandTotal || b.totalAmount || 0), 0),
  };

  return (
    <div className="space-y-6" style={{ color: '#f1f5f9' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15,12,36,0.95), rgba(20,16,50,0.95))',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>UPI</div>
            <h1 className="text-2xl font-black text-white tracking-tight">UPI Payment Transactions</h1>
          </div>
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Manage bookings, verify UPI payments, process refunds, export reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <FiRefreshCw size={13} />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <FiDownload size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: stats.total,                 icon: HiOutlineTicket, color: '#7c3aed' },
          { label: 'Confirmed',      value: stats.confirmed,             icon: FiCheckCircle,   color: '#10b981' },
          { label: 'Pending UPI',    value: stats.pending,               icon: FiClock,         color: '#f59e0b' },
          { label: 'Revenue',        value: `₹${stats.revenue.toFixed(0)}`, icon: FiTrendingUp,color: '#ec4899' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-black text-white">{value}</p>
              <p className="text-[11px]" style={{ color: '#6b7280' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs + search ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatus(tab.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
              style={{
                background: status === tab.id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                color: status === tab.id ? '#c4b5fd' : '#6b7280',
                border: `1px solid ${status === tab.id ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: status === tab.id ? '0 0 16px rgba(124,58,237,0.2)' : 'none',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative">
          <FiSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#6b7280' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking #, customer email, movie, or UPI transaction ID..."
            className="w-full text-xs pl-10 pr-4 py-3 rounded-xl outline-none"
            style={{
              background: 'rgba(15,13,30,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f1f5f9',
            }}
          />
        </div>
      </div>

      {/* ── Bookings Table ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl shimmer" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 rounded-3xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <HiOutlineTicket size={40} style={{ color: '#7c3aed', opacity: 0.4, margin: '0 auto 12px' }} />
          <h3 className="text-base font-bold text-white">No Bookings Found</h3>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Try clearing filters or search keywords.</p>
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,8,25,0.8)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Booking #', 'Customer', 'Movie', 'Amount', 'UPI Status', 'Booking Status', 'Actions'].map((h) => (
                    <th key={h} className="py-3.5 px-5 text-[10px] font-black uppercase tracking-widest"
                      style={{ color: '#4b5563' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, idx) => {
                  const statusCfg   = STATUS_CONFIG[b.status]    || STATUS_CONFIG.PENDING;
                  const upiCfg      = UPI_STATUS_CONFIG[b.payment?.upiStatus] || null;
                  const movie       = b.show?.movie;
                  const user        = b.user;
                  const isConfirmed = b.status === 'CONFIRMED';

                  return (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="text-xs border-b transition-colors cursor-pointer"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="py-4 px-5">
                        <p className="font-mono font-bold text-[11px]" style={{ color: '#a78bfa' }}>
                          #{b.bookingNumber}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#374151' }}>
                          {new Date(b.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-bold" style={{ color: '#f1f5f9' }}>
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p style={{ color: '#6b7280' }}>{user?.email}</p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-semibold" style={{ color: '#e5e7eb' }}>{movie?.title}</p>
                        <p style={{ color: '#6b7280' }}>
                          {b.show?.screen?.theatre?.name}
                          {b.seats?.length > 0 && ` • ${b.seats.length} seat(s)`}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-black text-sm" style={{ color: '#fbbf24' }}>
                          ₹{(b.grandTotal || b.totalAmount)?.toFixed(0)}
                        </p>
                        <p style={{ color: '#374151' }}>UPI</p>
                      </td>
                      <td className="py-4 px-5">
                        {upiCfg ? (
                          <span className="text-[10px] font-bold" style={{ color: upiCfg.color }}>
                            {upiCfg.label}
                          </span>
                        ) : (
                          <span style={{ color: '#374151' }}>—</span>
                        )}
                        {b.payment?.transactionId && (
                          <p className="font-mono text-[9px] mt-0.5 truncate max-w-[120px]" style={{ color: '#374151' }}>
                            {b.payment.transactionId.slice(0, 16)}…
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black"
                          style={{
                            background: statusCfg.bg,
                            color: statusCfg.color,
                            border: `1px solid ${statusCfg.border}`,
                          }}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 rounded-lg transition-all text-[10px] font-bold flex items-center gap-1"
                            style={{ color: '#a78bfa', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
                          >
                            <FiEye size={11} /> View
                          </button>
                          {isConfirmed && (
                            <button
                              onClick={() => handleDownloadTicket(b.id, b.bookingNumber)}
                              disabled={downloading === b.id}
                              className="p-1.5 rounded-lg transition-all text-[10px] font-bold flex items-center gap-1"
                              style={{ color: '#34d399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                            >
                              {downloading === b.id
                                ? <FiLoader size={11} className="animate-spin" />
                                : <FiDownload size={11} />
                              }
                            </button>
                          )}
                          {isConfirmed && (
                            <button
                              onClick={() => handleRefund(b.id)}
                              disabled={refunding}
                              className="p-1.5 rounded-lg transition-all text-[10px] font-bold flex items-center gap-1"
                              style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                            >
                              <FiDollarSign size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Booking Detail Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedBooking && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93 }}
              className="rounded-3xl p-6 md:p-7 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(145deg, #0f0c24, #0d1128)',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between pb-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <p className="text-[10px] font-mono font-bold" style={{ color: '#a78bfa' }}>
                    #{selectedBooking.bookingNumber}
                  </p>
                  <h3 className="text-base font-black text-white">Booking Inspector</h3>
                </div>
                <button onClick={() => setSelectedBooking(null)}
                  className="p-2 rounded-xl transition-all" style={{ color: '#6b7280', background: 'rgba(255,255,255,0.05)' }}>
                  <FiX size={16} />
                </button>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-3 flex-wrap">
                {(() => {
                  const sc = STATUS_CONFIG[selectedBooking.status] || STATUS_CONFIG.PENDING;
                  return (
                    <span className="px-3 py-1 rounded-full text-xs font-black"
                      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {sc.label}
                    </span>
                  );
                })()}
                {selectedBooking.payment?.upiStatus && (() => {
                  const uc = UPI_STATUS_CONFIG[selectedBooking.payment.upiStatus];
                  return uc ? (
                    <span className="text-xs font-bold" style={{ color: uc.color }}>{uc.label}</span>
                  ) : null;
                })()}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
                  UPI
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Customer */}
                <div className="p-4 rounded-2xl space-y-1"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] uppercase tracking-widest font-black mb-2" style={{ color: '#4b5563' }}>Customer</p>
                  <p className="font-bold text-white">{selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</p>
                  <p style={{ color: '#6b7280' }}>{selectedBooking.user?.email}</p>
                  {selectedBooking.user?.phone && <p style={{ color: '#6b7280' }}>{selectedBooking.user.phone}</p>}
                </div>

                {/* Movie & Show */}
                <div className="p-4 rounded-2xl space-y-1"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] uppercase tracking-widest font-black mb-2" style={{ color: '#4b5563' }}>Movie & Show</p>
                  <p className="font-bold text-white">{selectedBooking.show?.movie?.title}</p>
                  <p style={{ color: '#9ca3af' }}>{selectedBooking.show?.screen?.theatre?.name} • {selectedBooking.show?.screen?.name}</p>
                  {selectedBooking.show?.startTime && (
                    <p style={{ color: '#a78bfa' }}>
                      {new Date(selectedBooking.show.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>

                {/* Seats */}
                <div className="p-4 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] uppercase tracking-widest font-black mb-2" style={{ color: '#4b5563' }}>Seats ({selectedBooking.seats?.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBooking.seats?.map((s) => (
                      <span key={s.seatId || s.id}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                        style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)' }}>
                        {s.seat?.label || s.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* UPI Payment */}
                <div className="p-4 rounded-2xl space-y-2"
                  style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <p className="text-[10px] uppercase tracking-widest font-black mb-2" style={{ color: '#4b5563' }}>UPI Payment Details</p>
                  {[
                    { label: 'Total',          value: `₹${(selectedBooking.grandTotal || selectedBooking.totalAmount)?.toFixed(0)}` },
                    { label: 'Method',         value: 'UPI' },
                    { label: 'Transaction ID', value: selectedBooking.payment?.transactionId || '—', mono: true },
                    { label: 'Merchant ID',    value: selectedBooking.payment?.merchantUpiId || 'cinemax@upi', mono: true },
                    ...(selectedBooking.payment?.paidAt ? [{ label: 'Paid at', value: new Date(selectedBooking.payment.paidAt).toLocaleString('en-IN') }] : []),
                    ...(selectedBooking.payment?.expiresAt ? [{ label: 'Expired at', value: new Date(selectedBooking.payment.expiresAt).toLocaleString('en-IN') }] : []),
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="flex justify-between items-baseline gap-4">
                      <span style={{ color: '#6b7280' }}>{label}</span>
                      <span className={mono ? 'font-mono text-[10px]' : 'font-bold'} style={{ color: '#e5e7eb' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                {selectedBooking.status === 'CONFIRMED' && (
                  <>
                    <button
                      onClick={() => handleDownloadTicket(selectedBooking.id, selectedBooking.bookingNumber)}
                      disabled={downloading === selectedBooking.id}
                      className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                      {downloading === selectedBooking.id ? <FiLoader size={13} className="animate-spin" /> : <FiDownload size={13} />}
                      Download Invoice
                    </button>
                    <button
                      onClick={() => handleRefund(selectedBooking.id)}
                      disabled={refunding}
                      className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                      {refunding ? <FiLoader size={13} className="animate-spin" /> : <FiDollarSign size={13} />}
                      Process Refund
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="py-3 px-6 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
