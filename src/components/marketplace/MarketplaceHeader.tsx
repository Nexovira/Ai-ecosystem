import React, { useState } from 'react';
import { Search, ShoppingBag, Heart, User, X, SlidersHorizontal, ArrowLeft } from 'lucide-react';
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
    <div className="w-full bg-white border-b border-[#E8EDF2] sticky top-16 sm:top-18 z-30 shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          
          {/* Top Line on Mobile / Left Section on Desktop */}
          <div className="flex items-center justify-between md:justify-start gap-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#0169FA] transition-colors cursor-pointer group"
              aria-label="Return to Nexovira Home"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-[#0169FA]" />
              <span className="hidden sm:inline">Home</span>
            </button>

            <span className="text-[#E8EDF2] hidden sm:inline">|</span>

            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm sm:text-base text-[#14283F] tracking-wide">
                MARKETPLACE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F7F8FA] text-[#0169FA] border border-[#E8EDF2] font-semibold">
                Official Catalog
              </span>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-1.5">
              {onToggleMobileFilters && (
                <button
                  type="button"
                  onClick={onToggleMobileFilters}
                  className="p-2 rounded-xl bg-white border border-[#E8EDF2] text-[#14283F] hover:text-[#0169FA]"
                  aria-label="Filter products"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onOpenWishlist}
                className="p-2 rounded-xl bg-white border border-[#E8EDF2] text-[#14283F] hover:text-[#0169FA] relative"
                aria-label="View Wishlist"
              >
                <Heart className="w-4 h-4" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0169FA] text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onOpenCart}
                className="p-2 rounded-xl bg-white border border-[#E8EDF2] text-[#0169FA] relative"
                aria-label="View Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0169FA] text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Central Search Bar */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-[#0169FA] pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search products, brands and categories..."
                className="w-full bg-[#F7F8FA] text-[#14283F] text-xs sm:text-sm pl-10 pr-20 py-2 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0169FA] placeholder:text-[#6B7280] transition-colors"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-14 text-[#6B7280] hover:text-[#14283F] p-1"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#08B3F8] to-[#0169FA] text-white hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
              >
                Search
              </button>
            </form>
          </div>

          {/* Desktop Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenWishlist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8EDF2] hover:border-[#028BFA] text-[#14283F] text-xs transition-colors cursor-pointer bg-white"
            >
              <Heart className={`w-3.5 h-3.5 ${wishlist.length > 0 ? 'text-[#0169FA] fill-[#0169FA]' : 'text-[#6B7280]'}`} />
              <span>Wishlist</span>
              {wishlist.length > 0 && (
                <span className="font-mono text-[#0169FA] font-bold">
                  ({wishlist.length})
                </span>
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#08B3F8] via-[#0169FA] to-[#0148F2] text-white font-semibold text-xs hover:opacity-95 transition-opacity cursor-pointer shadow-xs shadow-[#0169FA]/20"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
              <span>Cart</span>
              <span className="font-mono bg-white text-[#0169FA] px-1.5 py-0.2 rounded-md text-[10px] font-bold">
                {cartCount}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
