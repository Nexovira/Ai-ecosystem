import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  AffiliateStatus,
  AffiliateProfile,
  AffiliateApplication,
  AffiliateWallet,
  EligibleOffer,
  PayoutProfile,
  PayoutRequest,
  CommissionRecord,
  PaystackBank,
} from '../types/affiliate';

interface AffiliateContextType {
  affiliateStatus: AffiliateStatus;
  profile: AffiliateProfile | null;
  application: AffiliateApplication | null;
  wallet: AffiliateWallet | null;
  offers: EligibleOffer[];
  referralCode: string | null;
  isLoading: boolean;
  error: string | null;
  applyForProgram: (data: {
    fullName: string;
    email: string;
    phone: string;
    promotionChannels: string[];
    platformLinks?: string;
    audienceDescription: string;
    promotionalExperience: string;
    preferredCategories: string[];
    additionalInfo?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  generateReferralLink: (offerId?: string) => Promise<{
    success: boolean;
    shareableUrl?: string;
    offerTitle?: string;
    error?: string;
  }>;
  fetchBankList: (country?: string) => Promise<{
    success: boolean;
    banks: PaystackBank[];
    isLive: boolean;
    error?: string;
  }>;
  verifyBankDetails: (accountNumber: string, bankCode: string) => Promise<{
    success: boolean;
    accountName?: string;
    accountNumber?: string;
    isLive?: boolean;
    error?: string;
  }>;
  savePayoutProfile: (data: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }) => Promise<{ success: boolean; error?: string }>;
  requestPayoutWithdrawal: (amount?: number) => Promise<{ success: boolean; error?: string }>;
  refreshAffiliateState: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  refreshOffers: () => Promise<void>;
}

const AffiliateContext = createContext<AffiliateContextType | undefined>(undefined);

export const AffiliateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [affiliateStatus, setAffiliateStatus] = useState<AffiliateStatus>('NOT_APPLIED');
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [application, setApplication] = useState<AffiliateApplication | null>(null);
  const [wallet, setWallet] = useState<AffiliateWallet | null>(null);
  const [offers, setOffers] = useState<EligibleOffer[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Capture referral code from URL query param `?ref=...` and persist in cookie & sessionStorage
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref');
      if (refParam) {
        const cleanRef = refParam.trim().toUpperCase();
        setReferralCode(cleanRef);
        sessionStorage.setItem('nexovira_aff_ref', cleanRef);
        document.cookie = `nexovira_aff_ref=${cleanRef}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;

        // Ping track-click
        fetch('/api/affiliates/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            affiliateCode: cleanRef,
            destinationSlug: window.location.pathname.replace(/^\//, ''),
          }),
        }).catch(() => {
          // Non-blocking
        });
      } else {
        const stored = sessionStorage.getItem('nexovira_aff_ref');
        if (stored) {
          setReferralCode(stored);
        } else {
          // Read from cookie
          const match = document.cookie.match(/(^|;\s*)nexovira_aff_ref=([^;]*)/);
          if (match) {
            setReferralCode(decodeURIComponent(match[2]));
          }
        }
      }
    } catch (e) {
      console.warn('Error reading referral attribution:', e);
    }
  }, []);

  // 2. Fetch current user's affiliate status
  const fetchStatus = useCallback(async () => {
    if (!user) {
      setAffiliateStatus('NOT_APPLIED');
      setProfile(null);
      setApplication(null);
      setWallet(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/affiliates/me/status?userId=${encodeURIComponent(user.uid)}`, {
        headers: {
          'x-user-id': user.uid,
          'x-user-email': user.email || '',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch affiliate status');
      }

      const data = await res.json();
      setAffiliateStatus(data.status || 'NOT_APPLIED');
      setProfile(data.profile || null);
      setApplication(data.application || null);

      if (data.status === 'APPROVED') {
        // Fetch wallet
        const wRes = await fetch(`/api/affiliates/me/wallet?userId=${encodeURIComponent(user.uid)}`, {
          headers: {
            'x-user-id': user.uid,
            'x-user-email': user.email || '',
          },
        });
        if (wRes.ok) {
          const wData = await wRes.json();
          setWallet(wData.wallet || null);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching affiliate details';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 3. Fetch eligible offers
  const fetchOffers = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliates/me/offers');
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers || []);
      }
    } catch (err) {
      console.warn('Error fetching affiliate offers:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchOffers();
  }, [fetchStatus, fetchOffers]);

  // Reliable polling when application is pending review so approval immediately reflects
  useEffect(() => {
    if (affiliateStatus === 'PENDING_REVIEW' && user) {
      const interval = setInterval(() => {
        fetchStatus();
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [affiliateStatus, user, fetchStatus]);

  // 4. Submit application
  const applyForProgram = async (data: {
    fullName: string;
    email: string;
    phone: string;
    promotionChannels: string[];
    platformLinks?: string;
    audienceDescription: string;
    promotionalExperience: string;
    preferredCategories: string[];
    additionalInfo?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be signed in to apply.' };
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/affiliates/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          userId: user.uid,
          ...data,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        const err = resData.error || 'Failed to submit application.';
        setError(err);
        return { success: false, error: err };
      }

      setAffiliateStatus('PENDING_REVIEW');
      setApplication(resData.application);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Application submission error';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Generate referral link
  const generateReferralLink = async (
    offerId?: string
  ): Promise<{ success: boolean; shareableUrl?: string; offerTitle?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const canonicalOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch('/api/affiliates/me/links/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          offerId,
          originUrl: canonicalOrigin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to generate referral link' };
      }

      return {
        success: true,
        shareableUrl: data.shareableUrl,
        offerTitle: data.offerTitle,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating link';
      return { success: false, error: msg };
    }
  };

  // 6. Fetch Bank List (Paystack)
  const fetchBankList = async (
    country: string = 'nigeria'
  ): Promise<{ success: boolean; banks: PaystackBank[]; isLive: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/affiliates/payout/banks?country=${encodeURIComponent(country)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, banks: [], isLive: false, error: data.error || 'Failed to retrieve banks' };
      }
      return {
        success: true,
        banks: data.banks || [],
        isLive: Boolean(data.isLive),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching banks';
      return { success: false, banks: [], isLive: false, error: msg };
    }
  };

  // 7. Verify Bank Details (Paystack Account Resolution)
  const verifyBankDetails = async (
    accountNumber: string,
    bankCode: string
  ): Promise<{
    success: boolean;
    accountName?: string;
    accountNumber?: string;
    isLive?: boolean;
    error?: string;
  }> => {
    try {
      const res = await fetch('/api/affiliates/payout/verify-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
        },
        body: JSON.stringify({ accountNumber, bankCode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Bank account verification failed.' };
      }

      return {
        success: true,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        isLive: data.isLive,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification request failed';
      return { success: false, error: msg };
    }
  };

  // 7. Save Payout Profile
  const savePayoutProfile = async (data: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const res = await fetch('/api/affiliates/me/payout-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-email': user.email || '',
        },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Failed to save payout profile.' };
      }

      if (resData.profile) {
        setProfile(resData.profile);
      }
      await fetchStatus();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving payout profile';
      return { success: false, error: msg };
    }
  };

  // 8. Request Payout Withdrawal
  const requestPayoutWithdrawal = async (
    amount?: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const res = await fetch('/api/affiliates/me/payout/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Payout request failed.' };
      }

      await fetchStatus();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payout request error';
      return { success: false, error: msg };
    }
  };

  return (
    <AffiliateContext.Provider
      value={{
        affiliateStatus,
        profile,
        application,
        wallet,
        offers,
        referralCode,
        isLoading,
        error,
        applyForProgram,
        generateReferralLink,
        fetchBankList,
        verifyBankDetails,
        savePayoutProfile,
        requestPayoutWithdrawal,
        refreshAffiliateState: fetchStatus,
        refreshWallet: fetchStatus,
        refreshOffers: fetchOffers,
      }}
    >
      {children}
    </AffiliateContext.Provider>
  );
};

export const useAffiliate = (): AffiliateContextType => {
  const context = useContext(AffiliateContext);
  if (!context) {
    throw new Error('useAffiliate must be used within an AffiliateProvider');
  }
  return context;
};
