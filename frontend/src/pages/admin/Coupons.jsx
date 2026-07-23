import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import { 
  FiTag, FiPlus, FiTrash2, FiCopy, FiCalendar, 
  FiLoader, FiX, FiCheck, FiDollarSign, FiPercent 
} from 'react-icons/fi';
import { MdOutlineLocalOffer } from 'react-icons/md';

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minBookingAmount: 300,
    maxDiscountAmount: 150,
    validUntil: '',
    usageLimit: 100,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: adminAPI.getCoupons,
  });

  const coupons = data?.data?.data?.coupons || [];

  const createMutation = useMutation({
    mutationFn: adminAPI.createCoupon,
    onSuccess: () => {
      toast.success('Coupon created successfully! 🏷️');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setIsModalOpen(false);
      setFormData({ code: '', discountType: 'PERCENTAGE', discountValue: 20, minBookingAmount: 300, maxDiscountAmount: 150, validUntil: '', usageLimit: 100 });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create coupon'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteCoupon,
    onSuccess: () => {
      toast.success('Coupon deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) return toast.error('Code and Value are required');
    createMutation.mutate({
      ...formData,
      code: formData.code.toUpperCase().trim(),
    });
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied! 📋`);
  };

  return (
    <div className="space-y-8 text-slate-100 selection:bg-purple-500 selection:text-white">
      
      {/* Header Banner */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            🏷️ Promotional Coupon Manager
          </h1>
          <p className="text-xs text-slate-400">Create promo codes, discount vouchers, minimum order thresholds, and expiry limits</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary px-5 py-3 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xl glow-purple hover:scale-[1.02] transition-transform"
        >
          <FiPlus size={16} /> Create New Coupon
        </button>
      </div>

      {/* Coupons List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 rounded-3xl shimmer" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border border-white/10 space-y-3">
          <MdOutlineLocalOffer className="text-4xl text-purple-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">No Coupons Found</h3>
          <p className="text-xs text-slate-400">Click "Create New Coupon" to offer discounts to customers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coupons.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-3xl border border-white/15 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-slate-900 font-mono text-sm font-black text-amber-300 border border-amber-500/30">
                    {c.code}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete coupon ${c.code}?`)) deleteMutation.mutate(c.id);
                    }}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                <p className="text-lg font-black text-white">
                  {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                </p>

                <div className="space-y-1 text-xs text-slate-400">
                  <p>Min Booking: <strong className="text-slate-200">₹{c.minBookingAmount || 0}</strong></p>
                  <p>Max Savings: <strong className="text-slate-200">₹{c.maxDiscountAmount || 'No Limit'}</strong></p>
                  <p className="flex items-center gap-1 text-[11px] text-purple-300">
                    <FiCalendar size={12} /> Valid: {c.validUntil ? new Date(c.validUntil).toLocaleDateString() : 'Lifetime'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(c.code)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <FiCopy size={13} /> Copy Promo Code
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal: Create Coupon */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 md:p-8 rounded-3xl border border-white/15 max-w-md w-full shadow-2xl space-y-5 bg-slate-900/95"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white">Create Promo Coupon</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white">
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Coupon Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. SUMMER50 or CINE20"
                    className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none font-mono uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none bg-slate-900"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Discount Value</label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Min Order (₹)</label>
                    <input
                      type="number"
                      value={formData.minBookingAmount}
                      onChange={(e) => setFormData({ ...formData, minBookingAmount: Number(e.target.value) })}
                      className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="glass-input text-xs px-4 py-3 rounded-2xl w-full outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary w-full py-3.5 text-xs font-bold rounded-2xl shadow-xl glow-purple flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? <FiLoader className="animate-spin" /> : 'Confirm & Create Coupon'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
