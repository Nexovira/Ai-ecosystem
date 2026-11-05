import React, { useState } from 'react';

interface ExpertAvatarProps {
  fullName: string;
  profileImage?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const getExpertInitials = (name: string): string => {
  if (!name || !name.trim()) return 'EX';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const ExpertAvatar: React.FC<ExpertAvatarProps> = ({
  fullName,
  profileImage,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = getExpertInitials(fullName);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs rounded-lg',
    md: 'w-16 h-16 text-lg rounded-xl',
    lg: 'w-20 h-20 text-2xl rounded-2xl',
    xl: 'w-24 h-24 sm:w-32 sm:h-32 text-3xl sm:text-4xl rounded-2xl sm:rounded-3xl',
  }[size];

  const hasValidImage = Boolean(profileImage && profileImage.trim() && !imageError);

  if (hasValidImage) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden bg-[#011B33] border border-[#0682F4]/40 ${sizeClasses} ${className}`}
      >
        <img
          src={profileImage}
          alt={fullName}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Pure clean initials avatar (no placeholder stock photo, no broken icon)
  return (
    <div
      className={`relative shrink-0 flex items-center justify-center font-black font-mono tracking-wider text-[#08E6F9] bg-gradient-to-br from-[#01213D] to-[#011B33] border-2 border-[#08E6F9]/50 shadow-md select-none ${sizeClasses} ${className}`}
      aria-label={`${fullName} initials avatar (${initials})`}
      title={fullName}
    >
      <span>{initials}</span>
      <div className="absolute inset-0 rounded-inherit bg-[#08E6F9]/5 pointer-events-none" />
    </div>
  );
};
