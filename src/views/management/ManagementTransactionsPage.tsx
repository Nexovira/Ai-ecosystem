import React, { useState, useEffect, useCallback } from 'react';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import {
  UnifiedTransaction,
  JournalEntry,
  EcosystemReconciliationReport,
  TransactionType,
  TransactionStatus,
  TransactionSourceSystem,
} from '../../types/transaction';
import {
  Receipt,
  Search,
  RefreshCw,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Scale,
  FileText,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Filter,
} from 'lucide-react';

export const ManagementTransactionsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();

  const [activeTab, setActiveTab] = useState<'transactions' | 'journal' | 'reconciliation'>('transactions');

  // Transactions State
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [txTotal, setTxTotal] = useState<number>(0);
  const [loadingTx, setLoadingTx] = useState<boolean>(true);
  const [searchTx, setSearchTx] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<UnifiedTransaction | null>(null);

  // Journal State
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loadingJournal, setLoadingJournal] = useState<boolean>(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);

  // Reconciliation State
  const [reconciliationReport, setReconciliationReport] = useState<EcosystemReconciliationReport | null>(null);
  const [loadingReconciliation, setLoadingReconciliation] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState<boolean>(false);
  const [refundOrderId, setRefundOrderId] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundSubmitting, setRefundSubmitting] = useState<boolean>(false);
  const [refundFeedback, setRefundFeedback] = useState<string | null>(null);

  const getHeaders = useCallback((): HeadersInit => {
    if (!user) return {};
    return {
      'x-user-id': user.uid,
      'x-user-role': profile?.role || 'SUPER_ADMIN',
      'Content-Type': 'application/json',
    };
  }, [user, profile]);

  // Load Transactions
  const loadTransactions = useCallback(async () => {
    try {
      setLoadingTx(true);
      setError(null);
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchTx) params.append('search', searchTx);

      const res = await fetch(`/api/management/transactions?${params.toString()}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load management transactions');
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTxTotal(data.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching transactions';
      setError(msg);
    } finally {
      setLoadingTx(false);
    }
  }, [getHeaders, typeFilter, statusFilter, searchTx]);

  // Load Journal Entries
  const loadJournal = useCallback(async () => {
    try {
      setLoadingJournal(true);
      setError(null);
      const res = await fetch('/api/management/accounting/journal', {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load accounting journal');
      const data = await res.json();
      setJournalEntries(data.entries || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching journal entries';
      setError(msg);
    } finally {
      setLoadingJournal(false);
    }
  }, [getHeaders]);

  // Run Reconciliation
  const runReconciliation = useCallback(async () => {
    try {
      setLoadingReconciliation(true);
      setError(null);
      const res = await fetch('/api/management/accounting/reconcile', {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to execute reconciliation analysis');
      const data = await res.json();
      setReconciliationReport(data.report || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing reconciliation';
      setError(msg);
    } finally {
      setLoadingReconciliation(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    } else if (activeTab === 'journal') {
      loadJournal();
    } else if (activeTab === 'reconciliation' && !reconciliationReport) {
      runReconciliation();
    }
  }, [activeTab, loadTransactions, loadJournal, runReconciliation, reconciliationReport]);

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrderId || !refundReason) return;
    try {
      setRefundSubmitting(true);
      setRefundFeedback(null);
      const res = await fetch(`/api/management/orders/${encodeURIComponent(refundOrderId)}/refund`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          reason: refundReason,
          refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Refund execution failed');
      }

      setRefundFeedback('Refund executed successfully with ledger and journal entries.');
      setTimeout(() => {
        setRefundModalOpen(false);
        setRefundOrderId('');
        setRefundReason('');
        setRefundAmount('');
        setRefundFeedback(null);
        loadTransactions();
        if (reconciliationReport) runReconciliation();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing refund';
      setRefundFeedback(`Error: ${msg}`);
    } finally {
      setRefundSubmitting(false);
    }
  };

  return (
    <ManagementLayout
      activeRoute="/management/transactions"
      requiredPermission="TRANSACTIONS_VIEW"
      title="Financial Transactions & Accounting Foundation"
      subtitle="Unified cross-ecosystem transactions, double-entry accounting journal, and reconciliation engine."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefundModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#01213D] hover:bg-red-500/20 text-red-300 border border-red-500/40 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>Process Refund</span>
          </button>
          <button
            onClick={() => {
              if (activeTab === 'transactions') loadTransactions();
              if (activeTab === 'journal') loadJournal();
              if (activeTab === 'reconciliation') runReconciliation();
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Tab Switcher */}
      <div className="flex border-b border-[#0682F4]/30 gap-2 mb-6">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'transactions'
              ? 'border-[#08E6F9] text-[#08E6F9]'
              : 'border-transparent text-[#CCD2D9] hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Unified Transactions ({txTotal})</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'journal'
              ? 'border-[#08E6F9] text-[#08E6F9]'
              : 'border-transparent text-[#CCD2D9] hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Accounting Journal ({journalEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'reconciliation'
              ? 'border-[#08E6F9] text-[#08E6F9]'
              : 'border-transparent text-[#CCD2D9] hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Ecosystem Reconciliation</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: UNIFIED TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 flex flex-wrap gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#CCD2D9]/60" />
              <input
                type="text"
                placeholder="Search transaction ID, order ref, provider ref..."
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-xs text-white placeholder-[#CCD2D9]/50 focus:outline-none focus:border-[#08E6F9]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-xs text-white focus:outline-none focus:border-[#08E6F9]"
              >
                <option value="">All Types</option>
                <option value="ORDER_PAYMENT">Order Payment</option>
                <option value="REFUND">Refund</option>
                <option value="SALE">Sale</option>
                <option value="COMMISSION">Commission</option>
                <option value="WALLET_CREDIT">Wallet Credit</option>
                <option value="WALLET_DEBIT">Wallet Debit</option>
                <option value="PAYOUT">Payout</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-xs text-white focus:outline-none focus:border-[#08E6F9]"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="POSTED">Posted</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REVERSED">Reversed</option>
              </select>

              <button
                onClick={loadTransactions}
                className="px-3 py-2 rounded-lg bg-[#0682F4]/20 hover:bg-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold border border-[#08E6F9]/40 transition cursor-pointer flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Apply</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/30 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#01213D] text-[#CCD2D9]/70 uppercase font-mono tracking-wider border-b border-[#0682F4]/30">
                  <tr>
                    <th className="py-3 px-4">Transaction Reference</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">System</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Order / Source</th>
                    <th className="py-3 px-4">Journal Voucher</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0682F4]/10">
                  {loadingTx ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#CCD2D9]/60">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#08E6F9]" />
                        Loading unified transactions...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#CCD2D9]/60">
                        <Receipt className="w-8 h-8 mx-auto mb-2 text-[#0682F4]/40" />
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#01213D]/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-white">{tx.transactionReference}</div>
                          <div className="text-[10px] font-mono text-[#CCD2D9]/50">{tx.transactionId}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#08E6F9]">{tx.transactionType}</td>
                        <td className="py-3.5 px-4 text-[#CCD2D9]/80 font-mono text-[11px]">{tx.sourceSystem}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white text-sm">
                            ₦{tx.amount.toLocaleString()} {tx.currency}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              tx.status === 'COMPLETED' || tx.status === 'POSTED'
                                ? 'bg-[#0682F4]/20 text-[#08E6F9] border-[#08E6F9]/40'
                                : tx.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-red-500/10 text-red-300 border-red-500/30'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#CCD2D9]">
                          {tx.orderReference || `${tx.sourceEntityType}: ${tx.sourceEntityId}`}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#08E6F9]">
                          {tx.journalEntryId || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-[#CCD2D9]/70 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="px-2.5 py-1 rounded bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Audit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNTING JOURNAL */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#08E6F9]" />
              <div>
                <h3 className="text-sm font-bold text-white">General Double-Entry Journal</h3>
                <p className="text-[11px] text-[#CCD2D9]/70">
                  Authoritative balanced vouchers. Total Debits strictly equal Total Credits for every voucher.
                </p>
              </div>
            </div>
            <button
              onClick={loadJournal}
              className="px-3 py-1.5 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingJournal ? 'animate-spin' : ''}`} />
              <span>Refresh Journal</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/30 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#01213D] text-[#CCD2D9]/70 uppercase font-mono tracking-wider border-b border-[#0682F4]/30">
                  <tr>
                    <th className="py-3 px-4">Journal Voucher</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Source Transaction</th>
                    <th className="py-3 px-4">Total Debit</th>
                    <th className="py-3 px-4">Total Credit</th>
                    <th className="py-3 px-4">Balanced</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Posted At</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0682F4]/10">
                  {loadingJournal ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#CCD2D9]/60">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#08E6F9]" />
                        Loading accounting journal...
                      </td>
                    </tr>
                  ) : journalEntries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#CCD2D9]/60">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-[#0682F4]/40" />
                        No journal vouchers posted yet.
                      </td>
                    </tr>
                  ) : (
                    journalEntries.map((j) => (
                      <tr key={j.id} className="hover:bg-[#01213D]/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">{j.journalReference}</td>
                        <td className="py-3.5 px-4 text-[#CCD2D9] max-w-xs truncate">{j.description}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#08E6F9]">{j.sourceTransactionId}</td>
                        <td className="py-3.5 px-4 font-bold text-white">₦{j.totalDebit.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-bold text-white">₦{j.totalCredit.toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          {j.isBalanced ? (
                            <span className="text-[#08E6F9] flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5" /> Unbalanced
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#0682F4]/20 text-[#08E6F9] border border-[#08E6F9]/40">
                            {j.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#CCD2D9]/70 whitespace-nowrap">
                          {new Date(j.postedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedJournal(j)}
                            className="px-2.5 py-1 rounded bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Voucher</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#0682F4]/20 text-[#08E6F9]">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ecosystem Financial Reconciliation Engine</h3>
                <p className="text-xs text-[#CCD2D9]/70">
                  Cross-checks internal payment records against provider settlements, journal invariants, and wallet ledger integrity.
                </p>
              </div>
            </div>

            <button
              onClick={runReconciliation}
              disabled={loadingReconciliation}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#08E6F9] hover:bg-[#08E6F9]/90 transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#08E6F9]/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReconciliation ? 'animate-spin' : ''}`} />
              Run Full Audit
            </button>
          </div>

          {reconciliationReport && (
            <div className="space-y-6">
              {/* Report Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 space-y-1">
                  <div className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase">Reconciliation Status</div>
                  <div className="text-lg font-black flex items-center gap-1.5">
                    {reconciliationReport.status === 'CLEAN' ? (
                      <span className="text-[#08E6F9] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> CLEAN AUDIT
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> DISCREPANCIES FOUND
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#CCD2D9]/50 font-mono">Report: {reconciliationReport.reportId}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 space-y-1">
                  <div className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase">Gateway vs Internal Volume</div>
                  <div className="text-lg font-black text-white">
                    ₦{reconciliationReport.totalGatewayVerifiedVolume.toLocaleString()} NGN
                  </div>
                  <div className="text-[10px] text-[#08E6F9] font-mono">Volume Variance: ₦{reconciliationReport.volumeDiscrepancy}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 space-y-1">
                  <div className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase">Active Wallet Liabilities</div>
                  <div className="text-lg font-black text-white">
                    ₦{reconciliationReport.totalWalletBalances.available.toLocaleString()} NGN
                  </div>
                  <div className="text-[10px] text-[#CCD2D9]/60 font-mono">
                    Pending: ₦{reconciliationReport.totalWalletBalances.pending.toLocaleString()} · Held: ₦{reconciliationReport.totalWalletBalances.held.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 space-y-1">
                  <div className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase">Pending Payouts Reserved</div>
                  <div className="text-lg font-black text-amber-300">
                    ₦{reconciliationReport.payoutsPendingVolume.toLocaleString()} NGN
                  </div>
                  <div className="text-[10px] text-[#CCD2D9]/60 font-mono">
                    {reconciliationReport.payoutsPendingSettlement} withdrawal requests in queue
                  </div>
                </div>
              </div>

              {/* Discrepancies Listing */}
              <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/30 overflow-hidden p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Audit Discrepancy Findings ({reconciliationReport.discrepancies.length})</span>
                  </h4>
                </div>

                {reconciliationReport.discrepancies.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-center text-[#CCD2D9]/70 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-[#08E6F9] mx-auto mb-2" />
                    No financial discrepancies detected. All general ledger entries, wallet sums, and payment records are fully balanced.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reconciliationReport.discrepancies.map((d) => (
                      <div
                        key={d.discrepancyId}
                        className="p-4 rounded-xl bg-[#01213D] border border-amber-500/30 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-300">{d.type}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {d.severity}
                            </span>
                          </div>
                          <p className="text-[#CCD2D9]">{d.description}</p>
                          <div className="text-[10px] font-mono text-[#CCD2D9]/60">
                            Source: {d.sourceEntity} ({d.sourceEntityId})
                          </div>
                        </div>
                        <div className="text-right font-mono text-[11px] text-[#CCD2D9]">
                          <div>Expected: {d.expectedValue}</div>
                          <div className="text-amber-400">Actual: {d.actualValue}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-[#011B33] border border-[#0682F4]/50 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/30 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#08E6F9]" />
                <h3 className="text-base font-bold text-white">Transaction Audit Record</h3>
              </div>
              <button onClick={() => setSelectedTx(null)} className="text-[#CCD2D9]/70 hover:text-white p-1 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#CCD2D9]/70">Amount</div>
                  <div className="text-xl font-extrabold text-white">
                    ₦{selectedTx.amount.toLocaleString()} {selectedTx.currency}
                  </div>
                </div>
                <div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#0682F4]/20 text-[#08E6F9] border border-[#08E6F9]/40">
                    {selectedTx.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#000000]/40 border border-[#0682F4]/20">
                  <span className="text-[10px] text-[#CCD2D9]/60 uppercase font-mono block">Transaction ID</span>
                  <span className="font-mono font-bold text-white break-all">{selectedTx.transactionId}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#000000]/40 border border-[#0682F4]/20">
                  <span className="text-[10px] text-[#CCD2D9]/60 uppercase font-mono block">Type</span>
                  <span className="font-bold text-[#08E6F9]">{selectedTx.transactionType}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#000000]/40 border border-[#0682F4]/20 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Source System:</span>
                  <span className="font-semibold text-white">{selectedTx.sourceSystem}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Source Entity:</span>
                  <span className="font-mono text-white">{selectedTx.sourceEntityType}: {selectedTx.sourceEntityId}</span>
                </div>
                {selectedTx.orderReference && (
                  <div className="flex justify-between">
                    <span className="text-[#CCD2D9]/70">Order Reference:</span>
                    <span className="font-mono font-bold text-[#08E6F9]">{selectedTx.orderReference}</span>
                  </div>
                )}
                {selectedTx.paymentProvider && (
                  <div className="flex justify-between">
                    <span className="text-[#CCD2D9]/70">Payment Gateway:</span>
                    <span className="font-semibold text-white">{selectedTx.paymentProvider}</span>
                  </div>
                )}
                {selectedTx.journalEntryId && (
                  <div className="flex justify-between">
                    <span className="text-[#CCD2D9]/70">Journal Voucher ID:</span>
                    <span className="font-mono text-[#08E6F9]">{selectedTx.journalEntryId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Idempotency Guard:</span>
                  <span className="font-mono text-[11px] text-[#CCD2D9]/80 break-all">{selectedTx.idempotencyKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Created:</span>
                  <span className="text-white">{new Date(selectedTx.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Journal Voucher Modal */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-[#011B33] border border-[#0682F4]/50 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/30 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#08E6F9]" />
                <h3 className="text-base font-bold text-white">Double-Entry Journal Voucher: {selectedJournal.journalReference}</h3>
              </div>
              <button onClick={() => setSelectedJournal(null)} className="text-[#CCD2D9]/70 hover:text-white p-1 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-[#01213D] border border-[#0682F4]/30 flex justify-between items-center">
                <div>
                  <div className="text-[11px] text-[#CCD2D9]/70">Description</div>
                  <div className="font-bold text-white">{selectedJournal.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[#CCD2D9]/70">Source Transaction</div>
                  <div className="font-mono text-[#08E6F9]">{selectedJournal.sourceTransactionId}</div>
                </div>
              </div>

              {/* Journal Lines Table */}
              <div className="rounded-xl border border-[#0682F4]/20 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#01213D] text-[#CCD2D9]/70 uppercase font-mono tracking-wider border-b border-[#0682F4]/20">
                    <tr>
                      <th className="py-2.5 px-3">Account</th>
                      <th className="py-2.5 px-3">Line Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (₦)</th>
                      <th className="py-2.5 px-3 text-right">Credit (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0682F4]/10 bg-[#000000]/40">
                    {selectedJournal.lines.map((line, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-white">{line.accountId}</div>
                          <div className="text-[10px] text-[#CCD2D9]/60">{line.accountName}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[#CCD2D9]">{line.description || '—'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          {line.debit > 0 ? `₦${line.debit.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          {line.credit > 0 ? `₦${line.credit.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#01213D] font-bold border-t border-[#0682F4]/30">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3 text-white">Total</td>
                      <td className="py-2.5 px-3 text-right text-[#08E6F9] font-mono">
                        ₦{selectedJournal.totalDebit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#08E6F9] font-mono">
                        ₦{selectedJournal.totalCredit.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#CCD2D9]/70 pt-1">
                <span>Posted At: {new Date(selectedJournal.postedAt).toLocaleString()}</span>
                <span>Created By: {selectedJournal.createdBy}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedJournal(null)}
                className="px-4 py-2 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Refund Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#011B33] border border-red-500/50 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/30 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Authorized Refund Execution</h3>
              </div>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="text-[#CCD2D9]/70 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4 text-xs">
              <p className="text-[#CCD2D9]/80">
                Executing a refund automatically reverses merchant wallet credits and posts balanced double-entry accounting journal clawbacks.
              </p>

              <div>
                <label className="block text-[#CCD2D9] font-semibold mb-1">Target Order ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ord-172864-..."
                  value={refundOrderId}
                  onChange={(e) => setRefundOrderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-[#CCD2D9] font-semibold mb-1">
                  Refund Amount in NGN (Optional — leave blank for full remaining refund)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 5000"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-[#CCD2D9] font-semibold mb-1">Documented Justification Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State clear operational reason for refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              {refundFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs ${
                    refundFeedback.startsWith('Error')
                      ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                      : 'bg-[#0682F4]/20 border border-[#08E6F9]/40 text-[#08E6F9]'
                  }`}
                >
                  {refundFeedback}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundSubmitting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {refundSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Execute Refund</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
};
