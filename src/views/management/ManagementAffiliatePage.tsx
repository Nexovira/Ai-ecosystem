import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  BookOpen,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Edit,
  Plus,
  RefreshCw,
  Lock,
} from 'lucide-react';
import {
  AffiliateApplication,
  AffiliateProfile,
  EligibleOffer,
  CommissionRecord,
  PayoutRequest,
  CommissionStatus,
  PayoutStatus,
} from '../../types/affiliate';

export const ManagementAffiliatePage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();

  const isStaffOrAdmin =
    profile?.role && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(profile.role);

  const [activeTab, setActiveTab] = useState<
    'APPLICATIONS' | 'AFFILIATES' | 'OFFERS' | 'COMMISSIONS' | 'PAYOUTS'
  >('APPLICATIONS');

  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
  const [offers, setOffers] = useState<EligibleOffer[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Review Application Modal State
  const [selectedApp, setSelectedApp] = useState<AffiliateApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessingReview, setIsProcessingReview] = useState(false);

  // Edit / Add Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<EligibleOffer>>({
    offerType: 'MARKETPLACE_PRODUCT',
    targetTitle: '',
    targetSlug: '',
    targetPrice: 0,
    commissionEnabled: true,
    commissionType: 'PERCENTAGE',
    commissionValue: 10,
    status: 'ACTIVE',
  });

  // Payout Review State
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [payoutProviderRef, setPayoutProviderRef] = useState('');
  const [payoutFailureReason, setPayoutFailureReason] = useState('');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  // Commission Reversal State
  const [reversalCommId, setReversalCommId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  useEffect(() => {
    if (user && isStaffOrAdmin) {
      loadManagementData();
    }
  }, [user, isStaffOrAdmin]);

  const loadManagementData = async () => {
    if (!user || !profile?.role) return;
    try {
      setIsLoading(true);
      setActionError(null);

      const headers = {
        'x-user-id': user.uid,
        'x-user-role': profile.role,
        'x-user-email': user.email || '',
      };

      const [appsRes, affsRes, offersRes, commsRes, paysRes] = await Promise.all([
        fetch('/api/affiliates/management/applications', { headers }),
        fetch('/api/affiliates/management/affiliates', { headers }),
        fetch('/api/affiliates/management/offers', { headers }),
        fetch('/api/affiliates/management/commissions', { headers }),
        fetch('/api/affiliates/management/payouts', { headers }),
      ]);

      if (appsRes.ok) setApplications((await appsRes.json()).applications || []);
      if (affsRes.ok) setAffiliates((await affsRes.json()).affiliates || []);
      if (offersRes.ok) setOffers((await offersRes.json()).offers || []);
      if (commsRes.ok) setCommissions((await commsRes.json()).commissions || []);
      if (paysRes.ok) setPayouts((await paysRes.json()).payouts || []);
    } catch (err) {
      console.warn('Management data loading warning:', err);
      setActionError('Failed to fetch some management collections.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewApplication = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedApp || !profile?.role || !user) return;
    setIsProcessingReview(true);
    setActionError(null);

    try {
      const res = await fetch(
        `/api/affiliates/management/applications/${selectedApp.applicationId}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.uid,
            'x-user-role': profile.role,
            'x-user-email': user.email || '',
          },
          body: JSON.stringify({ status, reviewNotes }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to review application');
      }

      setActionSuccess(`Application ${status.toLowerCase()} successfully.`);
      setSelectedApp(null);
      setReviewNotes('');
      await loadManagementData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Review action failed');
    } finally {
      setIsProcessingReview(false);
    }
  };

  const handleToggleAffiliateStatus = async (affiliateId: string, currentStatus: string) => {
    if (!user || !profile?.role) return;
    const newStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';

    try {
      const res = await fetch(`/api/affiliates/management/affiliates/${affiliateId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile.role,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setActionSuccess(`Affiliate status updated to ${newStatus}.`);
        await loadManagementData();
      }
    } catch (err) {
      setActionError('Failed to update affiliate status');
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.role) return;

    try {
      const res = await fetch('/api/affiliates/management/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile.role,
        },
        body: JSON.stringify(editingOffer),
      });

      if (res.ok) {
        setShowOfferModal(false);
        setActionSuccess('Offer configuration updated.');
        await loadManagementData();
      }
    } catch (err) {
      setActionError('Failed to save offer');
    }
  };

  const handleUpdateCommission = async (commissionId: string, status: CommissionStatus, reason?: string) => {
    if (!user || !profile?.role) return;

    try {
      const res = await fetch(`/api/affiliates/management/commissions/${commissionId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile.role,
        },
        body: JSON.stringify({ status, reversalReason: reason }),
      });

      if (res.ok) {
        setReversalCommId(null);
        setReversalReason('');
        setActionSuccess(`Commission transitioned to ${status}.`);
        await loadManagementData();
      }
    } catch (err) {
      setActionError('Failed to update commission');
    }
  };

  const handleReviewPayout = async (status: PayoutStatus) => {
    if (!selectedPayout || !user || !profile?.role) return;
    setIsProcessingPayout(true);

    try {
      const res = await fetch(`/api/affiliates/management/payouts/${selectedPayout.payoutId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile.role,
        },
        body: JSON.stringify({
          status,
          providerReference: payoutProviderRef || undefined,
          failureReason: payoutFailureReason || undefined,
        }),
      });

      if (res.ok) {
        setSelectedPayout(null);
        setPayoutProviderRef('');
        setPayoutFailureReason('');
        setActionSuccess(`Payout request updated to ${status}.`);
        await loadManagementData();
      }
    } catch (err) {
      setActionError('Failed to update payout');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const formatNaira = (amount: number) => `₦${(amount || 0).toLocaleString()} NGN`;

  if (!isStaffOrAdmin) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 text-center">
          <Lock className="w-12 h-12 text-[#08E6F9] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Management Access Restricted</h2>
          <p className="text-xs text-[#CCD2D9] mb-6">
            Authorized staff, administrator, or super administrator role required to access affiliate governance.
          </p>
          <button
            onClick={() => navigate('/affiliate')}
            className="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer"
          >
            Go to Affiliate Program
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Desk Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#01213D] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Management Governance Desk
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Nexovira Affiliate Administration
            </h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">
              Authoritative review of partner applications, offer commissions, wallet disbursements, and anti-fraud controls.
            </p>
          </div>

          <button
            onClick={loadManagementData}
            disabled={isLoading}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Desk
          </button>
        </div>

        {/* Notifications */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#08E6F9]/40 flex items-center justify-between text-xs text-[#08E6F9]">
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#0682F4]/40 flex items-center justify-between text-xs text-[#CCD2D9]">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Desk Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#2B7EB5]/20 pb-2">
          <button
            onClick={() => setActiveTab('APPLICATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'APPLICATIONS' ? 'bg-[#0682F4] text-white' : 'text-[#CCD2D9] hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Applications ({applications.filter((a) => a.status === 'PENDING_REVIEW').length} Pending)
          </button>
          <button
            onClick={() => setActiveTab('AFFILIATES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'AFFILIATES' ? 'bg-[#0682F4] text-white' : 'text-[#CCD2D9] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Affiliate Registry ({affiliates.length})
          </button>
          <button
            onClick={() => setActiveTab('OFFERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'OFFERS' ? 'bg-[#0682F4] text-white' : 'text-[#CCD2D9] hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Eligible Offers ({offers.length})
          </button>
          <button
            onClick={() => setActiveTab('COMMISSIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'COMMISSIONS' ? 'bg-[#0682F4] text-white' : 'text-[#CCD2D9] hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Commissions ({commissions.length})
          </button>
          <button
            onClick={() => setActiveTab('PAYOUTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'PAYOUTS' ? 'bg-[#0682F4] text-white' : 'text-[#CCD2D9] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Payout Requests ({payouts.filter((p) => p.status === 'REQUESTED').length} Unprocessed)
          </button>
        </div>

        {/* Tab 1: Applications */}
        {activeTab === 'APPLICATIONS' && (
          <div className="rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 overflow-hidden">
            <div className="p-4 border-b border-[#2B7EB5]/20 bg-[#000000]/40 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white">Partner Applications</h2>
              <span className="text-xs text-[#CCD2D9]">
                Total Submitted: {applications.length}
              </span>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#CCD2D9]">
                No affiliate applications submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#2B7EB5]/20 text-[#CCD2D9] uppercase tracking-wider bg-[#000000]/20">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Email / Phone</th>
                      <th className="py-3 px-4">Channels</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B7EB5]/10">
                    {applications.map((app) => (
                      <tr key={app.applicationId} className="hover:bg-[#01213D]/30 transition">
                        <td className="py-3.5 px-4 text-[#CCD2D9]">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {app.fullName}
                        </td>
                        <td className="py-3.5 px-4 text-[#CCD2D9]">
                          <div>{app.email}</div>
                          <div className="text-[11px] text-[#CCD2D9]/70">{app.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#08E6F9]">
                          {app.promotionChannels?.length || 0} Channels
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              app.status === 'APPROVED'
                                ? 'bg-[#08E6F9]/10 border-[#08E6F9] text-[#08E6F9]'
                                : app.status === 'PENDING_REVIEW'
                                ? 'bg-[#0682F4]/20 border-[#0682F4] text-white animate-pulse'
                                : 'bg-[#01213D] border-[#2B7EB5]/30 text-[#CCD2D9]/50'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setReviewNotes(app.reviewNotes || '');
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Affiliates Registry */}
        {activeTab === 'AFFILIATES' && (
          <div className="rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 overflow-hidden">
            <div className="p-4 border-b border-[#2B7EB5]/20 bg-[#000000]/40 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white">Approved Affiliate Roster</h2>
              <span className="text-xs text-[#CCD2D9]">Total: {affiliates.length}</span>
            </div>

            {affiliates.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#CCD2D9]">
                No affiliates approved yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#2B7EB5]/20 text-[#CCD2D9] uppercase tracking-wider bg-[#000000]/20">
                      <th className="py-3 px-4">Affiliate Code</th>
                      <th className="py-3 px-4">Partner Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Clicks</th>
                      <th className="py-3 px-4">Conversions</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B7EB5]/10 font-mono">
                    {affiliates.map((aff) => (
                      <tr key={aff.affiliateId} className="hover:bg-[#01213D]/30 transition">
                        <td className="py-3.5 px-4 font-bold text-[#08E6F9]">
                          {aff.affiliateCode}
                        </td>
                        <td className="py-3.5 px-4 font-sans font-semibold text-white">
                          {aff.fullName}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-[#CCD2D9]">
                          {aff.email}
                        </td>
                        <td className="py-3.5 px-4 text-white">
                          {(aff.totalClicks || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-[#08E6F9]">
                          {(aff.totalConversions || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              aff.status === 'APPROVED'
                                ? 'bg-[#08E6F9]/10 border-[#08E6F9] text-[#08E6F9]'
                                : 'bg-[#000000] border-[#2B7EB5]/40 text-[#CCD2D9]/50'
                            }`}
                          >
                            {aff.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          <button
                            onClick={() => handleToggleAffiliateStatus(aff.affiliateId, aff.status)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              aff.status === 'APPROVED'
                                ? 'bg-[#01213D] text-[#CCD2D9] hover:bg-[#01213D]/80 border border-[#2B7EB5]/40'
                                : 'bg-[#0682F4] text-white hover:bg-[#05A9F7]'
                            }`}
                          >
                            {aff.status === 'APPROVED' ? 'Suspend' : 'Restore'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Offers Configuration */}
        {activeTab === 'OFFERS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white">Eligible Offers Catalog</h2>
                <p className="text-xs text-[#CCD2D9]">
                  Commission rates applied during server-authoritative checkout and scholarship processing.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingOffer({
                    offerType: 'MARKETPLACE_PRODUCT',
                    targetTitle: '',
                    targetSlug: '',
                    targetPrice: 0,
                    commissionEnabled: true,
                    commissionType: 'PERCENTAGE',
                    commissionValue: 10,
                    status: 'ACTIVE',
                  });
                  setShowOfferModal(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Configure New Offer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map((off) => (
                <div
                  key={off.offerId}
                  className="p-5 rounded-2xl bg-[#01213D]/30 border border-[#2B7EB5]/30 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#08E6F9] uppercase tracking-wider mb-2">
                      <span>{off.offerType.replace(/_/g, ' ')}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] border ${
                          off.commissionEnabled && off.status === 'ACTIVE'
                            ? 'bg-[#08E6F9]/10 border-[#08E6F9] text-[#08E6F9]'
                            : 'bg-[#000000] border-[#2B7EB5]/20 text-[#CCD2D9]/40'
                        }`}
                      >
                        {off.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-2 mb-2">
                      {off.targetTitle}
                    </h3>

                    <div className="p-3 rounded-xl bg-[#000000]/60 border border-[#2B7EB5]/20 text-xs space-y-1 mb-4">
                      <div className="flex justify-between text-[#CCD2D9]">
                        <span>Price:</span>
                        <span className="font-semibold text-white">{formatNaira(off.targetPrice)}</span>
                      </div>
                      <div className="flex justify-between text-[#CCD2D9]">
                        <span>Commission:</span>
                        <span className="font-bold text-[#08E6F9]">
                          {off.commissionType === 'PERCENTAGE'
                            ? `${off.commissionValue}%`
                            : `${formatNaira(off.commissionValue)} Fixed`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingOffer(off);
                      setShowOfferModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Offer Rules
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Commissions Audit */}
        {activeTab === 'COMMISSIONS' && (
          <div className="rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 overflow-hidden">
            <div className="p-4 border-b border-[#2B7EB5]/20 bg-[#000000]/40 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white">System Commissions Ledger</h2>
              <span className="text-xs text-[#CCD2D9]">Total: {commissions.length}</span>
            </div>

            {commissions.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#CCD2D9]">
                No referral commissions recorded in the system.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#2B7EB5]/20 text-[#CCD2D9] uppercase tracking-wider bg-[#000000]/20 font-sans">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Affiliate</th>
                      <th className="py-3 px-4">Ref Number</th>
                      <th className="py-3 px-4">Gross Sale</th>
                      <th className="py-3 px-4">Commission</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 font-sans">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B7EB5]/10">
                    {commissions.map((comm) => (
                      <tr key={comm.commissionId} className="hover:bg-[#01213D]/30 transition">
                        <td className="py-3.5 px-4 text-[#CCD2D9] font-sans">
                          {new Date(comm.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#08E6F9]">
                          {comm.affiliateCode}
                        </td>
                        <td className="py-3.5 px-4 text-white">
                          {comm.orderReference}
                        </td>
                        <td className="py-3.5 px-4 text-[#CCD2D9]">
                          {formatNaira(comm.grossTransactionAmount)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {formatNaira(comm.commissionAmount)}
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              comm.status === 'AVAILABLE'
                                ? 'bg-[#08E6F9]/10 border-[#08E6F9] text-[#08E6F9]'
                                : comm.status === 'PAID'
                                ? 'bg-[#0682F4]/20 border-[#0682F4] text-white'
                                : comm.status === 'PENDING'
                                ? 'bg-[#01213D] border-[#2B7EB5]/50 text-[#CCD2D9]'
                                : comm.status === 'REVERSED'
                                ? 'bg-[#000000] border-[#2B7EB5]/20 text-[#CCD2D9]/40 line-through'
                                : 'bg-[#01213D] border-[#2B7EB5]/20 text-[#CCD2D9]/50'
                            }`}
                          >
                            {comm.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-sans flex items-center gap-2">
                          {comm.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateCommission(comm.commissionId, 'AVAILABLE')}
                              className="px-2.5 py-1 rounded bg-[#0682F4] hover:bg-[#05A9F7] text-white text-[11px] font-semibold transition cursor-pointer"
                            >
                              Make Available
                            </button>
                          )}
                          {comm.status !== 'REVERSED' && comm.status !== 'PAID' && (
                            <button
                              onClick={() => setReversalCommId(comm.commissionId)}
                              className="px-2.5 py-1 rounded bg-[#01213D] hover:bg-[#01213D]/80 border border-[#2B7EB5]/30 text-[#CCD2D9] text-[11px] transition cursor-pointer"
                            >
                              Reverse
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Payouts Processing */}
        {activeTab === 'PAYOUTS' && (
          <div className="rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 overflow-hidden">
            <div className="p-4 border-b border-[#2B7EB5]/20 bg-[#000000]/40 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white">Affiliate Payout Requests</h2>
              <span className="text-xs text-[#CCD2D9]">Total Requests: {payouts.length}</span>
            </div>

            {payouts.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#CCD2D9]">
                No payout requests submitted.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#2B7EB5]/20 text-[#CCD2D9] uppercase tracking-wider bg-[#000000]/20 font-sans">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Affiliate</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Destination Bank</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 font-sans">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B7EB5]/10">
                    {payouts.map((pay) => (
                      <tr key={pay.payoutId} className="hover:bg-[#01213D]/30 transition">
                        <td className="py-3.5 px-4 text-[#CCD2D9] font-sans">
                          {new Date(pay.requestedDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#08E6F9]">
                          {pay.affiliateCode}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {formatNaira(pay.amount)}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-[#CCD2D9]">
                          <div>{pay.accountDetails.bankName}</div>
                          <div className="text-[11px] text-[#CCD2D9]/70 font-mono">
                            {pay.accountDetails.accountNumberMasked} ({pay.accountDetails.accountName})
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              pay.status === 'COMPLETED'
                                ? 'bg-[#08E6F9]/10 border-[#08E6F9] text-[#08E6F9]'
                                : pay.status === 'PROCESSING'
                                ? 'bg-[#0682F4]/20 border-[#0682F4] text-white'
                                : pay.status === 'REQUESTED'
                                ? 'bg-[#01213D] border-[#2B7EB5]/50 text-[#CCD2D9]'
                                : 'bg-[#01213D] border-[#2B7EB5]/20 text-[#CCD2D9]/50'
                            }`}
                          >
                            {pay.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          {pay.status === 'REQUESTED' || pay.status === 'PROCESSING' ? (
                            <button
                              onClick={() => {
                                setSelectedPayout(pay);
                                setPayoutProviderRef(pay.providerReference || '');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer"
                            >
                              Process
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#CCD2D9]/50 italic">Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal 1: Review Application */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-xl w-full p-6 sm:p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/60 shadow-2xl relative space-y-4">
              <h2 className="text-xl font-bold text-white">Review Affiliate Application</h2>
              <div className="p-4 rounded-xl bg-[#000000]/60 border border-[#2B7EB5]/20 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]">Applicant:</span>
                  <span className="font-semibold text-white">{selectedApp.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]">Email:</span>
                  <span className="text-white">{selectedApp.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]">Phone:</span>
                  <span className="text-white">{selectedApp.phone}</span>
                </div>
                <div>
                  <span className="text-[#CCD2D9] block mb-1">Channels:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedApp.promotionChannels?.map((ch) => (
                      <span key={ch} className="px-2 py-0.5 rounded bg-[#01213D] text-[#08E6F9] text-[10px]">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedApp.platformLinks && (
                  <div>
                    <span className="text-[#CCD2D9] block mb-0.5">Platform Links:</span>
                    <span className="text-white font-mono">{selectedApp.platformLinks}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#CCD2D9] block mb-0.5">Audience & Reach:</span>
                  <p className="text-white bg-[#01213D]/40 p-2 rounded">{selectedApp.audienceDescription}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  Review Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Internal review feedback or instructions..."
                  className="w-full px-3 py-2 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#CCD2D9] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewApplication('REJECTED')}
                  disabled={isProcessingReview}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#01213D] hover:bg-[#01213D]/80 border border-[#2B7EB5]/30 cursor-pointer"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewApplication('APPROVED')}
                  disabled={isProcessingReview}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] cursor-pointer"
                >
                  Approve as Affiliate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Edit/Add Offer */}
        {showOfferModal && (
          <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleSaveOffer} className="max-w-lg w-full p-6 sm:p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/60 shadow-2xl space-y-4">
              <h2 className="text-xl font-bold text-white">Configure Offer Commission</h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#CCD2D9] uppercase font-semibold mb-1">Offer Title</label>
                  <input
                    type="text"
                    required
                    value={editingOffer.targetTitle}
                    onChange={(e) => setEditingOffer({ ...editingOffer, targetTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#CCD2D9] uppercase font-semibold mb-1">Offer Type</label>
                    <select
                      value={editingOffer.offerType}
                      onChange={(e) => setEditingOffer({ ...editingOffer, offerType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-white"
                    >
                      <option value="MARKETPLACE_PRODUCT">Marketplace Product</option>
                      <option value="ACADEMY_COURSE">Academy Course</option>
                      <option value="DIGITAL_PRODUCT">Digital Product</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#CCD2D9] uppercase font-semibold mb-1">Target Price (NGN)</label>
                    <input
                      type="number"
                      required
                      value={editingOffer.targetPrice}
                      onChange={(e) => setEditingOffer({ ...editingOffer, targetPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#CCD2D9] uppercase font-semibold mb-1">Commission Type</label>
                    <select
                      value={editingOffer.commissionType}
                      onChange={(e) => setEditingOffer({ ...editingOffer, commissionType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-white"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (NGN)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#CCD2D9] uppercase font-semibold mb-1">Commission Value</label>
                    <input
                      type="number"
                      required
                      value={editingOffer.commissionValue}
                      onChange={(e) => setEditingOffer({ ...editingOffer, commissionValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-white">
                    <input
                      type="checkbox"
                      checked={editingOffer.commissionEnabled}
                      onChange={(e) => setEditingOffer({ ...editingOffer, commissionEnabled: e.target.checked })}
                      className="rounded"
                    />
                    Enable Affiliate Commissions
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#CCD2D9] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] cursor-pointer"
                >
                  Save Offer Configuration
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal 3: Process Payout */}
        {selectedPayout && (
          <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/60 shadow-2xl space-y-4">
              <h2 className="text-xl font-bold text-white">Process Payout Withdrawal</h2>
              <div className="p-4 rounded-xl bg-[#000000]/60 border border-[#2B7EB5]/20 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]">Affiliate:</span>
                  <span className="font-bold text-[#08E6F9]">{selectedPayout.affiliateCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]">Amount:</span>
                  <span className="font-extrabold text-white">{formatNaira(selectedPayout.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]">Bank:</span>
                  <span className="text-white">{selectedPayout.accountDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]">Account:</span>
                  <span className="text-white">{selectedPayout.accountDetails.accountNumberMasked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]">Beneficiary:</span>
                  <span className="font-semibold text-white">{selectedPayout.accountDetails.accountName}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-1.5">
                  Payment Reference / Provider Transaction ID
                </label>
                <input
                  type="text"
                  value={payoutProviderRef}
                  onChange={(e) => setPayoutProviderRef(e.target.value)}
                  placeholder="e.g. PSTK_TRF_948291048201"
                  className="w-full px-3 py-2 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-white font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-3 py-2 rounded-xl text-xs text-[#CCD2D9] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewPayout('FAILED')}
                  disabled={isProcessingPayout}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#01213D] border border-[#2B7EB5]/30 cursor-pointer"
                >
                  Mark Failed
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewPayout('COMPLETED')}
                  disabled={isProcessingPayout}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] cursor-pointer"
                >
                  Mark Completed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 4: Reversal Prompt */}
        {reversalCommId && (
          <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/60 shadow-2xl space-y-4">
              <h2 className="text-xl font-bold text-white">Reverse Referral Commission</h2>
              <p className="text-xs text-[#CCD2D9]">
                Reversing will deduct this commission from the affiliate's wallet balance. Use when the underlying order is refunded, returned, or cancelled.
              </p>
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-1.5">
                  Reversal Reason
                </label>
                <input
                  type="text"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Customer returned damaged package / full refund processed"
                  className="w-full px-3 py-2 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-white text-xs"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setReversalCommId(null)}
                  className="px-3 py-2 rounded-xl text-xs text-[#CCD2D9] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateCommission(reversalCommId, 'REVERSED', reversalReason)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4] cursor-pointer"
                >
                  Confirm Reversal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
