import React, { useState } from 'react';
import { X, Building, AlertCircle, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { Wallet, WalletPayoutRequest } from '../../types/wallet';

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '057', name: 'Zenith Bank' },
  { code: '035', name: 'Wema Bank / ALAT' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '076', name: 'Polaris Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '090267', name: 'Kuda Microfinance Bank' },
  { code: '090405', name: 'Moniepoint MFB' },
  { code: '100004', name: 'OPay Digital Services' },
  { code: '090549', name: 'Palmpay' },
  { code: '090110', name: 'VFD Microfinance Bank' },
];

interface RequestPayoutModalProps {
  wallet: Wallet;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payout: WalletPayoutRequest) => void;
  getHeaders: () => HeadersInit;
}

export const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({
  wallet,
  isOpen,
  onClose,
  onSuccess,
  getHeaders,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [bankCode, setBankCode] = useState<string>('044');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const minPayout = 5000;
  const numAmount = parseFloat(amount) || 0;
  const isAmountValid = numAmount >= minPayout && numAmount <= wallet.availableBalance;
  const isAccountValid = accountNumber.trim().length === 10 && accountName.trim().length >= 3;

  const handleMaxClick = () => {
    setAmount(wallet.availableBalance.toString());
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAmountValid) {
      if (numAmount < minPayout) {
        setError(`Minimum payout amount is ₦${minPayout.toLocaleString()} NGN.`);
      } else {
        setError(`Amount exceeds your available balance of ₦${wallet.availableBalance.toLocaleString()} NGN.`);
      }
      return;
    }

    if (!isAccountValid) {
      setError('Please provide a valid 10-digit account number and verified account name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const selectedBank = NIGERIAN_BANKS.find((b) => b.code === bankCode) || {
      name: 'Commercial Bank',
      code: bankCode,
    };

    try {
      const res = await fetch(`/api/wallets/${encodeURIComponent(wallet.walletId)}/payout`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount: numAmount,
          destination: {
            bankName: selectedBank.name,
            bankCode: selectedBank.code,
            accountNumber: accountNumber.trim(),
            accountName: accountName.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Withdrawal request failed. Please verify your details.');
      }

      onSuccess(data.payout);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during submission.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#01213D] border border-[#0682F4]/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden text-[#FFFFFF]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#08E6F9]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0682F4]/20 border border-[#0682F4]/30 flex items-center justify-center text-[#08E6F9]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">Request Bank Withdrawal</h3>
              <p className="text-xs text-[#CCD2D9]/70">Disburse verified earnings to your Nigerian bank</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#CCD2D9]/60 hover:text-[#FFFFFF] hover:bg-[#0682F4]/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Available Balance Callout */}
        <div className="my-5 p-4 rounded-xl bg-[#000000]/60 border border-[#0682F4]/30 flex items-center justify-between relative z-10">
          <div>
            <span className="text-xs text-[#CCD2D9]/70 block">Withdrawable Available Balance</span>
            <span className="text-2xl font-black text-[#08E6F9]">
              ₦{wallet.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            type="button"
            onClick={handleMaxClick}
            className="px-3 py-1.5 rounded-lg bg-[#0682F4]/20 hover:bg-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold border border-[#0682F4]/40 transition-colors cursor-pointer"
          >
            Withdraw All
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#000000]/80 border border-[#0682F4]/50 flex items-start space-x-2 text-xs text-[#CCD2D9] relative z-10">
            <AlertCircle className="w-4 h-4 text-[#08E6F9] flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Amount */}
          <div>
            <label htmlFor="payout-amount" className="block text-xs font-medium text-[#CCD2D9] mb-1">
              Withdrawal Amount (₦ NGN) <span className="text-[#08E6F9]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#CCD2D9]/50 font-bold">₦</span>
              <input
                id="payout-amount"
                type="number"
                step="any"
                min={minPayout}
                max={wallet.availableBalance}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="5,000.00"
                required
                className="w-full bg-[#000000]/80 border border-[#0682F4]/40 rounded-xl pl-8 pr-4 py-2.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9] transition-all"
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#CCD2D9]/60 mt-1">
              <span>Minimum: ₦{minPayout.toLocaleString()} NGN</span>
              <span>Available: ₦{wallet.availableBalance.toLocaleString()} NGN</span>
            </div>
          </div>

          {/* Destination Bank */}
          <div>
            <label htmlFor="payout-bank" className="block text-xs font-medium text-[#CCD2D9] mb-1">
              Destination Bank <span className="text-[#08E6F9]">*</span>
            </label>
            <select
              id="payout-bank"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="w-full bg-[#000000]/80 border border-[#0682F4]/40 rounded-xl px-3 py-2.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9] transition-all cursor-pointer"
            >
              {NIGERIAN_BANKS.map((b) => (
                <option key={b.code} value={b.code} className="bg-[#01213D] text-[#FFFFFF]">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="payout-acc-number" className="block text-xs font-medium text-[#CCD2D9] mb-1">
                Account Number (10 Digits) <span className="text-[#08E6F9]">*</span>
              </label>
              <input
                id="payout-acc-number"
                type="text"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setAccountNumber(cleaned);
                }}
                placeholder="0123456789"
                required
                className="w-full bg-[#000000]/80 border border-[#0682F4]/40 rounded-xl px-3 py-2.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9] tracking-wider transition-all"
              />
            </div>

            <div>
              <label htmlFor="payout-acc-name" className="block text-xs font-medium text-[#CCD2D9] mb-1">
                Account Name <span className="text-[#08E6F9]">*</span>
              </label>
              <input
                id="payout-acc-name"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Account Holder Legal Name"
                required
                className="w-full bg-[#000000]/80 border border-[#0682F4]/40 rounded-xl px-3 py-2.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#08E6F9] transition-all"
              />
            </div>
          </div>

          {/* Settlement Guarantee Notice */}
          <div className="p-3 rounded-xl bg-[#0682F4]/10 border border-[#0682F4]/20 flex items-start space-x-2 text-[11px] text-[#CCD2D9]/80">
            <ShieldCheck className="w-4 h-4 text-[#08E6F9] flex-shrink-0 mt-0.5" />
            <span>
              Requested funds will be locked in held balance and disbursed via Paystack direct bank transfer. Withdrawals are processed within 1 business day.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-[#0682F4]/30 text-xs font-semibold text-[#CCD2D9] hover:bg-[#0682F4]/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isAmountValid || !isAccountValid}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#000000] font-bold text-xs shadow-lg shadow-[#0682F4]/20 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#000000] border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#000000]" />
                  <span>Confirm Withdrawal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
