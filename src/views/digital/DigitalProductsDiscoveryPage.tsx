import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import {
  DigitalProduct,
  DigitalProductCategory,
  DigitalProductType,
} from '../../types/digitalProduct';
import {
  Search,
  BookOpen,
  Download,
  Filter,
  Star,
  FileText,
  Code,
  Briefcase,
  Layout,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const TYPE_LABELS: Record<DigitalProductType, string> = {
  EBOOK: 'Ebook',
  PDF: 'PDF Guide',
  GUIDE: 'Technical Guide',
  TEMPLATE: 'Architecture Template',
  DIGITAL_RESOURCE: 'System Resource',
  DOCUMENT: 'Specification Doc',
  OTHER_APPROVED: 'Digital Asset',
};

export const DigitalProductsDiscoveryPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [categories, setCategories] = useState<DigitalProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isFreeFilter, setIsFreeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating'>('popular');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch Categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/digital-products/categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.warn('Failed to load digital categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Products
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        if (selectedType !== 'all') params.set('type', selectedType);
        if (isFreeFilter === 'free') params.set('isFree', 'true');
        if (isFreeFilter === 'paid') params.set('isFree', 'false');
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        params.set('sort', sortBy);
        params.set('page', page.toString());
        params.set('limit', '9');

        const res = await fetch(`/api/digital-products?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.products || []);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.total || 0);
        }
      } catch (err) {
        console.error('Failed to load digital products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [selectedCategory, selectedType, isFreeFilter, sortBy, page, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Digital Deliverable';
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cloud':
        return <Layers className="w-4 h-4 text-[#08E6F9]" />;
      case 'Code':
        return <Code className="w-4 h-4 text-[#0682F4]" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4 text-[#26B2E2]" />;
      case 'Briefcase':
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case 'Layout':
        return <Layout className="w-4 h-4 text-violet-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-[#08E6F9]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#011B33] text-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#0682F4]/20 bg-gradient-to-b from-[#01213D] to-[#011B33]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#08E6F9] tracking-wide uppercase">
                <BookOpen className="w-4 h-4" />
                <span>Verified Content Commerce</span>
                <span aria-hidden="true" className="text-[#CCD2D9]/40">·</span>
                <span>Protected Deliverables</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Digital Publications & Architectural Blueprints
              </h1>
              <p className="text-sm sm:text-base text-[#CCD2D9] leading-relaxed max-w-2xl">
                Technical handbooks, cloud system architectures, institutional financial workbooks, and system engineering templates authored by verified specialists.
              </p>
            </div>

            {user && (
              <div className="shrink-0">
                <button
                  onClick={() => navigate('/account/digital-library')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/40 hover:border-[#08E6F9] text-white text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-lg group cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#08E6F9]" />
                  <span>Access My Digital Library</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#08E6F9] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-3xl">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-[#CCD2D9]/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search publications by title, technology, author, or keyword..."
                className="w-full pl-12 pr-28 py-3.5 bg-[#011B33] border border-[#0682F4]/30 rounded-xl text-white placeholder-[#CCD2D9]/50 text-sm focus:outline-none focus:border-[#08E6F9] focus:ring-1 focus:ring-[#08E6F9] transition shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-[#0682F4] hover:bg-[#05A9F7] text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Catalog View */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category Tabs (Interactive Segmented Control) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              selectedCategory === 'all'
                ? 'bg-[#0682F4] text-white shadow-md shadow-[#0682F4]/20'
                : 'bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9] hover:text-white hover:border-[#08E6F9]/50'
            }`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.slug);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                selectedCategory === cat.slug
                  ? 'bg-[#0682F4] text-white shadow-md shadow-[#0682F4]/20'
                  : 'bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9] hover:text-white hover:border-[#08E6F9]/50'
              }`}
            >
              {getCategoryIcon(cat.icon)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Filter and Sorting Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* Format Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#CCD2D9]">
              <Filter className="w-3.5 h-3.5 text-[#08E6F9]" />
              <span className="font-semibold text-white">Format:</span>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="bg-[#011B33] border border-[#0682F4]/30 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#08E6F9]"
              >
                <option value="all">All Formats</option>
                <option value="EBOOK">Ebook</option>
                <option value="PDF">PDF Guide</option>
                <option value="TEMPLATE">Template</option>
                <option value="DIGITAL_RESOURCE">Resource Kit</option>
                <option value="DOCUMENT">Documentation</option>
              </select>
            </div>

            {/* Free/Paid Filter */}
            <div className="flex items-center gap-1 bg-[#011B33] p-1 rounded-lg border border-[#0682F4]/30">
              <button
                onClick={() => {
                  setIsFreeFilter('all');
                  setPage(1);
                }}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  isFreeFilter === 'all' ? 'bg-[#0682F4] text-white font-bold' : 'text-[#CCD2D9] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setIsFreeFilter('free');
                  setPage(1);
                }}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  isFreeFilter === 'free' ? 'bg-[#0682F4] text-white font-bold' : 'text-[#CCD2D9] hover:text-white'
                }`}
              >
                Free Only
              </button>
              <button
                onClick={() => {
                  setIsFreeFilter('paid');
                  setPage(1);
                }}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  isFreeFilter === 'paid' ? 'bg-[#0682F4] text-white font-bold' : 'text-[#CCD2D9] hover:text-white'
                }`}
              >
                Paid
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Counter */}
            <span className="text-xs text-[#CCD2D9] font-mono">
              {totalCount} {totalCount === 1 ? 'publication' : 'publications'}
            </span>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5 text-xs text-[#CCD2D9]">
              <span className="font-semibold text-white">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="bg-[#011B33] border border-[#0682F4]/30 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#08E6F9]"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newly Published</option>
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-[#01213D]/60 border border-[#0682F4]/20 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="py-20 text-center rounded-2xl bg-[#01213D] border border-[#0682F4]/20 p-8 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#011B33] border border-[#0682F4]/40 flex items-center justify-center mx-auto text-[#08E6F9]">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No publications matched your search</h3>
            <p className="text-xs text-[#CCD2D9]">
              Try adjusting your category filter, keyword query, or pricing filter to explore more approved digital assets.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedType('all');
                setIsFreeFilter('all');
                setSearchQuery('');
                setPage(1);
              }}
              className="px-4 py-2 bg-[#0682F4] hover:bg-[#05A9F7] text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/digital-products/${item.slug}`)}
                className="group flex flex-col justify-between rounded-2xl bg-[#01213D] border border-[#0682F4]/20 hover:border-[#08E6F9]/60 hover:shadow-xl hover:shadow-[#0682F4]/10 transition-all duration-200 overflow-hidden cursor-pointer"
              >
                {/* Visual Cover Asset */}
                <div className="relative aspect-[16/10] bg-[#011B33] overflow-hidden">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Resilient fallback container if external host fails
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Built-in Styled Gradient Fallback in DOM underneath */}
                  <div className="absolute inset-0 -z-10 flex flex-col justify-between p-5 bg-gradient-to-br from-[#01213D] to-[#011B33]">
                    <div className="flex items-center justify-between text-xs font-mono text-[#08E6F9]">
                      <span>{TYPE_LABELS[item.productType] || item.productType}</span>
                      <span>v{item.fileMetadata?.version || '1.0'}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-2">{item.title}</h4>
                      <p className="text-[11px] text-[#CCD2D9] mt-1">{item.categoryName}</p>
                    </div>
                  </div>

                  {/* Format & Free Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-[#011B33]/90 backdrop-blur-md border border-[#0682F4]/40 text-[#08E6F9]">
                      {TYPE_LABELS[item.productType] || item.productType}
                    </span>
                    {item.isFree && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-emerald-500/90 text-white">
                        Free Access
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Unboxed Metadata (Zero-Pill Rule) */}
                    <div className="flex items-center gap-2 text-xs text-[#CCD2D9]">
                      <span>{item.categoryName}</span>
                      <span aria-hidden="true" className="text-[#0682F4]">·</span>
                      <span className="truncate max-w-[140px] text-[#08E6F9] font-medium">{item.creatorName}</span>
                      <span aria-hidden="true" className="text-[#0682F4]">·</span>
                      <span className="font-mono text-[11px]">{formatFileSize(item.fileMetadata?.fileSize)}</span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-[#08E6F9] transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-[#CCD2D9]/80 line-clamp-2 leading-relaxed">
                      {item.shortDescription}
                    </p>
                  </div>

                  {/* Footer Strip */}
                  <div className="pt-3 border-t border-[#0682F4]/20 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#CCD2D9]">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-mono font-bold text-white">{item.rating.toFixed(1)}</span>
                      <span className="text-[11px]">({item.reviewCount})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white font-mono">
                        {item.isFree ? 'FREE' : formatPrice(item.price)}
                      </span>
                      <span className="p-1.5 rounded-lg bg-[#011B33] border border-[#0682F4]/30 text-[#08E6F9] group-hover:bg-[#0682F4] group-hover:text-white transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0682F4]/20 transition cursor-pointer"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    page === i + 1
                      ? 'bg-[#0682F4] text-white shadow-md'
                      : 'bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9] hover:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0682F4]/20 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
