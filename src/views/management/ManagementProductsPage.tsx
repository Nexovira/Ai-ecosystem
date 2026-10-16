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
} from 'lucide-react';
import { Product } from '../../types/marketplace';

export const ManagementProductsPage: React.FC = () => {
  const { user, profile } = useAuth();
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

  const formatNaira = (amount: number) => `₦${(amount || 0).toLocaleString()} NGN`;

  return (
    <ManagementLayout
      activeRoute="/management/products"
      requiredPermission="PRODUCTS_VIEW"
      title="Marketplace Catalog Moderation Desk"
      subtitle="Authoritative product quality control, listing approval, publication states, and inventory compliance."
      actions={
        <button
          onClick={fetchProducts}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Products ({total})
        </button>
      }
    >
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
              <option value="tech-gadgets">Tech &amp; Gadgets</option>
              <option value="software-licenses">Software &amp; Keys</option>
              <option value="developer-tools">Developer Tools</option>
              <option value="ai-prompts">AI Prompts</option>
              <option value="smart-devices">Smart Devices</option>
              <option value="digital-assets">Digital Assets</option>
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
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setNewStatus(p.productStatus as any);
                          setIsApproved(Boolean(p.isApproved));
                          setModerationReason('');
                        }}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] transition cursor-pointer"
                      >
                        Moderate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <span className="text-[#CCD2D9]/60">SKU:</span> <strong className="text-white font-mono">{selectedProduct.sku}</strong>
              </div>
              <div>
                <span className="text-[#CCD2D9]/60">Price:</span> <span className="text-[#08E6F9] font-bold">{formatNaira(selectedProduct.price)}</span>
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
    </ManagementLayout>
  );
};
