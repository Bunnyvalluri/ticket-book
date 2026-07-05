import { motion } from 'framer-motion';

const GENRE_ICONS = {
  'action': '⚡', 'drama': '🎭', 'comedy': '😂', 'thriller': '🔥',
  'horror': '👻', 'romance': '❤️', 'sci-fi': '🚀', 'animation': '🎨',
  'adventure': '🗺️', 'fantasy': '✨',
};

export default function GenreFilter({ genres = [], onSelect, active }) {
  return (
    <section className="mb-14">
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#f0f0f8' }}>🎬 Browse by Genre</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {genres.map((genre, i) => (
          <motion.button
            key={genre.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(active === genre.slug ? '' : genre.slug)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
            style={{
              background: active === genre.slug ? genre.colorHex + '25' : '#1a1a2e',
              border: `1px solid ${active === genre.slug ? genre.colorHex : '#2d2d4a'}`,
              boxShadow: active === genre.slug ? `0 0 20px ${genre.colorHex}30` : 'none',
            }}
          >
            <span className="text-2xl">{GENRE_ICONS[genre.slug] || '🎬'}</span>
            <span className="text-xs font-medium" style={{ color: active === genre.slug ? genre.colorHex : '#a0a0c0' }}>
              {genre.name}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
