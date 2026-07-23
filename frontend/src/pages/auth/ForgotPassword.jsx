import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiMail, FiLoader, FiArrowLeft, FiCheckCircle, FiFilm } from 'react-icons/fi';
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#070710] relative overflow-hidden">
      
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 rounded-3xl glass-card border border-white/15 shadow-2xl space-y-6 z-10"
      >
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center text-white text-sm font-bold shadow-md">
              <FiFilm size={18} />
            </div>
            <span className="text-xl font-black gradient-text">CineMax</span>
          </Link>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl">
              <FiCheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-black text-white">Reset Link Sent</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              We have dispatched password recovery instructions to your email address. Please check your inbox.
            </p>
            <Link
              to="/login"
              className="btn-secondary flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-2xl w-full"
            >
              <FiArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Reset Password</h2>
            <p className="text-xs text-slate-400 mb-6">
              Enter your registered email address below to receive password recovery instructions.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email address is required',
                      pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                    })}
                    className="glass-input text-xs pl-10 pr-4 py-3 rounded-2xl w-full outline-none"
                    placeholder="name@example.com"
                  />
                  <FiMail className="absolute left-3.5 top-3.5 text-slate-400" size={15} />
                </div>
                {errors.email && <span className="text-[10px] text-pink-400 mt-1">{errors.email.message}</span>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-2xl glow-purple mt-2"
              >
                {loading ? <FiLoader className="animate-spin" size={16} /> : null}
                {loading ? 'Sending Reset Link...' : 'Send Recovery Link'}
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-white pt-2 transition-colors"
              >
                <FiArrowLeft size={14} /> Back to Sign In
              </Link>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
