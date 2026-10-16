import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAffiliate } from '../../context/AffiliateContext';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Package,
  BookOpen,
  ArrowRight,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { CommissionRecord, PayoutRequest } from '../../types/affiliate';

export const AffiliateWalletPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { affiliateStatus, profile, wallet, refreshWallet, isLoading } = useAffiliate();

  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'COMMISSIONS' | 'PAYOUTS'>('COMMISSIONS');

  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/signin?redirect=/affiliate/wallet');
      return;
    }

    if (affiliateStatus !== 'APPROVED' && !isLoading) {
      navigate('/affiliate');
      return;
    }

    if (user && profile) {
      loadWalletLedger();
    }
  }, [user, affiliateStatus, profile, isLoading, navigate]);

  const loadWalletLedger = async () => {
    if (!user) return;
    try {
      setLedgerLoading(true);
      const [walletRes, payoutsRes] = await Promise.all([
        fetch(`/api/affiliates/me/wallet?userId=${encodeURIComponent(user.uid)}`, {
          headers: {
            'x-user-id': user.uid,
            'x-user-email': user.email || '',
          },
        }),
        fetch(`/api/affiliates/me/payouts?userId=${encodeURIComponent(user.uid)}`, {
          headers: {
            'x-user-id': user.uid,
            'x-user-email': user.email || '',
          },
        }),
      ]);

      if (walletRes.ok) {
        const wData = await walletRes.json();
        setCommissions(wData.commissions || []);
      }

      if (payoutsRes.ok) {
        const pData = await payoutsRes.json();
        setPayouts(pData.payouts || []);
      }
    } catch (err) {
      console.warn('Error fetching ledger details:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const formatNaira = (amount: number) => {
    return `₦${(amount || 0).toLocaleString()} NGN`;
  };

  const isEligibleForPayout = (wallet?.availableBalance || 0) >= 5000;

  return (
    <div className="min-h-screen bg-[#000000] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#01213D] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-2">
              <Wallet className="w-3.5 h-3.5" />
              Affiliate Financial Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Wallet & Commission Ledger</h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">
              Authoritative accounting of your referral earnings, verification holds, and withdrawal history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/affiliate/dashboard')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/affiliate/payout/request')}
              disabled={!isEligibleForPayout}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#0682F4]/20"
            >
              Request Withdrawal
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5-Card Balance Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Available */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#01213D] to-[#000000] border border-[#08E6F9]/40 flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="text-[11px] font-bold text-[#08E6F9] uppercase tracking-wider flex items-center justify-between">
              <span>Available</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-[#08E6F9]">
                {formatNaira(wallet?.availableBalance || 0)}
              </div>
              <p className="text-[10px] text-[#CCD2D9] mt-1">Ready for payout withdrawal</p>
            </div>
          </div>

          {/* Pending */}
          <div className="p-5 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-[#CCD2D9] uppercase tracking-wider flex items-center justify-between">
              <span>Pending</span>
              <Clock className="w-4 h-4 text-[#0682F4]" />
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-bold text-white">
                {formatNaira(wallet?.pendingBalance || 0)}
              </div>
              <p className="text-[10px] text-[#CCD2D9] mt-1">Awaiting hold period</p>
            </div>
          </div>

          {/* Paid */}
          <div className="p-5 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-[#CCD2D9] uppercase tracking-wider flex items-center justify-between">
              <span>Paid Out</span>
              <ShieldCheck className="w-4 h-4 text-[#06C3F8]" />
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-bold text-white">
                {formatNaira(wallet?.paidBalance || 0)}
              </div>
              <p className="text-[10px] text-[#CCD2D9] mt-1">Settled to bank account</p>
            </div>
          </div>

          {/* Reversed */}
          <div className="p-5 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-[#CCD2D9] uppercase tracking-wider flex items-center justify-between">
              <span>Reversed</span>
              <RotateCcw className="w-4 h-4 text-[#CCD2D9]" />
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-bold text-[#CCD2D9]">
                {formatNaira(wallet?.reversedBalance || 0)}
              </div>
              <p className="text-[10px] text-[#CCD2D9] mt-1">Cancelled or refunded</p>
            </div>
          </div>

          {/* Total Earned */}
          <div className="p-5 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-[#CCD2D9] uppercase tracking-wider flex items-center justify-between">
              <span>Total Earned</span>
              <TrendingUp className="w-4 h-4 text-[#08E6F9]" />
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-bold text-white">
                {formatNaira(wallet?.totalEarned || 0)}
              </div>
              <p className="text-[10px] text-[#CCD2D9] mt-1">Cumulative earned</p>
            </div>
          </div>
        </div>

        {/* Withdrawal Threshold Banner */}
        <div className="p-4 rounded-xl bg-[#01213D]/30 border border-[#2B7EB5]/20 flex items-center justify-between text-xs text-[#CCD2D9]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#08E6F9] shrink-0" />
            <span>
              Minimum withdrawal threshold: <strong>₦5,000 NGN</strong>. Payouts are settled to verified Nigerian bank accounts via Paystack transfer.
            </span>
          </div>
          <button
            onClick={() => navigate('/affiliate/payout')}
            className="text-[#08E6F9] hover:underline font-medium shrink-0 ml-4 cursor-pointer"
          >
            Manage Payout Details
          </button>
        </div>

        {/* Ledger Tabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2B7EB5]/20 pb-2">
            <button
              onClick={() => setActiveTab('COMMISSIONS')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'COMMISSIONS'
                  ? 'bg-[#0682F4] text-white'
                  : 'text-[#CCD2D9] hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Commissions Ledger ({commissions.length})
            </button>
            <button
              onClick={() => setActiveTab('PAYOUTS')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'PAYOUTS'
                  ? 'bg-[#0682F4] text-white'
                  : 'text-[#CCD2D9] hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Payout Withdrawals ({payouts.length})
            </button>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 overflow-hidden">
            {activeTab === 'COMMISSIONS' ? (
              commissions.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <FileText className="w-10 h-10 text-[#2B7EB5]/40 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white">No commissions recorded</h3>
                  <p className="text-xs text-[#CCD2D9] max-w-sm mx-auto mt-1">
                    When visitors complete qualifying purchases using your referral link, transaction records will display here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#2B7EB5]/20 text-[#CCD2D9] uppercase tracking-wider bg-[#000000]/40">
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4">Order / App Ref</th>
                        <th className="py-3 px-4">Offer Source</th>
                        <th className="py-3 px-4">Gross Sale</th>
                        <th className="py-3 px-4">Rate</th>
                        <th className="py-3 px-4">Commission</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2B7EB5]/10 font-mono">
                      {commissions.map((comm) => (
                        <tr key={comm.commissionId} className="hover:bg-[#01213D]/30 transition">
                          <td className="py-3.5 px-4 text-[#CCD2D9] font-sans">
                            {new Date(comm.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {comm.orderReference}
                          </td>
                          <td className="py-3.5 px-4 font-sans text-[#CCD2D9]">
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
                          <td className="py-3.5 px-4 text-[#CCD2D9]">
                            {formatNaira(comm.grossTransactionAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-[#CCD2D9]">
                            {comm.commissionType === 'PERCENTAGE'
                              ? `${comm.commissionRate}%`
                              : 'Fixed'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#08E6F9]">
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
                                  ? 'bg-[#000000] border-[#2B7EB5]/30 text-[#CCD2D9]/40 line-through'
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
              )
            ) : payouts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <ShieldCheck className="w-10 h-10 text-[#2B7EB5]/40 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">No payout requests yet</h3>
                <p className="text-xs text-[#CCD2D9] max-w-sm mx-auto mt-1">
                  Once your available balance reaches ₦5,000 NGN, you can submit withdrawal requests to your verified bank account.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#2B7EB5]/20 text-[#CCD2D9] uppercase tracking-wider bg-[#000000]/40">
                      <th className="py-3 px-4">Requested Date</th>
                      <th className="py-3 px-4">Payout ID</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Bank Details</th>
                      <th className="py-3 px-4">Provider Ref</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B7EB5]/10 font-mono">
                    {payouts.map((pay) => (
                      <tr key={pay.payoutId} className="hover:bg-[#01213D]/30 transition">
                        <td className="py-3.5 px-4 text-[#CCD2D9] font-sans">
                          {new Date(pay.requestedDate).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {pay.payoutId}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#08E6F9]">
                          {formatNaira(pay.amount)}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-[#CCD2D9]">
                          <div>{pay.accountDetails.bankName}</div>
                          <div className="text-[11px] text-[#CCD2D9]/70">
                            {pay.accountDetails.accountNumberMasked} ({pay.accountDetails.accountName})
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#CCD2D9]">
                          {pay.providerReference || 'Pending Assignment'}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
