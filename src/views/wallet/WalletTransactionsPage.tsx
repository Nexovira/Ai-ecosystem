import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WalletLayout } from './WalletLayout';
import { Wallet, LedgerEntry } from '../../types/wallet';
import {
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const WalletTransactionsPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [entryType, setEntryType] = useState<string>('ALL');
  const [sourceType, setSourceType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  const getHeaders = useCallback((): HeadersInit => {
    if (!user) return {};
    return {
      'x-user-id': user.uid,
      'x-user-role': profile?.role || 'CUSTOMER',
      'x-user-name': profile?.fullName || user.email || 'Nexovira Member',
      'Content-Type': 'application/json',
    };
  }, [user, profile]);

  const loadWallets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/wallets?userId=${encodeURIComponent(user.uid)}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const loadedWallets = data.wallets || [];
        setWallets(loadedWallets);
        if (loadedWallets.length > 0 && !selectedWallet) {
          setSelectedWallet(loadedWallets[0]);
        }
      }
    } catch {
      // Ignored
    }
  }, [user, getHeaders, selectedWallet]);

  const loadTransactions = useCallback(async () => {
    if (!selectedWallet) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (entryType !== 'ALL') params.append('entryType', entryType);
      if (sourceType !== 'ALL') params.append('sourceType', sourceType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', pageSize.toString());
      params.append('offset', ((page - 1) * pageSize).toString());

      const res = await fetch(
        `/api/wallets/${encodeURIComponent(selectedWallet.walletId)}/ledger?${params.toString()}`,
        { headers: getHeaders() }
      );

      if (res.ok) {
        const data = await res.json();
        let list: LedgerEntry[] = data.entries || [];

        // Client-side search filter for description / transaction ID
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(
            (e) =>
              e.transactionId.toLowerCase().includes(q) ||
              e.description.toLowerCase().includes(q) ||
              e.sourceReferenceId.toLowerCase().includes(q)
          );
        }

        setEntries(list);
        setTotal(data.total || 0);
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  }, [selectedWallet, entryType, sourceType, startDate, endDate, page, search, getHeaders]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  useEffect(() => {
    if (selectedWallet) {
      loadTransactions();
    }
  }, [selectedWallet, loadTransactions]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const exportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['Transaction ID', 'Date', 'Type', 'Direction', 'Source', 'Amount (NGN)', 'Description'];
    const rows = entries.map((e) => [
      e.transactionId,
      new Date(e.createdAt).toISOString(),
      e.entryType,
      e.direction,
      e.sourceType,
      e.amount,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexovira_ledger_${selectedWallet?.walletId || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <WalletLayout
      activeTab="transactions"
      wallets={wallets}
      selectedWallet={selectedWallet}
      onSelectWallet={(w) => {
        setSelectedWallet(w);
        setPage(1);
      }}
    >
      <div className="space-y-6">
        {/* Filter & Search Header */}
        <div className="bg-[#01213D]/40 border border-[#0682F4]/30 rounded-2xl p-5 backdrop-blur-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#CCD2D9]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transaction reference, description, or order ID..."
                className="w-full bg-[#000000]/70 border border-[#0682F4]/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9] transition-all"
              />
            </div>

            {/* Export & Refresh Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={loadTransactions}
                className="px-3.5 py-2.5 rounded-xl border border-[#0682F4]/30 bg-[#0682F4]/10 hover:bg-[#0682F4]/20 text-xs font-semibold text-[#08E6F9] transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportCSV}
                className="px-3.5 py-2.5 rounded-xl border border-[#0682F4]/30 bg-[#0682F4]/10 hover:bg-[#0682F4]/20 text-xs font-semibold text-[#CCD2D9] hover:text-[#FFFFFF] transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#0682F4]/15">
            <div>
              <label className="text-[10px] text-[#CCD2D9]/60 uppercase tracking-wider block mb-1">
                Entry Type
              </label>
              <select
                value={entryType}
                onChange={(e) => {
                  setEntryType(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#000000]/70 border border-[#0682F4]/30 rounded-xl px-2.5 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9] cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="CREDIT">Credits</option>
                <option value="DEBIT">Debits</option>
                <option value="HOLD">Holds</option>
                <option value="RELEASE">Releases</option>
                <option value="PAYOUT">Payouts</option>
                <option value="REVERSAL">Reversals</option>
                <option value="ADJUSTMENT">Adjustments</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#CCD2D9]/60 uppercase tracking-wider block mb-1">
                Source Category
              </label>
              <select
                value={sourceType}
                onChange={(e) => {
                  setSourceType(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#000000]/70 border border-[#0682F4]/30 rounded-xl px-2.5 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9] cursor-pointer"
              >
                <option value="ALL">All Sources</option>
                <option value="COMMISSION">Referral Commissions</option>
                <option value="ORDER_SALE">Marketplace Orders</option>
                <option value="DIGITAL_SALE">Digital Product Sales</option>
                <option value="PAYOUT_REQUEST">Payout Requests</option>
                <option value="PAYOUT_COMPLETED">Disbursements</option>
                <option value="REFUND_ADJUSTMENT">Refunds / Reversals</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#CCD2D9]/60 uppercase tracking-wider block mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#000000]/70 border border-[#0682F4]/30 rounded-xl px-2.5 py-1.5 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9]"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#CCD2D9]/60 uppercase tracking-wider block mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#000000]/70 border border-[#0682F4]/30 rounded-xl px-2.5 py-1.5 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9]"
              />
            </div>
          </div>
        </div>

        {/* Transactions Ledger Table */}
        <div className="bg-[#01213D]/40 border border-[#0682F4]/20 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-[#CCD2D9]/70">
              <RefreshCw className="w-8 h-8 text-[#08E6F9] animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading transaction ledger...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-[#CCD2D9]/60">
              <FileText className="w-10 h-10 mx-auto mb-3 text-[#CCD2D9]/30" />
              <p className="text-sm font-semibold text-[#FFFFFF]">No transactions match your search filter</p>
              <p className="text-xs text-[#CCD2D9]/50 mt-1">Try clearing filters or date ranges.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#000000]/60 border-b border-[#0682F4]/30 text-[#CCD2D9]/70 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount (NGN)</th>
                    <th className="py-3 px-4 text-right">Balance Snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0682F4]/15">
                  {entries.map((entry) => {
                    const isCredit = entry.direction === 'CREDIT';
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className="hover:bg-[#0682F4]/10 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 text-[#CCD2D9] whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleDateString()}
                          <span className="text-[10px] text-[#CCD2D9]/40 block">
                            {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#08E6F9] group-hover:underline whitespace-nowrap">
                          {entry.transactionId}
                        </td>
                        <td className="py-3.5 px-4 text-[#FFFFFF] max-w-xs truncate font-medium">
                          {entry.description}
                        </td>
                        <td className="py-3.5 px-4 text-[#CCD2D9]/80 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-[#000000]/40 border border-[#0682F4]/20 text-[10px]">
                            {entry.sourceType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCredit
                                ? 'bg-[#08E6F9]/10 text-[#08E6F9] border border-[#08E6F9]/30'
                                : 'bg-[#0682F4]/10 text-[#CCD2D9] border border-[#0682F4]/30'
                            }`}
                          >
                            {entry.entryType}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-extrabold whitespace-nowrap ${
                            isCredit ? 'text-[#08E6F9]' : 'text-[#CCD2D9]'
                          }`}
                        >
                          {isCredit ? '+' : '-'}₦{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-[11px] text-[#CCD2D9]/70">
                          ₦{entry.balanceAfter.available.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 bg-[#000000]/60 border-t border-[#0682F4]/20 flex items-center justify-between text-xs text-[#CCD2D9]">
              <span>
                Page {page} of {totalPages} ({total} Total Records)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-[#0682F4]/30 bg-[#0682F4]/10 hover:bg-[#0682F4]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-[#0682F4]/30 bg-[#0682F4]/10 hover:bg-[#0682F4]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#01213D] border border-[#0682F4]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#FFFFFF]">
            <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20 mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#08E6F9]" />
                <h3 className="text-base font-bold">Ledger Transaction Entry</h3>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-[#CCD2D9]/60 hover:text-[#FFFFFF] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#0682F4]/10">
                <span className="text-[#CCD2D9]/60">Reference ID:</span>
                <span className="font-mono text-[#08E6F9] font-bold">{selectedEntry.transactionId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0682F4]/10">
                <span className="text-[#CCD2D9]/60">Date:</span>
                <span className="text-[#FFFFFF]">{new Date(selectedEntry.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0682F4]/10">
                <span className="text-[#CCD2D9]/60">Type & Direction:</span>
                <span className="font-bold text-[#FFFFFF]">{selectedEntry.entryType} ({selectedEntry.direction})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0682F4]/10">
                <span className="text-[#CCD2D9]/60">Source Event:</span>
                <span className="text-[#CCD2D9]">{selectedEntry.sourceType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0682F4]/10">
                <span className="text-[#CCD2D9]/60">Source Reference:</span>
                <span className="font-mono text-[#CCD2D9]">{selectedEntry.sourceReferenceId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0682F4]/10">
                <span className="text-[#CCD2D9]/60">Idempotency Guard:</span>
                <span className="font-mono text-[10px] text-[#CCD2D9]/50 truncate max-w-[200px]">{selectedEntry.idempotencyKey}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0682F4]/10">
                <span className="text-[#CCD2D9]/60">Amount:</span>
                <span className="text-base font-black text-[#08E6F9]">
                  ₦{selectedEntry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} NGN
                </span>
              </div>
              <div className="py-2.5 bg-[#000000]/40 rounded-lg px-3">
                <span className="text-[#CCD2D9]/60 block mb-1">Narration:</span>
                <span className="text-[#FFFFFF] font-medium leading-relaxed">{selectedEntry.description}</span>
              </div>
              <div className="flex justify-between py-1 text-[11px] text-[#CCD2D9]/60">
                <span>Resulting Balances:</span>
                <span>Avail: ₦{selectedEntry.balanceAfter.available.toLocaleString()} • Pend: ₦{selectedEntry.balanceAfter.pending.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-xl bg-[#0682F4]/20 hover:bg-[#0682F4]/30 text-[#08E6F9] text-xs font-bold border border-[#0682F4]/40 transition-colors cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </WalletLayout>
  );
};
