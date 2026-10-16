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
} from 'lucide-react';
import { CommissionRecord, PayoutRequest } from '../../types/affiliate';

export const AffiliateDashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { affiliateStatus, profile, wallet, refreshAffiliateState, isLoading } = useAffiliate();

  const [copiedLink, setCopiedLink] = useState(false);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/signin?redirect=/affiliate/dashboard');
      return;
    }

    if (affiliateStatus !== 'APPROVED' && !isLoading) {
      navigate('/affiliate');
      return;
    }

    if (user && profile) {
      loadDashboardData();
    }
  }, [user, affiliateStatus, profile, isLoading, navigate]);

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

  const copyToClipboard = () => {
    if (!generalReferralUrl) return;
    navigator.clipboard.writeText(generalReferralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const formatNaira = (amount: number) => {
    return `₦${(amount || 0).toLocaleString()} NGN`;
  };

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
          <div className="mt-6 pt-6 border-t border-[#2B7EB5]/20">
            <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
              Primary General Referral Link
            </label>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 font-mono text-xs sm:text-sm text-[#08E6F9] overflow-x-auto flex items-center select-all">
                {generalReferralUrl}
              </div>
              <button
                onClick={copyToClipboard}
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#06C3F8] hover:from-[#0682F4] hover:to-[#08E6F9] transition cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-md shadow-[#0682F4]/20"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[#CCD2D9]/70">
              Directs visitors to the Nexovira marketplace with your 30-day tracking cookie attached.
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
              <p className="text-[11px] text-[#CCD2D9] mt-1">Conv. Rate: {conversionRate}%</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#CCD2D9] text-xs font-semibold uppercase tracking-wider">
              <span>Available Balance</span>
              <DollarSign className="w-4 h-4 text-[#08E6F9]" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#08E6F9]">
                {formatNaira(wallet?.availableBalance || 0)}
              </div>
              <p className="text-[11px] text-[#CCD2D9] mt-1">Withdrawable balance</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#CCD2D9] text-xs font-semibold uppercase tracking-wider">
              <span>Total Earned</span>
              <TrendingUp className="w-4 h-4 text-[#08E6F9]" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {formatNaira(wallet?.totalEarned || 0)}
              </div>
              <p className="text-[11px] text-[#CCD2D9] mt-1">
                Pending: {formatNaira(wallet?.pendingBalance || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Overview & Payout Action */}
        <div className="p-6 rounded-2xl bg-[#01213D]/25 border border-[#2B7EB5]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#08E6F9]" />
              Affiliate Wallet Balance
            </h2>
            <p className="text-xs text-[#CCD2D9] mt-0.5">
              Available: <strong className="text-[#08E6F9]">{formatNaira(wallet?.availableBalance || 0)}</strong> • Minimum threshold: ₦5,000 NGN
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/affiliate/wallet')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#2B7EB5]/40 transition cursor-pointer"
            >
              Inspect Wallet Ledger
            </button>
            <button
              onClick={() => navigate('/affiliate/payout/request')}
              disabled={(wallet?.availableBalance || 0) < 5000}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#0682F4]/20"
            >
              Request Payout
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recent Referral Commissions Ledger */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Referral Commissions</h2>
              <p className="text-xs text-[#CCD2D9]">
                Server-validated orders and scholarship fee payments tied to your affiliate code.
              </p>
            </div>
            <button
              onClick={() => navigate('/affiliate/wallet')}
              className="text-xs font-semibold text-[#08E6F9] hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              View Complete Ledger
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {commissions.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-[#000000]/40 border border-[#2B7EB5]/10">
              <Share2 className="w-10 h-10 text-[#2B7EB5]/60 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">No referrals recorded yet</h3>
              <p className="text-xs text-[#CCD2D9] max-w-sm mx-auto mt-1 mb-4">
                Share your unique links across your content, newsletter, or developer communities to start generating verified commissions.
              </p>
              <button
                onClick={() => navigate('/affiliate/offers')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer"
              >
                Browse Eligible Products & Courses
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#2B7EB5]/20 text-[#CCD2D9] uppercase tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Reference</th>
                    <th className="py-3 px-3">Offer Type</th>
                    <th className="py-3 px-3">Gross Transaction</th>
                    <th className="py-3 px-3">Rate</th>
                    <th className="py-3 px-3">Commission</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B7EB5]/10 font-mono">
                  {commissions.map((comm) => (
                    <tr key={comm.commissionId} className="hover:bg-[#01213D]/30 transition">
                      <td className="py-3.5 px-3 text-[#CCD2D9] font-sans">
                        {new Date(comm.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-white">
                        {comm.orderReference}
                      </td>
                      <td className="py-3.5 px-3 font-sans text-[#CCD2D9]">
                        {comm.sourceType === 'MARKETPLACE_PRODUCT' ? (
                          <span className="inline-flex items-center gap-1 text-[#08E6F9]">
                            <Package className="w-3.5 h-3.5" /> Marketplace
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#06C3F8]">
                            <BookOpen className="w-3.5 h-3.5" /> Academy
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-[#CCD2D9]">
                        {formatNaira(comm.grossTransactionAmount)}
                      </td>
                      <td className="py-3.5 px-3 text-[#CCD2D9]">
                        {comm.commissionType === 'PERCENTAGE'
                          ? `${comm.commissionRate}%`
                          : 'Fixed'}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-[#08E6F9]">
                        {formatNaira(comm.commissionAmount)}
                      </td>
                      <td className="py-3.5 px-3 font-sans">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            comm.status === 'AVAILABLE'
                              ? 'bg-[#08E6F9]/10 border-[#08E6F9] text-[#08E6F9]'
                              : comm.status === 'PAID'
                              ? 'bg-[#0682F4]/20 border-[#0682F4] text-white'
                              : comm.status === 'PENDING'
                              ? 'bg-[#01213D] border-[#2B7EB5]/50 text-[#CCD2D9]'
                              : 'bg-[#01213D] border-[#2B7EB5]/20 text-[#CCD2D9]/50'
                          }`}
                        >
                          {comm.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
