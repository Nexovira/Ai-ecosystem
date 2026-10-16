import React, { useEffect } from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Button } from '../common/Button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, cartCount, cartSubtotal, updateCartQuantity, removeFromCart, clearCart, formatPrice } =
    useMarketplace();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#011629]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#011B33] border-l border-[#0682F4]/30 shadow-2xl flex flex-col justify-between">
          
          {/* Top Header */}
          <div className="p-5 sm:p-6 border-b border-[#0682F4]/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-center text-[#08E6F9]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Shopping Cart
                </h3>
                <span className="text-xs font-mono text-[#CCD2D9]/70">
                  {cartCount} {cartCount === 1 ? 'line item' : 'line items'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#CCD2D9] hover:text-white hover:bg-[#01213D] transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-center text-[#CCD2D9]/40">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-semibold text-base text-white">
                    Your cart is empty
                  </h4>
                  <p className="text-xs text-[#CCD2D9]/70 max-w-xs">
                    Browse our curated technology and appliance catalog to reserve hardware.
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={onClose}>
                  <span>Explore Catalog</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.itemId}
                    className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 flex items-start gap-3.5"
                  >
                    {/* Item Image */}
                    <div className="w-16 h-16 rounded-lg bg-[#011629] overflow-hidden shrink-0 border border-[#0682F4]/20">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-[#CCD2D9]/40">
                          Asset
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-[11px] font-mono text-[#08E6F9]">{item.brand}</div>
                      <h5 className="font-display font-semibold text-xs text-white truncate">
                        {item.name}
                      </h5>
                      <div className="text-xs font-mono font-bold text-white">
                        {formatPrice(item.price, item.currency)}
                      </div>

                      {/* Quantity Controls */}
                      <div className="pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 bg-[#011629] rounded-lg border border-[#0682F4]/20 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.itemId, item.quantity - 1)}
                            className="p-1 text-[#CCD2D9] hover:text-white hover:bg-[#0682F4]/20 rounded"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs text-white px-2 font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.itemId, item.quantity + 1)}
                            className="p-1 text-[#CCD2D9] hover:text-white hover:bg-[#0682F4]/20 rounded"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.itemId)}
                          className="text-[#CCD2D9]/60 hover:text-red-400 p-1 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Subtotal & Phase 3 Notice */}
          {cart.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-[#0682F4]/20 bg-[#011629] space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-[#CCD2D9]/70 block">
                    Calculated Subtotal
                  </span>
                  <span className="text-[10px] font-mono text-[#CCD2D9]/50">
                    Pre-tax & delivery baseline
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-white">
                  {formatPrice(cartSubtotal, cart[0]?.currency || 'NGN')}
                </div>
              </div>

              {/* Architectural Notice: Strict Phase 3 Limit */}
              <div className="p-3 rounded-lg bg-[#01213D] border border-[#0682F4]/30 space-y-1 text-[11px] text-[#CCD2D9]">
                <div className="flex items-center gap-1.5 text-[#08E6F9] font-medium font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Phase 3 Cart Foundation</span>
                </div>
                <p className="leading-relaxed text-[#CCD2D9]/80">
                  Cart reservations are active. Payment gateways (Paystack, Flutterwave) and automated order processing will deploy in Phase 4.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="text-xs"
                >
                  Clear Cart
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={onClose}
                  className="text-xs"
                >
                  <span>Continue Exploring</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
