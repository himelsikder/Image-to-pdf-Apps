import React from 'react';

interface AppLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 40, className = '', showText = false }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className="relative shrink-0 rounded-2xl overflow-hidden shadow-md shadow-blue-500/20 transition-transform duration-200 hover:scale-105"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 512 512"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full block"
        >
          <defs>
            <linearGradient id="logo-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>

            <linearGradient id="logo-border-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            <linearGradient id="logo-pdf-card" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>

            <linearGradient id="logo-pdf-badge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>

            <filter id="logo-shadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#000000" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Background Squircle */}
          <rect width="512" height="512" rx="112" fill="url(#logo-bg-grad)" />
          <rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="url(#logo-border-glow)" strokeWidth="6" strokeOpacity="0.5" />

          {/* Glow lights */}
          <circle cx="160" cy="180" r="100" fill="#38bdf8" fillOpacity="0.15" />
          <circle cx="350" cy="320" r="100" fill="#ef4444" fillOpacity="0.12" />

          {/* LEFT: IMAGE (IMG) CARD */}
          <g filter="url(#logo-shadow)" transform="translate(68, 120)">
            <rect width="180" height="240" rx="22" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="3" />
            {/* Viewport */}
            <rect x="14" y="14" width="152" height="150" rx="14" fill="#07273c" />
            {/* Sun */}
            <circle cx="125" cy="52" r="16" fill="#fde047" />
            {/* Mountains */}
            <path d="M14 140 L58 84 L96 130 L128 98 L166 148 L166 164 L14 164 Z" fill="#0284c7" />
            <path d="M14 164 L40 125 L75 164 Z" fill="#38bdf8" fillOpacity="0.7" />
            <path d="M70 164 L108 116 L144 164 Z" fill="#0ea5e9" />
            <path d="M120 164 L148 132 L166 154 L166 164 Z" fill="#38bdf8" />
            {/* IMG Label Badge */}
            <rect x="14" y="180" width="80" height="38" rx="10" fill="#0284c7" />
            <text x="54" y="206" fontFamily="sans-serif" fontWeight="900" fontSize="20" fill="#ffffff" textAnchor="middle">IMG</text>
            <circle cx="120" cy="199" r="4" fill="#7dd3fc" />
            <circle cx="135" cy="199" r="4" fill="#7dd3fc" />
            <circle cx="150" cy="199" r="4" fill="#7dd3fc" />
          </g>

          {/* RIGHT: PDF DOCUMENT CARD */}
          <g filter="url(#logo-shadow)" transform="translate(264, 152)">
            <rect width="180" height="240" rx="22" fill="url(#logo-pdf-card)" stroke="#cbd5e1" strokeWidth="2.5" />
            {/* Folded corner */}
            <path d="M136 0 L180 44 L136 44 Z" fill="#94a3b8" />
            <path d="M136 0 L136 44 L180 44" fill="none" stroke="#64748b" strokeWidth="2" />
            {/* Text lines */}
            <rect x="22" y="60" width="100" height="10" rx="5" fill="#64748b" fillOpacity="0.5" />
            <rect x="22" y="82" width="136" height="8" rx="4" fill="#94a3b8" fillOpacity="0.4" />
            <rect x="22" y="100" width="124" height="8" rx="4" fill="#94a3b8" fillOpacity="0.4" />
            <rect x="22" y="118" width="136" height="8" rx="4" fill="#94a3b8" fillOpacity="0.4" />
            {/* Diagram */}
            <rect x="22" y="138" width="136" height="26" rx="6" fill="#e2e8f0" />
            <rect x="28" y="144" width="36" height="14" rx="3" fill="#ef4444" fillOpacity="0.3" />
            <rect x="70" y="144" width="50" height="14" rx="3" fill="#3b82f6" fillOpacity="0.25" />
            {/* PDF Badge */}
            <rect x="22" y="180" width="80" height="38" rx="10" fill="url(#logo-pdf-badge)" />
            <text x="62" y="206" fontFamily="sans-serif" fontWeight="900" fontSize="20" fill="#ffffff" textAnchor="middle">PDF</text>
            <circle cx="136" cy="199" r="14" fill="#dcfce7" />
            <path d="M130 199 L134 203 L142 195" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* CENTER CONVERSION ARROWS */}
          <g filter="url(#logo-shadow)" transform="translate(256, 230)">
            <circle cx="0" cy="0" r="38" fill="#0f172a" stroke="url(#logo-border-glow)" strokeWidth="4" />
            <path d="M -16 -6 L 8 -6 M 0 -14 L 8 -6 L 0 2" fill="none" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 16 8 L -8 8 M 0 0 L -8 8 L 0 16" fill="none" stroke="#ec4899" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Top 100% Offline Pill */}
          <g transform="translate(256, 74)">
            <rect x="-92" y="-15" width="184" height="30" rx="15" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <circle cx="-70" cy="0" r="4.5" fill="#10b981" />
            <text x="4" y="5" fontFamily="sans-serif" fontWeight="800" fontSize="12" fill="#94a3b8" textAnchor="middle" letterSpacing="1.5">100% OFFLINE</text>
          </g>
        </svg>
      </div>

      {showText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 dark:text-white truncate">
              Img to Pdf
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 hidden min-[360px]:inline-block">
              OFFLINE
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
