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
    'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0169FA] focus-visible:ring-offset-2 active:scale-[0.98]';

  const sizeStyles = {
    sm: 'h-9 px-3.5 text-xs rounded-lg gap-1.5',
    md: 'h-11 px-5 text-sm rounded-xl gap-2',
    lg: 'h-12 px-6 text-sm sm:text-base rounded-xl gap-2.5',
  };

  const variantStyles = {
    // Primary: Official electric gradient from cyan to royal blue with white text
    primary:
      'bg-gradient-to-r from-[#08B3F8] via-[#0169FA] to-[#0148F2] text-white font-medium hover:opacity-95 shadow-sm shadow-[#0169FA]/25 border border-transparent',
    
    // Secondary: Pure white / soft surface with light grey border & deep navy text
    secondary:
      'bg-white text-[#14283F] border border-[#E8EDF2] hover:border-[#028BFA] hover:text-[#0169FA] hover:bg-[#F7F8FA] shadow-xs',
    
    // Outline: Clean subtle border on transparent
    outline:
      'bg-transparent text-[#14283F] border border-[#E8EDF2] hover:border-[#0169FA] hover:text-[#0169FA]',
    
    // Ghost: Minimalist text hover
    ghost:
      'bg-transparent text-[#252B33] hover:text-[#0169FA] hover:bg-[#E8EDF2]/50',
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
