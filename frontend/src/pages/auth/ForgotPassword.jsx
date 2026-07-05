import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiMail, FiLoader, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api.js';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(data.email);
      setSuccess(true);
      toast.success('Password reset link sent! ✉️');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0a0a12' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl glass"
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎬</div>
          <h1 className="text-2xl font-black gradient-text">CineMax</h1>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center text-emerald-500">
              <FiCheckCircle size={56} className="animate-bounce" />
            </div>
            <h2 className="text-2xl font-black" style={{ color: '#f0f0f8' }}>Check your email</h2>
            <p style={{ color: '#a0a0c0' }} className="text-sm leading-relaxed">
              We have sent a password reset link to your email address. Please click the link to choose a new password.
            </p>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-xl w-full transition-all"
              style={{ background: '#1e1e35', border: '1px solid #2d2d4a', color: '#f0f0f8' }}
            >
              <FiArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-black mb-2" style={{ color: '#f0f0f8' }}>Forgot Password?</h2>
            <p className="text-sm mb-6" style={{ color: '#a0a0c0' }}>
              No worries! Enter your email below and we'll send you a password reset link.
            </p>

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
                    id="forgot-email"
                  />
                </div>
                {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email.message}</p>}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
                id="forgot-submit"
              >
                {loading ? <FiLoader className="animate-spin" size={18} /> : null}
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </motion.button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium pt-2 hover:text-white transition-colors"
                style={{ color: '#a0a0c0' }}
              >
                <FiArrowLeft size={16} /> Back to Login
              </Link>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
