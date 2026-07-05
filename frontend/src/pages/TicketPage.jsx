import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FiPrinter, FiDownload, FiArrowLeft, FiClock, 
  FiMapPin, FiTv, FiLayers, FiAlertCircle, FiLoader, 
  FiCheckCircle 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { bookingAPI } from '../services/api.js';

export default function TicketPage() {
  const { id } = useParams();
  const [downloading, setDownloading] = useState(false);

  // Fetch booking details
  const { data: bookingResponse, isLoading, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingAPI.getById(id),
  });

  const booking = bookingResponse?.data?.data?.booking;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await bookingAPI.downloadTicket(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cinemax_ticket_${booking?.bookingNumber || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Ticket PDF downloaded! 📥');
    } catch (err) {
      toast.error('Failed to download ticket PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a12' }}>
        <FiLoader size={48} className="animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center" style={{ background: '#0a0a12' }}>
        <FiAlertCircle size={56} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">Ticket Not Found</h2>
        <p className="mb-6" style={{ color: '#a0a0c0' }}>We couldn't retrieve the ticket details. It might not exist or you might not have permission.</p>
        <Link to="/bookings" className="btn-primary px-6 py-2.5">Back to My Bookings</Link>
      </div>
    );
  }

  const show = booking.show;
  const movie = show?.movie;
  const screen = show?.screen;
  const theatre = screen?.theatre;

  const showDate = show?.startTime ? format(parseISO(show.startTime), 'EEEE, d MMMM yyyy') : '';
  const showTime = show?.startTime ? format(parseISO(show.startTime), 'hh:mm a') : '';

  return (
    <div className="min-h-screen pb-20 pt-8 print:p-0 print:bg-white" style={{ background: '#0a0a12' }}>
      <div className="container-app max-w-2xl space-y-6">
        
        {/* Navigation back */}
        <div className="flex justify-between items-center print:hidden">
          <Link to="/bookings" className="flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: '#a0a0c0' }}>
            <FiArrowLeft /> Back to Bookings
          </Link>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer"
              style={{ background: '#1e1e35', borderColor: '#2d2d4a', color: '#f0f0f8' }}
            >
              <FiPrinter size={14} /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer"
              style={{ background: '#7c3aed', borderColor: '#7c3aed', color: 'white' }}
            >
              {downloading ? <FiLoader className="animate-spin" size={14} /> : <FiDownload size={14} />}
              PDF Ticket
            </button>
          </div>
        </div>

        {/* Ticket Card Container */}
        <div className="rounded-3xl overflow-hidden border shadow-2xl print:border-none print:shadow-none" style={{ background: '#12121e', borderColor: '#2d2d4a' }}>
          
          {/* Top Banner (Header) */}
          <div className="p-6 md:p-8 flex items-center justify-between border-b print:border-b-2 print:border-gray-200" style={{ borderColor: '#2d2d4a', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.05))' }}>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                {booking.status}
              </span>
              <h2 className="text-xl font-black mt-2 print:text-black">CineMax Ticket</h2>
              <p className="text-xs" style={{ color: '#606080' }}>Booking ID: {booking.bookingNumber || booking.id}</p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl">🎬</div>
              <span className="text-sm font-black gradient-text print:text-purple-600">CineMax</span>
            </div>
          </div>

          {/* Ticket Information body */}
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Movie Header Detail */}
            <div className="flex gap-6">
              <div className="w-20 shrink-0 rounded-xl overflow-hidden border print:border-gray-200" style={{ borderColor: '#2d2d4a' }}>
                <img 
                  src={movie?.posterUrl || 'https://images.unsplash.com/photo-1542204172-e7052809f852?w=100&q=80'} 
                  alt={movie?.title}
                  className="w-full aspect-[2/3] object-cover"
                />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-2xl font-black text-white print:text-black">{movie?.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs" style={{ color: '#a0a0c0' }}>
                  <span className="px-2 py-0.5 rounded" style={{ background: '#1e1e35', border: '1px solid #2d2d4a', color: '#f59e0b' }}>
                    {movie?.ageRating || 'U/A'}
                  </span>
                  <span className="px-2 py-0.5 rounded" style={{ background: '#1e1e35', border: '1px solid #2d2d4a' }}>
                    {show?.format.replace('_', ' ') || '2D'}
                  </span>
                  <span className="px-2 py-0.5 rounded" style={{ background: '#1e1e35', border: '1px solid #2d2d4a' }}>
                    {show?.language?.name || 'English'}
                  </span>
                </div>
              </div>
            </div>

            <hr style={{ borderColor: '#2d2d4a' }} className="print:border-gray-200" />

            {/* Grid Information */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: '#606080' }}>Theatre</span>
                <p className="text-sm font-extrabold text-white print:text-black">{theatre?.name || 'Multiplex'}</p>
                <p className="text-xs flex items-center gap-1" style={{ color: '#a0a0c0' }}>
                  <FiMapPin size={12} /> {theatre?.address || ''}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: '#606080' }}>Screen & Format</span>
                <p className="text-sm font-extrabold text-white print:text-black">{screen?.name || 'Screen 1'}</p>
                <p className="text-xs" style={{ color: '#a0a0c0' }}>{show?.format.replace('_', ' ')} Projection</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: '#606080' }}>Show Date</span>
                <p className="text-sm font-extrabold text-white print:text-black flex items-center gap-1.5">
                  <FiCalendar size={14} className="text-purple-400" /> {showDate}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: '#606080' }}>Show Time</span>
                <p className="text-sm font-extrabold text-white print:text-black flex items-center gap-1.5">
                  <FiClock size={14} className="text-purple-400" /> {showTime}
                </p>
              </div>

              <div className="space-y-1 col-span-2">
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: '#606080' }}>Booked Seats</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {booking.seats?.map((seat) => (
                    <span 
                      key={seat.id} 
                      className="px-3 py-1 rounded-lg text-xs font-black text-white"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                    >
                      {seat.seat?.row}{seat.seat?.column} ({seat.seat?.seatType})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <hr style={{ borderColor: '#2d2d4a' }} className="print:border-gray-200" />

            {/* QR Code and Scan info */}
            <div className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-2xl" style={{ background: '#1a1a2e', border: '1px solid #2d2d4a' }}>
              
              {/* Fake animated QR code */}
              <div className="w-32 h-32 shrink-0 bg-white p-3 rounded-2xl flex flex-col justify-between items-center relative overflow-hidden group shadow-lg">
                {/* Visual barcode dots simulating QR code */}
                <div className="w-full h-full flex flex-col justify-between gap-1 select-none">
                  {Array.from({ length: 10 }).map((_, r) => (
                    <div key={r} className="flex justify-between gap-1 w-full flex-1">
                      {Array.from({ length: 10 }).map((_, c) => {
                        const filled = (r + c) % 2 === 0 || (r * c) % 3 === 0 || (r < 3 && c < 3) || (r > 6 && c < 3) || (r < 3 && c > 6);
                        return (
                          <div 
                            key={c} 
                            className={`flex-1 ${filled ? 'bg-black' : 'bg-transparent'}`} 
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                
                {/* Center scan line anim */}
                <div className="absolute inset-x-0 h-0.5 bg-purple-500 animate-pulse shadow-md top-1/2" />
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <h4 className="font-extrabold text-white text-base print:text-black">Scan QR at the Cinema</h4>
                <p className="text-xs" style={{ color: '#a0a0c0' }}>
                  Please present this QR code at the ticket checker counter. You will receive physical tickets or direct entry to the screen.
                </p>
                <div className="flex justify-center md:justify-start items-center gap-1.5 text-xs text-green-400 font-bold">
                  <FiCheckCircle /> Verified Booking
                </div>
              </div>
            </div>

            <hr style={{ borderColor: '#2d2d4a' }} className="print:border-gray-200" />

            {/* Price breakdown */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-base print:text-black">Payment Receipt</h4>
              
              <div className="space-y-2 text-xs" style={{ color: '#a0a0c0' }}>
                <div className="flex justify-between">
                  <span>Tickets Price ({booking.seats?.length} Seats)</span>
                  <span className="font-bold text-white print:text-black">₹{booking.subTotal?.toFixed(2)}</span>
                </div>
                
                {booking.couponDiscount > 0 && (
                  <div className="flex justify-between text-pink-500">
                    <span>Coupon Discount</span>
                    <span className="font-bold">-₹{booking.couponDiscount?.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Convenience Fee & GST</span>
                  <span className="font-bold text-white print:text-black">₹{(booking.convenienceFee + booking.gstAmount)?.toFixed(2)}</span>
                </div>

                <hr style={{ borderColor: '#2d2d4a' }} className="my-1 print:border-gray-200" />

                <div className="flex justify-between text-sm font-extrabold text-white print:text-black">
                  <span>Grand Total Paid</span>
                  <span className="text-base text-purple-400 print:text-purple-600">₹{booking.grandTotal?.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
