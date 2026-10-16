import React, { useState, useEffect } from 'react';
import { Building, MapPin, ShieldCheck, ArrowLeft, Package, ExternalLink } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { ProductCard } from '../../components/marketplace/ProductCard';
import { CartDrawer } from '../../components/marketplace/CartDrawer';
import { WishlistModal } from '../../components/marketplace/WishlistModal';
import { useSeller } from '../../context/SellerContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useRouter } from '../../context/RouterContext';
import { SellerProfile } from '../../types/seller';

interface SellerStorePageProps {
  slug: string;
}

export const SellerStorePage: React.FC<SellerStorePageProps> = ({ slug }) => {
  const { getPublicSellerBySlug, getProductsBySeller } = useSeller();
  const { products } = useMarketplace();
  const { navigate } = useRouter();

  const [store, setStore] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);

  useEffect(() => {
    async function loadStore() {
      setLoading(true);
      const res = await getPublicSellerBySlug(slug);
      setStore(res);
      setLoading(false);
    }
    loadStore();
  }, [slug, getPublicSellerBySlug]);

  if (loading) {
    return (
      <div className="py-24 bg-[#01213D] min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0682F4] border-t-[#08E6F9] rounded-full animate-spin" />
      </div>
    );
  }

  // Not verified or not found
  if (!store || store.verificationStatus !== 'VERIFIED') {
    return (
      <div className="py-24 bg-[#01213D] min-h-[75vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-10 text-center max-w-md mx-auto space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#01213D] border border-neutral-700 flex items-center justify-center text-[#CCD2D9]/40 mx-auto">
              <Building className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display font-bold text-2xl text-white">
                Storefront Unavailable
              </h2>
              <p className="text-xs sm:text-sm text-[#CCD2D9] leading-relaxed">
                The requested merchant storefront does not exist or has not yet completed credential verification.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => navigate('/marketplace')}>
              <span>Return to Marketplace</span>
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const storeProducts = getProductsBySeller(store.sellerId);

  return (
    <div className="min-h-screen bg-[#01213D] text-white flex flex-col">
      {/* Top Banner / Store Header */}
      <div className="border-b border-[#0682F4]/20 bg-gradient-to-b from-[#011B33] to-[#01213D] py-12 sm:py-16 relative">
        <Container size="wide">
          
          <button
            onClick={() => navigate('/marketplace')}
            className="inline-flex items-center gap-1.5 text-xs text-[#CCD2D9] hover:text-[#08E6F9] transition-colors mb-6 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#08E6F9]" />
            <span>Back to Marketplace</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#01213D] border border-[#08E6F9]/40 flex items-center justify-center font-display font-bold text-2xl text-[#08E6F9] shadow-xl overflow-hidden shrink-0">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.businessName} className="w-full h-full object-cover" />
                ) : (
                  store.businessName.substring(0, 2).toUpperCase()
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                    {store.businessName}
                  </h1>
                  <span className="p-1 rounded bg-[#0682F4]/20 text-[#08E6F9]" title="Verified Merchant">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-[#CCD2D9]/70">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0682F4]" />
                    <span>{store.businessLocation || 'Global Verified Node'}</span>
                  </span>
                  <span>·</span>
                  <span className="text-[#08E6F9]">Authorized Nexovira Merchant</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#011B33] border border-[#0682F4]/20 text-xs text-right font-mono">
              <div className="text-white font-bold">{storeProducts.length} Hardware Listings</div>
              <div className="text-[#08E6F9]">Genuine Warranty Guaranteed</div>
            </div>
          </div>

          {store.businessDescription && (
            <p className="mt-6 text-xs sm:text-sm text-[#CCD2D9] max-w-3xl leading-relaxed">
              {store.businessDescription}
            </p>
          )}

        </Container>
      </div>

      {/* Store Products Catalog */}
      <main className="flex-1 py-10 sm:py-14">
        <Container size="wide">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/15">
              <h2 className="font-display font-bold text-lg text-white">
                Store Catalog ({storeProducts.length} Items)
              </h2>
            </div>

            {storeProducts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Package className="w-10 h-10 text-[#CCD2D9]/30 mx-auto" />
                <p className="text-sm text-[#CCD2D9]/70">
                  This merchant does not currently have active public listings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {storeProducts.map((p) => (
                  <ProductCard key={p.productId} product={p} />
                ))}
              </div>
            )}
          </div>
        </Container>
      </main>

      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
      <WishlistModal isOpen={wishlistModalOpen} onClose={() => setWishlistModalOpen(false)} onOpenSignIn={() => navigate('/signin')} />
    </div>
  );
};
