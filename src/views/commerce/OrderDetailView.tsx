import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Lock,
  Star,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useCommerce } from '../../context/CommerceContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';
import { Order } from '../../types/commerce';

interface OrderDetailViewProps {
  orderId: string;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ orderId }) => {
  const { user, profile } = useAuth();
  const { fetchMyOrders } = useCommerce();
  const { formatPrice } = useMarketplace();
  const { navigate } = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const allMyOrders = await fetchMyOrders();
      const matched = allMyOrders.find((o) => o.orderId === orderId);

      if (matched) {
        // Enforce IDOR protection: user must match order customerId (or be administrator)
        const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN';
        if (matched.customerId !== user.uid && !isAdmin) {
          setAccessDenied(true);
          setOrder(null);
        } else {
          setOrder(matched);
          setAccessDenied(false);
        }
      } else {
        setAccessDenied(true);
      }

      setLoading(false);
    }

    loadOrder();
  }, [user, profile, orderId, fetchMyOrders]);

  if (loading) {
    return (
      <div className="py-24 bg-[#01213D] min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0682F4] border-t-[#08E6F9] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#CCD2D9]">Retrieving order record...</span>
        </div>
      </div>
    );
  }

  if (accessDenied || !order) {
    return (
      <div className="py-24 bg-[#01213D] min-h-[80vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-[#0682F4]/40 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#011629] border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9] mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display font-bold text-2xl text-white">Order Access Restricted</h2>
              <p className="text-xs sm:text-sm text-[#CCD2D9]">
                This order was not found in your account ledger or you do not have permission to view its contents.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => navigate('/account/orders')} fullWidth>
              Return to My Orders
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="py-12 sm:py-16 bg-[#01213D] min-h-screen">
      <Container size="wide">
        
        {/* Breadcrumb Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/account/orders')}
            className="inline-flex items-center gap-1.5 text-xs text-[#CCD2D9] hover:text-[#08E6F9] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#08E6F9]" />
            <span>Back to Orders</span>
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-[#08E6F9] uppercase tracking-wider">
                Order Reference
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0682F4]/20 text-[#08E6F9] border border-[#08E6F9]/40">
                {order.orderStatus}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0682F4]/20 text-[#08E6F9] border border-[#08E6F9]/40">
                Payment: {order.paymentStatus}
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              {order.orderReference}
            </h1>
            <div className="text-xs font-mono text-[#CCD2D9]/70 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#0682F4]" />
              <span>Placed on {formattedDate}</span>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1 bg-[#01213D] md:bg-transparent p-4 md:p-0 rounded-xl border md:border-0 border-[#0682F4]/20">
            <span className="text-xs font-mono text-[#CCD2D9]/70 block">Total Transaction Value</span>
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#08E6F9]">
              {formatPrice(order.total, order.currency)}
            </span>
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Purchased Items Snapshot */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[#08E6F9]" />
                  <h3 className="font-display font-bold text-base text-white">
                    Order Items ({order.items.length})
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#CCD2D9]/70">
                  Historical Price Snapshot Enforced
                </span>
              </div>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.orderItemId}
                    className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-lg bg-[#011629] overflow-hidden shrink-0 border border-[#0682F4]/20">
                        {item.imageSnapshot ? (
                          <img
                            src={item.imageSnapshot}
                            alt={item.productNameSnapshot}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-[#CCD2D9]/40">
                            Item
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h4 className="font-display font-semibold text-sm text-white truncate">
                          {item.productNameSnapshot}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#CCD2D9]/70">
                          <span>SKU: {item.skuSnapshot}</span>
                          <span>·</span>
                          <span>Seller Ref: {item.sellerId.slice(0, 14)}</span>
                          {item.variantSnapshot && (
                            <>
                              <span>·</span>
                              <span className="text-[#08E6F9]">{item.variantSnapshot}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 font-mono text-xs space-y-1 pt-2 sm:pt-0 border-t sm:border-0 border-[#0682F4]/10 flex flex-col sm:items-end">
                      <div className="text-white font-bold text-sm">
                        {formatPrice(item.itemTotal, item.currency)}
                      </div>
                      <div className="text-[11px] text-[#CCD2D9]/70">
                        {formatPrice(item.unitPrice, item.currency)} × {item.quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/marketplace/product/${item.productId}`)}
                        className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-[#08E6F9] hover:underline cursor-pointer pt-1"
                      >
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>Write Verified Review</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Delivery, Payment & Financial Summary */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Delivery Info Box */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-[#0682F4]/20">
                <Truck className="w-4 h-4 text-[#08E6F9]" />
                <h3 className="font-display font-bold text-sm text-white">Delivery Coordinates</h3>
              </div>

              <div className="space-y-2 text-xs text-[#CCD2D9]">
                <div className="text-white font-medium text-sm">{order.deliveryInfo.fullName}</div>
                <div className="flex items-start gap-2 text-[#CCD2D9]/80 leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-[#0682F4] shrink-0 mt-0.5" />
                  <span>
                    {order.deliveryInfo.address}, {order.deliveryInfo.city}, {order.deliveryInfo.state},{' '}
                    {order.deliveryInfo.country}
                  </span>
                </div>
                <div className="font-mono pt-1 text-[11px] text-[#CCD2D9]/70">
                  Phone: {order.deliveryInfo.phoneNumber}
                </div>
                {order.deliveryInfo.deliveryNotes && (
                  <div className="p-2.5 rounded-lg bg-[#01213D] border border-[#0682F4]/20 text-[11px] text-[#CCD2D9]/80">
                    <span className="font-mono text-[#08E6F9] block text-[10px]">Notes:</span>
                    {order.deliveryInfo.deliveryNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Payment & Financial Ledger */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-[#0682F4]/20">
                <CreditCard className="w-4 h-4 text-[#08E6F9]" />
                <h3 className="font-display font-bold text-sm text-white">Financial Breakdown</h3>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-[#CCD2D9]">
                  <span>Item Subtotal:</span>
                  <span className="text-white">{formatPrice(order.subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between text-[#CCD2D9]">
                  <span>Logistics & Delivery:</span>
                  <span className="text-white">{formatPrice(order.deliveryFee, order.currency)}</span>
                </div>
                <div className="flex justify-between text-[#CCD2D9]">
                  <span>Discounts Applied:</span>
                  <span className="text-[#08E6F9]">{formatPrice(order.discount, order.currency)}</span>
                </div>
                <div className="pt-3 border-t border-[#0682F4]/20 flex justify-between items-baseline text-sm font-bold">
                  <span className="text-white">Amount Paid:</span>
                  <span className="text-[#08E6F9]">{formatPrice(order.total, order.currency)}</span>
                </div>
              </div>

              {/* Payment Reference Details */}
              <div className="pt-3 border-t border-[#0682F4]/20 space-y-1.5 text-[11px] font-mono text-[#CCD2D9]/70">
                <div>
                  <span className="text-[#CCD2D9]">Gateway:</span> {order.paymentProvider || 'Paystack'}
                </div>
                {order.paymentReference && (
                  <div className="truncate">
                    <span className="text-[#CCD2D9]">Txn Ref:</span> {order.paymentReference}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </Container>
    </div>
  );
};
