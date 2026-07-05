import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { bookingAPI } from '../services/api.js';
import toast from 'react-hot-toast';
import { FiDownload, FiX, FiCalendar, FiMapPin, FiFilm, FiLoader } from 'react-icons/fi';
import { MdEventSeat } from 'react-icons/md';

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmed', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  PENDING: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  REFUNDED: { label: 'Refunded', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  EXPIRED: { label: 'Expired', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
};

export default function BookingHistory() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-bookings', activeTab],
    queryFn: () => bookingAPI.getMy({ status: activeTab === 'ALL' ? undefined : activeTab }),
  });

  const bookings = data?.data?.data?.bookings || [];

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      await bookingAPI.cancel(bookingId, 'Customer requested');
      toast.success('Booking cancelled. Refund initiated.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownload = async (bookingId, bookingNumber) => {
    setDownloadingId(bookingId);
    try {
      const res = await bookingAPI.downloadTicket(bookingId);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${bookingNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const tabs = ['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED', 'REFUNDED'];

  return (
    <div className="min-h-screen py-8">
      <div className="container-app max-w-4xl">
        <h1 className="text-3xl font-black mb-8" style={{ color: '#f0f0f8' }}>🎫 My Bookings</h1>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab ? 'gradient-bg text-white' : 'text-gray-400 hover:text-white'
              }`}
              style={activeTab !== tab ? { background: '#1a1a2e', border: '1px solid #2d2d4a' } : {}}
            >
              {tab === 'ALL' ? 'All Bookings' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl shimmer" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#f0f0f8' }}>No bookings yet</h3>
            <p className="mb-6" style={{ color: '#606080' }}>Book your first movie ticket!</p>
            <Link to="/" className="btn-primary px-8 py-3">Browse Movies</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, i) => {
              const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
              const isUpcoming = new Date(booking.show?.startTime) > new Date();
              const canCancel = booking.status === 'CONFIRMED' && isUpcoming;
              const canDownload = booking.status === 'CONFIRMED';

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-5 flex flex-col sm:flex-row gap-4"
                >
                  {/* Poster */}
                  <img
                    src={booking.show?.movie?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100'}
                    alt={booking.show?.movie?.title}
                    className="w-16 h-22 object-cover rounded-xl flex-shrink-0"
                    style={{ height: '88px' }}
                  />

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold" style={{ color: '#f0f0f8' }}>{booking.show?.movie?.title}</h3>
                        <p className="text-xs mt-0.5" style={{ color: '#606080' }}>#{booking.bookingNumber}</p>
                      </div>
                      <span className="badge flex-shrink-0 text-xs px-3 py-1 rounded-full font-semibold"
                        style={{ background: statusCfg.bg, color: statusCfg.color }}>
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-xs" style={{ color: '#a0a0c0' }}>
                      <div className="flex items-center gap-1">
                        <FiMapPin size={12} className="text-purple-400" />
                        {booking.show?.screen?.theatre?.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <FiCalendar size={12} className="text-purple-400" />
                        {new Date(booking.show?.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <div className="flex items-center gap-1">
                        <MdEventSeat size={12} className="text-purple-400" />
                        {booking.seats?.map((s) => s.seat?.label).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="font-bold" style={{ color: '#7c3aed' }}>₹{booking.grandTotal?.toFixed(0)}</span>
                      <div className="flex gap-2">
                        {canDownload && (
                          <button
                            onClick={() => handleDownload(booking.id, booking.bookingNumber)}
                            disabled={downloadingId === booking.id}
                            className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-lg"
                          >
                            {downloadingId === booking.id
                              ? <FiLoader className="animate-spin" size={12} />
                              : <FiDownload size={12} />
                            }
                            Download
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancellingId === booking.id}
                            className="px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                          >
                            {cancellingId === booking.id ? <FiLoader className="animate-spin" size={12} /> : <FiX size={12} />}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
