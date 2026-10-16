import React, { useState, useEffect, useCallback } from 'react';
import {
  Review,
  ReviewEntityType,
  RatingSummary,
  ReviewEligibilityResult,
} from '../../types/review';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { RatingSummaryCard } from './RatingSummaryCard';
import { ReviewCard } from './ReviewCard';
import { ReviewFormModal } from './ReviewFormModal';
import { ReportReviewModal } from './ReportReviewModal';
import { ProviderResponseModal } from './ProviderResponseModal';
import { StarRating } from './StarRating';
import {
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ReviewsSectionProps {
  entityType: ReviewEntityType;
  entityId: string;
  entityTitle?: string;
  sellerId?: string;
  expertId?: string;
  className?: string;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  entityType,
  entityId,
  entityTitle,
  sellerId,
  expertId,
  className = '',
}) => {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({
    entityType,
    entityId,
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [eligibility, setEligibility] = useState<ReviewEligibilityResult | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState<'recent' | 'highest' | 'lowest' | 'verified'>('recent');
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | undefined>(undefined);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [activeReviewForAction, setActiveReviewForAction] = useState<Review | null>(null);

  // Check Eligibility on Mount or Auth Change
  const checkEligibility = useCallback(async () => {
    if (!user) {
      setEligibility(null);
      return;
    }
    try {
      const res = await fetch(`/api/reviews/${entityType}/${entityId}/eligibility`, {
        headers: {
          'x-user-id': user.uid,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEligibility(data);
      }
    } catch (err) {
      console.warn('Error checking review eligibility:', err);
    }
  }, [user, entityType, entityId]);

  // Load Reviews for this entity
  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('sort', selectedSort);
      if (selectedStarFilter) params.set('starFilter', selectedStarFilter.toString());
      if (verifiedOnly) params.set('verifiedOnly', 'true');
      params.set('page', currentPage.toString());
      params.set('limit', '6');

      const res = await fetch(`/api/reviews/${entityType}/${entityId}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.summary) setSummary(data.summary);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.warn('Error loading reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, selectedSort, selectedStarFilter, verifiedOnly, currentPage]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Handle Review Submission Callback
  const handleReviewSubmitted = (savedReview: Review) => {
    checkEligibility();
    loadReviews();
  };

  // Handle Review Delete
  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile?.role || '',
        },
      });
      if (res.ok) {
        checkEligibility();
        loadReviews();
      }
    } catch (err) {
      console.warn('Error deleting review:', err);
    }
  };

  const isSellerForThisEntity = Boolean(
    user && sellerId && (user.uid === sellerId || `seller-${user.uid}` === sellerId || profile?.role === 'SELLER')
  );
  const isExpertForThisEntity = Boolean(
    user && expertId && (user.uid === expertId || profile?.role === 'EXPERT')
  );
  const canRespondToReviews = isSellerForThisEntity || isExpertForThisEntity || profile?.role === 'ADMIN';

  return (
    <section className={`space-y-8 pt-12 border-t border-[#0682F4]/20 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#011B33] border border-[#0682F4]/30 text-[#08E6F9] text-xs font-mono font-bold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Customer Reviews
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Ratings &amp; Experiences
          </h2>
          <p className="text-xs sm:text-sm text-[#CCD2D9]">
            Authentic, tamper-resistant feedback from verified ecosystem participants.
          </p>
        </div>

        {/* Action Button: Write or Edit Review */}
        <div className="flex items-center gap-3">
          {user ? (
            eligibility?.alreadyReviewed ? (
              <button
                type="button"
                onClick={() => setFormModalOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#08E6F9]/40 text-[#08E6F9] transition flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Your Review</span>
              </button>
            ) : eligibility?.isEligible ? (
              <button
                type="button"
                onClick={() => setFormModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#0682F4]/30"
              >
                <Plus className="w-4 h-4" />
                <span>Write a Verified Review</span>
              </button>
            ) : (
              <div
                className="px-4 py-2 rounded-xl bg-[#011B33] border border-[#0682F4]/20 text-[11px] text-[#CCD2D9] flex items-center gap-2"
                title={eligibility?.reason || 'Verified purchase/engagement required'}
              >
                <Lock className="w-3.5 h-3.5 text-[#08E6F9]" />
                <span>Verified Clients Only</span>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9] transition flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In to Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Rating Summary Card + Reviews List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Rating Summary Card */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <RatingSummaryCard
            summary={summary}
            selectedStarFilter={selectedStarFilter}
            onSelectStarFilter={(star) => {
              setSelectedStarFilter(star);
              setCurrentPage(1);
            }}
          />

          {/* Verification Assurance Card */}
          <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/20 space-y-2 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#08E6F9]" />
              Trust &amp; Integrity Policy
            </span>
            <p className="text-[#CCD2D9]/80 leading-relaxed text-[11px]">
              Reviews are verified server-side through completed invoices, confirmed service deliverables, and active cohort enrollments. Sellers and specialists cannot review their own items.
            </p>
          </div>
        </div>

        {/* Right Column: Reviews List with Filters & Sorting */}
        <div className="lg:col-span-8 space-y-6">
          {/* Controls Bar: Sorting & Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#011B33] border border-[#0682F4]/20 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#CCD2D9]/70 text-[11px] font-mono mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedStarFilter(undefined);
                  setVerifiedOnly(false);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${
                  !selectedStarFilter && !verifiedOnly
                    ? 'bg-[#0682F4] text-white'
                    : 'bg-[#01213D] text-[#CCD2D9] hover:text-white'
                }`}
              >
                All ({summary.totalReviews})
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerifiedOnly(!verifiedOnly);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer flex items-center gap-1 ${
                  verifiedOnly
                    ? 'bg-[#0682F4] text-white'
                    : 'bg-[#01213D] text-[#CCD2D9] hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-[#08E6F9]" />
                <span>Verified Only</span>
              </button>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[#CCD2D9]/70 text-[11px] font-mono">Sort by:</span>
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9] cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
                <option value="verified">Verified First</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-[#011B33]/50 border border-[#0682F4]/20 animate-pulse space-y-3"
                >
                  <div className="h-4 bg-[#01213D] rounded w-1/4" />
                  <div className="h-5 bg-[#01213D] rounded w-1/2" />
                  <div className="h-12 bg-[#01213D] rounded w-full" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            /* Empty State */
            <div className="p-10 rounded-2xl bg-[#011B33] border border-[#0682F4]/20 text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-center text-[#08E6F9] mx-auto">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {summary.totalReviews === 0
                    ? 'No reviews yet'
                    : 'No reviews match current filter'}
                </h3>
                <p className="text-xs text-[#CCD2D9] max-w-sm mx-auto mt-1">
                  {summary.totalReviews === 0
                    ? 'Be the first verified customer or client to share your experience with the ecosystem.'
                    : 'Try clearing the selected star rating filter to view all available feedback.'}
                </p>
              </div>

              {summary.totalReviews > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStarFilter(undefined);
                    setVerifiedOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0682F4] text-white hover:bg-[#05A9F7] transition cursor-pointer"
                >
                  Show All Reviews
                </button>
              )}
            </div>
          ) : (
            /* Render Review Cards */
            <div className="space-y-4">
              {reviews.map((rev) => (
                <ReviewCard
                  key={rev.id}
                  review={rev}
                  currentUserId={user?.uid}
                  currentUserRole={profile?.role}
                  isOwner={user?.uid === rev.userId}
                  canRespond={canRespondToReviews}
                  onEdit={(r) => {
                    setActiveReviewForAction(r);
                    setFormModalOpen(true);
                  }}
                  onDelete={handleDeleteReview}
                  onReport={(r) => {
                    setActiveReviewForAction(r);
                    setReportModalOpen(true);
                  }}
                  onRespond={(r) => {
                    setActiveReviewForAction(r);
                    setResponseModalOpen(true);
                  }}
                />
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pt-6 border-t border-[#0682F4]/20 flex items-center justify-between">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <span className="text-xs font-mono text-[#CCD2D9]">
                    Page <strong className="text-white">{currentPage}</strong> of {totalPages}
                  </span>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Submission / Editing Modal */}
      <ReviewFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActiveReviewForAction(null);
        }}
        entityType={entityType}
        entityId={entityId}
        entityTitle={entityTitle}
        verificationType={eligibility?.verificationType}
        verificationReference={eligibility?.verificationReference}
        existingReview={activeReviewForAction || eligibility?.existingReview}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Report Review Modal */}
      <ReportReviewModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setActiveReviewForAction(null);
        }}
        review={activeReviewForAction}
      />

      {/* Provider Response Modal */}
      <ProviderResponseModal
        isOpen={responseModalOpen}
        onClose={() => {
          setResponseModalOpen(false);
          setActiveReviewForAction(null);
        }}
        review={activeReviewForAction}
        onResponseSubmitted={() => {
          loadReviews();
        }}
      />
    </section>
  );
};
