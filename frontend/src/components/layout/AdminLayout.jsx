import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/index.js';
import { authAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import {
  FiGrid, FiFilm, FiMapPin, FiCalendar, FiBookmark,
  FiUsers, FiTag, FiBarChart2, FiLogOut, FiMenu, FiX,
  FiSettings, FiBell, FiActivity
} from 'react-icons/fi';

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/admin/analytics', icon: FiBarChart2, label: 'Analytics' },
  { to: '/admin/movies', icon: FiFilm, label: 'Movies' },
  { to: '/admin/theatres', icon: FiMapPin, label: 'Theatres' },
  { to: '/admin/shows', icon: FiCalendar, label: 'Shows' },
  { to: '/admin/bookings', icon: FiBookmark, label: 'Bookings' },
  { to: '/admin/users', icon: FiUsers, label: 'Users' },
  { to: '/admin/coupons', icon: FiTag, label: 'Coupons' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#06060e' }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 68 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-shrink-0 flex flex-col h-full relative z-20"
        style={{ background: '#0f0f1a', borderRight: '1px solid #1a1a2e' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 h-16 border-b" style={{ borderColor: '#1a1a2e' }}>
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0 text-lg">🎬</div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-black text-lg gradient-text whitespace-nowrap"
              >
                CineMax
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-white/5 flex-shrink-0"
            style={{ color: '#606080' }}
          >
            {sidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                }`
              }
              title={!sidebarOpen ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-purple-400' : ''}`} />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-0 w-1 h-8 rounded-l-full"
                      style={{ background: '#7c3aed' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: User */}
        <div className="p-3 border-t" style={{ borderColor: '#1a1a2e' }}>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-semibold truncate" style={{ color: '#f0f0f8' }}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: '#606080' }}>{user?.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 flex-shrink-0"
              style={{ color: '#ef4444' }}
              title="Logout"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0"
          style={{ background: '#0f0f1a', borderColor: '#1a1a2e' }}>
          <div>
            <h1 className="font-bold" style={{ color: '#f0f0f8' }}>Admin Panel</h1>
            <p className="text-xs" style={{ color: '#606080' }}>Manage your platform</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
              style={{ background: '#1a1a2e', color: '#606080' }}>
              <FiBell size={16} />
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
              style={{ background: '#1a1a2e', color: '#606080' }}>
              <FiSettings size={16} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
