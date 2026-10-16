import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import {
  Wallet as WalletIcon,
  ArrowUpDown,
  Building,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Clock,
  Lock,
} from 'lucide-react';
import { Wallet } from '../../types/wallet';

interface WalletLayoutProps {
  children: React.ReactNode;
  activeTab: 'overview' | 'transactions' | 'payouts';
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  onSelectWallet: (wallet: Wallet) => void;
  onRequestPayoutClick?: () => void;
}

export const WalletLayout: React.FC<WalletLayoutProps> = ({
  children,
  activeTab,
  wallets,
  selectedWallet,
  onSelectWallet,
  onRequestPayoutClick,
}) => {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-xs text-[#CCD2D9]/70 mb-6">
          <button
            onClick={() => navigate('/')}
            className="hover:text-[#08E6F9] transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-[#CCD2D9]/40" />
          <button
            onClick={() => navigate('/account')}
            className="hover:text-[#08E6F9] transition-colors cursor-pointer"
          >
            Account
          </button>
          <ChevronRight className="w-3 h-3 text-[#CCD2D9]/40" />
          <span className="text-[#08E6F9] font-medium">Financial Wallet</span>
        </div>

        {/* Top Header Card */}
        <div className="bg-[#01213D]/60 border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#0682F4]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#08E6F9]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0682F4] to-[#08E6F9] p-0.5 flex items-center justify-center shadow-lg shadow-[#0682F4]/20">
                  <div className="w-full h-full bg-[#01213D] rounded-[10px] flex items-center justify-center">
                    <WalletIcon className="w-5 h-5 text-[#08E6F9]" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#FFFFFF] via-[#CCD2D9] to-[#08E6F9] bg-clip-text text-transparent">
                    Nexovira Financial Wallet
                  </h1>
                  <div className="flex items-center space-x-2 text-xs text-[#CCD2D9]/70 mt-0.5">
                    <span className="inline-flex items-center space-x-1 text-[#08E6F9] bg-[#0682F4]/15 px-2 py-0.5 rounded border border-[#0682F4]/30 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Immutable Financial Ledger</span>
                    </span>
                    <span>•</span>
                    <span>Primary Settlement Currency: NGN (₦)</span>
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#CCD2D9]/80 max-w-2xl mt-2 leading-relaxed">
                Centralized financial management for your verified earnings, referral commissions, and digital product sales across the Nexovira ecosystem.
              </p>
            </div>

            {/* Wallet Selector & Primary Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {wallets.length > 1 && (
                <div className="relative">
                  <label htmlFor="wallet-selector" className="text-[10px] text-[#CCD2D9]/60 uppercase tracking-wider block mb-1">
                    Active Account
                  </label>
                  <select
                    id="wallet-selector"
                    value={selectedWallet?.walletId || ''}
                    onChange={(e) => {
                      const found = wallets.find((w) => w.walletId === e.target.value);
                      if (found) onSelectWallet(found);
                    }}
                    className="bg-[#000000]/80 border border-[#0682F4]/40 rounded-xl px-3 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9] transition-all cursor-pointer"
                  >
                    {wallets.map((w) => (
                      <option key={w.walletId} value={w.walletId} className="bg-[#01213D] text-[#FFFFFF]">
                        {w.walletType.replace(/_/g, ' ')} ({w.currency})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {onRequestPayoutClick && (
                <button
                  onClick={onRequestPayoutClick}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#000000] font-bold text-sm shadow-lg shadow-[#0682F4]/30 hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Building className="w-4 h-4 text-[#000000]" />
                  <span>Request Withdrawal</span>
                </button>
              )}
            </div>
          </div>

          {/* Balance Cards Summary Banner */}
          {selectedWallet && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#0682F4]/20">
              {/* Available */}
              <div className="bg-[#000000]/50 border border-[#0682F4]/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-xs text-[#CCD2D9]/70 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#08E6F9]" />
                    <span>Available Balance</span>
                  </div>
                  <div className="text-2xl font-black text-[#FFFFFF] tracking-tight">
                    ₦{selectedWallet.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-[#08E6F9] font-medium">Eligible for instant withdrawal</span>
                </div>
              </div>

              {/* Pending */}
              <div className="bg-[#000000]/50 border border-[#0682F4]/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-xs text-[#CCD2D9]/70 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#4DDEEA]" />
                    <span>Pending Earnings</span>
                  </div>
                  <div className="text-2xl font-black text-[#CCD2D9] tracking-tight">
                    ₦{selectedWallet.pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-[#CCD2D9]/60">Awaiting maturity / order fulfillment</span>
                </div>
              </div>

              {/* Held */}
              <div className="bg-[#000000]/50 border border-[#0682F4]/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-xs text-[#CCD2D9]/70 mb-1">
                    <Lock className="w-3.5 h-3.5 text-[#26B2E2]" />
                    <span>Reserved / Held</span>
                  </div>
                  <div className="text-2xl font-black text-[#CCD2D9] tracking-tight">
                    ₦{selectedWallet.heldBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-[#CCD2D9]/60">Processing withdrawals or risk holds</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-[#0682F4]/20 pb-px mb-8">
          <button
            onClick={() => navigate('/wallet')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-xl text-sm font-semibold transition-all cursor-pointer border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#08E6F9] text-[#08E6F9] bg-[#0682F4]/10'
                : 'border-transparent text-[#CCD2D9]/70 hover:text-[#FFFFFF] hover:bg-[#0682F4]/5'
            }`}
          >
            <WalletIcon className="w-4 h-4" />
            <span>Overview & Activity</span>
          </button>

          <button
            onClick={() => navigate('/wallet/transactions')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-xl text-sm font-semibold transition-all cursor-pointer border-b-2 ${
              activeTab === 'transactions'
                ? 'border-[#08E6F9] text-[#08E6F9] bg-[#0682F4]/10'
                : 'border-transparent text-[#CCD2D9]/70 hover:text-[#FFFFFF] hover:bg-[#0682F4]/5'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Transaction Ledger</span>
          </button>

          <button
            onClick={() => navigate('/wallet/payouts')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-xl text-sm font-semibold transition-all cursor-pointer border-b-2 ${
              activeTab === 'payouts'
                ? 'border-[#08E6F9] text-[#08E6F9] bg-[#0682F4]/10'
                : 'border-transparent text-[#CCD2D9]/70 hover:text-[#FFFFFF] hover:bg-[#0682F4]/5'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Withdrawals & Payouts</span>
          </button>
        </div>

        {/* Main View Body */}
        {children}
      </main>

      <Footer />
    </div>
  );
};
