import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiStar, FiChevronLeft, FiChevronRight, FiClock, FiCalendar } from 'react-icons/fi';

export default function HeroBanner({ movies = [] }) {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % movies.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [movies.length]);

  const movie = movies[current];
  if (!movie) return null;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'min(85vh, 700px)' }}>
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={movie.bannerUrl || movie.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80'}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(10,10,18,0.95) 0%, rgba(10,10,18,0.7) 50%, rgba(10,10,18,0.2) 100%)',
          }} />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, #0a0a12 0%, transparent 60%)',
          }} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 container-app h-full flex items-center">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Badges */}
              <div className="flex items-center gap-3 mb-4">
                <span className="badge badge-purple">{movie.ageRating || 'U/A'}</span>
                {movie.genres?.[0] && (
                  <span className="text-xs font-medium" style={{ color: '#7c3aed' }}>
                    {movie.genres[0].genre?.name}
                  </span>
                )}
                {movie.isTrending && (
                  <span className="badge badge-yellow">🔥 Trending</span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-3" style={{ color: '#f0f0f8' }}>
                {movie.title}
              </h1>

              {/* Tagline */}
              {movie.tagline && (
                <p className="text-lg font-medium mb-4 italic" style={{ color: '#7c3aed' }}>
                  "{movie.tagline}"
                </p>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-6 mb-5">
                {movie.imdbRating && (
                  <div className="flex items-center gap-1.5">
                    <FiStar className="fill-yellow-400 text-yellow-400" size={16} />
                    <span className="font-bold text-yellow-400">{movie.imdbRating}</span>
                    <span className="text-xs" style={{ color: '#606080' }}>IMDb</span>
                  </div>
                )}
                {movie.duration && (
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: '#a0a0c0' }}>
                    <FiClock size={14} />
                    <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                  </div>
                )}
                {movie.releaseDate && (
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: '#a0a0c0' }}>
                    <FiCalendar size={14} />
                    <span>{new Date(movie.releaseDate).getFullYear()}</span>
                  </div>
                )}
              </div>

              {/* Synopsis */}
              <p className="text-sm leading-relaxed line-clamp-3 mb-8" style={{ color: '#a0a0c0', maxWidth: '520px' }}>
                {movie.synopsis}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Link
                  to={`/movies/${movie.slug}`}
                  className="btn-primary px-8 py-3.5 text-base rounded-xl flex items-center gap-2"
                >
                  🎫 Book Tickets
                </Link>

                {movie.trailerUrl && (
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base transition-all hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
                  >
                    <FiPlay size={18} className="fill-white" />
                    Trailer
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dots & arrows */}
      {movies.length > 1 && (
        <>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {movies.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all rounded-full ${
                  i === current ? 'w-8 h-2 bg-purple-500' : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrent((c) => (c - 1 + movies.length) % movies.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-20 transition-all hover:bg-white/20"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
          >
            <FiChevronLeft size={20} />
          </button>

          <button
            onClick={() => setCurrent((c) => (c + 1) % movies.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-20 transition-all hover:bg-white/20"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
          >
            <FiChevronRight size={20} />
          </button>
        </>
      )}

      {/* Trailer Modal */}
      <AnimatePresence>
        {isPlaying && movie.trailerUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)' }}
            onClick={() => setIsPlaying(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={movie.trailerUrl?.replace('watch?v=', 'embed/') + '?autoplay=1'}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
