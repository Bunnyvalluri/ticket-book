import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { adminAPI, movieAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiStar, FiLoader } from 'react-icons/fi';

export default function AdminMovies() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-movies', search, page],
    queryFn: () => movieAPI.getAll({ search, page, limit: 15 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => movieAPI.delete(id),
    onSuccess: () => {
      toast.success('Movie deleted');
      queryClient.invalidateQueries(['admin-movies']);
    },
    onError: () => toast.error('Delete failed'),
  });

  const movies = data?.data?.data?.movies || [];
  const pagination = data?.data?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black" style={{ color: '#f0f0f8' }}>🎬 Movies</h1>
        <button className="btn-primary px-4 py-2 text-sm flex items-center gap-2 rounded-xl">
          <FiPlus size={16} />
          Add Movie
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#606080' }} />
        <input
          type="text"
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a2e' }}>
                {['Movie', 'Status', 'Rating', 'Duration', 'Release', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#606080' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded shimmer w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : movies.map((movie, i) => (
                <motion.tr
                  key={movie.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="transition-colors hover:bg-white/2"
                  style={{ borderBottom: '1px solid #1a1a2e' }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-9 h-13 object-cover rounded-lg flex-shrink-0"
                        style={{ height: '52px' }}
                      />
                      <div>
                        <p className="font-semibold" style={{ color: '#f0f0f8' }}>{movie.title}</p>
                        <p className="text-xs" style={{ color: '#606080' }}>{movie.ageRating} • {movie.country}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${
                      movie.status === 'NOW_SHOWING' ? 'badge-green' :
                      movie.status === 'COMING_SOON' ? 'badge-purple' : 'badge-yellow'
                    }`}>
                      {movie.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {movie.imdbRating ? (
                      <div className="flex items-center gap-1">
                        <FiStar className="text-yellow-400" size={12} />
                        <span style={{ color: '#f0f0f8' }}>{movie.imdbRating}</span>
                      </div>
                    ) : <span style={{ color: '#606080' }}>—</span>}
                  </td>
                  <td className="px-5 py-4" style={{ color: '#a0a0c0' }}>
                    {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                  </td>
                  <td className="px-5 py-4" style={{ color: '#a0a0c0' }}>
                    {new Date(movie.releaseDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                        style={{ color: '#7c3aed' }}>
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this movie?')) deleteMutation.mutate(movie.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                        style={{ color: '#ef4444' }}
                      >
                        {deleteMutation.isPending ? <FiLoader size={14} className="animate-spin" /> : <FiTrash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid #1a1a2e' }}>
            <p className="text-xs" style={{ color: '#606080' }}>
              Showing {movies.length} of {pagination.total} movies
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost px-3 py-1.5 text-xs rounded-lg disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-3 py-1.5 text-xs rounded-lg" style={{ background: '#1e1e35', color: '#a0a0c0' }}>
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="btn-ghost px-3 py-1.5 text-xs rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
