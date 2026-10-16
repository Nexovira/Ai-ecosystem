import React, { useEffect, useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface PaymentRecord {
  paymentId: string;
  orderId: string;
  orderReference: string;
  paymentReference: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  provider: string;
  paymentStatus: string;
  createdAt: string;
}

export const ManagementPaymentsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPayments = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/management/payments', {
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch payments');
      }

      let list: PaymentRecord[] = data.payments || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (p) =>
            p.paymentReference?.toLowerCase().includes(q) ||
            p.orderReference?.toLowerCase().includes(q) ||
            p.customerEmail?.toLowerCase().includes(q)
        );
      }

      if (providerFilter !== 'ALL') {
        list = list.filter((p) => p.provider === providerFilter);
      }

      if (statusFilter !== 'ALL') {
        list = list.filter((p) => p.paymentStatus === statusFilter);
      }

      setPayments(list);
      setTotal(list.length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading payments';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user, profile, providerFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const formatNaira = (amount: number) => `₦${(amount || 0).toLocaleString()} NGN`;

  const totalVolume = payments
    .filter((p) => p.paymentStatus === 'SUCCESS')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <ManagementLayout
      activeRoute="/management/payments"
      requiredPermission="PAYMENTS_VIEW"
      title="Financial Transactions &amp; Gateway Audit Desk"
      subtitle="Authoritative transaction receipts across Paystack, Flutterwave, Stripe, and Direct Gateways."
      actions={
        <button
          onClick={fetchPayments}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger ({total})
        </button>
      }
    >
      {/* Financial KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-1">
          <span className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase tracking-wider block">
            Settled Transaction Volume
          </span>
          <div className="text-2xl font-black text-white">{formatNaira(totalVolume)}</div>
          <span className="text-[10px] text-emerald-400 font-semibold block">Confirmed Received</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-1">
          <span className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase tracking-wider block">
            Total Transaction Records
          </span>
          <div className="text-2xl font-black text-white">{total}</div>
          <span className="text-[10px] text-[#08E6F9] font-semibold block">Ecosystem Orders</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-1">
          <span className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase tracking-wider block">
            Success Rate
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {total > 0
              ? `${Math.round((payments.filter((p) => p.paymentStatus === 'SUCCESS').length / total) * 100)}%`
              : '100%'}
          </div>
          <span className="text-[10px] text-[#CCD2D9]/60 block font-mono">Gateway Verification</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#CCD2D9]/60" />
          <input
            type="text"
            placeholder="Search ref, order, or customer email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#CCD2D9]/70">Provider:</span>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
            >
              <option value="ALL">All Gateways</option>
              <option value="PAYSTACK">PAYSTACK</option>
              <option value="FLUTTERWAVE">FLUTTERWAVE</option>
              <option value="STRIPE">STRIPE</option>
              <option value="MOCK">TEST GATEWAY</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#CCD2D9]/70">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#CCD2D9]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#08E6F9]" />
            Loading transaction ledger...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#CCD2D9]/60">
            No transaction records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#01213D] border-b border-[#0682F4]/20 text-[#CCD2D9] font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3">Tx Reference &amp; Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Order Link</th>
                  <th className="px-4 py-3">Gateway</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0682F4]/10 text-white">
                {payments.map((p) => (
                  <tr key={p.paymentId || p.paymentReference} className="hover:bg-[#01213D]/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white font-mono text-xs flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#08E6F9]" />
                        {p.paymentReference || p.paymentId}
                      </div>
                      <div className="text-[10px] text-[#CCD2D9]/50 font-mono mt-0.5">
                        {new Date(p.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-white">{p.customerEmail}</div>
                      <div className="text-[10px] text-[#CCD2D9]/50 font-mono">ID: {p.customerId}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => navigate('/management/orders')}
                        className="font-mono text-[11px] text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {p.orderReference}
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9]">
                        {p.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs">{formatNaira(p.amount)}</div>
                      <div className="text-[10px] text-[#CCD2D9]/60 font-mono">{p.currency}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.paymentStatus === 'SUCCESS'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : p.paymentStatus === 'REFUNDED'
                            ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                            : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
};
