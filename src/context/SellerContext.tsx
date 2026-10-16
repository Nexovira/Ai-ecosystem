import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useMarketplace } from './MarketplaceContext';
import { Product } from '../types/marketplace';
import { SellerApplication, SellerProfile, ProductFormInput, SellerVerificationStatus } from '../types/seller';

interface SellerContextType {
  sellerProfile: SellerProfile | null;
  sellerApplication: SellerApplication | null;
  sellerProducts: Product[];
  loadingSeller: boolean;
  isVerifiedSeller: boolean;
  
  // Application Actions
  submitSellerApplication: (
    formData: Omit<SellerApplication, 'applicationId' | 'userId' | 'status' | 'submittedAt' | 'updatedAt'>
  ) => Promise<{ success: boolean; error?: string }>;
  
  // Product Management Actions (Scoped strictly to authenticated seller)
  createProduct: (data: ProductFormInput) => Promise<{ success: boolean; productId?: string; error?: string }>;
  updateProduct: (productId: string, data: Partial<ProductFormInput>) => Promise<{ success: boolean; error?: string }>;
  archiveProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  updateStock: (productId: string, newStock: number) => Promise<{ success: boolean; error?: string }>;
  
  // Profile Management
  updateProfileDetails: (data: {
    businessName?: string;
    businessDescription?: string;
    businessLocation?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    contactPhone?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  // Admin / Dev Approval Capability for test review
  adminApproveApplication: (targetUserId: string, businessName: string) => Promise<{ success: boolean; error?: string }>;

  // Fetch Public Seller by Slug
  getPublicSellerBySlug: (slug: string) => Promise<SellerProfile | null>;
  getProductsBySeller: (sellerId: string) => Product[];
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

export const SellerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { products } = useMarketplace();

  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [sellerApplication, setSellerApplication] = useState<SellerApplication | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loadingSeller, setLoadingSeller] = useState<boolean>(true);

  const isVerifiedSeller = Boolean(
    (profile?.role === 'SELLER' || profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN') &&
    (sellerProfile?.verificationStatus === 'VERIFIED' || profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN')
  );

  // Load current seller application and profile
  const refreshSellerData = useCallback(async () => {
    if (!user || !user.uid) {
      setSellerProfile(null);
      setSellerApplication(null);
      setSellerProducts([]);
      setLoadingSeller(false);
      return;
    }

    setLoadingSeller(true);
    const uid = user.uid;

    try {
      // 1. Fetch application
      const appRef = doc(db, 'sellerApplications', uid);
      const appSnap = await getDoc(appRef);
      if (appSnap.exists()) {
        setSellerApplication(appSnap.data() as SellerApplication);
      } else {
        setSellerApplication(null);
      }

      // 2. Fetch seller profile
      const sellerId = `seller-${uid}`;
      const profileRef = doc(db, 'sellers', sellerId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setSellerProfile(profileSnap.data() as SellerProfile);
      } else if (profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN') {
        // Auto-provision an official verified store profile for administrator
        const adminProfile: SellerProfile = {
          sellerId,
          userId: uid,
          businessName: 'Nexovira Direct Official Store',
          slug: 'nexovira-official-store',
          businessDescription: 'Direct flagship repository for certified hardware and appliances within the Nexovira ecosystem.',
          businessLocation: 'Lagos, Nigeria & Global Nodes',
          contactEmail: user.email || 'nexoviratech@gmail.com',
          categories: ['Appliances', 'Electronics', 'Computing & Accessories', 'Home Technology'],
          verificationStatus: 'VERIFIED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(profileRef, adminProfile);
        setSellerProfile(adminProfile);
      } else {
        setSellerProfile(null);
      }

      // 3. Fetch seller's own products from Firestore
      const productsQuery = query(
        collection(db, 'products'),
        where('sellerId', 'in', [uid, sellerId])
      );
      const prodSnap = await getDocs(productsQuery);
      const ownProds: Product[] = [];
      prodSnap.forEach((d) => ownProds.push(d.data() as Product));
      
      // Also merge any in-memory initial catalog products matching the seller
      const initialMatches = products.filter(
        (p) => p.sellerId === uid || p.sellerId === sellerId || (profile?.role === 'ADMIN' && p.sellerId === 'nexovira-official-store')
      );
      
      const combined = [...ownProds];
      initialMatches.forEach((p) => {
        if (!combined.some((c) => c.productId === p.productId)) {
          combined.push(p);
        }
      });

      setSellerProducts(combined);
    } catch (err) {
      console.warn('Seller data load notification:', err);
    } finally {
      setLoadingSeller(false);
    }
  }, [user, profile, products]);

  useEffect(() => {
    refreshSellerData();
  }, [refreshSellerData]);

  // Submit Seller Application
  const submitSellerApplication = async (
    formData: Omit<SellerApplication, 'applicationId' | 'userId' | 'status' | 'submittedAt' | 'updatedAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !user.uid) {
      return { success: false, error: 'Authentication required to apply.' };
    }

    try {
      const uid = user.uid;
      const appRef = doc(db, 'sellerApplications', uid);
      const newApp = {
        ...formData,
        applicationId: uid,
        userId: uid,
        status: 'PENDING_REVIEW' as SellerVerificationStatus,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(appRef, newApp);

      setSellerApplication({
        ...formData,
        applicationId: uid,
        userId: uid,
        status: 'PENDING_REVIEW',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to submit seller application.',
      };
    }
  };

  // Create Product (Scoped to seller)
  const createProduct = async (
    data: ProductFormInput
  ): Promise<{ success: boolean; productId?: string; error?: string }> => {
    if (!user || !user.uid) {
      return { success: false, error: 'Authentication required.' };
    }
    if (!isVerifiedSeller) {
      return { success: false, error: 'Only verified merchants can publish products to the marketplace.' };
    }

    // Backend price and stock validation
    if (data.price <= 0) {
      return { success: false, error: 'Price must be a positive numerical amount.' };
    }
    if (data.stockQuantity < 0) {
      return { success: false, error: 'Stock quantity cannot be negative.' };
    }

    try {
      const productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const sellerId = sellerProfile?.sellerId || user.uid;

      const newProductDoc: Product = {
        productId,
        sellerId,
        name: data.name.trim(),
        slug: data.slug.trim() || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: data.category,
        subcategory: data.subcategory,
        brand: data.brand.trim(),
        sku: data.sku.trim(),
        price: Number(data.price),
        currency: data.currency || 'NGN',
        discountPrice: data.discountPrice ? Number(data.discountPrice) : undefined,
        stockQuantity: Number(data.stockQuantity),
        availabilityStatus: data.availabilityStatus,
        productStatus: data.productStatus,
        shortDescription: data.shortDescription.trim(),
        fullDescription: data.fullDescription.trim(),
        productImages: data.productImages,
        specifications: data.specifications,
        variants: data.variants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: data.productStatus === 'PUBLISHED' ? new Date().toISOString() : undefined,
      };

      const productRef = doc(db, 'products', productId);
      await setDoc(productRef, {
        ...newProductDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: data.productStatus === 'PUBLISHED' ? serverTimestamp() : null,
      });

      setSellerProducts((prev) => [newProductDoc, ...prev]);
      return { success: true, productId };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Product creation failed.',
      };
    }
  };

  // Update Product (Strict ownership check)
  const updateProduct = async (
    productId: string,
    data: Partial<ProductFormInput>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !user.uid) return { success: false, error: 'Authentication required.' };

    const existingProduct = sellerProducts.find((p) => p.productId === productId);
    if (!existingProduct) {
      return { success: false, error: 'Product not found in your inventory.' };
    }

    if (data.price !== undefined && data.price <= 0) {
      return { success: false, error: 'Price must be a positive value.' };
    }
    if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
      return { success: false, error: 'Stock quantity cannot be negative.' };
    }

    try {
      const productRef = doc(db, 'products', productId);
      const updates: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (data.name) updates.name = data.name.trim();
      if (data.brand) updates.brand = data.brand.trim();
      if (data.category) updates.category = data.category;
      if (data.price !== undefined) updates.price = Number(data.price);
      if (data.discountPrice !== undefined) updates.discountPrice = Number(data.discountPrice);
      if (data.stockQuantity !== undefined) updates.stockQuantity = Number(data.stockQuantity);
      if (data.availabilityStatus) updates.availabilityStatus = data.availabilityStatus;
      if (data.productStatus) updates.productStatus = data.productStatus;
      if (data.shortDescription) updates.shortDescription = data.shortDescription;
      if (data.fullDescription) updates.fullDescription = data.fullDescription;
      if (data.productImages) updates.productImages = data.productImages;
      if (data.specifications) updates.specifications = data.specifications;
      if (data.variants) updates.variants = data.variants;

      await updateDoc(productRef, updates);

      setSellerProducts((prev) =>
        prev.map((p) => (p.productId === productId ? ({ ...p, ...data, updatedAt: new Date().toISOString() } as Product) : p))
      );

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Product update failed.',
      };
    }
  };

  // Archive Product (Removes from active marketplace)
  const archiveProduct = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    return updateProduct(productId, { productStatus: 'ARCHIVED', availabilityStatus: 'UNAVAILABLE' });
  };

  // Delete Product
  const deleteProduct = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !user.uid) return { success: false, error: 'Authentication required.' };

    try {
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);
      setSellerProducts((prev) => prev.filter((p) => p.productId !== productId));
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Deletion failed.',
      };
    }
  };

  // Update Inventory Stock directly
  const updateStock = async (productId: string, newStock: number): Promise<{ success: boolean; error?: string }> => {
    if (newStock < 0) {
      return { success: false, error: 'Stock quantity cannot be less than zero.' };
    }
    const availability: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' =
      newStock === 0 ? 'OUT_OF_STOCK' : newStock <= 5 ? 'LOW_STOCK' : 'IN_STOCK';

    return updateProduct(productId, {
      stockQuantity: newStock,
      availabilityStatus: availability,
    });
  };

  // Update Seller Profile
  const updateProfileDetails = async (data: {
    businessName?: string;
    businessDescription?: string;
    businessLocation?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    contactPhone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user || !sellerProfile) {
      return { success: false, error: 'Verified seller profile not found.' };
    }

    try {
      const profileRef = doc(db, 'sellers', sellerProfile.sellerId);
      const updates = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(profileRef, updates);

      setSellerProfile((prev) => (prev ? { ...prev, ...data, updatedAt: new Date().toISOString() } : null));
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update merchant profile.',
      };
    }
  };

  // Admin approval helper for verification review
  const adminApproveApplication = async (
    targetUserId: string,
    businessName: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || (profile?.role !== 'ADMIN' && profile?.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized: Administrative role required.' };
    }

    try {
      const now = new Date().toISOString();
      // 1. Update application status
      const appRef = doc(db, 'sellerApplications', targetUserId);
      await updateDoc(appRef, {
        status: 'VERIFIED',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reviewNotes: 'Approved by Nexovira Merchant Review Committee.',
      });

      // 2. Create Seller Profile
      const sellerId = `seller-${targetUserId}`;
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const profileRef = doc(db, 'sellers', sellerId);
      const newProfile: SellerProfile = {
        sellerId,
        userId: targetUserId,
        businessName,
        slug,
        businessDescription: 'Authorized verified merchant on the Nexovira technology marketplace.',
        businessLocation: 'Verified Operating Location',
        contactEmail: '',
        categories: ['Appliances', 'Electronics', 'Computing & Accessories'],
        verificationStatus: 'VERIFIED',
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(profileRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Upgrade user role in Users collection
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, {
        role: 'SELLER',
        updatedAt: serverTimestamp(),
      });

      await refreshSellerData();
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Administrative approval failed.',
      };
    }
  };

  // Public Seller Lookup
  const getPublicSellerBySlug = useCallback(
    async (slug: string): Promise<SellerProfile | null> => {
      try {
        const sellersCol = collection(db, 'sellers');
        const q = query(
          sellersCol,
          where('slug', '==', slug),
          where('verificationStatus', '==', 'VERIFIED')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs[0].data() as SellerProfile;
        }
      } catch (err) {
        console.warn('Seller store fetch error:', err);
      }
      return null;
    },
    []
  );

  const getProductsBySeller = useCallback(
    (sellerId: string): Product[] => {
      return products.filter((p) => p.sellerId === sellerId && p.productStatus === 'PUBLISHED');
    },
    [products]
  );

  return (
    <SellerContext.Provider
      value={{
        sellerProfile,
        sellerApplication,
        sellerProducts,
        loadingSeller,
        isVerifiedSeller,
        submitSellerApplication,
        createProduct,
        updateProduct,
        archiveProduct,
        deleteProduct,
        updateStock,
        updateProfileDetails,
        adminApproveApplication,
        getPublicSellerBySlug,
        getProductsBySeller,
      }}
    >
      {children}
    </SellerContext.Provider>
  );
};

export const useSeller = (): SellerContextType => {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error('useSeller must be used within a SellerProvider');
  }
  return context;
};
