import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { GlobalSearchBar } from '../../components/search/GlobalSearchBar';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Package,
  GraduationCap,
  Briefcase,
  UserCheck,
  Tag,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  SearchResultItem,
  SearchEntityType,
  SearchResponse,
} from '../../types/search';

export const SearchResultsPage: React.FC = () => {
  const { currentPath, navigate } = useRouter();

  // Parse URL query parameters
  const getUrlParams = () => {
    if (typeof window === 'undefined') {
      return { q: '', type: 'ALL' as SearchEntityType, category: '', sort: 'relevance', page: 1 };
    }
    const searchParams = new URLSearchParams(window.location.search);
    return {
      q: searchParams.get('q') || '',
      type: (searchParams.get('type') as SearchEntityType) || 'ALL',
      category: searchParams.get('category') || '',
      sort: searchParams.get('sort') || 'relevance',
      page: parseInt(searchParams.get('page') || '1', 10),
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
    };
  };

  const initialParams = getUrlParams();
  const [query, setQuery] = useState(initialParams.q);
  const [activeType, setActiveType] = useState<SearchEntityType>(initialParams.type);
  const [selectedCategory, setSelectedCategory] = useState(initialParams.category);
  const [selectedSort, setSelectedSort] = useState(initialParams.sort);
  const [currentPage, setCurrentPage] = useState(initialParams.page);
  const [minPrice, setMinPrice] = useState(initialParams.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialParams.maxPrice);

  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state from URL on back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = getUrlParams();
      setQuery(params.q);
      setActiveType(params.type);
      setSelectedCategory(params.category);
      setSelectedSort(params.sort);
      setCurrentPage(params.page);
      setMinPrice(params.minPrice);
      setMaxPrice(params.maxPrice);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL search parameters without full reload
  const updateUrl = (newParams: {
    q?: string;
    type?: SearchEntityType;
    category?: string;
    sort?: string;
    page?: number;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    const searchParams = new URLSearchParams(window.location.search);

    if (newParams.q !== undefined) {
      if (newParams.q) searchParams.set('q', newParams.q);
      else searchParams.delete('q');
    }
    if (newParams.type !== undefined) {
      if (newParams.type !== 'ALL') searchParams.set('type', newParams.type);
      else searchParams.delete('type');
    }
    if (newParams.category !== undefined) {
      if (newParams.category) searchParams.set('category', newParams.category);
      else searchParams.delete('category');
    }
    if (newParams.sort !== undefined) {
      if (newParams.sort !== 'relevance') searchParams.set('sort', newParams.sort);
      else searchParams.delete('sort');
    }
    if (newParams.page !== undefined) {
      if (newParams.page > 1) searchParams.set('page', newParams.page.toString());
      else searchParams.delete('page');
    }
    if (newParams.minPrice !== undefined) {
      if (newParams.minPrice) searchParams.set('minPrice', newParams.minPrice);
      else searchParams.delete('minPrice');
    }
    if (newParams.maxPrice !== undefined) {
      if (newParams.maxPrice) searchParams.set('maxPrice', newParams.maxPrice);
      else searchParams.delete('maxPrice');
    }

    const newUrl = `/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  };

  // Perform search fetch
  const executeSearch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (activeType !== 'ALL') params.set('type', activeType);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedSort !== 'relevance') params.set('sort', selectedSort);
      if (currentPage > 1) params.set('page', currentPage.toString());
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      params.set('limit', '12');

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Search request failed.');
      }

      const data: SearchResponse = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      console.error('Search error:', err);
      const msg = err instanceof Error ? err.message : 'Error executing search';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [query, activeType, selectedCategory, selectedSort, currentPage, minPrice, maxPrice]);

  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
    updateUrl({ q: newQuery, page: 1 });
  };

  const handleTypeChange = (type: SearchEntityType) => {
    setActiveType(type);
    setCurrentPage(1);
    updateUrl({ type, page: 1 });
  };

  const handleCategoryChange = (cat: string) => {
    const val = cat === selectedCategory ? '' : cat;
    setSelectedCategory(val);
    setCurrentPage(1);
    updateUrl({ category: val, page: 1 });
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    setCurrentPage(1);
    updateUrl({ sort, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrl({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setActiveType('ALL');
    setSelectedCategory('');
    setSelectedSort('relevance');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
    updateUrl({
      type: 'ALL',
      category: '',
      sort: 'relevance',
      minPrice: '',
      maxPrice: '',
      page: 1,
    });
  };

  const formatNaira = (amount: number) => `₦${(amount || 0).toLocaleString()} NGN`;

  const entityTabs: Array<{ id: SearchEntityType; label: string; countKey: string }> = [
    { id: 'ALL', label: 'All Results', countKey: 'ALL' },
    { id: 'PRODUCT', label: 'Products', countKey: 'PRODUCT' },
    { id: 'COURSE', label: 'Courses', countKey: 'COURSE' },
    { id: 'SERVICE', label: 'Services', countKey: 'SERVICE' },
    { id: 'EXPERT', label: 'Experts', countKey: 'EXPERT' },
    { id: 'CATEGORY', label: 'Categories', countKey: 'CATEGORY' },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Search Header Banner */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#011B33] border border-[#0682F4]/40 text-[#08E6F9] text-xs font-mono font-bold tracking-wider uppercase">
            <Search className="w-3.5 h-3.5 text-[#08E6F9]" />
            Unified Ecosystem Discovery
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Explore Nexovira
          </h1>
          <p className="text-xs sm:text-sm text-[#CCD2D9]">
            Instantly discover verified products, scholarship courses, specialized services, and expert consultants.
          </p>

          {/* Standalone Hero Search Input */}
          <div className="pt-2">
            <GlobalSearchBar
              initialQuery={query}
              variant="hero"
              onSearchSubmit={handleSearchSubmit}
              placeholder="Search products, courses, services, experts, or categories..."
            />
          </div>
        </div>

        {/* Entity Category Tabs */}
        <div className="border-b border-[#0682F4]/20 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-2">
            {entityTabs.map((tab) => {
              const isActive = activeType === tab.id;
              const count = response?.countsByType ? response.countsByType[tab.countKey] || 0 : 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTypeChange(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#0682F4] text-white shadow-lg shadow-[#0682F4]/30'
                      : 'text-[#CCD2D9] hover:text-white hover:bg-[#011B33]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#01213D] text-[#CCD2D9]/70'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden px-3 py-1.5 rounded-xl bg-[#011B33] border border-[#0682F4]/30 text-xs font-semibold text-[#08E6F9] flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>

        {/* Main Content Layout: Filters Sidebar + Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside
            className={`md:block space-y-6 ${
              mobileFilterOpen
                ? 'fixed inset-0 z-50 bg-[#000000]/95 p-6 overflow-y-auto'
                : 'hidden'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <SlidersHorizontal className="w-4 h-4 text-[#08E6F9]" />
                Filter &amp; Refine
              </div>
              <div className="flex items-center gap-2">
                {(selectedCategory || selectedSort !== 'relevance' || minPrice || maxPrice) && (
                  <button
                    onClick={clearAllFilters}
                    className="text-[11px] text-[#08E6F9] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                {mobileFilterOpen && (
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 rounded-lg text-[#CCD2D9] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#CCD2D9] block">Sort By</label>
              <select
                value={selectedSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#011B33] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
              >
                <option value="relevance">Most Relevant</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest Catalog Additions</option>
              </select>
            </div>

            {/* Price Range Filter (Products & Courses) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#CCD2D9] block">Price Range (NGN)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min ₦"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    updateUrl({ minPrice: e.target.value, page: 1 });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#011B33] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
                <input
                  type="number"
                  placeholder="Max ₦"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    updateUrl({ maxPrice: e.target.value, page: 1 });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#011B33] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>
            </div>

            {/* Categories Filter */}
            {response?.availableCategories && response.availableCategories.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#CCD2D9] block">Category</label>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {response.availableCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        onClick={() => handleCategoryChange(cat.slug)}
                        className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#0682F4]/20 border border-[#0682F4] text-white font-bold'
                            : 'hover:bg-[#011B33] text-[#CCD2D9] hover:text-white'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-[10px] font-mono text-[#CCD2D9]/60 shrink-0">
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {mobileFilterOpen && (
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0682F4] text-white text-xs font-bold"
              >
                Apply Filters
              </button>
            )}
          </aside>

          {/* Results Column */}
          <div className="md:col-span-3 space-y-6">
            {/* Results Header Count */}
            <div className="flex items-center justify-between text-xs text-[#CCD2D9]">
              <div>
                {response ? (
                  <span>
                    Found <strong className="text-white">{response.total}</strong> results
                    {query.trim() && (
                      <> for &quot;<span className="text-[#08E6F9]">{query.trim()}</span>&quot;</>
                    )}
                    <span className="text-[11px] text-[#CCD2D9]/60 font-mono ml-2">
                      ({response.executionTimeMs}ms)
                    </span>
                  </span>
                ) : (
                  <span>Searching...</span>
                )}
              </div>

              {response && response.totalPages > 1 && (
                <div className="font-mono text-[11px] text-[#CCD2D9]/60">
                  Page {response.page} of {response.totalPages}
                </div>
              )}
            </div>

            {/* Error State */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={executeSearch}
                  className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-bold transition cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Skeletons */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-[#011B33]/60 border border-[#0682F4]/20 animate-pulse space-y-3"
                  >
                    <div className="h-4 bg-[#01213D] rounded w-1/3" />
                    <div className="h-6 bg-[#01213D] rounded w-3/4" />
                    <div className="h-12 bg-[#01213D] rounded w-full" />
                    <div className="h-4 bg-[#01213D] rounded w-1/2 pt-2" />
                  </div>
                ))}
              </div>
            ) : response?.results && response.results.length === 0 ? (
              /* Empty State */
              <div className="p-8 sm:p-12 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-[#0682F4]/10 border border-[#0682F4]/30 flex items-center justify-center mx-auto text-[#08E6F9]">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">No ecosystem results found</h3>
                  <p className="text-xs text-[#CCD2D9] max-w-md mx-auto mt-1">
                    We couldn&apos;t find matching records for &quot;{query}&quot;. Try checking for spelling errors,
                    shortening your keywords, or clearing selected filters.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => handleSearchSubmit('laptop')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white transition cursor-pointer"
                  >
                    Try &quot;laptop&quot;
                  </button>
                  <button
                    onClick={() => handleSearchSubmit('web development')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white transition cursor-pointer"
                  >
                    Try &quot;web development&quot;
                  </button>
                </div>
              </div>
            ) : (
              /* Search Results Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {response?.results.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(item.destinationUrl)}
                    className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 hover:border-[#08E6F9] transition-all duration-200 shadow-xl flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
                  >
                    <div className="space-y-3">
                      {/* Top Type Badge and Price */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                            item.type === 'PRODUCT'
                              ? 'text-[#06C3F8] bg-[#06C3F8]/10 border-[#06C3F8]/30'
                              : item.type === 'COURSE'
                              ? 'text-[#0682F4] bg-[#0682F4]/10 border-[#0682F4]/30'
                              : item.type === 'SERVICE'
                              ? 'text-[#26B2E2] bg-[#26B2E2]/10 border-[#26B2E2]/30'
                              : item.type === 'EXPERT'
                              ? 'text-[#08E6F9] bg-[#08E6F9]/10 border-[#08E6F9]/30'
                              : 'text-[#4DDEEA] bg-[#4DDEEA]/10 border-[#4DDEEA]/30'
                          }`}
                        >
                          {item.type}
                        </span>

                        {typeof item.price === 'number' && (
                          <span className="font-bold text-[#08E6F9] text-xs font-mono">
                            {formatNaira(item.price)}
                          </span>
                        )}
                      </div>

                      {/* Image Thumbnail if available */}
                      {item.imageUrl && (
                        <div className="h-32 w-full rounded-xl bg-[#01213D] overflow-hidden border border-[#0682F4]/20 relative">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-bold text-white text-sm group-hover:text-[#08E6F9] transition line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#CCD2D9]/70 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Badge / Category Metadata */}
                      {item.badge && (
                        <div className="text-[10px] font-mono text-[#CCD2D9]/60 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#08E6F9]" />
                          <span className="truncate">{item.badge}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-4 mt-2 border-t border-[#0682F4]/20 flex items-center justify-between text-xs text-[#08E6F9] font-bold group-hover:text-white">
                      <span>View details</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {response && response.totalPages > 1 && (
              <div className="pt-6 border-t border-[#0682F4]/20 flex items-center justify-between">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: response.totalPages }, (_, i) => i + 1).map((p) => {
                    const isCurr = p === currentPage;
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                          isCurr
                            ? 'bg-[#0682F4] text-white shadow-md shadow-[#0682F4]/30'
                            : 'bg-[#011B33] hover:bg-[#01213D] text-[#CCD2D9] hover:text-white border border-[#0682F4]/20'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={currentPage >= response.totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
