export type AffiliateStatus =
  | 'NOT_APPLIED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type OfferType =
  | 'MARKETPLACE_PRODUCT'
  | 'ACADEMY_COURSE'
  | 'DIGITAL_PRODUCT'
  | 'PLATFORM';

export type CommissionType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type CommissionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'AVAILABLE'
  | 'REJECTED'
  | 'REVERSED'
  | 'PAID';

export type PayoutStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface AffiliateApplication {
  applicationId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  promotionChannels: string[];
  platformLinks?: string;
  audienceDescription: string;
  promotionalExperience: string;
  preferredCategories: string[];
  additionalInfo?: string;
  status: AffiliateStatus;
  reviewedBy?: string;
  reviewedDate?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateProfile {
  affiliateId: string;
  userId: string;
  affiliateCode: string; // e.g. "NEX-AFF-74921" or custom slug
  fullName: string;
  email: string;
  phone: string;
  status: AffiliateStatus;
  defaultCommissionRate?: number; // e.g. 10 for 10%
  promotionChannels: string[];
  audienceDescription?: string;
  payoutProfile?: PayoutProfile;
  totalClicks: number;
  totalConversions: number;
  createdAt: string;
  updatedAt: string;
}

export interface EligibleOffer {
  offerId: string;
  offerType: OfferType;
  targetId: string; // productId or courseId
  targetTitle: string;
  targetSlug: string;
  targetImage?: string;
  targetCategory?: string;
  targetPrice: number; // in NGN
  commissionEnabled: boolean;
  commissionType: CommissionType;
  commissionValue: number; // e.g. 10 for 10% or 1000 for ₦1,000 NGN
  currency: string;
  minPayoutConditions?: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralClickEvent {
  referralId: string;
  affiliateId: string;
  affiliateCode: string;
  destination: string;
  offerId?: string;
  ipHash?: string;
  userAgent?: string;
  timestamp: string;
  converted: boolean;
  conversionSourceId?: string;
  conversionAmount?: number;
}

export interface CommissionRecord {
  commissionId: string;
  affiliateId: string;
  affiliateCode: string;
  referralId?: string;
  sourceType: OfferType;
  sourceId: string; // orderId or applicationId
  orderReference: string; // e.g. "NEX-ORD-..." or "NEX-SCH-..."
  customerUserId: string;
  grossTransactionAmount: number;
  commissionType: CommissionType;
  commissionRate: number;
  commissionAmount: number;
  currency: string;
  status: CommissionStatus;
  createdAt: string;
  availableDate?: string;
  paidDate?: string;
  reversalReason?: string;
  internalNotes?: string;
}

export interface AffiliateWallet {
  affiliateId: string;
  currency: string;
  pendingBalance: number;
  availableBalance: number;
  paidBalance: number;
  reversedBalance: number;
  totalEarned: number;
  minimumPayoutAmount: number; // e.g. ₦5,000 NGN
  lastCalculatedAt: string;
}

export interface PayoutProfile {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  recipientCode?: string;
  isVerified: boolean;
  verifiedAt?: string;
}

export interface PayoutRequest {
  payoutId: string;
  affiliateId: string;
  affiliateCode: string;
  amount: number;
  currency: string;
  payoutMethod: 'BANK_TRANSFER';
  accountDetails: {
    bankName: string;
    bankCode: string;
    accountNumberMasked: string;
    accountName: string;
  };
  status: PayoutStatus;
  provider: 'PAYSTACK' | 'MANUAL';
  providerReference?: string;
  requestedDate: string;
  processedDate?: string;
  completedDate?: string;
  failureReason?: string;
  internalNotes?: string;
}

export interface ReferralLinkResult {
  affiliateCode: string;
  destinationUrl: string;
  shareableUrl: string;
  offerTitle: string;
}
