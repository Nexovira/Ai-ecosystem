import React from 'react';
import { RatingSummary } from '../../types/review';
import { StarRating } from './StarRating';
import { ShieldCheck } from 'lucide-react';

interface RatingSummaryCardProps {
  summary: RatingSummary;
  selectedStarFilter?: number;
  onSelectStarFilter?: (star: number | undefined) => void;
}

export const RatingSummaryCard: React.FC<RatingSummaryCardProps> = ({
  summary,
  selectedStarFilter,
  onSelectStarFilter,
}) => {
  const { averageRating, totalReviews, ratingDistribution } = summary;

  const starRows = [5, 4, 3, 2, 1] as const;

  return (
    <div className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-6">
      {/* Top Header: Aggregate Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#0682F4]/20">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {totalReviews > 0 ? averageRating.toFixed(1) : '0.0'}
            </span>
            <span className="text-sm font-mono text-[#CCD2D9]/70">/ 5.0</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <StarRating rating={averageRating} size="md" />
            <span className="text-xs text-[#CCD2D9] font-medium">
              Based on{' '}
              <strong className="text-white">
                {totalReviews} verified {totalReviews === 1 ? 'review' : 'reviews'}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-xs text-[#08E6F9]">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <div className="space-y-0.5">
            <div className="font-bold text-white text-[11px] uppercase tracking-wider font-mono">
              Verified Experience Standard
            </div>
            <div className="text-[11px] text-[#CCD2D9]/80 leading-tight">
              100% of reviews are derived from authentic completed purchases or confirmed engagements.
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Bars */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-[#CCD2D9]">
          <span>Rating Breakdown</span>
          {selectedStarFilter && (
            <button
              onClick={() => onSelectStarFilter?.(undefined)}
              className="text-[#08E6F9] hover:underline text-[11px] cursor-pointer"
            >
              Clear filter ({selectedStarFilter}★)
            </button>
          )}
        </div>

        {starRows.map((stars) => {
          const count = ratingDistribution[stars] || 0;
          const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
          const isSelected = selectedStarFilter === stars;

          return (
            <button
              key={stars}
              type="button"
              onClick={() => {
                if (onSelectStarFilter) {
                  onSelectStarFilter(isSelected ? undefined : stars);
                }
              }}
              className={`w-full group text-left flex items-center gap-3 py-1.5 px-2 rounded-lg transition cursor-pointer ${
                isSelected
                  ? 'bg-[#0682F4]/20 border border-[#08E6F9]/40'
                  : 'hover:bg-[#01213D]'
              }`}
            >
              <div className="flex items-center gap-1 w-12 text-xs font-mono font-medium text-white shrink-0">
                <span>{stars}</span>
                <span className="text-[#08E6F9]">★</span>
              </div>

              {/* Progress bar */}
              <div className="flex-1 h-2.5 bg-[#01213D] rounded-full overflow-hidden border border-[#0682F4]/20">
                <div
                  className="h-full bg-gradient-to-r from-[#0682F4] to-[#08E6F9] rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="w-12 text-right text-xs font-mono text-[#CCD2D9]/70 group-hover:text-white shrink-0">
                {percentage}%
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
