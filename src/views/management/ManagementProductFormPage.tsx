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
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';
import { ProductFormInput } from '../../types/seller';
import { Product, ProductAvailability, ProductStatus } from '../../types/marketplace';
import { CloudinaryMediaGuide } from '../../components/common/CloudinaryMediaGuide';
import { MAX_PRODUCT_IMAGES, validateProductImageUrl } from '../../utils/imageUrlValidator';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  normalizeProductForFirestore,
  normalizeProductUpdatesForFirestore,
} from '../../utils/productNormalization';

// Preset studio asset options for quick selection
const tvImg = '/assets/images/marketplace_smart_tv_1790288884514.jpg';
const laptopImg = '/assets/images/marketplace_laptop_1790288896761.jpg';
const fridgeImg = '/assets/images/marketplace_fridge_1790288906998.jpg';
const headphonesImg = '/assets/images/marketplace_headphones_1790288917294.jpg';
const meshHubImg = '/assets/images/marketplace_mesh_hub_1790288928550.jpg';

interface ManagementProductFormPageProps {
  productId?: string;
}

export const ManagementProductFormPage: React.FC<ManagementProductFormPageProps> = ({ productId }) => {
  const { user, profile } = useAuth();
  const { categories, products } = useMarketplace();
  const { navigate } = useRouter();

  const isEditing = Boolean(productId);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [fetchingExisting, setFetchingExisting] = useState(Boolean(productId));

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
      setAiNotice('Please enter a draft product title first so the AI can analyze your listing.');
      return;
    }
    setOptimizing(true);
    setAiNotice(null);
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (user) {
        headers['x-user-id'] = user.uid;
        headers['x-user-role'] = profile?.role || 'ADMIN';
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

  // Multiple Images Support
  const [primaryImageUrl, setPrimaryImageUrl] = useState(tvImg);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [primaryError, setPrimaryError] = useState<string | null>(null);
  const [additionalErrors, setAdditionalErrors] = useState<Record<number, string>>({});
  const [failedPreviews, setFailedPreviews] = useState<Record<string, boolean>>({});

  // Guide Modal State
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  // Specifications
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([
    { key: 'Color', value: 'Space Gray' },
    { key: 'Warranty', value: '1 Year Manufacturer Direct' },
  ]);

  // Product Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<
    { name: string; sku: string; price: number; stockQuantity: number }[]
  >([]);

  // Logistics & Warranty
  const [warrantyInfo, setWarrantyInfo] = useState('12 Months Official Manufacturer Warranty');
  const [returnPolicy, setReturnPolicy] = useState('7 Days Hassle-Free Replacement for Verified Defects');
  const [shippingWeight, setShippingWeight] = useState<number | ''>(1.5);
  const [tags, setTags] = useState('electronics, premium, nexovira');

  // Submit Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'CONTENT_MANAGER'].includes(profile?.role || '');

  // Fetch product if editing
  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      setFetchingExisting(true);
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExistingProduct(docSnap.data() as Product);
        } else {
          // fallback to context products
          const found = products.find((p) => p.productId === productId);
          if (found) setExistingProduct(found);
        }
      } catch (err) {
        console.warn('Error loading product for edit:', err);
      } finally {
        setFetchingExisting(false);
      }
    }
    loadProduct();
  }, [productId, products]);

  // Populate fields if editing
  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name || '');
      setSlug(existingProduct.slug || '');
      setCategory(existingProduct.category || 'Electronics');
      setSubcategory(existingProduct.subcategory || '');
      setBrand(existingProduct.brand || '');
      setSku(existingProduct.sku || '');
      setPrice(existingProduct.price || '');
      setCurrency(existingProduct.currency || 'NGN');
      setDiscountPrice(existingProduct.discountPrice ?? '');
      setStockQuantity(existingProduct.stockQuantity ?? 10);
      setAvailabilityStatus(existingProduct.availabilityStatus || 'IN_STOCK');
      setProductStatus(existingProduct.productStatus || 'PUBLISHED');
      setShortDescription(existingProduct.shortDescription || '');
      setFullDescription(existingProduct.fullDescription || '');

      if (existingProduct.productImages && existingProduct.productImages.length > 0) {
        const primary = existingProduct.productImages.find((img) => img.isPrimary) || existingProduct.productImages[0];
        setPrimaryImageUrl(primary.url);
        setAdditionalImages(existingProduct.productImages.filter((img) => img.id !== primary.id).map((img) => img.url));
      }

      if (existingProduct.specifications && Array.isArray(existingProduct.specifications)) {
        setSpecifications(
          existingProduct.specifications.map((spec) => ({ key: spec.label, value: spec.value }))
        );
      }

      if (existingProduct.variants && existingProduct.variants.length > 0) {
        setHasVariants(true);
        setVariants(
          existingProduct.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            price: v.price,
            stockQuantity: v.stockQuantity,
          }))
        );
      }

      setWarrantyInfo((existingProduct as any).warrantyInfo || '');
      setReturnPolicy((existingProduct as any).returnPolicy || '');
      setShippingWeight((existingProduct as any).shippingWeightKg ?? '');
      setTags((existingProduct as any).tags?.join(', ') || '');
    } else if (!isEditing) {
      setSku(`NEX-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [existingProduct, isEditing]);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing || !slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  // Image management helpers
  const handleAddImageSlot = () => {
    const totalCurrent = 1 + additionalImages.length;
    if (totalCurrent >= MAX_PRODUCT_IMAGES) return;
    setAdditionalImages([...additionalImages, '']);
  };

  const handleUpdateAdditionalImage = (index: number, url: string) => {
    const next = [...additionalImages];
    next[index] = url;
    setAdditionalImages(next);

    const validation = validateProductImageUrl(url);
    setAdditionalErrors((prev) => ({
      ...prev,
      [index]: validation.isValid ? '' : validation.error || 'Invalid URL',
    }));
  };

  const handleRemoveAdditionalImage = (index: number) => {
    const next = additionalImages.filter((_, i) => i !== index);
    setAdditionalImages(next);
    const nextErrors = { ...additionalErrors };
    delete nextErrors[index];
    setAdditionalErrors(nextErrors);
  };

  const handleSetAsPrimary = (index: number) => {
    const targetUrl = additionalImages[index];
    const prevPrimary = primaryImageUrl;
    setPrimaryImageUrl(targetUrl);
    const next = [...additionalImages];
    next[index] = prevPrimary;
    setAdditionalImages(next);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= additionalImages.length) return;
    const next = [...additionalImages];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setAdditionalImages(next);
  };

  // Specification helpers
  const handleAddSpec = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const handleUpdateSpec = (index: number, field: 'key' | 'value', value: string) => {
    const next = [...specifications];
    next[index][field] = value;
    setSpecifications(next);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  // Variant helpers
  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        name: 'Standard Option',
        sku: `${sku}-V${variants.length + 1}`,
        price: Number(price) || 0,
        stockQuantity: 5,
      },
    ]);
  };

  const handleUpdateVariant = (
    index: number,
    field: 'name' | 'sku' | 'price' | 'stockQuantity',
    value: any
  ) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    setVariants(next);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user) {
      setErrorMessage('You must be signed in as an administrator to save products.');
      return;
    }

    if (!isAdmin) {
      setErrorMessage('Access Denied: Product creation and management is strictly restricted to platform administrators.');
      return;
    }

    // Validation
    const cleanPrimary = primaryImageUrl.trim();
    const primaryValidation = validateProductImageUrl(cleanPrimary);
    if (!primaryValidation.isValid) {
      setPrimaryError(primaryValidation.error || 'Invalid primary image URL');
      setErrorMessage(primaryValidation.error || 'Please provide a valid primary product image URL.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }
    if (!sku.trim()) {
      setErrorMessage('SKU is required.');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      setErrorMessage('Please enter a valid price greater than zero.');
      return;
    }
    if (stockQuantity === '' || Number(stockQuantity) < 0) {
      setErrorMessage('Stock quantity cannot be negative.');
      return;
    }

    // Filter valid additional images
    const validAdditionalImages = additionalImages
      .map((img) => img.trim())
      .filter((img) => img.length > 0 && validateProductImageUrl(img).isValid);

    const allImages = [cleanPrimary, ...validAdditionalImages].slice(0, MAX_PRODUCT_IMAGES);

    const formattedImages = allImages.map((url, i) => ({
      id: `img-${i + 1}`,
      url,
      alt: `${name.trim()} - Image ${i + 1}`,
      isPrimary: i === 0,
      order: i,
    }));

    const formattedSpecs = specifications
      .filter((s) => s.key.trim() && s.value.trim())
      .map((s) => ({ label: s.key.trim(), value: s.value.trim() }));

    const formattedVariants = hasVariants && variants.length > 0
      ? variants.map((v, i) => ({
          variantId: `var-${i + 1}-${Date.now().toString(36)}`,
          name: v.name,
          sku: v.sku,
          price: Number(v.price),
          stockQuantity: Number(v.stockQuantity),
          attributes: {},
        }))
      : [];

    const inputData: ProductFormInput = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category,
      subcategory: subcategory.trim() || undefined,
      brand: brand.trim() || 'Nexovira Direct',
      sku: sku.trim().toUpperCase(),
      price: Number(price),
      currency,
      discountPrice: discountPrice !== '' ? Number(discountPrice) : undefined,
      stockQuantity: Number(stockQuantity),
      availabilityStatus,
      productStatus,
      shortDescription: shortDescription.trim() || name.trim(),
      fullDescription: fullDescription.trim() || shortDescription.trim(),
      productImages: formattedImages,
      specifications: formattedSpecs,
      variants: formattedVariants,
    };

    setSubmitting(true);

    try {
      if (isEditing && productId) {
        // Update existing product
        const productRef = doc(db, 'products', productId);
        const updates = normalizeProductUpdatesForFirestore(inputData, existingProduct || undefined);
        updates.updatedAt = serverTimestamp();
        await updateDoc(productRef, updates);

        setSuccessMessage(`Product "${name}" successfully updated.`);
        setTimeout(() => navigate('/management/products'), 1000);
      } else {
        // Create new product
        const newProductId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const sellerId = 'seller-admin';

        const firestoreDoc = normalizeProductForFirestore(newProductId, sellerId, inputData, {
          isPublished: productStatus === 'PUBLISHED',
          timestamps: {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            publishedAt: productStatus === 'PUBLISHED' ? serverTimestamp() : null,
          },
        });

        const productRef = doc(db, 'products', newProductId);
        await setDoc(productRef, firestoreDoc);

        setSuccessMessage(`Product "${name}" successfully published to the marketplace catalog.`);
        setTimeout(() => navigate('/management/products'), 1000);
      }
    } catch (err: unknown) {
      console.error('Error saving product:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchingExisting) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#08E6F9] animate-spin" />
          <p className="text-xs font-mono text-[#CCD2D9]">Loading product configuration...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white py-16 flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-red-500/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold">Administrative Clearance Required</h2>
            <p className="text-sm text-[#CCD2D9]">
              Product creation, uploads, editing, and catalog publishing are strictly restricted to verified platform administrators.
            </p>
            <Button variant="primary" size="md" onClick={() => navigate('/management')}>
              Return to Management Desk
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-8 lg:py-12">
      <Container size="wide">
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/management/products')}
            className="flex items-center gap-2 text-xs font-mono text-[#CCD2D9] hover:text-[#08E6F9] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setGuideModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0682F4]/40 bg-[#011B33] hover:bg-[#0682F4]/20 text-xs font-medium text-[#08E6F9] transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Image URL Guide</span>
          </button>
        </div>

        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isEditing ? `Edit Product: ${existingProduct?.name || 'Loading...'}` : 'Publish New Product'}
          </h1>
          <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">
            Authoritative product publishing desk. All changes are securely registered in the Nexovira catalog.
          </p>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-[#08E6F9]/10 border border-[#08E6F9]/30 text-[#08E6F9] text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Information */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-[#0682F4]/20 pb-4">
              <Package className="w-5 h-5 text-[#08E6F9]" />
              <h2 className="font-bold text-base text-white">1. Basic Details &amp; Identification</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#CCD2D9]">
                    Product Title / Name *
                  </label>
                  <button
                    type="button"
                    onClick={handleAiOptimize}
                    disabled={optimizing}
                    className="flex items-center gap-1.5 text-xs text-[#08E6F9] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{optimizing ? 'Optimizing copy...' : 'AI Enhance Title & Description'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. UltraClear 55-inch Smart OLED AI Hub TV"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                />
                {aiNotice && (
                  <p className="text-xs text-[#08E6F9] font-mono mt-1">{aiNotice}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">URL Slug (SEO Permalink) *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ultraclear-55-smart-oled"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Nexovira Horizon"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Primary Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Subcategory (Optional)</label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. Televisions, Laptops, Audio"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">SKU / Inventory Identifier *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="NEX-001-TV"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono text-xs uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Catalog Publication Status *</label>
                <select
                  value={productStatus}
                  onChange={(e) => setProductStatus(e.target.value as ProductStatus)}
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                >
                  <option value="PUBLISHED">PUBLISHED (Live on Marketplace)</option>
                  <option value="DRAFT">DRAFT (Hidden from Buyers)</option>
                  <option value="ARCHIVED">ARCHIVED (Decommissioned)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-[#0682F4]/20 pb-4">
              <DollarSign className="w-5 h-5 text-[#08E6F9]" />
              <h2 className="font-bold text-base text-white">2. Pricing, Currency &amp; Stock Levels</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Currency Code *</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                >
                  <option value="NGN">NGN (Nigerian Naira ₦)</option>
                  <option value="USD">USD (US Dollar $)</option>
                  <option value="GBP">GBP (British Pound £)</option>
                  <option value="EUR">EUR (Euro €)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Regular Price *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 750000"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Promotional Discount Price</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="Leave empty if regular"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Available Stock Quantity *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="10"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-mono text-[#CCD2D9]">Stock Status Indicator *</label>
                <select
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as ProductAvailability)}
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                >
                  <option value="IN_STOCK">IN STOCK (Available immediately)</option>
                  <option value="LOW_STOCK">LOW STOCK (Limited inventory banner)</option>
                  <option value="OUT_OF_STOCK">OUT OF STOCK (Display but disable cart)</option>
                  <option value="BACKORDER">BACKORDER (Accept advance orders)</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Visual Imagery */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#08E6F9]" />
                <h2 className="font-bold text-base text-white">3. Product Gallery &amp; Visuals</h2>
              </div>
              <span className="text-xs font-mono text-[#CCD2D9]">
                {1 + additionalImages.length} / {MAX_PRODUCT_IMAGES} slots used
              </span>
            </div>

            {/* Quick Presets */}
            <div className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-2">
              <span className="text-[11px] font-mono text-[#CCD2D9]/80 block">Quick studio assets:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Smart TV', url: tvImg },
                  { name: 'Laptop', url: laptopImg },
                  { name: 'Smart Fridge', url: fridgeImg },
                  { name: 'Headphones', url: headphonesImg },
                  { name: 'Mesh Hub', url: meshHubImg },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setPrimaryImageUrl(item.url);
                      setPrimaryError(null);
                    }}
                    className="px-2.5 py-1 rounded bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-xs text-[#CCD2D9] hover:text-white transition cursor-pointer"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Image Slot */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-[#CCD2D9] flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-[#08E6F9]" />
                <span>Primary Cover Image URL *</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  required
                  value={primaryImageUrl}
                  onChange={(e) => {
                    setPrimaryImageUrl(e.target.value);
                    const val = validateProductImageUrl(e.target.value);
                    setPrimaryError(val.isValid ? null : val.error || 'Invalid URL');
                  }}
                  placeholder="https://res.cloudinary.com/... or /assets/images/..."
                  className={`flex-1 bg-[#01213D] text-white text-xs px-4 py-2.5 rounded-lg border font-mono focus:outline-none ${
                    primaryError ? 'border-red-500' : 'border-[#0682F4]/30 focus:border-[#08E6F9]'
                  }`}
                />
                <div className="w-12 h-10 rounded-lg bg-[#01213D] border border-[#0682F4]/30 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={primaryImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
              {primaryError && <p className="text-xs text-red-400 font-mono">{primaryError}</p>}
            </div>

            {/* Additional Images List */}
            {additionalImages.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono text-[#CCD2D9] block">
                  Additional Gallery Images:
                </span>
                {additionalImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 flex items-center gap-3"
                  >
                    <span className="w-5 text-center text-xs font-mono text-[#08E6F9]">{idx + 2}</span>
                    <input
                      type="text"
                      value={imgUrl}
                      onChange={(e) => handleUpdateAdditionalImage(idx, e.target.value)}
                      placeholder="https://res.cloudinary.com/..."
                      className="flex-1 bg-[#011B33] text-white text-xs px-3 py-2 rounded border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                    />
                    <div className="w-10 h-8 rounded bg-[#011B33] border border-[#0682F4]/20 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={imgUrl}
                        alt={`Additional ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetAsPrimary(idx)}
                        className="p-1.5 rounded hover:bg-[#0682F4]/20 text-[#CCD2D9] hover:text-[#08E6F9] transition cursor-pointer"
                        title="Set as Primary Image"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveImage(idx, 'up')}
                        className="p-1.5 rounded hover:bg-[#0682F4]/20 text-[#CCD2D9] hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === additionalImages.length - 1}
                        onClick={() => handleMoveImage(idx, 'down')}
                        className="p-1.5 rounded hover:bg-[#0682F4]/20 text-[#CCD2D9] hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdditionalImage(idx)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {1 + additionalImages.length < MAX_PRODUCT_IMAGES && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddImageSlot}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Gallery Image</span>
              </Button>
            )}
          </div>

          {/* Section 4: Descriptions & Specifications */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-[#0682F4]/20 pb-4">
              <Layers className="w-5 h-5 text-[#08E6F9]" />
              <h2 className="font-bold text-base text-white">4. Descriptions &amp; Technical Specs</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Short Summary / Excerpt *</label>
                <input
                  type="text"
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One sentence summary for listing cards and search previews..."
                  maxLength={250}
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Comprehensive Full Description *</label>
                <textarea
                  required
                  rows={5}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Provide detailed hardware specifications, capabilities, box contents, and compatibility..."
                  className="w-full bg-[#01213D] text-white text-sm p-4 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none resize-y"
                />
              </div>

              {/* Specifications Key-Value Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#CCD2D9]">
                    Key Technical Specifications:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="text-xs text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Specification</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {specifications.map((spec, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleUpdateSpec(i, 'key', e.target.value)}
                        placeholder="e.g. Resolution, Weight, Processor"
                        className="w-1/3 bg-[#01213D] text-white text-xs px-3 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleUpdateSpec(i, 'value', e.target.value)}
                        placeholder="e.g. 4K UHD 3840x2160, 120Hz"
                        className="flex-1 bg-[#01213D] text-white text-xs px-3 py-2 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(i)}
                        className="p-2 text-red-400 hover:text-red-300 transition cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Logistics & Metadata */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-[#0682F4]/20 pb-4">
              <Boxes className="w-5 h-5 text-[#08E6F9]" />
              <h2 className="font-bold text-base text-white">5. Warranty, Returns &amp; Search Tags</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Warranty Terms</label>
                <input
                  type="text"
                  value={warrantyInfo}
                  onChange={(e) => setWarrantyInfo(e.target.value)}
                  placeholder="e.g. 1 Year Manufacturer Direct"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Return Policy</label>
                <input
                  type="text"
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                  placeholder="e.g. 7 Days Replacement for Factory Defect"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Shipping Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={shippingWeight}
                  onChange={(e) => setShippingWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="1.5"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CCD2D9]">Search Tags (Comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="oled, smart tv, wireless, computing"
                  className="w-full bg-[#01213D] text-white text-sm px-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#0682F4]/20">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate('/management/products')}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              className="px-8 shadow-lg shadow-[#0682F4]/30"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to Catalog...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Save Product Changes' : 'Publish Product to Catalog'}</span>
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Cloudinary Media Guide Modal */}
        {guideModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl">
              <CloudinaryMediaGuide onClose={() => setGuideModalOpen(false)} />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};
