import React from 'react';
import { Heart, ShoppingBag, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';
import { Product } from '../../types/marketplace';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';

interface ProductCardProps {
  product: Product;
  onOpenSignInPrompt?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenSignInPrompt }) => {
  const { isWishlisted, toggleWishlist, addToCart, formatPrice } = useMarketplace();
  const { navigate } = useRouter();

  const wishlisted = isWishlisted(product.productId);
  const primaryImage = product.productImages[0]?.url || '';
  const isAvailable = product.availabilityStatus === 'IN_STOCK' || product.availabilityStatus === 'LOW_STOCK';

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = toggleWishlist(product.productId);
    if (res.requiresAuth && onOpenSignInPrompt) {
      onOpenSignInPrompt();
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    addToCart(product, 1);
  };

  const handleCardClick = () => {
    navigate(`/marketplace/product/${product.slug}`);
  };

  const discountPercent =
    product.discountPrice && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : null;

  return (
    <div
      onClick={handleCardClick}
      className="group bg-[#011B33] border border-[#0682F4]/20 hover:border-[#08E6F9]/60 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0682F4]/10 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div>
        {/* Product Image Slot with Fallback Container */}
        <div className="relative aspect-[4/3] bg-[#011629] overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#01213D] to-[#011629] text-[#CCD2D9]/40 font-mono text-xs">
              Hardware Imagery
            </div>
          )}

          {/* Discount Badge */}
          {discountPercent && (
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#0682F4] text-white font-mono font-bold text-[11px] shadow-sm">
              -{discountPercent}%
            </div>
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`absolute top-2.5 right-2.5 p-2 rounded-lg backdrop-blur-md transition-colors cursor-pointer ${
              wishlisted
                ? 'bg-[#01213D]/90 text-[#08E6F9] border border-[#08E6F9]'
                : 'bg-[#011629]/70 text-[#CCD2D9] hover:text-[#08E6F9] border border-[#0682F4]/30'
            }`}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-[#08E6F9]' : ''}`} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-2.5">
          {/* Brand & Category line (Zero-pill discipline) */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#CCD2D9]/70">
            <span className="text-[#08E6F9] font-medium">{product.brand}</span>
            <span aria-hidden="true" className="text-[#0682F4]/40">·</span>
            <span className="truncate">{product.category}</span>
          </div>

          {/* Product Name */}
          <h3 className="font-display font-bold text-sm sm:text-base text-white group-hover:text-[#08E6F9] transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-[#CCD2D9]/80 line-clamp-2 leading-relaxed font-normal">
            {product.shortDescription}
          </p>
        </div>
      </div>

      {/* Footer Price & Availability */}
      <div className="p-4 sm:p-5 pt-0 border-t border-[#0682F4]/10 mt-2">
        <div className="flex items-baseline justify-between pt-3 mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold text-white font-mono">
                {formatPrice(product.discountPrice ?? product.price, product.currency)}
              </span>
              {product.discountPrice && (
                <span className="text-xs text-[#CCD2D9]/50 line-through font-mono">
                  {formatPrice(product.price, product.currency)}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-[#CCD2D9]/60 uppercase">
              {product.currency} Numerical Valuation
            </span>
          </div>

          {/* Availability Indicator */}
          <div className="text-right">
            {product.availabilityStatus === 'IN_STOCK' && (
              <span className="text-[11px] font-mono text-[#08E6F9] flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3 h-3" />
                <span>In Stock</span>
              </span>
            )}
            {product.availabilityStatus === 'LOW_STOCK' && (
              <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1 justify-end">
                <AlertTriangle className="w-3 h-3" />
                <span>Low Stock</span>
              </span>
            )}
            {(product.availabilityStatus === 'OUT_OF_STOCK' || product.availabilityStatus === 'UNAVAILABLE') && (
              <span className="text-[11px] font-mono text-red-400 flex items-center gap-1 justify-end">
                <XCircle className="w-3 h-3" />
                <span>Unavailable</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Button */}
        <button
          type="button"
          onClick={handleAddToCartClick}
          disabled={!isAvailable}
          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isAvailable
              ? 'bg-[#01213D] border border-[#0682F4]/40 hover:border-[#08E6F9] hover:bg-[#0682F4]/20 text-white'
              : 'bg-[#011629] border border-neutral-800 text-[#CCD2D9]/40 cursor-not-allowed'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[#08E6F9]" />
          <span>{isAvailable ? 'Add to Cart' : 'Item Unavailable'}</span>
        </button>
      </div>
    </div>
  );
};
