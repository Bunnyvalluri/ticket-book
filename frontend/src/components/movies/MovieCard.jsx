import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar, FiClock, FiHeart } from 'react-icons/fi';
import { useAuthStore } from '../../store/index.js';
import { movieAPI } from '../../services/api.js';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function MovieCard({ movie, index = 0 }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [wishlisted, setWishlisted] = useState(movie.userWishlisted || false);
  const [loading, setLoading] = useState(false);

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    setLoading(true);
    try {
      await movieAPI.toggleWishlist(movie.id);
      setWishlisted(!wishlisted);
      toast.success(wishlisted ? 'Removed from wishlist' : '❤️ Added to wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    NOW_SHOWING: { bg: 'rgba(16,185,129,0.2)', color: '#34d399', text: 'Now Showing' },
    COMING_SOON: { bg: 'rgba(59,130,246,0.2)', color: '#60a5fa', text: 'Coming Soon' },
    ARCHIVED: { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8', text: 'Archived' },
  };
  const status = statusColors[movie.status] || statusColors.NOW_SHOWING;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/movies/${movie.slug}`} className="block movie-card group">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
          <img
            src={movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80'}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Overlay */}
          <div className="movie-card-overlay" />

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: status.bg, color: status.color }}>
              {status.text}
            </span>
          </div>

          {/* Wishlist button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleWishlist}
            disabled={loading}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{
              background: wishlisted ? 'rgba(236,72,153,0.9)' : 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <FiHeart
              size={14}
              className={wishlisted ? 'fill-white text-white' : 'text-white'}
            />
          </motion.button>

          {/* Rating */}
          {movie.imdbRating && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <FiStar className="fill-yellow-400 text-yellow-400" size={12} />
              <span className="text-xs font-bold text-white">{movie.imdbRating}</span>
            </div>
          )}

          {/* Book button on hover */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="btn-primary py-2 text-center text-xs font-bold rounded-lg w-full">
              Book Now
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-2">
          <h3 className="font-semibold text-sm line-clamp-1 mt-1" style={{ color: '#f0f0f8' }}>
            {movie.title}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            {movie.duration && (
              <span className="flex items-center gap-1 text-xs" style={{ color: '#606080' }}>
                <FiClock size={11} />
                {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
              </span>
            )}
            {movie.genres?.[0] && (
              <span className="text-xs" style={{ color: '#7c3aed' }}>
                {movie.genres[0].genre?.name}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
