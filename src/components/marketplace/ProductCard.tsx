import React from 'react';
import { Heart, ShoppingBag, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
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
  const [imageFailed, setImageFailed] = React.useState(false);
  const primaryImage = product.productImages.find((img) => img.isPrimary)?.url || product.productImages[0]?.url || '';
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
      className="group bg-white border border-[#E8EDF2] hover:border-[#0169FA] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0169FA]/5 cursor-pointer"
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
        <div className="relative aspect-[4/3] bg-[#F7F8FA] overflow-hidden">
          {primaryImage && !imageFailed ? (
            <img
              src={primaryImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F7F8FA] text-[#6B7280] p-4 text-center">
              <span className="text-xs font-semibold text-[#0169FA]">{product.brand}</span>
              <span className="text-[11px] text-[#6B7280] line-clamp-1 mt-1">{product.name}</span>
            </div>
          )}

          {/* Discount Badge */}
          {discountPercent && (
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-[#08B3F8] to-[#0169FA] text-white font-semibold text-[11px] shadow-sm">
              -{discountPercent}%
            </div>
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md transition-colors cursor-pointer ${
              wishlisted
                ? 'bg-white text-[#0169FA] shadow-sm border border-[#0169FA]/20'
                : 'bg-white/90 text-[#6B7280] hover:text-[#0169FA] border border-[#E8EDF2]'
            }`}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-[#0169FA]' : ''}`} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-2.5">
          {/* Brand & Category line (Zero-pill discipline) */}
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <span className="text-[#0169FA] font-medium">{product.brand}</span>
            <span aria-hidden="true" className="text-[#E8EDF2]">·</span>
            <span className="truncate">{product.category}</span>
          </div>

          {/* Product Name */}
          <h3 className="font-display font-bold text-sm sm:text-base text-[#14283F] group-hover:text-[#0169FA] transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed font-normal">
            {product.shortDescription}
          </p>
        </div>
      </div>

      {/* Footer Price & Availability */}
      <div className="p-4 sm:p-5 pt-0 border-t border-[#E8EDF2] mt-2">
        <div className="flex items-baseline justify-between pt-3 mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold text-[#14283F]">
                {formatPrice(product.discountPrice ?? product.price, product.currency)}
              </span>
              {product.discountPrice && (
                <span className="text-xs text-[#9CA3AF] line-through">
                  {formatPrice(product.price, product.currency)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#9CA3AF] uppercase font-medium">
              {product.currency} Verified Price
            </span>
          </div>

          {/* Availability Indicator */}
          <div className="text-right">
            {product.availabilityStatus === 'IN_STOCK' && (
              <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3 h-3" />
                <span>In Stock</span>
              </span>
            )}
            {product.availabilityStatus === 'LOW_STOCK' && (
              <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1 justify-end">
                <AlertTriangle className="w-3 h-3" />
                <span>Low Stock</span>
              </span>
            )}
            {(product.availabilityStatus === 'OUT_OF_STOCK' || product.availabilityStatus === 'UNAVAILABLE') && (
              <span className="text-[11px] font-medium text-red-500 flex items-center gap-1 justify-end">
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
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isAvailable
              ? 'bg-[#F7F8FA] border border-[#E8EDF2] hover:border-[#0169FA] hover:bg-[#0169FA]/5 text-[#14283F]'
              : 'bg-[#F7F8FA] border border-[#E8EDF2] text-[#9CA3AF] cursor-not-allowed'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[#0169FA]" />
          <span>{isAvailable ? 'Add to Cart' : 'Item Unavailable'}</span>
        </button>
      </div>
    </div>
  );
};
