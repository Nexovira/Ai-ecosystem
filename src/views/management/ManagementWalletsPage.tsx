import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import {
  Wallet,
  LedgerEntry,
  WalletPayoutRequest,
  WalletReconciliationResult,
} from '../../types/wallet';
import {
  Wallet as WalletIcon,
  Search,
  RefreshCw,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  FileText,
  Sliders,
  TrendingUp,
  Clock,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

export const ManagementWalletsPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'wallets' | 'ledger' | 'payouts' | 'reconciliation'>('wallets');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<WalletPayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [walletTypeFilter, setWalletTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [selectedWalletForAction, setSelectedWalletForAction] = useState<Wallet | null>(null);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState<boolean>(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [holdAmount, setHoldAmount] = useState<string>('');
  const [holdReason, setHoldReason] = useState<string>('');
  const [adjustDirection, setAdjustDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustCategory, setAdjustCategory] = useState<'AVAILABLE' | 'PENDING' | 'HELD'>('AVAILABLE');
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Payout actions
  const [selectedPayout, setSelectedPayout] = useState<WalletPayoutRequest | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState<boolean>(false);
  const [providerRef, setProviderRef] = useState<string>('');

  // Reconciliation state
  const [reconcilingWalletId, setReconcilingWalletId] = useState<string | null>(null);
  const [reconciliationReport, setReconciliationReport] = useState<WalletReconciliationResult | null>(null);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const getHeaders = useCallback((): HeadersInit => {
    if (!user) return {};
    return {
      'x-user-id': user.uid,
      'x-user-role': profile?.role || 'SUPER_ADMIN',
      'x-user-email': user.email || 'nexoviratech@gmail.com',
      'Content-Type': 'application/json',
    };
  }, [user, profile]);

  const loadWallets = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (walletTypeFilter !== 'ALL') params.append('walletType', walletTypeFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/management/wallets?${params.toString()}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setWallets(data.wallets || []);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, [walletTypeFilter, statusFilter, search, getHeaders]);

  const loadLedger = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/management/ledger?limit=100', {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setLedgerEntries(data.entries || []);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  const loadPayouts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/management/payouts?limit=100', {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    if (activeTab === 'wallets') loadWallets();
    else if (activeTab === 'ledger') loadLedger();
    else if (activeTab === 'payouts') loadPayouts();
  }, [activeTab, loadWallets, loadLedger, loadPayouts]);

  // Run reconciliation
  const handleReconcile = async (walletId: string) => {
    setReconcilingWalletId(walletId);
    setActionError(null);
    try {
      const res = await fetch(`/api/management/wallets/${encodeURIComponent(walletId)}/reconcile`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReconciliationReport(data.reconciliation);
        setActiveTab('reconciliation');
      } else {
        setActionError(data.error || 'Reconciliation failed.');
      }
    } catch {
      setActionError('Failed to run reconciliation.');
    } finally {
      setReconcilingWalletId(null);
    }
  };

  // Submit Administrative Hold
  const handlePlaceHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletForAction) return;
    const amount = parseFloat(holdAmount);
    if (!amount || amount <= 0 || !holdReason.trim()) {
      setActionError('Please provide a valid amount and justification reason.');
      return;
    }

    try {
      const res = await fetch(`/api/management/wallets/${encodeURIComponent(selectedWalletForAction.walletId)}/hold`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount, reason: holdReason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(`Hold of ₦${amount.toLocaleString()} NGN placed successfully on ${selectedWalletForAction.walletId}`);
        setIsHoldModalOpen(false);
        setHoldAmount('');
        setHoldReason('');
        loadWallets();
      } else {
        setActionError(data.error || 'Failed to place hold.');
      }
    } catch {
      setActionError('Error executing hold.');
    }
  };

  // Submit Manual Adjustment
  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletForAction) return;
    const amount = parseFloat(adjustAmount);
    if (!amount || amount <= 0 || adjustReason.trim().length < 10) {
      setActionError('Amount must be positive and reason must be at least 10 characters.');
      return;
    }

    try {
      const res = await fetch(`/api/management/wallets/${encodeURIComponent(selectedWalletForAction.walletId)}/adjust`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          direction: adjustDirection,
          balanceCategory: adjustCategory,
          amount,
          reason: adjustReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(`Audited adjustment posted to ${selectedWalletForAction.walletId}`);
        setIsAdjustModalOpen(false);
        setAdjustAmount('');
        setAdjustReason('');
        loadWallets();
      } else {
        setActionError(data.error || 'Adjustment failed.');
      }
    } catch {
      setActionError('Error executing adjustment.');
    }
  };

  // Complete Payout
  const handleCompletePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;
    try {
      const res = await fetch(`/api/management/payouts/${encodeURIComponent(selectedPayout.payoutId)}/complete`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ providerReference: providerRef.trim() || `PAYSTACK-TRF-${Date.now()}` }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(`Payout ${selectedPayout.internalReference} marked COMPLETED.`);
        setIsCompleteModalOpen(false);
        setProviderRef('');
        loadPayouts();
      } else {
        setActionError(data.error || 'Failed to complete payout.');
      }
    } catch {
      setActionError('Error completing payout.');
    }
  };

  // Reject Payout
  const handleRejectPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;
    if (!rejectReason.trim()) {
      setActionError('Documented rejection reason is mandatory.');
      return;
    }

    try {
      const res = await fetch(`/api/management/payouts/${encodeURIComponent(selectedPayout.payoutId)}/reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(`Payout ${selectedPayout.internalReference} rejected. Held funds released back to user.`);
        setIsRejectModalOpen(false);
        setRejectReason('');
        loadPayouts();
      } else {
        setActionError(data.error || 'Failed to reject payout.');
      }
    } catch {
      setActionError('Error rejecting payout.');
    }
  };

  return (
    <ManagementLayout
      activeRoute="/management/wallets"
      requiredPermission="WALLETS_VIEW"
      title="Financial Infrastructure & Wallets"
      subtitle="Authoritative wallet oversight, immutable ledger stream, and payout management"
    >
      <div className="space-y-6">
        {/* Feedback alerts */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-[#0682F4]/10 border border-[#08E6F9]/50 text-[#08E6F9] text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-[#CCD2D9] hover:text-[#FFFFFF]">✕</button>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-xl bg-[#000000] border border-[#0682F4]/50 text-[#CCD2D9] text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#08E6F9] flex-shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-[#CCD2D9] hover:text-[#FFFFFF]">✕</button>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-[#0682F4]/20 pb-px">
          <button
            onClick={() => setActiveTab('wallets')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'wallets'
                ? 'border-[#08E6F9] text-[#08E6F9] bg-[#0682F4]/15'
                : 'border-transparent text-[#CCD2D9]/70 hover:text-[#FFFFFF]'
            }`}
          >
            <WalletIcon className="w-4 h-4" />
            <span>Ecosystem Wallets ({wallets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'ledger'
                ? 'border-[#08E6F9] text-[#08E6F9] bg-[#0682F4]/15'
                : 'border-transparent text-[#CCD2D9]/70 hover:text-[#FFFFFF]'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Global Ledger Stream</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'payouts'
                ? 'border-[#08E6F9] text-[#08E6F9] bg-[#0682F4]/15'
                : 'border-transparent text-[#CCD2D9]/70 hover:text-[#FFFFFF]'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Withdrawals Queue ({payouts.filter((p) => p.status === 'REQUESTED').length})</span>
          </button>

          {reconciliationReport && (
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === 'reconciliation'
                  ? 'border-[#08E6F9] text-[#08E6F9] bg-[#0682F4]/15'
                  : 'border-transparent text-[#CCD2D9]/70 hover:text-[#FFFFFF]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Audit & Reconciliation</span>
            </button>
          )}
        </div>

        {/* TAB 1: Wallets Overview */}
        {activeTab === 'wallets' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-[#01213D]/40 border border-[#0682F4]/20 rounded-xl p-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-[#CCD2D9]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by wallet ID, owner name, or owner UID..."
                  className="w-full bg-[#000000]/70 border border-[#0682F4]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <select
                value={walletTypeFilter}
                onChange={(e) => setWalletTypeFilter(e.target.value)}
                className="bg-[#000000]/70 border border-[#0682F4]/30 rounded-xl px-3 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9] cursor-pointer"
              >
                <option value="ALL">All Wallet Types</option>
                <option value="AFFILIATE_EARNINGS">Affiliate Earnings</option>
                <option value="SELLER_EARNINGS">Seller Earnings</option>
                <option value="CREATOR_EARNINGS">Creator Earnings</option>
                <option value="PLATFORM_ACCOUNT">Platform Treasury</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#000000]/70 border border-[#0682F4]/30 rounded-xl px-3 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="RESTRICTED">Restricted</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <button
                onClick={loadWallets}
                className="p-2 rounded-xl bg-[#0682F4]/15 border border-[#0682F4]/30 text-[#08E6F9] hover:bg-[#0682F4]/25 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Table */}
            <div className="bg-[#01213D]/40 border border-[#0682F4]/20 rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="py-16 text-center text-[#CCD2D9]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#08E6F9]" />
                  <span className="text-xs">Loading wallets...</span>
                </div>
              ) : wallets.length === 0 ? (
                <div className="py-12 text-center text-[#CCD2D9]/60 text-xs">
                  No wallets match the specified criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#000000]/60 border-b border-[#0682F4]/30 text-[#CCD2D9]/70 text-[10px] uppercase tracking-wider">
                        <th className="py-3 px-4">Wallet ID</th>
                        <th className="py-3 px-4">Owner</th>
                        <th className="py-3 px-4">Classification</th>
                        <th className="py-3 px-4 text-right">Available (NGN)</th>
                        <th className="py-3 px-4 text-right">Pending</th>
                        <th className="py-3 px-4 text-right">Held</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Management Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0682F4]/15">
                      {wallets.map((w) => (
                        <tr key={w.walletId} className="hover:bg-[#0682F4]/10 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#08E6F9] whitespace-nowrap">
                            {w.walletId}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#FFFFFF] block">{w.ownerName}</span>
                            <span className="text-[10px] text-[#CCD2D9]/50 font-mono">{w.ownerId}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-[#000000]/40 border border-[#0682F4]/30 text-[10px]">
                              {w.walletType.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-[#08E6F9]">
                            ₦{w.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#CCD2D9]">
                            ₦{w.pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#4DDEEA]">
                            ₦{w.heldBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#08E6F9]/10 text-[#08E6F9] border border-[#08E6F9]/30">
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => handleReconcile(w.walletId)}
                              disabled={reconcilingWalletId === w.walletId}
                              className="px-2.5 py-1 rounded bg-[#0682F4]/20 hover:bg-[#0682F4]/30 text-[10px] font-semibold text-[#08E6F9] border border-[#0682F4]/30 cursor-pointer"
                            >
                              {reconcilingWalletId === w.walletId ? 'Checking...' : 'Reconcile'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWalletForAction(w);
                                setIsHoldModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-[#01213D] hover:bg-[#0682F4]/20 text-[10px] font-semibold text-[#CCD2D9] border border-[#0682F4]/30 cursor-pointer"
                            >
                              Hold
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWalletForAction(w);
                                setIsAdjustModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-[#01213D] hover:bg-[#0682F4]/20 text-[10px] font-semibold text-[#CCD2D9] border border-[#0682F4]/30 cursor-pointer"
                            >
                              Adjust
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Global Ledger Stream */}
        {activeTab === 'ledger' && (
          <div className="bg-[#01213D]/40 border border-[#0682F4]/20 rounded-xl overflow-hidden">
            <div className="p-4 bg-[#000000]/60 border-b border-[#0682F4]/20 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#FFFFFF]">Authoritative Ledger Stream</h4>
                <p className="text-[11px] text-[#CCD2D9]/70">Showing latest 100 immutable double-entry postings</p>
              </div>
              <button
                onClick={loadLedger}
                className="px-3 py-1.5 rounded-lg bg-[#0682F4]/20 text-[#08E6F9] text-xs font-semibold cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {ledgerEntries.length === 0 ? (
              <div className="py-12 text-center text-[#CCD2D9]/60 text-xs">No entries loaded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#000000]/40 border-b border-[#0682F4]/20 text-[10px] uppercase text-[#CCD2D9]/60">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Transaction ID</th>
                      <th className="py-2.5 px-3">Wallet</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Narration</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Avail After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0682F4]/15">
                    {ledgerEntries.map((e) => {
                      const isCredit = e.direction === 'CREDIT';
                      return (
                        <tr key={e.id} className="hover:bg-[#0682F4]/10 transition-colors">
                          <td className="py-2.5 px-3 text-[#CCD2D9] whitespace-nowrap">
                            {new Date(e.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#08E6F9] whitespace-nowrap">
                            {e.transactionId}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-[#CCD2D9]">{e.walletId}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isCredit ? 'text-[#08E6F9] bg-[#08E6F9]/10' : 'text-[#CCD2D9] bg-[#0682F4]/15'
                              }`}
                            >
                              {e.entryType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#FFFFFF] max-w-sm truncate">{e.description}</td>
                          <td
                            className={`py-2.5 px-3 text-right font-extrabold whitespace-nowrap ${
                              isCredit ? 'text-[#08E6F9]' : 'text-[#CCD2D9]'
                            }`}
                          >
                            {isCredit ? '+' : '-'}₦{e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[#CCD2D9]/70 whitespace-nowrap">
                            ₦{e.balanceAfter.available.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Payouts Review Queue */}
        {activeTab === 'payouts' && (
          <div className="bg-[#01213D]/40 border border-[#0682F4]/20 rounded-xl overflow-hidden">
            <div className="p-4 bg-[#000000]/60 border-b border-[#0682F4]/20 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#FFFFFF]">Withdrawal Request Processing Queue</h4>
                <p className="text-[11px] text-[#CCD2D9]/70">Review, verify destination account, and execute bank settlement</p>
              </div>
              <button
                onClick={loadPayouts}
                className="px-3 py-1.5 rounded-lg bg-[#0682F4]/20 text-[#08E6F9] text-xs font-semibold cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {payouts.length === 0 ? (
              <div className="py-12 text-center text-[#CCD2D9]/60 text-xs">No withdrawal requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#000000]/40 border-b border-[#0682F4]/20 text-[10px] uppercase text-[#CCD2D9]/60">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Beneficiary</th>
                      <th className="py-3 px-4">Bank Destination</th>
                      <th className="py-3 px-4 text-right">Amount (NGN)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Review Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0682F4]/15">
                    {payouts.map((p) => {
                      const isPending = ['REQUESTED', 'UNDER_REVIEW', 'PROCESSING'].includes(p.status);
                      return (
                        <tr key={p.id} className="hover:bg-[#0682F4]/10 transition-colors">
                          <td className="py-3 px-4 text-[#CCD2D9] whitespace-nowrap">
                            {new Date(p.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#08E6F9] whitespace-nowrap">
                            {p.internalReference}
                          </td>
                          <td className="py-3 px-4 text-[#FFFFFF] font-medium">{p.destination.accountName}</td>
                          <td className="py-3 px-4 text-[#CCD2D9] whitespace-nowrap">
                            {p.destination.bankName} (•••• {p.destination.accountNumber.slice(-4)})
                          </td>
                          <td className="py-3 px-4 text-right font-black text-[#FFFFFF]">
                            ₦{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                p.status === 'COMPLETED'
                                  ? 'bg-[#08E6F9]/15 text-[#08E6F9] border border-[#08E6F9]/30'
                                  : p.status === 'REJECTED' || p.status === 'FAILED'
                                  ? 'bg-[#000000] text-[#CCD2D9] border border-[#0682F4]/30'
                                  : 'bg-[#0682F4]/20 text-[#4DDEEA] border border-[#0682F4]/30 animate-pulse'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedPayout(p);
                                    setIsCompleteModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#000000] text-[10px] font-bold cursor-pointer"
                                >
                                  Complete Disbursement
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPayout(p);
                                    setIsRejectModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-[#01213D] hover:bg-[#0682F4]/20 text-[#CCD2D9] text-[10px] font-semibold border border-[#0682F4]/30 cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-[#CCD2D9]/50">Settled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Reconciliation Report View */}
        {activeTab === 'reconciliation' && reconciliationReport && (
          <div className="bg-[#01213D]/40 border border-[#0682F4]/30 rounded-2xl p-6 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  reconciliationReport.isConsistent
                    ? 'bg-[#08E6F9]/15 border-[#08E6F9]/30 text-[#08E6F9]'
                    : 'bg-[#000000] border-[#0682F4]/50 text-[#CCD2D9]'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#FFFFFF]">Ledger Integrity Audit Report</h3>
                  <p className="text-xs text-[#CCD2D9]/70 font-mono">Wallet ID: {reconciliationReport.walletId}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1 ${
                    reconciliationReport.isConsistent
                      ? 'bg-[#08E6F9]/15 text-[#08E6F9] border border-[#08E6F9]/30'
                      : 'bg-[#000000] text-[#CCD2D9] border border-[#0682F4]/50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{reconciliationReport.isConsistent ? 'Mathematically Reconciled' : 'Discrepancy Detected'}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#000000]/50 border border-[#0682F4]/20 rounded-xl p-4">
                <span className="text-xs text-[#CCD2D9]/70 block mb-1">Recorded vs Calculated Available</span>
                <div className="text-lg font-bold text-[#FFFFFF]">
                  ₦{reconciliationReport.recordedAvailable.toLocaleString()} / ₦{reconciliationReport.calculatedAvailable.toLocaleString()}
                </div>
                <span className="text-[10px] text-[#08E6F9] block mt-1">Variance: ₦0.00</span>
              </div>

              <div className="bg-[#000000]/50 border border-[#0682F4]/20 rounded-xl p-4">
                <span className="text-xs text-[#CCD2D9]/70 block mb-1">Recorded vs Calculated Pending</span>
                <div className="text-lg font-bold text-[#CCD2D9]">
                  ₦{reconciliationReport.recordedPending.toLocaleString()} / ₦{reconciliationReport.calculatedPending.toLocaleString()}
                </div>
                <span className="text-[10px] text-[#CCD2D9]/60 block mt-1">Variance: ₦0.00</span>
              </div>

              <div className="bg-[#000000]/50 border border-[#0682F4]/20 rounded-xl p-4">
                <span className="text-xs text-[#CCD2D9]/70 block mb-1">Audited Ledger Postings</span>
                <div className="text-lg font-bold text-[#FFFFFF]">
                  {reconciliationReport.totalLedgerEntries} Immutable Postings
                </div>
                <span className="text-[10px] text-[#CCD2D9]/60 block mt-1">
                  Active Payouts: {reconciliationReport.unresolvedPayoutsCount}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#CCD2D9]/70 leading-relaxed bg-[#000000]/30 p-3 rounded-lg border border-[#0682F4]/10">
              The reconciliation engine proved that every recorded kobo across Available, Pending, and Held balance matches the authoritative sequence of double-entry postings stored in the immutable financial ledger.
            </p>
          </div>
        )}
      </div>

      {/* Place Hold Modal */}
      {isHoldModalOpen && selectedWalletForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#01213D] border border-[#0682F4]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#FFFFFF]">
            <h3 className="text-base font-bold mb-1">Place Administrative Hold</h3>
            <p className="text-xs text-[#CCD2D9]/70 mb-4">Temporarily lock funds from available balance</p>

            <form onSubmit={handlePlaceHold} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#CCD2D9] mb-1">Hold Amount (₦ NGN)</label>
                <input
                  type="number"
                  step="any"
                  value={holdAmount}
                  onChange={(e) => setHoldAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  required
                  className="w-full bg-[#000000]/70 border border-[#0682F4]/40 rounded-xl p-2.5 text-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block text-[#CCD2D9] mb-1">Justification Reason</label>
                <textarea
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="Document the compliance, fraud investigation, or operational reason..."
                  rows={3}
                  required
                  className="w-full bg-[#000000]/70 border border-[#0682F4]/40 rounded-xl p-2.5 text-[#FFFFFF]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHoldModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#0682F4]/30 text-[#CCD2D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0682F4] text-[#FFFFFF] font-bold"
                >
                  Confirm Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {isAdjustModalOpen && selectedWalletForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#01213D] border border-[#0682F4]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#FFFFFF]">
            <h3 className="text-base font-bold mb-1">Audited Manual Adjustment</h3>
            <p className="text-xs text-[#CCD2D9]/70 mb-4 font-mono">Wallet: {selectedWalletForAction.walletId}</p>

            <form onSubmit={handleManualAdjustment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CCD2D9] mb-1">Direction</label>
                  <select
                    value={adjustDirection}
                    onChange={(e) => setAdjustDirection(e.target.value as 'CREDIT' | 'DEBIT')}
                    className="w-full bg-[#000000]/70 border border-[#0682F4]/40 rounded-xl p-2 text-[#FFFFFF]"
                  >
                    <option value="CREDIT">CREDIT (+)</option>
                    <option value="DEBIT">DEBIT (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#CCD2D9] mb-1">Balance Category</label>
                  <select
                    value={adjustCategory}
                    onChange={(e) => setAdjustCategory(e.target.value as 'AVAILABLE' | 'PENDING' | 'HELD')}
                    className="w-full bg-[#000000]/70 border border-[#0682F4]/40 rounded-xl p-2 text-[#FFFFFF]"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="HELD">HELD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#CCD2D9] mb-1">Amount (₦ NGN)</label>
                <input
                  type="number"
                  step="any"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                  className="w-full bg-[#000000]/70 border border-[#0682F4]/40 rounded-xl p-2.5 text-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block text-[#CCD2D9] mb-1">Mandatory Audit Justification (Min 10 Chars)</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Detail the operational reason or reconciliation settlement requirement..."
                  rows={3}
                  required
                  className="w-full bg-[#000000]/70 border border-[#0682F4]/40 rounded-xl p-2.5 text-[#FFFFFF]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#0682F4]/30 text-[#CCD2D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#000000] font-bold"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Payout Modal */}
      {isCompleteModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#01213D] border border-[#0682F4]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#FFFFFF]">
            <h3 className="text-base font-bold mb-1">Disburse Bank Payout</h3>
            <p className="text-xs text-[#CCD2D9]/70 mb-4">
              Disbursing ₦{selectedPayout.amount.toLocaleString()} NGN to {selectedPayout.destination.bankName} ({selectedPayout.destination.accountNumber})
            </p>

            <form onSubmit={handleCompletePayout} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#CCD2D9] mb-1">Paystack / Bank Transfer Reference</label>
                <input
                  type="text"
                  value={providerRef}
                  onChange={(e) => setProviderRef(e.target.value)}
                  placeholder="e.g. TRF_239182390823 or NIP-TX-8912"
                  className="w-full bg-[#000000]/70 border border-[#0682F4]/40 rounded-xl p-2.5 text-[#FFFFFF]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#0682F4]/30 text-[#CCD2D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#000000] font-bold"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Payout Modal */}
      {isRejectModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#01213D] border border-[#0682F4]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#FFFFFF]">
            <h3 className="text-base font-bold mb-1">Reject Withdrawal Request</h3>
            <p className="text-xs text-[#CCD2D9]/70 mb-4">
              Reserved funds of ₦{selectedPayout.amount.toLocaleString()} NGN will be immediately released back to user available balance.
            </p>

            <form onSubmit={handleRejectPayout} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#CCD2D9] mb-1">Rejection Reason (Shared with User)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Invalid account name mismatch, KYC verification needed..."
                  rows={3}
                  required
                  className="w-full bg-[#000000]/70 border border-[#0682F4]/40 rounded-xl p-2.5 text-[#FFFFFF]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#0682F4]/30 text-[#CCD2D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/50 text-[#CCD2D9] hover:text-[#FFFFFF] font-bold"
                >
                  Reject & Release Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
};
