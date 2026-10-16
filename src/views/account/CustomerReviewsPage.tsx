import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { Review } from '../../types/review';
import { StarRating } from '../../components/reviews/StarRating';
import { ReviewFormModal } from '../../components/reviews/ReviewFormModal';
import {
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  Edit3,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CornerDownRight,
} from 'lucide-react';

export const CustomerReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit review state
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const fetchUserReviews = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/account/reviews', {
        headers: {
          'x-user-id': user.uid,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      } else {
        throw new Error('Failed to load your reviews');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading reviews';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserReviews();
  }, [fetchUserReviews]);

  const handleDelete = async (reviewId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.uid,
        },
      });
      if (res.ok) {
        fetchUserReviews();
      }
    } catch (err) {
      console.warn('Error deleting review:', err);
    }
  };

  const getStatusBadge = (status: Review['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'UNDER_REVIEW':
      case 'PENDING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'REPORTED':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'HIDDEN':
      case 'REMOVED':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-[#CCD2D9] bg-[#011B33] border-[#0682F4]/30';
    }
  };

  const getEntityDestinationUrl = (entityType: Review['entityType'], entityId: string) => {
    switch (entityType) {
      case 'PRODUCT':
        return `/marketplace/product/${entityId}`;
      case 'COURSE':
        return `/academy/courses/${entityId}`;
      case 'EXPERT':
        return `/services/experts/${entityId}`;
      case 'SERVICE':
        return `/services`;
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            onClick={() => navigate('/account')}
            className="inline-flex items-center text-xs font-medium text-[#08E6F9] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Return to User Account Hub</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#0682F4]/20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#011B33] border border-[#0682F4]/30 text-[#08E6F9] text-xs font-mono font-bold tracking-wider uppercase mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Your Verified Feedback
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              My Submitted Reviews
            </h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">
              Manage your ratings and public feedback across products, courses, specialists, and digital services.
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-[#011B33] border border-[#0682F4]/30 text-xs font-mono text-[#08E6F9] self-start sm:self-auto">
            Total Reviews: <strong className="text-white">{reviews.length}</strong>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#011B33]/60 border border-[#0682F4]/20 animate-pulse space-y-3"
              >
                <div className="h-4 bg-[#01213D] rounded w-1/4" />
                <div className="h-5 bg-[#01213D] rounded w-1/2" />
                <div className="h-12 bg-[#01213D] rounded w-full" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#011B33] border border-[#0682F4]/20 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-center text-[#08E6F9] mx-auto">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No reviews submitted yet</h3>
              <p className="text-xs text-[#CCD2D9] max-w-md mx-auto mt-1 leading-relaxed">
                When you complete orders, finish project milestones, or enroll in academy courses, you can share verified reviews directly from the respective entity pages.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => navigate('/marketplace')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] text-white hover:bg-[#05A9F7] transition cursor-pointer"
              >
                Browse Marketplace
              </button>
              <button
                onClick={() => navigate('/academy')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#01213D] border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white transition cursor-pointer"
              >
                Explore Academy
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-lg space-y-4"
              >
                {/* Header: Entity title, type badge, status badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#0682F4]/15">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#0682F4]/20 text-[#08E6F9] border border-[#0682F4]/30">
                        {rev.entityType}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {rev.entityTitle || rev.entityId}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#CCD2D9]/60">
                      Reviewed on {new Date(rev.createdAt).toLocaleDateString()} · Ref: {rev.verificationReference || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${getStatusBadge(
                        rev.status
                      )}`}
                    >
                      {rev.status}
                    </span>
                    <StarRating rating={rev.rating} size="sm" />
                  </div>
                </div>

                {/* Review Body */}
                <div className="space-y-1.5">
                  {rev.title && (
                    <h4 className="font-bold text-white text-sm">{rev.title}</h4>
                  )}
                  <p className="text-xs sm:text-sm text-[#CCD2D9] leading-relaxed whitespace-pre-line">
                    {rev.body}
                  </p>
                </div>

                {/* Provider response if present */}
                {rev.response && (
                  <div className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[#08E6F9] font-mono text-[11px] font-bold">
                      <span className="flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        Response from {rev.response.responderName}
                      </span>
                      <span className="text-[#CCD2D9]/60">
                        {new Date(rev.response.respondedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[#CCD2D9] pl-5 whitespace-pre-line">
                      {rev.response.responseText}
                    </p>
                  </div>
                )}

                {/* Action Footer */}
                <div className="pt-3 border-t border-[#0682F4]/15 flex items-center justify-between text-xs">
                  <button
                    onClick={() => navigate(getEntityDestinationUrl(rev.entityType, rev.entityId))}
                    className="text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>View item page</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingReview(rev)}
                      className="px-3 py-1.5 rounded-lg font-semibold text-[#08E6F9] hover:bg-[#0682F4]/20 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(rev.id)}
                      className="px-3 py-1.5 rounded-lg font-semibold text-red-400 hover:bg-red-500/10 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingReview && (
          <ReviewFormModal
            isOpen={Boolean(editingReview)}
            onClose={() => setEditingReview(null)}
            entityType={editingReview.entityType}
            entityId={editingReview.entityId}
            entityTitle={editingReview.entityTitle}
            verificationType={editingReview.verificationType}
            verificationReference={editingReview.verificationReference}
            existingReview={editingReview}
            onReviewSubmitted={() => {
              fetchUserReviews();
            }}
          />
        )}
      </div>
    </div>
  );
};
