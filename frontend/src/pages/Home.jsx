import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { movieAPI } from '../services/api.js';
import { useUIStore } from '../store/index.js';
import MovieCard from '../components/movies/MovieCard.jsx';
import MovieSkeleton from '../components/movies/MovieSkeleton.jsx';
import HeroBanner from '../components/home/HeroBanner.jsx';
import MovieSlider from '../components/home/MovieSlider.jsx';
import GenreFilter from '../components/home/GenreFilter.jsx';
import { FiFilter, FiSearch, FiX, FiStar } from 'react-icons/fi';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeGenre, setActiveGenre] = useState('');
  const [activeLanguage, setActiveLanguage] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [minRating, setMinRating] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const searchQuery = searchParams.get('search') || '';
  const { selectedCity } = useUIStore();

  // Trending movies for hero
  const { data: trendingData } = useQuery({
    queryKey: ['trending-movies'],
    queryFn: () => movieAPI.getTrending({ limit: 5 }),
  });

  // Now showing
  const { data: nowShowingData, isLoading: nsLoading } = useQuery({
    queryKey: ['now-showing', selectedCity],
    queryFn: () => movieAPI.getNowShowing({ limit: 10, city: selectedCity }),
  });

  // Coming soon
  const { data: comingSoonData } = useQuery({
    queryKey: ['coming-soon'],
    queryFn: () => movieAPI.getComingSoon({ limit: 8 }),
  });

  // All movies with filters
  const { data: moviesData, isLoading } = useQuery({
    queryKey: ['movies', searchQuery, activeGenre, activeLanguage, sortBy, minRating, page],
    queryFn: () => movieAPI.getAll({
      search: searchQuery,
      genre: activeGenre,
      language: activeLanguage,
      sortBy,
      minRating,
      page,
      limit: 12,
    }),
    enabled: !!(searchQuery || activeGenre || activeLanguage || minRating || page > 1),
  });

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: movieAPI.getGenres,
    staleTime: Infinity,
  });

  const { data: languagesData } = useQuery({
    queryKey: ['languages'],
    queryFn: movieAPI.getLanguages,
    staleTime: Infinity,
  });

  const isFiltered = searchQuery || activeGenre || activeLanguage || minRating;

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      {!isFiltered && trendingData?.data?.data?.movies?.length > 0 && (
        <HeroBanner movies={trendingData.data.data.movies} />
      )}

      <div className="container-app py-10">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {searchQuery && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ background: '#1a1a2e', border: '1px solid #7c3aed', color: '#a78bfa' }}>
              <FiSearch size={14} />
              <span>"{searchQuery}"</span>
              <button onClick={() => { setSearchParams({}); }} className="ml-1 hover:text-white">
                <FiX size={14} />
              </button>
            </div>
          )}

          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all"
            style={{
              background: filterOpen ? '#7c3aed' : '#1a1a2e',
              border: `1px solid ${filterOpen ? '#7c3aed' : '#2d2d4a'}`,
              color: filterOpen ? 'white' : '#a0a0c0',
            }}
          >
            <FiFilter size={14} />
            Filters
            {(activeGenre || activeLanguage || minRating) && (
              <span className="w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center" style={{ background: '#ec4899', color: 'white' }}>
                {[activeGenre, activeLanguage, minRating].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Genre pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar flex-1">
            {genresData?.data?.data?.genres?.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setActiveGenre(activeGenre === genre.slug ? '' : genre.slug)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all"
                style={{
                  background: activeGenre === genre.slug ? genre.colorHex + '30' : '#1a1a2e',
                  border: `1px solid ${activeGenre === genre.slug ? genre.colorHex : '#2d2d4a'}`,
                  color: activeGenre === genre.slug ? genre.colorHex : '#a0a0c0',
                }}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-6 rounded-2xl"
              style={{ background: '#1a1a2e', border: '1px solid #2d2d4a' }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Language */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#606080' }}>Language</label>
                  <div className="flex flex-wrap gap-2">
                    {languagesData?.data?.data?.languages?.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => setActiveLanguage(activeLanguage === lang.code ? '' : lang.code)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: activeLanguage === lang.code ? 'rgba(124,58,237,0.2)' : '#12121e',
                          border: `1px solid ${activeLanguage === lang.code ? '#7c3aed' : '#2d2d4a'}`,
                          color: activeLanguage === lang.code ? '#a78bfa' : '#a0a0c0',
                        }}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#606080' }}>Min IMDb Rating</label>
                  <div className="flex gap-2">
                    {[6, 7, 7.5, 8, 8.5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(minRating == r ? '' : r)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                        style={{
                          background: minRating == r ? 'rgba(245,158,11,0.2)' : '#12121e',
                          border: `1px solid ${minRating == r ? '#f59e0b' : '#2d2d4a'}`,
                          color: minRating == r ? '#f59e0b' : '#a0a0c0',
                        }}
                      >
                        <FiStar size={10} />
                        {r}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#606080' }}>Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="createdAt">Latest</option>
                    <option value="releaseDate">Release Date</option>
                    <option value="imdbRating">IMDb Rating</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>
              </div>

              {(activeGenre || activeLanguage || minRating) && (
                <button
                  onClick={() => { setActiveGenre(''); setActiveLanguage(''); setMinRating(''); }}
                  className="mt-4 text-sm flex items-center gap-1"
                  style={{ color: '#ef4444' }}
                >
                  <FiX size={14} /> Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtered Results */}
        {isFiltered ? (
          <div>
            <h2 className="text-xl font-bold mb-6" style={{ color: '#f0f0f8' }}>
              {searchQuery ? `Results for "${searchQuery}"` : 'Filtered Movies'}
              {moviesData?.data?.data?.pagination?.total > 0 && (
                <span className="text-sm font-normal ml-2" style={{ color: '#606080' }}>
                  ({moviesData.data.data.pagination.total} found)
                </span>
              )}
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => <MovieSkeleton key={i} />)}
              </div>
            ) : moviesData?.data?.data?.movies?.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🎬</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#f0f0f8' }}>No movies found</h3>
                <p style={{ color: '#606080' }}>Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {moviesData?.data?.data?.movies?.map((movie, i) => (
                  <MovieCard key={movie.id} movie={movie} index={i} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Now Showing */}
            <section className="mb-14">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#f0f0f8' }}>
                    🎭 Now Showing
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#606080' }}>Currently in theatres in {selectedCity}</p>
                </div>
                <button className="text-sm font-medium" style={{ color: '#7c3aed' }}>
                  See All →
                </button>
              </div>

              {nsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => <MovieSkeleton key={i} />)}
                </div>
              ) : (
                <MovieSlider movies={nowShowingData?.data?.data?.movies || []} />
              )}
            </section>

            {/* Genre Showcase */}
            <GenreFilter genres={genresData?.data?.data?.genres || []} onSelect={setActiveGenre} active={activeGenre} />

            {/* Coming Soon */}
            <section className="mb-14">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#f0f0f8' }}>🔜 Coming Soon</h2>
                  <p className="text-sm mt-1" style={{ color: '#606080' }}>Releasing in theatres near you</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {comingSoonData?.data?.data?.movies?.map((movie, i) => (
                  <MovieCard key={movie.id} movie={movie} index={i} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
