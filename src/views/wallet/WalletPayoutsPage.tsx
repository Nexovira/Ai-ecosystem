import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WalletLayout } from './WalletLayout';
import { RequestPayoutModal } from './RequestPayoutModal';
import { Wallet, WalletPayoutRequest } from '../../types/wallet';
import {
  Building,
  RefreshCw,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const WalletPayoutsPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [payouts, setPayouts] = useState<WalletPayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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
        const list = data.wallets || [];
        setWallets(list);
        if (list.length > 0 && !selectedWallet) {
          setSelectedWallet(list[0]);
        }
      }
    } catch {
      // Ignored
    }
  }, [user, getHeaders, selectedWallet]);

  const loadPayouts = useCallback(async () => {
    if (!selectedWallet) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(
        `/api/wallets/${encodeURIComponent(selectedWallet.walletId)}/payouts?${params.toString()}`,
        { headers: getHeaders() }
      );

      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, [selectedWallet, statusFilter, getHeaders]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  useEffect(() => {
    if (selectedWallet) {
      loadPayouts();
    }
  }, [selectedWallet, loadPayouts]);

  return (
    <WalletLayout
      activeTab="payouts"
      wallets={wallets}
      selectedWallet={selectedWallet}
      onSelectWallet={(w) => setSelectedWallet(w)}
      onRequestPayoutClick={() => setIsModalOpen(true)}
    >
      <div className="space-y-6">
        {/* Header Actions Card */}
        <div className="bg-[#01213D]/40 border border-[#0682F4]/30 rounded-2xl p-6 backdrop-blur-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#FFFFFF]">Withdrawal Requests & History</h3>
            <p className="text-xs text-[#CCD2D9]/70">Track bank disbursements and settlement outcomes</p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#000000]/70 border border-[#0682F4]/30 rounded-xl px-3 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="FAILED">Failed</option>
            </select>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#000000] font-bold text-xs shadow-lg shadow-[#0682F4]/20 hover:opacity-95 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Withdrawal</span>
            </button>
          </div>
        </div>

        {/* Payouts List Table */}
        <div className="bg-[#01213D]/40 border border-[#0682F4]/20 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-[#CCD2D9]/70">
              <RefreshCw className="w-8 h-8 text-[#08E6F9] animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading withdrawal records...</p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-16 text-center text-[#CCD2D9]/60">
              <Building className="w-10 h-10 mx-auto mb-3 text-[#CCD2D9]/30" />
              <p className="text-sm font-semibold text-[#FFFFFF]">No withdrawal records found</p>
              <p className="text-xs text-[#CCD2D9]/50 mt-1">
                You can request a withdrawal to your Nigerian bank once you meet the minimum available balance of ₦5,000 NGN.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#000000]/60 border-b border-[#0682F4]/30 text-[#CCD2D9]/70 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Requested At</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Bank Destination</th>
                    <th className="py-3 px-4">Account Holder</th>
                    <th className="py-3 px-4 text-right">Amount (NGN)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0682F4]/15">
                  {payouts.map((p) => {
                    const isCompleted = p.status === 'COMPLETED';
                    const isFailed = p.status === 'FAILED' || p.status === 'REJECTED';
                    return (
                      <tr key={p.id} className="hover:bg-[#0682F4]/10 transition-colors">
                        <td className="py-3.5 px-4 text-[#CCD2D9] whitespace-nowrap">
                          {new Date(p.requestedAt).toLocaleDateString()}
                          <span className="text-[10px] text-[#CCD2D9]/40 block">
                            {new Date(p.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#08E6F9] whitespace-nowrap">
                          {p.internalReference}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-[#FFFFFF]">{p.destination.bankName}</span>
                          <span className="text-[10px] text-[#CCD2D9]/60 block font-mono">
                            •••• {p.destination.accountNumber.slice(-4)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#CCD2D9] max-w-xs truncate">
                          {p.destination.accountName}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-[#FFFFFF] whitespace-nowrap">
                          ₦{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-[#08E6F9]/15 text-[#08E6F9] border border-[#08E6F9]/30'
                                : isFailed
                                ? 'bg-[#000000] text-[#CCD2D9] border border-[#0682F4]/40'
                                : 'bg-[#0682F4]/20 text-[#4DDEEA] border border-[#0682F4]/40 animate-pulse'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-[#CCD2D9]/70 max-w-xs truncate">
                          {p.rejectionReason || p.failureReason || (p.completedAt ? `Completed on ${new Date(p.completedAt).toLocaleDateString()}` : 'Queued for processing')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedWallet && (
        <RequestPayoutModal
          wallet={selectedWallet}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            loadPayouts();
          }}
          getHeaders={getHeaders}
        />
      )}
    </WalletLayout>
  );
};
