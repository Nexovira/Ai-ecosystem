import React, { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
  onClick?: () => void;
}

/**
 * Official Nexovira Brand Identity Logo
 * Incorporates the official electric-blue convergence insignia with cyan-to-royal gradient.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  variant = 'auto',
  className = '',
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: { symbol: 28, text: 'text-base tracking-[0.16em]', imgSize: 28 },
    md: { symbol: 36, text: 'text-lg tracking-[0.18em]', imgSize: 36 },
    lg: { symbol: 44, text: 'text-xl tracking-[0.2em]', imgSize: 44 },
    xl: { symbol: 56, text: 'text-2xl tracking-[0.22em]', imgSize: 56 },
  };

  const { symbol, text } = sizeMap[size];

  // Dynamic textColor based on variant
  const textColor =
    variant === 'light'
      ? 'text-white hover:text-[#08B3F8]'
      : variant === 'dark'
      ? 'text-[#14283F] hover:text-[#0169FA]'
      : 'text-current hover:text-[#0169FA]';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="Nexovira Home"
    >
      {/* Official Nexovira Logo Insignia */}
      <div
        className="relative shrink-0 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-xs transition-transform duration-200 hover:scale-105"
        style={{ width: symbol, height: symbol }}
      >
        {!imgError ? (
          <img
            src="/assets/aistudio/IMG-20261029-WA0008_84e40fd0.jpg"
            alt="Nexovira"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          /* SVG Geometric Convergence Fallback matching the official logo */
          <svg
            width={symbol}
            height={symbol}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="nexoFallbackGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#08B3F8" />
                <stop offset="35%" stopColor="#0169FA" />
                <stop offset="100%" stopColor="#032FC8" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" fill="#000000" />
            <circle cx="32" cy="32" r="8" fill="url(#nexoFallbackGrad)" />
            <path
              d="M32 14C24 14 18 20 18 28C22 28 26 24 30 20C30.6 18 31.2 16 32 14Z"
              fill="url(#nexoFallbackGrad)"
            />
            <path
              d="M50 32C50 24 44 18 36 18C36 22 40 26 44 30C46 30.6 48 31.2 50 32Z"
              fill="url(#nexoFallbackGrad)"
            />
            <path
              d="M32 50C40 50 46 44 46 36C42 36 38 40 34 44C33.4 46 32.8 48 32 50Z"
              fill="url(#nexoFallbackGrad)"
            />
            <path
              d="M14 32C14 40 20 46 28 46C28 42 24 38 20 34C18 33.4 16 32.8 14 32Z"
              fill="url(#nexoFallbackGrad)"
            />
          </svg>
        )}
      </div>

      {/* Brand Wordmark */}
      {showWordmark && (
        <span
          className={`font-display font-extrabold uppercase tracking-widest ${text} ${textColor} transition-colors leading-none`}
        >
          NEXOVIRA
        </span>
      )}
    </div>
  );
};

