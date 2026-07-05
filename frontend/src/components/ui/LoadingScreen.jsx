import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0a0a12' }}>
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-4 border-transparent mx-auto mb-6"
          style={{
            borderTopColor: '#7c3aed',
            borderRightColor: '#ec4899',
          }}
        />
        <motion.h1
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl font-bold gradient-text"
        >
          🎬 CineMax
        </motion.h1>
        <p className="mt-2 text-sm" style={{ color: '#606080' }}>Loading your experience...</p>
      </div>
    </div>
  );
}
