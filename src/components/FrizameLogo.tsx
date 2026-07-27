import React from 'react';

interface FrizameLogoProps {
  className?: string;
  variant?: 'full' | 'header' | 'badge' | 'mono';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Official Frizame Logo Component
 * Reproduces the official brand logo featuring the retro ice cube running character
 * inside a rounded double-stroke badge with bold Frizame typography.
 */
export const FrizameLogo: React.FC<FrizameLogoProps> = ({
  className = 'h-10',
  variant = 'full',
}) => {
  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {/* Ice Cube Character Emblem */}
        <div className="relative w-10 h-10 shrink-0 bg-white rounded-xl p-0.5 border-2 border-[#017E9A] shadow-md flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Double Frame */}
            <rect x="5" y="5" width="90" height="90" rx="18" fill="#FFFFFF" stroke="#0B4F6C" strokeWidth="4" />
            <rect x="10" y="10" width="80" height="80" rx="14" fill="none" stroke="#017E9A" strokeWidth="1.5" />
            
            {/* Ice Cube Body */}
            <path d="M 32 25 L 68 25 L 75 38 L 25 38 Z" fill="#E8F4F8" stroke="#0B4F6C" strokeWidth="3" strokeLinejoin="round" />
            <rect x="25" y="38" width="50" height="32" rx="4" fill="#FFFFFF" stroke="#0B4F6C" strokeWidth="3" />
            
            {/* Eyes */}
            <ellipse cx="40" cy="50" rx="4" ry="7" fill="#0B4F6C" />
            <ellipse cx="60" cy="50" rx="4" ry="7" fill="#0B4F6C" />
            <circle cx="41" cy="48" r="1.5" fill="#FFFFFF" />
            <circle cx="61" cy="48" r="1.5" fill="#FFFFFF" />
            
            {/* Smile */}
            <path d="M 44 61 Q 50 66 56 61" fill="none" stroke="#0B4F6C" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Sweat / Ice Drops */}
            <circle cx="70" cy="44" r="1.5" fill="#017E9A" />
            <circle cx="73" cy="52" r="1.2" fill="#017E9A" />
            
            {/* Running legs */}
            <path d="M 40 70 Q 35 80 28 82" fill="none" stroke="#0B4F6C" strokeWidth="3" strokeLinecap="round" />
            <path d="M 60 70 Q 65 80 72 82" fill="none" stroke="#0B4F6C" strokeWidth="3" strokeLinecap="round" />
            
            {/* Shoes */}
            <ellipse cx="26" cy="83" rx="6" ry="3" fill="#0B4F6C" />
            <ellipse cx="74" cy="83" rx="6" ry="3" fill="#0B4F6C" />
            
            {/* Water Ripple Base */}
            <path d="M 20 88 Q 50 93 80 88" fill="none" stroke="#017E9A" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Typography */}
        <div className="flex flex-col">
          <span className="font-brand font-extrabold text-2xl text-white tracking-wide leading-none">
            Frizame
          </span>
          <span className="text-[9px] text-[#A3D9E8] uppercase tracking-widest font-bold mt-0.5">
            Congelados Premium
          </span>
        </div>
      </div>
    );
  }

  // Full Badge SVG Logo
  return (
    <div className={`inline-block ${className}`}>
      <svg viewBox="0 0 400 400" className="w-full h-full max-h-full">
        {/* Outer Rounded Container */}
        <rect
          x="10"
          y="10"
          width="380"
          height="380"
          rx="60"
          fill="#FAFDFF"
          stroke="#0B4F6C"
          strokeWidth="10"
        />
        {/* Inner Border */}
        <rect
          x="24"
          y="24"
          width="352"
          height="352"
          rx="48"
          fill="none"
          stroke="#017E9A"
          strokeWidth="3.5"
        />

        {/* Ice Cube Character Group */}
        <g transform="translate(100, 40)">
          {/* Top 3D Face */}
          <polygon points="35,50 165,50 195,85 5,85" fill="#E2F3F8" stroke="#0B4F6C" strokeWidth="8" strokeLinejoin="round" />
          
          {/* Front Face */}
          <rect x="5" y="85" width="190" height="110" rx="12" fill="#FFFFFF" stroke="#0B4F6C" strokeWidth="8" />
          
          {/* Right 3D Side */}
          <polygon points="195,85 220,60 220,150 195,195" fill="#CBE8F2" stroke="#0B4F6C" strokeWidth="8" strokeLinejoin="round" />

          {/* Big Retro Eyes */}
          <ellipse cx="65" cy="135" rx="18" ry="28" fill="#0B4F6C" />
          <ellipse cx="135" cy="135" rx="18" ry="28" fill="#0B4F6C" />
          <circle cx="70" cy="125" r="7" fill="#FFFFFF" />
          <circle cx="140" cy="125" r="7" fill="#FFFFFF" />
          <circle cx="62" cy="142" r="3" fill="#FFFFFF" />
          <circle cx="132" cy="142" r="3" fill="#FFFFFF" />

          {/* Happy Mouth */}
          <path d="M 80 168 Q 100 185 120 168" fill="none" stroke="#0B4F6C" strokeWidth="7" strokeLinecap="round" />

          {/* Sweat / Ice Melting Drops */}
          <path d="M 175 105 Q 185 115 175 125 Q 165 115 175 105 Z" fill="#017E9A" />
          <path d="M 190 135 Q 198 142 190 150 Q 182 142 190 135 Z" fill="#017E9A" />

          {/* Gloved Arms */}
          <path d="M 5 130 C -20 130 -25 100 -10 95" fill="none" stroke="#0B4F6C" strokeWidth="7" strokeLinecap="round" />
          <circle cx="-10" cy="95" r="10" fill="#FFFFFF" stroke="#0B4F6C" strokeWidth="6" />

          <path d="M 195 130 C 220 130 225 100 210 95" fill="none" stroke="#0B4F6C" strokeWidth="7" strokeLinecap="round" />
          <circle cx="210" cy="95" r="10" fill="#FFFFFF" stroke="#0B4F6C" strokeWidth="6" />

          {/* Running Legs */}
          <path d="M 60 195 C 45 230 20 240 30 255" fill="none" stroke="#0B4F6C" strokeWidth="9" strokeLinecap="round" />
          <path d="M 140 195 C 160 230 180 240 170 255" fill="none" stroke="#0B4F6C" strokeWidth="9" strokeLinecap="round" />

          {/* Sneakers / Feet */}
          <ellipse cx="22" cy="258" rx="20" ry="10" fill="#FFFFFF" stroke="#0B4F6C" strokeWidth="8" />
          <ellipse cx="178" cy="258" rx="20" ry="10" fill="#FFFFFF" stroke="#0B4F6C" strokeWidth="8" />

          {/* Water Ripple Waves */}
          <path d="M -20 270 Q 100 288 220 270" fill="none" stroke="#017E9A" strokeWidth="6" strokeLinecap="round" />
          <path d="M 10 280 Q 100 295 190 280" fill="none" stroke="#0B4F6C" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Text "Frizame" */}
        <text
          x="200"
          y="350"
          textAnchor="middle"
          fill="#0B4F6C"
          fontSize="72"
          fontWeight="900"
          fontFamily="Fredoka, 'Arial Black', sans-serif"
          letterSpacing="1"
        >
          Frizame
        </text>
      </svg>
    </div>
  );
};
