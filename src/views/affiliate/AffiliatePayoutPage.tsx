import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  Check,
  ChevronDown,
} from 'lucide-react';
import { PaystackBank } from '../../types/affiliate';
import { AffiliateOnboardingChecklist } from '../../components/affiliate/AffiliateOnboardingChecklist';

export const AffiliatePayoutPage: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { user } = useAuth();
  const {
    affiliateStatus,
    profile,
    application,
    wallet,
    fetchBankList,
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

  // Banks list from Paystack
  const [banks, setBanks] = useState<PaystackBank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(true);
  const [bankListError, setBankListError] = useState<string | null>(null);
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState<boolean>(false);

  // Form states for Settings
  const [selectedBankCode, setSelectedBankCode] = useState(profile?.payoutProfile?.bankCode || '');
  const [selectedBankName, setSelectedBankName] = useState(profile?.payoutProfile?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(profile?.payoutProfile?.accountNumber || '');
  const [resolvedAccountName, setResolvedAccountName] = useState(
    profile?.payoutProfile?.accountName || ''
  );
  const [isAccountNameConfirmed, setIsAccountNameConfirmed] = useState<boolean>(
    Boolean(profile?.payoutProfile?.isVerified)
  );
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [bankVerificationError, setBankVerificationError] = useState<string | null>(null);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [isLivePaystack, setIsLivePaystack] = useState<boolean | undefined>(undefined);

  // Form states for Payout Request
  const [requestedAmount, setRequestedAmount] = useState<number>(wallet?.availableBalance || 0);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Load banks list from backend/Paystack
  const loadBanks = async () => {
    try {
      setIsLoadingBanks(true);
      setBankListError(null);
      const res = await fetchBankList('nigeria');
      if (res.success && res.banks.length > 0) {
        setBanks(res.banks);
        setIsLivePaystack(res.isLive);
      } else {
        setBankListError(res.error || 'Failed to load official bank list.');
      }
    } catch (err: unknown) {
      setBankListError((err as Error).message || 'Unable to retrieve banks.');
    } finally {
      setIsLoadingBanks(false);
    }
  };

  useEffect(() => {
    loadBanks();
  }, []);

  useEffect(() => {
    if (wallet) {
      setRequestedAmount(wallet.availableBalance);
    }
  }, [wallet]);

  useEffect(() => {
    if (profile?.payoutProfile) {
      setSelectedBankCode(profile.payoutProfile.bankCode);
      setSelectedBankName(profile.payoutProfile.bankName);
      setAccountNumber(profile.payoutProfile.accountNumber);
      setResolvedAccountName(profile.payoutProfile.accountName);
      setIsAccountNameConfirmed(Boolean(profile.payoutProfile.isVerified));
    }
  }, [profile]);

  // Filtered banks for searchable dropdown (guaranteed deduplication by bank code)
  const filteredBanks = useMemo(() => {
    const q = bankSearchQuery.toLowerCase().trim();
    const list = q
      ? banks.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.code.includes(q) ||
            (b.slug && b.slug.toLowerCase().includes(q))
        )
      : banks;

    const seen = new Set<string>();
    return list.filter((b) => {
      const code = (b.code || '').trim();
      if (!code || seen.has(code)) return false;
      seen.add(code);
      return true;
    });
  }, [banks, bankSearchQuery]);

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

  // Handle bank account resolution
  const handleVerifyBank = async () => {
    setBankVerificationError(null);
    setProfileSuccessMsg(null);
    setResolvedAccountName('');
    setIsAccountNameConfirmed(false);

    if (!selectedBankCode) {
      setBankVerificationError('Please select your commercial or microfinance bank from the list.');
      return;
    }

    if (!/^\d{10}$/.test(accountNumber.trim())) {
      setBankVerificationError('NUBAN account number must be exactly 10 digits.');
      return;
    }

    setIsVerifyingBank(true);
    const result = await verifyBankDetails(accountNumber.trim(), selectedBankCode);
    setIsVerifyingBank(false);

    if (result.success && result.accountName) {
      setResolvedAccountName(result.accountName);
      if (result.isLive !== undefined) {
        setIsLivePaystack(result.isLive);
      }
    } else {
      setBankVerificationError(
        result.error ||
          'Could not resolve bank account details. Please verify your 10-digit account number and selected bank.'
      );
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

    if (!isAccountNameConfirmed) {
      setBankVerificationError('Please confirm that the displayed account name belongs to you before saving.');
      return;
    }

    const currentBank = banks.find((b) => b.code === selectedBankCode);
    const bankName = currentBank?.name || selectedBankName || 'Commercial Bank';

    setIsSavingProfile(true);
    const result = await savePayoutProfile({
      bankName,
      bankCode: selectedBankCode,
      accountNumber: accountNumber.trim(),
      accountName: resolvedAccountName,
    });
    setIsSavingProfile(false);

    if (result.success) {
      setProfileSuccessMsg('Payout account successfully verified and saved! Your affiliate promotion dashboard is now unlocked.');
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
              Paystack Bank Settlement
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Affiliate Payout Settings</h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">
              Configure your verified Nigerian bank destination to activate your promotional links and receive commission settlements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasVerifiedPayoutProfile && (
              <button
                onClick={() => navigate('/affiliate/dashboard')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Affiliate Dashboard
              </button>
            )}
            <button
              onClick={() => navigate('/affiliate/wallet')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer"
            >
              Wallet
            </button>
          </div>
        </div>

        {/* Onboarding Checklist Summary (If payout profile is not verified yet) */}
        {!hasVerifiedPayoutProfile && (
          <AffiliateOnboardingChecklist showActions={false} />
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#2B7EB5]/20 pb-2">
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
            Bank Payout Details
          </button>
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
        </div>

        {/* Mode 1: Bank Settings */}
        {activeMode === 'SETTINGS' && (
          <div className="space-y-6">
            {/* Active Verified Card */}
            {hasVerifiedPayoutProfile && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#01213D] to-[#000000] border border-[#08E6F9]/40 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-[#0682F4]/20 text-[#08E6F9] shrink-0 mt-1">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#08E6F9]/10 border border-[#08E6F9] text-[#08E6F9] text-[10px] font-bold uppercase tracking-wider mb-2">
                      Verified & Active Destination
                    </span>
                    <div className="text-lg font-bold text-white">
                      {profile?.payoutProfile?.bankName}
                    </div>
                    <div className="text-xs font-mono text-[#CCD2D9] mt-0.5">
                      Account: {profile?.payoutProfile?.accountNumberMasked || `******${profile?.payoutProfile?.accountNumber?.slice(-4)}`} (Code: {profile?.payoutProfile?.bankCode})
                    </div>
                    <div className="text-xs font-semibold text-[#08E6F9] mt-1">
                      Account Name: {profile?.payoutProfile?.accountName}
                    </div>
                    {profile?.payoutProfile?.verifiedAt && (
                      <div className="text-[10px] text-[#CCD2D9]/60 mt-1">
                        Verified at: {new Date(profile.payoutProfile.verifiedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/affiliate/dashboard')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bank Settings Form */}
            <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 space-y-6">
              <div className="flex items-center justify-between border-b border-[#2B7EB5]/20 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#08E6F9]" />
                  Paystack Verified Bank Details
                </h2>
                <span className="text-[11px] text-[#CCD2D9] bg-[#000000]/60 px-3 py-1 rounded-full border border-[#2B7EB5]/20">
                  Country: <strong>Nigeria (NGN)</strong>
                </span>
              </div>

              {bankVerificationError && (
                <div className="p-4 rounded-xl bg-[#01213D]/80 border border-[#0682F4]/50 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#08E6F9] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#CCD2D9]">{bankVerificationError}</div>
                </div>
              )}

              {profileSuccessMsg && (
                <div className="p-5 rounded-xl bg-[#01213D]/80 border border-[#08E6F9]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#08E6F9] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-white">Payout Account Activated</div>
                      <div className="text-xs text-[#08E6F9] mt-0.5">{profileSuccessMsg}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/affiliate/dashboard')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    Open Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-5">
                {/* Searchable Bank Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                    1. Select Bank (from official Paystack directory) *
                  </label>

                  {isLoadingBanks ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-xs text-[#CCD2D9]">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#08E6F9]" />
                      Loading official Paystack bank directory...
                    </div>
                  ) : bankListError ? (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-xs text-[#CCD2D9]">
                        {bankListError}
                      </div>
                      <button
                        type="button"
                        onClick={loadBanks}
                        className="text-xs text-[#08E6F9] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry loading banks
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Dropdown trigger button */}
                      <button
                        type="button"
                        onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                        className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-xs sm:text-sm flex items-center justify-between text-left cursor-pointer"
                      >
                        <span className={selectedBankName ? 'text-white font-medium' : 'text-[#CCD2D9]/60'}>
                          {selectedBankName ? `${selectedBankName} (${selectedBankCode})` : '-- Select your bank --'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-[#CCD2D9]" />
                      </button>

                      {/* Dropdown menu */}
                      {isBankDropdownOpen && (
                        <div className="absolute z-30 mt-2 w-full rounded-2xl bg-[#01213D] border border-[#0682F4]/50 shadow-2xl p-3 space-y-2 max-h-72 flex flex-col">
                          {/* Search box inside dropdown */}
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#CCD2D9]" />
                            <input
                              type="text"
                              value={bankSearchQuery}
                              onChange={(e) => setBankSearchQuery(e.target.value)}
                              placeholder="Type to filter banks (e.g. GTB, Access, Kuda, Moniepoint)..."
                              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-xs"
                              autoFocus
                            />
                          </div>

                          {/* List of banks */}
                          <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                            {filteredBanks.length === 0 ? (
                              <div className="p-4 text-center text-xs text-[#CCD2D9]/60">
                                No banks match "{bankSearchQuery}"
                              </div>
                            ) : (
                              filteredBanks.map((b, idx) => (
                                <button
                                  type="button"
                                  key={`bank-opt-${b.code}-${idx}`}
                                  onClick={() => {
                                    setSelectedBankCode(b.code);
                                    setSelectedBankName(b.name);
                                    setResolvedAccountName('');
                                    setIsAccountNameConfirmed(false);
                                    setIsBankDropdownOpen(false);
                                    setBankSearchQuery('');
                                  }}
                                  className={`w-full px-3 py-2 rounded-lg text-left text-xs transition cursor-pointer flex items-center justify-between ${
                                    selectedBankCode === b.code
                                      ? 'bg-[#0682F4] text-white font-bold'
                                      : 'text-[#CCD2D9] hover:bg-[#000000] hover:text-white'
                                  }`}
                                >
                                  <span>{b.name}</span>
                                  <span className="font-mono text-[11px] opacity-70">Code: {b.code}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 10-Digit NUBAN Account Number */}
                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                    2. 10-Digit NUBAN Account Number *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      maxLength={10}
                      value={accountNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setAccountNumber(val);
                        setResolvedAccountName('');
                        setIsAccountNameConfirmed(false);
                      }}
                      placeholder="e.g. 0123456789"
                      className="flex-1 px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white font-mono text-base tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyBank}
                      disabled={isVerifyingBank || !selectedBankCode || accountNumber.trim().length !== 10}
                      className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-[#0682F4] hover:bg-[#05A9F7] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-md shadow-[#0682F4]/20"
                    >
                      {isVerifyingBank ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Resolving with Paystack...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Verify Account
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#CCD2D9]/70 mt-1.5">
                    Click <strong>Verify Account</strong> to resolve the registered account holder name through the official Paystack verification endpoint.
                  </p>
                </div>

                {/* Read-Only Verified Account Name Display */}
                {resolvedAccountName && (
                  <div className="p-5 rounded-xl bg-[#000000]/70 border border-[#08E6F9]/50 space-y-3">
                    <div>
                      <div className="text-[11px] font-semibold text-[#08E6F9] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Server-Resolved Account Name (Paystack Verified)
                      </div>
                      <div className="text-lg font-extrabold text-white font-mono tracking-wide">
                        {resolvedAccountName}
                      </div>
                      <p className="text-[11px] text-[#CCD2D9]/70 mt-1">
                        Bank: <strong>{selectedBankName || selectedBankCode}</strong> • Account: <strong>{accountNumber}</strong>
                      </p>
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="pt-3 border-t border-[#2B7EB5]/20">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAccountNameConfirmed}
                          onChange={(e) => setIsAccountNameConfirmed(e.target.checked)}
                          className="mt-0.5 rounded border-[#2B7EB5] text-[#0682F4] focus:ring-[#08E6F9]"
                        />
                        <span className="text-xs text-[#CCD2D9] leading-relaxed">
                          I confirm that <strong className="text-white">{resolvedAccountName}</strong> is my authentic bank account destination for commission withdrawals.
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit & Save Button */}
              <div className="pt-4 border-t border-[#2B7EB5]/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="submit"
                  disabled={isSavingProfile || !resolvedAccountName || !isAccountNameConfirmed}
                  className="px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] shadow-lg shadow-[#0682F4]/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 text-sm"
                >
                  {isSavingProfile ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Saving Verified Profile...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save & Activate Payout Profile
                    </>
                  )}
                </button>

                {hasVerifiedPayoutProfile && (
                  <button
                    type="button"
                    onClick={() => navigate('/affiliate/dashboard')}
                    className="px-6 py-3.5 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#000000] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer text-center"
                  >
                    Cancel / Back to Dashboard
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Mode 2: Request Withdrawal */}
        {activeMode === 'REQUEST' && (
          <div className="space-y-6">
            {/* Balance Overview Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#01213D] to-[#000000] border border-[#2B7EB5]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider">
                  Withdrawable Available Balance
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#08E6F9] mt-1">
                  {formatNaira(wallet?.availableBalance || 0)}
                </div>
                <p className="text-xs text-[#CCD2D9] mt-1">
                  Minimum withdrawal threshold: <strong>₦5,000 NGN</strong> • Pending hold: {formatNaira(wallet?.pendingBalance || 0)}
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
                  Your payout request of {formatNaira(requestedAmount)} has been recorded and queued. Funds will disburse to your verified account via Paystack.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/affiliate/wallet')}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition cursor-pointer"
                  >
                    View Wallet Transactions
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
                          {profile?.payoutProfile?.accountNumberMasked || `******${profile?.payoutProfile?.accountNumber?.slice(-4)}`} — {profile?.payoutProfile?.accountName}
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
                      Max Available ({formatNaira(wallet?.availableBalance || 0)})
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
                    Minimum withdrawal threshold: ₦5,000 NGN.
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
      </div>
    </div>
  );
};
