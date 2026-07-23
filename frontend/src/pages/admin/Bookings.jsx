import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiFilter, FiBookmark, FiDollarSign, FiUser, 
  FiCalendar, FiMapPin, FiEye, FiX, FiCheckCircle, FiLoader, FiFilm 
} from 'react-icons/fi';
import { HiOutlineTicket } from 'react-icons/hi2';

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmed', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  PENDING: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
  REFUNDED: { label: 'Refunded', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
};

export default function AdminBookings() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', search, status],
    queryFn: () => adminAPI.getBookings({ search: search || undefined, status: status || undefined }),
  });

  const bookings = data?.data?.data?.bookings || [];

  return (
    <div className="space-y-8 text-slate-100 selection:bg-purple-500 selection:text-white">
      
      {/* Header Banner */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            🎟️ Booking Transactions & Audit
          </h1>
          <p className="text-xs text-slate-400">View real-time customer ticket orders, payments, seats, and refund statuses</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking #, customer email or movie..."
            className="w-full glass-input text-xs pl-9 pr-4 py-2.5 rounded-xl outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FiFilter className="text-purple-400 shrink-0" size={14} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="glass-input text-xs px-3 py-2.5 rounded-xl outline-none bg-slate-900 text-slate-300 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl shimmer" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border border-white/10 space-y-3">
          <HiOutlineTicket className="text-4xl text-purple-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-slate-400">Try clearing filters or search keywords.</p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl border border-white/15 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Booking #</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Movie</th>
                  <th className="py-4 px-6">Theatre</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-200">
                {bookings.map((b) => {
                  const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.CONFIRMED;
                  const movie = b.show?.movie;
                  const theatre = b.show?.screen?.theatre;
                  const user = b.user;

                  return (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-purple-300">
                        #{b.bookingNumber}
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-white">{user?.firstName} {user?.lastName}</p>
                        <p className="text-[10px] text-slate-400">{user?.email}</p>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-200">
                        {movie?.title || 'Movie'}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {theatre?.name}, {theatre?.city}
                      </td>
                      <td className="py-4 px-6 font-black text-amber-300">
                        ₹{b.totalAmount?.toFixed(0)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-xl transition-colors inline-flex items-center gap-1 text-xs font-bold"
                        >
                          <FiEye /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Booking Inspector */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 md:p-8 rounded-3xl border border-white/15 max-w-md w-full shadow-2xl space-y-5 bg-slate-900/95"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-purple-300 font-bold">
                    #{selectedBooking.bookingNumber}
                  </span>
                  <h3 className="text-base font-black text-white">Booking Details Inspector</h3>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-2 text-slate-400 hover:text-white">
                  <FiX size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Customer Info</p>
                  <p className="font-extrabold text-white">{selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</p>
                  <p className="text-slate-400">{selectedBooking.user?.email}</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Movie & Showtime</p>
                  <p className="font-extrabold text-white">{selectedBooking.show?.movie?.title}</p>
                  <p className="text-slate-400">
                    {selectedBooking.show?.screen?.theatre?.name} • {new Date(selectedBooking.show?.startTime).toLocaleString()}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Seats & Payment</p>
                  <p className="font-bold text-purple-300">
                    Seats ({selectedBooking.seats?.length}): {selectedBooking.seats?.map(s => s.label || `${s.row}${s.number}`).join(', ')}
                  </p>
                  <p className="font-black text-amber-300 text-sm mt-1">Total Paid: ₹{selectedBooking.totalAmount?.toFixed(0)}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
              >
                Close Inspector
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
