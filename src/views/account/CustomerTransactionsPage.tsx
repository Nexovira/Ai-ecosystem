import React, { useState, useEffect, useCallback } from 'react';
import { AccountLayout } from '../../components/account/AccountLayout';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { UnifiedTransaction, TransactionType, TransactionStatus } from '../../types/transaction';
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Eye,
  X,
  CreditCard,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const CustomerTransactionsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();

  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<UnifiedTransaction | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('userId', user.uid);
      if (selectedType) params.append('type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (search) params.append('search', search);

      const res = await fetch(`/api/transactions?${params.toString()}`, {
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile?.role || 'CUSTOMER',
        },
      });

      if (!res.ok) throw new Error('Failed to retrieve financial transactions');
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching transaction records';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, profile, selectedType, selectedStatus, search]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'COMPLETED':
      case 'POSTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#0682F4]/20 text-[#08E6F9] border border-[#08E6F9]/40">
            <CheckCircle2 className="w-3 h-3 text-[#08E6F9]" />
            {status}
          </span>
        );
      case 'PENDING':
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            {status}
          </span>
        );
      case 'FAILED':
      case 'CANCELLED':
      case 'REVERSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-500/10 text-red-300 border border-red-500/30">
            <AlertCircle className="w-3 h-3 text-red-400" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#01213D] text-[#CCD2D9] border border-[#0682F4]/30">
            {status}
          </span>
        );
    }
  };

  return (
    <AccountLayout
      activeTab="transactions"
      title="Financial Transactions"
      subtitle="Authoritative log of payments, purchases, refunds, and financial adjustments."
    >
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#CCD2D9]/60" />
            <input
              type="text"
              placeholder="Search reference or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-xs text-white placeholder-[#CCD2D9]/50 focus:outline-none focus:border-[#08E6F9]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-xs text-white focus:outline-none focus:border-[#08E6F9]"
            >
              <option value="">All Types</option>
              <option value="ORDER_PAYMENT">Order Payment</option>
              <option value="REFUND">Refund</option>
              <option value="SALE">Sale Earning</option>
              <option value="COMMISSION">Affiliate Commission</option>
              <option value="PAYOUT">Payout</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-xs text-white focus:outline-none focus:border-[#08E6F9]"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REVERSED">Reversed</option>
            </select>

            <button
              onClick={loadTransactions}
              className="px-3 py-2 rounded-lg bg-[#0682F4]/20 hover:bg-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold border border-[#08E6F9]/40 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Transactions Table */}
        <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/30 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#01213D] text-[#CCD2D9]/70 uppercase font-mono tracking-wider border-b border-[#0682F4]/30">
                <tr>
                  <th className="py-3 px-4">Transaction Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Linked Entity</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0682F4]/10">
                {loading && transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#CCD2D9]/60">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#08E6F9]" />
                      Loading financial records...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#CCD2D9]/60">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-[#0682F4]/40" />
                      No financial transactions matching your query.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#01213D]/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-white">{tx.transactionReference}</div>
                        <div className="text-[10px] font-mono text-[#CCD2D9]/50">{tx.transactionId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#08E6F9]">{tx.transactionType.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white text-sm">
                          ₦{tx.amount.toLocaleString()} {tx.currency}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(tx.status)}</td>
                      <td className="py-3.5 px-4">
                        {tx.orderReference ? (
                          <button
                            onClick={() => navigate(`/account/orders/${tx.orderId || ''}`)}
                            className="text-[#08E6F9] hover:underline flex items-center gap-1 font-mono cursor-pointer"
                          >
                            <span>{tx.orderReference}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : tx.sourceEntityType ? (
                          <span className="text-[#CCD2D9]/70 font-mono text-[11px]">
                            {tx.sourceEntityType}: {tx.sourceEntityId}
                          </span>
                        ) : (
                          <span className="text-[#CCD2D9]/40">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#CCD2D9]/70 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-2.5 py-1 rounded bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
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

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-[#011B33] border border-[#0682F4]/50 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/30 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#08E6F9]" />
                <h3 className="text-base font-bold text-white">Transaction Voucher</h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-[#CCD2D9]/70 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#CCD2D9]/70">Amount Transacted</div>
                  <div className="text-xl font-extrabold text-white">
                    ₦{selectedTx.amount.toLocaleString()} {selectedTx.currency}
                  </div>
                </div>
                <div>{getStatusBadge(selectedTx.status)}</div>
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
                {selectedTx.orderReference && (
                  <div className="flex justify-between">
                    <span className="text-[#CCD2D9]/70">Linked Order:</span>
                    <span className="font-mono font-bold text-[#08E6F9]">{selectedTx.orderReference}</span>
                  </div>
                )}
                {selectedTx.paymentProvider && (
                  <div className="flex justify-between">
                    <span className="text-[#CCD2D9]/70">Gateway Provider:</span>
                    <span className="font-semibold text-white">{selectedTx.paymentProvider}</span>
                  </div>
                )}
                {selectedTx.journalEntryId && (
                  <div className="flex justify-between">
                    <span className="text-[#CCD2D9]/70">Accounting Voucher:</span>
                    <span className="font-mono text-[#08E6F9]">{selectedTx.journalEntryId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Created:</span>
                  <span className="text-white">{new Date(selectedTx.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {selectedTx.metadata && Object.keys(selectedTx.metadata).length > 0 && (
                <div className="p-3 rounded-lg bg-[#000000]/40 border border-[#0682F4]/20">
                  <span className="text-[10px] text-[#CCD2D9]/60 uppercase font-mono block mb-1">Audit Details</span>
                  <pre className="text-[11px] font-mono text-[#CCD2D9] overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedTx.metadata, null, 2)}
                  </pre>
                </div>
              )}
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
    </AccountLayout>
  );
};
