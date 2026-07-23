import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api.js';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  FiTrendingUp, FiFilm, FiUsers, FiDollarSign, FiCalendar, 
  FiPieChart, FiActivity, FiShield, FiFileText 
} from 'react-icons/fi';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-2xl p-3.5 text-xs shadow-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl space-y-1">
      <p className="font-extrabold text-slate-200">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {p.name === 'revenue' || p.name === 'Revenue' ? '₹' : ''}{p.value?.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('monthly');

  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ['admin-revenue-full', period],
    queryFn: () => adminAPI.getRevenueAnalytics({ period }),
  });

  const { data: topMoviesData } = useQuery({
    queryKey: ['admin-top-movies-full'],
    queryFn: () => adminAPI.getTopMovies({ limit: 8 }),
  });

  const { data: userGrowthData } = useQuery({
    queryKey: ['admin-user-growth-full'],
    queryFn: adminAPI.getUserGrowth,
  });

  const { data: auditData } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminAPI.getAuditLogs({ limit: 10 }),
  });

  const revenue = revenueData?.data?.data;
  const topMovies = topMoviesData?.data?.data?.movies || [];
  const userGrowth = userGrowthData?.data?.data?.data || [];
  const auditLogs = auditData?.data?.data?.logs || [];

  return (
    <div className="space-y-8 text-slate-100 selection:bg-purple-500 selection:text-white">
      
      {/* Header Banner */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            📈 Business Intelligence & Analytics
          </h1>
          <p className="text-xs text-slate-400">Deep-dive financial reporting, ticket gross sales, user acquisition, and security audit logs</p>
        </div>

        <div className="flex gap-1 p-1 rounded-2xl bg-slate-900 border border-white/10 text-xs font-bold">
          {['monthly', 'weekly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl capitalize transition-all ${
                period === p ? 'gradient-bg text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl border border-white/15 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
              <FiDollarSign className="text-emerald-400" /> Revenue Stream Performance ({period})
            </h3>
            <p className="text-xs text-slate-400">Aggregated gross ticketing and popcorn concessions sales</p>
          </div>
        </div>

        {revLoading ? (
          <div className="h-64 rounded-2xl shimmer" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenue?.data || []}>
              <defs>
                <linearGradient id="revFullGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#revFullGrad)" dot={{ fill: '#34d399', strokeWidth: 2, r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Grid: Top Movies & User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Movies Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-3xl border border-white/15 shadow-2xl space-y-5"
        >
          <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
            <FiFilm className="text-amber-400" /> Top Performing Movies
          </h3>

          <div className="space-y-3">
            {topMovies.map((m, i) => (
              <div key={m.id || i} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-black text-amber-300 w-4">#{i + 1}</span>
                  <span className="font-bold text-white truncate">{m.title}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-purple-300">₹{(m.revenue / 1000).toFixed(1)}k</span>
                  <span className="text-[10px] text-slate-400 block">{m.bookings} bookings</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* User Growth Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-3xl border border-white/15 shadow-2xl space-y-5"
        >
          <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
            <FiUsers className="text-blue-400" /> User Acquisition Trends
          </h3>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="new_users" name="New Registrations" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

      </div>

    </div>
  );
}
