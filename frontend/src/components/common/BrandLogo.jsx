import React from 'react';

export function BrandLogoIcon({ className = "w-9 h-9", iconSize = "w-5 h-5" }) {
  return (
    <div className={`${className} rounded-xl gradient-bg flex items-center justify-center text-white shadow-lg glow-purple shrink-0 relative overflow-hidden group border border-white/20`}>
      {/* Background Gloss Highlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Custom Ultra-Crisp Film Strip & Ticket Vector Icon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSize} drop-shadow-md text-white transform group-hover:scale-110 transition-transform duration-300`}
      >
        <rect
          x="2.5"
          y="3.5"
          width="19"
          height="17"
          rx="3.5"
          fill="rgba(255, 255, 255, 0.12)"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        {/* Vertical Film Borders */}
        <line x1="7.5" y1="3.5" x2="7.5" y2="20.5" stroke="currentColor" strokeWidth="1.6" />
        <line x1="16.5" y1="3.5" x2="16.5" y2="20.5" stroke="currentColor" strokeWidth="1.6" />
        
        {/* Horizontal Divider */}
        <line x1="2.5" y1="12" x2="21.5" y2="12" stroke="currentColor" strokeWidth="1.6" />
        
        {/* Sprocket Holes Left */}
        <rect x="4.2" y="6" width="1.6" height="2" rx="0.5" fill="currentColor" />
        <rect x="4.2" y="14.5" width="1.6" height="2" rx="0.5" fill="currentColor" />
        
        {/* Sprocket Holes Right */}
        <rect x="18.2" y="6" width="1.6" height="2" rx="0.5" fill="currentColor" />
        <rect x="18.2" y="14.5" width="1.6" height="2" rx="0.5" fill="currentColor" />
        
        {/* Center Sparkling Cinema Star */}
        <path
          d="M12 7.8L13.1 10.3L15.8 10.5L13.8 12.3L14.4 15L12 13.6L9.6 15L10.2 12.3L8.2 10.5L10.9 10.3L12 7.8Z"
          fill="#facc15"
        />
      </svg>
    </div>
  );
}

export default BrandLogoIcon;
