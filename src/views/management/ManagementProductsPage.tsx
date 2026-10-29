import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  Save,
  Tag,
  Eye,
  SlidersHorizontal,
  Plus,
  Edit3,
  Trash2,
  Layers,
  FolderPlus,
  Info,
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, Category } from '../../types/marketplace';
import { useMarketplace } from '../../context/MarketplaceContext';

export const ManagementProductsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const { categories, addCategory, updateCategory, deleteCategory, refreshCatalog } = useMarketplace();

  // Active Tab: 'PRODUCTS' | 'CATEGORIES'
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'CATEGORIES'>('PRODUCTS');

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Product Moderation Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStatus, setNewStatus] = useState<'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('PUBLISHED');
  const [isApproved, setIsApproved] = useState(true);
  const [moderationReason, setModerationReason] = useState('');
  const [submittingModeration, setSubmittingModeration] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete Product Confirmation State
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    iconName: 'Package',
    order: 1,
  });
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Delete Category Confirmation State
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const handleDeleteProduct = async (p: Product) => {
    if (!user || !profile) return;
    setDeletingProduct(true);
    try {
      const isDefaultAdmin =
        user?.email?.toLowerCase() === 'nexoviratech@gmail.com' ||
        user?.email?.toLowerCase() === 'nexovirasupport@gmail.com';
      const effectiveRole = profile?.role || (isDefaultAdmin ? 'SUPER_ADMIN' : '');

      // 1. Authoritative Backend Management Deletion
      const res = await fetch(`/api/management/products/${p.productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': effectiveRole,
          'x-user-email': user.email || '',
        },
      });

      const resData = await res.json().catch(() => null);

      // 2. Secondary client Firestore sync
      await deleteDoc(doc(db, 'products', p.productId)).catch(() => null);

      // 3. Immediately remove from local state so it vanishes from the UI instantaneously
      setProducts((prev) => prev.filter((item) => item.productId !== p.productId));
      setTotal((prev) => Math.max(0, prev - 1));

      setActionFeedback({
        type: 'success',
        text: resData?.message || `Product [${p.name}] was deleted from the catalog.`,
      });
      setDeleteConfirmProduct(null);

      // 4. Re-fetch and synchronize marketplace context
      await fetchProducts();
      await refreshCatalog();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product';
      setActionFeedback({ type: 'error', text: msg });
    } finally {
      setDeletingProduct(false);
    }
  };

  const fetchProducts = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      if (categoryFilter !== 'ALL') queryParams.set('category', categoryFilter);

      const res = await fetch(`/api/management/products?${queryParams.toString()}`, {
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading products';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user, profile, statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleModerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !user || !profile) return;

    setSubmittingModeration(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/management/products/${selectedProduct.productId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          status: newStatus,
          isApproved,
          reason: moderationReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update product status');
      }

      setActionFeedback({
        type: 'success',
        text: `Product [${selectedProduct.name}] updated: ${isApproved ? 'Approved' : 'Unapproved'} (${newStatus}).`,
      });
      setSelectedProduct(null);
      setModerationReason('');
      fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating product';
      setActionFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingModeration(false);
    }
  };

  // Category Management Handlers
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      iconName: 'Package',
      order: categories.length + 1,
    });
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      iconName: cat.iconName || 'Package',
      order: cat.order || 1,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    setSubmittingCategory(true);
    setActionFeedback(null);
    try {
      if (editingCategory) {
        const res = await updateCategory(editingCategory.categoryId, {
          name: categoryForm.name.trim(),
          slug:
            categoryForm.slug.trim() ||
            categoryForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: categoryForm.description.trim(),
          iconName: categoryForm.iconName.trim() || 'Package',
          order: Number(categoryForm.order) || 1,
        });
        if (!res.success) throw new Error(res.error || 'Failed to update category');
        setActionFeedback({
          type: 'success',
          text: `Category "${categoryForm.name}" updated successfully.`,
        });
      } else {
        const res = await addCategory({
          name: categoryForm.name.trim(),
          slug:
            categoryForm.slug.trim() ||
            categoryForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: categoryForm.description.trim(),
          iconName: categoryForm.iconName.trim() || 'Package',
          order: Number(categoryForm.order) || categories.length + 1,
        });
        if (!res.success) throw new Error(res.error || 'Failed to create category');
        setActionFeedback({
          type: 'success',
          text: `Category "${categoryForm.name}" created successfully.`,
        });
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving category';
      setActionFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    setDeletingCategory(true);
    try {
      const res = await deleteCategory(cat.categoryId);
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete category');
      }
      setActionFeedback({
        type: 'success',
        text: `Category "${cat.name}" was permanently deleted.`,
      });
      setDeleteConfirmCategory(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting category';
      setActionFeedback({ type: 'error', text: msg });
    } finally {
      setDeletingCategory(false);
    }
  };

  const getProductCountForCategory = (cat: Category) => {
    return products.filter(
      (p) =>
        p.category === cat.categoryId ||
        p.category === cat.slug ||
        p.category?.toLowerCase() === cat.name.toLowerCase()
    ).length;
  };

  const formatNaira = (amount: number) => `₦${(amount || 0).toLocaleString()} NGN`;

  return (
    <ManagementLayout
      activeRoute="/management/products"
      requiredPermission="PRODUCTS_VIEW"
      title="Marketplace Catalog & Taxonomy Desk"
      subtitle="Authoritative product quality control, listing approval, publication states, and catalog categories."
      actions={
        <div className="flex items-center gap-2">
          {activeTab === 'PRODUCTS' ? (
            <button
              onClick={() => navigate('/management/products/new')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#01213D] bg-[#08E6F9] hover:bg-[#0682F4] hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#08E6F9]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </button>
          ) : (
            <button
              onClick={openAddCategoryModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#01213D] bg-[#08E6F9] hover:bg-[#0682F4] hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#08E6F9]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Category</span>
            </button>
          )}
          <button
            onClick={() => {
              fetchProducts();
              refreshCatalog();
            }}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#0682F4]/20 pb-4">
        <button
          onClick={() => setActiveTab('PRODUCTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'PRODUCTS'
              ? 'bg-[#0682F4] text-white shadow-lg shadow-[#0682F4]/25'
              : 'bg-[#011B33] text-[#CCD2D9] hover:text-white border border-[#0682F4]/30'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products Directory ({total})</span>
        </button>
        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'CATEGORIES'
              ? 'bg-[#0682F4] text-white shadow-lg shadow-[#0682F4]/25'
              : 'bg-[#011B33] text-[#CCD2D9] hover:text-white border border-[#0682F4]/30'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Marketplace Categories ({categories.length})</span>
        </button>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/10 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: PRODUCTS DIRECTORY */}
      {activeTab === 'PRODUCTS' && (
        <>
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#CCD2D9]/60" />
              <input
                type="text"
                placeholder="Search by name, SKU, or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
              />
            </form>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#CCD2D9]/70">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                >
                  <option value="ALL">All States</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#CCD2D9]/70">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.slug || c.categoryId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-xs text-[#CCD2D9]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#08E6F9]" />
                Loading catalog listings...
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#CCD2D9]/60">
                No marketplace products found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#01213D] border-b border-[#0682F4]/20 text-[#CCD2D9] font-mono text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Product Name &amp; SKU</th>
                      <th className="px-4 py-3">Price &amp; Stock</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Approval</th>
                      <th className="px-4 py-3">Listing Status</th>
                      <th className="px-4 py-3 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0682F4]/10 text-white">
                    {products.map((p) => (
                      <tr key={p.productId} className="hover:bg-[#01213D]/40 transition">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-[#08E6F9]" />
                            {p.name}
                          </div>
                          <div className="text-[10px] text-[#CCD2D9]/50 font-mono mt-0.5">
                            SKU: {p.sku} · Brand: {p.brand}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#08E6F9]">{formatNaira(p.price)}</div>
                          <div className="text-[10px] text-[#CCD2D9]/60 font-mono">
                            Stock: {p.stockQuantity} ({p.availabilityStatus})
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9]">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {p.isApproved ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              APPROVED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                              PENDING APPROVAL
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              p.productStatus === 'PUBLISHED'
                                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                                : 'bg-[#CCD2D9]/10 text-[#CCD2D9]'
                            }`}
                          >
                            {p.productStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/management/products/edit/${p.productId}`)}
                              className="p-1.5 rounded-lg text-[11px] font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-[#08E6F9] transition cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setNewStatus(p.productStatus as any);
                                setIsApproved(Boolean(p.isApproved));
                                setModerationReason('');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] transition cursor-pointer"
                            >
                              Moderate
                            </button>
                            <button
                              onClick={() => setDeleteConfirmProduct(p)}
                              className="p-1.5 rounded-lg text-[11px] font-bold bg-[#01213D] hover:bg-red-500/20 border border-red-500/30 text-red-400 transition cursor-pointer"
                              title="Delete Product"
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
        </>
      )}

      {/* TAB 2: MARKETPLACE CATEGORIES */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 flex items-center justify-between">
            <div className="text-xs text-[#CCD2D9]">
              <span className="font-bold text-white">Marketplace Taxonomy &amp; Categories:</span>{' '}
              Define and govern product categories. Active categories dynamically drive storefront browsing, filtering, and catalog classification.
            </div>
            <button
              onClick={openAddCategoryModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#01213D] bg-[#08E6F9] hover:bg-[#0682F4] hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#08E6F9]/20 shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const inUseCount = getProductCountForCategory(cat);
              return (
                <div
                  key={cat.categoryId}
                  className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 hover:border-[#08E6F9]/50 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-[#08E6F9]">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                          <span className="text-[10px] text-[#CCD2D9]/60 font-mono">
                            slug: {cat.slug} · order: {cat.order}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#01213D] border border-[#0682F4]/30 text-[#08E6F9]">
                        {inUseCount} product{inUseCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <p className="text-xs text-[#CCD2D9]/80 line-clamp-2 leading-relaxed">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#0682F4]/20 flex items-center justify-between">
                    <span className="text-[10px] text-[#CCD2D9]/50 font-mono">
                      Icon: {cat.iconName || 'Package'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditCategoryModal(cat)}
                        className="p-1.5 rounded-lg text-xs font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-[#08E6F9] transition cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmCategory(cat)}
                        className="p-1.5 rounded-lg text-xs font-bold bg-[#01213D] hover:bg-red-500/20 border border-red-500/30 text-red-400 transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#011B33] border border-[#0682F4]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <SlidersHorizontal className="w-4 h-4 text-[#08E6F9]" />
                Catalog Moderation: {selectedProduct.name}
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-[#CCD2D9] hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#CCD2D9] space-y-1">
              <div>
                <span className="text-[#CCD2D9]/60">SKU:</span>{' '}
                <strong className="text-white font-mono">{selectedProduct.sku}</strong>
              </div>
              <div>
                <span className="text-[#CCD2D9]/60">Price:</span>{' '}
                <span className="text-[#08E6F9] font-bold">{formatNaira(selectedProduct.price)}</span>
              </div>
            </div>

            <form onSubmit={handleModerationSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={(e) => setIsApproved(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0682F4] focus:ring-0"
                  />
                  <span className="text-xs font-bold text-white">Approve for Marketplace Visibility</span>
                </label>
                <p className="text-[11px] text-[#CCD2D9]/60 pl-6">
                  When checked, this product passes safety &amp; catalog compliance.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Publication State</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                >
                  <option value="PUBLISHED">PUBLISHED (Live on storefront)</option>
                  <option value="DRAFT">DRAFT (Hidden from consumers)</option>
                  <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Audit Rationale</label>
                <textarea
                  rows={3}
                  placeholder="Record reason for moderation decision (e.g. Quality check passed, Pricing verified)..."
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 text-[#CCD2D9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModeration}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submittingModeration ? 'Saving...' : 'Apply Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#011B33] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span>Confirm Product Deletion</span>
            </div>
            <p className="text-xs text-[#CCD2D9] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">"{deleteConfirmProduct.name}"</strong> (SKU:{' '}
              {deleteConfirmProduct.sku}) from the catalog? This action requires administrator authority and cannot be undone.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/20">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 text-[#CCD2D9] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingProduct}
                onClick={() => handleDeleteProduct(deleteConfirmProduct)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingProduct ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#011B33] border border-[#0682F4]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Layers className="w-4 h-4 text-[#08E6F9]" />
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Marketplace Category'}
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[#CCD2D9] hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Home Robotics"
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setCategoryForm((prev) => ({
                      ...prev,
                      name,
                      slug: editingCategory ? prev.slug : slug,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Category Slug</label>
                <input
                  type="text"
                  placeholder="e.g. smart-home-robotics"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the catalog category..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Icon Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. Cpu, Laptop, Tv"
                    value={categoryForm.iconName}
                    onChange={(e) => setCategoryForm({ ...categoryForm, iconName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 text-[#CCD2D9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submittingCategory ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteConfirmCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#011B33] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span>Confirm Category Deletion</span>
            </div>

            {getProductCountForCategory(deleteConfirmCategory) > 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Info className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Category in Active Use</span>
                </div>
                <p className="leading-relaxed">
                  Cannot delete category <strong className="text-white">"{deleteConfirmCategory.name}"</strong> because{' '}
                  <strong className="text-white">
                    {getProductCountForCategory(deleteConfirmCategory)} product(s)
                  </strong>{' '}
                  are currently assigned to it.
                </p>
                <p className="text-[11px] text-amber-300/80">
                  Please reassign or archive those products before removing this category to preserve catalog integrity.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#CCD2D9] leading-relaxed">
                Are you sure you want to permanently delete category{' '}
                <strong className="text-white">"{deleteConfirmCategory.name}"</strong>? No products are currently assigned to it. This action requires administrator authority and cannot be undone.
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/20">
              <button
                type="button"
                onClick={() => setDeleteConfirmCategory(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 text-[#CCD2D9] transition cursor-pointer"
              >
                Cancel
              </button>
              {getProductCountForCategory(deleteConfirmCategory) === 0 && (
                <button
                  type="button"
                  disabled={deletingCategory}
                  onClick={() => handleDeleteCategory(deleteConfirmCategory)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingCategory ? 'Deleting...' : 'Delete Permanently'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
};
