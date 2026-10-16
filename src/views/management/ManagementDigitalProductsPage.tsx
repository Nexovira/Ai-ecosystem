import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import {
  DigitalProduct,
  DigitalProductReport,
  DigitalProductStatus,
} from '../../types/digitalProduct';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Search,
  Filter,
  ShieldAlert,
  Loader2,
  ExternalLink,
  Flag,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';

export const ManagementDigitalProductsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();

  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [reports, setReports] = useState<DigitalProductReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'published' | 'reports'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Moderation Modal State
  const [modProduct, setModProduct] = useState<DigitalProduct | null>(null);
  const [modStatus, setModStatus] = useState<DigitalProductStatus>('PUBLISHED');
  const [modReason, setModReason] = useState('Editorial review approved');
  const [submittingMod, setSubmittingMod] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch management products
        const res = await fetch(`/api/management/digital-products?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'x-user-id': user.uid,
            'x-user-role': profile?.role || 'ADMIN',
            'x-user-email': user.email || '',
          },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }

        // Fetch reports
        const repRes = await fetch('/api/management/digital-products/reports', {
          headers: {
            'x-user-id': user.uid,
            'x-user-role': profile?.role || 'ADMIN',
            'x-user-email': user.email || '',
          },
        });
        const repData = await repRes.json();
        if (repData.success && Array.isArray(repData.reports)) {
          setReports(repData.reports);
        }
      } catch (err) {
        console.error('Failed to load management digital products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, profile, statusFilter, searchQuery]);

  const handleModerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !modProduct) return;
    setSubmittingMod(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/management/digital-products/${modProduct.productId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile?.role || 'ADMIN',
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          status: modStatus,
          reason: modReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to moderate publication');
      }

      setProducts((prev) =>
        prev.map((p) => (p.productId === modProduct.productId ? data.product : p))
      );
      setFeedback({
        type: 'success',
        text: `Publication status updated to ${modStatus}.`,
      });
      setModProduct(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error moderating publication';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingMod(false);
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
      title="Digital Products Moderation"
      subtitle="Review and approve authored ebooks, technical blueprints, and engineering guides before public discovery."
    >
      <div className="space-y-6">
        {/* Desk Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#08E6F9] uppercase font-bold mb-1">
              <BookOpen className="w-4 h-4" />
              <span>CONTENT COMMERCE DESK</span>
            </div>
            <h1 className="text-2xl font-black text-white">Digital Products Moderation</h1>
            <p className="text-xs text-[#CCD2D9] mt-0.5">
              Review and approve authored ebooks, technical blueprints, and engineering guides before public discovery.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/digital-products')}
              className="px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 hover:border-[#08E6F9] text-xs font-semibold text-[#08E6F9] transition flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Storefront</span>
            </button>
          </div>
        </div>

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
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-[#CCD2D9] hover:text-white">
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
            <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70 block">User Reports</span>
            <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">{reports.length}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#0682F4]/20 pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#0682F4] text-white'
                : 'text-[#CCD2D9] hover:text-white hover:bg-[#01213D]'
            }`}
          >
            All Publications ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'published'
                ? 'bg-[#0682F4] text-white'
                : 'text-[#CCD2D9] hover:text-white hover:bg-[#01213D]'
            }`}
          >
            Published ({publishedList.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-[#0682F4] text-white'
                : 'text-[#CCD2D9] hover:text-white hover:bg-[#01213D]'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            <span>Policy Reports ({reports.length})</span>
          </button>
        </div>

        {/* Reports Tab Content */}
        {activeTab === 'reports' ? (
          <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/20 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#0682F4]/20 font-bold text-sm text-white">
              Customer Reports &amp; Copyright Inquiries
            </div>
            {reports.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#CCD2D9]">
                No reports submitted on digital publications.
              </div>
            ) : (
              <div className="divide-y divide-[#0682F4]/10">
                {reports.map((rep) => (
                  <div key={rep.id} className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {rep.reason}
                        </span>
                        <span className="text-white font-bold">{rep.reporterEmail}</span>
                      </div>
                      <span className="text-[11px] text-[#CCD2D9] font-mono">
                        {new Date(rep.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-white">
                      Target Product ID: <span className="font-mono text-[#08E6F9]">{rep.productId}</span>
                    </div>
                    <p className="text-xs text-[#CCD2D9] bg-[#01213D] p-3 rounded-xl border border-[#0682F4]/20">
                      {rep.explanation || 'No detailed explanation provided.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Products Table */
          <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/20 overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-[#CCD2D9]">
                Loading publications...
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#CCD2D9]">
                No publications found for this view.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#CCD2D9]">
                  <thead className="bg-[#01213D] text-[11px] font-mono uppercase text-[#CCD2D9]/80 border-b border-[#0682F4]/20">
                    <tr>
                      <th className="py-3 px-4">Publication</th>
                      <th className="py-3 px-4">Creator</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Format</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Sales</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Moderation</th>
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
                        <td className="py-3.5 px-4 font-mono">{p.salesCount || 0}</td>
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
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => navigate(`/digital-products/${p.slug}`)}
                            className="p-1.5 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white transition cursor-pointer"
                            title="Inspect Page"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

      {/* Moderation Action Modal */}
      {modProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl bg-[#011B33] border border-[#0682F4]/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/30 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <BookOpen className="w-4 h-4 text-[#08E6F9]" />
                <span>Editorial Status Moderation</span>
              </div>
              <button onClick={() => setModProduct(null)} className="text-[#CCD2D9] hover:text-white text-xs">
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
                  className="px-4 py-2 rounded-xl bg-[#01213D] text-[#CCD2D9] hover:text-white border border-[#0682F4]/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMod}
                  className="px-5 py-2 rounded-xl bg-[#0682F4] hover:bg-[#05A9F7] text-white font-bold transition flex items-center gap-2 disabled:opacity-50"
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
