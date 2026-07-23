import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/index.js';
import { authAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import {
  FiGrid, FiFilm, FiMapPin, FiCalendar, FiBookmark,
  FiUsers, FiTag, FiBarChart2, FiLogOut, FiMenu, FiX,
  FiSettings, FiBell, FiExternalLink, FiChevronRight
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

const ROUTE_TITLES = {
  '/admin/dashboard': 'Dashboard Overview',
  '/admin/analytics': 'Business Intelligence & Analytics',
  '/admin/movies': 'Movie Catalog Management',
  '/admin/theatres': 'Theatres & Screens Manager',
  '/admin/shows': 'Showtime Scheduler',
  '/admin/bookings': 'Booking Orders & Audit',
  '/admin/users': 'User Accounts & Directory',
  '/admin/coupons': 'Promotional Coupons Manager',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTitle = ROUTE_TITLES[location.pathname] || 'Admin Console';

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    logout();
    toast.success('Logged out from Admin Console');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#070710] text-slate-100 selection:bg-purple-500 selection:text-white font-sans">
      
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 250 : 72 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-shrink-0 flex flex-col h-full relative z-30 bg-[#0c0c18] border-r border-white/10 shadow-2xl backdrop-blur-xl"
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl gradient-bg flex items-center justify-center flex-shrink-0 text-xl shadow-lg glow-purple">
              🎬
            </div>
            
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-1.5 min-w-0"
                >
                  <span className="font-black text-xl gradient-text tracking-tight truncate">CineMax</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                    Admin
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl transition-colors hover:bg-white/10 text-slate-400 hover:text-white flex-shrink-0 ml-1"
            title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {sidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 scrollbar-thin">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200 group relative ${
                  isActive
                    ? 'gradient-bg text-white font-bold shadow-xl glow-purple'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 font-semibold'
                }`
              }
              title={!sidebarOpen ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon size={19} className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-purple-400/80 group-hover:text-purple-300'}`} />
                  
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs tracking-wide whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-l-full bg-white shadow-md"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Profile Footer */}
        <div className="p-3 border-t border-white/10 bg-slate-900/40">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md ring-2 ring-purple-500/30">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold truncate text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <span className="text-[9px] font-black uppercase text-amber-300 tracking-wider">
                  {user?.role || 'SUPER_ADMIN'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl transition-colors hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 flex-shrink-0"
                title="Logout from Admin Console"
              >
                <FiLogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-rose-400 hover:text-rose-300 flex items-center justify-center mx-auto transition-colors shadow-md"
              title={`Logout (${user?.firstName || 'Admin'})`}
            >
              <FiLogOut size={18} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navigation Bar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 flex-shrink-0 bg-[#0a0a14]/80 backdrop-blur-xl z-10 gap-4">
          
          {/* Header Left: Menu Toggle + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors shrink-0"
              title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {sidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                <span>Admin Suite</span>
                <FiChevronRight size={10} className="text-slate-600 shrink-0" />
                <span className="text-purple-400 truncate">{currentTitle}</span>
              </div>
              <h1 className="text-base font-black text-white leading-tight truncate">
                {currentTitle}
              </h1>
            </div>
          </div>

          {/* Header Right: Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all group"
            >
              <span className="hidden sm:inline">View Cinema App</span>
              <FiExternalLink size={13} className="text-purple-400 group-hover:scale-110 transition-transform" />
            </Link>

            <button 
              onClick={() => toast.success('All system services operating smoothly')}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors relative shrink-0"
              title="System Notifications"
            >
              <FiBell size={16} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>
        </header>

        {/* Page Content Render Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
