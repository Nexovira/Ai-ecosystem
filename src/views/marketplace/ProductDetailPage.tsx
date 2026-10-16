import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  Shield,
  Truck,
  RotateCcw,
  Share2,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { MarketplaceHeader } from '../../components/marketplace/MarketplaceHeader';
import { ProductCard } from '../../components/marketplace/ProductCard';
import { CartDrawer } from '../../components/marketplace/CartDrawer';
import { WishlistModal } from '../../components/marketplace/WishlistModal';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';
import { ReviewsSection } from '../../components/reviews/ReviewsSection';

interface ProductDetailPageProps {
  slug: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug }) => {
  const {
    getProductBySlug,
    getRelatedProducts,
    addToCart,
    toggleWishlist,
    isWishlisted,
    formatPrice,
  } = useMarketplace();

  const { navigate } = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [copiedLink, setCopiedLink] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);

  const product = getProductBySlug(slug);

  // Dynamic SEO Page Title
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Nexovira Marketplace`;
    } else {
      document.title = 'Product Not Found | Nexovira Marketplace';
    }
  }, [product]);

  // Product not found state
  if (!product) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white flex flex-col">
        <MarketplaceHeader
          onOpenCart={() => setCartDrawerOpen(true)}
          onOpenWishlist={() => setWishlistModalOpen(true)}
        />
        <div className="flex-1 flex items-center justify-center py-24">
          <Container size="narrow">
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-10 text-center space-y-6 max-w-md mx-auto shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-[#01213D] border border-[#0682F4]/40 flex items-center justify-center text-red-400 mx-auto">
                <XCircle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display font-bold text-2xl text-white">
                  Product Unavailable
                </h2>
                <p className="text-xs sm:text-sm text-[#CCD2D9] leading-relaxed">
                  The requested hardware item could not be located in the current Nexovira catalog. It may have been retired or moved.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/marketplace')}
              >
                <span>Return to Marketplace</span>
              </Button>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.productId);
  const relatedProducts = getRelatedProducts(product, 3);
  const isAvailable = product.availabilityStatus === 'IN_STOCK' || product.availabilityStatus === 'LOW_STOCK';

  const images = product.productImages && product.productImages.length > 0
    ? product.productImages
    : [{ id: 'default', url: '', alt: product.name, isPrimary: true, order: 1 }];

  const activeImage = images[selectedImageIndex] || images[0];

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(product, quantity, selectedVariantId);
    setCartDrawerOpen(true);
  };

  const handleCopyShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const discountPercent =
    product.discountPrice && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : null;

  return (
    <div className="min-h-screen bg-[#01213D] text-white flex flex-col">
      {/* Marketplace Header */}
      <MarketplaceHeader
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenWishlist={() => setWishlistModalOpen(true)}
      />

      <main className="flex-1 py-10 sm:py-14">
        <Container size="wide">
          
          {/* Back Breadcrumb */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate('/marketplace')}
              className="inline-flex items-center gap-1.5 text-xs text-[#CCD2D9] hover:text-[#08E6F9] transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#08E6F9]" />
              <span>Back to Marketplace</span>
            </button>

            <button
              onClick={handleCopyShare}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#CCD2D9] hover:text-[#08E6F9] transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#08E6F9]" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Product'}</span>
            </button>
          </div>

          {/* Core Product Layout (Two Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Left Column: Image Gallery */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main Feature Image */}
              <div className="aspect-[4/3] rounded-2xl bg-[#011B33] border border-[#0682F4]/30 overflow-hidden relative shadow-2xl">
                {activeImage.url ? (
                  <img
                    src={activeImage.url}
                    alt={activeImage.alt || product.name}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono text-sm text-[#CCD2D9]/40">
                    Product Imagery
                  </div>
                )}

                {/* Discount Badge */}
                {discountPercent && (
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-[#0682F4] text-white font-mono font-bold text-xs shadow-md">
                    -{discountPercent}% Discount
                  </div>
                )}
              </div>

              {/* Thumbnails (if multiple images) */}
              {images.length > 1 && (
                <div className="flex gap-3">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-20 h-16 rounded-xl bg-[#011B33] border overflow-hidden transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-[#08E6F9] ring-2 ring-[#08E6F9]/30'
                          : 'border-[#0682F4]/20 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Product Purchasing & Specs */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Brand & Category */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-[#CCD2D9]/80">
                  <span className="text-[#08E6F9] font-semibold">{product.brand}</span>
                  <span aria-hidden="true" className="text-[#0682F4]/40">/</span>
                  <span>{product.category}</span>
                  {product.subcategory && (
                    <>
                      <span aria-hidden="true" className="text-[#0682F4]/40">/</span>
                      <span>{product.subcategory}</span>
                    </>
                  )}
                </div>

                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                  {product.name}
                </h1>
              </div>

              {/* Pricing Section */}
              <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/20 space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                    {formatPrice(product.discountPrice ?? product.price, product.currency)}
                  </span>
                  {product.discountPrice && (
                    <span className="font-mono text-sm text-[#CCD2D9]/50 line-through">
                      {formatPrice(product.price, product.currency)}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-[#08E6F9]">
                  Immutable Currency Code: {product.currency} · Numerical Value Stored Independently
                </div>
              </div>

              {/* Availability Indicator */}
              <div className="flex items-center gap-2 text-xs font-mono">
                {product.availabilityStatus === 'IN_STOCK' && (
                  <span className="text-[#08E6F9] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>In Stock ({product.stockQuantity} units available)</span>
                  </span>
                )}
                {product.availabilityStatus === 'LOW_STOCK' && (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Low Stock Remaining ({product.stockQuantity} units)</span>
                  </span>
                )}
                {(product.availabilityStatus === 'OUT_OF_STOCK' || product.availabilityStatus === 'UNAVAILABLE') && (
                  <span className="text-red-400 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    <span>Currently Unavailable</span>
                  </span>
                )}
              </div>

              {/* Variants Selector (if product has variants) */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CCD2D9]/80">
                    Select Variant / Configuration:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariantId === v.variantId;
                      return (
                        <button
                          key={v.variantId}
                          type="button"
                          onClick={() => setSelectedVariantId(v.variantId)}
                          className={`p-2.5 rounded-lg text-xs font-mono text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0682F4]/20 border-[#08E6F9] text-white font-bold'
                              : 'bg-[#011B33] border-[#0682F4]/20 text-[#CCD2D9] hover:border-[#08E6F9]/40'
                          }`}
                        >
                          <div className="font-semibold">{v.name}</div>
                          <div className="text-[#08E6F9] text-[10px]">{formatPrice(v.price, product.currency)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Short Description */}
              <p className="text-xs sm:text-sm text-[#CCD2D9] leading-relaxed">
                {product.shortDescription}
              </p>

              {/* Quantity Selector & Add to Cart */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-[#011B33] border border-[#0682F4]/30 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || !isAvailable}
                      className="p-1.5 text-[#CCD2D9] hover:text-white disabled:opacity-30 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-mono text-sm font-bold text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      disabled={quantity >= product.stockQuantity || !isAvailable}
                      className="p-1.5 text-[#CCD2D9] hover:text-white disabled:opacity-30 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    disabled={!isAvailable}
                    onClick={handleAddToCart}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isAvailable ? 'Add to Cart' : 'Item Unavailable'}</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.productId)}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      wishlisted
                        ? 'bg-[#01213D] border-[#08E6F9] text-[#08E6F9]'
                        : 'bg-[#011B33] border-[#0682F4]/30 text-[#CCD2D9] hover:text-[#08E6F9]'
                    }`}
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className={`w-4 h-4 ${wishlisted ? 'fill-[#08E6F9]' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Seller & Verification Metadata Card */}
              <div className="p-4 rounded-xl bg-[#011B33] border border-[#0682F4]/20 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#0682F4]/15 font-mono">
                  <span className="text-[#CCD2D9]/70">SKU Code</span>
                  <span className="text-white font-semibold">{product.sku}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-[#0682F4]/15 font-mono">
                  <span className="text-[#CCD2D9]/70">Verified Merchant</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (product.sellerId === 'nexovira-official-store') {
                        navigate('/seller/store/nexovira-official-store');
                      } else {
                        navigate(`/seller/store/${product.sellerId.replace(/^seller-/, '')}`);
                      }
                    }}
                    className="text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer font-medium text-right max-w-[200px] truncate"
                  >
                    <span className="truncate">{product.sellerId === 'nexovira-official-store' ? 'Nexovira Direct Official' : product.sellerId}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </button>
                </div>

                <div className="flex items-start gap-2.5 text-[11px] text-[#CCD2D9]/80 pt-1">
                  <Shield className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>
                    Direct manufacturer or verified merchant fulfillment with genuine brand warranty.
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Full Description & Specifications Section */}
          <div className="mt-16 pt-12 border-t border-[#0682F4]/20 grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Description */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-display font-bold text-xl text-white">
                Detailed Product Overview
              </h3>
              <p className="text-sm text-[#CCD2D9] leading-relaxed whitespace-pre-line font-normal">
                {product.fullDescription}
              </p>
            </div>

            {/* Specifications Table */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="font-display font-bold text-xl text-white">
                Technical Specifications
              </h3>
              <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {product.specifications.map((spec, index) => (
                      <tr
                        key={spec.label}
                        className={index % 2 === 0 ? 'bg-[#01213D]/60' : 'bg-[#011B33]'}
                      >
                        <td className="py-2.5 px-4 font-mono font-medium text-[#CCD2D9]/70 border-b border-[#0682F4]/10 w-2/5">
                          {spec.label}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-white border-b border-[#0682F4]/10">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Verified Customer Reviews & Ratings Section */}
          <ReviewsSection
            entityType="PRODUCT"
            entityId={product.productId}
            entityTitle={product.name}
            sellerId={product.sellerId}
            className="mt-16"
          />

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-20 pt-12 border-t border-[#0682F4]/20 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-[#08E6F9] block">
                    Similar Equipment
                  </span>
                  <h3 className="font-display font-bold text-xl text-white">
                    Related Products
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="text-xs text-[#08E6F9] hover:underline font-mono"
                >
                  View All Products →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((rel) => (
                  <ProductCard key={rel.productId} product={rel} />
                ))}
              </div>
            </div>
          )}

        </Container>
      </main>

      {/* Cart Drawer & Wishlist Modal */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
      />

      <WishlistModal
        isOpen={wishlistModalOpen}
        onClose={() => setWishlistModalOpen(false)}
        onOpenSignIn={() => navigate('/signin')}
      />
    </div>
  );
};
