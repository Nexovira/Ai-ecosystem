import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { DigitalEntitlement } from '../../types/digitalProduct';
import { ReviewFormModal } from '../../components/reviews/ReviewFormModal';
import {
  Download,
  BookOpen,
  ShieldCheck,
  Search,
  ExternalLink,
  Star,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const CustomerDigitalLibraryPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [entitlements, setEntitlements] = useState<DigitalEntitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Review Modal State
  const [reviewProduct, setReviewProduct] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    async function loadLibrary() {
      if (!user) {
        navigate('/signin');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/account/digital-library', {
          headers: {
            'x-user-id': user.uid,
          },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.entitlements)) {
          setEntitlements(data.entitlements);
        }
      } catch (err) {
        console.error('Failed to load user digital library:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, [user]);

  const handleDownload = async (ent: DigitalEntitlement) => {
    if (!user) return;
    setDownloadingId(ent.productId);
    setFeedback(null);
    try {
      // 1. Request short-lived single-use download token
      const res = await fetch(`/api/digital-products/${ent.productId}/download-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.downloadToken) {
        throw new Error(data.error || 'Failed to authorize download token');
      }

      // 2. Trigger browser download
      const downloadUrl = `/api/digital-products/download/${data.downloadToken}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${ent.productSlug || 'digital-publication'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setFeedback({
        type: 'success',
        message: `Download authorized for "${ent.productTitle}".`,
      });

      // Update download count in local state
      setEntitlements((prev) =>
        prev.map((e) =>
          e.entitlementId === ent.entitlementId
            ? { ...e, downloadCount: (e.downloadCount || 0) + 1 }
            : e
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = entitlements.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.productTitle.toLowerCase().includes(q) ||
      e.productType.toLowerCase().includes(q) ||
      (e.orderReference && e.orderReference.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#011B33] text-white pb-20">
      {/* Header Banner */}
      <section className="pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#0682F4]/20 bg-[#01213D]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#08E6F9] tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Customer Account</span>
              <span aria-hidden="true" className="text-[#CCD2D9]/40">·</span>
              <span>Authoritative Entitlements</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              My Digital Library &amp; Deliverables
            </h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] max-w-2xl leading-relaxed">
              Access and download your purchased technical ebooks, system blueprints, spreadsheets, and developer kits anytime. Downloads are cryptographically secured and tracked against your user license.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => navigate('/digital-products')}
              className="px-4 py-2.5 rounded-xl bg-[#0682F4] hover:bg-[#05A9F7] text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Digital Storefront</span>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Feedback alert */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-[#CCD2D9] hover:text-white text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Toolbar: Search inside library */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 mb-8">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CCD2D9]/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your library..."
              className="w-full pl-10 pr-4 py-2 bg-[#011B33] border border-[#0682F4]/30 rounded-lg text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
            />
          </div>

          <div className="text-xs text-[#CCD2D9] font-mono">
            {entitlements.length} {entitlements.length === 1 ? 'licensed publication' : 'licensed publications'}
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-[#01213D]/60 border border-[#0682F4]/20 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && entitlements.length === 0 && (
          <div className="py-20 text-center rounded-2xl bg-[#01213D] border border-[#0682F4]/20 p-8 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#011B33] border border-[#0682F4]/40 flex items-center justify-center mx-auto text-[#08E6F9]">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Your digital library is currently empty</h3>
            <p className="text-xs text-[#CCD2D9] leading-relaxed">
              Explore our catalog of architectural blueprints, guides, ebooks, and spreadsheets authored by approved specialists.
            </p>
            <button
              onClick={() => navigate('/digital-products')}
              className="px-5 py-2.5 bg-[#0682F4] hover:bg-[#05A9F7] text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Explore Digital Publications
            </button>
          </div>
        )}

        {/* Grid of Licensed Publications */}
        {!loading && entitlements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ent) => (
              <div
                key={ent.id}
                className="rounded-2xl bg-[#01213D] border border-[#0682F4]/20 hover:border-[#08E6F9]/50 transition-all flex flex-col justify-between overflow-hidden shadow-lg"
              >
                {/* Visual Header */}
                <div className="relative aspect-[16/9] bg-[#011B33] overflow-hidden">
                  <img
                    src={ent.coverImage}
                    alt={ent.productTitle}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 -z-10 flex flex-col justify-between p-4 bg-gradient-to-br from-[#01213D] to-[#011B33]">
                    <span className="text-[10px] font-mono text-[#08E6F9] uppercase">{ent.productType}</span>
                    <h4 className="text-xs font-bold text-white line-clamp-2">{ent.productTitle}</h4>
                  </div>

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#011B33]/90 backdrop-blur-md border border-[#0682F4]/40 text-[#08E6F9]">
                      {ent.productType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white">
                      Active License
                    </span>
                  </div>
                </div>

                {/* Content info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-[#CCD2D9]">
                      <span>v{ent.fileVersion || '1.0'}</span>
                      <span aria-hidden="true" className="text-[#0682F4]">·</span>
                      <span>Granted {new Date(ent.grantedAt).toLocaleDateString()}</span>
                      {ent.orderReference && (
                        <>
                          <span aria-hidden="true" className="text-[#0682F4]">·</span>
                          <span className="font-mono text-[10px] truncate max-w-[100px]">{ent.orderReference}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                      {ent.productTitle}
                    </h3>
                  </div>

                  {/* Actions Area */}
                  <div className="pt-3 border-t border-[#0682F4]/20 space-y-2.5">
                    <button
                      onClick={() => handleDownload(ent)}
                      disabled={downloadingId === ent.productId}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0682F4] hover:bg-[#05A9F7] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow cursor-pointer disabled:opacity-50"
                    >
                      {downloadingId === ent.productId ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Preparing Download...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Deliverable</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => navigate(`/digital-products/${ent.productSlug}`)}
                        className="text-[11px] text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Publication</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() =>
                          setReviewProduct({ id: ent.productId, title: ent.productTitle })
                        }
                        className="text-[11px] text-[#CCD2D9] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3 h-3 text-amber-400" />
                        <span>Write Review</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal Trigger */}
      {reviewProduct && (
        <ReviewFormModal
          isOpen={true}
          onClose={() => setReviewProduct(null)}
          entityType="DIGITAL_PRODUCT"
          entityId={reviewProduct.id}
          entityTitle={reviewProduct.title}
          onReviewSubmitted={() => {
            setReviewProduct(null);
            setFeedback({
              type: 'success',
              message: 'Thank you! Your verified review has been published.',
            });
          }}
        />
      )}
    </div>
  );
};
