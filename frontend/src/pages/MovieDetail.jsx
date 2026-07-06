import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, FiCalendar, FiGlobe, FiStar, FiHeart, FiBookmark, 
  FiMapPin, FiMessageSquare, FiSend, FiPlay, FiAlertTriangle, FiAlertCircle 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { movieAPI, showAPI } from '../services/api.js';
import { useAuthStore, useUIStore, useBookingStore } from '../store/index.js';
import { useSocket } from '../context/SocketContext.jsx';
import LoadingScreen from '../components/ui/LoadingScreen.jsx';

export default function MovieDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { isAuthenticated, user } = useAuthStore();
  const { selectedCity } = useUIStore();
  const { setCurrentShow, clearBooking } = useBookingStore();
  const { socket } = useSocket();

  // Listen for real-time seat/show availability updates
  useEffect(() => {
    if (!socket) return;

    const handleShowUpdate = (data) => {
      // Invalidate movie-shows query to refresh seat availability counts instantly
      queryClient.invalidateQueries({ queryKey: ['movie-shows'] });
    };

    socket.on('show:update', handleShowUpdate);

    return () => {
      socket.off('show:update', handleShowUpdate);
    };
  }, [socket, queryClient]);

  // Selected date for showtimes (default to today)
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Review form state
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Fetch movie details
  const { data: movieResponse, isLoading: movieLoading, error: movieError } = useQuery({
    queryKey: ['movie', slug],
    queryFn: () => movieAPI.getBySlug(slug),
  });

  const movie = movieResponse?.data?.data?.movie;

  // Fetch shows
  const { data: showsResponse, isLoading: showsLoading } = useQuery({
    queryKey: ['movie-shows', movie?.id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => movieAPI.getShows(movie.id, { date: format(selectedDate, 'yyyy-MM-dd') }),
    enabled: !!movie?.id,
  });

  const shows = showsResponse?.data?.data?.shows || [];

  // Filter shows by selected city on the client
  const filteredShows = shows.filter(
    (show) => show.screen?.theatre?.city?.toLowerCase() === selectedCity?.toLowerCase()
  );

  // Group shows by Theatre
  const groupedShows = filteredShows.reduce((acc, show) => {
    const theatre = show.screen?.theatre;
    if (!theatre) return acc;
    if (!acc[theatre.id]) {
      acc[theatre.id] = {
        info: theatre,
        shows: [],
      };
    }
    acc[theatre.id].shows.push(show);
    return acc;
  }, {});

  // Generate date options (today + 6 days)
  const dateOptions = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Wishlist Mutation
  const wishlistMutation = useMutation({
    mutationFn: () => movieAPI.toggleWishlist(movie.id),
    onSuccess: (res) => {
      queryClient.setQueryData(['movie', slug], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              movie: {
                ...old.data.data.movie,
                userWishlisted: res.data.data.wishlisted,
              }
            }
          }
        };
      });
      toast.success(res.data.message);
    },
    onError: () => toast.error('Failed to update wishlist'),
  });

  // Favorite Mutation
  const favoriteMutation = useMutation({
    mutationFn: () => movieAPI.toggleFavorite(movie.id),
    onSuccess: (res) => {
      queryClient.setQueryData(['movie', slug], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              movie: {
                ...old.data.data.movie,
                userFavorited: res.data.data.favorited,
              }
            }
          }
        };
      });
      toast.success(res.data.message);
    },
    onError: () => toast.error('Failed to update favorites'),
  });

  // Submit Review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewContent.trim()) {
      toast.error('Please write some content for the review');
      return;
    }
    setReviewLoading(true);
    try {
      await movieAPI.addReview(movie.id, {
        title: reviewTitle || 'Review',
        content: reviewContent,
        score: ratingInput,
        spoiler: isSpoiler,
      });
      toast.success('Review submitted successfully! 🌟');
      setReviewTitle('');
      setReviewContent('');
      setIsSpoiler(false);
      // Refetch movie details to show new review
      queryClient.invalidateQueries(['movie', slug]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleShowSelection = (show) => {
    if (!isAuthenticated) {
      toast.error('Please log in to book tickets');
      navigate('/login', { state: { from: { pathname: `/shows/${show.id}/seats` } } });
      return;
    }
    clearBooking();
    setCurrentShow(show);
    navigate(`/shows/${show.id}/seats`);
  };

  if (movieLoading) return <LoadingScreen />;

  if (movieError || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center" style={{ background: '#0a0a12' }}>
        <FiAlertCircle size={56} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">Movie Not Found</h2>
        <p className="mb-6" style={{ color: '#a0a0c0' }}>The movie details you are trying to view do not exist.</p>
        <Link to="/" className="btn-primary px-6 py-2.5">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a12' }}>
      {/* Banner Backdrop */}
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
        <img 
          src={movie.bannerUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80'} 
          alt={movie.title}
          className="w-full h-full object-cover scale-105 blur-sm brightness-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/50 to-transparent" />
      </div>

      {/* Movie Content Overlay */}
      <div className="container-app -mt-64 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Side: Poster & Fast Info */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl border mb-6" style={{ borderColor: '#2d2d4a' }}>
              <img 
                src={movie.posterUrl || 'https://images.unsplash.com/photo-1542204172-e7052809f852?w=500&q=80'} 
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => favoriteMutation.mutate()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border text-sm transition-all"
                style={{
                  background: movie.userFavorited ? 'rgba(236,72,153,0.1)' : '#1a1a2e',
                  borderColor: movie.userFavorited ? '#ec4899' : '#2d2d4a',
                  color: movie.userFavorited ? '#ec4899' : '#a0a0c0'
                }}
              >
                <FiHeart size={16} fill={movie.userFavorited ? '#ec4899' : 'none'} />
                {movie.userFavorited ? 'Favorited' : 'Favorite'}
              </button>
              <button 
                onClick={() => wishlistMutation.mutate()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border text-sm transition-all"
                style={{
                  background: movie.userWishlisted ? 'rgba(124,58,237,0.1)' : '#1a1a2e',
                  borderColor: movie.userWishlisted ? '#7c3aed' : '#2d2d4a',
                  color: movie.userWishlisted ? '#7c3aed' : '#a0a0c0'
                }}
              >
                <FiBookmark size={16} fill={movie.userWishlisted ? '#7c3aed' : 'none'} />
                {movie.userWishlisted ? 'Watchlisted' : 'Watchlist'}
              </button>
            </div>
          </div>

          {/* Right Side: Details & Showtimes */}
          <div className="flex-1 space-y-8">
            <div>
              {movie.tagline && (
                <span className="text-sm font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#7c3aed' }}>
                  {movie.tagline}
                </span>
              )}
              <h1 className="text-4xl lg:text-5xl font-black mb-4 leading-tight">{movie.title}</h1>
              
              {/* Badges / Meta */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm" style={{ color: '#a0a0c0' }}>
                <div className="flex items-center gap-1.5">
                  <FiStar className="text-amber-500 fill-amber-500" size={16} />
                  <span className="font-bold text-white">{movie.imdbRating?.toFixed(1) || '0.0'}</span>
                  <span>/10 (IMDb)</span>
                </div>
                {movie.avgRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <FiStar className="text-pink-500 fill-pink-500" size={16} />
                    <span className="font-bold text-white">{movie.avgRating.toFixed(1)}</span>
                    <span>User Avg</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <FiClock size={16} />
                  <span>{movie.duration} mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiGlobe size={16} />
                  <span>{movie.languages?.map(l => l.language.name).join(', ')}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold" style={{ background: '#1e1e35', border: '1px solid #2d2d4a', color: '#f59e0b' }}>
                  {movie.ageRating || 'UA'}
                </span>
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold" style={{ color: '#f0f0f8' }}>Synopsis</h3>
              <p className="leading-relaxed" style={{ color: '#a0a0c0' }}>{movie.synopsis}</p>
            </div>

            {/* Cast & Crew */}
            {movie.cast?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Cast</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                  {movie.cast.map((c) => (
                    <div key={c.id} className="w-24 shrink-0 text-center space-y-2">
                      <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border" style={{ borderColor: '#2d2d4a' }}>
                        <img 
                          src={c.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'} 
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold truncate text-white">{c.name}</p>
                        <p className="text-[10px] truncate" style={{ color: '#606080' }}>as {c.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Showtimes & Booking Section */}
            <div className="card p-6 md:p-8 space-y-6" id="booking-section">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black flex items-center gap-2">
                    <span>🎫</span> Book Tickets
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#606080' }}>
                    Select a show date and time slot to book your tickets in {selectedCity}.
                  </p>
                </div>
              </div>

              {/* Date Selector */}
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin">
                {dateOptions.map((date) => {
                  const isActive = isSameDay(date, selectedDate);
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border text-center transition-all cursor-pointer select-none shrink-0"
                      style={{
                        background: isActive ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : '#12121e',
                        borderColor: isActive ? 'transparent' : '#2d2d4a',
                        minWidth: '70px',
                      }}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: isActive ? 'rgba(255,255,255,0.7)' : '#606080' }}>
                        {format(date, 'EEE')}
                      </span>
                      <span className="text-lg font-black text-white">{format(date, 'dd')}</span>
                      <span className="text-[10px] font-semibold" style={{ color: isActive ? 'white' : '#a0a0c0' }}>
                        {format(date, 'MMM')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Showtimes Listing */}
              <div className="space-y-6 pt-4">
                {showsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <FiLoader size={28} className="animate-spin text-purple-500" />
                  </div>
                ) : Object.keys(groupedShows).length === 0 ? (
                  <div className="text-center py-12 rounded-2xl bg-secondary border border-dashed" style={{ borderColor: '#2d2d4a' }}>
                    <FiAlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
                    <p className="text-sm font-semibold" style={{ color: '#a0a0c0' }}>No shows available for this date in {selectedCity}.</p>
                    <p className="text-xs mt-1" style={{ color: '#606080' }}>Try choosing a different date or city.</p>
                  </div>
                ) : (
                  Object.values(groupedShows).map((group) => (
                    <div key={group.info.id} className="p-5 rounded-2xl space-y-4" style={{ background: '#12121e', border: '1px solid #2d2d4a' }}>
                      {/* Theatre Info */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-white text-lg">{group.info.name}</h4>
                          <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#606080' }}>
                            <FiMapPin size={12} /> {group.info.address}
                          </p>
                        </div>
                        {/* Facilities info */}
                        <div className="flex gap-2">
                          {group.info.hasFoodCourt && <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ background: '#1e1e35', color: '#a0a0c0' }}>🍔 Food</span>}
                          {group.info.hasParking && <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ background: '#1e1e35', color: '#a0a0c0' }}>🅿️ Parking</span>}
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        {group.shows.map((show) => {
                          const showTime = format(parseISO(show.startTime), 'hh:mm a');
                          const isSoldOut = show.availability === 'SOLD_OUT';
                          const isFilling = show.availability === 'FILLING_FAST';

                          return (
                            <button
                              key={show.id}
                              disabled={isSoldOut}
                              onClick={() => handleShowSelection(show)}
                              className="px-4 py-3 rounded-xl border text-center transition-all cursor-pointer font-bold relative group"
                              style={{
                                background: '#1a1a2e',
                                borderColor: isSoldOut ? '#2d2d2d' : isFilling ? '#f59e0b' : '#3d3d5c',
                                opacity: isSoldOut ? 0.4 : 1,
                              }}
                            >
                              <span className="text-white text-sm block">{showTime}</span>
                              <span className="text-[9px] uppercase tracking-wide block mt-0.5" style={{
                                color: isSoldOut ? '#ef4444' : isFilling ? '#f59e0b' : '#10b981'
                              }}>
                                {show.format.replace('_', ' ')} • {show.language?.name}
                              </span>
                              
                              {/* Hover Seat Count tooltip */}
                              {!isSoldOut && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black text-[9px] font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-25">
                                  {show.availableSeats} / {show.totalSeats} Seats Left
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ratings & Reviews */}
            <div className="card p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <FiMessageSquare /> Reviews ({movie.reviews?.length || 0})
              </h2>

              {/* Add Review Form */}
              {isAuthenticated ? (
                <form onSubmit={handleReviewSubmit} className="space-y-4 p-5 rounded-2xl" style={{ background: '#12121e', border: '1px solid #2d2d4a' }}>
                  <h4 className="font-extrabold text-white text-base">Write a Review</h4>
                  
                  <div className="flex items-center gap-4">
                    {/* Stars */}
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: '#a0a0c0' }}>Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => setRatingInput(stars)}
                            className="text-2xl focus:outline-none"
                          >
                            <FiStar 
                              className={stars <= ratingInput ? 'text-amber-500 fill-amber-500' : 'text-gray-600'} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Spoiler */}
                    <div className="mt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isSpoiler}
                          onChange={(e) => setIsSpoiler(e.target.checked)}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: '#7c3aed' }}
                        />
                        <span className="text-sm font-semibold" style={{ color: '#a0a0c0' }}>Contains Spoilers</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: '#a0a0c0' }}>Review Title</label>
                    <input 
                      type="text" 
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Summarize your review in a few words..."
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: '#a0a0c0' }}>Review Content</label>
                    <textarea 
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      rows={3}
                      placeholder="Tell us what you liked or disliked about this movie..."
                      className="input-field py-3 resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="btn-primary px-6 py-2.5 flex items-center gap-2 text-sm"
                    >
                      {reviewLoading ? <FiLoader className="animate-spin" /> : <FiSend />}
                      Submit Review
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-5 rounded-2xl text-center" style={{ background: '#12121e', border: '1px dashed #2d2d4a' }}>
                  <p className="text-sm" style={{ color: '#a0a0c0' }}>
                    Please <Link to="/login" className="font-bold underline" style={{ color: '#7c3aed' }}>login</Link> to share your review and rate this movie.
                  </p>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {movie.reviews?.length === 0 ? (
                  <p className="text-center py-6 text-sm" style={{ color: '#606080' }}>
                    No reviews yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  movie.reviews.map((rev) => {
                    const [showSpoiler, setShowSpoiler] = useState(false);
                    return (
                      <div key={rev.id} className="p-5 rounded-2xl space-y-3" style={{ background: '#12121e', border: '1px solid #2d2d4a' }}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-900 flex items-center justify-center text-xs font-bold border" style={{ borderColor: '#2d2d4a' }}>
                              {rev.user?.avatarUrl ? (
                                <img src={rev.user.avatarUrl} alt={rev.user.firstName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{rev.user?.firstName?.[0]}{rev.user?.lastName?.[0]}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">
                                {rev.user?.firstName} {rev.user?.lastName}
                              </p>
                              <p className="text-[10px]" style={{ color: '#606080' }}>
                                {format(parseISO(rev.createdAt), 'PPP')}
                              </p>
                            </div>
                          </div>
                          
                          {/* Rating display */}
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e1e35] border" style={{ borderColor: '#2d2d4a' }}>
                            <FiStar className="text-amber-500 fill-amber-500" size={12} />
                            <span className="text-xs font-bold text-white">{rev.score || 5}</span>
                          </div>
                        </div>

                        {rev.spoiler && !showSpoiler ? (
                          <div className="p-4 rounded-xl text-center space-y-2 border" style={{ background: 'rgba(239,68,68,0.03)', borderColor: 'rgba(239,68,68,0.2)' }}>
                            <p className="text-xs font-semibold text-rose-500">Warning: This review contains spoilers!</p>
                            <button
                              onClick={() => setShowSpoiler(true)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                              style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', color: '#f0f0f8' }}
                            >
                              Show Review
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {rev.title && <h5 className="font-extrabold text-white text-sm">{rev.title}</h5>}
                            <p className="text-sm leading-relaxed" style={{ color: '#a0a0c0' }}>{rev.content}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
