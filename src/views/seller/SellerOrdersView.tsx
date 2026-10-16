import React, { useEffect, useState } from 'react';
import {
  Package,
  Truck,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import { useCommerce } from '../../context/CommerceContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';
import { OrderItem } from '../../types/commerce';

export const SellerOrdersView: React.FC = () => {
  const { user } = useAuth();
  const { isVerifiedSeller, sellerProfile } = useSeller();
  const { fetchSellerOrderItems } = useCommerce();
  const { formatPrice } = useMarketplace();
  const { navigate } = useRouter();

  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadSellerOrders() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await fetchSellerOrderItems();
      setItems(data);
      setLoading(false);
    }
    loadSellerOrders();
  }, [user, fetchSellerOrderItems]);

  if (!isVerifiedSeller) {
    return (
      <div className="py-24 bg-[#01213D] min-h-[80vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-6 shadow-2xl">
            <Store className="w-12 h-12 text-[#08E6F9] mx-auto" />
            <div className="space-y-2">
              <h2 className="font-display font-bold text-2xl text-white">Merchant Access Required</h2>
              <p className="text-xs sm:text-sm text-[#CCD2D9]">
                Only verified Nexovira merchants can access incoming merchant orders and fulfillment queues.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => navigate('/seller/apply')} fullWidth>
              Apply for Merchant Verification
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const filteredItems = items.filter(
    (i) =>
      i.productNameSnapshot.toLowerCase().includes(search.toLowerCase()) ||
      i.skuSnapshot.toLowerCase().includes(search.toLowerCase()) ||
      i.orderId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-12 sm:py-16 bg-[#01213D] min-h-screen">
      <Container size="wide">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs text-[#CCD2D9] hover:text-[#08E6F9] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#08E6F9]" />
            <span>Back to Merchant Console</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0682F4]/20 pb-6">
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#08E6F9] uppercase tracking-widest">
              Merchant Fulfillment Queue
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              SELLER ORDERS & DISPATCH
            </h1>
            <p className="text-xs text-[#CCD2D9]/80">
              Only order line items belonging to your storefront are visible here to protect customer privacy and merchant isolation.
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[#011B33] border border-[#0682F4]/30 text-xs font-mono text-white self-start sm:self-auto">
            <span className="text-[#CCD2D9]">Store: </span>
            <span className="text-[#08E6F9] font-bold">{sellerProfile?.businessName || 'Verified Merchant'}</span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0682F4]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU, or order ID..."
              className="w-full bg-[#011B33] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
            />
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#0682F4] border-t-[#08E6F9] rounded-full animate-spin mx-auto" />
            <span className="text-xs font-mono text-[#CCD2D9]">Retrieving merchant items...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-center text-[#CCD2D9]/40 mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-base text-white">No Order Items Found</h3>
              <p className="text-xs text-[#CCD2D9]/70">
                When customers purchase items from your inventory, they will appear here for packaging and fulfillment.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#01213D] border-b border-[#0682F4]/20 font-mono text-[11px] text-[#CCD2D9] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Product / SKU</th>
                    <th className="py-3.5 px-4">Qty</th>
                    <th className="py-3.5 px-4">Purchased Unit Price</th>
                    <th className="py-3.5 px-4">Item Total</th>
                    <th className="py-3.5 px-4">Order Reference</th>
                    <th className="py-3.5 px-4 sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0682F4]/10">
                  {filteredItems.map((item) => (
                    <tr key={item.orderItemId} className="hover:bg-[#01213D]/40 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-[#011629] overflow-hidden shrink-0 border border-[#0682F4]/20">
                            {item.imageSnapshot ? (
                              <img
                                src={item.imageSnapshot}
                                alt={item.productNameSnapshot}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-[#CCD2D9]/40">
                                Item
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-xs sm:max-w-sm">
                              {item.productNameSnapshot}
                            </div>
                            <div className="text-[10px] font-mono text-[#CCD2D9]/60">
                              SKU: {item.skuSnapshot}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-white font-bold">{item.quantity}</td>
                      <td className="py-4 px-4 font-mono text-[#CCD2D9]">
                        {formatPrice(item.unitPrice, item.currency)}
                      </td>
                      <td className="py-4 px-4 font-mono text-white font-bold">
                        {formatPrice(item.itemTotal, item.currency)}
                      </td>
                      <td className="py-4 px-4 font-mono text-[#08E6F9]">
                        {item.orderId.slice(0, 16)}...
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#08E6F9]/10 text-[#08E6F9] border border-[#08E6F9]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid & Confirmed</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </Container>
    </div>
  );
};
