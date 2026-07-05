import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiLoader, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api.js';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Reset token is missing or invalid.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({
        token,
        password: data.password,
      });
      setSuccess(true);
      toast.success('Password reset successful! 🔒');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
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

        {!token ? (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-black" style={{ color: '#ef4444' }}>Invalid Reset Link</h2>
            <p style={{ color: '#a0a0c0' }} className="text-sm">
              The password reset token is missing or has expired. Please request a new link.
            </p>
            <Link
              to="/forgot-password"
              className="btn-primary w-full py-3.5 text-base block text-center"
            >
              Request New Link
            </Link>
          </div>
        ) : success ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center text-emerald-500">
              <FiCheckCircle size={56} className="animate-bounce" />
            </div>
            <h2 className="text-2xl font-black" style={{ color: '#f0f0f8' }}>Password Reset Complete</h2>
            <p style={{ color: '#a0a0c0' }} className="text-sm">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Link
              to="/login"
              className="btn-primary w-full py-3.5 text-base block text-center"
            >
              Log In
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-black mb-2" style={{ color: '#f0f0f8' }}>Reset Password</h2>
            <p className="text-sm mb-6" style={{ color: '#a0a0c0' }}>
              Please enter your new password below.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Password */}
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: '#a0a0c0' }}>New Password</label>
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
                    id="reset-password-input"
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
                    id="reset-confirmpassword-input"
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.confirmPassword.message}</p>}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
                id="reset-submit"
              >
                {loading ? <FiLoader className="animate-spin" size={18} /> : null}
                {loading ? 'Resetting password...' : 'Reset Password'}
              </motion.button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
