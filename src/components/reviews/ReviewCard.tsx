import React, { useState } from 'react';
import { Review } from '../../types/review';
import { StarRating } from './StarRating';
import {
  ShieldCheck,
  User,
  Flag,
  Edit3,
  Trash2,
  MessageSquare,
  CornerDownRight,
  AlertTriangle,
} from 'lucide-react';

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  currentUserRole?: string;
  isOwner?: boolean;
  canRespond?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onReport?: (review: Review) => void;
  onRespond?: (review: Review) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUserId,
  currentUserRole,
  isOwner = false,
  canRespond = false,
  onEdit,
  onDelete,
  onReport,
  onRespond,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Verification Badge Configuration
  const getVerificationBadge = () => {
    switch (review.verificationType) {
      case 'VERIFIED_PURCHASE':
        return {
          label: 'Verified Purchase',
          tooltip: 'Review confirmed from a completed marketplace order.',
        };
      case 'VERIFIED_SERVICE':
        return {
          label: 'Verified Service',
          tooltip: 'Review confirmed from an active or completed project request.',
        };
      case 'VERIFIED_EXPERIENCE':
        return {
          label: 'Verified Experience',
          tooltip: 'Client confirmed direct project engagement with this specialist.',
        };
      case 'VERIFIED_ENROLLMENT':
        return {
          label: 'Verified Enrollment',
          tooltip: 'Student confirmed cohort registration in this academy course.',
        };
      default:
        return null;
    }
  };

  const badge = getVerificationBadge();

  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-lg space-y-4 transition hover:border-[#08E6F9]/50">
      {/* Top Row: Reviewer Info, Star Rating, Verified Badge & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#0682F4]/15">
        <div className="flex items-center gap-3">
          {review.userAvatar ? (
            <img
              src={review.userAvatar}
              alt={review.userDisplayName}
              className="w-9 h-9 rounded-full object-cover border border-[#08E6F9]/40"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-center text-[#08E6F9] shrink-0 font-bold text-xs">
              {review.isAnonymous ? (
                <User className="w-4 h-4" />
              ) : (
                review.userDisplayName.charAt(0).toUpperCase()
              )}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-xs sm:text-sm">
                {review.userDisplayName}
              </span>

              {badge && (
                <span
                  title={badge.tooltip}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0682F4]/15 border border-[#08E6F9]/40 text-[#08E6F9] text-[10px] font-mono font-bold uppercase tracking-wider"
                >
                  <ShieldCheck className="w-3 h-3" />
                  {badge.label}
                </span>
              )}
            </div>

            <span className="text-[11px] font-mono text-[#CCD2D9]/60">
              {formattedDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StarRating rating={review.rating} size="sm" />
        </div>
      </div>

      {/* Review Content */}
      <div className="space-y-2">
        {review.title && (
          <h4 className="font-bold text-white text-sm sm:text-base leading-snug">
            {review.title}
          </h4>
        )}
        <p className="text-xs sm:text-sm text-[#CCD2D9] leading-relaxed whitespace-pre-line">
          {review.body}
        </p>
      </div>

      {/* Merchant / Specialist Response Box if Present */}
      {review.response && (
        <div className="mt-4 p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/30 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#08E6F9] font-mono text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5" />
              Response from {review.response.responderName}
              <span className="px-1.5 py-0.2 rounded bg-[#0682F4]/20 border border-[#0682F4]/40 text-[9px]">
                {review.response.responderRole}
              </span>
            </span>
            <span className="text-[#CCD2D9]/60">
              {new Date(review.response.respondedAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-[#CCD2D9] leading-relaxed pl-5 whitespace-pre-line">
            {review.response.responseText}
          </p>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="pt-3 border-t border-[#0682F4]/15 flex items-center justify-between text-xs">
        <div className="text-[11px] font-mono text-[#CCD2D9]/50">
          {review.verificationReference && (
            <span>Ref: {review.verificationReference}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Owner Actions */}
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => onEdit?.(review)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#08E6F9] hover:bg-[#0682F4]/20 transition flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onDelete?.(review.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs text-[#CCD2D9] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
            </>
          )}

          {/* Provider Respond Action */}
          {canRespond && !review.response && (
            <button
              type="button"
              onClick={() => onRespond?.(review)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9] transition flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Reply</span>
            </button>
          )}

          {/* Non-owner Report Action */}
          {!isOwner && onReport && (
            <button
              type="button"
              onClick={() => onReport(review)}
              className="p-1 rounded-lg text-[#CCD2D9]/50 hover:text-amber-400 hover:bg-[#01213D] transition cursor-pointer"
              title="Report inappropriate content"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
