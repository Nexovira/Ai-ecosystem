import React, { useState } from 'react';

/**
 * Horizon Gateway / Convergence Visualizer
 *
 * Represents: MANY POSSIBILITIES → ONE INTELLIGENT ECOSYSTEM
 * Features geometric pathways, perspective convergence, subtle blue light,
 * depth, clean motion, and intelligent node relationships.
 * Respects strict Nexovira color system: #01213D, #0682F4, #05A9F7, #06C3F8, #08E6F9, #CCD2D9.
 */
export const ConvergenceVisualizer: React.FC = () => {
  const [activePathway, setActivePathway] = useState<number | null>(null);

  const pathways = [
    { id: 1, label: 'AI Intelligence', xStart: 80, xEnd: 300, yStart: 380, yEnd: 110, delay: '0s' },
    { id: 2, label: 'Marketplace Commerce', xStart: 160, xEnd: 310, yStart: 390, yEnd: 115, delay: '0.4s' },
    { id: 3, label: 'Digital Services', xStart: 250, xEnd: 318, yStart: 400, yEnd: 120, delay: '0.8s' },
    { id: 4, label: 'Academy Learning', xStart: 350, xEnd: 322, yStart: 400, yEnd: 120, delay: '1.2s' },
    { id: 5, label: 'Digital Assets', xStart: 440, xEnd: 330, yStart: 390, yEnd: 115, delay: '1.6s' },
    { id: 6, label: 'Synergy & Scale', xStart: 520, xEnd: 340, yStart: 380, yEnd: 110, delay: '2.0s' },
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-[16/11] flex items-center justify-center select-none">
      {/* Background ambient radial glow within approved palette */}
      <div className="absolute inset-0 bg-radial from-[#0682F4]/15 via-[#01213D]/40 to-transparent pointer-events-none rounded-2xl" />

      <svg
        viewBox="0 0 600 420"
        className="w-full h-full drop-shadow-2xl overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Nexovira Convergence Diagram"
      >
        <defs>
          <linearGradient id="horizonGlow" x1="300" y1="20" x2="300" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#08E6F9" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#0682F4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#01213D" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="pathwayGrad" x1="0%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#0682F4" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#06C3F8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#08E6F9" stopOpacity="0.95" />
          </linearGradient>

          <radialGradient id="apexGlow" cx="300" cy="110" r="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#08E6F9" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#0682F4" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#01213D" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Apex Radial Aura */}
        <circle cx="300" cy="110" r="90" fill="url(#apexGlow)" />

        {/* Perspective Ground Grid Lines */}
        <g stroke="#0682F4" strokeOpacity="0.15" strokeWidth="1">
          <line x1="10" y1="400" x2="590" y2="400" />
          <line x1="60" y1="350" x2="540" y2="350" />
          <line x1="120" y1="300" x2="480" y2="300" />
          <line x1="180" y1="250" x2="420" y2="250" />
          <line x1="240" y1="200" x2="360" y2="200" />
        </g>

        {/* Converging Geometric Pathways */}
        {pathways.map((p) => {
          const isHovered = activePathway === p.id;
          return (
            <g
              key={p.id}
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => setActivePathway(p.id)}
              onMouseLeave={() => setActivePathway(null)}
            >
              {/* Dynamic Path Beam */}
              <line
                x1={p.xStart}
                y1={p.yStart}
                x2={p.xEnd}
                y2={p.yEnd}
                stroke={isHovered ? '#08E6F9' : 'url(#pathwayGrad)'}
                strokeWidth={isHovered ? 2.5 : 1.5}
                strokeDasharray="4 2"
                className="transition-all duration-300"
              />

              {/* Base Origin Node */}
              <circle
                cx={p.xStart}
                cy={p.yStart}
                r={isHovered ? 5 : 3.5}
                fill={isHovered ? '#08E6F9' : '#0682F4'}
                className="transition-all duration-300"
              />
            </g>
          );
        })}

        {/* Architectural Horizon Gateway Structure */}
        {/* Gateway Outer Vault */}
        <path
          d="M300 70 L230 220 H255 L300 120 L345 220 H370 Z"
          fill="#0682F4"
          fillOpacity="0.3"
          stroke="#08E6F9"
          strokeWidth="1.5"
        />

        {/* Gateway Inner Core Portal */}
        <path
          d="M300 95 L260 215 H275 L300 150 L325 215 H340 Z"
          fill="#08E6F9"
          fillOpacity="0.4"
          stroke="#7CF9FD"
          strokeWidth="1"
        />

        {/* Central Convergence Focal Apex */}
        <circle cx="300" cy="70" r="5" fill="#08E6F9" />
        <circle cx="300" cy="70" r="9" stroke="#08E6F9" strokeWidth="1" strokeOpacity="0.5" />
        <circle cx="300" cy="70" r="15" stroke="#0682F4" strokeWidth="1" strokeOpacity="0.25" />

        {/* Horizontal Horizon Line */}
        <line x1="80" y1="110" x2="520" y2="110" stroke="#06C3F8" strokeWidth="1" strokeOpacity="0.2" />

        {/* Interactive Pathway Identifier */}
        {activePathway && (
          <g>
            <rect
              x="200"
              y="20"
              width="200"
              height="28"
              rx="6"
              fill="#011B33"
              stroke="#08E6F9"
              strokeWidth="1"
            />
            <text
              x="300"
              y="38"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="600"
              letterSpacing="1"
            >
              {pathways.find((p) => p.id === activePathway)?.label.toUpperCase()}
            </text>
          </g>
        )}
      </svg>

      {/* Horizon Label Caption */}
      <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
        <span className="text-[11px] font-mono tracking-widest text-[#CCD2D9]/70 uppercase">
          Horizon Convergence · Unified Ecosystem Architecture
        </span>
      </div>
    </div>
  );
};
