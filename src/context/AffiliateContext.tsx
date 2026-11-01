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
import { db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Robust response parsing that never throws SyntaxError on HTML or plain-text error pages.
 */
async function parseApiResponse<T = any>(res: Response): Promise<ApiResponse<T>> {
  const status = res.status;
  const contentType = res.headers.get('content-type') || '';
  let rawText = '';

  try {
    rawText = await res.text();
  } catch (readErr) {
    return {
      success: false,
      statusCode: status,
      error: `Network error: ${readErr instanceof Error ? readErr.message : 'Failed to read response'}`,
    };
  }

  if (!rawText || !rawText.trim()) {
    return {
      success: res.ok,
      statusCode: status,
      error: res.ok ? undefined : `Server returned empty response (${status}).`,
    };
  }

  // Handle JSON responses safely
  if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(rawText);
      if (!res.ok || parsed.success === false) {
        const errorMsg = parsed.error || parsed.message || `Request failed (${status})`;
        return { success: false, data: parsed, error: errorMsg, statusCode: status };
      }
      return { success: true, data: parsed, statusCode: status };
    } catch {
      // JSON parse failed; fall through to text sanitization
    }
  }

  // Handle HTML error pages (e.g. Vercel server error pages, proxy 500/502/504)
  if (rawText.toLowerCase().includes('<html') || rawText.toLowerCase().includes('<!doctype')) {
    const titleMatch = rawText.match(/<title>([^<]+)<\/title>/i);
    const h1Match = rawText.match(/<h1>([^<]+)<\/h1>/i);
    const hint = titleMatch ? titleMatch[1].trim() : h1Match ? h1Match[1].trim() : `Server Error (${status})`;
    return {
      success: false,
      statusCode: status,
      error: hint,
    };
  }

  // Plain-text responses (e.g. "A server error has occurred" or "Internal Server Error")
  const cleanMsg = rawText.trim().slice(0, 250);
  return {
    success: res.ok,
    statusCode: status,
    error: res.ok ? undefined : cleanMsg || `Request failed (${status})`,
  };
}

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
        }).catch(() => {});
      } else {
        const stored = sessionStorage.getItem('nexovira_aff_ref');
        if (stored) {
          setReferralCode(stored);
        } else {
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

      let statusLoaded = false;

      try {
        const res = await fetch(`/api/affiliates/me/status?userId=${encodeURIComponent(user.uid)}`, {
          headers: {
            'x-user-id': user.uid,
            'x-user-email': user.email || '',
          },
        });

        const parsed = await parseApiResponse(res);
        if (parsed.success && parsed.data) {
          const data = parsed.data;
          setAffiliateStatus(data.status || 'NOT_APPLIED');
          setProfile(data.profile || null);
          setApplication(data.application || null);
          statusLoaded = true;

          if (data.status === 'APPROVED') {
            const wRes = await fetch(`/api/affiliates/me/wallet?userId=${encodeURIComponent(user.uid)}`, {
              headers: {
                'x-user-id': user.uid,
                'x-user-email': user.email || '',
              },
            });
            const wParsed = await parseApiResponse(wRes);
            if (wParsed.success && wParsed.data) {
              setWallet(wParsed.data.wallet || null);
            }
          }
        }
      } catch (apiErr) {
        console.warn('Backend affiliate status API notice:', apiErr);
      }

      // Authoritative direct Firestore fallback across all production domains
      if (!statusLoaded && db) {
        try {
          // Check for approved affiliate profile
          const profSnap = await getDocs(query(collection(db, 'affiliateProfiles'), where('userId', '==', user.uid))).catch(() => null);
          if (profSnap && !profSnap.empty) {
            const prof = profSnap.docs[0].data() as AffiliateProfile;
            setAffiliateStatus('APPROVED');
            setProfile(prof);
          } else {
            // Check for pending/reviewed applications
            const appSnap = await getDocs(query(collection(db, 'affiliateApplications'), where('userId', '==', user.uid))).catch(() => null);
            if (appSnap && !appSnap.empty) {
              const latestApp = appSnap.docs.map(d => d.data() as AffiliateApplication).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];
              setAffiliateStatus(latestApp.status || 'PENDING_REVIEW');
              setApplication(latestApp);
            } else {
              setAffiliateStatus('NOT_APPLIED');
              setProfile(null);
              setApplication(null);
            }
          }
        } catch (fsErr) {
          console.warn('Direct Firestore status query notice:', fsErr);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error retrieving affiliate status';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 3. Fetch eligible offers
  const fetchOffers = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliates/me/offers');
      const parsed = await parseApiResponse(res);
      if (parsed.success && parsed.data?.offers) {
        setOffers(parsed.data.offers);
      } else if (db) {
        // Fallback to Firestore offers
        const snap = await getDocs(collection(db, 'affiliateOffers')).catch(() => null);
        if (snap && !snap.empty) {
          const list = snap.docs.map((d) => d.data() as EligibleOffer);
          setOffers(list.filter((o) => o.status === 'ACTIVE'));
        }
      }
    } catch (err) {
      console.warn('Error fetching affiliate offers:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchOffers();
  }, [fetchStatus, fetchOffers]);

  // Polling when application is pending review
  useEffect(() => {
    if (affiliateStatus === 'PENDING_REVIEW' && user) {
      const interval = setInterval(() => {
        fetchStatus();
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [affiliateStatus, user, fetchStatus]);

  // 4. Submit application with guaranteed Firestore persistence and safe JSON error handling
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

      const applicationId = `aff-app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const applicationRecord: AffiliateApplication = {
        applicationId,
        userId: user.uid,
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        promotionChannels: data.promotionChannels,
        platformLinks: data.platformLinks?.trim() || undefined,
        audienceDescription: data.audienceDescription.trim(),
        promotionalExperience: data.promotionalExperience.trim(),
        preferredCategories: data.preferredCategories,
        additionalInfo: data.additionalInfo?.trim() || undefined,
        status: 'PENDING_REVIEW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let submittedSuccessfully = false;
      let submissionError: string | undefined = undefined;

      // Primary: Dispatch to backend API
      try {
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

        const parsed = await parseApiResponse(res);
        if (parsed.success && parsed.data?.success) {
          submittedSuccessfully = true;
          setAffiliateStatus('PENDING_REVIEW');
          setApplication(parsed.data.application || applicationRecord);
          return { success: true };
        } else {
          submissionError = parsed.error || 'Backend application submission failed';
        }
      } catch (networkErr: unknown) {
        console.warn('Affiliate apply API request error, proceeding to direct Firestore storage:', networkErr);
      }

      // Authoritative direct Firestore fallback: Save application directly if backend is unavailable/errored
      if (!submittedSuccessfully && db) {
        try {
          await setDoc(doc(db, 'affiliateApplications', applicationId), applicationRecord);
          setAffiliateStatus('PENDING_REVIEW');
          setApplication(applicationRecord);
          return { success: true };
        } catch (fsErr: unknown) {
          console.error('Firestore application save error:', fsErr);
          const errText = fsErr instanceof Error ? fsErr.message : 'Database write failed';
          setError(submissionError || errText);
          return { success: false, error: submissionError || errText };
        }
      }

      if (submissionError) {
        setError(submissionError);
        return { success: false, error: submissionError };
      }

      return { success: false, error: 'Could not complete application submission.' };
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

      const parsed = await parseApiResponse(res);
      if (!parsed.success || !parsed.data?.success) {
        return { success: false, error: parsed.error || 'Failed to generate referral link' };
      }

      return {
        success: true,
        shareableUrl: parsed.data.shareableUrl,
        offerTitle: parsed.data.offerTitle,
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
      const parsed = await parseApiResponse(res);
      if (!parsed.success || !parsed.data?.success) {
        return { success: false, banks: [], isLive: false, error: parsed.error || 'Failed to retrieve banks' };
      }
      return {
        success: true,
        banks: parsed.data.banks || [],
        isLive: Boolean(parsed.data.isLive),
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

      const parsed = await parseApiResponse(res);
      if (!parsed.success || !parsed.data?.success) {
        return { success: false, error: parsed.error || 'Bank account verification failed.' };
      }

      return {
        success: true,
        accountName: parsed.data.accountName,
        accountNumber: parsed.data.accountNumber,
        isLive: parsed.data.isLive,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification request failed';
      return { success: false, error: msg };
    }
  };

  // 8. Save Payout Profile
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

      const parsed = await parseApiResponse(res);
      if (!parsed.success || !parsed.data?.success) {
        return { success: false, error: parsed.error || 'Failed to save payout profile.' };
      }

      if (parsed.data.profile) {
        setProfile(parsed.data.profile);
      }
      await fetchStatus();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving payout profile';
      return { success: false, error: msg };
    }
  };

  // 9. Request Payout Withdrawal
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

      const parsed = await parseApiResponse(res);
      if (!parsed.success || !parsed.data?.success) {
        return { success: false, error: parsed.error || 'Payout request failed.' };
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
