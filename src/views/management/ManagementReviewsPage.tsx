import React, { useState, useEffect, useCallback } from 'react';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { useAuth } from '../../context/AuthContext';
import { Review, ReviewReport, ReviewStatus } from '../../types/review';
import { StarRating } from '../../components/reviews/StarRating';
import {
  MessageSquare,
  ShieldCheck,
  Search,
  Filter,
  Flag,
  CheckCircle2,
  XCircle,
  EyeOff,
  Eye,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Clock,
  User,
} from 'lucide-react';

export const ManagementReviewsPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [reportedOnly, setReportedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'REVIEWS' | 'REPORTS'>('REVIEWS');

  // Moderation action modal state
  const [modModalOpen, setModModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [targetStatus, setTargetStatus] = useState<ReviewStatus>('HIDDEN');
  const [moderationReason, setModerationReason] = useState('');
  const [submittingMod, setSubmittingMod] = useState(false);

  // Report resolution modal state
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReviewReport | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [resolutionNote, setResolutionNote] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  const fetchManagementReviews = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (typeFilter !== 'ALL') params.set('entityType', typeFilter);
      if (reportedOnly) params.set('reportedOnly', 'true');
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/management/reviews?${params.toString()}`, {
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile?.role || 'ADMIN',
          'x-user-email': user.email || '',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load management reviews');
      }

      const data = await res.json();
      setReviews(data.reviews || []);
      setReports(data.reports || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching reviews';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, profile, statusFilter, typeFilter, reportedOnly, search]);

  useEffect(() => {
    fetchManagementReviews();
  }, [fetchManagementReviews]);

  // Execute review status change
  const handleModerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !user) return;

    setSubmittingMod(true);
    try {
      const res = await fetch(`/api/management/reviews/${selectedReview.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile?.role || 'ADMIN',
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          status: targetStatus,
          reason: moderationReason.trim() || 'Content policy enforcement',
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to moderate review');
      }

      setModModalOpen(false);
      setSelectedReview(null);
      setModerationReason('');
      fetchManagementReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error applying moderation';
      setError(msg);
    } finally {
      setSubmittingMod(false);
    }
  };

  // Execute report resolve
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !user) return;

    setSubmittingResolve(true);
    try {
      const res = await fetch(`/api/management/reviews/reports/${selectedReport.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile?.role || 'ADMIN',
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          resolution: resolutionAction,
          note: resolutionNote.trim(),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to resolve report');
      }

      setResolveModalOpen(false);
      setSelectedReport(null);
      setResolutionNote('');
      fetchManagementReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error resolving report';
      setError(msg);
    } finally {
      setSubmittingResolve(false);
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
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
      case 'REMOVED':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-[#CCD2D9] bg-[#011B33] border-[#0682F4]/30';
    }
  };

  const pendingReportsCount = reports.filter((r) => r.status === 'PENDING').length;

  return (
    <ManagementLayout
      activeRoute="/management/reviews"
      requiredPermission="REVIEWS_VIEW"
      title="Trust & Review Moderation Desk"
      subtitle="Supervise customer ratings, investigate policy reports, and protect ecosystem review authenticity."
    >
      <div className="space-y-6">
        {/* Navigation Tabs (Reviews vs Reports) */}
        <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('REVIEWS')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'REVIEWS'
                  ? 'bg-[#0682F4] text-white shadow-lg shadow-[#0682F4]/30'
                  : 'text-[#CCD2D9] hover:text-white hover:bg-[#011B33]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>All Reviews ({reviews.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('REPORTS')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'REPORTS'
                  ? 'bg-[#0682F4] text-white shadow-lg shadow-[#0682F4]/30'
                  : 'text-[#CCD2D9] hover:text-white hover:bg-[#011B33]'
              }`}
            >
              <Flag className="w-4 h-4 text-amber-400" />
              <span>Reported Content Queue</span>
              {pendingReportsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-[#01213D] text-[10px] font-mono font-bold">
                  {pendingReportsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: All Reviews */}
        {activeTab === 'REVIEWS' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/20 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                <div className="relative w-full max-w-sm">
                  <Search className="w-4 h-4 text-[#CCD2D9]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reviewer, title, text, or entity..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Status Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[#CCD2D9]/70 font-mono text-[11px]">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="PENDING">Pending</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="REPORTED">Reported</option>
                    <option value="HIDDEN">Hidden</option>
                    <option value="REMOVED">Removed</option>
                  </select>
                </div>

                {/* Entity Type Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[#CCD2D9]/70 font-mono text-[11px]">Type:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                  >
                    <option value="ALL">All Entities</option>
                    <option value="PRODUCT">Products</option>
                    <option value="COURSE">Courses</option>
                    <option value="SERVICE">Services</option>
                    <option value="EXPERT">Experts</option>
                  </select>
                </div>

                {/* Reported Only Toggle */}
                <button
                  onClick={() => setReportedOnly(!reportedOnly)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    reportedOnly
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-[#01213D] text-[#CCD2D9] border border-[#0682F4]/30'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Reported Only</span>
                </button>
              </div>
            </div>

            {/* Reviews List */}
            {loading ? (
              <div className="p-12 text-center text-xs text-[#CCD2D9]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#08E6F9] mb-2" />
                Loading review records...
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#011B33] border border-[#0682F4]/20 text-center space-y-3">
                <MessageSquare className="w-8 h-8 text-[#08E6F9] mx-auto opacity-60" />
                <h4 className="text-base font-bold text-white">No reviews found</h4>
                <p className="text-xs text-[#CCD2D9]">
                  No review records match the selected status or query filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-3 shadow-md"
                  >
                    {/* Top Row: Reviewer, Entity, Rating, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#0682F4]/15 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white">
                            {rev.userDisplayName}
                          </span>
                          <span className="font-mono text-[10px] text-[#CCD2D9]/60">
                            (ID: {rev.userId.slice(0, 8)}...)
                          </span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase bg-[#0682F4]/20 text-[#08E6F9] border border-[#0682F4]/30">
                            {rev.entityType}: {rev.entityTitle || rev.entityId}
                          </span>
                          {rev.reportCount && rev.reportCount > 0 ? (
                            <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Flag className="w-2.5 h-2.5" />
                              {rev.reportCount} Reports
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[11px] font-mono text-[#CCD2D9]/60">
                          {new Date(rev.createdAt).toLocaleString()} · Verification: {rev.verificationType} ({rev.verificationReference || 'None'})
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getStatusBadge(
                            rev.status
                          )}`}
                        >
                          {rev.status}
                        </span>
                        <StarRating rating={rev.rating} size="sm" />
                      </div>
                    </div>

                    {/* Review Body */}
                    <div className="space-y-1">
                      {rev.title && <h5 className="font-bold text-white text-xs">{rev.title}</h5>}
                      <p className="text-xs text-[#CCD2D9] leading-relaxed whitespace-pre-line">
                        {rev.body}
                      </p>
                    </div>

                    {/* Moderation Controls Footer */}
                    <div className="pt-2 border-t border-[#0682F4]/15 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-[#CCD2D9]/50">
                        Review ID: {rev.id}
                      </span>

                      <div className="flex items-center gap-2">
                        {rev.status !== 'PUBLISHED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReview(rev);
                              setTargetStatus('PUBLISHED');
                              setModModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Publish</span>
                          </button>
                        )}

                        {rev.status !== 'HIDDEN' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReview(rev);
                              setTargetStatus('HIDDEN');
                              setModModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg font-semibold text-zinc-300 bg-zinc-500/10 hover:bg-zinc-500/20 border border-zinc-500/30 transition cursor-pointer flex items-center gap-1"
                          >
                            <EyeOff className="w-3 h-3" />
                            <span>Hide</span>
                          </button>
                        )}

                        {rev.status !== 'REMOVED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReview(rev);
                              setTargetStatus('REMOVED');
                              setModModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition cursor-pointer flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Reported Content Queue */}
        {activeTab === 'REPORTS' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#011B33] border border-[#0682F4]/20 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Reports Queue Clean</h4>
                <p className="text-xs text-[#CCD2D9]">
                  No outstanding user reports on reviews.
                </p>
              </div>
            ) : (
              reports.map((rep) => {
                const associatedReview = reviews.find((r) => r.id === rep.reviewId);
                const isPending = rep.status === 'PENDING';

                return (
                  <div
                    key={rep.id}
                    className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-3 shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#0682F4]/15 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 uppercase font-mono text-[10px]">
                            {rep.reason}
                          </span>
                          <span className="text-white font-medium">
                            Reporter: {rep.reporterEmail || rep.reporterId}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#CCD2D9]/60">
                          Reported on {new Date(rep.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          isPending
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>

                    {rep.explanation && (
                      <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-xs">
                        <strong className="text-white block mb-0.5">Reporter Context:</strong>
                        <p className="text-[#CCD2D9] italic">&quot;{rep.explanation}&quot;</p>
                      </div>
                    )}

                    {associatedReview && (
                      <div className="p-3 rounded-xl bg-[#011B33]/80 border border-[#0682F4]/20 text-xs space-y-1">
                        <span className="font-bold text-[#08E6F9]">Associated Review Content:</span>
                        <p className="text-white font-medium">{associatedReview.title}</p>
                        <p className="text-[#CCD2D9] text-[11px]">{associatedReview.body}</p>
                      </div>
                    )}

                    {isPending && (
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/15">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReport(rep);
                            setResolutionAction('DISMISSED');
                            setResolveModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#CCD2D9] hover:text-white hover:bg-[#01213D] border border-[#0682F4]/20 transition cursor-pointer"
                        >
                          Dismiss Report
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReport(rep);
                            setResolutionAction('RESOLVED');
                            setResolveModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0682F4] text-white hover:bg-[#05A9F7] transition cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Review Moderation Modal */}
        {modModalOpen && selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl bg-[#011B33] border border-[#0682F4]/40 shadow-2xl p-6 space-y-5">
              <h3 className="text-base font-bold text-white">
                Moderate Review: Set to {targetStatus}
              </h3>
              <p className="text-xs text-[#CCD2D9]">
                Review by <strong className="text-white">{selectedReview.userDisplayName}</strong> on{' '}
                <strong className="text-[#08E6F9]">{selectedReview.entityTitle}</strong>.
              </p>

              <form onSubmit={handleModerateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#CCD2D9] block">
                    Reason / Audit Note <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    placeholder="Specify reason for audit trail (e.g., Unsolicited promotional spam, violates privacy)..."
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#0682F4]/20">
                  <button
                    type="button"
                    onClick={() => setModModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-[#CCD2D9] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingMod}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingMod && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Status Update</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Resolution Modal */}
        {resolveModalOpen && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl bg-[#011B33] border border-[#0682F4]/40 shadow-2xl p-6 space-y-5">
              <h3 className="text-base font-bold text-white">
                {resolutionAction === 'RESOLVED' ? 'Mark Report Resolved' : 'Dismiss Report'}
              </h3>
              <form onSubmit={handleResolveSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#CCD2D9] block">
                    Resolution Note (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Provide details on resolution or why dismissed..."
                    className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#0682F4]/20">
                  <button
                    type="button"
                    onClick={() => setResolveModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-[#CCD2D9] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingResolve}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingResolve && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
};
