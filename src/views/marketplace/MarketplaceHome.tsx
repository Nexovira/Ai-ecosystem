import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Search,
  Sparkles,
  ShoppingBag,
  Zap,
  ArrowRight,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Tv,
  Refrigerator,
  Laptop,
  Smartphone,
  Home,
  Cpu,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { MarketplaceHeader } from '../../components/marketplace/MarketplaceHeader';
import { ProductCard } from '../../components/marketplace/ProductCard';
import { ProductFilters } from '../../components/marketplace/ProductFilters';
import { CartDrawer } from '../../components/marketplace/CartDrawer';
import { WishlistModal } from '../../components/marketplace/WishlistModal';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';
import { MarketplaceSortOption } from '../../types/marketplace';

const ITEMS_PER_PAGE = 8;

export const MarketplaceHome: React.FC = () => {
  const {
    products,
    categories,
    loadingProducts,
    filters,
    setFilters,
    resetFilters,
    filteredProducts,
  } = useMarketplace();

  const { navigate } = useRouter();

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const currentPage = Math.min(filters.page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: e.target.value as MarketplaceSortOption,
      page: 1,
    }));
  };

  const handleCategoryPillClick = (categoryName: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === categoryName ? '' : categoryName,
      page: 1,
    }));
  };

  const categoryIconMap: Record<string, React.FC<{ className?: string }>> = {
    Appliances: Refrigerator,
    Electronics: Tv,
    'Computing & Accessories': Laptop,
    'Phones & Accessories': Smartphone,
    'Home Technology': Home,
    'Other Technology Products': Cpu,
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#111827] flex flex-col">
      {/* Marketplace Dedicated Header */}
      <MarketplaceHeader
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenWishlist={() => setWishlistModalOpen(true)}
        onToggleMobileFilters={() => setMobileFiltersOpen(true)}
      />

      {/* Hero Marquee / Focal Banner */}
      <div className="border-b border-[#E8EDF2] bg-white py-10 sm:py-14 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[250px] bg-[#0169FA]/5 blur-[100px] rounded-full pointer-events-none" />

        <Container size="wide" className="relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#0169FA] uppercase">
              <span>Hardware Ecosystem</span>
              <span aria-hidden="true">·</span>
              <span>Verified Catalog</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#14283F] tracking-tight leading-tight">
              Technology for Everyday Living
            </h1>

            <p className="text-sm sm:text-base text-[#6B7280] font-normal leading-relaxed max-w-2xl">
              Engineered appliances, electronics, computing workstations and smart home infrastructure.
              Curated for performance, aesthetic integrity, and digital reliability.
            </p>
          </div>

          {/* Quick Category Navigation Ribbon */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => handleCategoryPillClick('')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filters.category === ''
                  ? 'bg-gradient-to-r from-[#08B3F8] via-[#0169FA] to-[#0148F2] text-white shadow-sm'
                  : 'bg-[#F7F8FA] text-[#6B7280] border border-[#E8EDF2] hover:border-[#0169FA] hover:text-[#14283F]'
              }`}
            >
              All Products ({products.length})
            </button>

            {categories.map((cat) => {
              const Icon = categoryIconMap[cat.name] || Cpu;
              const isSelected = filters.category.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.categoryId}
                  onClick={() => handleCategoryPillClick(cat.name)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#08B3F8] via-[#0169FA] to-[#0148F2] text-white shadow-sm'
                      : 'bg-[#F7F8FA] text-[#6B7280] border border-[#E8EDF2] hover:border-[#0169FA] hover:text-[#14283F]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </Container>
      </div>

      {/* Main Catalog Workspace */}
      <div className="flex-1 py-10 sm:py-14">
        <Container size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Desktop Left Filter Sidebar */}
            <aside className="hidden lg:block lg:col-span-3 bg-white border border-[#E8EDF2] rounded-2xl p-6 shadow-sm sticky top-28">
              <ProductFilters />
            </aside>

            {/* Mobile Filters Drawer Modal */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true">
                <div
                  className="fixed inset-0 bg-[#14283F]/60 backdrop-blur-sm"
                  onClick={() => setMobileFiltersOpen(false)}
                />
                <div className="relative ml-auto w-full max-w-xs bg-white border-l border-[#E8EDF2] p-6 overflow-y-auto h-full shadow-2xl">
                  <ProductFilters
                    isMobile
                    onCloseMobile={() => setMobileFiltersOpen(false)}
                  />
                </div>
              </div>
            )}

            {/* Right Product Grid Area */}
            <main className="lg:col-span-9 space-y-6">
              
              {/* Controls Bar: Results Count & Sorting */}
              <div className="bg-white border border-[#E8EDF2] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="text-xs text-[#6B7280]">
                  Showing <strong className="text-[#14283F] font-bold">{filteredProducts.length}</strong> verified items
                  {filters.searchQuery && (
                    <span> for query <strong className="text-[#0169FA]">"{filters.searchQuery}"</strong></span>
                  )}
                  {filters.category && (
                    <span> in <strong className="text-[#0169FA]">{filters.category}</strong></span>
                  )}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-xs font-semibold text-[#6B7280] shrink-0">
                    Sort By:
                  </label>
                  <select
                    id="sort-select"
                    value={filters.sortBy}
                    onChange={handleSortChange}
                    className="bg-[#F7F8FA] text-[#14283F] text-xs px-3 py-1.5 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest Additions</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Loading State */}
              {loadingProducts ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#0169FA] border-t-transparent rounded-full animate-spin mx-auto" />
                  <span className="text-xs font-medium text-[#6B7280]">Loading marketplace catalog...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                /* Empty / No Results State */
                <div className="bg-white border border-[#E8EDF2] rounded-3xl p-12 text-center space-y-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-[#F7F8FA] border border-[#E8EDF2] flex items-center justify-center text-[#6B7280] mx-auto">
                    <FilterX className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-lg text-[#14283F]">
                      No Matching Hardware Found
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B7280] max-w-sm mx-auto">
                      No products match your current search and filter combination. Try adjusting or resetting your criteria.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={resetFilters}>
                    <span>Reset All Filters</span>
                  </Button>
                </div>
              ) : (
                /* Product Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.productId}
                      product={product}
                      onOpenSignInPrompt={() => setWishlistModalOpen(true)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pt-6 flex items-center justify-between border-t border-[#E8EDF2]">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#0169FA] disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="text-xs text-[#6B7280]">
                    Page <strong className="text-[#14283F] font-bold">{currentPage}</strong> of{' '}
                    <strong className="text-[#14283F] font-bold">{totalPages}</strong>
                  </div>

                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#0169FA] disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </main>
          </div>
        </Container>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={wishlistModalOpen}
        onClose={() => setWishlistModalOpen(false)}
        onOpenSignIn={() => {
          setWishlistModalOpen(false);
          navigate('/signin');
        }}
      />
    </div>
  );
};
