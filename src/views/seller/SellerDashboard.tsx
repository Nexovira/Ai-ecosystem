import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Boxes,
  Store,
  ShieldCheck,
  Settings,
  Search,
  Edit3,
  Archive,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Save,
  Clock,
  BookOpen,
  BarChart3,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';
import { Product } from '../../types/marketplace';
import { CloudinaryMediaGuide } from '../../components/seller/CloudinaryMediaGuide';

export const SellerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const {
    sellerProfile,
    sellerProducts,
    loadingSeller,
    isVerifiedSeller,
    archiveProduct,
    deleteProduct,
    updateStock,
    updateProfileDetails,
  } = useSeller();

  const { formatPrice } = useMarketplace();
  const { navigate } = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'products' | 'inventory' | 'profile' | 'verification' | 'media-guide'>('overview');

  // Filter & Search inside seller products
  const [productSearch, setProductSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Profile Edit State
  const [bizName, setBizName] = useState(sellerProfile?.businessName || '');
  const [bizDesc, setBizDesc] = useState(sellerProfile?.businessDescription || '');
  const [bizLocation, setBizLocation] = useState(sellerProfile?.businessLocation || '');
  const [bizPhone, setBizPhone] = useState(sellerProfile?.contactPhone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  // Stock edit state
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  // Seller Analytics State
  const [sellerAnalytics, setSellerAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  React.useEffect(() => {
    if (activeTab === 'analytics' && user) {
      setLoadingAnalytics(true);
      fetch(`/api/seller/analytics?userId=${encodeURIComponent(user.uid)}`, {
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile?.role || 'SELLER',
        },
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) setSellerAnalytics(res.data);
        })
        .catch(() => {})
        .finally(() => setLoadingAnalytics(false));
    }
  }, [activeTab, user, profile]);

  // Authentication & Verification Guard
  if (loadingSeller) {
    return (
      <div className="py-24 bg-[#01213D] min-h-[75vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0682F4] border-t-[#08E6F9] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#CCD2D9]">Loading merchant console...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 bg-[#01213D] min-h-[75vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-6 shadow-2xl">
            <Lock className="w-10 h-10 text-[#08E6F9] mx-auto" />
            <h2 className="font-display font-bold text-2xl text-white">Sign In Required</h2>
            <p className="text-xs text-[#CCD2D9]">
              Please sign in to your merchant account to access the seller console.
            </p>
            <Button variant="primary" size="md" onClick={() => navigate('/signin')} fullWidth>
              Sign In
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // Not a verified seller
  if (!isVerifiedSeller) {
    return (
      <div className="py-20 bg-[#01213D] min-h-[75vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#01213D] border border-amber-400/40 flex items-center justify-center text-amber-400 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                Merchant Credential Required
              </span>
              <h2 className="font-display font-bold text-2xl text-white">
                Seller Authorization Required
              </h2>
              <p className="text-xs sm:text-sm text-[#CCD2D9] leading-relaxed">
                Your account is currently registered with standard <strong>CUSTOMER</strong> privileges. To publish products and manage inventory on the Nexovira technology marketplace, please submit a seller application.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button variant="primary" size="md" onClick={() => navigate('/seller/apply')}>
                <span>Apply to Become a Seller</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="md" onClick={() => navigate('/marketplace')}>
                <span>Return to Marketplace</span>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Real Metrics Calculation (No fake revenue)
  const totalCount = sellerProducts.length;
  const publishedCount = sellerProducts.filter((p) => p.productStatus === 'PUBLISHED').length;
  const draftCount = sellerProducts.filter((p) => p.productStatus === 'DRAFT').length;
  const outOfStockCount = sellerProducts.filter((p) => p.stockQuantity === 0 || p.availabilityStatus === 'OUT_OF_STOCK').length;
  const lowStockCount = sellerProducts.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length;

  // Filtered seller products
  const filteredSellerProducts = sellerProducts.filter((p) => {
    if (statusFilter !== 'ALL' && p.productStatus !== statusFilter) return false;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    }
    return true;
  });

  const handleStockSave = async (productId: string) => {
    const newStock = stockEdits[productId];
    if (newStock === undefined || newStock < 0) return;
    setSavingStockId(productId);
    await updateStock(productId, newStock);
    setSavingStockId(null);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileNotice(null);
    const res = await updateProfileDetails({
      businessName: bizName.trim(),
      businessDescription: bizDesc.trim(),
      businessLocation: bizLocation.trim(),
      contactPhone: bizPhone.trim(),
    });
    setProfileSaving(false);
    if (res.success) {
      setProfileNotice('Storefront details updated.');
    } else {
      setProfileNotice(res.error || 'Failed to update storefront.');
    }
  };

  return (
    <div className="py-10 sm:py-16 bg-[#01213D] min-h-[90vh]">
      <Container size="wide">
        
        {/* Top Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#0682F4]/20 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#08E6F9] uppercase mb-1">
              <span>Merchant Administration Console</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">Verified Seller</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {sellerProfile?.businessName || 'SELLER CONSOLE'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/seller/digital-products')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0682F4]/30 hover:border-[#08E6F9] text-xs font-mono text-[#CCD2D9] hover:text-white transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#08E6F9]" />
              <span>Digital Publications</span>
            </button>

            {sellerProfile?.slug && (
              <button
                type="button"
                onClick={() => navigate(`/seller/${sellerProfile.slug}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0682F4]/30 hover:border-[#08E6F9] text-xs font-mono text-[#CCD2D9] hover:text-white transition-colors cursor-pointer"
              >
                <span>View Public Storefront</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#08E6F9]" />
              </button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/seller/products/new')}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Product</span>
            </Button>
          </div>
        </div>

        {/* Dashboard Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-3 bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-4 space-y-1.5 shadow-xl">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'analytics', label: 'Sales & Analytics', icon: BarChart3 },
              { id: 'products', label: 'Product Catalog', icon: Package, count: totalCount },
              { id: 'inventory', label: 'Inventory Management', icon: Boxes },
              { id: 'profile', label: 'Storefront Profile', icon: Store },
              { id: 'verification', label: 'Merchant Verification', icon: ShieldCheck },
              { id: 'media-guide', label: 'Image & Media Guide', icon: ImageIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left text-xs py-2.5 px-3 rounded-lg font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-bold shadow-md'
                      : 'text-[#CCD2D9] hover:bg-[#01213D] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isActive ? 'bg-[#01213D] text-[#08E6F9]' : 'bg-[#01213D] text-[#CCD2D9]/70'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-2 border-t border-[#0682F4]/20">
              <button
                type="button"
                onClick={() => navigate('/seller/digital-products')}
                className="w-full text-left text-xs py-2.5 px-3 rounded-lg font-medium transition-all flex items-center justify-between text-[#08E6F9] hover:bg-[#01213D] hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-[#08E6F9]" />
                  <span>Digital Publications</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9]">
                  Portal
                </span>
              </button>
            </div>
          </aside>

          {/* Main Workspace Area */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 5 Real Metric Cards (Zero Fake Revenue) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                  <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 space-y-1">
                    <span className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase">Total Products</span>
                    <div className="font-mono text-2xl font-bold text-white">{totalCount}</div>
                    <span className="text-[10px] text-[#08E6F9] font-mono block">Inventory units</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 space-y-1">
                    <span className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase">Live Published</span>
                    <div className="font-mono text-2xl font-bold text-white">{publishedCount}</div>
                    <span className="text-[10px] text-emerald-400 font-mono block">Active on marketplace</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 space-y-1">
                    <span className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase">Draft Products</span>
                    <div className="font-mono text-2xl font-bold text-white">{draftCount}</div>
                    <span className="text-[10px] text-[#CCD2D9]/60 font-mono block">Unpublished</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 space-y-1">
                    <span className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase">Low Stock</span>
                    <div className="font-mono text-2xl font-bold text-amber-400">{lowStockCount}</div>
                    <span className="text-[10px] text-amber-400/80 font-mono block">5 or fewer remaining</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/30 space-y-1">
                    <span className="text-[11px] font-mono text-[#CCD2D9]/70 uppercase">Out of Stock</span>
                    <div className="font-mono text-2xl font-bold text-red-400">{outOfStockCount}</div>
                    <span className="text-[10px] text-red-400/80 font-mono block">Replenishment needed</span>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 space-y-4">
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Merchant Actions & Status
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-2">
                      <span className="font-semibold text-white block">Add Hardware Listing</span>
                      <p className="text-[#CCD2D9]/80 text-[11px]">
                        Publish new appliances, electronics, or workstations directly into the catalog.
                      </p>
                      <Button variant="primary" size="sm" onClick={() => navigate('/seller/products/new')}>
                        Create Product Listing
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-2">
                      <span className="font-semibold text-white block">Manage Stock Quantities</span>
                      <p className="text-[#CCD2D9]/80 text-[11px]">
                        Adjust real-time inventory levels to prevent order cancellations.
                      </p>
                      <Button variant="secondary" size="sm" onClick={() => setActiveTab('inventory')}>
                        Open Inventory Adjuster
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SELLER SALES & ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
                    <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70">Gross Sales Volume</span>
                    <div className="text-xl font-bold text-white">
                      ₦{(sellerAnalytics?.grossSalesVolume || 0).toLocaleString()} NGN
                    </div>
                    <span className="text-[10px] text-[#CCD2D9]/60 font-mono">
                      {sellerAnalytics?.totalUnitsSold || 0} units sold across orders
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
                    <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70">Net Merchant Earnings (90%)</span>
                    <div className="text-xl font-bold text-[#08E6F9]">
                      ₦{(sellerAnalytics?.netEarnings || 0).toLocaleString()} NGN
                    </div>
                    <span className="text-[10px] text-[#CCD2D9]/60 font-mono">
                      Available in wallet: ₦{(sellerAnalytics?.availableWalletBalance || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
                    <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70">Average Order Value</span>
                    <div className="text-xl font-bold text-white">
                      ₦{(sellerAnalytics?.averageOrderValue || 0).toLocaleString()} NGN
                    </div>
                    <span className="text-[10px] text-[#CCD2D9]/60 font-mono">
                      Fulfillment Rate: {sellerAnalytics?.orderFulfillmentRate || 100}%
                    </span>
                  </div>
                </div>

                {/* Recent Sales Trend */}
                <div className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#08E6F9]" />
                      <h3 className="text-sm font-bold text-white">7-Day Sales Performance</h3>
                    </div>
                    <span className="text-xs font-mono text-[#CCD2D9]/60">Verified Settlement Data</span>
                  </div>

                  {loadingAnalytics ? (
                    <div className="py-12 text-center text-xs text-[#CCD2D9]/60 font-mono">
                      Syncing store performance records...
                    </div>
                  ) : (
                    <div className="h-40 flex items-end gap-3 pt-6 pb-2 border-b border-[#0682F4]/20">
                      {(sellerAnalytics?.recentSalesTrend || []).map((pt: any, idx: number) => {
                        const maxVal = Math.max(...(sellerAnalytics?.recentSalesTrend || []).map((p: any) => p.value), 1000);
                        const height = Math.max(10, Math.round((pt.value / maxVal) * 100));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition bg-black/90 text-[#08E6F9] text-[10px] font-mono px-2 py-0.5 rounded border border-[#0682F4]/40 z-20 pointer-events-none">
                              ₦{pt.value.toLocaleString()}
                            </div>
                            <div
                              style={{ height: `${height}%` }}
                              className={`w-full rounded-t transition-all ${
                                pt.value > 0 ? 'bg-gradient-to-t from-[#0682F4] to-[#08E6F9]' : 'bg-[#01213D]'
                              }`}
                            />
                            <span className="text-[10px] font-mono text-[#CCD2D9]/50 truncate w-full text-center">
                              {pt.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCTS TABLE */}
            {activeTab === 'products' && (
              <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 space-y-6 shadow-xl">
                
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 w-4 h-4 text-[#0682F4]" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search own products by SKU/name..."
                      className="w-full bg-[#01213D] text-white text-xs pl-9 pr-3 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#01213D] text-white text-xs px-3 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>

                    <Button variant="primary" size="sm" onClick={() => navigate('/seller/products/new')}>
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>New</span>
                    </Button>
                  </div>
                </div>

                {/* Table */}
                {filteredSellerProducts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#CCD2D9]/70 space-y-3">
                    <p>No products match your criteria in your inventory.</p>
                    <Button variant="secondary" size="sm" onClick={() => navigate('/seller/products/new')}>
                      Create First Product
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#0682F4]/20 text-[#CCD2D9]/70 font-mono uppercase text-[10px]">
                          <th className="py-3 px-3 text-left">Product</th>
                          <th className="py-3 px-3 text-left">Category</th>
                          <th className="py-3 px-3 text-right">Price</th>
                          <th className="py-3 px-3 text-center">Stock</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#0682F4]/10 font-mono">
                        {filteredSellerProducts.map((p) => (
                          <tr key={p.productId} className="hover:bg-[#01213D]/40 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#01213D] overflow-hidden shrink-0 border border-[#0682F4]/20">
                                  <img
                                    src={p.productImages[0]?.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-white font-sans truncate max-w-xs">
                                    {p.name}
                                  </div>
                                  <div className="text-[10px] text-[#CCD2D9]/60">{p.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[#CCD2D9] font-sans">{p.category}</td>
                            <td className="py-3 px-3 text-right font-bold text-white">
                              {formatPrice(p.discountPrice ?? p.price, p.currency)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] ${
                                  p.stockQuantity === 0
                                    ? 'bg-red-950/60 text-red-400'
                                    : p.stockQuantity <= 5
                                    ? 'bg-amber-950/60 text-amber-400'
                                    : 'bg-[#01213D] text-[#08E6F9]'
                                }`}
                              >
                                {p.stockQuantity} units
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] ${
                                  p.productStatus === 'PUBLISHED'
                                    ? 'bg-emerald-950/60 text-emerald-400'
                                    : p.productStatus === 'DRAFT'
                                    ? 'bg-neutral-800 text-neutral-400'
                                    : 'bg-red-950/60 text-red-400'
                                }`}
                              >
                                {p.productStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/marketplace/product/${p.slug}`)}
                                  className="p-1.5 rounded text-[#CCD2D9] hover:text-[#08E6F9] hover:bg-[#01213D]"
                                  title="View on Marketplace"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/seller/products/edit/${p.productId}`)}
                                  className="p-1.5 rounded text-[#CCD2D9] hover:text-white hover:bg-[#01213D]"
                                  title="Edit Product"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => archiveProduct(p.productId)}
                                  className="p-1.5 rounded text-[#CCD2D9] hover:text-amber-400 hover:bg-[#01213D]"
                                  title="Archive"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteProduct(p.productId)}
                                  className="p-1.5 rounded text-[#CCD2D9] hover:text-red-400 hover:bg-[#01213D]"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: INVENTORY ADJUSTMENT */}
            {activeTab === 'inventory' && (
              <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="border-b border-[#0682F4]/20 pb-4">
                  <h3 className="font-display font-bold text-base text-white">
                    Stock & Replenishment Controls
                  </h3>
                  <p className="text-xs text-[#CCD2D9]/70 mt-1">
                    Updates made here adjust product availability across the active marketplace immediately.
                  </p>
                </div>

                <div className="space-y-3">
                  {sellerProducts.map((p) => {
                    const currentVal = stockEdits[p.productId] ?? p.stockQuantity;
                    return (
                      <div
                        key={p.productId}
                        className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#011629] overflow-hidden shrink-0 border border-[#0682F4]/20">
                            <img src={p.productImages[0]?.url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white">{p.name}</div>
                            <div className="text-xs font-mono text-[#08E6F9]">{p.sku}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <label className="text-xs font-mono text-[#CCD2D9]">Units Available:</label>
                          <input
                            type="number"
                            min={0}
                            value={currentVal}
                            onChange={(e) =>
                              setStockEdits({
                                ...stockEdits,
                                [p.productId]: Math.max(0, Number(e.target.value)),
                              })
                            }
                            className="w-20 bg-[#011629] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#0682F4]/30 font-mono text-center"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={savingStockId === p.productId || stockEdits[p.productId] === undefined}
                            onClick={() => handleStockSave(p.productId)}
                            className="text-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: STOREFRONT PROFILE */}
            {activeTab === 'profile' && (
              <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="border-b border-[#0682F4]/20 pb-4">
                  <h3 className="font-display font-bold text-base text-white">
                    Public Storefront Information
                  </h3>
                  <p className="text-xs text-[#CCD2D9]/70 mt-1">
                    This information appears on your dedicated seller store URL. Sensitive banking data is never collected or shown here.
                  </p>
                </div>

                {profileNotice && (
                  <div className="p-3.5 rounded-lg bg-[#01213D] border border-[#08E6F9]/40 text-xs text-[#08E6F9]">
                    {profileNotice}
                  </div>
                )}

                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                      Store / Trading Name
                    </label>
                    <input
                      type="text"
                      required
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                      Store Description
                    </label>
                    <textarea
                      rows={3}
                      value={bizDesc}
                      onChange={(e) => setBizDesc(e.target.value)}
                      className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                      Physical Operating Location
                    </label>
                    <input
                      type="text"
                      value={bizLocation}
                      onChange={(e) => setBizLocation(e.target.value)}
                      placeholder="City, Country"
                      className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                      Public Customer Inquiries Contact
                    </label>
                    <input
                      type="tel"
                      value={bizPhone}
                      onChange={(e) => setBizPhone(e.target.value)}
                      placeholder="Public inquiry phone"
                      className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" variant="primary" size="md" disabled={profileSaving}>
                      <Save className="w-4 h-4" />
                      <span>{profileSaving ? 'Saving Storefront...' : 'Save Store Details'}</span>
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 5: VERIFICATION */}
            {activeTab === 'verification' && (
              <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="border-b border-[#0682F4]/20 pb-4">
                  <h3 className="font-display font-bold text-base text-white">
                    Merchant Verification Status
                  </h3>
                  <p className="text-xs text-[#CCD2D9]/70 mt-1">
                    Credential audit record managed strictly by backend authorization rules.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#01213D] border border-[#08E6F9]/40 flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-[#08E6F9]" />
                  <div>
                    <div className="font-bold text-white text-sm">Status: VERIFIED MERCHANT</div>
                    <div className="text-xs text-[#CCD2D9]/70">
                      Merchant ID: {sellerProfile?.sellerId || `seller-${user.uid}`}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#CCD2D9] leading-relaxed">
                  <p>
                    • Verified merchants have permission to create and update physical product listings.
                  </p>
                  <p>
                    • Bank verification, payment processing, and escrow payouts will be integrated in Phase 5 via certified payment partner infrastructure.
                  </p>
                  <p>
                    • No bank passwords, pins, or sensitive credentials are ever held in the Nexovira client.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 6: MEDIA & CLOUDINARY GUIDE */}
            {activeTab === 'media-guide' && (
              <CloudinaryMediaGuide />
            )}
          </main>

        </div>
      </Container>
    </div>
  );
};
