import React, { useState } from 'react';
import { Search, ShoppingBag, Heart, User, X, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

interface MarketplaceHeaderProps {
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onToggleMobileFilters?: () => void;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  onOpenCart,
  onOpenWishlist,
  onToggleMobileFilters,
}) => {
  const { filters, setFilters, cartCount, wishlist } = useMarketplace();
  const { user } = useAuth();
  const { navigate } = useRouter();

  const [localSearch, setLocalSearch] = useState(filters.searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, searchQuery: localSearch, page: 1 }));
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    setFilters((prev) => ({ ...prev, searchQuery: '', page: 1 }));
  };

  return (
    <div className="w-full bg-[#011B33] border-b border-[#0682F4]/20 sticky top-18 z-30 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          
          {/* Top Line on Mobile / Left Section on Desktop */}
          <div className="flex items-center justify-between md:justify-start gap-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 text-xs text-[#CCD2D9] hover:text-[#08E6F9] transition-colors cursor-pointer group"
              aria-label="Return to Nexovira Home"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-[#08E6F9]" />
              <span className="hidden sm:inline">Ecosystem</span>
            </button>

            <span className="text-[#0682F4]/40 hidden sm:inline">|</span>

            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm sm:text-base text-white tracking-wide">
                MARKETPLACE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#01213D] text-[#08E6F9] border border-[#0682F4]/30">
                Phase 3 Catalog
              </span>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-1.5">
              {onToggleMobileFilters && (
                <button
                  type="button"
                  onClick={onToggleMobileFilters}
                  className="p-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-[#CCD2D9] hover:text-[#08E6F9]"
                  aria-label="Filter products"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onOpenWishlist}
                className="p-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-[#CCD2D9] hover:text-[#08E6F9] relative"
                aria-label="View Wishlist"
              >
                <Heart className="w-4 h-4" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0682F4] text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onOpenCart}
                className="p-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-[#08E6F9] relative"
                aria-label="View Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#08E6F9] text-[#01213D] text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Central Search Bar */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-[#0682F4] pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search products, brands and categories..."
                className="w-full bg-[#01213D] text-white text-xs sm:text-sm pl-10 pr-16 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none focus:ring-1 focus:ring-[#08E6F9] placeholder:text-[#CCD2D9]/40 transition-colors"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-12 text-[#CCD2D9]/60 hover:text-white p-1"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1.5 px-2.5 py-1 text-xs font-medium rounded bg-[#0682F4] hover:bg-[#08E6F9] text-white hover:text-[#01213D] transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          {/* Desktop Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenWishlist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0682F4]/20 hover:border-[#08E6F9]/50 text-[#CCD2D9] hover:text-white text-xs transition-colors cursor-pointer"
            >
              <Heart className={`w-3.5 h-3.5 ${wishlist.length > 0 ? 'text-[#08E6F9] fill-[#08E6F9]' : ''}`} />
              <span>Wishlist</span>
              {wishlist.length > 0 && (
                <span className="font-mono text-[#08E6F9] font-semibold">
                  ({wishlist.length})
                </span>
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-semibold text-xs hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart</span>
              <span className="font-mono bg-[#01213D] text-[#08E6F9] px-1.5 py-0.2 rounded text-[10px]">
                {cartCount}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
