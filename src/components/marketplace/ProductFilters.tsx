import React from 'react';
import { SlidersHorizontal, RotateCcw, X, Check } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';

interface ProductFiltersProps {
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({ onCloseMobile, isMobile = false }) => {
  const { categories, products, filters, setFilters, resetFilters } = useMarketplace();

  // Extract unique available brands from catalog
  const availableBrands = Array.from(new Set(products.map((p) => p.brand))).sort();

  const handleCategorySelect = (slug: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === slug ? '' : slug,
      page: 1,
    }));
  };

  const handleBrandSelect = (brandName: string) => {
    setFilters((prev) => ({
      ...prev,
      brand: prev.brand === brandName ? '' : brandName,
      page: 1,
    }));
  };

  const handleAvailabilitySelect = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      availability: prev.availability === status ? '' : status,
      page: 1,
    }));
  };

  const activeFiltersCount =
    (filters.category ? 1 : 0) +
    (filters.brand ? 1 : 0) +
    (filters.availability ? 1 : 0) +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Filters Title & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#08E6F9]" />
          <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
            Refine Catalog
          </span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#0682F4] text-white text-[11px] font-mono font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-[#08E6F9] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded text-[#CCD2D9] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Section */}
      <div className="space-y-3">
        <span className="text-xs font-mono uppercase tracking-wider text-[#CCD2D9]/70 block">
          Ecosystem Categories
        </span>
        <div className="space-y-1">
          <button
            onClick={() => handleCategorySelect('')}
            className={`w-full text-left text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
              filters.category === ''
                ? 'bg-[#0682F4]/20 text-[#08E6F9] font-semibold border border-[#08E6F9]/40'
                : 'text-[#CCD2D9] hover:bg-[#01213D] hover:text-white'
            }`}
          >
            <span>All Categories</span>
            {filters.category === '' && <Check className="w-3.5 h-3.5 text-[#08E6F9]" />}
          </button>

          {categories.map((cat) => {
            const isSelected = filters.category.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.categoryId}
                onClick={() => handleCategorySelect(cat.name)}
                className={`w-full text-left text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#0682F4]/20 text-[#08E6F9] font-semibold border border-[#08E6F9]/40'
                    : 'text-[#CCD2D9] hover:bg-[#01213D] hover:text-white'
                }`}
              >
                <span>{cat.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#08E6F9]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Section */}
      <div className="space-y-3 pt-3 border-t border-[#0682F4]/15">
        <span className="text-xs font-mono uppercase tracking-wider text-[#CCD2D9]/70 block">
          Verified Brands
        </span>
        <div className="space-y-1">
          {availableBrands.map((brand) => {
            const isSelected = filters.brand === brand;
            return (
              <button
                key={brand}
                onClick={() => handleBrandSelect(brand)}
                className={`w-full text-left text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#0682F4]/20 text-[#08E6F9] font-semibold border border-[#08E6F9]/40'
                    : 'text-[#CCD2D9] hover:bg-[#01213D] hover:text-white'
                }`}
              >
                <span>{brand}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#08E6F9]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3 pt-3 border-t border-[#0682F4]/15">
        <span className="text-xs font-mono uppercase tracking-wider text-[#CCD2D9]/70 block">
          Numerical Price Range (NGN)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-mono text-[#CCD2D9]/60 block mb-1">Min (₦)</label>
            <input
              type="number"
              value={filters.minPrice ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  minPrice: e.target.value ? Number(e.target.value) : null,
                  page: 1,
                }))
              }
              placeholder="0"
              className="w-full bg-[#011629] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#CCD2D9]/60 block mb-1">Max (₦)</label>
            <input
              type="number"
              value={filters.maxPrice ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  maxPrice: e.target.value ? Number(e.target.value) : null,
                  page: 1,
                }))
              }
              placeholder="5,000,000"
              className="w-full bg-[#011629] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Availability Filter */}
      <div className="space-y-3 pt-3 border-t border-[#0682F4]/15">
        <span className="text-xs font-mono uppercase tracking-wider text-[#CCD2D9]/70 block">
          Availability Status
        </span>
        <div className="space-y-1">
          {[
            { label: 'In Stock Only', value: 'IN_STOCK' },
            { label: 'Low Stock Available', value: 'LOW_STOCK' },
          ].map((item) => {
            const isSelected = filters.availability === item.value;
            return (
              <button
                key={item.value}
                onClick={() => handleAvailabilitySelect(item.value)}
                className={`w-full text-left text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#0682F4]/20 text-[#08E6F9] font-semibold border border-[#08E6F9]/40'
                    : 'text-[#CCD2D9] hover:bg-[#01213D] hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#08E6F9]" />}
              </button>
            );
          })}
        </div>
      </div>

      {isMobile && onCloseMobile && (
        <div className="pt-4">
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-bold text-xs"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
};
