import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAffiliate } from '../../context/AffiliateContext';
import {
  Share2,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  MousePointer,
  Award,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Wallet,
  Settings,
  ShieldCheck,
  Package,
  BookOpen,
  Building2,
  AlertCircle,
  X,
} from 'lucide-react';
import { CommissionRecord, PayoutRequest } from '../../types/affiliate';
import { AffiliateOnboardingChecklist } from '../../components/affiliate/AffiliateOnboardingChecklist';
import { copyTextToClipboard, shareLinkNatively } from '../../utils/affiliateLinkUtils';

export const AffiliateDashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { affiliateStatus, profile, application, wallet, refreshAffiliateState, isLoading } = useAffiliate();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [showManualCopyModal, setShowManualCopyModal] = useState<string | null>(null);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const hasVerifiedPayoutProfile = Boolean(profile?.payoutProfile?.isVerified);

  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/signin?redirect=/affiliate/dashboard');
      return;
    }

    if (affiliateStatus !== 'APPROVED' && !isLoading) {
      navigate('/affiliate');
      return;
    }

    if (user && profile && hasVerifiedPayoutProfile) {
      loadDashboardData();
    }
  }, [user, affiliateStatus, profile, hasVerifiedPayoutProfile, isLoading, navigate]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setDashboardLoading(true);
      const res = await fetch(`/api/affiliates/me/dashboard?userId=${encodeURIComponent(user.uid)}`, {
        headers: {
          'x-user-id': user.uid,
          'x-user-email': user.email || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCommissions(data.recentCommissions || []);
        setPayouts(data.recentPayouts || []);
      }
    } catch (err) {
      console.warn('Error loading dashboard data:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const generalReferralUrl = profile
    ? `${window.location.origin}/r/${profile.affiliateCode}`
    : '';

  const normalPublicUrl = typeof window !== 'undefined' ? `${window.location.origin}/marketplace` : '';

  const handleCopyLink = async () => {
    if (!generalReferralUrl) return;
    setCopyError(null);
    const result = await copyTextToClipboard(generalReferralUrl);
    if (result.success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      setCopyError(result.error || 'Failed to copy to clipboard.');
      setShowManualCopyModal(generalReferralUrl);
    }
  };

  const handleShareLink = async () => {
    if (!generalReferralUrl) return;
    const res = await shareLinkNatively({
      title: 'Nexovira Enterprise Computing & Engineering Academy',
      text: 'Shop genuine enterprise computing hardware and enroll in high-impact software engineering programs on Nexovira.',
      url: generalReferralUrl,
    });
    if (!res.supported) {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const formatNaira = (amount: number) => {
    return `₦${(amount || 0).toLocaleString()} NGN`;
  };

  // State 1: Application approved, but payout profile is not verified yet
  // Requirement 3: Mandatory payout onboarding screen gate
  if (affiliateStatus === 'APPROVED' && !hasVerifiedPayoutProfile && !isLoading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <AffiliateOnboardingChecklist
            onSetupClick={() => navigate('/affiliate/payout')}
            showActions={true}
          />
        </div>
      </div>
    );
  }

  const clicks = profile?.totalClicks || 0;
  const conversions = profile?.totalConversions || 0;
  const conversionRate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-[#000000] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#01213D] via-[#01213D]/80 to-[#000000] border border-[#2B7EB5]/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Affiliate
                </span>
                <span className="text-xs text-[#CCD2D9]">
                  Code: <strong className="text-white font-mono">{profile?.affiliateCode}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {profile?.fullName || user?.displayName || 'Partner'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#CCD2D9]">
                Your authoritative performance dashboard. Tracking and commissions are computed server-side in real-time.
              </p>
            </div>

            {/* Quick Actions Header Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/affiliate/offers')}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer flex items-center gap-2 shadow-md shadow-[#0682F4]/20"
              >
                <Package className="w-4 h-4" />
                Eligible Offers
              </button>
              <button
                onClick={() => navigate('/affiliate/wallet')}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/40 hover:border-[#0682F4] transition cursor-pointer flex items-center gap-2"
              >
                <Wallet className="w-4 h-4 text-[#08E6F9]" />
                Wallet
              </button>
              <button
                onClick={() => navigate('/affiliate/payout')}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/40 hover:border-[#0682F4] transition cursor-pointer flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-[#08E6F9]" />
                Payout Details
              </button>
            </div>
          </div>

          {/* Primary Referral Link Banner */}
          <div className="mt-6 pt-6 border-t border-[#2B7EB5]/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider">
                Primary General Referral Link
              </label>
              <span className="text-[11px] text-[#CCD2D9]/70">
                Normal Store URL: <span className="font-mono text-white/80">{normalPublicUrl}</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 font-mono text-xs sm:text-sm text-[#08E6F9] overflow-x-auto flex items-center select-all">
                {generalReferralUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#06C3F8] hover:from-[#0682F4] hover:to-[#08E6F9] transition cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-md shadow-[#0682F4]/20"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Referral Link
                  </>
                )}
              </button>
              <a
                href={generalReferralUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl font-semibold text-xs text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/40 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                title="Preview link in new tab"
              >
                <ExternalLink className="w-4 h-4 text-[#08E6F9]" />
                Preview
              </a>
              <button
                onClick={handleShareLink}
                className="px-4 py-3 rounded-xl font-semibold text-xs text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/40 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                title="Share link via native device share sheet"
              >
                <Share2 className="w-4 h-4 text-[#08E6F9]" />
                Share
              </button>
            </div>
            <p className="text-[11px] text-[#CCD2D9]/70">
              Directs visitors to the Nexovira marketplace with your 30-day tracking cookie attached. Shareable on any blog, website, or social platform.
            </p>
          </div>
        </div>

        {/* Real Performance Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#CCD2D9] text-xs font-semibold uppercase tracking-wider">
              <span>Total Clicks</span>
              <MousePointer className="w-4 h-4 text-[#08E6F9]" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {clicks.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#CCD2D9] mt-1">Direct referral clicks</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#CCD2D9] text-xs font-semibold uppercase tracking-wider">
              <span>Conversions</span>
              <Award className="w-4 h-4 text-[#08E6F9]" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {conversions.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#CCD2D9] mt-1">Successful sales & enrollments</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#CCD2D9] text-xs font-semibold uppercase tracking-wider">
              <span>Conversion Rate</span>
              <TrendingUp className="w-4 h-4 text-[#08E6F9]" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {conversionRate}%
              </div>
              <p className="text-[11px] text-[#CCD2D9] mt-1">Attributed visit efficiency</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#CCD2D9] text-xs font-semibold uppercase tracking-wider">
              <span>Total Earnings</span>
              <DollarSign className="w-4 h-4 text-[#08E6F9]" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#08E6F9]">
                {formatNaira(wallet?.totalEarned || 0)}
              </div>
              <p className="text-[11px] text-[#CCD2D9] mt-1">Cumulative verified commission</p>
            </div>
          </div>
        </div>

        {/* Wallet Balance & Payout Status Bar */}
        <div className="p-6 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#08E6F9]" />
              Available for Immediate Withdrawal
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {formatNaira(wallet?.availableBalance || 0)}
            </div>
            <div className="text-xs text-[#CCD2D9]">
              Pending clearance: {formatNaira(wallet?.pendingBalance || 0)} • Payout destination: <strong>{profile?.payoutProfile?.bankName || 'Verified Bank'} ({profile?.payoutProfile?.accountNumberMasked || `******${profile?.payoutProfile?.accountNumber?.slice(-4)}`})</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/affiliate/payout/request')}
              disabled={(wallet?.availableBalance || 0) < 5000}
              className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] shadow-lg shadow-[#0682F4]/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              Request Withdrawal
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/affiliate/wallet')}
              className="px-4 py-3 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#000000] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer"
            >
              Ledger Details
            </button>
          </div>
        </div>

        {/* Recent Commissions & Activity Table */}
        <div className="rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 overflow-hidden">
          <div className="p-6 border-b border-[#2B7EB5]/20 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Referral Commissions</h2>
              <p className="text-xs text-[#CCD2D9] mt-0.5">
                Real-time records for hardware purchases and academy registrations.
              </p>
            </div>
            <button
              onClick={() => navigate('/affiliate/wallet')}
              className="text-xs text-[#08E6F9] hover:underline cursor-pointer"
            >
              View Full History →
            </button>
          </div>

          {dashboardLoading ? (
            <div className="py-12 text-center text-xs text-[#CCD2D9]">
              Loading authoritative performance records...
            </div>
          ) : commissions.length === 0 ? (
            <div className="py-12 text-center px-4">
              <Package className="w-10 h-10 text-[#2B7EB5]/40 mx-auto mb-3" />
              <div className="text-sm font-bold text-white">No commissions yet</div>
              <p className="text-xs text-[#CCD2D9] mt-1 max-w-sm mx-auto">
                Share your unique links from the Eligible Offers catalog. When a buyer completes checkout, your commission appears here instantly.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/affiliate/offers')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer"
                >
                  Explore Eligible Offers
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#000000]/60 text-[#CCD2D9] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Order / Reference</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Transaction Amount</th>
                    <th className="px-6 py-3">Commission Rate</th>
                    <th className="px-6 py-3">Earned Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B7EB5]/10">
                  {commissions.slice(0, 5).map((comm) => (
                    <tr key={comm.commissionId} className="hover:bg-[#01213D]/40 transition">
                      <td className="px-6 py-4 font-mono font-medium text-white">
                        {comm.orderReference}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#01213D] border border-[#0682F4]/30 text-[#08E6F9]">
                          {comm.sourceType === 'ACADEMY_COURSE' ? 'Academy' : 'Hardware'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-white">
                        {formatNaira(comm.grossTransactionAmount)}
                      </td>
                      <td className="px-6 py-4 text-[#CCD2D9]">
                        {comm.commissionType === 'PERCENTAGE'
                          ? `${comm.commissionRate}%`
                          : 'Fixed'}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#08E6F9] font-mono">
                        {formatNaira(comm.commissionAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            comm.status === 'AVAILABLE' || comm.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : comm.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {comm.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#CCD2D9]">
                        {new Date(comm.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Manual Copy Fallback Modal if clipboard access was restricted */}
        {showManualCopyModal && (
          <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/60 shadow-2xl relative">
              <button
                onClick={() => setShowManualCopyModal(null)}
                className="absolute top-4 right-4 text-[#CCD2D9] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-white mb-2">Copy Referral Link</h3>
              <p className="text-xs text-[#CCD2D9] mb-4">
                Clipboard write permission was restricted by your browser. Please select all the text below and press <strong className="text-white">Ctrl+C</strong> (or <strong className="text-white">Cmd+C</strong> on Mac):
              </p>
              <textarea
                readOnly
                value={showManualCopyModal}
                className="w-full h-24 p-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/40 font-mono text-xs text-[#08E6F9] select-all focus:outline-none"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowManualCopyModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0682F4] hover:bg-[#05A9F7] cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
