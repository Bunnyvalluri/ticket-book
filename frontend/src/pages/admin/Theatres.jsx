import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { theatreAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import { 
  FiMapPin, FiPlus, FiEdit2, FiTrash2, FiSearch, FiTv, 
  FiLoader, FiX, FiCheck, FiFilter, FiInfo, FiLayers 
} from 'react-icons/fi';
import { MdOutlineScreenShare } from 'react-icons/md';

export default function AdminTheatres() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Modal States
  const [isTheatreModalOpen, setIsTheatreModalOpen] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [editingTheatre, setEditingTheatre] = useState(null);
  const [activeTheatreForScreen, setActiveTheatreForScreen] = useState(null);

  // Form states
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    city: 'Hyderabad',
    address: '',
    phone: '',
    amenities: ['Parking', 'Food Court', 'Dolby Atmos', 'Recliners'],
  });

  const [screenForm, setScreenForm] = useState({
    name: 'Screen 1',
    type: 'IMAX 3D',
    totalSeats: 150,
  });

  // Queries
  const { data: citiesData } = useQuery({
    queryKey: ['theatre-cities'],
    queryFn: theatreAPI.getCities,
  });
  const cities = citiesData?.data?.data?.cities || ['Hyderabad', 'Mumbai', 'Bengaluru', 'Delhi-NCR', 'Chennai'];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-theatres', search, selectedCity],
    queryFn: () => theatreAPI.getAll({ search, city: selectedCity || undefined }),
  });
  const theatres = data?.data?.data?.theatres || [];

  // Mutations
  const createTheatreMutation = useMutation({
    mutationFn: theatreAPI.create,
    onSuccess: () => {
      toast.success('Theatre created successfully! 🏢');
      queryClient.invalidateQueries({ queryKey: ['admin-theatres'] });
      setIsTheatreModalOpen(false);
      resetTheatreForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create theatre'),
  });

  const updateTheatreMutation = useMutation({
    mutationFn: ({ id, data }) => theatreAPI.update(id, data),
    onSuccess: () => {
      toast.success('Theatre updated! ✨');
      queryClient.invalidateQueries({ queryKey: ['admin-theatres'] });
      setIsTheatreModalOpen(false);
      resetTheatreForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update theatre'),
  });

  const deleteTheatreMutation = useMutation({
    mutationFn: theatreAPI.delete,
    onSuccess: () => {
      toast.success('Theatre deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-theatres'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  const createScreenMutation = useMutation({
    mutationFn: theatreAPI.createScreen,
    onSuccess: () => {
      toast.success('Screen added to theatre! 🍿');
      queryClient.invalidateQueries({ queryKey: ['admin-theatres'] });
      setIsScreenModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add screen'),
  });

  const resetTheatreForm = () => {
    setEditingTheatre(null);
    setTheatreForm({
      name: '',
      city: 'Hyderabad',
      address: '',
      phone: '',
      amenities: ['Parking', 'Food Court', 'Dolby Atmos', 'Recliners'],
    });
  };

  const handleOpenEdit = (t) => {
    setEditingTheatre(t);
    setTheatreForm({
      name: t.name,
      city: t.city,
      address: t.address || '',
      phone: t.phone || '',
      amenities: t.amenities || ['Parking', 'Food Court'],
    });
    setIsTheatreModalOpen(true);
  };

  const handleOpenAddScreen = (t) => {
    setActiveTheatreForScreen(t);
    setScreenForm({
      name: `Screen ${(t.screens?.length || 0) + 1}`,
      type: 'IMAX 3D',
      totalSeats: 150,
    });
    setIsScreenModalOpen(true);
  };

  const handleTheatreSubmit = (e) => {
    e.preventDefault();
    if (!theatreForm.name || !theatreForm.city) return toast.error('Name and City are required');

    if (editingTheatre) {
      updateTheatreMutation.mutate({ id: editingTheatre.id, data: theatreForm });
    } else {
      createTheatreMutation.mutate(theatreForm);
    }
  };

  const handleScreenSubmit = (e) => {
    e.preventDefault();
    if (!activeTheatreForScreen) return;
    createScreenMutation.mutate({
      theatreId: activeTheatreForScreen.id,
      ...screenForm,
    });
  };

  return (
    <div className="space-y-8 text-slate-100 selection:bg-purple-500 selection:text-white">
      
      {/* Header Banner */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            🏢 Cinema & Theatre Management
          </h1>
          <p className="text-xs text-slate-400">Configure multiplexes, auditoriums, screen formats, and seat layouts</p>
        </div>

        <button
          onClick={() => { resetTheatreForm(); setIsTheatreModalOpen(true); }}
          className="btn-primary px-5 py-3 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xl glow-purple hover:scale-[1.02] transition-transform"
        >
          <FiPlus size={16} /> Add New Cinema
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cinema by name or address..."
            className="w-full glass-input text-xs pl-9 pr-4 py-2.5 rounded-xl outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FiFilter className="text-purple-400 shrink-0" size={14} />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="glass-input text-xs px-3 py-2.5 rounded-xl outline-none bg-slate-900 text-slate-300 font-semibold"
          >
            <option value="">All Cities ({cities.length})</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Theatres Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-56 rounded-3xl shimmer" />
          ))}
        </div>
      ) : theatres.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border border-white/10 space-y-3">
          <FiMapPin className="text-4xl text-purple-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">No Theatres Found</h3>
          <p className="text-xs text-slate-400">Add a multiplex or try clearing search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {theatres.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-3xl border border-white/15 shadow-xl flex flex-col justify-between space-y-5 relative group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {t.city}
                    </span>
                    <h3 className="text-xl font-black text-white mt-1.5">{t.name}</h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit Cinema"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${t.name}?`)) deleteTheatreMutation.mutate(t.id);
                      }}
                      className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                      title="Delete Cinema"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <FiMapPin className="text-pink-400 shrink-0" size={13} />
                  <span>{t.address || 'Standard Address'}</span>
                </p>

                {/* Screens List */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1">
                      <FiTv className="text-purple-400" /> Screens ({t.screens?.length || 0})
                    </span>
                    <button
                      onClick={() => handleOpenAddScreen(t)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                    >
                      <FiPlus /> Add Screen
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {t.screens?.length ? (
                      t.screens.map((sc) => (
                        <span
                          key={sc.id || sc.name}
                          className="px-3 py-1 rounded-xl text-[11px] font-bold bg-white/5 border border-white/10 text-slate-200 flex items-center gap-1.5"
                        >
                          <MdOutlineScreenShare className="text-indigo-400" size={13} />
                          {sc.name} <span className="text-[9px] text-purple-300 font-mono">({sc.type || '2D'})</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No screens added yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Phone: {t.phone || '+91 98765 00000'}</span>
                <span className="font-bold text-slate-300">
                  Total Capacity: {(t.screens || []).reduce((acc, s) => acc + (s.totalSeats || 120), 0)} Seats
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL 1: Add / Edit Theatre */}
      <AnimatePresence>
        {isTheatreModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 md:p-8 rounded-3xl border border-white/15 max-w-lg w-full shadow-2xl space-y-6 bg-slate-900/95"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black text-white">
                  {editingTheatre ? 'Edit Cinema Theatre' : 'Add New Cinema Theatre'}
                </h3>
                <button onClick={() => setIsTheatreModalOpen(false)} className="p-2 text-slate-400 hover:text-white">
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleTheatreSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Theatre Name</label>
                  <input
                    type="text"
                    value={theatreForm.name}
                    onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                    placeholder="e.g. PVR Forum Mall"
                    className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">City</label>
                    <select
                      value={theatreForm.city}
                      onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                      className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none bg-slate-900"
                    >
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Contact Phone</label>
                    <input
                      type="tel"
                      value={theatreForm.phone}
                      onChange={(e) => setTheatreForm({ ...theatreForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Address & Landmark</label>
                  <textarea
                    rows={2}
                    value={theatreForm.address}
                    onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                    placeholder="Kukatpally Main Road, Hyderabad"
                    className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createTheatreMutation.isPending || updateTheatreMutation.isPending}
                  className="btn-primary w-full py-3.5 text-xs font-bold rounded-2xl shadow-xl glow-purple flex items-center justify-center gap-2"
                >
                  {(createTheatreMutation.isPending || updateTheatreMutation.isPending) ? <FiLoader className="animate-spin" /> : 'Save Theatre Details'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Add Screen */}
      <AnimatePresence>
        {isScreenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 rounded-3xl border border-white/15 max-w-md w-full shadow-2xl space-y-5 bg-slate-900/95"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white">
                  Add Screen to {activeTheatreForScreen?.name}
                </h3>
                <button onClick={() => setIsScreenModalOpen(false)} className="p-2 text-slate-400 hover:text-white">
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleScreenSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Screen Name / Number</label>
                  <input
                    type="text"
                    value={screenForm.name}
                    onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                    placeholder="Screen 1 (Audi A)"
                    className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Projection Type</label>
                    <select
                      value={screenForm.type}
                      onChange={(e) => setScreenForm({ ...screenForm, type: e.target.value })}
                      className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none bg-slate-900"
                    >
                      <option value="IMAX 3D">IMAX 3D</option>
                      <option value="4DX">4DX</option>
                      <option value="Dolby Atmos">Dolby Atmos</option>
                      <option value="2D Standard">2D Standard</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Total Seat Capacity</label>
                    <input
                      type="number"
                      value={screenForm.totalSeats}
                      onChange={(e) => setScreenForm({ ...screenForm, totalSeats: Number(e.target.value) })}
                      className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createScreenMutation.isPending}
                  className="btn-primary w-full py-3.5 text-xs font-bold rounded-2xl shadow-xl glow-purple flex items-center justify-center gap-2"
                >
                  {createScreenMutation.isPending ? <FiLoader className="animate-spin" /> : 'Confirm Add Screen'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
