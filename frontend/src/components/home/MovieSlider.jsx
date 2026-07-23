import { useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import MovieCard from '../movies/MovieCard.jsx';

export default function MovieSlider({ movies = [] }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (!movies.length) return null;

  return (
    <div className="relative group my-4">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-11 h-11 rounded-2xl glass-card flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:border-purple-500/50"
      >
        <FiChevronLeft size={20} />
      </button>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-6 pt-2 px-1 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie, i) => (
          <div key={movie.id || i} className="shrink-0 w-[160px] sm:w-[200px] md:w-[220px] lg:w-[230px]">
            <MovieCard movie={movie} index={i} />
          </div>
        ))}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-11 h-11 rounded-2xl glass-card flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:border-purple-500/50"
      >
        <FiChevronRight size={20} />
      </button>
    </div>
  );
}
