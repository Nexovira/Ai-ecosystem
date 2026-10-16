import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { useCommerce } from '../../context/CommerceContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';
import { Order, PaymentVerifyResponse } from '../../types/commerce';

export const OrderConfirmationPage: React.FC = () => {
  const { verifyPayment } = useCommerce();
  const { formatPrice, clearCart } = useMarketplace();
  const { navigate } = useRouter();

  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState<PaymentVerifyResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function executeVerification() {
      if (typeof window === 'undefined') return;

      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference') || urlParams.get('trxref') || '';
      const orderId = urlParams.get('orderId') || '';

      if (!reference) {
        setVerifying(false);
        setErrorMessage('No payment reference found in callback parameters.');
        return;
      }

      setVerifying(true);
      const verifyRes = await verifyPayment(reference, orderId);

      if (isCancelled) return;

      setResult(verifyRes);
      setVerifying(false);

      if (verifyRes.success) {
        clearCart();
      } else {
        setErrorMessage(verifyRes.error || 'Payment verification could not be completed.');
      }
    }

    executeVerification();

    return () => {
      isCancelled = true;
    };
  }, [verifyPayment, clearCart]);

  // Loading State during verification
  if (verifying) {
    return (
      <div className="py-28 bg-[#01213D] min-h-[85vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-10 sm:p-14 text-center max-w-lg mx-auto space-y-6 shadow-2xl">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-[#0682F4]/20 border-t-[#08E6F9] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-[#08E6F9]">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-[#08E6F9] uppercase tracking-widest">
                Gateway Handshake
              </div>
              <h2 className="font-display font-extrabold text-2xl text-white">
                VERIFYING PAYMENT SETTLEMENT
              </h2>
              <p className="text-xs sm:text-sm text-[#CCD2D9]/80 leading-relaxed">
                Communicating with the payment provider to authenticate the transaction, confirm funds, and deduct stock.
              </p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Payment Failed or Rejected
  if (!result?.success || errorMessage) {
    return (
      <div className="py-20 sm:py-28 bg-[#01213D] min-h-[85vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-red-500/40 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-2xl animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#011629] border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
              <XCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-red-400 uppercase tracking-widest">
                Transaction Status
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                PAYMENT UNSUCCESSFUL
              </h1>
              <p className="text-xs sm:text-sm text-[#CCD2D9] leading-relaxed">
                {errorMessage || 'The payment gateway could not verify the transaction. No funds were debited, and order inventory was not deducted.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/checkout')}
                fullWidth
                className="text-xs sm:text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Payment</span>
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/marketplace')}
                fullWidth
                className="text-xs sm:text-sm"
              >
                <span>Return to Marketplace</span>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Payment Verified & Confirmed
  const order: Order | undefined = result.order;

  return (
    <div className="py-14 sm:py-20 bg-[#01213D] min-h-screen">
      <Container size="narrow">
        <div className="space-y-8 animate-in fade-in">
          
          {/* Header Card */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-8 sm:p-10 text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#0682F4]/15 blur-[60px] rounded-full pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-[#01213D] border border-[#08E6F9] flex items-center justify-center text-[#08E6F9] mx-auto shadow-lg shadow-[#08E6F9]/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-[#08E6F9] uppercase tracking-widest">
                Payment Verified · Transaction Settled
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                ORDER CONFIRMED
              </h1>
              <p className="text-xs sm:text-sm text-[#CCD2D9]/80 max-w-md mx-auto leading-relaxed">
                Your order has been successfully confirmed. A receipt record has been created in your customer ledger.
              </p>
            </div>

            {/* Reference Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/40 font-mono text-xs text-white">
              <span className="text-[#CCD2D9]">Order Ref:</span>
              <span className="text-[#08E6F9] font-bold">{result.orderReference}</span>
            </div>

            {result.isTestMode && (
              <div className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-lg max-w-sm mx-auto">
                Test Sandbox Environment Mode Verified
              </div>
            )}
          </div>

          {/* Purchased Items Card */}
          {order && (
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[#08E6F9]" />
                  <h3 className="font-display font-bold text-base text-white">Purchased Items</h3>
                </div>
                <span className="text-xs font-mono text-[#CCD2D9]">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.orderItemId}
                    className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-[#011629] overflow-hidden shrink-0 border border-[#0682F4]/20">
                        {item.imageSnapshot ? (
                          <img
                            src={item.imageSnapshot}
                            alt={item.productNameSnapshot}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-[#CCD2D9]/40">
                            Item
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs font-semibold text-white truncate">
                          {item.productNameSnapshot}
                        </div>
                        <div className="text-[11px] font-mono text-[#CCD2D9]/70">
                          SKU: {item.skuSnapshot} · Qty: {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-xs font-bold text-white">
                      {formatPrice(item.itemTotal, item.currency)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Coordinates & Financial Summary */}
              <div className="pt-4 border-t border-[#0682F4]/20 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                {/* Delivery Target */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-mono text-[#08E6F9] font-bold uppercase tracking-wider">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Delivery Address</span>
                  </div>
                  <div className="text-white font-medium">{order.deliveryInfo.fullName}</div>
                  <div className="text-[#CCD2D9]/80 leading-relaxed">
                    {order.deliveryInfo.address}, {order.deliveryInfo.city}, {order.deliveryInfo.state}, {order.deliveryInfo.country}
                  </div>
                  <div className="text-[#CCD2D9]/70 font-mono text-[11px]">{order.deliveryInfo.phoneNumber}</div>
                </div>

                {/* Amount Ledger */}
                <div className="space-y-2 bg-[#01213D] p-3.5 rounded-xl border border-[#0682F4]/20 font-mono">
                  <div className="flex justify-between text-[#CCD2D9]">
                    <span>Subtotal:</span>
                    <span className="text-white">{formatPrice(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-[#CCD2D9]">
                    <span>Delivery Fee:</span>
                    <span className="text-white">{formatPrice(order.deliveryFee, order.currency)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#0682F4]/20 flex justify-between items-baseline font-bold text-sm">
                    <span className="text-white">Amount Paid:</span>
                    <span className="text-[#08E6F9]">{formatPrice(order.total, order.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/account/orders')}
              fullWidth
              className="text-xs sm:text-sm"
            >
              <span>View Order in Account</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/marketplace')}
              fullWidth
              className="text-xs sm:text-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Button>
          </div>

        </div>
      </Container>
    </div>
  );
};
