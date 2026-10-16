import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Review, ReviewReportReason } from '../../types/review';
import { X, Flag, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
}

const REPORT_REASONS: Array<{ value: ReviewReportReason; label: string; desc: string }> = [
  { value: 'SPAM', label: 'Commercial Spam / Promotion', desc: 'Promoting external services, irrelevant links, or advertising.' },
  { value: 'FRAUDULENT', label: 'Fraudulent / Fabricated Experience', desc: 'Suspected deceptive, coordinated, or fake review.' },
  { value: 'OFFENSIVE', label: 'Offensive Language / Profanity', desc: 'Contains abusive, vulgar, or discriminatory language.' },
  { value: 'HARASSMENT', label: 'Targeted Harassment', desc: 'Threats, intimidation, or personal hostility directed at an individual.' },
  { value: 'PERSONAL_INFO', label: 'Exposes Private Personal Info', desc: 'Reveals phone numbers, addresses, banking details, or identities.' },
  { value: 'IRRELEVANT', label: 'Irrelevant to Experience', desc: 'Content has no connection to the product, specialist, or service.' },
  { value: 'OTHER', label: 'Other Policy Violation', desc: 'Violates Nexovira ecosystem community standards.' },
];

export const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  isOpen,
  onClose,
  review,
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReviewReportReason>('SPAM');
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !review) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to report a review.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/reviews/${review.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-email': user.email || 'member@nexovira.com',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          reason,
          explanation: explanation.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setExplanation('');
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reporting review';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#011B33] border border-amber-500/40 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#0682F4]/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Report Inappropriate Review</h3>
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

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Report Submitted</h4>
            <p className="text-xs text-[#CCD2D9]">
              Thank you. Nexovira content moderation will review this submission against ecosystem guidelines.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#CCD2D9] block">
                Select Violation Reason
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`block p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                      reason === r.value
                        ? 'bg-[#0682F4]/20 border-[#08E6F9] text-white'
                        : 'bg-[#01213D] border-[#0682F4]/20 text-[#CCD2D9] hover:border-[#0682F4]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="text-[#08E6F9] focus:ring-[#08E6F9]"
                      />
                      <span className="font-bold text-white">{r.label}</span>
                    </div>
                    <p className="text-[11px] text-[#CCD2D9]/70 pl-5 mt-0.5">{r.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Explanation Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#CCD2D9] block">
                Additional Context (Optional)
              </label>
              <textarea
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Provide any relevant details to assist the moderation team..."
                maxLength={500}
                className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9] resize-none"
              />
            </div>

            {/* Modal Actions */}
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-[#01213D] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
