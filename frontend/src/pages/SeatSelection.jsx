import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { showAPI } from '../services/api.js';
import { useBookingStore, useAuthStore } from '../store/index.js';
import { useSocket } from '../context/SocketContext.jsx';
import toast from 'react-hot-toast';
import { FiClock, FiZoomIn, FiZoomOut, FiArrowRight, FiX, FiCheck, FiFilm, FiShield } from 'react-icons/fi';

const SEAT_TYPE_COLORS = {
  SILVER: '#64748b',
  GOLD: '#f59e0b',
  PREMIUM: '#7c3aed',
  PLATINUM: '#6366f1',
  VIP: '#ec4899',
  RECLINER: '#10b981',
  COUPLE: '#f97316',
  WHEELCHAIR: '#3b82f6',
};

const SEAT_TYPE_PRICES = {
  SILVER: 150,
  GOLD: 220,
  PREMIUM: 300,
  PLATINUM: 380,
  VIP: 450,
  RECLINER: 500,
  COUPLE: 600,
  WHEELCHAIR: 120,
};

export default function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedSeats, selectSeat, deselectSeat, clearSeats, setCurrentShow } = useBookingStore();
  const [zoom, setZoom] = useState(1);
  const { socket } = useSocket();
  const [realtimeLocks, setRealtimeLocks] = useState(new Map());
  const [timeLeft, setTimeLeft] = useState(null);
  const [sessionStart] = useState(Date.now());

  const isProceeding = useRef(false);
  const selectedSeatsRef = useRef(selectedSeats);

  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);

  const handleClear = () => {
    selectedSeats.forEach((seat) => {
      socket?.emit('seat:deselect', { seatId: seat.id, showId });
    });
    clearSeats();
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => showAPI.getById(showId),
  });

  const show = data?.data?.data?.show;

  useEffect(() => {
    if (show) setCurrentShow(show);
  }, [show]);

  // Session countdown (10 minutes lock)
  useEffect(() => {
    const TIMEOUT = 10 * 60 * 1000;
    const tick = setInterval(() => {
      const elapsed = Date.now() - sessionStart;
      const remaining = TIMEOUT - elapsed;
      if (remaining <= 0) {
        selectedSeatsRef.current.forEach((seat) => {
          socket?.emit('seat:deselect', { seatId: seat.id, showId });
        });
        clearSeats();
        toast.error('Seat selection timer expired. Please reselect your seats.');
        navigate(-1);
      } else {
        setTimeLeft(Math.ceil(remaining / 1000));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [socket, showId]);

  // Socket.io listeners
  useEffect(() => {
    if (!socket || !showId) return;

    socket.emit('show:join', showId);

    const handleSeatLocked = ({ seatId, userId }) => {
      setRealtimeLocks((prev) => new Map(prev).set(seatId, userId));
    };

    const handleSeatReleased = ({ seatId }) => {
      setRealtimeLocks((prev) => {
        const next = new Map(prev);
        next.delete(seatId);
        return next;
      });
    };

    const handleSeatBooked = ({ seatId }) => {
      setRealtimeLocks((prev) => new Map(prev).set(seatId, 'BOOKED'));
    };

    socket.on('seat:locked', handleSeatLocked);
    socket.on('seat:released', handleSeatReleased);
    socket.on('seat:booked', handleSeatBooked);

    return () => {
      socket.emit('show:leave', showId);
      socket.off('seat:locked', handleSeatLocked);
      socket.off('seat:released', handleSeatReleased);
      socket.off('seat:booked', handleSeatBooked);

      if (!isProceeding.current) {
        selectedSeatsRef.current.forEach((seat) => {
          socket.emit('seat:deselect', { seatId: seat.id, showId });
        });
        clearSeats();
      }
    };
  }, [socket, showId]);

  const handleSeatClick = useCallback((seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'LOCKED') return;
    if (realtimeLocks.has(seat.id) && realtimeLocks.get(seat.id) !== user?.id) return;

    const isSelected = selectedSeats.some((s) => s.id === seat.id);

    if (isSelected) {
      deselectSeat(seat.id);
      socket?.emit('seat:deselect', { seatId: seat.id, showId });
    } else {
      if (selectedSeats.length >= 10) {
        toast.error('Maximum 10 seats allowed per booking');
        return;
      }
      selectSeat({ ...seat, showId });
      socket?.emit('seat:select', { seatId: seat.id, showId });
    }
  }, [selectedSeats, socket, user, realtimeLocks, showId]);

  const getSeatStatus = (seat) => {
    if (seat.status === 'BOOKED') return 'booked';
    if (realtimeLocks.get(seat.id) === 'BOOKED') return 'booked';
    if (realtimeLocks.has(seat.id) && realtimeLocks.get(seat.id) !== user?.id) return 'locked';
    if (selectedSeats.some((s) => s.id === seat.id)) return 'selected';
    return 'available';
  };

  const handleProceed = () => {
    if (!selectedSeats.length) {
      toast.error('Please select at least one seat');
      return;
    }
    isProceeding.current = true;
    navigate('/booking/summary');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const seatsByRow = {};
  show?.screen?.seats?.forEach((seat) => {
    if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
    seatsByRow[seat.row].push(seat);
  });

  const totalPrice = selectedSeats.reduce((s, seat) => s + (seat.price || SEAT_TYPE_PRICES[seat.seatType] || 250), 0);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#070710]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-400">Loading Cinema Seat Map...</p>
      </div>
    </div>
  );

  if (error || !show) return (
    <div className="min-h-screen flex items-center justify-center bg-[#070710]">
      <p className="text-sm font-bold text-red-400">Show details not found</p>
    </div>
  );

  return (
    <div className="min-h-screen pb-36 bg-[#070710]">
      
      {/* Sticky Header Bar */}
      <div className="glass sticky top-16 z-30 py-3 border-b border-white/10">
        <div className="container-app flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-base text-white flex items-center gap-2">
              <FiFilm className="text-purple-400" />
              {show.movie?.title}
            </h1>
            <p className="text-xs text-slate-400">
              {show.screen?.theatre?.name} • {show.screen?.name} • {new Date(show.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          {/* Timer Clock */}
          {timeLeft && (
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border backdrop-blur-md ${
              timeLeft < 120 
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              <FiClock size={14} />
              <span>Seats Locked: {formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Zoom Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))} className="p-2 rounded-xl glass-card text-slate-300 hover:text-white">
              <FiZoomOut size={16} />
            </button>
            <span className="text-xs font-semibold text-slate-400">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} className="p-2 rounded-xl glass-card text-slate-300 hover:text-white">
              <FiZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Screen & Seat Grid Container */}
      <div className="container-app py-10 overflow-x-auto">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.25s ease' }}>
          
          {/* Curved 3D Cinema Screen Arc */}
          <div className="screen-arc mx-auto max-w-xl" />

          {/* Seat Layout Matrix */}
          <div className="flex flex-col gap-2.5 items-center mt-6">
            {Object.entries(seatsByRow).map(([row, seats]) => (
              <div key={row} className="flex items-center gap-3">
                {/* Row label */}
                <span className="w-6 text-center text-xs font-bold text-slate-500">{row}</span>

                {/* Seats */}
                <div className="flex gap-2">
                  {seats.map((seat) => {
                    const status = getSeatStatus(seat);
                    const seatColor = SEAT_TYPE_COLORS[seat.seatType] || '#64748b';

                    return (
                      <motion.button
                        key={seat.id}
                        whileHover={status === 'available' ? { scale: 1.25, zIndex: 20 } : {}}
                        whileTap={status === 'available' ? { scale: 0.9 } : {}}
                        onClick={() => handleSeatClick(seat)}
                        title={`Row ${seat.row}${seat.number} • ${seat.seatType} • ₹${seat.price || SEAT_TYPE_PRICES[seat.seatType]}`}
                        className={`relative w-7 h-6 rounded-t-lg text-[9px] font-extrabold flex items-center justify-center transition-all ${
                          status === 'available'
                            ? 'cursor-pointer hover:shadow-lg'
                            : 'cursor-not-allowed'
                        }`}
                        style={{
                          background:
                            status === 'selected'
                              ? 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)'
                              : status === 'booked'
                              ? 'rgba(239,68,68,0.15)'
                              : status === 'locked'
                              ? 'rgba(245,158,11,0.2)'
                              : `${seatColor}20`,
                          border: `1px solid ${
                            status === 'selected'
                              ? '#f472b6'
                              : status === 'booked'
                              ? 'rgba(239,68,68,0.35)'
                              : status === 'locked'
                              ? 'rgba(245,158,11,0.4)'
                              : `${seatColor}50`
                          }`,
                          boxShadow: status === 'selected' ? '0 0 12px rgba(236,72,153,0.6)' : undefined
                        }}
                      >
                        {status === 'selected' ? (
                          <FiCheck size={11} className="text-white" />
                        ) : (
                          <span className="text-[9px] opacity-70 text-slate-300">{seat.number}</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Row label right */}
                <span className="w-6 text-center text-xs font-bold text-slate-500">{row}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 glass-card p-4 rounded-2xl max-w-xl mx-auto border border-white/10">
          {[
            { label: 'Available', color: 'rgba(30,30,55,0.8)', border: '#363660' },
            { label: 'Selected', color: '#7c3aed', border: '#f472b6' },
            { label: 'Booked', color: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.4)' },
            { label: 'Locked by someone', color: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)' },
          ].map(({ label, color, border }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <div className="w-5 h-4 rounded-t-md shadow-sm" style={{ background: color, border: `1px solid ${border}` }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Seat Tier Pricing Tags */}
        <div className="mt-6 flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          {Object.entries(SEAT_TYPE_PRICES).map(([type, price]) => (
            <div
              key={type}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card border text-xs font-bold"
              style={{ borderColor: `${SEAT_TYPE_COLORS[type]}40` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: SEAT_TYPE_COLORS[type] }} />
              <span className="text-slate-300">{type}</span>
              <span style={{ color: SEAT_TYPE_COLORS[type] }}>₹{price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Bottom Summary & Proceed Bar */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10 py-4 shadow-2xl backdrop-blur-2xl"
          >
            <div className="container-app flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat.id}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center gap-1"
                    >
                      {seat.label || `${seat.row}${seat.number}`}
                      <button onClick={() => deselectSeat(seat.id)} className="hover:text-pink-400 ml-0.5">
                        <FiX size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  Total: <span className="text-white font-extrabold text-base ml-1">₹{totalPrice.toFixed(0)}</span> ({selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleClear} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200">
                  Clear
                </button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleProceed}
                  className="btn-primary px-7 py-3 text-xs font-extrabold rounded-2xl flex items-center gap-2 shadow-2xl glow-purple"
                >
                  <span>Proceed to Payment</span>
                  <FiArrowRight size={15} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
