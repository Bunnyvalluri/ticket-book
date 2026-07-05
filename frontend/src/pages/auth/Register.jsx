import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLoader, FiUser, FiPhone } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api.js';

export default function Register() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '' },
  });

  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...registerData } = data;
      if (!registerData.phone) {
        delete registerData.phone;
      }
      await authAPI.register(registerData);
      toast.success('Registration successful! Please check your email to verify your account. 🎬');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
            <p className="text-xl text-white/80 font-medium mb-8">Join Our Premium Movie Platform</p>
            <div className="flex flex-col gap-3 text-sm text-white/70">
              {['🎫 Easy ticket booking', '⚡ Real-time seat selection', '💳 Secure payments', '📱 QR code tickets'].map((f) => (
                <div key={f} className="flex items-center gap-2">{f}</div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right: Register form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md my-8"
        >
          {/* Header */}
          <div className="text-center mb-8 lg:hidden">
            <div className="text-4xl mb-2">🎬</div>
            <h1 className="text-2xl font-black gradient-text">CineMax</h1>
          </div>

          <h2 className="text-3xl font-black mb-2" style={{ color: '#f0f0f8' }}>Create an account</h2>
          <p className="text-sm mb-8" style={{ color: '#606080' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: '#7c3aed' }}>Sign in</Link>
          </p>

          {/* Google Register */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-medium text-sm mb-6 transition-all hover:border-purple-500"
            style={{ background: '#1e1e35', border: '1px solid #2d2d4a', color: '#f0f0f8' }}
          >
            <FcGoogle size={20} />
            Sign up with Google
          </motion.button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: '#2d2d4a' }} />
            <span className="text-xs" style={{ color: '#606080' }}>or register with email</span>
            <div className="flex-1 h-px" style={{ background: '#2d2d4a' }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: '#a0a0c0' }}>First Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: '#606080' }} />
                  <input
                    type="text"
                    {...register('firstName', { required: 'Required' })}
                    className="input-field pl-10"
                    placeholder="John"
                    id="register-firstname"
                  />
                </div>
                {errors.firstName && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: '#a0a0c0' }}>Last Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: '#606080' }} />
                  <input
                    type="text"
                    {...register('lastName', { required: 'Required' })}
                    className="input-field pl-10"
                    placeholder="Doe"
                    id="register-lastname"
                  />
                </div>
                {errors.lastName && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.lastName.message}</p>}
              </div>
            </div>

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
                  id="register-email"
                />
              </div>
              {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: '#a0a0c0' }}>Phone (Optional)</label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: '#606080' }} />
                <input
                  type="tel"
                  {...register('phone')}
                  className="input-field pl-10"
                  placeholder="+919876543210"
                  id="register-phone"
                />
              </div>
              {errors.phone && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: '#a0a0c0' }}>Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: '#606080' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                    pattern: {
                      value: /(?=.*[A-Z])(?=.*\d)/,
                      message: 'Must contain an uppercase letter and a number',
                    },
                  })}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  id="register-password"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: '#a0a0c0' }}>Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: '#606080' }} />
                <input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Confirm your password',
                    validate: (value) => value === passwordVal || 'Passwords do not match',
                  })}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  id="register-confirmpassword"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.confirmPassword.message}</p>}
            </div>

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
                id="register-submit"
              >
                {loading ? <FiLoader className="animate-spin" size={18} /> : null}
                {loading ? 'Creating Account...' : 'Sign Up'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
