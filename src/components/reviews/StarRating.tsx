import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 - 5
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (newRating: number) => void;
  showText?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
  showText = false,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label={`${rating} out of ${maxStars} stars`}
    >
      <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}>
        {Array.from({ length: maxStars }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= activeRating;
          const isPartiallyFilled = !isFilled && starValue - 0.5 <= activeRating;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`${
                interactive
                  ? 'cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-[#08E6F9] rounded'
                  : 'cursor-default pointer-events-none'
              } p-0.5`}
              aria-label={interactive ? `Rate ${starValue} star${starValue > 1 ? 's' : ''}` : undefined}
              role={interactive ? 'radio' : undefined}
              aria-checked={interactive ? rating === starValue : undefined}
            >
              <Star
                className={`${starSizes[size]} transition-colors ${
                  isFilled
                    ? 'fill-[#08E6F9] text-[#08E6F9]'
                    : isPartiallyFilled
                    ? 'fill-[#08E6F9]/50 text-[#08E6F9]'
                    : 'fill-[#011B33] text-[#0682F4]/30'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showText && (
        <span className="text-xs font-mono font-bold text-[#CCD2D9]">
          {rating > 0 ? rating.toFixed(1) : 'No ratings'}
        </span>
      )}
    </div>
  );
};
