import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube, FiMail, FiPhone } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer style={{ background: '#06060e', borderTop: '1px solid #2d2d4a' }} className="mt-20">
      <div className="container-app py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎬</span>
              <span className="text-xl font-black gradient-text">CineMax</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#606080' }}>
              Your premium destination for booking movie tickets. Experience cinema like never before with our seamless booking platform.
            </p>
            <div className="flex gap-3">
              {[FiInstagram, FiTwitter, FiFacebook, FiYoutube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-purple-600/20"
                  style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', color: '#a0a0c0' }}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: '#f0f0f8' }}>Quick Links</h4>
            <ul className="space-y-2.5">
              {['Now Showing', 'Coming Soon', 'Trending Movies', 'Theatres Near You', 'Offers & Deals'].map((link) => (
                <li key={link}>
                  <Link to="/" className="text-sm transition-colors hover:text-purple-400" style={{ color: '#606080' }}>
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: '#f0f0f8' }}>Company</h4>
            <ul className="space-y-2.5">
              {['About Us', 'Careers', 'Press', 'Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                <li key={link}>
                  <Link to="/" className="text-sm transition-colors hover:text-purple-400" style={{ color: '#606080' }}>
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: '#f0f0f8' }}>Contact</h4>
            <div className="space-y-3">
              <a href="mailto:support@cinemax.com" className="flex items-center gap-3 text-sm hover:text-purple-400 transition-colors" style={{ color: '#606080' }}>
                <FiMail size={15} className="text-purple-400" />
                support@cinemax.com
              </a>
              <a href="tel:+918000123456" className="flex items-center gap-3 text-sm hover:text-purple-400 transition-colors" style={{ color: '#606080' }}>
                <FiPhone size={15} className="text-purple-400" />
                +91 8000 123 456
              </a>
              <div className="mt-6">
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#606080' }}>Download App</p>
                <div className="flex gap-2">
                  <div className="px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:border-purple-500"
                    style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', color: '#a0a0c0', cursor: 'pointer' }}>
                    📱 iOS App
                  </div>
                  <div className="px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:border-purple-500"
                    style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', color: '#a0a0c0', cursor: 'pointer' }}>
                    🤖 Android
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderColor: '#2d2d4a' }}>
          <p className="text-xs" style={{ color: '#606080' }}>
            © 2026 CineMax. All rights reserved. | Made with ❤️ in India
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#1a1a2e', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              🔒 SSL Secured
            </span>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#1a1a2e', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              💳 Razorpay
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
