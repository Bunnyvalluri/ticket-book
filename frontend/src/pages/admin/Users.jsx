import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import { 
  FiUsers, FiSearch, FiFilter, FiShield, FiUserCheck, 
  FiMail, FiPhone, FiCheckCircle, FiLoader, FiX, FiCheck 
} from 'react-icons/fi';
import { MdOutlineCardMembership } from 'react-icons/md';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role],
    queryFn: () => adminAPI.getUsers({ search: search || undefined, role: role || undefined }),
  });

  const users = data?.data?.data?.users || [];

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateUser(id, data),
    onSuccess: () => {
      toast.success('User role updated! 🛡️');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update user'),
  });

  const handleToggleRole = (u) => {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (confirm(`Change ${u.firstName}'s role to ${newRole}?`)) {
      updateUserMutation.mutate({ id: u.id, data: { role: newRole } });
    }
  };

  return (
    <div className="space-y-8 text-slate-100 selection:bg-purple-500 selection:text-white">
      
      {/* Header Banner */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            👥 User & Customer Management
          </h1>
          <p className="text-xs text-slate-400">View customer accounts, manage administrator permissions, and audit user roles</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or email..."
            className="w-full glass-input text-xs pl-9 pr-4 py-2.5 rounded-xl outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FiFilter className="text-purple-400 shrink-0" size={14} />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="glass-input text-xs px-3 py-2.5 rounded-xl outline-none bg-slate-900 text-slate-300 font-semibold"
          >
            <option value="">All Roles</option>
            <option value="USER">Customer (USER)</option>
            <option value="ADMIN">Administrator (ADMIN)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl shimmer" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border border-white/10 space-y-3">
          <FiUsers className="text-4xl text-purple-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">No Users Found</h3>
          <p className="text-xs text-slate-400">Try clearing search filters.</p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl border border-white/15 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">User Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-bg text-white font-bold flex items-center justify-center text-xs">
                          {u.firstName?.[0]}
                        </div>
                        <span className="font-extrabold text-white">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {u.email}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {u.phone || 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                        <FiCheckCircle size={11} /> Verified
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={updateUserMutation.isPending}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                      >
                        Set as {u.role === 'ADMIN' ? 'USER' : 'ADMIN'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
