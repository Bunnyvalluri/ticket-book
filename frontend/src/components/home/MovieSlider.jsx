import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import MovieCard from '../movies/MovieCard.jsx';

export default function MovieSlider({ movies = [] }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  if (!movies.length) return null;

  return (
    <div className="relative group">
      {/* Left arrow */}
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl"
        style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', color: '#f0f0f8' }}
      >
        <FiChevronLeft size={18} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie, i) => (
          <div key={movie.id} className="flex-shrink-0" style={{ width: '180px' }}>
            <MovieCard movie={movie} index={i} />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl"
        style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', color: '#f0f0f8' }}
      >
        <FiChevronRight size={18} />
      </button>
    </div>
  );
}
