import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import {
  Store,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  Save,
  Building,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';

interface SellerRecord {
  sellerId: string;
  userId: string;
  businessName: string;
  contactEmail: string;
  phoneNumber?: string;
  businessType?: string;
  cacNumber?: string;
  tinNumber?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export const ManagementSellersPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Verification Review Modal State
  const [selectedSeller, setSelectedSeller] = useState<SellerRecord | null>(null);
  const [newVerificationStatus, setNewVerificationStatus] = useState<'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'PENDING'>('VERIFIED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSellers = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);

      const res = await fetch(`/api/management/sellers?${queryParams.toString()}`, {
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch sellers');
      }

      setSellers(data.sellers || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading sellers';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [user, profile, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSellers();
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller || !user || !profile) return;

    setSubmittingReview(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/management/sellers/${selectedSeller.sellerId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          status: newVerificationStatus,
          notes: reviewNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update seller verification');
      }

      setActionFeedback({
        type: 'success',
        text: `Seller verification status set to ${newVerificationStatus}.`,
      });
      setSelectedSeller(null);
      setReviewNotes('');
      fetchSellers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error verifying seller';
      setActionFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            VERIFIED
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            PENDING REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
            REJECTED
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400">
            SUSPENDED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CCD2D9]/10 text-[#CCD2D9]">
            {status}
          </span>
        );
    }
  };

  return (
    <ManagementLayout
      activeRoute="/management/sellers"
      requiredPermission="SELLERS_VIEW"
      title="Seller Storefronts &amp; KYC Desk"
      subtitle="Authoritative verification, compliance validation, and account standing for marketplace merchants."
      actions={
        <button
          onClick={fetchSellers}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Sellers ({total})
        </button>
      }
    >
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/10 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#CCD2D9]/60" />
          <input
            type="text"
            placeholder="Search business name, email, or seller ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[11px] font-semibold text-[#CCD2D9]/70">Verification Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING REVIEW</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Sellers Data Table */}
      <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#CCD2D9]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#08E6F9]" />
            Loading seller records...
          </div>
        ) : sellers.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#CCD2D9]/60">
            No seller merchant records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#01213D] border-b border-[#0682F4]/20 text-[#CCD2D9] font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3">Business &amp; Seller ID</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Tax / CAC Reg</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Review</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0682F4]/10 text-white">
                {sellers.map((s) => (
                  <tr key={s.sellerId} className="hover:bg-[#01213D]/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#08E6F9]" />
                        {s.businessName || 'Business Storefront'}
                      </div>
                      <div className="text-[10px] text-[#CCD2D9]/50 font-mono mt-0.5">
                        ID: {s.sellerId}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-[11px] text-[#CCD2D9]/80 font-mono">{s.contactEmail}</div>
                      {s.phoneNumber && (
                        <div className="text-[10px] text-[#CCD2D9]/50 font-mono">{s.phoneNumber}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-white">
                        {s.cacNumber || s.tinNumber ? `${s.cacNumber || 'N/A'} / ${s.tinNumber || 'N/A'}` : 'Not provided'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(s.verificationStatus)}</td>
                    <td className="px-4 py-3.5">
                      {s.reviewedAt ? (
                        <div className="text-[11px] text-[#CCD2D9]/70 font-mono">
                          {new Date(s.reviewedAt).toLocaleDateString()}
                          {s.reviewedBy && <span className="block text-[9px] text-[#CCD2D9]/40">by {s.reviewedBy}</span>}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#CCD2D9]/40 font-mono">Not reviewed</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedSeller(s);
                          setNewVerificationStatus(
                            s.verificationStatus === 'PENDING' ? 'VERIFIED' : (s.verificationStatus as any)
                          );
                          setReviewNotes(s.reviewNotes || '');
                        }}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] transition cursor-pointer"
                      >
                        Review KYC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Seller Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#011B33] border border-[#0682F4]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-[#08E6F9]" />
                Review Merchant KYC Verification
              </div>
              <button
                onClick={() => setSelectedSeller(null)}
                className="text-[#CCD2D9] hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#CCD2D9] space-y-1">
              <div>
                <span className="text-[#CCD2D9]/60">Merchant:</span> <strong className="text-white">{selectedSeller.businessName}</strong>
              </div>
              <div className="font-mono text-[11px]">
                <span className="text-[#CCD2D9]/60">Email:</span> {selectedSeller.contactEmail}
              </div>
              <div className="font-mono text-[11px]">
                <span className="text-[#CCD2D9]/60">Seller ID:</span> {selectedSeller.sellerId}
              </div>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Verification Decision</label>
                <select
                  value={newVerificationStatus}
                  onChange={(e) => setNewVerificationStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                >
                  <option value="VERIFIED">VERIFIED (Approve seller storefront and product listing)</option>
                  <option value="PENDING">PENDING (Keep under compliance review)</option>
                  <option value="REJECTED">REJECTED (Decline merchant registration)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporarily disable store operations)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Review Notes &amp; Rationale</label>
                <textarea
                  rows={3}
                  placeholder="Record compliance check notes, documentation verified, or rejection details..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setSelectedSeller(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 text-[#CCD2D9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submittingReview ? 'Submitting...' : 'Commit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
};
