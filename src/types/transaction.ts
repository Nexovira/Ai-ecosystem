/**
 * Phase 16: Unified Financial Transactions, Accounting Journal & Reconciliation Foundation
 *
 * Provides a unified transaction data contract connecting orders, payments, refunds,
 * commissions, wallet ledger movements, and double-entry accounting journal entries.
 */

export type TransactionType =
  | 'ORDER_PAYMENT'
  | 'SALE'
  | 'COMMISSION'
  | 'PLATFORM_FEE'
  | 'REFUND'
  | 'REVERSAL'
  | 'WALLET_CREDIT'
  | 'WALLET_DEBIT'
  | 'PAYOUT'
  | 'SETTLEMENT'
  | 'HOLD'
  | 'RELEASE'
  | 'ADJUSTMENT';

export type TransactionSourceSystem =
  | 'COMMERCE_MARKETPLACE'
  | 'COMMERCE_DIGITAL'
  | 'ACADEMY'
  | 'TECH_SERVICES'
  | 'AFFILIATE_SYSTEM'
  | 'WALLET_LEDGER'
  | 'PAYMENT_GATEWAY'
  | 'MANAGEMENT_CONSOLE';

export type TransactionSourceEntityType =
  | 'ORDER'
  | 'ORDER_ITEM'
  | 'PAYMENT'
  | 'REFUND'
  | 'COMMISSION'
  | 'WALLET_ENTRY'
  | 'PAYOUT'
  | 'HOLD'
  | 'SCHOLARSHIP'
  | 'SERVICE_REQUEST';

export type TransactionStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'POSTED'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export interface UnifiedTransaction {
  id: string; // Document ID / Primary Key
  transactionId: string; // Unique internal reference: UTX-YYYYMMDD-XXXXXX
  transactionReference: string; // Human-readable or provider-linked ref
  transactionType: TransactionType;
  sourceSystem: TransactionSourceSystem;
  sourceEntityType: TransactionSourceEntityType;
  sourceEntityId: string;

  // Relational references across ecosystem
  orderId?: string;
  orderReference?: string;
  orderItemId?: string;
  paymentId?: string;
  paymentReference?: string;
  refundId?: string;
  commissionId?: string;
  walletId?: string;
  walletLedgerEntryId?: string;
  payoutId?: string;

  // Ecosystem Stakeholders
  customerId?: string;
  sellerId?: string;
  creatorId?: string;
  affiliateId?: string;
  beneficiaryId?: string;
  initiatorActorId: string;

  // Monetary properties (Strict minor currency / 2-decimal rounded NGN precision)
  amount: number;
  currency: string; // Default: 'NGN'
  status: TransactionStatus;

  // Payment provider metadata
  paymentProvider?: 'PAYSTACK' | 'FLUTTERWAVE' | 'MONIEPOINT' | 'BANK_TRANSFER' | 'INTERNAL_WALLET';
  providerTransactionReference?: string;
  idempotencyKey: string;

  // Journal link
  journalEntryId?: string;

  // Failure or Reversal Audit
  failureReason?: string;
  reversalReason?: string;
  reversalOfTransactionId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  postedAt?: string;
  completedAt?: string;

  // Non-sensitive audit metadata
  metadata?: Record<string, unknown>;
}

// ==========================================
// Double-Entry Accounting Journal Foundation
// ==========================================

export type AccountCategory =
  | 'ASSET_CASH_GATEWAY' // Cash held by Paystack/Flutterwave/Escrow
  | 'ASSET_CASH_BANK' // Real bank operating accounts
  | 'LIABILITY_CUSTOMER_PREPAYMENT' // Unfulfilled order customer payments
  | 'LIABILITY_WALLET_AVAILABLE' // Real available funds owed to creators/merchants/affiliates
  | 'LIABILITY_WALLET_PENDING' // Pending earnings subject to review/holding period
  | 'LIABILITY_WALLET_HELD' // Regulatory / risk / dispute holds
  | 'LIABILITY_PAYOUT_RESERVED' // Balance reserved during withdrawal processing
  | 'REVENUE_MARKETPLACE_COMMISSION' // 10% Platform fee earned on completed orders
  | 'REVENUE_DIGITAL_COMMISSION' // Platform fee on digital sales
  | 'REVENUE_ACADEMY' // Academy course and enrollment revenue
  | 'EXPENSE_GATEWAY_FEES' // 1.5% Payment gateway processing fees
  | 'EXPENSE_REFUND_LOSS'; // Non-recoverable processing losses on refunds

export interface JournalLine {
  accountId: AccountCategory;
  accountName: string;
  debit: number; // Always >= 0, minor units / rounded
  credit: number; // Always >= 0, minor units / rounded
  currency: string;
  description?: string;
  relatedEntityId?: string;
}

export type JournalPostingStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'FAILED';

export interface JournalEntry {
  id: string; // Document ID / Key: JRN-YYYYMMDD-XXXXXX
  journalEntryId: string;
  journalReference: string; // Readable voucher e.g. JRN-2026-0001
  sourceTransactionId: string;
  sourceTransactionType: TransactionType;
  sourceSystem: TransactionSourceSystem;
  description: string;
  currency: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean; // Must strictly satisfy totalDebit === totalCredit
  status: JournalPostingStatus;
  reversalOfJournalId?: string;
  postedAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

// ==========================================
// Comprehensive Financial Reconciliation
// ==========================================

export type ReconciliationDiscrepancyType =
  | 'PAYMENT_AMOUNT_MISMATCH'
  | 'PAYMENT_STATUS_MISMATCH'
  | 'ORPHAN_PAYMENT_RECORD'
  | 'UNPOSTED_ORDER_TRANSACTION'
  | 'UNBALANCED_JOURNAL_ENTRY'
  | 'WALLET_LEDGER_MISMATCH'
  | 'UNRESOLVED_PAYOUT'
  | 'DUPLICATE_IDEMPOTENCY_POSTING'
  | 'COMMISSION_WITHOUT_ORDER';

export interface ReconciliationDiscrepancy {
  discrepancyId: string;
  type: ReconciliationDiscrepancyType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceEntity: string;
  sourceEntityId: string;
  expectedValue: string | number;
  actualValue: string | number;
  description: string;
  discoveredAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface EcosystemReconciliationReport {
  reportId: string;
  generatedAt: string;
  generatedBy: string;
  periodStart?: string;
  periodEnd?: string;
  currency: string;

  // Counts & Totals
  totalOrdersAnalyzed: number;
  totalPaymentsAnalyzed: number;
  totalTransactionsRecorded: number;
  totalJournalEntries: number;
  unbalancedJournalsCount: number;

  totalGatewayVerifiedVolume: number;
  totalInternalRecordedVolume: number;
  volumeDiscrepancy: number;

  totalWalletBalances: {
    available: number;
    pending: number;
    held: number;
  };
  totalWalletLedgerNetVolume: number;
  walletDiscrepancy: number;

  payoutsPendingSettlement: number;
  payoutsPendingVolume: number;

  discrepancies: ReconciliationDiscrepancy[];
  status: 'CLEAN' | 'WARNINGS_FOUND' | 'DISCREPANCIES_DETECTED';
}

// ==========================================
// Refund Processing Request & Execution
// ==========================================

export interface RefundExecutionRequest {
  orderId: string;
  refundAmount?: number; // Optional partial amount; defaults to full remaining refundable
  reason: string;
  actorId: string;
  actorRole: string;
  idempotencyKey?: string;
}

export interface RefundExecutionResult {
  success: boolean;
  refundId: string;
  orderId: string;
  orderReference: string;
  originalAmount: number;
  refundedAmount: number;
  cumulativeRefunded: number;
  remainingRefundable: number;
  isPartial: boolean;
  orderPaymentStatus: 'REFUNDED' | 'PARTIALLY_REFUNDED';
  reversalTransactions: string[]; // List of transactionIds generated
  reversalJournalId?: string;
  error?: string;
}
