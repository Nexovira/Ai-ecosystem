import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#011629]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#01213D] border border-[#0682F4]/30 rounded-xl p-6 sm:p-8 shadow-2xl shadow-[#011629] z-10">
        <div className="flex items-start justify-between gap-4 mb-5 border-b border-[#0682F4]/20 pb-4">
          <div>
            <h3
              id="modal-title"
              className="text-lg sm:text-xl font-display font-semibold text-white tracking-wide"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-xs text-[#CCD2D9]/80 font-normal">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#CCD2D9] hover:text-[#08E6F9] p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#08E6F9] focus-visible:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-[#CCD2D9] text-sm leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
