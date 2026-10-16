import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { WalletLayout } from './WalletLayout';
import { RequestPayoutModal } from './RequestPayoutModal';
import {
  Wallet,
  LedgerEntry,
  WalletPayoutRequest,
} from '../../types/wallet';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  ChevronRight,
  Building,
  RefreshCw,
  ExternalLink,
  FileText,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const WalletOverviewPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [recentEntries, setRecentEntries] = useState<LedgerEntry[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<WalletPayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

  const getHeaders = useCallback((): HeadersInit => {
    if (!user) return {};
    return {
      'x-user-id': user.uid,
      'x-user-role': profile?.role || 'CUSTOMER',
      'x-user-name': profile?.fullName || user.email || 'Nexovira Member',
      'Content-Type': 'application/json',
    };
  }, [user, profile]);

  const loadWalletData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/wallet/summary?userId=${encodeURIComponent(user.uid)}`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve financial wallet summary.');
      }

      const data = await res.json();
      if (data.summary) {
        const loadedWallets = data.summary.wallets || [];
        setWallets(loadedWallets);
        if (loadedWallets.length > 0) {
          setSelectedWallet(loadedWallets[0]);
        }
        setRecentEntries(data.summary.recentTransactions || []);
        setRecentPayouts(data.summary.recentPayouts || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading wallet.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user, getHeaders]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#000000] text-[#FFFFFF] flex items-center justify-center p-4">
        <div className="bg-[#01213D] border border-[#0682F4]/30 rounded-2xl p-8 max-w-md w-full text-center">
          <ShieldCheck className="w-12 h-12 text-[#08E6F9] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-sm text-[#CCD2D9]/70 mb-6">
            Please sign in to access your Nexovira Financial Wallet and earnings ledger.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#000000] font-bold text-sm cursor-pointer"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <WalletLayout
      activeTab="overview"
      wallets={wallets}
      selectedWallet={selectedWallet}
      onSelectWallet={(w) => setSelectedWallet(w)}
      onRequestPayoutClick={() => setIsPayoutModalOpen(true)}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#CCD2D9]/70">
          <RefreshCw className="w-8 h-8 text-[#08E6F9] animate-spin mb-3" />
          <p className="text-sm font-medium">Synchronizing authoritative ledger records...</p>
        </div>
      ) : error ? (
        <div className="bg-[#01213D] border border-[#0682F4]/40 rounded-2xl p-6 text-center my-8 max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-[#08E6F9] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#FFFFFF] mb-1">Ledger Notice</h3>
          <p className="text-xs text-[#CCD2D9]/80 mb-4">{error}</p>
          <button
            onClick={loadWalletData}
            className="px-4 py-2 rounded-xl bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold hover:bg-[#0682F4]/30 transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Lifetime Performance Overview */}
          {selectedWallet && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#01213D]/40 border border-[#0682F4]/20 rounded-xl p-5">
                <span className="text-xs text-[#CCD2D9]/70 block mb-1">Lifetime Credited Earnings</span>
                <span className="text-xl font-bold text-[#FFFFFF]">
                  ₦{selectedWallet.lifetimeCredited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#08E6F9] block mt-1">Verified gross earnings</span>
              </div>

              <div className="bg-[#01213D]/40 border border-[#0682F4]/20 rounded-xl p-5">
                <span className="text-xs text-[#CCD2D9]/70 block mb-1">Lifetime Disbursed Payouts</span>
                <span className="text-xl font-bold text-[#CCD2D9]">
                  ₦{selectedWallet.lifetimeDebited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#CCD2D9]/60 block mt-1">Direct to Nigerian bank</span>
              </div>

              <div className="bg-[#01213D]/40 border border-[#0682F4]/20 rounded-xl p-5">
                <span className="text-xs text-[#CCD2D9]/70 block mb-1">Account Standing</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#08E6F9]" />
                  <span className="text-base font-bold text-[#FFFFFF]">{selectedWallet.status}</span>
                </div>
                <span className="text-[10px] text-[#CCD2D9]/60 block mt-1">Full withdrawal privileges</span>
              </div>

              <div className="bg-[#01213D]/40 border border-[#0682F4]/20 rounded-xl p-5">
                <span className="text-xs text-[#CCD2D9]/70 block mb-1">Active Holds / Reservations</span>
                <span className="text-xl font-bold text-[#4DDEEA]">
                  ₦{selectedWallet.heldBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#CCD2D9]/60 block mt-1">Reserved for withdrawals</span>
              </div>
            </div>
          )}

          {/* Quick Actions & Recent Withdrawals Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Recent Transactions */}
            <div className="lg:col-span-2 bg-[#01213D]/40 border border-[#0682F4]/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#FFFFFF]">Recent Ledger Movements</h3>
                  <p className="text-xs text-[#CCD2D9]/70">Immutable double-entry transaction record</p>
                </div>
                <button
                  onClick={() => navigate('/wallet/transactions')}
                  className="text-xs font-semibold text-[#08E6F9] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>View All Ledger</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentEntries.length === 0 ? (
                <div className="text-center py-12 text-[#CCD2D9]/60 border border-dashed border-[#0682F4]/20 rounded-xl">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-[#CCD2D9]/40" />
                  <p className="text-sm font-medium">No financial movements posted yet</p>
                  <p className="text-xs text-[#CCD2D9]/40 mt-1">
                    Earnings from marketplace orders, digital downloads, and referral commissions will be logged here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEntries.map((entry) => {
                    const isCredit = entry.direction === 'CREDIT';
                    return (
                      <div
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className="bg-[#000000]/40 hover:bg-[#0682F4]/10 border border-[#0682F4]/20 hover:border-[#08E6F9]/40 rounded-xl p-4 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-3.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                              isCredit
                                ? 'bg-[#08E6F9]/10 border-[#08E6F9]/30 text-[#08E6F9]'
                                : 'bg-[#0682F4]/10 border-[#0682F4]/30 text-[#CCD2D9]'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-[#FFFFFF] group-hover:text-[#08E6F9] transition-colors">
                                {entry.description}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/30 text-[#CCD2D9]/70 font-mono">
                                {entry.entryType}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-[#CCD2D9]/60 mt-0.5">
                              <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="font-mono text-[#CCD2D9]/50">{entry.transactionId}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`text-sm font-extrabold ${
                              isCredit ? 'text-[#08E6F9]' : 'text-[#CCD2D9]'
                            }`}
                          >
                            {isCredit ? '+' : '-'}₦{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] text-[#CCD2D9]/50 block">
                            Avail: ₦{entry.balanceAfter.available.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 1 Col: Active Payouts & Settlement Policy */}
            <div className="space-y-6">
              {/* Active Payouts Status */}
              <div className="bg-[#01213D]/40 border border-[#0682F4]/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#FFFFFF]">Recent Withdrawals</h3>
                  <button
                    onClick={() => navigate('/wallet/payouts')}
                    className="text-xs font-semibold text-[#08E6F9] hover:underline flex items-center space-x-0.5 cursor-pointer"
                  >
                    <span>All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {recentPayouts.length === 0 ? (
                  <div className="text-center py-8 text-[#CCD2D9]/60 border border-dashed border-[#0682F4]/20 rounded-xl">
                    <Building className="w-6 h-6 mx-auto mb-1.5 text-[#CCD2D9]/40" />
                    <p className="text-xs font-medium">No recent payout requests</p>
                    <button
                      onClick={() => setIsPayoutModalOpen(true)}
                      className="mt-3 text-xs text-[#08E6F9] font-bold hover:underline cursor-pointer"
                    >
                      Request your first payout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPayouts.map((payout) => (
                      <div
                        key={payout.id}
                        className="bg-[#000000]/40 border border-[#0682F4]/20 rounded-xl p-3.5 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#FFFFFF]">
                            ₦{payout.amount.toLocaleString()} NGN
                          </div>
                          <span className="text-[11px] text-[#CCD2D9]/60 block">
                            {payout.destination.bankName}
                          </span>
                          <span className="text-[10px] text-[#CCD2D9]/40 font-mono">
                            {new Date(payout.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            payout.status === 'COMPLETED'
                              ? 'bg-[#08E6F9]/15 text-[#08E6F9] border border-[#08E6F9]/30'
                              : payout.status === 'REJECTED' || payout.status === 'FAILED'
                              ? 'bg-[#000000] text-[#CCD2D9] border border-[#0682F4]/40'
                              : 'bg-[#0682F4]/20 text-[#4DDEEA] border border-[#0682F4]/40 animate-pulse'
                          }`}
                        >
                          {payout.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Settlement Guarantee Notice */}
              <div className="bg-[#01213D]/20 border border-[#0682F4]/20 rounded-2xl p-5 text-xs text-[#CCD2D9]/80 space-y-3">
                <div className="flex items-center space-x-2 text-[#08E6F9] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Nexovira Financial Guarantee</span>
                </div>
                <p className="leading-relaxed">
                  Every wallet balance is continuously reconciled with authoritative transaction events. Funds are held securely in institutional settlement accounts until disbursed to your bank.
                </p>
                <div className="pt-2 border-t border-[#0682F4]/10 text-[11px] text-[#CCD2D9]/60">
                  Minimum withdrawal: ₦5,000 NGN • Direct Paystack NIP Bank Settlement
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Payout Modal */}
      {selectedWallet && (
        <RequestPayoutModal
          wallet={selectedWallet}
          isOpen={isPayoutModalOpen}
          onClose={() => setIsPayoutModalOpen(false)}
          onSuccess={() => {
            loadWalletData();
          }}
          getHeaders={getHeaders}
        />
      )}

      {/* Transaction Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#01213D] border border-[#0682F4]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#FFFFFF]">
            <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20 mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#08E6F9]" />
                <h3 className="text-base font-bold">Transaction Record</h3>
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
                <span className="text-[#CCD2D9]/60">Date & Timestamp:</span>
                <span className="text-[#FFFFFF]">{new Date(selectedEntry.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0682F4]/10">
                <span className="text-[#CCD2D9]/60">Classification:</span>
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
                <span className="text-[#CCD2D9]/60">Amount:</span>
                <span className="text-base font-black text-[#08E6F9]">
                  ₦{selectedEntry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} NGN
                </span>
              </div>
              <div className="py-2 bg-[#000000]/40 rounded-lg px-3">
                <span className="text-[#CCD2D9]/60 block mb-1">Narration:</span>
                <span className="text-[#FFFFFF] font-medium leading-relaxed">{selectedEntry.description}</span>
              </div>
              <div className="flex justify-between py-1 text-[11px] text-[#CCD2D9]/60">
                <span>Balance After:</span>
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
