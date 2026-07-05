import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLoader, FiCheckCircle, FiXCircle, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api.js';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const effectRan = useRef(false);

  const token = searchParams.get('token');

  useEffect(() => {
    // Avoid double trigger in React 18/19 Strict Mode
    if (effectRan.current) return;
    effectRan.current = true;

    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }

      try {
        await authAPI.verifyEmail(token);
        setStatus('success');
        toast.success('Email verified successfully! 🎉');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed or link expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0a0a12' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl glass text-center"
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎬</div>
          <h1 className="text-2xl font-black gradient-text">CineMax</h1>
        </div>

        {status === 'verifying' && (
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <FiLoader size={48} className="animate-spin text-purple-500" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#f0f0f8' }}>Verifying your email...</h2>
            <p style={{ color: '#a0a0c0' }} className="text-sm">
              Please wait while we confirm your email address.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-4">
            <div className="flex justify-center text-emerald-500">
              <FiCheckCircle size={56} className="animate-bounce" />
            </div>
            <h2 className="text-2xl font-black" style={{ color: '#f0f0f8' }}>Email Verified!</h2>
            <p style={{ color: '#a0a0c0' }} className="text-sm">
              Thank you! Your email address has been successfully verified. You can now access all features.
            </p>
            <Link
              to="/login"
              className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
            >
              Go to Login <FiArrowRight size={16} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 py-4">
            <div className="flex justify-center text-rose-500">
              <FiXCircle size={56} />
            </div>
            <h2 className="text-2xl font-black" style={{ color: '#f0f0f8' }}>Verification Failed</h2>
            <p style={{ color: '#ef4444' }} className="text-sm font-medium">
              {message}
            </p>
            <p style={{ color: '#a0a0c0' }} className="text-sm leading-relaxed">
              If the token has expired, you can request a new verification link after logging in.
            </p>
            <div className="pt-2 grid grid-cols-2 gap-4">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-xl transition-all"
                style={{ background: '#1e1e35', border: '1px solid #2d2d4a', color: '#f0f0f8' }}
              >
                Go to Login
              </Link>
              <Link
                to="/register"
                className="btn-primary py-3 text-sm font-medium"
              >
                Sign Up Again
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
