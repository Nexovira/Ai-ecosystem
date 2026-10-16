import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Nexovira Horizon Gateway / Convergence Brand Identity
 * 
 * Concept: MANY POSSIBILITIES → ONE INTELLIGENT ECOSYSTEM
 * Symmetrical geometric gateway structure symbolizing multiple distinct
 * pathways and disciplines converging toward a unified intelligent focal horizon.
 * 
 * Modular and replaceable: If an updated vector brand asset is provided in
 * subsequent phases, update this single component without affecting layout.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: { symbol: 24, text: 'text-base tracking-[0.2em]' },
    md: { symbol: 32, text: 'text-lg tracking-[0.24em]' },
    lg: { symbol: 40, text: 'text-xl tracking-[0.28em]' },
    xl: { symbol: 56, text: 'text-2xl tracking-[0.32em]' },
  };

  const { symbol, text } = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="Nexovira Home"
    >
      {/* Horizon Gateway / Convergence Symbol */}
      <svg
        width={symbol}
        height={symbol}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="nexoGatewayGrad1" x1="12" y1="52" x2="32" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0682F4" />
            <stop offset="100%" stopColor="#08E6F9" />
          </linearGradient>
          <linearGradient id="nexoGatewayGrad2" x1="52" y1="52" x2="32" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0682F4" />
            <stop offset="100%" stopColor="#08E6F9" />
          </linearGradient>
          <linearGradient id="nexoGatewayCenter" x1="32" y1="56" x2="32" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#01213D" />
            <stop offset="40%" stopColor="#0682F4" />
            <stop offset="100%" stopColor="#7CF9FD" />
          </linearGradient>
        </defs>

        {/* Outer Convergence Gateway Arch / Wings */}
        <path
          d="M32 10L14 48H22L32 26L42 48H50L32 10Z"
          fill="url(#nexoGatewayGrad1)"
        />

        {/* Inner Horizon Stele / Converging Portal */}
        <path
          d="M32 20L24 50H28L32 38L36 50H40L32 20Z"
          fill="url(#nexoGatewayCenter)"
          opacity="0.9"
        />

        {/* Horizon Focal Apex Node */}
        <circle cx="32" cy="10" r="3" fill="#08E6F9" />

        {/* Base Convergence Baseline Accent */}
        <rect x="20" y="52" width="24" height="2" rx="1" fill="#4DDEEA" opacity="0.6" />
      </svg>

      {/* Brand Wordmark */}
      {showWordmark && (
        <span
          className={`font-display font-bold uppercase text-white ${text} transition-colors hover:text-[#08E6F9]`}
        >
          NEXOVIRA
        </span>
      )}
    </div>
  );
};
