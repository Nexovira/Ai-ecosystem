import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAffiliate } from '../../context/AffiliateContext';
import {
  CreditCard,
  Building2,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '057', name: 'Zenith Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '035', name: 'Wema Bank / ALAT' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '076', name: 'Polaris Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '090267', name: 'Kuda Microfinance Bank' },
  { code: '090405', name: 'Moniepoint MFB' },
  { code: '090110', name: 'VFD Microfinance Bank' },
  { code: '100004', name: 'OPay Digital Services' },
  { code: '090551', name: 'FairMoney Microfinance Bank' },
  { code: '090549', name: 'Palmpay' },
];

export const AffiliatePayoutPage: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { user } = useAuth();
  const {
    affiliateStatus,
    profile,
    wallet,
    verifyBankDetails,
    savePayoutProfile,
    requestPayoutWithdrawal,
    refreshAffiliateState,
    isLoading,
  } = useAffiliate();

  // Mode: 'SETTINGS' or 'REQUEST'
  const isRequestMode = currentPath.includes('/request');
  const [activeMode, setActiveMode] = useState<'SETTINGS' | 'REQUEST'>(
    isRequestMode ? 'REQUEST' : 'SETTINGS'
  );

  useEffect(() => {
    if (isRequestMode) {
      setActiveMode('REQUEST');
    } else {
      setActiveMode('SETTINGS');
    }
  }, [isRequestMode]);

  // Form states for Settings
  const [selectedBankCode, setSelectedBankCode] = useState(profile?.payoutProfile?.bankCode || '');
  const [accountNumber, setAccountNumber] = useState(profile?.payoutProfile?.accountNumber || '');
  const [resolvedAccountName, setResolvedAccountName] = useState(
    profile?.payoutProfile?.accountName || ''
  );
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [bankVerificationError, setBankVerificationError] = useState<string | null>(null);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Form states for Payout Request
  const [requestedAmount, setRequestedAmount] = useState<number>(wallet?.availableBalance || 0);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    if (wallet) {
      setRequestedAmount(wallet.availableBalance);
    }
  }, [wallet]);

  useEffect(() => {
    if (profile?.payoutProfile) {
      setSelectedBankCode(profile.payoutProfile.bankCode);
      setAccountNumber(profile.payoutProfile.accountNumber);
      setResolvedAccountName(profile.payoutProfile.accountName);
    }
  }, [profile]);

  if (!user && !isLoading) {
    navigate('/signin?redirect=/affiliate/payout');
    return null;
  }

  if (affiliateStatus !== 'APPROVED' && !isLoading) {
    navigate('/affiliate');
    return null;
  }

  const formatNaira = (amount: number) => {
    return `₦${(amount || 0).toLocaleString()} NGN`;
  };

  // Handle bank account verification
  const handleVerifyBank = async () => {
    setBankVerificationError(null);
    setProfileSuccessMsg(null);

    if (!selectedBankCode) {
      setBankVerificationError('Please select your commercial or microfinance bank.');
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setBankVerificationError('Account number must be exactly 10 digits.');
      return;
    }

    setIsVerifyingBank(true);
    const result = await verifyBankDetails(accountNumber, selectedBankCode);
    setIsVerifyingBank(false);

    if (result.success && result.accountName) {
      setResolvedAccountName(result.accountName);
    } else {
      setBankVerificationError(result.error || 'Could not verify account name with the bank.');
    }
  };

  // Handle saving verified payout profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankVerificationError(null);
    setProfileSuccessMsg(null);

    if (!resolvedAccountName) {
      setBankVerificationError('Please verify your bank account before saving.');
      return;
    }

    const bankObj = NIGERIAN_BANKS.find((b) => b.code === selectedBankCode);
    const bankName = bankObj ? bankObj.name : 'Nigerian Commercial Bank';

    setIsSavingProfile(true);
    const result = await savePayoutProfile({
      bankName,
      bankCode: selectedBankCode,
      accountNumber,
      accountName: resolvedAccountName,
    });
    setIsSavingProfile(false);

    if (result.success) {
      setProfileSuccessMsg('Payout bank account successfully verified and saved.');
      await refreshAffiliateState();
    } else {
      setBankVerificationError(result.error || 'Failed to update payout profile.');
    }
  };

  // Handle payout withdrawal request
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutSuccess(false);

    if (!profile?.payoutProfile?.isVerified) {
      setPayoutError('Please configure and verify your bank payout details first.');
      return;
    }

    const available = wallet?.availableBalance || 0;
    if (available < 5000) {
      setPayoutError('Minimum withdrawal threshold is ₦5,000 NGN.');
      return;
    }

    if (requestedAmount < 5000 || requestedAmount > available) {
      setPayoutError(
        `Withdrawal amount must be between ₦5,000 NGN and your available balance of ${formatNaira(available)}.`
      );
      return;
    }

    setIsSubmittingPayout(true);
    const result = await requestPayoutWithdrawal(requestedAmount);
    setIsSubmittingPayout(false);

    if (result.success) {
      setPayoutSuccess(true);
      await refreshAffiliateState();
    } else {
      setPayoutError(result.error || 'Failed to process payout request.');
    }
  };

  const hasVerifiedPayoutProfile = Boolean(profile?.payoutProfile?.isVerified);

  return (
    <div className="min-h-screen bg-[#000000] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#01213D] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              Direct Nigerian Bank Settlement
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Payout Management</h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">
              Configure your verified bank destination or request an immediate withdrawal of available commissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/affiliate/wallet')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer"
            >
              View Wallet Ledger
            </button>
            <button
              onClick={() => navigate('/affiliate/dashboard')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#2B7EB5]/20 pb-2">
          <button
            onClick={() => {
              setActiveMode('REQUEST');
              navigate('/affiliate/payout/request');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeMode === 'REQUEST'
                ? 'bg-[#0682F4] text-white shadow-md shadow-[#0682F4]/20'
                : 'text-[#CCD2D9] hover:text-white bg-[#01213D]/40'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Request Withdrawal
          </button>
          <button
            onClick={() => {
              setActiveMode('SETTINGS');
              navigate('/affiliate/payout');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeMode === 'SETTINGS'
                ? 'bg-[#0682F4] text-white shadow-md shadow-[#0682F4]/20'
                : 'text-[#CCD2D9] hover:text-white bg-[#01213D]/40'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Payout Account Settings
          </button>
        </div>

        {/* Tab 1: Payout Request */}
        {activeMode === 'REQUEST' && (
          <div className="space-y-6">
            {/* Balance Overview Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#01213D] to-[#000000] border border-[#2B7EB5]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider">
                  Withdrawable Commissions
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#08E6F9] mt-1">
                  {formatNaira(wallet?.availableBalance || 0)}
                </div>
                <p className="text-xs text-[#CCD2D9] mt-1">
                  Minimum threshold: <strong>₦5,000 NGN</strong> • Pending hold: {formatNaira(wallet?.pendingBalance || 0)}
                </p>
              </div>

              {!hasVerifiedPayoutProfile && (
                <button
                  onClick={() => {
                    setActiveMode('SETTINGS');
                    navigate('/affiliate/payout');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer flex items-center gap-1.5"
                >
                  Configure Bank Profile First
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Success Banner */}
            {payoutSuccess && (
              <div className="p-6 rounded-2xl bg-[#01213D]/60 border border-[#08E6F9]/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#0682F4]/20 text-[#08E6F9] mx-auto flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Withdrawal Request Submitted!</h3>
                <p className="text-xs text-[#CCD2D9] max-w-md mx-auto">
                  Your payout of {formatNaira(requestedAmount)} is now under management review. Once verified, funds will be disbursed to your verified bank account via Paystack.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/affiliate/wallet')}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer"
                  >
                    View in Wallet Ledger
                  </button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {payoutError && (
              <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#0682F4]/40 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#08E6F9] shrink-0 mt-0.5" />
                <div className="text-xs text-[#CCD2D9]">{payoutError}</div>
              </div>
            )}

            {/* Request Form */}
            {!payoutSuccess && (
              <form onSubmit={handleRequestPayout} className="p-6 sm:p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 space-y-6">
                <h2 className="text-lg font-bold text-white border-b border-[#2B7EB5]/20 pb-3">
                  Withdrawal Parameters
                </h2>

                {/* Destination Account Preview */}
                <div className="p-4 rounded-xl bg-[#000000]/60 border border-[#2B7EB5]/20 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-[#CCD2D9] uppercase tracking-wider">
                      Payout Destination Account
                    </div>
                    {hasVerifiedPayoutProfile ? (
                      <div className="mt-1">
                        <div className="text-sm font-bold text-white">
                          {profile?.payoutProfile?.bankName}
                        </div>
                        <div className="text-xs font-mono text-[#08E6F9]">
                          ******{profile?.payoutProfile?.accountNumber.slice(-4)} — {profile?.payoutProfile?.accountName}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#CCD2D9]/70 mt-1 italic">
                        No verified bank account configured.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('SETTINGS');
                      navigate('/affiliate/payout');
                    }}
                    className="text-xs font-semibold text-[#08E6F9] hover:underline cursor-pointer"
                  >
                    Edit Bank
                  </button>
                </div>

                {/* Amount input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider">
                      Withdrawal Amount (NGN) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setRequestedAmount(wallet?.availableBalance || 0)}
                      className="text-xs text-[#08E6F9] hover:underline cursor-pointer"
                    >
                      Withdraw Full Balance ({formatNaira(wallet?.availableBalance || 0)})
                    </button>
                  </div>

                  <input
                    type="number"
                    min={5000}
                    max={wallet?.availableBalance || 0}
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white font-mono text-base"
                  />
                  <p className="text-[11px] text-[#CCD2D9]/70 mt-1.5">
                    Server clamps withdrawal to verified available balance. Minimum withdrawal: ₦5,000 NGN.
                  </p>
                </div>

                {/* Breakdown Summary */}
                <div className="p-4 rounded-xl bg-[#000000]/40 border border-[#2B7EB5]/10 space-y-2 text-xs">
                  <div className="flex justify-between text-[#CCD2D9]">
                    <span>Requested Amount:</span>
                    <span className="font-semibold text-white font-mono">{formatNaira(requestedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[#CCD2D9]">
                    <span>Nexovira Processing Fee:</span>
                    <span className="font-semibold text-[#08E6F9] font-mono">₦0 NGN (Free)</span>
                  </div>
                  <div className="pt-2 border-t border-[#2B7EB5]/20 flex justify-between font-bold text-white">
                    <span>Net Expected Bank Deposit:</span>
                    <span className="text-[#08E6F9] font-mono text-sm">{formatNaira(requestedAmount)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    isSubmittingPayout ||
                    !hasVerifiedPayoutProfile ||
                    (wallet?.availableBalance || 0) < 5000 ||
                    requestedAmount < 5000 ||
                    requestedAmount > (wallet?.availableBalance || 0)
                  }
                  className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] shadow-lg shadow-[#0682F4]/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingPayout ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      Processing Withdrawal Submission...
                    </>
                  ) : (
                    <>
                      Confirm & Submit Payout Request
                      <ArrowUpRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Payout Account Settings */}
        {activeMode === 'SETTINGS' && (
          <div className="space-y-6">
            {/* Active Bank Account Card */}
            {hasVerifiedPayoutProfile && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#01213D] to-[#000000] border border-[#08E6F9]/40 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-[#0682F4]/20 text-[#08E6F9] shrink-0 mt-1">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#08E6F9]/10 border border-[#08E6F9] text-[#08E6F9] text-[10px] font-bold uppercase tracking-wider mb-2">
                      Verified Bank Profile
                    </span>
                    <div className="text-lg font-bold text-white">
                      {profile?.payoutProfile?.bankName}
                    </div>
                    <div className="text-xs font-mono text-[#CCD2D9] mt-0.5">
                      Account: ******{profile?.payoutProfile?.accountNumber.slice(-4)}
                    </div>
                    <div className="text-xs font-semibold text-white mt-1">
                      Account Holder: {profile?.payoutProfile?.accountName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Form */}
            <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 space-y-6">
              <h2 className="text-lg font-bold text-white border-b border-[#2B7EB5]/20 pb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#08E6F9]" />
                Nigerian Bank Details
              </h2>

              {bankVerificationError && (
                <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#0682F4]/40 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#08E6F9] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#CCD2D9]">{bankVerificationError}</div>
                </div>
              )}

              {profileSuccessMsg && (
                <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#08E6F9]/40 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#08E6F9] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#08E6F9] font-medium">{profileSuccessMsg}</div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                    Select Bank *
                  </label>
                  <select
                    value={selectedBankCode}
                    onChange={(e) => {
                      setSelectedBankCode(e.target.value);
                      setResolvedAccountName('');
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-xs sm:text-sm"
                  >
                    <option value="">-- Choose Commercial or Microfinance Bank --</option>
                    {NIGERIAN_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                    10-Digit NUBAN Account Number *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      maxLength={10}
                      value={accountNumber}
                      onChange={(e) => {
                        setAccountNumber(e.target.value.replace(/\D/g, ''));
                        setResolvedAccountName('');
                      }}
                      placeholder="e.g. 0123456789"
                      className="flex-1 px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white font-mono text-sm tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyBank}
                      disabled={isVerifyingBank || !selectedBankCode || accountNumber.length !== 10}
                      className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-[#0682F4] hover:bg-[#05A9F7] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                      {isVerifyingBank ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Resolving Account...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Verify Account
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Resolved Account Name Field */}
                {resolvedAccountName && (
                  <div className="p-4 rounded-xl bg-[#000000]/60 border border-[#08E6F9]/30">
                    <div className="text-[11px] font-semibold text-[#08E6F9] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      Verified Account Name
                    </div>
                    <div className="text-base font-extrabold text-white">
                      {resolvedAccountName}
                    </div>
                    <p className="text-[11px] text-[#CCD2D9]/70 mt-1">
                      Account identity confirmed directly with the financial institution.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile || !resolvedAccountName}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] shadow-lg shadow-[#0682F4]/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingProfile ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Saving Verified Details...
                    </>
                  ) : (
                    <>
                      Save Payout Account
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
