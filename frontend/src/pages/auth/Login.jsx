import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api.js';
import { useAuthStore } from '../../store/index.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.login(data);
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.firstName}! 🎬`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`;
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a12' }}>
      {/* Left: Movie poster background */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ maxWidth: '50%' }}>
        <img
          src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80"
          alt="Cinema"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.8), rgba(236,72,153,0.4))' }} />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-7xl mb-6">🎬</div>
            <h2 className="text-4xl font-black text-white mb-4">CineMax</h2>
            <p className="text-xl text-white/80 font-medium mb-8">Your Premium Movie Experience</p>
            <div className="flex flex-col gap-3 text-sm text-white/70">
              {['🎫 Easy ticket booking', '⚡ Real-time seat selection', '💳 Secure payments', '📱 QR code tickets'].map((f) => (
                <div key={f} className="flex items-center gap-2">{f}</div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8 lg:hidden">
            <div className="text-4xl mb-2">🎬</div>
            <h1 className="text-2xl font-black gradient-text">CineMax</h1>
          </div>

          <h2 className="text-3xl font-black mb-2" style={{ color: '#f0f0f8' }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: '#606080' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium" style={{ color: '#7c3aed' }}>Sign up free</Link>
          </p>

          {/* Google Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-medium text-sm mb-6 transition-all hover:border-purple-500"
            style={{ background: '#1e1e35', border: '1px solid #2d2d4a', color: '#f0f0f8' }}
          >
            <FcGoogle size={20} />
            Continue with Google
          </motion.button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: '#2d2d4a' }} />
            <span className="text-xs" style={{ color: '#606080' }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: '#2d2d4a' }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: '#a0a0c0' }}>Email</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: '#606080' }} />
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                  })}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  id="login-email"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium" style={{ color: '#a0a0c0' }}>Password</label>
                <Link to="/forgot-password" className="text-xs" style={{ color: '#7c3aed' }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: '#606080' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  id="login-password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#606080' }}
                >
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.password.message}</p>}
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#7c3aed' }}
                id="remember-me"
              />
              <span className="text-sm" style={{ color: '#a0a0c0' }}>Remember me for 30 days</span>
            </label>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
              id="login-submit"
            >
              {loading ? <FiLoader className="animate-spin" size={18} /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-xl" style={{ background: '#1a1a2e', border: '1px solid #2d2d4a' }}>
            <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#606080' }}>Demo Credentials</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: '#a0a0c0' }}>Customer:</span>
                <span style={{ color: '#7c3aed' }}>customer@cinemax.com / Test@1234</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#a0a0c0' }}>Admin:</span>
                <span style={{ color: '#f59e0b' }}>admin@cinemax.com / Admin@1234</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
