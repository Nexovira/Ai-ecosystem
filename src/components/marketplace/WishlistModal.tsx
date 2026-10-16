import React from 'react';
import { Heart, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { useRouter } from '../../context/RouterContext';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSignIn: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  onOpenSignIn,
}) => {
  const { wishlist, products, toggleWishlist, addToCart, formatPrice } = useMarketplace();
  const { user } = useAuth();
  const { navigate } = useRouter();

  if (!isOpen) return null;

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.productId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#011629]/80 backdrop-blur-md" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-xl bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#08E6F9] fill-[#08E6F9]" />
            <h3 className="font-display font-bold text-lg text-white">
              Saved Wishlist
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#01213D] text-[#08E6F9] border border-[#0682F4]/30">
              {wishlistedProducts.length} items
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#CCD2D9] hover:text-white"
            aria-label="Close wishlist modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {!user ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#01213D] border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9] mx-auto">
                <Heart className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-base text-white">
                  Member Account Required
                </h4>
                <p className="text-xs text-[#CCD2D9]/80 max-w-xs mx-auto">
                  Sign in or register to sync your wishlist across sessions and devices.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenSignIn();
                }}
              >
                <span>Sign In to Nexovira</span>
              </Button>
            </div>
          ) : wishlistedProducts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-[#CCD2D9]/70">Your wishlist is currently empty.</p>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Browse Hardware Catalog
              </Button>
            </div>
          ) : (
            wishlistedProducts.map((prod) => (
              <div
                key={prod.productId}
                className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 flex items-center justify-between gap-4"
              >
                <div
                  onClick={() => {
                    onClose();
                    navigate(`/marketplace/product/${prod.slug}`);
                  }}
                  className="flex items-center gap-3 min-w-0 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#011629] overflow-hidden shrink-0 border border-[#0682F4]/20">
                    <img
                      src={prod.productImages[0]?.url}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-display font-semibold text-xs text-white group-hover:text-[#08E6F9] transition-colors truncate">
                      {prod.name}
                    </h5>
                    <div className="text-xs font-mono font-bold text-[#08E6F9]">
                      {formatPrice(prod.discountPrice ?? prod.price, prod.currency)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(prod, 1);
                      toggleWishlist(prod.productId);
                    }}
                    className="p-2 rounded-lg bg-[#0682F4]/20 hover:bg-[#0682F4] text-[#08E6F9] hover:text-white transition-colors"
                    title="Move to Cart"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(prod.productId)}
                    className="p-2 rounded-lg text-[#CCD2D9]/60 hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#0682F4]/20 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

      </div>
    </div>
  );
};
