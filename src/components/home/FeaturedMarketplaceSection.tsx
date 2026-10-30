import React from 'react';
import { ArrowRight, ShoppingCart, Tag, Eye } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Button } from '../common/Button';

export const FeaturedMarketplaceSection: React.FC = () => {
  const { navigate } = useRouter();
  const { products } = useMarketplace();

  // Take top 4 genuine published products
  const featured = products
    .filter((p) => p.productStatus === 'PUBLISHED')
    .slice(0, 4);

  const formatNaira = (amt: number) => `₦${(amt || 0).toLocaleString()} NGN`;

  return (
    <section className="py-16 sm:py-24 bg-[#F7F8FA] border-b border-[#E8EDF2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with View All action */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 sm:mb-16">
          <div className="space-y-2">
            <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#0169FA] uppercase">
              Curated Marketplace
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14283F] tracking-tight">
              Featured Products
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280] max-w-xl">
              Authentic electronics, computing hardware, and appliances verified for performance and supported with escrow protection.
            </p>
          </div>

          <button
            onClick={() => navigate('/marketplace')}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0169FA] hover:text-[#0148F2] transition-colors cursor-pointer self-start sm:self-auto shrink-0 group"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => {
            const hasDiscount = product.discountPrice && product.discountPrice < product.price;
            const primaryImage =
              product.productImages?.[0]?.url || '/assets/images/marketplace_laptop_1790288896761.jpg';

            return (
              <div
                key={product.productId}
                className="group rounded-3xl bg-white border border-[#E8EDF2] overflow-hidden hover:border-[#028BFA] transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between"
              >
                {/* Product Image Area */}
                <div
                  onClick={() => navigate(`/marketplace/product/${product.slug}`)}
                  className="relative aspect-square overflow-hidden bg-slate-50 cursor-pointer"
                >
                  <img
                    src={primaryImage}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  />
                  {hasDiscount && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#0169FA] text-white shadow-xs">
                      Special Offer
                    </span>
                  )}
                </div>

                {/* Product Metadata & Actions */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    {/* Unboxed category metadata (zero-pill discipline) */}
                    <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      {product.brand} · {product.category}
                    </div>

                    <h3
                      onClick={() => navigate(`/marketplace/product/${product.slug}`)}
                      className="font-display font-bold text-sm text-[#14283F] group-hover:text-[#0169FA] transition-colors line-clamp-2 cursor-pointer leading-snug"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-[#E8EDF2] space-y-3">
                    {/* Price Tag */}
                    <div className="flex items-baseline gap-2">
                      <span className="font-extrabold text-base text-[#14283F]">
                        {formatNaira(product.discountPrice || product.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-[#6B7280] line-through">
                          {formatNaira(product.price)}
                        </span>
                      )}
                    </div>

                    {/* View Product CTA */}
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => navigate(`/marketplace/product/${product.slug}`)}
                      className="text-xs group-hover:bg-[#0169FA] group-hover:text-white group-hover:border-[#0169FA] transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Product</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
