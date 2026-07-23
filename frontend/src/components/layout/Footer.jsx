import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube, FiMail, FiPhone, FiFilm, FiShield, FiSend, FiAward, FiUsers, FiStar } from 'react-icons/fi';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { BrandLogoIcon } from '../common/BrandLogo.jsx';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success('🎉 Thank you for subscribing to CineMax updates!');
      setEmail('');
    }
  };

  return (
    <footer className="mt-28 bg-[#04040a] border-t border-white/10 relative overflow-hidden">
      {/* Glow ambient spots */}
      <div className="absolute -top-40 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Stats Counter Section */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl">
        <div className="container-app py-14 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            
            <div className="flex items-center justify-center gap-4 p-4 rounded-2xl glass-card border border-white/5 shadow-xl">
              <FiFilm className="text-purple-400 shrink-0" size={32} />
              <div className="flex flex-col text-left">
                <span className="text-2xl sm:text-3xl font-black gradient-text font-numeric leading-none py-1 inline-block">
                  5,000+
                </span>
                <p className="text-xs font-bold text-slate-400 font-heading tracking-wide mt-1">Movies Screened</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 p-4 rounded-2xl glass-card border border-white/5 shadow-xl">
              <FiUsers className="text-pink-400 shrink-0" size={32} />
              <div className="flex flex-col text-left">
                <span className="text-2xl sm:text-3xl font-black gradient-text font-numeric leading-none py-1 inline-block">
                  10M+
                </span>
                <p className="text-xs font-bold text-slate-400 font-heading tracking-wide mt-1">Happy Moviegoers</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 p-4 rounded-2xl glass-card border border-white/5 shadow-xl">
              <FiAward className="text-amber-400 shrink-0" size={32} />
              <div className="flex flex-col text-left">
                <span className="text-2xl sm:text-3xl font-black gradient-text font-numeric leading-none py-1 inline-block">
                  800+
                </span>
                <p className="text-xs font-bold text-slate-400 font-heading tracking-wide mt-1">Partner Cinemas</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 p-4 rounded-2xl glass-card border border-white/5 shadow-xl">
              <FiStar className="text-yellow-400 fill-yellow-400 shrink-0" size={30} />
              <div className="flex flex-col text-left">
                <span className="text-2xl sm:text-3xl font-black gradient-text font-numeric leading-none py-1 inline-block">
                  4.9 / 5.0
                </span>
                <p className="text-xs font-bold text-slate-400 font-heading tracking-wide mt-1">Average App Rating</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Footer Column Content */}
      <div className="container-app pt-20 sm:pt-24 pb-20 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <BrandLogoIcon className="w-12 h-12" iconSize="w-6 h-6" />
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black tracking-tight gradient-text font-heading">CineMax</span>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest -mt-0.5 font-heading">Cinema Pass</span>
              </div>
            </Link>
            
            <p className="text-xs leading-relaxed text-slate-400 max-w-md font-sans">
              Your ultimate movie ticket booking destination. Discover trending blockbusters, select your favorite seat tiers, and enjoy instant digital tickets with Dolby Cinema experiences.
            </p>
            
            {/* Newsletter Input */}
            <form onSubmit={handleSubscribe} className="space-y-3 max-w-md pt-3">
              <label className="text-xs font-bold text-slate-200 block font-heading tracking-wide">
                Get Exclusive Movie Deals & Premiere Updates
              </label>
              <div className="flex gap-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="glass-input text-xs px-4 py-3 rounded-xl w-full text-white outline-none font-sans"
                  required
                />
                <button type="submit" className="btn-primary shrink-0 px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg font-heading">
                  <FiSend size={14} />
                  Subscribe
                </button>
              </div>
            </form>

            <div className="flex gap-3 pt-3">
              {[
                { icon: FiInstagram, color: 'hover:text-pink-400 hover:border-pink-500/50' },
                { icon: FiTwitter, color: 'hover:text-cyan-400 hover:border-cyan-500/50' },
                { icon: FiFacebook, color: 'hover:text-blue-400 hover:border-blue-500/50' },
                { icon: FiYoutube, color: 'hover:text-red-400 hover:border-red-500/50' },
              ].map(({ icon: Icon, color }, i) => (
                <a
                  key={i}
                  href="#"
                  className={`w-10 h-10 rounded-xl glass-card flex items-center justify-center text-slate-400 transition-all ${color}`}
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-5 pt-1">
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-200 font-heading flex items-center gap-2 pb-2 border-b border-white/10">
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
              Explore Movies
            </h4>
            <ul className="space-y-3 text-xs font-sans">
              {['Now Showing', 'Coming Soon', 'IMAX 3D Experience', 'Top Rated Blockbusters', 'Trending Theatres'].map((link) => (
                <li key={link}>
                  <Link to="/" className="text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500/60" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-5 pt-1">
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-200 font-heading flex items-center gap-2 pb-2 border-b border-white/10">
              <span className="w-2 h-2 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50" />
              Company & Help
            </h4>
            <ul className="space-y-3 text-xs font-sans">
              {['About CineMax', 'Careers', 'Partner Cinema Portal', 'Privacy Policy', 'Terms of Service'].map((link) => (
                <li key={link}>
                  <Link to="/" className="text-slate-400 hover:text-pink-400 transition-colors flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500/60" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Apps & Support Contact */}
          <div className="space-y-5 pt-1">
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-200 font-heading flex items-center gap-2 pb-2 border-b border-white/10">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
              Support & App
            </h4>
            <div className="space-y-3.5 text-xs text-slate-400 font-sans">
              <a href="mailto:support@cinemax.com" className="flex items-center gap-2.5 hover:text-purple-300 transition-colors font-medium">
                <FiMail className="text-purple-400 shrink-0" size={16} />
                support@cinemax.com
              </a>
              <a href="tel:+918000123456" className="flex items-center gap-2.5 hover:text-purple-300 transition-colors font-numeric font-bold">
                <FiPhone className="text-purple-400 shrink-0" size={16} />
                +91 8000 123 456
              </a>
            </div>

            <div className="pt-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 font-heading">
                Get Mobile App
              </p>
              <div className="flex flex-col gap-2.5">
                <button className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass-card border border-white/10 hover:border-purple-500/50 transition-all text-xs font-bold text-slate-200">
                  <span> App Store</span>
                </button>
                <button className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass-card border border-white/10 hover:border-purple-500/50 transition-all text-xs font-bold text-slate-200">
                  <span>▶ Google Play</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 CineMax Ticketing System. All rights reserved. Crafted with precision for movie lovers.</p>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1">
              <FiShield size={12} />
              256-Bit SSL Encrypted
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
              Instant Refund Guarantee
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
