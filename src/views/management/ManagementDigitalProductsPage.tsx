import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import {
  DigitalProduct,
  DigitalProductCategory,
  DigitalProductReport,
  DigitalProductStatus,
  DigitalProductType,
} from '../../types/digitalProduct';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Flag,
  FileText,
  Clock,
  Layers,
  Save,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export const ManagementDigitalProductsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();

  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [categories, setCategories] = useState<DigitalProductCategory[]>([]);
  const [reports, setReports] = useState<DigitalProductReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'published' | 'categories' | 'reports'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Moderation Modal State
  const [modProduct, setModProduct] = useState<DigitalProduct | null>(null);
  const [modStatus, setModStatus] = useState<DigitalProductStatus>('PUBLISHED');
  const [modReason, setModReason] = useState('Editorial review approved');
  const [submittingMod, setSubmittingMod] = useState(false);

  // Create / Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<DigitalProduct> | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Delete Product Confirmation State
  const [deleteProductTarget, setDeleteProductTarget] = useState<DigitalProduct | null>(null);
  const [deleteMode, setDeleteMode] = useState<'ARCHIVE' | 'PERMANENT'>('ARCHIVE');
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Category Modal State
  const [editingCategory, setEditingCategory] = useState<Partial<DigitalProductCategory> | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<DigitalProductCategory | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-id': user?.uid || '',
    'x-user-role': profile?.role || 'ADMIN',
    'x-user-email': user?.email || '',
  });

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = getHeaders();

      // Fetch management products
      const res = await fetch(
        `/api/management/digital-products?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`,
        { headers }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      }

      // Fetch categories
      const catRes = await fetch('/api/management/digital-products/categories', { headers });
      const catData = await catRes.json();
      if (catData.success && Array.isArray(catData.categories)) {
        setCategories(catData.categories);
      }

      // Fetch reports
      const repRes = await fetch('/api/management/digital-products/reports', { headers });
      const repData = await repRes.json();
      if (repData.success && Array.isArray(repData.reports)) {
        setReports(repData.reports);
      }
    } catch (err) {
      console.error('Failed to load management digital products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, profile, statusFilter, searchQuery]);

  // Handle Moderation
  const handleModerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !modProduct) return;
    setSubmittingMod(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/management/digital-products/${modProduct.productId}/status`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          status: modStatus,
          reason: modReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to moderate publication');
      }

      setFeedback({ type: 'success', text: `Publication status updated to ${modStatus}.` });
      setModProduct(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error moderating publication';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingMod(false);
    }
  };

  // Handle Save Digital Product (Create / Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingProduct) return;
    setSubmittingProduct(true);
    setFeedback(null);

    try {
      const url = isCreatingProduct
        ? '/api/management/digital-products'
        : `/api/management/digital-products/${editingProduct.productId}`;
      const method = isCreatingProduct ? 'POST' : 'PUT';

      const payload = {
        title: editingProduct.title,
        description: editingProduct.description,
        shortDescription: editingProduct.shortDescription || editingProduct.description?.slice(0, 160),
        categorySlug: editingProduct.categorySlug || 'cloud-systems',
        productType: editingProduct.productType || 'TEMPLATE',
        price: Number(editingProduct.price) || 0,
        currency: 'NGN',
        coverImage: editingProduct.coverImage || '/assets/images/marketplace_mesh_hub_1790288928550.jpg',
        fileMetadata: {
          fileName: editingProduct.fileMetadata?.fileName || `${editingProduct.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'document'}.pdf`,
          fileSize: editingProduct.fileMetadata?.fileSize || 4500000,
          fileType: editingProduct.fileMetadata?.fileType || 'pdf',
          mimeType: editingProduct.fileMetadata?.mimeType || 'application/pdf',
          version: editingProduct.fileMetadata?.version || '1.0',
          pageCount: editingProduct.fileMetadata?.pageCount || 48,
        },
        externalFileUrl: editingProduct.externalFileUrl || 'https://storage.googleapis.com/nexovira-assets/sample.pdf',
        previewInfo: {
          previewType: 'PREVIEW_PDF' as const,
          samplePdfUrl: editingProduct.previewInfo?.samplePdfUrl || undefined,
        },
        status: editingProduct.status || 'PUBLISHED',
      };

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save digital product');
      }

      setFeedback({
        type: 'success',
        text: isCreatingProduct
          ? `Digital publication "${payload.title}" created successfully.`
          : `Digital publication "${payload.title}" updated.`,
      });
      setEditingProduct(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving digital product';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Handle Delete / Archive Digital Product
  const handleDeleteProduct = async () => {
    if (!user || !deleteProductTarget) return;
    setSubmittingDelete(true);
    setFeedback(null);

    try {
      const isPermanent = deleteMode === 'PERMANENT';
      const res = await fetch(
        `/api/management/digital-products/${deleteProductTarget.productId}?permanent=${isPermanent}`,
        {
          method: 'DELETE',
          headers: getHeaders(),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process publication removal');
      }

      const notice = data.mode === 'PERMANENT'
        ? `Publication "${deleteProductTarget.title}" was permanently deleted.`
        : `Publication "${deleteProductTarget.title}" was archived safely (${data.reason || 'Protected customer entitlements'}).`;

      setFeedback({ type: 'success', text: notice });
      setDeleteProductTarget(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting publication';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Handle Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingCategory) return;
    setSubmittingCategory(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/management/digital-products/categories', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(editingCategory),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save category');
      }

      setFeedback({ type: 'success', text: `Category "${editingCategory.name}" saved.` });
      setEditingCategory(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving category';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = async () => {
    if (!user || !deleteCategoryTarget) return;
    setFeedback(null);

    try {
      const res = await fetch(`/api/management/digital-products/categories/${deleteCategoryTarget.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete category');
      }

      setFeedback({ type: 'success', text: data.message || `Category processed.` });
      setDeleteCategoryTarget(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting category';
      setFeedback({ type: 'error', text: msg });
    }
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(p);
  };

  const pendingList = products.filter((p) => p.status === 'PENDING_REVIEW');
  const publishedList = products.filter((p) => p.status === 'PUBLISHED');

  const displayedProducts =
    activeTab === 'pending'
      ? pendingList
      : activeTab === 'published'
      ? publishedList
      : products;

  return (
    <ManagementLayout
      activeRoute="/management/digital-products"
      requiredPermission="DIGITAL_PRODUCTS_VIEW"
      title="Digital Products & Content Commerce Desk"
      subtitle="Authoritative ecosystem management for technical blueprints, engineering ebooks, architectural software, and digital categories."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingProduct({
                title: '',
                description: '',
                shortDescription: '',
                categorySlug: categories[0]?.slug || 'cloud-systems',
                productType: 'TEMPLATE',
                price: 0,
                status: 'PUBLISHED',
                fileMetadata: {
                  fileName: 'guide.pdf',
                  fileType: 'pdf',
                  mimeType: 'application/pdf',
                  fileSize: 4500000,
                  version: '1.0',
                  pageCount: 45,
                },
                externalFileUrl: 'https://storage.googleapis.com/nexovira-assets/sample.pdf',
              });
              setIsCreatingProduct(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer hover:opacity-95 transition"
          >
            <Plus className="w-4 h-4 text-[#01213D]" />
            <span>Add Digital Publication</span>
          </button>
          <button
            onClick={() => navigate('/digital-products')}
            className="px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 hover:border-[#08E6F9] text-xs font-semibold text-[#08E6F9] transition flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-[#CCD2D9] hover:text-white cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/20">
            <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70 block">Total Publications</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{products.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/20">
            <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70 block">Pending Review</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">{pendingList.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/20">
            <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70 block">Live Published</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{publishedList.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/20">
            <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70 block">Content Categories</span>
            <span className="text-2xl font-black text-[#08E6F9] font-mono mt-1 block">{categories.length}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#0682F4]/20 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#0682F4] text-white'
                : 'text-[#CCD2D9] hover:text-white hover:bg-[#01213D]'
            }`}
          >
            All Publications ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-[#0682F4] text-white'
                : 'text-[#CCD2D9] hover:text-white hover:bg-[#01213D]'
            }`}
          >
            <span>Pending Review</span>
            {pendingList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-400 text-black font-bold">
                {pendingList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'published'
                ? 'bg-[#0682F4] text-white'
                : 'text-[#CCD2D9] hover:text-white hover:bg-[#01213D]'
            }`}
          >
            Published ({publishedList.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-[#0682F4] text-white'
                : 'text-[#CCD2D9] hover:text-white hover:bg-[#01213D]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#08E6F9]" />
            <span>Categories ({categories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-[#0682F4] text-white'
                : 'text-[#CCD2D9] hover:text-white hover:bg-[#01213D]'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            <span>Reports ({reports.length})</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'categories' ? (
          /* Categories Tab */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Digital Product Categories</h2>
                <p className="text-xs text-[#CCD2D9]">Manage technical domains and blueprint classifications.</p>
              </div>
              <button
                onClick={() => {
                  setEditingCategory({
                    name: '',
                    slug: '',
                    description: '',
                    isActive: true,
                    displayOrder: categories.length + 1,
                  });
                  setIsCreatingCategory(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0682F4]/20 border border-[#0682F4]/40 hover:bg-[#0682F4] hover:text-white text-[#08E6F9] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{cat.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        cat.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-[#CCD2D9] line-clamp-2">{cat.description}</p>
                  <div className="text-[11px] font-mono text-[#08E6F9]">Slug: /{cat.slug} · Order #{cat.displayOrder}</div>
                  <div className="flex items-center gap-2 pt-2 border-t border-[#0682F4]/15">
                    <button
                      onClick={() => {
                        setEditingCategory({ ...cat });
                        setIsCreatingCategory(false);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white text-xs font-semibold transition text-center cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteCategoryTarget(cat)}
                      className="p-1.5 rounded-lg bg-[#01213D] hover:bg-red-500/20 border border-red-500/30 text-red-400 transition cursor-pointer"
                      title="Delete / Deactivate Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'reports' ? (
          /* Reports Tab */
          <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/20 overflow-hidden shadow-xl">
            {reports.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#CCD2D9]">No reports recorded.</div>
            ) : (
              <div className="divide-y divide-[#0682F4]/15">
                {reports.map((rep) => (
                  <div key={rep.id} className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Product ID: {rep.productId}</span>
                      <span className="font-mono text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                        {rep.reason}
                      </span>
                    </div>
                    <p className="text-[#CCD2D9]">{rep.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Publications Table */
          <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/20 overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-[#CCD2D9]">Loading publications...</div>
            ) : displayedProducts.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#CCD2D9]">No publications found for this view.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#CCD2D9]">
                  <thead className="bg-[#01213D] text-[11px] font-mono uppercase text-[#CCD2D9]/80 border-b border-[#0682F4]/20">
                    <tr>
                      <th className="py-3 px-4">Publication</th>
                      <th className="py-3 px-4">Author / Role</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Format</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0682F4]/10">
                    {displayedProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#01213D]/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white max-w-xs truncate">{p.title}</div>
                          <div className="text-[10px] text-[#CCD2D9]/60 font-mono">v{p.fileMetadata?.version || '1.0'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-white font-medium">{p.creatorName}</div>
                          <div className="text-[10px] text-[#08E6F9]">{p.creatorRole}</div>
                        </td>
                        <td className="py-3.5 px-4">{p.categoryName}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#08E6F9]">{p.productType}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          {p.isFree ? 'FREE' : formatPrice(p.price)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                              p.status === 'PUBLISHED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : p.status === 'PENDING_REVIEW'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => navigate(`/digital-products/${p.slug}`)}
                            className="p-1.5 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white transition cursor-pointer"
                            title="Inspect Storefront"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct({ ...p });
                              setIsCreatingProduct(false);
                            }}
                            className="p-1.5 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] transition cursor-pointer"
                            title="Edit Publication"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setModProduct(p);
                              setModStatus(p.status === 'PENDING_REVIEW' ? 'PUBLISHED' : p.status);
                              setModReason('Editorial review complete');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#0682F4] hover:bg-[#05A9F7] text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            Moderate
                          </button>
                          <button
                            onClick={() => {
                              setDeleteProductTarget(p);
                              setDeleteMode('ARCHIVE');
                            }}
                            className="p-1.5 rounded-lg bg-[#01213D] hover:bg-red-500/20 border border-red-500/30 text-red-400 transition cursor-pointer"
                            title="Delete or Archive Publication"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-xl w-full my-8 rounded-3xl bg-[#011B33] border border-[#0682F4]/40 p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-xs text-[#CCD2D9]">
            <div className="flex items-center justify-between border-b border-[#0682F4]/30 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <BookOpen className="w-4 h-4 text-[#08E6F9]" />
                <span>{isCreatingProduct ? 'Create New Digital Publication' : 'Edit Digital Publication'}</span>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-[#CCD2D9] hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Publication Title *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.title || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  placeholder="e.g. Distributed Consensus Blueprints"
                  className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Category *</label>
                  <select
                    value={editingProduct.categorySlug || 'cloud-systems'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categorySlug: e.target.value })}
                    className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#08E6F9]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Format / Type *</label>
                  <select
                    value={editingProduct.productType || 'BLUEPRINT'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, productType: e.target.value as DigitalProductType })}
                    className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#08E6F9]"
                  >
                    <option value="BLUEPRINT">Technical Blueprint</option>
                    <option value="EBOOK">Ebook Handbook</option>
                    <option value="GUIDE">Engineering Guide</option>
                    <option value="TEMPLATE">Source Code / Template</option>
                    <option value="WHITE_PAPER">White Paper</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Price (NGN) - 0 for Free</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={editingProduct.price ?? 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Status *</label>
                  <select
                    value={editingProduct.status || 'PUBLISHED'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as DigitalProductStatus })}
                    className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#08E6F9]"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live on storefront)</option>
                    <option value="PENDING_REVIEW">PENDING_REVIEW (Queued for editorial)</option>
                    <option value="UNPUBLISHED">UNPUBLISHED (Hidden from catalog)</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Short Summary *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.shortDescription || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  placeholder="One-line summary for cards and search snippets..."
                  className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Comprehensive publication overview, prerequisites, and table of contents..."
                  className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Download File Asset URL</label>
                <input
                  type="text"
                  value={editingProduct.externalFileUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, externalFileUrl: e.target.value })}
                  placeholder="https://... or cloud storage link for entitled buyers"
                  className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-[#01213D] text-[#CCD2D9] hover:text-white border border-[#0682F4]/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-5 py-2 rounded-xl bg-[#0682F4] hover:bg-[#05A9F7] text-white font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingProduct ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Publication</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / ARCHIVE CONFIRMATION MODAL */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl bg-[#011B33] border border-red-500/40 p-6 shadow-2xl space-y-4 text-xs text-[#CCD2D9]">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>Confirm Publication Removal</span>
            </div>
            <p>
              Choose the removal policy for <strong className="text-white">"{deleteProductTarget.title}"</strong>:
            </p>

            <div className="space-y-2">
              <label className="flex items-start gap-2 p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 cursor-pointer">
                <input
                  type="radio"
                  name="delMode"
                  value="ARCHIVE"
                  checked={deleteMode === 'ARCHIVE'}
                  onChange={() => setDeleteMode('ARCHIVE')}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-white block">Safe Archival (Recommended)</span>
                  <span className="text-[11px] text-[#CCD2D9]/70">
                    Hides from public marketplace while preserving download entitlements for previous buyers.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 p-3 rounded-xl bg-[#01213D] border border-red-500/30 cursor-pointer">
                <input
                  type="radio"
                  name="delMode"
                  value="PERMANENT"
                  checked={deleteMode === 'PERMANENT'}
                  onChange={() => setDeleteMode('PERMANENT')}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-red-400 block">Permanent Deletion</span>
                  <span className="text-[11px] text-[#CCD2D9]/70">
                    Deletes record permanently. Allowed only if 0 customers have purchased this item.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#0682F4]/20">
              <button
                type="button"
                onClick={() => setDeleteProductTarget(null)}
                className="px-4 py-2 rounded-xl bg-[#01213D] text-[#CCD2D9] hover:text-white border border-[#0682F4]/20 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDelete}
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {submittingDelete ? 'Processing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / CREATE CATEGORY MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl bg-[#011B33] border border-[#0682F4]/40 p-6 shadow-2xl space-y-4 text-xs text-[#CCD2D9]">
            <div className="flex items-center justify-between border-b border-[#0682F4]/30 pb-3">
              <span className="text-white font-bold text-sm">
                {isCreatingCategory ? 'Add Digital Category' : 'Edit Digital Category'}
              </span>
              <button onClick={() => setEditingCategory(null)} className="text-[#CCD2D9] hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Display Order</label>
                  <input
                    type="number"
                    value={editingCategory.displayOrder || 1}
                    onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: Number(e.target.value) })}
                    className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Status</label>
                  <select
                    value={editingCategory.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingCategory({ ...editingCategory, isActive: e.target.value === 'true' })}
                    className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl bg-[#01213D] text-[#CCD2D9] hover:text-white border border-[#0682F4]/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="px-5 py-2 rounded-xl bg-[#0682F4] hover:bg-[#05A9F7] text-white font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingCategory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {deleteCategoryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl bg-[#011B33] border border-red-500/40 p-6 shadow-2xl space-y-4 text-xs text-[#CCD2D9]">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span>Confirm Category Removal</span>
            </div>
            <p>
              Are you sure you want to delete or deactivate <strong className="text-white">"{deleteCategoryTarget.name}"</strong>? If active publications belong to this category, it will automatically be deactivated instead of broken.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#0682F4]/20">
              <button
                type="button"
                onClick={() => setDeleteCategoryTarget(null)}
                className="px-4 py-2 rounded-xl bg-[#01213D] text-[#CCD2D9] hover:text-white border border-[#0682F4]/20 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODERATION ACTION MODAL */}
      {modProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl bg-[#011B33] border border-[#0682F4]/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/30 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <BookOpen className="w-4 h-4 text-[#08E6F9]" />
                <span>Editorial Status Moderation</span>
              </div>
              <button onClick={() => setModProduct(null)} className="text-[#CCD2D9] hover:text-white text-xs cursor-pointer">
                Cancel
              </button>
            </div>

            <div className="text-xs text-[#CCD2D9] space-y-1">
              <span className="text-[10px] font-mono text-[#08E6F9] block uppercase">Publication Target:</span>
              <p className="font-bold text-white text-sm">{modProduct.title}</p>
              <p>Author: {modProduct.creatorName} ({modProduct.creatorRole})</p>
            </div>

            <form onSubmit={handleModerate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Target Editorial Status *</label>
                <select
                  value={modStatus}
                  onChange={(e) => setModStatus(e.target.value as DigitalProductStatus)}
                  className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#08E6F9]"
                >
                  <option value="PUBLISHED">PUBLISHED (Approve &amp; Make Discoverable)</option>
                  <option value="REJECTED">REJECTED (Reject Submission)</option>
                  <option value="UNPUBLISHED">UNPUBLISHED (Temporarily Pull from Catalog)</option>
                  <option value="ARCHIVED">ARCHIVED (Permanently Archive)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Moderation Note / Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  placeholder="Reason for status change..."
                  className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2.5 text-white placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModProduct(null)}
                  className="px-4 py-2 rounded-xl bg-[#01213D] text-[#CCD2D9] hover:text-white border border-[#0682F4]/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMod}
                  className="px-5 py-2 rounded-xl bg-[#0682F4] hover:bg-[#05A9F7] text-white font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingMod ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Confirm Action</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
};
