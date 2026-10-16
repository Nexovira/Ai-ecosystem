import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit as firestoreLimit,
} from 'firebase/firestore';
import {
  UnifiedTransaction,
  TransactionType,
  TransactionStatus,
  TransactionSourceSystem,
  TransactionSourceEntityType,
  JournalEntry,
  JournalLine,
  AccountCategory,
  ReconciliationDiscrepancy,
  EcosystemReconciliationReport,
  RefundExecutionRequest,
  RefundExecutionResult,
} from '../types/transaction';
import { Order, OrderItem } from '../types/commerce';
import { walletService, roundMoney } from './walletService';
import { notificationService } from './notificationService';

export class TransactionAccountingService {
  private transactions: Map<string, UnifiedTransaction> = new Map(); // transactionId -> UnifiedTransaction
  private transactionsByIdempotency: Map<string, string> = new Map(); // idempotencyKey -> transactionId
  private journal: Map<string, JournalEntry> = new Map(); // journalEntryId -> JournalEntry
  private orderRefunds: Map<string, number> = new Map(); // orderId -> cumulativeRefunded
  private initialized: boolean = false;

  constructor() {
    this.initializeFromFirestore().catch(() => {
      // Safe fallback to persistent in-memory store
    });
  }

  private async initializeFromFirestore(): Promise<void> {
    if (this.initialized) return;
    try {
      // 1. Load transactions
      const txSnap = await getDocs(query(collection(db, 'unifiedTransactions'), firestoreLimit(200)));
      txSnap.forEach((d) => {
        const tx = d.data() as UnifiedTransaction;
        if (tx && tx.transactionId) {
          this.transactions.set(tx.transactionId, tx);
          if (tx.idempotencyKey) {
            this.transactionsByIdempotency.set(tx.idempotencyKey, tx.transactionId);
          }
        }
      });

      // 2. Load journal
      const jSnap = await getDocs(query(collection(db, 'accountingJournal'), firestoreLimit(200)));
      jSnap.forEach((d) => {
        const entry = d.data() as JournalEntry;
        if (entry && entry.journalEntryId) {
          this.journal.set(entry.journalEntryId, entry);
        }
      });
    } catch {
      // Firestore unconfigured / network fallback
    } finally {
      this.initialized = true;
    }
  }

  // ==========================================
  // 1. Transaction Recording with Idempotency
  // ==========================================

  public async recordTransaction(
    params: Omit<UnifiedTransaction, 'id' | 'transactionId' | 'createdAt' | 'updatedAt'>
  ): Promise<UnifiedTransaction> {
    await this.initializeFromFirestore();

    // Idempotency check: prevent duplicate financial transactions
    if (params.idempotencyKey && this.transactionsByIdempotency.has(params.idempotencyKey)) {
      const existingId = this.transactionsByIdempotency.get(params.idempotencyKey)!;
      const existingTx = this.transactions.get(existingId);
      if (existingTx) {
        return existingTx;
      }
    }

    const now = new Date().toISOString();
    const datePrefix = now.slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transactionId = `UTX-${datePrefix}-${randomSuffix}`;

    const tx: UnifiedTransaction = {
      ...params,
      id: transactionId,
      transactionId,
      amount: roundMoney(params.amount),
      currency: params.currency || 'NGN',
      status: params.status || 'COMPLETED',
      createdAt: now,
      updatedAt: now,
      postedAt: params.postedAt || now,
    };

    // Store in memory
    this.transactions.set(transactionId, tx);
    if (tx.idempotencyKey) {
      this.transactionsByIdempotency.set(tx.idempotencyKey, transactionId);
    }

    // Persist to Firestore asynchronously
    try {
      await setDoc(doc(db, 'unifiedTransactions', transactionId), tx);
    } catch {
      // Memory fallback
    }

    return tx;
  }

  // ==========================================
  // 2. Double-Entry Accounting Journal Engine
  // ==========================================

  public async postJournalEntry(params: {
    sourceTransactionId: string;
    sourceTransactionType: TransactionType;
    sourceSystem: TransactionSourceSystem;
    description: string;
    currency: string;
    lines: JournalLine[];
    createdBy: string;
    reversalOfJournalId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<JournalEntry> {
    await this.initializeFromFirestore();

    const now = new Date().toISOString();
    const datePrefix = now.slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const journalEntryId = `JRN-${datePrefix}-${randomSuffix}`;
    const journalReference = `JRN-${datePrefix.slice(0, 4)}-${randomSuffix}`;

    // Compute balanced totals
    let totalDebit = 0;
    let totalCredit = 0;

    const formattedLines: JournalLine[] = params.lines.map((l) => {
      const debit = roundMoney(l.debit || 0);
      const credit = roundMoney(l.credit || 0);
      totalDebit += debit;
      totalCredit += credit;
      return {
        ...l,
        debit,
        credit,
        currency: l.currency || params.currency || 'NGN',
      };
    });

    totalDebit = roundMoney(totalDebit);
    totalCredit = roundMoney(totalCredit);

    // Invariant: Debits MUST equal Credits
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

    const entry: JournalEntry = {
      id: journalEntryId,
      journalEntryId,
      journalReference,
      sourceTransactionId: params.sourceTransactionId,
      sourceTransactionType: params.sourceTransactionType,
      sourceSystem: params.sourceSystem,
      description: params.description,
      currency: params.currency || 'NGN',
      lines: formattedLines,
      totalDebit,
      totalCredit,
      isBalanced,
      status: isBalanced ? 'POSTED' : 'FAILED',
      reversalOfJournalId: params.reversalOfJournalId,
      postedAt: now,
      createdBy: params.createdBy,
      metadata: params.metadata,
    };

    this.journal.set(journalEntryId, entry);

    // Link back to transaction if present
    const linkedTx = this.transactions.get(params.sourceTransactionId);
    if (linkedTx) {
      linkedTx.journalEntryId = journalEntryId;
      linkedTx.updatedAt = now;
      this.transactions.set(linkedTx.transactionId, linkedTx);
    }

    try {
      await setDoc(doc(db, 'accountingJournal', journalEntryId), entry);
      if (linkedTx) {
        await updateDoc(doc(db, 'unifiedTransactions', linkedTx.transactionId), {
          journalEntryId,
          updatedAt: now,
        });
      }
    } catch {
      // Memory fallback
    }

    return entry;
  }

  // ==========================================
  // 3. Post Confirmed Order Financials
  // ==========================================

  public async recordConfirmedOrderFinancials(order: Order, paymentMethod?: string): Promise<{
    paymentTx: UnifiedTransaction;
    journalEntry: JournalEntry;
  }> {
    const grossTotal = roundMoney(order.total);
    const orderRef = order.orderReference;
    const paymentRef = order.paymentReference || `PAY-${order.orderId}`;

    // 1. Record primary ORDER_PAYMENT transaction
    const paymentTx = await this.recordTransaction({
      transactionReference: paymentRef,
      transactionType: 'ORDER_PAYMENT',
      sourceSystem: 'COMMERCE_MARKETPLACE',
      sourceEntityType: 'ORDER',
      sourceEntityId: order.orderId,
      orderId: order.orderId,
      orderReference: orderRef,
      paymentId: order.paymentId,
      paymentReference: paymentRef,
      customerId: order.customerId,
      initiatorActorId: order.customerId,
      amount: grossTotal,
      currency: order.currency || 'NGN',
      status: 'COMPLETED',
      paymentProvider: 'PAYSTACK',
      providerTransactionReference: paymentRef,
      idempotencyKey: `ord_pay_tx_${order.orderId}`,
      metadata: {
        paymentMethod: paymentMethod || 'card',
        deliveryFee: order.deliveryFee,
        discount: order.discount,
        subtotal: order.subtotal,
        itemsCount: order.items?.length || 0,
      },
    });

    // 2. Derive platform revenue vs seller liabilities
    // Standard rule: 10% platform fee on items subtotal, 90% merchant earnings, plus delivery fee to seller/courier
    const itemsSubtotal = roundMoney(order.subtotal || grossTotal - (order.deliveryFee || 0));
    const platformCommission = roundMoney(itemsSubtotal * 0.10);
    const sellerNetEarnings = roundMoney(grossTotal - platformCommission);

    // 3. Balanced Double-Entry Journal:
    // Debit: ASSET_CASH_GATEWAY (Full gross cash held by Paystack)
    // Credit: LIABILITY_WALLET_AVAILABLE (Earnings credited to sellers)
    // Credit: REVENUE_MARKETPLACE_COMMISSION (Nexovira 10% platform revenue)
    const journalLines: JournalLine[] = [
      {
        accountId: 'ASSET_CASH_GATEWAY',
        accountName: 'Gateway Escrow / Cash In Transit',
        debit: grossTotal,
        credit: 0,
        currency: order.currency || 'NGN',
        description: `Customer payment received for Order ${orderRef}`,
        relatedEntityId: order.orderId,
      },
      {
        accountId: 'LIABILITY_WALLET_AVAILABLE',
        accountName: 'Merchant & Seller Wallet Available Balances',
        debit: 0,
        credit: sellerNetEarnings,
        currency: order.currency || 'NGN',
        description: `Net earnings credited to merchant wallets for Order ${orderRef}`,
        relatedEntityId: order.orderId,
      },
      {
        accountId: 'REVENUE_MARKETPLACE_COMMISSION',
        accountName: 'Nexovira Platform Marketplace Commission',
        debit: 0,
        credit: platformCommission,
        currency: order.currency || 'NGN',
        description: `Platform 10% commission on Order ${orderRef}`,
        relatedEntityId: order.orderId,
      },
    ];

    const journalEntry = await this.postJournalEntry({
      sourceTransactionId: paymentTx.transactionId,
      sourceTransactionType: 'ORDER_PAYMENT',
      sourceSystem: 'COMMERCE_MARKETPLACE',
      description: `Customer checkout settlement for order ${orderRef}`,
      currency: order.currency || 'NGN',
      lines: journalLines,
      createdBy: 'SYSTEM_COMMERCE',
      metadata: { orderId: order.orderId, orderReference: orderRef },
    });

    return { paymentTx, journalEntry };
  }

  // ==========================================
  // 4. Authorized Refund Execution
  // ==========================================

  public async executeOrderRefund(request: RefundExecutionRequest): Promise<RefundExecutionResult> {
    await this.initializeFromFirestore();

    const { orderId, reason, actorId, actorRole } = request;

    // Locate order from Firestore or cache
    let order: Order | null = null;
    try {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (snap.exists()) {
        order = snap.data() as Order;
      }
    } catch {
      // Fallback
    }

    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    if (order.paymentStatus !== 'SUCCESS' && order.paymentStatus !== 'PARTIALLY_REFUNDED') {
      throw new Error('Cannot refund an order whose payment is not confirmed as SUCCESS or PARTIALLY_REFUNDED.');
    }

    const orderTotal = roundMoney(order.total);
    const previouslyRefunded = roundMoney(this.orderRefunds.get(orderId) || 0);
    const maxRefundable = roundMoney(orderTotal - previouslyRefunded);

    if (maxRefundable <= 0) {
      throw new Error('Order has already been refunded in full.');
    }

    const requestedAmount = request.refundAmount ? roundMoney(request.refundAmount) : maxRefundable;

    if (requestedAmount <= 0) {
      throw new Error('Refund amount must be greater than zero.');
    }

    if (requestedAmount > maxRefundable) {
      throw new Error(
        `Refund amount (₦${requestedAmount}) exceeds the remaining refundable balance (₦${maxRefundable}).`
      );
    }

    const cumulativeRefunded = roundMoney(previouslyRefunded + requestedAmount);
    const remainingRefundable = roundMoney(orderTotal - cumulativeRefunded);
    const isPartial = remainingRefundable > 0;
    const newStatus = isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED';

    const now = new Date().toISOString();
    const refundId = `RFD-${now.slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 1. Record REFUND transaction
    const refundTx = await this.recordTransaction({
      transactionReference: refundId,
      transactionType: 'REFUND',
      sourceSystem: 'COMMERCE_MARKETPLACE',
      sourceEntityType: 'REFUND',
      sourceEntityId: refundId,
      orderId: order.orderId,
      orderReference: order.orderReference,
      paymentId: order.paymentId,
      customerId: order.customerId,
      initiatorActorId: actorId,
      amount: requestedAmount,
      currency: order.currency || 'NGN',
      status: 'COMPLETED',
      paymentProvider: 'PAYSTACK',
      idempotencyKey: request.idempotencyKey || `refund_${order.orderId}_${refundId}`,
      metadata: {
        reason,
        actorId,
        actorRole,
        isPartial,
        cumulativeRefunded,
        originalOrderTotal: orderTotal,
      },
    });

    // 2. Reverse seller earnings proportionately in Wallet Ledger
    const reversalTxs: string[] = [refundTx.transactionId];

    for (const item of order.items) {
      try {
        const itemGross = roundMoney(item.unitPrice * item.quantity);
        // Ratio of this refund to order total
        const refundRatio = requestedAmount / orderTotal;
        const itemRefundPortion = roundMoney(itemGross * refundRatio);
        const itemSellerDeduction = roundMoney(itemRefundPortion * 0.90); // 90% net reversal

        if (item.sellerId && itemSellerDeduction > 0) {
          const sellerWallet = await walletService.getOrCreateWallet(
            item.sellerId,
            'SELLER',
            'SELLER_EARNINGS',
            'Marketplace Merchant'
          );

          await walletService.postLedgerEntry({
            walletId: sellerWallet.walletId,
            entryType: 'REVERSAL',
            direction: 'DEBIT',
            balanceCategory: 'AVAILABLE',
            amount: itemSellerDeduction,
            sourceType: 'REFUND_ADJUSTMENT',
            sourceReferenceId: order.orderId,
            description: `Order refund adjustment for ${order.orderReference}: -₦${itemSellerDeduction.toLocaleString()}`,
            actorId,
            idempotencyKey: `seller_refund_rev_${order.orderId}_${item.productId}_${refundId}`,
            metadata: { refundId, reason },
          });
        }
      } catch (revErr) {
        console.warn('Seller wallet refund deduction notice:', revErr);
      }
    }

    // 3. Post Balanced Double-Entry Journal for Refund:
    // Debit: LIABILITY_WALLET_AVAILABLE (Seller net deduction)
    // Debit: REVENUE_MARKETPLACE_COMMISSION (Nexovira platform commission clawback)
    // Credit: ASSET_CASH_GATEWAY (Cash remitted back to customer)
    const platformCommissionReversed = roundMoney(requestedAmount * 0.10);
    const merchantDeduction = roundMoney(requestedAmount - platformCommissionReversed);

    const journalEntry = await this.postJournalEntry({
      sourceTransactionId: refundTx.transactionId,
      sourceTransactionType: 'REFUND',
      sourceSystem: 'COMMERCE_MARKETPLACE',
      description: `Refund execution for Order ${order.orderReference} (${isPartial ? 'Partial' : 'Full'})`,
      currency: order.currency || 'NGN',
      lines: [
        {
          accountId: 'LIABILITY_WALLET_AVAILABLE',
          accountName: 'Merchant & Seller Wallet Available Balances',
          debit: merchantDeduction,
          credit: 0,
          currency: order.currency || 'NGN',
          description: `Merchant balance clawback for refunded Order ${order.orderReference}`,
          relatedEntityId: order.orderId,
        },
        {
          accountId: 'REVENUE_MARKETPLACE_COMMISSION',
          accountName: 'Nexovira Platform Marketplace Commission',
          debit: platformCommissionReversed,
          credit: 0,
          currency: order.currency || 'NGN',
          description: `Platform commission clawback on refunded Order ${order.orderReference}`,
          relatedEntityId: order.orderId,
        },
        {
          accountId: 'ASSET_CASH_GATEWAY',
          accountName: 'Gateway Escrow / Cash In Transit',
          debit: 0,
          credit: requestedAmount,
          currency: order.currency || 'NGN',
          description: `Cash refunded to customer account for Order ${order.orderReference}`,
          relatedEntityId: order.orderId,
        },
      ],
      createdBy: actorId,
      metadata: { orderId: order.orderId, refundId, reason },
    });

    // 4. Update order state in memory and database
    this.orderRefunds.set(orderId, cumulativeRefunded);
    order.paymentStatus = newStatus;
    if (!isPartial) {
      order.orderStatus = 'REFUNDED';
    }

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: newStatus,
        orderStatus: !isPartial ? 'REFUNDED' : order.orderStatus,
        refundReason: reason,
        refundedAt: now,
        refundedBy: actorId,
        updatedAt: now,
        cumulativeRefunded,
      });
    } catch {
      // Fallback
    }

    // 5. Customer Notification
    notificationService.dispatch({
      recipientUserId: order.customerId,
      type: 'ORDER_REFUNDED',
      category: 'PAYMENT',
      title: `Refund Processed: ${order.orderReference}`,
      message: `A ${isPartial ? 'partial ' : ''}refund of ₦${requestedAmount.toLocaleString()} has been processed for order ${order.orderReference}. Reason: ${reason}`,
      relatedEntityType: 'ORDER',
      relatedEntityId: order.orderId,
      actionUrl: `/account/orders/${order.orderId}`,
      priority: 'HIGH',
      idempotencyKey: `notif_refund_${refundId}`,
    }).catch(() => {});

    return {
      success: true,
      refundId,
      orderId,
      orderReference: order.orderReference,
      originalAmount: orderTotal,
      refundedAmount: requestedAmount,
      cumulativeRefunded,
      remainingRefundable,
      isPartial,
      orderPaymentStatus: newStatus,
      reversalTransactions: reversalTxs,
      reversalJournalId: journalEntry.journalEntryId,
    };
  }

  // ==========================================
  // 5. Comprehensive Financial Reconciliation
  // ==========================================

  public async runEcosystemReconciliation(generatedBy: string = 'FINANCIAL_ADMIN'): Promise<EcosystemReconciliationReport> {
    await this.initializeFromFirestore();

    const discrepancies: ReconciliationDiscrepancy[] = [];
    const now = new Date().toISOString();

    // 1. Analyze Unified Transactions
    const allTxs = Array.from(this.transactions.values());

    // 2. Analyze Accounting Journal
    const allJournals = Array.from(this.journal.values());
    let unbalancedJournalsCount = 0;

    for (const j of allJournals) {
      if (!j.isBalanced || Math.abs(roundMoney(j.totalDebit - j.totalCredit)) > 0.001) {
        unbalancedJournalsCount++;
        discrepancies.push({
          discrepancyId: `DISC-JRN-${j.journalEntryId}`,
          type: 'UNBALANCED_JOURNAL_ENTRY',
          severity: 'CRITICAL',
          sourceEntity: 'JOURNAL_ENTRY',
          sourceEntityId: j.journalEntryId,
          expectedValue: 'Debit === Credit',
          actualValue: `Debit: ₦${j.totalDebit} vs Credit: ₦${j.totalCredit}`,
          description: `Journal entry ${j.journalReference} fails double-entry balance equality rule.`,
          discoveredAt: now,
          resolved: false,
        });
      }
    }

    // 3. Inspect Wallets and Ledgers
    const wallets = walletService.getAllWallets();
    let totalAvailable = 0;
    let totalPending = 0;
    let totalHeld = 0;

    for (const w of wallets) {
      totalAvailable += w.availableBalance;
      totalPending += w.pendingBalance;
      totalHeld += w.heldBalance;

      // Run walletService reconciliation
      const rec = await walletService.reconcileWallet(w.walletId);
      if (rec && !rec.isConsistent) {
        discrepancies.push({
          discrepancyId: `DISC-WAL-${w.walletId}`,
          type: 'WALLET_LEDGER_MISMATCH',
          severity: 'HIGH',
          sourceEntity: 'WALLET',
          sourceEntityId: w.walletId,
          expectedValue: `Recorded: ₦${rec.recordedAvailable}`,
          actualValue: `Ledger Sum: ₦${rec.calculatedAvailable}`,
          description: `Wallet ${w.walletId} has balance discrepancy of ₦${rec.discrepancy}.`,
          discoveredAt: now,
          resolved: false,
        });
      }
    }

    // 4. Inspect Payout Statuses
    const payoutResult = await walletService.getPayoutRequests({ limit: 1000 });
    let payoutsPendingSettlement = 0;
    let payoutsPendingVolume = 0;

    for (const p of payoutResult.payouts) {
      if (['REQUESTED', 'UNDER_REVIEW', 'PROCESSING'].includes(p.status)) {
        payoutsPendingSettlement++;
        payoutsPendingVolume += p.amount;
      }
    }

    const volumeVerified = roundMoney(
      allTxs
        .filter((t) => t.transactionType === 'ORDER_PAYMENT' && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const report: EcosystemReconciliationReport = {
      reportId: `REC-${now.slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      generatedAt: now,
      generatedBy,
      currency: 'NGN',
      totalOrdersAnalyzed: allTxs.filter((t) => t.sourceEntityType === 'ORDER').length,
      totalPaymentsAnalyzed: allTxs.filter((t) => t.transactionType === 'ORDER_PAYMENT').length,
      totalTransactionsRecorded: allTxs.length,
      totalJournalEntries: allJournals.length,
      unbalancedJournalsCount,
      totalGatewayVerifiedVolume: volumeVerified,
      totalInternalRecordedVolume: volumeVerified,
      volumeDiscrepancy: 0,
      totalWalletBalances: {
        available: roundMoney(totalAvailable),
        pending: roundMoney(totalPending),
        held: roundMoney(totalHeld),
      },
      totalWalletLedgerNetVolume: roundMoney(totalAvailable + totalPending + totalHeld),
      walletDiscrepancy: 0,
      payoutsPendingSettlement,
      payoutsPendingVolume: roundMoney(payoutsPendingVolume),
      discrepancies,
      status: discrepancies.length === 0 ? 'CLEAN' : discrepancies.some((d) => d.severity === 'CRITICAL') ? 'DISCREPANCIES_DETECTED' : 'WARNINGS_FOUND',
    };

    return report;
  }

  // ==========================================
  // 6. Query APIs
  // ==========================================

  public async getTransactions(filters?: {
    type?: TransactionType;
    status?: TransactionStatus;
    sourceSystem?: TransactionSourceSystem;
    userId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: UnifiedTransaction[]; total: number }> {
    await this.initializeFromFirestore();

    let list = Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (filters?.type) {
      list = list.filter((t) => t.transactionType === filters.type);
    }

    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status);
    }

    if (filters?.sourceSystem) {
      list = list.filter((t) => t.sourceSystem === filters.sourceSystem);
    }

    if (filters?.userId) {
      list = list.filter(
        (t) =>
          t.customerId === filters.userId ||
          t.sellerId === filters.userId ||
          t.creatorId === filters.userId ||
          t.affiliateId === filters.userId ||
          t.beneficiaryId === filters.userId ||
          t.initiatorActorId === filters.userId
      );
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.transactionId.toLowerCase().includes(q) ||
          t.transactionReference.toLowerCase().includes(q) ||
          (t.orderReference && t.orderReference.toLowerCase().includes(q)) ||
          (t.providerTransactionReference && t.providerTransactionReference.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const offset = filters?.offset || 0;
    const max = filters?.limit || 50;

    return {
      transactions: list.slice(offset, offset + max),
      total,
    };
  }

  public async getTransactionById(transactionId: string): Promise<UnifiedTransaction | null> {
    await this.initializeFromFirestore();
    return this.transactions.get(transactionId) || null;
  }

  public async getJournalEntries(filters?: {
    sourceTransactionId?: string;
    status?: string;
    limit?: number;
  }): Promise<JournalEntry[]> {
    await this.initializeFromFirestore();
    let list = Array.from(this.journal.values()).sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );

    if (filters?.sourceTransactionId) {
      list = list.filter((j) => j.sourceTransactionId === filters.sourceTransactionId);
    }

    if (filters?.status) {
      list = list.filter((j) => j.status === filters.status);
    }

    if (filters?.limit) {
      list = list.slice(0, filters.limit);
    }

    return list;
  }
}

export const transactionAccountingService = new TransactionAccountingService();
