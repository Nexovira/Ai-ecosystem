import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';
import { ProductFormInput } from '../../types/seller';
import { Product, ProductAvailability, ProductStatus } from '../../types/marketplace';

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

  // Images
  const [primaryImageUrl, setPrimaryImageUrl] = useState(tvImg);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

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
      if (existingProduct.productImages && existingProduct.productImages[0]) {
        setPrimaryImageUrl(existingProduct.productImages[0].url);
        setAdditionalImages(existingProduct.productImages.slice(1).map((i) => i.url));
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

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setAdditionalImages([...additionalImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
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

    setSaving(true);

    const productImages = [
      { id: 'img-prim', url: primaryImageUrl, alt: `${name} primary view`, isPrimary: true, order: 1 },
      ...additionalImages.map((url, i) => ({
        id: `img-add-${i}`,
        url,
        alt: `${name} view ${i + 2}`,
        isPrimary: false,
        order: i + 2,
      })),
    ];

    const payload: ProductFormInput = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category,
      subcategory: subcategory.trim() || undefined,
      brand: brand.trim(),
      sku: sku.trim(),
      price: numericPrice,
      currency,
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stockQuantity: numericStock,
      availabilityStatus: numericStock === 0 ? 'OUT_OF_STOCK' : availabilityStatus,
      productStatus,
      shortDescription: shortDescription.trim() || name.trim(),
      fullDescription: fullDescription.trim() || shortDescription.trim(),
      productImages,
      specifications: specs.filter((s) => s.label.trim() && s.value.trim()),
      variants: variants.length > 0 ? variants : undefined,
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

            {/* Section 3: Product Images */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="pb-3 border-b border-[#0682F4]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#08E6F9]" />
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Product Imagery Assets
                  </h3>
                </div>
              </div>

              {/* Quick Preset Selector */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[#CCD2D9]/70 block">
                  Select Quick Verified Asset (Or Enter Direct URL Below):
                </span>
                <div className="flex gap-2 overflow-x-auto pb-2">
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
                      onClick={() => setPrimaryImageUrl(preset.url)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                        primaryImageUrl === preset.url
                          ? 'bg-[#0682F4]/20 border-[#08E6F9] text-[#08E6F9] font-bold'
                          : 'bg-[#01213D] border-[#0682F4]/20 text-[#CCD2D9]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                  Primary Image URL *
                </label>
                <input
                  type="text"
                  required
                  value={primaryImageUrl}
                  onChange={(e) => setPrimaryImageUrl(e.target.value)}
                  placeholder="Asset URL"
                  className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                />
              </div>

              {/* Additional Images */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-mono text-[#CCD2D9]">
                  Additional Gallery Images
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter secondary image URL"
                    className="flex-1 bg-[#01213D] text-white text-xs px-3.5 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddImage}>
                    <span>Add</span>
                  </Button>
                </div>

                {additionalImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-2">
                    {additionalImages.map((imgUrl, i) => (
                      <div key={i} className="relative w-16 h-12 rounded-lg overflow-hidden border border-[#0682F4]/30 group">
                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAdditionalImages(additionalImages.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-red-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
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

            {/* Section 5: Publishing Status & Submission */}
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
