import React, { useEffect, useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  ArrowLeft,
  Search,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useCommerce } from '../../context/CommerceContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';
import { Order, OrderStatus } from '../../types/commerce';

export const CustomerOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { fetchMyOrders } = useCommerce();
  const { formatPrice } = useMarketplace();
  const { navigate } = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await fetchMyOrders();
      setOrders(data);
      setLoading(false);
    }
    loadOrders();
  }, [user, fetchMyOrders]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.productNameSnapshot.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PAYMENT_CONFIRMED':
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#08E6F9]/10 text-[#08E6F9] border border-[#08E6F9]/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Confirmed</span>
          </span>
        );
      case 'SHIPPED':
      case 'READY_FOR_FULFILLMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#0682F4]/20 text-[#06C3F8] border border-[#0682F4]/40">
            <Truck className="w-3 h-3" />
            <span>Fulfillment</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Delivered</span>
          </span>
        );
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#0682F4]/15 text-[#06C3F8] border border-[#0682F4]/30">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'CANCELLED':
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#01213D] text-[#CCD2D9] border border-[#2B7EB5]/30">
            <AlertCircle className="w-3 h-3" />
            <span>{status}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-[#CCD2D9] border border-[#0682F4]/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="py-12 sm:py-16 bg-[#01213D] min-h-screen">
      <Container size="wide">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/account')}
            className="inline-flex items-center gap-1.5 text-xs text-[#CCD2D9] hover:text-[#08E6F9] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#08E6F9]" />
            <span>Back to Account Overview</span>
          </button>
        </div>

        {/* Page Title */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0682F4]/20 pb-6">
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#08E6F9] uppercase tracking-widest">
              Customer Ledger
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              MY ORDER HISTORY
            </h1>
            <p className="text-xs text-[#CCD2D9]/80">
              Immutable records of your transactions, purchases, and delivery coordinates.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/marketplace')}
            className="text-xs self-start sm:self-auto"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Browse Marketplace</span>
          </Button>
        </div>

        {/* Filters and Search Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0682F4]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order reference or product name..."
              className="w-full bg-[#011B33] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#011B33] text-[#CCD2D9] text-xs px-3 py-2.5 rounded-xl border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAYMENT_CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Listing */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#0682F4] border-t-[#08E6F9] rounded-full animate-spin mx-auto" />
            <span className="text-xs font-mono text-[#CCD2D9]">Loading order records...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-center text-[#CCD2D9]/40 mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-base text-white">No Orders Found</h3>
              <p className="text-xs text-[#CCD2D9]/70">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No orders match your filter criteria.'
                  : 'You have not placed any commerce orders yet.'}
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => navigate('/marketplace')} className="text-xs">
              <span>Start Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord) => {
              const formattedDate = new Date(ord.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={ord.orderId}
                  onClick={() => navigate(`/account/orders/${ord.orderId}`)}
                  className="bg-[#011B33] border border-[#0682F4]/30 hover:border-[#08E6F9]/60 rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer shadow-lg space-y-4 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#0682F4]/15">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-bold text-white group-hover:text-[#08E6F9] transition-colors">
                        {ord.orderReference}
                      </span>
                      <span className="text-xs font-mono text-[#CCD2D9]/60">·</span>
                      <span className="text-xs font-mono text-[#CCD2D9]/70">{formattedDate}</span>
                      {getStatusBadge(ord.orderStatus)}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#CCD2D9]/60 block">
                          Total
                        </span>
                        <span className="font-mono text-base font-bold text-white">
                          {formatPrice(ord.total, ord.currency)}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#0682F4] group-hover:text-[#08E6F9] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  {/* Items Snapshot Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ord.items.map((it) => (
                      <div
                        key={it.orderItemId}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-[#01213D] border border-[#0682F4]/15"
                      >
                        <div className="w-10 h-10 rounded bg-[#011629] overflow-hidden shrink-0 border border-[#0682F4]/20">
                          {it.imageSnapshot ? (
                            <img
                              src={it.imageSnapshot}
                              alt={it.productNameSnapshot}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-[#CCD2D9]/40">
                              Item
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-medium text-white truncate">{it.productNameSnapshot}</h4>
                          <div className="text-[10px] font-mono text-[#CCD2D9]/70">
                            Qty: {it.quantity} · {formatPrice(it.unitPrice, it.currency)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Location Preview */}
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#CCD2D9]/60">
                    <div className="flex items-center gap-1.5 truncate">
                      <Truck className="w-3.5 h-3.5 text-[#0682F4] shrink-0" />
                      <span className="truncate">
                        Deliver to: {ord.deliveryInfo.fullName} ({ord.deliveryInfo.city}, {ord.deliveryInfo.state})
                      </span>
                    </div>
                    <span className="text-[#08E6F9] font-medium group-hover:underline">
                      View details
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </Container>
    </div>
  );
};
