import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import {
  DigitalProduct,
  DigitalProductCategory,
  DigitalProductType,
  CreateDigitalProductInput,
} from '../../types/digitalProduct';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  X,
  Loader2,
  ArrowLeft,
  ShieldAlert,
  Image as ImageIcon,
  HelpCircle,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';
import { CloudinaryMediaGuide } from '../../components/seller/CloudinaryMediaGuide';
import { validateProductImageUrl, validateDeliverableUrl } from '../../utils/imageUrlValidator';

export const SellerDigitalProductsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const { isVerifiedSeller } = useSeller();

  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [categories, setCategories] = useState<DigitalProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [categorySlug, setCategorySlug] = useState('software-engineering');
  const [productType, setProductType] = useState<DigitalProductType>('PDF');
  const [price, setPrice] = useState<number>(5000);
  const [isFree, setIsFree] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop');
  const [coverImageError, setCoverImageError] = useState<string | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);
  const [externalFileUrl, setExternalFileUrl] = useState('');
  const [fileUrlError, setFileUrlError] = useState<string | null>(null);
  const [samplePdfUrl, setSamplePdfUrl] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [excerptText, setExcerptText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [fileSize, setFileSize] = useState<number>(3500000);
  const [pageCount, setPageCount] = useState<number>(45);
  const [version, setVersion] = useState('1.0');

  useEffect(() => {
    async function loadData() {
      if (!user) {
        navigate('/signin');
        return;
      }
      setLoading(true);
      try {
        // Load Categories
        const catRes = await fetch('/api/digital-products/categories');
        const catData = await catRes.json();
        if (catData.success && Array.isArray(catData.categories)) {
          setCategories(catData.categories);
        }

        // Load Creator's Products
        const prodRes = await fetch('/api/creator/digital-products', {
          headers: {
            'x-user-id': user.uid,
          },
        });
        const prodData = await prodRes.json();
        if (prodData.success && Array.isArray(prodData.products)) {
          setProducts(prodData.products);
        }
      } catch (err) {
        console.error('Failed to load creator digital catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setTitle('');
    setCategorySlug(categories[0]?.slug || 'software-engineering');
    setProductType('PDF');
    setPrice(5000);
    setIsFree(false);
    setShortDescription('');
    setDescription('');
    setCoverImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop');
    setCoverImageError(null);
    setCoverFailed(false);
    setExternalFileUrl('');
    setFileUrlError(null);
    setSamplePdfUrl('');
    setExcerptText('');
    setFileName('Publication_Draft.pdf');
    setFileType('pdf');
    setFileSize(4200000);
    setPageCount(60);
    setVersion('1.0');
    setIsModalOpen(true);
  };

  const openEditModal = (p: DigitalProduct) => {
    setEditingProduct(p);
    setTitle(p.title);
    setCategorySlug(p.categorySlug);
    setProductType(p.productType);
    setPrice(p.price);
    setIsFree(p.isFree);
    setShortDescription(p.shortDescription);
    setDescription(p.description);
    setCoverImage(p.coverImage || '');
    setCoverImageError(null);
    setCoverFailed(false);
    setExternalFileUrl(p.externalFileUrl || '');
    setFileUrlError(null);
    setSamplePdfUrl(p.previewInfo?.samplePdfUrl || '');
    setExcerptText(p.previewInfo?.excerptText || '');
    setFileName(p.fileMetadata?.fileName || '');
    setFileType(p.fileMetadata?.fileType || 'pdf');
    setFileSize(p.fileMetadata?.fileSize || 0);
    setPageCount(p.fileMetadata?.pageCount || 1);
    setVersion(p.fileMetadata?.version || '1.0');
    setIsModalOpen(true);
  };

  const handleCoverUrlChange = (val: string) => {
    setCoverImage(val);
    setCoverFailed(false);
    if (val.trim()) {
      const res = validateProductImageUrl(val);
      setCoverImageError(res.isValid ? null : (res.error || 'Invalid URL format'));
    } else {
      setCoverImageError(null);
    }
  };

  const handleExternalFileUrlChange = (val: string) => {
    setExternalFileUrl(val);
    if (val.trim()) {
      const res = validateDeliverableUrl(val);
      setFileUrlError(res.isValid ? null : (res.error || 'Invalid deliverable URL'));
    } else {
      setFileUrlError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setFeedback(null);

    // Validate Cover Image if provided
    if (coverImage.trim()) {
      const cRes = validateProductImageUrl(coverImage.trim());
      if (!cRes.isValid) {
        setFeedback({ type: 'error', text: `Cover Image Error: ${cRes.error || 'Invalid URL'}` });
        setSubmitting(false);
        return;
      }
    }

    // Validate External File URL if provided
    if (externalFileUrl.trim()) {
      const fRes = validateDeliverableUrl(externalFileUrl.trim());
      if (!fRes.isValid) {
        setFeedback({ type: 'error', text: `Deliverable File URL Error: ${fRes.error || 'Invalid URL'}` });
        setSubmitting(false);
        return;
      }
    }

    const payload: CreateDigitalProductInput = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      categorySlug,
      price: isFree ? 0 : Number(price),
      currency: 'NGN',
      isFree,
      productType,
      coverImage: coverImage.trim() || undefined,
      externalFileUrl: externalFileUrl.trim() || undefined,
      previewInfo: {
        previewType: 'EXCERPT',
        excerptText: excerptText.trim() || undefined,
        samplePdfUrl: samplePdfUrl.trim() || undefined,
      },
      fileMetadata: {
        fileName: fileName.trim() || 'deliverable.pdf',
        fileSize: Number(fileSize) || 2048000,
        fileType: fileType.toLowerCase(),
        mimeType: fileType === 'pdf' ? 'application/pdf' : 'application/octet-stream',
        pageCount: Number(pageCount) || undefined,
        version: version.trim() || '1.0',
      },
      visibility: 'PUBLIC',
    };

    try {
      const endpoint = editingProduct
        ? `/api/creator/digital-products/${editingProduct.productId}`
        : '/api/creator/digital-products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-name': profile?.fullName || user.displayName || 'Creator',
          'x-user-role': profile?.role || 'SELLER',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save digital product');
      }

      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) => (p.productId === editingProduct.productId ? data.product : p))
        );
        setFeedback({ type: 'success', text: 'Publication updated successfully.' });
      } else {
        setProducts((prev) => [data.product, ...prev]);
        setFeedback({
          type: 'success',
          text: 'Publication authored and submitted for editorial review (PENDING_REVIEW).',
        });
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting publication';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!user) return;
    try {
      setDeletingProductId(null);
      const res = await fetch(`/api/creator/digital-products/${productId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile?.role || 'SELLER',
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to archive publication');
      }
      setProducts((prev) => prev.filter((p) => p.productId !== productId));
      setFeedback({ type: 'success', text: 'Publication archived.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error archiving publication';
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

  // Metrics
  const totalSales = products.reduce((acc, curr) => acc + (curr.salesCount || 0), 0);
  const totalRevenue = products.reduce(
    (acc, curr) => acc + (curr.salesCount || 0) * (curr.price || 0),
    0
  );
  const publishedCount = products.filter((p) => p.status === 'PUBLISHED').length;
  const pendingCount = products.filter((p) => p.status === 'PENDING_REVIEW').length;

  return (
    <div className="min-h-screen bg-[#011B33] text-white pb-20">
      {/* Header */}
      <section className="pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#0682F4]/20 bg-[#01213D]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#08E6F9] tracking-wide uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Creator Console</span>
              <span aria-hidden="true" className="text-[#CCD2D9]/40">·</span>
              <span>Content Commerce</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Digital Publications &amp; Creator Assets
            </h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] max-w-2xl leading-relaxed">
              Author and sell ebooks, engineering blueprints, architectural guides, and system templates. All publications undergo editorial review before public discovery.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/seller/dashboard')}
              className="px-4 py-2.5 rounded-xl bg-[#011B33] border border-[#0682F4]/30 hover:bg-[#0682F4]/20 text-xs font-semibold text-[#CCD2D9] hover:text-white transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Merchant Dashboard</span>
            </button>

            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 rounded-xl bg-[#0682F4] hover:bg-[#05A9F7] text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Publication</span>
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
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-[#CCD2D9] hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-[#01213D] border border-[#0682F4]/20">
            <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70 block">Total Publications</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{products.length}</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#01213D] border border-[#0682F4]/20">
            <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70 block">Published</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{publishedCount}</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#01213D] border border-[#0682F4]/20">
            <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70 block">Pending Review</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">{pendingCount}</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#01213D] border border-[#0682F4]/20">
            <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70 block">Digital Sales Count</span>
            <span className="text-2xl font-black text-[#08E6F9] font-mono mt-1 block">{totalSales}</span>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="rounded-2xl bg-[#01213D] border border-[#0682F4]/20 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[#0682F4]/20 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Your Publications Catalog</h2>
            <span className="text-xs text-[#CCD2D9] font-mono">{products.length} authored items</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-[#CCD2D9]">Loading catalog...</div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-[#08E6F9] mx-auto opacity-80" />
              <h3 className="text-base font-bold text-white">No publications created yet</h3>
              <p className="text-xs text-[#CCD2D9] max-w-sm mx-auto">
                Author your first digital handbook, technical guide, or blueprint to start earning on the Nexovira Content Commerce platform.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-2 px-4 py-2 rounded-xl bg-[#0682F4] text-white text-xs font-bold hover:bg-[#05A9F7] transition cursor-pointer"
              >
                Create Digital Publication
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#CCD2D9]">
                <thead className="bg-[#011B33]/60 text-[11px] font-mono uppercase text-[#CCD2D9]/80 border-b border-[#0682F4]/20">
                  <tr>
                    <th className="py-3 px-4">Publication</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Sales</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0682F4]/10">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#011B33]/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white max-w-xs truncate">{p.title}</div>
                        <div className="text-[10px] text-[#CCD2D9]/60 font-mono">v{p.fileMetadata?.version || '1.0'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#08E6F9]">{p.productType}</td>
                      <td className="py-3.5 px-4">{p.categoryName}</td>
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
                          className="p-1.5 rounded-lg bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white transition cursor-pointer"
                          title="View Public Page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] transition cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {deletingProductId === p.productId ? (
                          <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-lg">
                            <span className="text-[10px] text-rose-300 font-semibold">Archive?</span>
                            <button
                              onClick={() => handleDelete(p.productId)}
                              className="text-[10px] px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingProductId(null)}
                              className="text-[10px] text-[#CCD2D9] hover:text-white px-1"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeletingProductId(p.productId)}
                            className="p-1.5 rounded-lg bg-[#011B33] hover:bg-rose-500/20 border border-[#0682F4]/30 text-rose-400 transition cursor-pointer"
                            title="Archive Publication"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Author/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full max-h-[90vh] rounded-2xl bg-[#01213D] border border-[#0682F4]/40 flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#0682F4]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#08E6F9]" />
                <h3 className="text-sm font-bold text-white">
                  {editingProduct ? 'Edit Digital Publication' : 'Author New Digital Publication'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#CCD2D9] hover:text-white text-xs px-2 py-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Publication Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Systems Architecture Blueprint"
                  className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2.5 text-white placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              {/* Category & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Category *</label>
                  <select
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#08E6F9]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Product Type / Format *</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value as DigitalProductType)}
                    className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#08E6F9]"
                  >
                    <option value="PDF">PDF Technical Guide</option>
                    <option value="EBOOK">Ebook</option>
                    <option value="TEMPLATE">Architecture Template</option>
                    <option value="DIGITAL_RESOURCE">Digital Resource Kit</option>
                    <option value="DOCUMENT">Specification Doc</option>
                  </select>
                </div>
              </div>

              {/* Media & Deliverable URLs Section */}
              <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/40 space-y-3">
                <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#08E6F9]" />
                    <span className="font-bold text-white text-xs">Cover Art &amp; Media Hosting</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-[#08E6F9] hover:underline flex items-center gap-1 text-[11px] font-mono cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showGuide ? 'Hide Guide' : 'Hosting Guide (Cloudinary & Drive)'}</span>
                  </button>
                </div>

                {showGuide && (
                  <div className="pt-1 pb-2">
                    <CloudinaryMediaGuide onClose={() => setShowGuide(false)} />
                  </div>
                )}

                {/* Cover Image URL */}
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <div className="flex-1 w-full space-y-1">
                    <label className="block text-[#CCD2D9] font-semibold text-[11px]">
                      Publication Cover Image URL (Cloudinary / Direct HTTPS)
                    </label>
                    <input
                      type="text"
                      value={coverImage}
                      onChange={(e) => handleCoverUrlChange(e.target.value)}
                      placeholder="https://res.cloudinary.com/your-cloud/image/upload/v1/cover.jpg"
                      className={`w-full bg-[#01213D] border rounded-lg p-2 text-white font-mono text-xs focus:outline-none ${
                        coverImageError ? 'border-red-500' : 'border-[#0682F4]/30 focus:border-[#08E6F9]'
                      }`}
                    />
                    {coverImageError && (
                      <span className="text-[10px] text-red-400 block">{coverImageError}</span>
                    )}
                  </div>

                  {/* Live Cover Preview */}
                  <div className="relative w-20 h-16 sm:w-24 sm:h-20 rounded-lg overflow-hidden bg-[#011629] border border-[#0682F4]/30 shrink-0 flex items-center justify-center">
                    {coverImage && !coverFailed ? (
                      <img
                        src={coverImage}
                        alt="Cover preview"
                        referrerPolicy="no-referrer"
                        onError={() => setCoverFailed(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] font-mono text-[#CCD2D9]/40 text-center p-1">
                        {coverFailed ? 'Unreachable' : 'No Cover'}
                      </span>
                    )}
                  </div>
                </div>

                {/* External Deliverable File URL */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="text-[#CCD2D9] font-semibold flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-[#08E6F9]" />
                      <span>Deliverable File URL (Google Drive / Cloudinary Raw / Dropbox)</span>
                    </label>
                    <span className="text-[#08E6F9] font-mono text-[10px]">Protected Customer Access</span>
                  </div>
                  <input
                    type="text"
                    value={externalFileUrl}
                    onChange={(e) => handleExternalFileUrlChange(e.target.value)}
                    placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"
                    className={`w-full bg-[#01213D] border rounded-lg p-2 text-white font-mono text-xs focus:outline-none ${
                      fileUrlError ? 'border-red-500' : 'border-[#0682F4]/30 focus:border-[#08E6F9]'
                    }`}
                  />
                  {fileUrlError ? (
                    <span className="text-[10px] text-red-400 block">{fileUrlError}</span>
                  ) : (
                    <span className="text-[10px] text-[#CCD2D9]/70 block">
                      When customers purchase this publication, they are redirected to this authoritative file link upon license authorization. Ensure Google Drive links are set to "Anyone with link can view".
                    </span>
                  )}
                </div>

                {/* Sample Excerpt PDF URL */}
                <div className="space-y-1 pt-1">
                  <label className="block text-[#CCD2D9] font-semibold text-[11px]">
                    Sample Preview PDF URL (Optional Public Reader Excerpt)
                  </label>
                  <input
                    type="text"
                    value={samplePdfUrl}
                    onChange={(e) => setSamplePdfUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/your-cloud/raw/upload/sample-chapter.pdf"
                    className="w-full bg-[#01213D] border border-[#0682F4]/30 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Price (NGN) *</label>
                  <input
                    type="number"
                    disabled={isFree}
                    min={0}
                    step={100}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2.5 text-white disabled:opacity-40 focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-white">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      className="rounded border-[#0682F4] text-[#0682F4] focus:ring-[#08E6F9]"
                    />
                    <span>Make Publication Completely Free</span>
                  </label>
                </div>
              </div>

              {/* Short & Full Description */}
              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Short Summary *</label>
                <input
                  type="text"
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One sentence overview for catalog display..."
                  className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2.5 text-white placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Full Publication Overview *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed breakdown of contents, chapters, blueprints, and deliverables..."
                  className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2.5 text-white placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              {/* Public Excerpt Sample */}
              <div>
                <label className="block text-[#CCD2D9] mb-1 font-semibold">Sample Excerpt (Public Preview)</label>
                <textarea
                  rows={3}
                  value={excerptText}
                  onChange={(e) => setExcerptText(e.target.value)}
                  placeholder="Safe public sample text or table of contents excerpt..."
                  className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2.5 text-white placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              {/* File Specs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">File Name</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Handbook.pdf"
                    className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2 text-white focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Page Count</label>
                  <input
                    type="number"
                    value={pageCount}
                    onChange={(e) => setPageCount(Number(e.target.value))}
                    className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2 text-white focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>
                <div>
                  <label className="block text-[#CCD2D9] mb-1 font-semibold">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-2 text-white focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[#0682F4]/30 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#011B33] text-[#CCD2D9] hover:text-white border border-[#0682F4]/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#0682F4] hover:bg-[#05A9F7] text-white font-bold transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Save Changes' : 'Submit for Review'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
