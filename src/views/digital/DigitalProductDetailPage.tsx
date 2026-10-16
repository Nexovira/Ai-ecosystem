import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Product } from '../../types/marketplace';
import { DigitalProduct, DigitalEntitlement } from '../../types/digitalProduct';
import { ReviewsSection } from '../../components/reviews/ReviewsSection';
import {
  BookOpen,
  Download,
  ShieldCheck,
  Star,
  FileText,
  Clock,
  HardDrive,
  Eye,
  Flag,
  Share2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface DigitalProductDetailPageProps {
  slug: string;
}

export const DigitalProductDetailPage: React.FC<DigitalProductDetailPageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const { addToCart } = useMarketplace();

  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Entitlement & Download State
  const [isOwned, setIsOwned] = useState(false);
  const [entitlement, setEntitlement] = useState<DigitalEntitlement | null>(null);
  const [checkingEntitlement, setCheckingEntitlement] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  // Free Claim State
  const [claiming, setClaiming] = useState(false);

  // Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);

  // Report Modal State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>('COPYRIGHT_VIOLATION');
  const [reportExplanation, setReportExplanation] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Fetch Product Details
  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/digital-products/${slug}`);
        const data = await res.json();
        if (!res.ok || !data.success || !data.product) {
          throw new Error(data.error || 'Digital publication not found');
        }
        setProduct(data.product);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to retrieve publication';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  // Check User Entitlement
  useEffect(() => {
    async function checkEntitlement() {
      if (!user || !product) {
        setIsOwned(false);
        setEntitlement(null);
        return;
      }
      setCheckingEntitlement(true);
      try {
        const res = await fetch(`/api/digital-products/${product.productId}/entitlement`, {
          headers: {
            'x-user-id': user.uid,
          },
        });
        const data = await res.json();
        if (data.success) {
          setIsOwned(data.isOwned);
          setEntitlement(data.entitlement);
        }
      } catch (err) {
        console.warn('Error checking entitlement:', err);
      } finally {
        setCheckingEntitlement(false);
      }
    }
    checkEntitlement();
  }, [user, product]);

  const handleDownload = async () => {
    if (!user || !product) return;
    setDownloading(true);
    setDownloadFeedback(null);
    try {
      // 1. Request authoritative short-lived download token
      const res = await fetch(`/api/digital-products/${product.productId}/download-token`, {
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

      // 2. Trigger authenticated download via token endpoint
      const downloadUrl = `/api/digital-products/download/${data.downloadToken}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = product.fileMetadata?.fileName || `${product.slug}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadFeedback('Download authorized. Deliverable is downloading.');
      // Update entitlement count locally
      if (entitlement) {
        setEntitlement({
          ...entitlement,
          downloadCount: (entitlement.downloadCount || 0) + 1,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setDownloadFeedback(msg);
    } finally {
      setDownloading(false);
    }
  };

  const handleClaimFree = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (!product) return;
    setClaiming(true);
    try {
      const res = await fetch(`/api/digital-products/${product.productId}/claim-free`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to claim publication');
      }
      setIsOwned(true);
      setEntitlement(data.entitlement);
      setDownloadFeedback('Publication claimed! Your digital entitlement is active.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not claim publication';
      setDownloadFeedback(msg);
    } finally {
      setClaiming(false);
    }
  };

  const getProductAdapter = (p: DigitalProduct): Product => ({
    productId: p.productId,
    sellerId: p.creatorId,
    name: p.title,
    slug: p.slug,
    shortDescription: p.shortDescription,
    fullDescription: p.description,
    category: p.categorySlug,
    brand: p.creatorName,
    sku: `DIGITAL-${p.productType}-${p.productId.slice(0, 8)}`,
    price: p.price,
    currency: p.currency || 'NGN',
    stockQuantity: 999999,
    availabilityStatus: 'IN_STOCK',
    productStatus: 'PUBLISHED',
    productImages: [{ id: '1', url: p.coverImage, isPrimary: true, alt: p.title, order: 0 }],
    specifications: [
      { label: 'Format', value: p.productType },
      { label: 'Version', value: p.fileMetadata?.version || '1.0' },
      { label: 'File Type', value: p.fileMetadata?.fileType || 'pdf' },
    ],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  });

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(getProductAdapter(product), 1);
    navigate('/checkout');
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(getProductAdapter(product), 1);
    setDownloadFeedback('Added to cart. Proceed to checkout to complete ownership.');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }
    if (!product) return;
    setReportSubmitting(true);
    try {
      const res = await fetch(`/api/digital-products/${product.productId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          reason: reportReason,
          explanation: reportExplanation,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report');
      }
      setReportSuccess(true);
      setTimeout(() => {
        setReportOpen(false);
        setReportSuccess(false);
        setReportExplanation('');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit report';
      alert(msg);
    } finally {
      setReportSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Deliverable';
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#011B33] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#08E6F9] animate-spin" />
          <p className="text-sm font-mono text-[#CCD2D9]">Retrieving publication metadata...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#011B33] flex items-center justify-center p-8">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/30 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Publication Unavailable</h2>
          <p className="text-xs text-[#CCD2D9] leading-relaxed">
            {error || 'The requested digital publication could not be found or is not approved for public discovery.'}
          </p>
          <button
            onClick={() => navigate('/digital-products')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0682F4] text-white text-xs font-bold transition hover:bg-[#05A9F7] cursor-pointer"
          >
            Explore Digital Publications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#011B33] text-white pb-20">
      {/* Breadcrumbs Navigation */}
      <div className="border-b border-[#0682F4]/20 bg-[#01213D]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-2 text-xs text-[#CCD2D9]">
          <button
            onClick={() => navigate('/digital-products')}
            className="hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#08E6F9]" />
            <span>Digital Catalog</span>
          </button>
          <ChevronRight className="w-3 h-3 text-[#0682F4]" />
          <span className="text-[#CCD2D9]/70">{product.categoryName}</span>
          <ChevronRight className="w-3 h-3 text-[#0682F4]" />
          <span className="text-white truncate max-w-[200px] sm:max-w-md font-medium">{product.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Feedback Banner if present */}
        {downloadFeedback && (
          <div className="mb-6 p-4 rounded-xl bg-[#01213D] border border-[#08E6F9]/40 flex items-center justify-between gap-3 text-xs text-[#08E6F9]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{downloadFeedback}</span>
            </div>
            <button
              onClick={() => setDownloadFeedback(null)}
              className="text-[#CCD2D9] hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Product Overview: Two-Column Split (PDP Standard) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column (Cover Art + Technical Specs + Preview Excerpt) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Cover Card */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl bg-[#01213D] border border-[#0682F4]/30 overflow-hidden shadow-2xl group">
              <img
                src={product.coverImage}
                alt={product.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className="w-full h-full object-cover"
              />
              {/* Resilient Fallback Canvas */}
              <div className="absolute inset-0 -z-10 flex flex-col justify-between p-8 bg-gradient-to-br from-[#01213D] via-[#011B33] to-[#01213D]">
                <div className="flex items-center justify-between text-xs font-mono text-[#08E6F9]">
                  <span>{product.productType}</span>
                  <span>VERSION {product.fileMetadata?.version || '1.0'}</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white">{product.title}</h2>
                  <p className="text-xs text-[#CCD2D9]">{product.shortDescription}</p>
                </div>
              </div>

              {/* Badges Over Cover */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#011B33]/90 backdrop-blur-md border border-[#0682F4]/40 text-[#08E6F9]">
                  {product.productType}
                </span>
                {product.isFree && (
                  <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-500/90 text-white">
                    Free Publication
                  </span>
                )}
              </div>

              {/* Sample Preview Trigger Button */}
              {product.previewInfo && (
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={() => setPreviewOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#011B33]/90 backdrop-blur-md hover:bg-[#0682F4] border border-[#0682F4]/40 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#08E6F9]" />
                    <span>Read Sample Excerpt</span>
                  </button>
                </div>
              )}
            </div>

            {/* Technical Specifications Matrix (Clean Unboxed Metadata) */}
            <div className="p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/20 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#08E6F9] flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Deliverable Specifications</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-[#0682F4]/20 text-xs">
                <div>
                  <span className="text-[#CCD2D9]/70 block mb-0.5">Format</span>
                  <span className="font-mono font-bold text-white uppercase">
                    {product.fileMetadata?.fileType || 'PDF'}
                  </span>
                </div>
                <div>
                  <span className="text-[#CCD2D9]/70 block mb-0.5">File Size</span>
                  <span className="font-mono font-bold text-white">
                    {formatFileSize(product.fileMetadata?.fileSize)}
                  </span>
                </div>
                <div>
                  <span className="text-[#CCD2D9]/70 block mb-0.5">Version</span>
                  <span className="font-mono font-bold text-white">
                    v{product.fileMetadata?.version || '1.0'}
                  </span>
                </div>
                <div>
                  <span className="text-[#CCD2D9]/70 block mb-0.5">Pages / Extent</span>
                  <span className="font-mono font-bold text-white">
                    {product.fileMetadata?.pageCount ? `${product.fileMetadata.pageCount} Pages` : 'Complete Kit'}
                  </span>
                </div>
              </div>
            </div>

            {/* Publication Description */}
            <div className="space-y-4 p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/20">
              <h3 className="text-base font-bold text-white">Publication Overview</h3>
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-[#CCD2D9] leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module (Sticky on Desktop) */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/30 shadow-2xl space-y-6">
              {/* Creator Kicker (Zero-Pill Rule) */}
              <div className="flex items-center justify-between text-xs text-[#CCD2D9]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#011B33] border border-[#0682F4]/40 flex items-center justify-center text-xs font-bold text-[#08E6F9]">
                    {product.creatorName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{product.creatorName}</span>
                    <span className="text-[10px] text-[#08E6F9]">{product.creatorRole} Creator</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-mono font-bold text-white">{product.rating.toFixed(1)}</span>
                  <span className="text-[11px] text-[#CCD2D9]">({product.reviewCount})</span>
                </div>
              </div>

              {/* Title & Short Summary */}
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {product.title}
                </h1>
                <p className="text-xs text-[#CCD2D9] leading-relaxed">
                  {product.shortDescription}
                </p>
              </div>

              {/* Price Banner */}
              <div className="pt-4 border-t border-[#0682F4]/20 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70 block">
                    Access License
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono">
                      {product.isFree ? 'FREE' : formatPrice(product.price)}
                    </span>
                    {!product.isFree && (
                      <span className="text-xs text-[#CCD2D9] font-mono">NGN</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-[#08E6F9] font-mono block">
                    {product.salesCount} Verified Licenses
                  </span>
                  <span className="text-[10px] text-[#CCD2D9]/60">Instant Access</span>
                </div>
              </div>

              {/* Dynamic Action Area: Owned vs Claim Free vs Purchase */}
              <div className="pt-2 space-y-3">
                {isOwned ? (
                  // User already owns an active entitlement
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-400">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span className="font-medium">
                        Active License: You own this deliverable ({entitlement?.downloadCount || 0} downloads recorded).
                      </span>
                    </div>

                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full py-3.5 px-5 rounded-xl bg-[#0682F4] hover:bg-[#05A9F7] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Secure Download Token...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download Deliverable ({product.fileMetadata?.fileType?.toUpperCase()})</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => navigate('/account/digital-library')}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Manage in My Digital Library
                    </button>
                  </div>
                ) : product.isFree ? (
                  // Free Publication: Instant Claim
                  <div className="space-y-3">
                    <button
                      onClick={handleClaimFree}
                      disabled={claiming}
                      className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {claiming ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Issuing Free License...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Claim Free Publication</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-[#CCD2D9]/70">
                      Instantly adds this publication to your account with full download rights.
                    </p>
                  </div>
                ) : (
                  // Paid Publication: Purchase & Cart
                  <div className="space-y-3">
                    <button
                      onClick={handleBuyNow}
                      className="w-full py-3.5 px-5 rounded-xl bg-[#0682F4] hover:bg-[#05A9F7] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Buy Now &amp; Unlock Instant Access</span>
                    </button>

                    <button
                      onClick={handleAddToCart}
                      className="w-full py-3 px-5 rounded-xl bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/40 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Add to Shopping Cart</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Trust & DRM Safeguard Note */}
              <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/20 space-y-2 text-[11px] text-[#CCD2D9]/80">
                <div className="flex items-center gap-2 text-[#08E6F9] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Nexovira Protected Deliverable</span>
                </div>
                <p className="leading-relaxed">
                  Downloads are protected by single-use signed tokens and verified against your account. File checksum and versioning are validated server-side.
                </p>
              </div>

              {/* Report Publication Trigger */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#CCD2D9]">
                <button
                  onClick={() => setReportOpen(true)}
                  className="hover:text-rose-400 transition flex items-center gap-1.5 cursor-pointer text-[11px]"
                >
                  <Flag className="w-3.5 h-3.5 text-[#CCD2D9]/60 hover:text-rose-400" />
                  <span>Report copyright or policy concern</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews & Ratings Section (Integrated with Phase 13) */}
        <div className="mt-16 pt-12 border-t border-[#0682F4]/20">
          <ReviewsSection
            entityType="DIGITAL_PRODUCT"
            entityId={product.productId}
            entityTitle={product.title}
          />
        </div>
      </div>

      {/* Sample Preview Excerpt Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full max-h-[85vh] rounded-2xl bg-[#01213D] border border-[#0682F4]/40 flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#0682F4]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#08E6F9]" />
                <h3 className="text-sm font-bold text-white">Public Sample Excerpt</h3>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-[#CCD2D9] hover:text-white text-xs px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#CCD2D9] leading-relaxed">
              <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/20 text-[11px] text-[#08E6F9]">
                Notice: This is a verified public sample excerpt authorized by the author. Full files are unlocked upon acquisition.
              </div>
              <div className="whitespace-pre-line font-mono bg-[#011B33]/80 p-5 rounded-xl border border-[#0682F4]/20 text-xs text-[#CCD2D9]">
                {product.previewInfo?.excerptText ||
                  'No sample excerpt text provided by author. This publication includes full deliverable package upon purchase.'}
              </div>
            </div>

            <div className="p-4 border-t border-[#0682F4]/30 bg-[#011B33] flex justify-end">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0682F4] text-white text-xs font-bold transition hover:bg-[#05A9F7]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Publication Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full rounded-2xl bg-[#01213D] border border-[#0682F4]/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Flag className="w-4 h-4" />
                <span>Report Publication Concern</span>
              </div>
              <button
                onClick={() => setReportOpen(false)}
                className="text-[#CCD2D9] hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 text-emerald-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <p className="font-bold">Report Submitted Successfully</p>
                <p className="text-[#CCD2D9]">
                  Nexovira Trust &amp; Safety team has been notified and will review the publication against community guidelines.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#08E6F9]"
                  >
                    <option value="COPYRIGHT_VIOLATION">Copyright or Intellectual Property Infringement</option>
                    <option value="MISLEADING_CONTENT">Misleading or Fraudulent Content</option>
                    <option value="MALICIOUS_OR_HARMFUL">Harmful, Malicious, or Corrupted Files</option>
                    <option value="INAPPROPRIATE">Violates Community Terms</option>
                    <option value="OTHER">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Detailed Explanation</label>
                  <textarea
                    rows={4}
                    value={reportExplanation}
                    onChange={(e) => setReportExplanation(e.target.value)}
                    placeholder="Describe specific concerns, copyright links, or discrepancies..."
                    required
                    className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2.5 text-white placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#011B33] text-[#CCD2D9] hover:text-white border border-[#0682F4]/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition disabled:opacity-50"
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
