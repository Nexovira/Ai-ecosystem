export type WalletType =
  | 'AFFILIATE_EARNINGS'
  | 'SELLER_EARNINGS'
  | 'CREATOR_EARNINGS'
  | 'PLATFORM_ACCOUNT'
  | 'OTHER_AUTHORIZED_BUSINESS_ACCOUNT';

export type WalletStatus = 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'CLOSED';

export interface Wallet {
  id: string;
  walletId: string;
  ownerId: string;
  ownerType: 'USER' | 'SELLER' | 'CREATOR' | 'AFFILIATE' | 'PLATFORM';
  ownerName: string;
  walletType: WalletType;
  currency: string; // 'NGN'
  status: WalletStatus;
  pendingBalance: number; // in NGN
  availableBalance: number; // in NGN
  heldBalance: number; // in NGN
  lifetimeCredited: number;
  lifetimeDebited: number;
  createdAt: string;
  updatedAt: string;
}

export type LedgerEntryType =
  | 'CREDIT'
  | 'DEBIT'
  | 'HOLD'
  | 'RELEASE'
  | 'REVERSAL'
  | 'ADJUSTMENT'
  | 'PAYOUT';

export type LedgerEntryDirection = 'CREDIT' | 'DEBIT';

export type LedgerEntryStatus = 'POSTED' | 'PENDING' | 'REVERSED';

export type LedgerSourceType =
  | 'COMMISSION'
  | 'ORDER_SALE'
  | 'DIGITAL_SALE'
  | 'PAYOUT_REQUEST'
  | 'PAYOUT_COMPLETED'
  | 'PAYOUT_FAILED'
  | 'PAYOUT_CANCELLED'
  | 'REFUND_ADJUSTMENT'
  | 'MANAGEMENT_ADJUSTMENT'
  | 'HOLD_RESERVATION'
  | 'HOLD_RELEASE';

export interface LedgerBalanceSnapshot {
  pending: number;
  available: number;
  held: number;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  transactionId: string; // Unique reference e.g. TX-2026-XXXX
  entryType: LedgerEntryType;
  direction: LedgerEntryDirection;
  amount: number; // Always positive magnitude
  currency: string;
  status: LedgerEntryStatus;
  idempotencyKey: string;
  sourceType: LedgerSourceType;
  sourceReferenceId: string; // Order, payout, commission, or refund ID
  description: string;
  actorId: string;
  balanceAfter: LedgerBalanceSnapshot;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type PayoutStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'CANCELLED';

export interface PayoutDestination {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  recipientCode?: string;
}

export interface WalletPayoutRequest {
  id: string;
  payoutId: string;
  walletId: string;
  beneficiaryUserId: string;
  beneficiaryName: string;
  walletType: WalletType;
  amount: number;
  currency: string;
  destination: PayoutDestination;
  provider: 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER';
  status: PayoutStatus;
  internalReference: string;
  providerReference?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
  rejectionReason?: string;
  ledgerEntryId?: string;
}

export interface WalletHold {
  id: string;
  holdId: string;
  walletId: string;
  amount: number;
  currency: string;
  reason: string;
  placedBy: string; // Staff ID or SYSTEM
  placedAt: string;
  status: 'ACTIVE' | 'RELEASED' | 'FORFEITED';
  releasedAt?: string;
  releasedBy?: string;
}

export interface WalletReconciliationResult {
  walletId: string;
  ownerId: string;
  walletType: WalletType;
  currency: string;
  recordedAvailable: number;
  calculatedAvailable: number;
  recordedPending: number;
  calculatedPending: number;
  recordedHeld: number;
  calculatedHeld: number;
  isConsistent: boolean;
  discrepancy: number;
  totalLedgerEntries: number;
  unresolvedPayoutsCount: number;
  lastCheckedAt: string;
}

export interface WalletAdjustmentParams {
  walletId: string;
  direction: 'CREDIT' | 'DEBIT';
  balanceCategory: 'AVAILABLE' | 'PENDING' | 'HELD';
  amount: number;
  reason: string;
  actorId: string;
  idempotencyKey?: string;
}
