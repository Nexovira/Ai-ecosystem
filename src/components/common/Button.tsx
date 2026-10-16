import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08E6F9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#01213D] active:scale-[0.98]';

  const sizeStyles = {
    sm: 'h-9 px-3.5 text-xs rounded-md gap-1.5',
    md: 'h-11 px-5 text-sm rounded-lg gap-2',
    lg: 'h-13 px-7 text-base rounded-lg gap-2.5',
  };

  const variantStyles = {
    // Primary: Electric gradient with deep blue core, white text
    primary:
      'bg-gradient-to-r from-[#0682F4] via-[#05A9F7] to-[#08E6F9] text-[#01213D] font-semibold hover:opacity-95 shadow-md shadow-[#0682F4]/20 border border-[#7CF9FD]/30',
    
    // Secondary: Deep Navy container with cyan outline & glow
    secondary:
      'bg-[#01213D]/80 text-[#CCD2D9] border border-[#0682F4]/30 hover:border-[#08E6F9]/60 hover:text-white hover:bg-[#0682F4]/10',
    
    // Outline: Clean subtle border on transparent
    outline:
      'bg-transparent text-[#CCD2D9] border border-[#CCD2D9]/20 hover:border-[#08E6F9] hover:text-[#08E6F9]',
    
    // Ghost: Minimalist text hover
    ghost:
      'bg-transparent text-[#CCD2D9] hover:text-[#08E6F9] hover:bg-[#0682F4]/10',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
