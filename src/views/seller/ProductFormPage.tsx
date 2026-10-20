import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Package,
  Boxes,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  Star,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';
import { ProductFormInput } from '../../types/seller';
import { Product, ProductAvailability, ProductStatus } from '../../types/marketplace';
import { CloudinaryMediaGuide } from '../../components/seller/CloudinaryMediaGuide';
import { MAX_PRODUCT_IMAGES, validateProductImageUrl } from '../../utils/imageUrlValidator';

// Reusable preset studio asset options for quick merchant selection
const tvImg = '/assets/images/marketplace_smart_tv_1790288884514.jpg';
const laptopImg = '/assets/images/marketplace_laptop_1790288896761.jpg';
const fridgeImg = '/assets/images/marketplace_fridge_1790288906998.jpg';
const headphonesImg = '/assets/images/marketplace_headphones_1790288917294.jpg';
const meshHubImg = '/assets/images/marketplace_mesh_hub_1790288928550.jpg';

interface ProductFormPageProps {
  productId?: string;
}

export const ProductFormPage: React.FC<ProductFormPageProps> = ({ productId }) => {
  const { user, profile } = useAuth();
  const { sellerProducts, createProduct, updateProduct, isVerifiedSeller } = useSeller();
  const { categories } = useMarketplace();
  const { navigate } = useRouter();

  const isEditing = Boolean(productId);
  const existingProduct = productId ? sellerProducts.find((p) => p.productId === productId) : null;

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState('NGN');
  const [discountPrice, setDiscountPrice] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(10);
  const [availabilityStatus, setAvailabilityStatus] = useState<ProductAvailability>('IN_STOCK');
  const [productStatus, setProductStatus] = useState<ProductStatus>('PUBLISHED');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');

  // AI Optimizer State
  const [optimizing, setOptimizing] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const handleAiOptimize = async () => {
    if (!name.trim()) {
      setAiNotice('Please enter a draft product title first so the AI can analyze your hardware listing.');
      return;
    }
    setOptimizing(true);
    setAiNotice(null);
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (user) {
        headers['x-user-id'] = user.uid;
        headers['x-user-role'] = profile?.role || 'SELLER';
      }
      const res = await fetch('/api/ai/seller/optimize-listing', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          currentTitle: name,
          currentDescription: fullDescription || shortDescription,
          targetCategory: category,
          price: Number(price) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.optimizedTitle) setName(data.optimizedTitle);
        if (data.optimizedDescription) {
          setFullDescription(data.optimizedDescription);
          setShortDescription(data.optimizedDescription.slice(0, 160) + '...');
        }
        setAiNotice(`Listing optimized! Readability rating: ${data.readabilityScore || 'Clear & High Conversion'}. Please review and approve before saving.`);
      } else {
        setAiNotice(data.error || 'AI copy service temporarily unavailable.');
      }
    } catch {
      setAiNotice('Failed to reach AI optimization engine.');
    } finally {
      setOptimizing(false);
    }
  };

  // Multiple Images Support (Max configured via MAX_PRODUCT_IMAGES)
  const [primaryImageUrl, setPrimaryImageUrl] = useState(tvImg);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [primaryError, setPrimaryError] = useState<string | null>(null);
  const [additionalErrors, setAdditionalErrors] = useState<Record<number, string>>({});
  const [failedPreviews, setFailedPreviews] = useState<Record<string, boolean>>({});
  const [showCloudinaryGuide, setShowCloudinaryGuide] = useState(false);

  // Specifications
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([
    { label: 'Warranty', value: '2 Years Manufacturer Warranty' },
    { label: 'Condition', value: 'Brand New Original Unit' },
  ]);

  // Variants
  const [variants, setVariants] = useState<{
    variantId: string;
    name: string;
    sku: string;
    price: number;
    stockQuantity: number;
    attributes: Record<string, string>;
  }[]>([]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Populate if editing
  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setSlug(existingProduct.slug);
      setCategory(existingProduct.category);
      setSubcategory(existingProduct.subcategory || '');
      setBrand(existingProduct.brand);
      setSku(existingProduct.sku);
      setPrice(existingProduct.price);
      setCurrency(existingProduct.currency);
      setDiscountPrice(existingProduct.discountPrice ?? '');
      setStockQuantity(existingProduct.stockQuantity);
      setAvailabilityStatus(existingProduct.availabilityStatus);
      setProductStatus(existingProduct.productStatus);
      setShortDescription(existingProduct.shortDescription);
      setFullDescription(existingProduct.fullDescription);
      if (existingProduct.productImages && existingProduct.productImages.length > 0) {
        const sorted = [...existingProduct.productImages].sort((a, b) => (a.order || 0) - (b.order || 0));
        const prim = sorted.find((img) => img.isPrimary) || sorted[0];
        const others = sorted.filter((img) => img !== prim).map((img) => img.url);
        setPrimaryImageUrl(prim.url);
        setAdditionalImages(others);
      }
      if (existingProduct.specifications) {
        setSpecs(existingProduct.specifications);
      }
      if (existingProduct.variants) {
        setVariants(existingProduct.variants);
      }
    }
  }, [existingProduct]);

  // Auto-generate slug on name change if not editing
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!isEditing) {
      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { label: '', value: '' }]);
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx: number, field: 'label' | 'value', val: string) => {
    setSpecs(
      specs.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleAddVariant = () => {
    const vId = `var-${Date.now()}`;
    setVariants([
      ...variants,
      {
        variantId: vId,
        name: 'Standard Option',
        sku: `${sku || 'SKU'}-VAR`,
        price: Number(price) || 0,
        stockQuantity: Number(stockQuantity) || 5,
        attributes: { option: 'Standard' },
      },
    ]);
  };

  const handleRemoveVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (
    idx: number,
    field: 'name' | 'sku' | 'price' | 'stockQuantity' | 'attributeKey' | 'attributeValue',
    val: string | number
  ) => {
    setVariants(
      variants.map((v, i) => {
        if (i !== idx) return v;
        if (field === 'attributeKey' || field === 'attributeValue') {
          const currentAttrs = { ...v.attributes };
          const existingKey = Object.keys(currentAttrs)[0] || 'option';
          const existingVal = Object.values(currentAttrs)[0] || 'Standard';
          const newKey = field === 'attributeKey' ? String(val).trim() : existingKey;
          const newVal = field === 'attributeValue' ? String(val).trim() : existingVal;
          return {
            ...v,
            attributes: { [newKey || 'option']: newVal },
          };
        }
        return {
          ...v,
          [field]: field === 'price' || field === 'stockQuantity' ? Math.max(0, Number(val) || 0) : val,
        };
      })
    );
  };

  const handlePrimaryUrlChange = (val: string) => {
    setPrimaryImageUrl(val);
    setFailedPreviews((prev) => ({ ...prev, [val]: false }));
    if (!val.trim()) {
      setPrimaryError('Primary image URL is required.');
    } else {
      const res = validateProductImageUrl(val);
      setPrimaryError(res.isValid ? null : (res.error || 'Invalid URL format'));
    }
  };

  const handleAddImageField = () => {
    if (1 + additionalImages.length >= MAX_PRODUCT_IMAGES) return;
    setAdditionalImages([...additionalImages, '']);
  };

  const handleAdditionalUrlChange = (idx: number, val: string) => {
    const updated = [...additionalImages];
    updated[idx] = val;
    setAdditionalImages(updated);
    setFailedPreviews((prev) => ({ ...prev, [val]: false }));
    if (val.trim()) {
      const res = validateProductImageUrl(val);
      setAdditionalErrors((prev) => ({
        ...prev,
        [idx]: res.isValid ? '' : (res.error || 'Invalid URL format'),
      }));
    } else {
      setAdditionalErrors((prev) => ({ ...prev, [idx]: '' }));
    }
  };

  const handleRemoveAdditional = (idx: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== idx));
    const newErrors = { ...additionalErrors };
    delete newErrors[idx];
    setAdditionalErrors(newErrors);
  };

  const handleSetAsPrimary = (idx: number) => {
    const newPrimary = additionalImages[idx];
    if (!newPrimary) return;
    const oldPrimary = primaryImageUrl;
    const updated = [...additionalImages];
    updated[idx] = oldPrimary;
    setPrimaryImageUrl(newPrimary);
    setAdditionalImages(updated);
    setPrimaryError(null);
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) {
      handleSetAsPrimary(0);
      return;
    }
    const updated = [...additionalImages];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setAdditionalImages(updated);
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= additionalImages.length - 1) return;
    const updated = [...additionalImages];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setAdditionalImages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!isVerifiedSeller) {
      setFeedback({ type: 'error', message: 'You must be a verified merchant to manage inventory.' });
      return;
    }

    if (!name.trim() || !brand.trim() || !sku.trim()) {
      setFeedback({ type: 'error', message: 'Please provide product name, brand, and SKU.' });
      return;
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setFeedback({ type: 'error', message: 'Price must be a valid positive numerical amount.' });
      return;
    }

    const numericStock = Number(stockQuantity);
    if (isNaN(numericStock) || numericStock < 0) {
      setFeedback({ type: 'error', message: 'Stock quantity cannot be less than zero.' });
      return;
    }

    // Validate Primary Image URL
    if (!primaryImageUrl.trim()) {
      setFeedback({ type: 'error', message: 'Primary product image URL is required.' });
      return;
    }
    const primVal = validateProductImageUrl(primaryImageUrl.trim());
    if (!primVal.isValid) {
      setFeedback({ type: 'error', message: `Primary image error: ${primVal.error || 'Invalid URL'}` });
      return;
    }

    // Validate any non-empty additional image URLs
    const validAdditional: string[] = [];
    for (let i = 0; i < additionalImages.length; i++) {
      const u = additionalImages[i].trim();
      if (u) {
        const valRes = validateProductImageUrl(u);
        if (!valRes.isValid) {
          setFeedback({
            type: 'error',
            message: `Gallery image #${i + 2} error: ${valRes.error || 'Invalid URL'}`,
          });
          return;
        }
        validAdditional.push(u);
      }
    }

    setSaving(true);

    const productImages = [
      { id: 'img-prim', url: primaryImageUrl.trim(), alt: `${name} primary view`, isPrimary: true, order: 1 },
      ...validAdditional.map((url, i) => ({
        id: `img-add-${i}`,
        url,
        alt: `${name} gallery view ${i + 2}`,
        isPrimary: false,
        order: i + 2,
      })),
    ];

    // Validate variants if any were created
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.name.trim()) {
        setSaving(false);
        setFeedback({
          type: 'error',
          message: `Variant #${i + 1} requires an option title (e.g. 55-Inch or 1TB SSD).`,
        });
        return;
      }
      if (typeof v.price !== 'number' || isNaN(v.price) || v.price < 0) {
        setSaving(false);
        setFeedback({
          type: 'error',
          message: `Variant #${i + 1} (${v.name}) must have a valid non-negative price amount.`,
        });
        return;
      }
      if (typeof v.stockQuantity !== 'number' || isNaN(v.stockQuantity) || v.stockQuantity < 0) {
        setSaving(false);
        setFeedback({
          type: 'error',
          message: `Variant #${i + 1} (${v.name}) must have a valid non-negative inventory count.`,
        });
        return;
      }
    }

    const payload: ProductFormInput = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category,
      subcategory: subcategory.trim() ? subcategory.trim() : undefined,
      brand: brand.trim(),
      sku: sku.trim(),
      price: numericPrice,
      currency,
      discountPrice: discountPrice ? Number(discountPrice) : isEditing ? (null as unknown as number) : undefined,
      stockQuantity: numericStock,
      availabilityStatus: numericStock === 0 ? 'OUT_OF_STOCK' : availabilityStatus,
      productStatus,
      shortDescription: shortDescription.trim() || name.trim(),
      fullDescription: fullDescription.trim() || shortDescription.trim(),
      productImages,
      specifications: specs.filter((s) => s.label.trim() && s.value.trim()),
      variants: variants.length > 0 ? variants : [], // Clean empty array, NEVER undefined
    };

    let res;
    if (isEditing && productId) {
      res = await updateProduct(productId, payload);
    } else {
      res = await createProduct(payload);
    }

    setSaving(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: isEditing ? 'Product successfully updated.' : 'Product published to catalog.',
      });
      setTimeout(() => navigate('/seller/dashboard'), 1000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to save product.' });
    }
  };

  return (
    <div className="py-12 sm:py-20 bg-[#01213D] min-h-[90vh]">
      <Container size="default">
        
        {/* Back and Title */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs text-[#CCD2D9] hover:text-[#08E6F9] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#08E6F9]" />
            <span>Return to Seller Dashboard</span>
          </button>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
              <span>Merchant Catalog Management</span>
              <span aria-hidden="true">·</span>
              <span>{isEditing ? 'Edit Product' : 'Add New Hardware'}</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {isEditing ? `Edit: ${existingProduct?.name || 'Product'}` : 'PUBLISH NEW PRODUCT'}
            </h1>
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-[#011B33] border-[#08E6F9]/40 text-[#08E6F9]'
                  : 'bg-[#011B33] border-red-500/40 text-red-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Basic Information */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="pb-3 border-b border-[#0682F4]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#08E6F9]" />
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Basic Product Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAiOptimize}
                  disabled={optimizing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] text-xs font-bold shadow-md hover:brightness-110 transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${optimizing ? 'animate-spin' : ''}`} />
                  <span>{optimizing ? 'Optimizing Copy...' : 'AI Enhance Copy'}</span>
                </button>
              </div>

              {aiNotice && (
                <div className="p-3 rounded-xl bg-[#08E6F9]/10 border border-[#08E6F9]/30 text-[#08E6F9] text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{aiNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g. Sony WH-1000XM5 Noise Canceling Headphones"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Manufacturer / Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Sony, LG, Samsung, Nexovira"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.categoryId} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Subcategory (Optional)
                  </label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="e.g. Wireless Audio, Smart TVs"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Canonical URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="sony-wh1000xm5-headphones"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Short Description (Headline Summary) *
                  </label>
                  <input
                    type="text"
                    required
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief 1-2 sentence overview shown on catalog cards"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Full Product Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={fullDescription}
                    onChange={(e) => setFullDescription(e.target.value)}
                    placeholder="Comprehensive features, operational specifications, build quality, and package contents..."
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pricing & Inventory */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="pb-3 border-b border-[#0682F4]/20 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#08E6F9]" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  Pricing & Inventory Control
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Base Price (Numerical) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="495000"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Discount Price (Optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="460000"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    ISO Currency Code
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono cursor-pointer"
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    SKU Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SNY-WH1000-BLK"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Stock Quantity (Units) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="15"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Availability Status
                  </label>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none cursor-pointer"
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Product Images (Multi-URL Management with Cloudinary Support) */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="pb-3 border-b border-[#0682F4]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#08E6F9]" />
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Product Imagery Assets
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9]">
                    {1 + additionalImages.length} / {MAX_PRODUCT_IMAGES} Images
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCloudinaryGuide(!showCloudinaryGuide)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#08E6F9]/40 text-[#08E6F9] hover:text-white transition cursor-pointer self-start sm:self-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showCloudinaryGuide ? 'Hide Cloudinary Guide' : 'How to Upload & Get URLs'}</span>
                </button>
              </div>

              {/* Cloudinary Guide Drawer / Modal */}
              {showCloudinaryGuide && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <CloudinaryMediaGuide onClose={() => setShowCloudinaryGuide(false)} />
                </div>
              )}

              {/* Quick Studio Presets Selector */}
              <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#0682F4]/20 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#CCD2D9]/80">
                  <span>Quick Verified Studio Assets (Click to apply as primary):</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {[
                    { label: 'Smart TV', url: tvImg },
                    { label: 'Studio Laptop', url: laptopImg },
                    { label: 'Smart Refrigerator', url: fridgeImg },
                    { label: 'Headphones', url: headphonesImg },
                    { label: 'Mesh Router', url: meshHubImg },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePrimaryUrlChange(preset.url)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        primaryImageUrl === preset.url
                          ? 'bg-[#0682F4]/20 border-[#08E6F9] text-[#08E6F9] font-bold'
                          : 'bg-[#011B33] border-[#0682F4]/20 text-[#CCD2D9] hover:text-white'
                      }`}
                    >
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Image Field with Live Preview */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#01213D] border border-[#0682F4]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#08E6F9]" />
                    <span>Primary Product Image URL *</span>
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0682F4]/20 text-[#08E6F9] border border-[#0682F4]/30 font-bold uppercase">
                    Catalog Card &amp; Main Hero
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      required
                      value={primaryImageUrl}
                      onChange={(e) => handlePrimaryUrlChange(e.target.value)}
                      placeholder="https://res.cloudinary.com/your-cloud/image/upload/v1/product.jpg"
                      className={`w-full bg-[#011B33] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border font-mono transition ${
                        primaryError
                          ? 'border-red-500 focus:border-red-400 focus:outline-none'
                          : 'border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none'
                      }`}
                    />
                    {primaryError && (
                      <div className="flex items-center gap-1.5 text-xs text-red-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{primaryError}</span>
                      </div>
                    )}
                    {primaryImageUrl && !primaryError && (
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valid secure image URL format</span>
                      </span>
                    )}
                  </div>

                  {/* Primary Thumbnail Preview */}
                  <div className="relative w-28 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden bg-[#011629] border border-[#0682F4]/40 shrink-0 flex items-center justify-center">
                    {primaryImageUrl && !failedPreviews[primaryImageUrl] ? (
                      <img
                        src={primaryImageUrl}
                        alt="Primary Preview"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedPreviews((prev) => ({ ...prev, [primaryImageUrl]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-[#CCD2D9]/40 font-mono text-[10px]">
                        {failedPreviews[primaryImageUrl] ? (
                          <span className="text-amber-400">Preview Unreachable</span>
                        ) : (
                          <span>No Preview</span>
                        )}
                      </div>
                    )}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#01213D]/90 text-[9px] font-mono text-[#08E6F9] font-bold">
                      Primary
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Image URLs List */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-2">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Additional Gallery Images
                    </h4>
                    <span className="text-[11px] text-[#CCD2D9]/70">
                      Customers can browse between all images in the product detail view gallery.
                    </span>
                  </div>

                  {1 + additionalImages.length < MAX_PRODUCT_IMAGES && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddImageField}
                      className="text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Image</span>
                    </Button>
                  )}
                </div>

                {additionalImages.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#01213D]/40 border border-dashed border-[#0682F4]/30 text-center space-y-2">
                    <ImageIcon className="w-6 h-6 text-[#0682F4]/50 mx-auto" />
                    <p className="text-xs text-[#CCD2D9]">
                      No additional gallery images added yet. You can add up to {MAX_PRODUCT_IMAGES - 1} more images.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddImageField}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0682F4]/20 hover:bg-[#0682F4]/30 border border-[#0682F4]/40 text-[#08E6F9] transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Another Image URL</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {additionalImages.map((imgUrl, idx) => {
                      const err = additionalErrors[idx];
                      const isFailed = failedPreviews[imgUrl];
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
                        >
                          {/* Live Thumbnail */}
                          <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-[#011629] border border-[#0682F4]/30 shrink-0 flex items-center justify-center">
                            {imgUrl && !isFailed ? (
                              <img
                                src={imgUrl}
                                alt={`Gallery view ${idx + 2}`}
                                referrerPolicy="no-referrer"
                                onError={() =>
                                  setFailedPreviews((prev) => ({ ...prev, [imgUrl]: true }))
                                }
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[9px] font-mono text-[#CCD2D9]/40 text-center p-1">
                                {isFailed ? 'Error' : `#${idx + 2}`}
                              </span>
                            )}
                          </div>

                          {/* URL Input */}
                          <div className="flex-1 w-full space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#CCD2D9]">
                              <span>Gallery Image #{idx + 2}</span>
                              {imgUrl.includes('cloudinary.com') && (
                                <span className="text-[#08E6F9]">Cloudinary Asset</span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={imgUrl}
                              onChange={(e) => handleAdditionalUrlChange(idx, e.target.value)}
                              placeholder="https://res.cloudinary.com/your-cloud/image/upload/v1/gallery-photo.jpg"
                              className={`w-full bg-[#011B33] text-white text-xs px-3 py-2 rounded-lg border font-mono transition ${
                                err
                                  ? 'border-red-500 focus:border-red-400 focus:outline-none'
                                  : 'border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none'
                              }`}
                            />
                            {err && (
                              <span className="text-[10px] text-red-400 block">{err}</span>
                            )}
                          </div>

                          {/* Image Action Controls */}
                          <div className="flex items-center gap-1 shrink-0 pt-1 sm:pt-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleSetAsPrimary(idx)}
                              className="px-2 py-1.5 rounded-lg bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] text-xs font-mono flex items-center gap-1 transition cursor-pointer"
                              title="Designate as primary image"
                            >
                              <Star className="w-3 h-3" />
                              <span className="hidden md:inline">Make Primary</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveUp(idx)}
                              className="p-1.5 rounded-lg bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white transition cursor-pointer"
                              title="Move up in gallery order"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveDown(idx)}
                              disabled={idx >= additionalImages.length - 1}
                              className="p-1.5 rounded-lg bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white transition cursor-pointer disabled:opacity-30"
                              title="Move down in gallery order"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveAdditional(idx)}
                              className="p-1.5 rounded-lg bg-[#011B33] hover:bg-rose-500/20 border border-[#0682F4]/30 text-rose-400 transition cursor-pointer"
                              title="Remove image URL"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {1 + additionalImages.length < MAX_PRODUCT_IMAGES && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleAddImageField}
                          className="w-full text-xs py-2"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Another Image ({1 + additionalImages.length} of {MAX_PRODUCT_IMAGES})</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Specifications */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="pb-3 border-b border-[#0682F4]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#08E6F9]" />
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Technical Specifications
                  </h3>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddSpec} className="text-xs">
                  <Plus className="w-3 h-3" />
                  <span>Add Spec</span>
                </Button>
              </div>

              <div className="space-y-2">
                {specs.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                      placeholder="Specification Label (e.g. Display)"
                      className="w-1/3 bg-[#01213D] text-white text-xs px-3 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      placeholder="Value (e.g. 55-inch OLED 120Hz)"
                      className="flex-1 bg-[#01213D] text-white text-xs px-3 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(idx)}
                      className="p-2 text-[#CCD2D9]/60 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Product Options & Variants (Optional) */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="pb-3 border-b border-[#0682F4]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-[#08E6F9]" />
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Product Options &amp; Variants
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9]">
                    {variants.length} {variants.length === 1 ? 'Variant' : 'Variants'}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddVariant}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Variant</span>
                </Button>
              </div>

              {variants.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#0682F4]/20 text-center">
                  <p className="text-xs text-[#CCD2D9]/70">
                    No SKU variants configured. This product will be published as a single standard hardware item.
                  </p>
                  <p className="text-[11px] font-mono text-[#08E6F9] mt-1">
                    Click &quot;Add Variant&quot; above if this product offers multiple sizes, capacities, or colors.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variants.map((v, idx) => (
                    <div
                      key={v.variantId || idx}
                      className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#08E6F9]">
                          Variant #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono text-[#CCD2D9] mb-1">
                            Option Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={v.name}
                            onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                            placeholder="e.g. 65-Inch or 1TB SSD"
                            className="w-full bg-[#011B33] text-white text-xs px-3 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#CCD2D9] mb-1">
                            Variant SKU *
                          </label>
                          <input
                            type="text"
                            required
                            value={v.sku}
                            onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                            placeholder="SKU-VAR-01"
                            className="w-full bg-[#011B33] text-white text-xs px-3 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#CCD2D9] mb-1">
                            Price ({currency}) *
                          </label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={v.price}
                            onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                            placeholder="Price"
                            className="w-full bg-[#011B33] text-white text-xs px-3 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#CCD2D9] mb-1">
                            Stock Units *
                          </label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={v.stockQuantity}
                            onChange={(e) => handleVariantChange(idx, 'stockQuantity', e.target.value)}
                            placeholder="Stock"
                            className="w-full bg-[#011B33] text-white text-xs px-3 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 6: Publishing Status & Submission */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="pb-3 border-b border-[#0682F4]/20 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#08E6F9]" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  Publishing & Lifecycle State
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-1/2">
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Catalog Publication State
                  </label>
                  <select
                    value={productStatus}
                    onChange={(e) => setProductStatus(e.target.value as any)}
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none cursor-pointer"
                  >
                    <option value="PUBLISHED">Published (Immediately Active on Marketplace)</option>
                    <option value="DRAFT">Draft (Hidden from Marketplace)</option>
                    <option value="ARCHIVED">Archived (Retired)</option>
                  </select>
                </div>

                <div className="w-full sm:w-auto flex items-center gap-3 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => navigate('/seller/dashboard')}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving to Catalog...' : isEditing ? 'Update Product' : 'Publish Product'}</span>
                  </Button>
                </div>
              </div>
            </div>

          </form>

        </div>
      </Container>
    </div>
  );
};
