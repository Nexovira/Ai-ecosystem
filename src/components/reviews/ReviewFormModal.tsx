import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StarRating } from './StarRating';
import { Review, ReviewEntityType, VerificationType } from '../../types/review';
import {
  X,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: ReviewEntityType;
  entityId: string;
  entityTitle?: string;
  verificationType?: VerificationType;
  verificationReference?: string;
  existingReview?: Review | null;
  onReviewSubmitted: (review: Review) => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle,
  verificationType = 'NONE',
  verificationReference,
  existingReview,
  onReviewSubmitted,
}) => {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [title, setTitle] = useState<string>(existingReview?.title || '');
  const [body, setBody] = useState<string>(existingReview?.body || '');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(existingReview?.isAnonymous || false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setTitle(existingReview.title || '');
      setBody(existingReview.body);
      setIsAnonymous(Boolean(existingReview.isAnonymous));
    } else {
      setRating(5);
      setTitle('');
      setBody('');
      setIsAnonymous(false);
    }
    setError(null);
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to submit a review.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }
    if (body.trim().length < 10) {
      setError('Review content must be at least 10 characters long.');
      return;
    }
    if (body.trim().length > 2000) {
      setError('Review content cannot exceed 2000 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const isEditing = Boolean(existingReview);
      const url = isEditing ? `/api/reviews/${existingReview!.id}` : '/api/reviews';
      const method = isEditing ? 'PUT' : 'POST';

      const displayName = isAnonymous
        ? 'Verified Customer'
        : (profile?.fullName || user.displayName || 'Verified Member');

      const payload = isEditing
        ? { rating, title: title.trim(), body: body.trim(), isAnonymous, userId: user.uid }
        : {
            entityType,
            entityId,
            rating,
            title: title.trim(),
            body: body.trim(),
            isAnonymous,
            userId: user.uid,
            userDisplayName: displayName,
            userAvatar: isAnonymous ? undefined : (user.photoURL || undefined),
          };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-name': displayName,
          'x-user-avatar': user.photoURL || '',
          'x-user-role': profile?.role || 'CUSTOMER',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit review');
      }

      onReviewSubmitted(data.review);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting review';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#011B33] border border-[#0682F4]/40 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#0682F4]/20">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Verified Experience Review
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {existingReview ? 'Update Your Review' : 'Write a Verified Review'}
            </h3>
            {entityTitle && (
              <p className="text-xs text-[#CCD2D9] truncate max-w-xs sm:max-w-md mt-0.5">
                {entityTitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#CCD2D9] hover:text-white hover:bg-[#01213D] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Pill */}
        {verificationType !== 'NONE' && (
          <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-[#08E6F9] font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Status: Verified Transaction</span>
            </span>
            {verificationReference && (
              <span className="font-mono text-[11px] text-[#CCD2D9]/70">
                {verificationReference}
              </span>
            )}
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Rating Control */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#CCD2D9] block">
              Overall Rating <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-4 p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
              <StarRating
                rating={rating}
                interactive
                size="lg"
                onChange={setRating}
              />
              <span className="text-xs font-mono font-bold text-[#08E6F9]">
                {rating === 5
                  ? '5 - Excellent'
                  : rating === 4
                  ? '4 - Good'
                  : rating === 3
                  ? '3 - Fair'
                  : rating === 2
                  ? '2 - Poor'
                  : '1 - Very Poor'}
              </span>
            </div>
          </div>

          {/* Review Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#CCD2D9] block">
              Headline / Summary (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Exceptional build quality and fast delivery"
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
            />
          </div>

          {/* Review Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#CCD2D9]">
                Detailed Review <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] font-mono text-[#CCD2D9]/60">
                {body.length}/2000
              </span>
            </div>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your authentic experience with this product, specialist, or service..."
              maxLength={2000}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9] resize-none"
            />
            <p className="text-[11px] text-[#CCD2D9]/60">
              Minimum 10 characters. Avoid posting private phone numbers or bank details.
            </p>
          </div>

          {/* Anonymity Checkbox */}
          <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 flex items-start gap-3">
            <input
              id="anonymous-toggle"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-0.5 rounded border-[#0682F4]/40 bg-[#011B33] text-[#0682F4] focus:ring-[#08E6F9]"
            />
            <label htmlFor="anonymous-toggle" className="text-xs text-[#CCD2D9] cursor-pointer">
              <strong className="text-white block font-medium">Post as Verified Customer</strong>
              Hide your personal name and avatar on public pages. Verification badges will remain visible.
            </label>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#0682F4]/20">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#CCD2D9] hover:text-white hover:bg-[#01213D] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white shadow-lg shadow-[#0682F4]/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{existingReview ? 'Save Changes' : 'Submit Verified Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
