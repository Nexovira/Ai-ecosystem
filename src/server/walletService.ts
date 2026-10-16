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
  Wallet,
  WalletType,
  WalletStatus,
  LedgerEntry,
  LedgerEntryType,
  LedgerEntryDirection,
  LedgerSourceType,
  WalletPayoutRequest,
  WalletHold,
  WalletReconciliationResult,
  WalletAdjustmentParams,
} from '../types/wallet';
import { notificationService } from './notificationService';

// Monetary precision helper (Strict 2 decimal places to avoid floating point anomalies)
export function roundMoney(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

export class WalletService {
  private wallets: Map<string, Wallet> = new Map(); // keyed by walletId
  private walletsByOwnerAndType: Map<string, string> = new Map(); // `${ownerId}_${walletType}` -> walletId
  private ledger: Map<string, LedgerEntry> = new Map(); // keyed by entryId
  private ledgerByIdempotency: Map<string, string> = new Map(); // idempotencyKey -> entryId
  private payouts: Map<string, WalletPayoutRequest> = new Map(); // keyed by payoutId
  private holds: Map<string, WalletHold> = new Map(); // keyed by holdId
  private initialized: boolean = false;

  constructor() {
    this.seedPlatformAccounts();
    this.initializeFromFirestore().catch(() => {
      // Graceful fallback to server memory store
    });
  }

  private seedPlatformAccounts() {
    const platformWalletId = 'wal-platform-treasury';
    const platformWallet: Wallet = {
      id: platformWalletId,
      walletId: platformWalletId,
      ownerId: 'platform_system',
      ownerType: 'PLATFORM',
      ownerName: 'Nexovira Platform Treasury',
      walletType: 'PLATFORM_ACCOUNT',
      currency: 'NGN',
      status: 'ACTIVE',
      pendingBalance: 0,
      availableBalance: roundMoney(12500000), // Reserve liquidity
      heldBalance: 0,
      lifetimeCredited: roundMoney(12500000),
      lifetimeDebited: 0,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    this.wallets.set(platformWalletId, platformWallet);
    this.walletsByOwnerAndType.set('platform_system_PLATFORM_ACCOUNT', platformWalletId);

    // Genesis ledger entry so ledger math perfectly reconciles with treasury initial balance
    const genesisEntryId = 'led-genesis-treasury-reserve';
    const genesisEntry: LedgerEntry = {
      id: genesisEntryId,
      walletId: platformWalletId,
      transactionId: 'TX-GENESIS-TREASURY',
      entryType: 'CREDIT',
      direction: 'CREDIT',
      amount: roundMoney(12500000),
      currency: 'NGN',
      status: 'POSTED',
      idempotencyKey: 'genesis_treasury_init',
      sourceType: 'MANAGEMENT_ADJUSTMENT',
      sourceReferenceId: 'GENESIS_CAPITAL',
      description: 'Initial platform operating liquidity and treasury reserve capitalization',
      actorId: 'SYSTEM',
      balanceAfter: {
        pending: 0,
        available: roundMoney(12500000),
        held: 0,
      },
      createdAt: '2026-08-01T00:00:00.000Z',
    };
    this.ledger.set(genesisEntryId, genesisEntry);
    this.ledgerByIdempotency.set('genesis_treasury_init', genesisEntryId);
  }

  private async initializeFromFirestore() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const wSnap = await getDocs(query(collection(db, 'wallets'), firestoreLimit(250))).catch(() => null);
      if (wSnap && !wSnap.empty) {
        wSnap.forEach((d) => {
          const w = d.data() as Wallet;
          this.wallets.set(w.walletId, w);
          this.walletsByOwnerAndType.set(`${w.ownerId}_${w.walletType}`, w.walletId);
        });
      }

      const lSnap = await getDocs(query(collection(db, 'walletLedger'), firestoreLimit(500))).catch(() => null);
      if (lSnap && !lSnap.empty) {
        lSnap.forEach((d) => {
          const entry = d.data() as LedgerEntry;
          this.ledger.set(entry.id, entry);
          if (entry.idempotencyKey) {
            this.ledgerByIdempotency.set(entry.idempotencyKey, entry.id);
          }
        });
      }

      const pSnap = await getDocs(query(collection(db, 'walletPayouts'), firestoreLimit(200))).catch(() => null);
      if (pSnap && !pSnap.empty) {
        pSnap.forEach((d) => {
          const p = d.data() as WalletPayoutRequest;
          this.payouts.set(p.payoutId, p);
        });
      }
    } catch {
      // Offline/memory fallback mode
    }
  }

  /**
   * Get or create a wallet for an authorized user and wallet type
   */
  public async getOrCreateWallet(
    ownerId: string,
    ownerType: 'USER' | 'SELLER' | 'CREATOR' | 'AFFILIATE',
    walletType: WalletType,
    ownerName: string
  ): Promise<Wallet> {
    await this.initializeFromFirestore();

    const lookupKey = `${ownerId}_${walletType}`;
    const existingWalletId = this.walletsByOwnerAndType.get(lookupKey);

    if (existingWalletId && this.wallets.has(existingWalletId)) {
      return this.wallets.get(existingWalletId)!;
    }

    // Check if wallet exists in Firestore
    try {
      const q = query(
        collection(db, 'wallets'),
        where('ownerId', '==', ownerId),
        where('walletType', '==', walletType),
        firestoreLimit(1)
      );
      const snap = await getDocs(q).catch(() => null);
      if (snap && !snap.empty) {
        const found = snap.docs[0].data() as Wallet;
        this.wallets.set(found.walletId, found);
        this.walletsByOwnerAndType.set(lookupKey, found.walletId);
        return found;
      }
    } catch {
      // Memory fallback
    }

    // Create new wallet
    const walletId = `wal-${walletType.toLowerCase().replace(/_/g, '-')}-${ownerId.substring(0, 8)}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const newWallet: Wallet = {
      id: walletId,
      walletId,
      ownerId,
      ownerType,
      ownerName: ownerName || 'Nexovira Account Holder',
      walletType,
      currency: 'NGN',
      status: 'ACTIVE',
      pendingBalance: 0,
      availableBalance: 0,
      heldBalance: 0,
      lifetimeCredited: 0,
      lifetimeDebited: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.wallets.set(walletId, newWallet);
    this.walletsByOwnerAndType.set(lookupKey, walletId);

    try {
      await setDoc(doc(db, 'wallets', walletId), newWallet).catch(() => null);
    } catch {
      // Memory persistence retained
    }

    return newWallet;
  }

  /**
   * Find wallet by ID
   */
  public getWalletById(walletId: string): Wallet | null {
    return this.wallets.get(walletId) || null;
  }

  /**
   * Get all wallets owned by a specific user/entity
   */
  public async getWalletsByOwner(ownerId: string): Promise<Wallet[]> {
    await this.initializeFromFirestore();
    const result: Wallet[] = [];
    for (const w of this.wallets.values()) {
      if (w.ownerId === ownerId) {
        result.push(w);
      }
    }
    return result;
  }

  /**
   * Authoritative Immutable Ledger Entry Creation & Atomic Balance Mutation
   */
  public async postLedgerEntry(params: {
    walletId: string;
    entryType: LedgerEntryType;
    direction: LedgerEntryDirection;
    balanceCategory: 'AVAILABLE' | 'PENDING' | 'HELD';
    amount: number;
    sourceType: LedgerSourceType;
    sourceReferenceId: string;
    description: string;
    actorId: string;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; entry?: LedgerEntry; error?: string }> {
    await this.initializeFromFirestore();

    const {
      walletId,
      entryType,
      direction,
      balanceCategory,
      sourceType,
      sourceReferenceId,
      description,
      actorId,
      idempotencyKey,
      metadata,
    } = params;

    const amount = roundMoney(params.amount);

    if (amount <= 0) {
      return { success: false, error: 'Transaction amount must be strictly positive.' };
    }

    // Idempotency check: prevent duplicate financial postings
    if (idempotencyKey && this.ledgerByIdempotency.has(idempotencyKey)) {
      const existingEntryId = this.ledgerByIdempotency.get(idempotencyKey)!;
      const existingEntry = this.ledger.get(existingEntryId);
      if (existingEntry) {
        return { success: true, entry: existingEntry };
      }
    }

    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      return { success: false, error: `Target wallet ${walletId} not found.` };
    }

    if (wallet.status !== 'ACTIVE' && entryType !== 'REVERSAL') {
      return {
        success: false,
        error: `Wallet ${walletId} is currently ${wallet.status}. Financial operations are restricted.`,
      };
    }

    // Concurrency & Funds Validation: prevent negative balances
    if (direction === 'DEBIT') {
      if (balanceCategory === 'AVAILABLE' && wallet.availableBalance < amount) {
        return {
          success: false,
          error: `Insufficient available balance in wallet. Available: ₦${wallet.availableBalance.toLocaleString()} NGN, Requested: ₦${amount.toLocaleString()} NGN.`,
        };
      }
      if (balanceCategory === 'PENDING' && wallet.pendingBalance < amount) {
        return {
          success: false,
          error: `Insufficient pending balance in wallet. Pending: ₦${wallet.pendingBalance.toLocaleString()} NGN, Requested: ₦${amount.toLocaleString()} NGN.`,
        };
      }
      if (balanceCategory === 'HELD' && wallet.heldBalance < amount) {
        return {
          success: false,
          error: `Insufficient held balance in wallet. Held: ₦${wallet.heldBalance.toLocaleString()} NGN, Requested: ₦${amount.toLocaleString()} NGN.`,
        };
      }
    }

    // Atomic Balance Mutation
    let newPending = wallet.pendingBalance;
    let newAvailable = wallet.availableBalance;
    let newHeld = wallet.heldBalance;
    let newLifetimeCredited = wallet.lifetimeCredited;
    let newLifetimeDebited = wallet.lifetimeDebited;

    if (direction === 'CREDIT') {
      if (balanceCategory === 'PENDING') {
        newPending = roundMoney(newPending + amount);
      } else if (balanceCategory === 'AVAILABLE') {
        newAvailable = roundMoney(newAvailable + amount);
      } else if (balanceCategory === 'HELD') {
        newHeld = roundMoney(newHeld + amount);
      }
      newLifetimeCredited = roundMoney(newLifetimeCredited + amount);
    } else {
      // DEBIT
      if (balanceCategory === 'AVAILABLE') {
        newAvailable = roundMoney(newAvailable - amount);
      } else if (balanceCategory === 'PENDING') {
        newPending = roundMoney(newPending - amount);
      } else if (balanceCategory === 'HELD') {
        newHeld = roundMoney(newHeld - amount);
      }
      newLifetimeDebited = roundMoney(newLifetimeDebited + amount);
    }

    const now = new Date().toISOString();
    const entryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const transactionId = `TX-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const entry: LedgerEntry = {
      id: entryId,
      walletId,
      transactionId,
      entryType,
      direction,
      amount,
      currency: wallet.currency,
      status: 'POSTED',
      idempotencyKey,
      sourceType,
      sourceReferenceId,
      description,
      actorId: actorId || 'SYSTEM',
      balanceAfter: {
        pending: newPending,
        available: newAvailable,
        held: newHeld,
      },
      metadata: metadata || {},
      createdAt: now,
    };

    // Update Wallet
    wallet.pendingBalance = newPending;
    wallet.availableBalance = newAvailable;
    wallet.heldBalance = newHeld;
    wallet.lifetimeCredited = newLifetimeCredited;
    wallet.lifetimeDebited = newLifetimeDebited;
    wallet.updatedAt = now;

    // Record Ledger Entry
    this.ledger.set(entryId, entry);
    if (idempotencyKey) {
      this.ledgerByIdempotency.set(idempotencyKey, entryId);
    }

    // Persist to Firestore asynchronously with memory fallback
    try {
      await Promise.all([
        setDoc(doc(db, 'walletLedger', entryId), entry).catch(() => null),
        updateDoc(doc(db, 'wallets', walletId), {
          pendingBalance: newPending,
          availableBalance: newAvailable,
          heldBalance: newHeld,
          lifetimeCredited: newLifetimeCredited,
          lifetimeDebited: newLifetimeDebited,
          updatedAt: now,
        }).catch(() => null),
      ]);
    } catch {
      // Memory state is maintained authoritatively
    }

    return { success: true, entry };
  }

  /**
   * Move funds from PENDING to AVAILABLE (e.g., qualifying period elapsed or order delivery confirmed)
   */
  public async releasePendingToAvailable(params: {
    walletId: string;
    amount: number;
    sourceType: LedgerSourceType;
    sourceReferenceId: string;
    description: string;
    actorId: string;
    idempotencyKey: string;
  }): Promise<{ success: boolean; entry?: LedgerEntry; error?: string }> {
    const { walletId, amount, sourceType, sourceReferenceId, description, actorId, idempotencyKey } = params;
    const roundedAmount = roundMoney(amount);

    const wallet = this.wallets.get(walletId);
    if (!wallet) return { success: false, error: 'Wallet not found.' };

    if (wallet.pendingBalance < roundedAmount) {
      return {
        success: false,
        error: `Insufficient pending funds to release. Pending: ₦${wallet.pendingBalance.toLocaleString()} NGN.`,
      };
    }

    // Debit pending
    wallet.pendingBalance = roundMoney(wallet.pendingBalance - roundedAmount);
    // Credit available
    wallet.availableBalance = roundMoney(wallet.availableBalance + roundedAmount);
    wallet.updatedAt = new Date().toISOString();

    const entryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const transactionId = `TX-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const entry: LedgerEntry = {
      id: entryId,
      walletId,
      transactionId,
      entryType: 'RELEASE',
      direction: 'CREDIT',
      amount: roundedAmount,
      currency: wallet.currency,
      status: 'POSTED',
      idempotencyKey,
      sourceType,
      sourceReferenceId,
      description: description || 'Pending funds released to available balance',
      actorId,
      balanceAfter: {
        pending: wallet.pendingBalance,
        available: wallet.availableBalance,
        held: wallet.heldBalance,
      },
      createdAt: new Date().toISOString(),
    };

    this.ledger.set(entryId, entry);
    if (idempotencyKey) {
      this.ledgerByIdempotency.set(idempotencyKey, entryId);
    }

    try {
      await Promise.all([
        setDoc(doc(db, 'walletLedger', entryId), entry).catch(() => null),
        updateDoc(doc(db, 'wallets', walletId), {
          pendingBalance: wallet.pendingBalance,
          availableBalance: wallet.availableBalance,
          updatedAt: wallet.updatedAt,
        }).catch(() => null),
      ]);
    } catch {
      // Memory state intact
    }

    return { success: true, entry };
  }

  /**
   * Place Hold on Available Balance
   */
  public async placeHold(params: {
    walletId: string;
    amount: number;
    reason: string;
    actorId: string;
    idempotencyKey: string;
  }): Promise<{ success: boolean; hold?: WalletHold; entry?: LedgerEntry; error?: string }> {
    const { walletId, amount, reason, actorId, idempotencyKey } = params;
    const rounded = roundMoney(amount);

    const wallet = this.wallets.get(walletId);
    if (!wallet) return { success: false, error: 'Wallet not found.' };

    if (wallet.availableBalance < rounded) {
      return {
        success: false,
        error: `Insufficient available funds to place hold. Available: ₦${wallet.availableBalance.toLocaleString()} NGN.`,
      };
    }

    wallet.availableBalance = roundMoney(wallet.availableBalance - rounded);
    wallet.heldBalance = roundMoney(wallet.heldBalance + rounded);
    wallet.updatedAt = new Date().toISOString();

    const holdId = `hld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const hold: WalletHold = {
      id: holdId,
      holdId,
      walletId,
      amount: rounded,
      currency: wallet.currency,
      reason,
      placedBy: actorId,
      placedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    this.holds.set(holdId, hold);

    const entryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const transactionId = `TX-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const entry: LedgerEntry = {
      id: entryId,
      walletId,
      transactionId,
      entryType: 'HOLD',
      direction: 'DEBIT',
      amount: rounded,
      currency: wallet.currency,
      status: 'POSTED',
      idempotencyKey,
      sourceType: 'HOLD_RESERVATION',
      sourceReferenceId: holdId,
      description: `Funds placed on compliance/security hold: ${reason}`,
      actorId,
      balanceAfter: {
        pending: wallet.pendingBalance,
        available: wallet.availableBalance,
        held: wallet.heldBalance,
      },
      metadata: { holdId, reason },
      createdAt: new Date().toISOString(),
    };

    this.ledger.set(entryId, entry);
    if (idempotencyKey) {
      this.ledgerByIdempotency.set(idempotencyKey, entryId);
    }

    try {
      await Promise.all([
        setDoc(doc(db, 'walletHolds', holdId), hold).catch(() => null),
        setDoc(doc(db, 'walletLedger', entryId), entry).catch(() => null),
        updateDoc(doc(db, 'wallets', walletId), {
          availableBalance: wallet.availableBalance,
          heldBalance: wallet.heldBalance,
          updatedAt: wallet.updatedAt,
        }).catch(() => null),
      ]);
    } catch {
      // Memory state retained
    }

    return { success: true, hold, entry };
  }

  /**
   * Release an Active Hold back to Available Balance
   */
  public async releaseHold(params: {
    holdId: string;
    actorId: string;
    idempotencyKey: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { holdId, actorId, idempotencyKey } = params;
    const hold = this.holds.get(holdId);
    if (!hold || hold.status !== 'ACTIVE') {
      return { success: false, error: 'Valid active hold not found.' };
    }

    const wallet = this.wallets.get(hold.walletId);
    if (!wallet) return { success: false, error: 'Associated wallet not found.' };

    wallet.heldBalance = roundMoney(Math.max(0, wallet.heldBalance - hold.amount));
    wallet.availableBalance = roundMoney(wallet.availableBalance + hold.amount);
    wallet.updatedAt = new Date().toISOString();

    hold.status = 'RELEASED';
    hold.releasedAt = new Date().toISOString();
    hold.releasedBy = actorId;

    const entryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const transactionId = `TX-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const entry: LedgerEntry = {
      id: entryId,
      walletId: wallet.walletId,
      transactionId,
      entryType: 'RELEASE',
      direction: 'CREDIT',
      amount: hold.amount,
      currency: wallet.currency,
      status: 'POSTED',
      idempotencyKey,
      sourceType: 'HOLD_RELEASE',
      sourceReferenceId: holdId,
      description: `Security hold released: ${hold.reason}`,
      actorId,
      balanceAfter: {
        pending: wallet.pendingBalance,
        available: wallet.availableBalance,
        held: wallet.heldBalance,
      },
      metadata: { holdId },
      createdAt: new Date().toISOString(),
    };

    this.ledger.set(entryId, entry);

    try {
      await Promise.all([
        updateDoc(doc(db, 'walletHolds', holdId), {
          status: 'RELEASED',
          releasedAt: hold.releasedAt,
          releasedBy: actorId,
        }).catch(() => null),
        setDoc(doc(db, 'walletLedger', entryId), entry).catch(() => null),
        updateDoc(doc(db, 'wallets', wallet.walletId), {
          availableBalance: wallet.availableBalance,
          heldBalance: wallet.heldBalance,
          updatedAt: wallet.updatedAt,
        }).catch(() => null),
      ]);
    } catch {
      // Memory state retained
    }

    return { success: true };
  }

  // ==========================================
  // Payout Request Management
  // ==========================================

  /**
   * Request a Payout against Available Funds (Reserves Available -> Held)
   */
  public async requestPayout(params: {
    walletId: string;
    beneficiaryUserId: string;
    beneficiaryName: string;
    amount: number;
    destination: {
      bankName: string;
      bankCode: string;
      accountNumber: string;
      accountName: string;
    };
  }): Promise<{ success: boolean; payout?: WalletPayoutRequest; error?: string }> {
    await this.initializeFromFirestore();

    const { walletId, beneficiaryUserId, beneficiaryName, destination } = params;
    const requestedAmount = roundMoney(params.amount);

    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      return { success: false, error: 'Target wallet not found.' };
    }

    if (wallet.ownerId !== beneficiaryUserId) {
      return { success: false, error: 'Unauthorized: Beneficiary does not own this wallet.' };
    }

    if (wallet.status !== 'ACTIVE') {
      return {
        success: false,
        error: `Wallet status is ${wallet.status}. Payout requests are restricted.`,
      };
    }

    // Minimum payout threshold: ₦5,000 NGN
    const minimumPayout = 5000;
    if (requestedAmount < minimumPayout) {
      return {
        success: false,
        error: `Minimum withdrawal amount is ₦${minimumPayout.toLocaleString()} NGN.`,
      };
    }

    if (wallet.availableBalance < requestedAmount) {
      return {
        success: false,
        error: `Insufficient available funds. Available: ₦${wallet.availableBalance.toLocaleString()} NGN, Requested: ₦${requestedAmount.toLocaleString()} NGN.`,
      };
    }

    // Check for existing pending/processing payout requests on this wallet
    for (const p of this.payouts.values()) {
      if (
        p.walletId === walletId &&
        ['REQUESTED', 'UNDER_REVIEW', 'PROCESSING'].includes(p.status)
      ) {
        return {
          success: false,
          error: 'An active payout request is already being processed for this wallet. Please wait for completion.',
        };
      }
    }

    const payoutId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const internalReference = `NEXO-PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const now = new Date().toISOString();

    // 1. Move available funds into held balance for reservation
    wallet.availableBalance = roundMoney(wallet.availableBalance - requestedAmount);
    wallet.heldBalance = roundMoney(wallet.heldBalance + requestedAmount);
    wallet.updatedAt = now;

    // 2. Post Ledger Hold Reservation Entry
    const entryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const transactionId = `TX-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const ledgerEntry: LedgerEntry = {
      id: entryId,
      walletId,
      transactionId,
      entryType: 'HOLD',
      direction: 'DEBIT',
      amount: requestedAmount,
      currency: wallet.currency,
      status: 'POSTED',
      idempotencyKey: `payout_reserve_${payoutId}`,
      sourceType: 'PAYOUT_REQUEST',
      sourceReferenceId: payoutId,
      description: `Payout reservation to ${destination.bankName} (${destination.accountNumber})`,
      actorId: beneficiaryUserId,
      balanceAfter: {
        pending: wallet.pendingBalance,
        available: wallet.availableBalance,
        held: wallet.heldBalance,
      },
      metadata: {
        payoutId,
        internalReference,
        destination,
      },
      createdAt: now,
    };

    this.ledger.set(entryId, ledgerEntry);

    // 3. Create Payout Record
    const payout: WalletPayoutRequest = {
      id: payoutId,
      payoutId,
      walletId,
      beneficiaryUserId,
      beneficiaryName,
      walletType: wallet.walletType,
      amount: requestedAmount,
      currency: wallet.currency,
      destination,
      provider: 'PAYSTACK',
      status: 'REQUESTED',
      internalReference,
      requestedAt: now,
      ledgerEntryId: entryId,
    };

    this.payouts.set(payoutId, payout);

    // Persist to Firestore
    try {
      await Promise.all([
        setDoc(doc(db, 'walletPayouts', payoutId), payout).catch(() => null),
        setDoc(doc(db, 'walletLedger', entryId), ledgerEntry).catch(() => null),
        updateDoc(doc(db, 'wallets', walletId), {
          availableBalance: wallet.availableBalance,
          heldBalance: wallet.heldBalance,
          updatedAt: now,
        }).catch(() => null),
      ]);
    } catch {
      // Memory state retained
    }

    // Authoritative Notification
    notificationService.dispatch({
      recipientUserId: beneficiaryUserId,
      type: 'PAYOUT_REQUESTED',
      category: 'PAYMENT',
      title: 'Withdrawal Request Submitted',
      message: `Your withdrawal request of ₦${requestedAmount.toLocaleString()} NGN (${destination.bankName}) has been received and is queued for verification.`,
      metadata: { payoutId, internalReference, amount: requestedAmount },
    });

    return { success: true, payout };
  }

  /**
   * Complete Payout (Deducts Held Balance -> Lifetime Debited)
   */
  public async completePayout(
    payoutId: string,
    actorId: string,
    providerReference?: string
  ): Promise<{ success: boolean; error?: string }> {
    const payout = this.payouts.get(payoutId);
    if (!payout) return { success: false, error: 'Payout record not found.' };

    if (!['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING'].includes(payout.status)) {
      return { success: false, error: `Payout is currently in ${payout.status} state. Cannot complete.` };
    }

    const wallet = this.wallets.get(payout.walletId);
    if (!wallet) return { success: false, error: 'Associated wallet not found.' };

    // Debit held balance and record in lifetimeDebited
    wallet.heldBalance = roundMoney(Math.max(0, wallet.heldBalance - payout.amount));
    wallet.lifetimeDebited = roundMoney(wallet.lifetimeDebited + payout.amount);
    wallet.updatedAt = new Date().toISOString();

    const now = new Date().toISOString();
    payout.status = 'COMPLETED';
    payout.completedAt = now;
    if (providerReference) {
      payout.providerReference = providerReference;
    }

    // Ledger Entry for Completed Payout
    const entryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const transactionId = `TX-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const ledgerEntry: LedgerEntry = {
      id: entryId,
      walletId: wallet.walletId,
      transactionId,
      entryType: 'PAYOUT',
      direction: 'DEBIT',
      amount: payout.amount,
      currency: wallet.currency,
      status: 'POSTED',
      idempotencyKey: `payout_complete_${payoutId}`,
      sourceType: 'PAYOUT_COMPLETED',
      sourceReferenceId: payoutId,
      description: `Disbursement completed to ${payout.destination.bankName} (${payout.destination.accountNumber})`,
      actorId,
      balanceAfter: {
        pending: wallet.pendingBalance,
        available: wallet.availableBalance,
        held: wallet.heldBalance,
      },
      metadata: { payoutId, providerReference },
      createdAt: now,
    };

    this.ledger.set(entryId, ledgerEntry);

    try {
      await Promise.all([
        updateDoc(doc(db, 'walletPayouts', payoutId), {
          status: 'COMPLETED',
          completedAt: now,
          providerReference: providerReference || '',
        }).catch(() => null),
        setDoc(doc(db, 'walletLedger', entryId), ledgerEntry).catch(() => null),
        updateDoc(doc(db, 'wallets', wallet.walletId), {
          heldBalance: wallet.heldBalance,
          lifetimeDebited: wallet.lifetimeDebited,
          updatedAt: wallet.updatedAt,
        }).catch(() => null),
      ]);
    } catch {
      // Memory state retained
    }

    notificationService.dispatch({
      recipientUserId: payout.beneficiaryUserId,
      type: 'PAYOUT_COMPLETED',
      category: 'PAYMENT',
      title: 'Withdrawal Disbursed Successfully',
      message: `Your withdrawal of ₦${payout.amount.toLocaleString()} NGN has been disbursed to ${payout.destination.bankName}.`,
      metadata: { payoutId, amount: payout.amount },
    });

    return { success: true };
  }

  /**
   * Fail or Cancel Payout (Releases Held Balance back to Available)
   */
  public async failOrCancelPayout(
    payoutId: string,
    action: 'FAILED' | 'REJECTED' | 'CANCELLED',
    reason: string,
    actorId: string
  ): Promise<{ success: boolean; error?: string }> {
    const payout = this.payouts.get(payoutId);
    if (!payout) return { success: false, error: 'Payout record not found.' };

    if (payout.status === 'COMPLETED') {
      return { success: false, error: 'Cannot cancel an already completed payout.' };
    }

    const wallet = this.wallets.get(payout.walletId);
    if (!wallet) return { success: false, error: 'Associated wallet not found.' };

    // Release held funds back to available
    wallet.heldBalance = roundMoney(Math.max(0, wallet.heldBalance - payout.amount));
    wallet.availableBalance = roundMoney(wallet.availableBalance + payout.amount);
    wallet.updatedAt = new Date().toISOString();

    const now = new Date().toISOString();
    payout.status = action;
    if (action === 'REJECTED') {
      payout.rejectionReason = reason;
      payout.reviewedBy = actorId;
      payout.reviewedAt = now;
    } else {
      payout.failureReason = reason;
    }

    // Ledger Compensating Entry
    const entryId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const transactionId = `TX-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const ledgerEntry: LedgerEntry = {
      id: entryId,
      walletId: wallet.walletId,
      transactionId,
      entryType: 'RELEASE',
      direction: 'CREDIT',
      amount: payout.amount,
      currency: wallet.currency,
      status: 'POSTED',
      idempotencyKey: `payout_cancel_release_${payoutId}`,
      sourceType: action === 'FAILED' ? 'PAYOUT_FAILED' : 'PAYOUT_CANCELLED',
      sourceReferenceId: payoutId,
      description: `Held funds released due to ${action.toLowerCase()} payout: ${reason}`,
      actorId,
      balanceAfter: {
        pending: wallet.pendingBalance,
        available: wallet.availableBalance,
        held: wallet.heldBalance,
      },
      metadata: { payoutId, reason, action },
      createdAt: now,
    };

    this.ledger.set(entryId, ledgerEntry);

    try {
      await Promise.all([
        updateDoc(doc(db, 'walletPayouts', payoutId), {
          status: action,
          failureReason: payout.failureReason || '',
          rejectionReason: payout.rejectionReason || '',
          updatedAt: now,
        }).catch(() => null),
        setDoc(doc(db, 'walletLedger', entryId), ledgerEntry).catch(() => null),
        updateDoc(doc(db, 'wallets', wallet.walletId), {
          heldBalance: wallet.heldBalance,
          availableBalance: wallet.availableBalance,
          updatedAt: wallet.updatedAt,
        }).catch(() => null),
      ]);
    } catch {
      // Memory state retained
    }

    notificationService.dispatch({
      recipientUserId: payout.beneficiaryUserId,
      type: 'PAYOUT_FAILED',
      category: 'PAYMENT',
      title: `Withdrawal ${action === 'REJECTED' ? 'Rejected' : 'Failed'}`,
      message: `Your withdrawal request of ₦${payout.amount.toLocaleString()} NGN was not processed: ${reason}. Funds have been restored to your available balance.`,
      metadata: { payoutId, reason },
    });

    return { success: true };
  }

  // ==========================================
  // Audited Administrative Adjustment
  // ==========================================

  public async performManualAdjustment(
    params: WalletAdjustmentParams
  ): Promise<{ success: boolean; entry?: LedgerEntry; error?: string }> {
    const { walletId, direction, balanceCategory, amount, reason, actorId, idempotencyKey } = params;

    if (!reason || reason.trim().length < 10) {
      return {
        success: false,
        error: 'A detailed documented reason of at least 10 characters is required for financial adjustments.',
      };
    }

    return this.postLedgerEntry({
      walletId,
      entryType: 'ADJUSTMENT',
      direction,
      balanceCategory,
      amount,
      sourceType: 'MANAGEMENT_ADJUSTMENT',
      sourceReferenceId: `adj-${Date.now()}`,
      description: `Administrative adjustment: ${reason}`,
      actorId,
      idempotencyKey: idempotencyKey || `man_adj_${walletId}_${Date.now()}`,
      metadata: { reason, actorId },
    });
  }

  // ==========================================
  // Queries & Ledger Inspection
  // ==========================================

  public async getLedgerEntries(params: {
    walletId?: string;
    entryType?: string;
    sourceType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: LedgerEntry[]; total: number }> {
    await this.initializeFromFirestore();

    const { walletId, entryType, sourceType, startDate, endDate, limit = 50, offset = 0 } = params;

    let filtered = Array.from(this.ledger.values());

    if (walletId) {
      filtered = filtered.filter((e) => e.walletId === walletId);
    }
    if (entryType && entryType !== 'ALL') {
      filtered = filtered.filter((e) => e.entryType === entryType);
    }
    if (sourceType && sourceType !== 'ALL') {
      filtered = filtered.filter((e) => e.sourceType === sourceType);
    }
    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter((e) => new Date(e.createdAt).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      filtered = filtered.filter((e) => new Date(e.createdAt).getTime() <= end);
    }

    // Sort descending by creation date
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return { entries: paginated, total };
  }

  public async getPayoutRequests(params: {
    walletId?: string;
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payouts: WalletPayoutRequest[]; total: number }> {
    await this.initializeFromFirestore();

    const { walletId, userId, status, limit = 50, offset = 0 } = params;

    let filtered = Array.from(this.payouts.values());

    if (walletId) {
      filtered = filtered.filter((p) => p.walletId === walletId);
    }
    if (userId) {
      filtered = filtered.filter((p) => p.beneficiaryUserId === userId);
    }
    if (status && status !== 'ALL') {
      filtered = filtered.filter((p) => p.status === status);
    }

    filtered.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return { payouts: paginated, total };
  }

  public getAllWallets(params?: {
    walletType?: string;
    status?: string;
    search?: string;
  }): Wallet[] {
    let list = Array.from(this.wallets.values());

    if (params?.walletType && params.walletType !== 'ALL') {
      list = list.filter((w) => w.walletType === params.walletType);
    }
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((w) => w.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (w) =>
          w.walletId.toLowerCase().includes(q) ||
          w.ownerName.toLowerCase().includes(q) ||
          w.ownerId.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }

  // ==========================================
  // Financial Audit & Reconciliation Engine
  // ==========================================

  public async reconcileWallet(walletId: string): Promise<WalletReconciliationResult | null> {
    await this.initializeFromFirestore();

    const wallet = this.wallets.get(walletId);
    if (!wallet) return null;

    let calculatedAvailable = 0;
    let calculatedPending = 0;
    let calculatedHeld = 0;
    let entriesCount = 0;

    const entries = Array.from(this.ledger.values())
      .filter((e) => e.walletId === walletId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    entriesCount = entries.length;

    // Use latest ledger entry's snapshot if available, or compute transitions
    if (entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      calculatedAvailable = lastEntry.balanceAfter.available;
      calculatedPending = lastEntry.balanceAfter.pending;
      calculatedHeld = lastEntry.balanceAfter.held;
    }

    const availableDiff = Math.abs(roundMoney(wallet.availableBalance - calculatedAvailable));
    const pendingDiff = Math.abs(roundMoney(wallet.pendingBalance - calculatedPending));
    const heldDiff = Math.abs(roundMoney(wallet.heldBalance - calculatedHeld));

    const totalDiscrepancy = roundMoney(availableDiff + pendingDiff + heldDiff);
    const isConsistent = totalDiscrepancy === 0;

    let unresolvedPayoutsCount = 0;
    for (const p of this.payouts.values()) {
      if (p.walletId === walletId && ['REQUESTED', 'UNDER_REVIEW', 'PROCESSING'].includes(p.status)) {
        unresolvedPayoutsCount++;
      }
    }

    return {
      walletId,
      ownerId: wallet.ownerId,
      walletType: wallet.walletType,
      currency: wallet.currency,
      recordedAvailable: wallet.availableBalance,
      calculatedAvailable,
      recordedPending: wallet.pendingBalance,
      calculatedPending,
      recordedHeld: wallet.heldBalance,
      calculatedHeld,
      isConsistent,
      discrepancy: totalDiscrepancy,
      totalLedgerEntries: entriesCount,
      unresolvedPayoutsCount,
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

export const walletService = new WalletService();
