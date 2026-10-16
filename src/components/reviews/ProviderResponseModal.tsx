import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Review } from '../../types/review';
import { X, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';

interface ProviderResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  onResponseSubmitted: (updatedReview: Review) => void;
}

export const ProviderResponseModal: React.FC<ProviderResponseModalProps> = ({
  isOpen,
  onClose,
  review,
  onResponseSubmitted,
}) => {
  const { user, profile } = useAuth();
  const [responseText, setResponseText] = useState('');
  const [responderName, setResponderName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !review) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to post a response.');
      return;
    }
    if (responseText.trim().length < 5) {
      setError('Response must be at least 5 characters long.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const name =
        responderName.trim() ||
        profile?.fullName ||
        user.displayName ||
        (profile?.role === 'EXPERT' ? 'Verified Specialist' : 'Authorized Merchant');

      const res = await fetch(`/api/reviews/${review.id}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile?.role || 'SELLER',
        },
        body: JSON.stringify({
          userId: user.uid,
          userRole: profile?.role || 'SELLER',
          responseText: responseText.trim(),
          responderName: name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit response');
      }

      onResponseSubmitted(data.review);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error posting response';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#011B33] border border-[#0682F4]/40 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#0682F4]/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0682F4]/10 text-[#08E6F9] border border-[#0682F4]/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Respond to Customer Review</h3>
              <p className="text-xs text-[#CCD2D9]">
                Review by {review.userDisplayName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#CCD2D9] hover:text-white hover:bg-[#01213D] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1 text-xs">
          <span className="font-bold text-white">Customer Feedback:</span>
          <p className="text-[#CCD2D9] italic line-clamp-3">&quot;{review.body}&quot;</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#CCD2D9] block">
              Display Name for Response (Optional)
            </label>
            <input
              type="text"
              value={responderName}
              onChange={(e) => setResponderName(e.target.value)}
              placeholder="e.g. Official Merchant Support"
              maxLength={80}
              className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#CCD2D9] block">
              Official Response <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Write a professional, courteous response to the customer..."
              maxLength={1000}
              required
              className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9] resize-none"
            />
            <p className="text-[11px] text-[#CCD2D9]/60">
              Do not include private customer numbers, banking details, or external off-platform transaction links.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#0682F4]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#CCD2D9] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Post Response</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
