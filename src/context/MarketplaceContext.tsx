import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Product,
  Category,
  CartItem,
  WishlistItem,
  MarketplaceFilterState,
  MarketplaceSortOption,
} from '../types/marketplace';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/marketplaceCatalog';

interface MarketplaceContextType {
  products: Product[];
  categories: Category[];
  loadingProducts: boolean;
  filters: MarketplaceFilterState;
  setFilters: React.Dispatch<React.SetStateAction<MarketplaceFilterState>>;
  resetFilters: () => void;
  filteredProducts: Product[];
  getProductBySlug: (slug: string) => Product | undefined;
  getRelatedProducts: (currentProduct: Product, limit?: number) => Product[];
  
  // Cart state and actions
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (product: Product, quantity?: number, variantId?: string) => { success: boolean; message?: string };
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Wishlist state and actions
  wishlist: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => { success: boolean; requiresAuth?: boolean };

  // Currency helper
  formatPrice: (amount: number, currency?: string) => string;

  // Category management & catalog sync
  refreshCatalog: () => Promise<void>;
  addCategory: (categoryData: Partial<Category>) => Promise<{ success: boolean; category?: Category; error?: string }>;
  updateCategory: (categoryId: string, updates: Partial<Category>) => Promise<{ success: boolean; category?: Category; error?: string }>;
  deleteCategory: (categoryId: string) => Promise<{ success: boolean; error?: string; inUseCount?: number }>;
}

const DEFAULT_FILTERS: MarketplaceFilterState = {
  category: '',
  brand: '',
  minPrice: null,
  maxPrice: null,
  availability: '',
  searchQuery: '',
  sortBy: 'relevance',
  page: 1,
};

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [filters, setFilters] = useState<MarketplaceFilterState>(DEFAULT_FILTERS);

  // Cart and Wishlist
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexo_cart');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexo_wishlist');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const refreshCatalog = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const productsCol = collection(db, 'products');
      const prodSnap = await getDocs(query(productsCol, where('productStatus', '==', 'PUBLISHED')));

      if (!prodSnap.empty) {
        const loadedProducts: Product[] = [];
        prodSnap.forEach((d) => {
          loadedProducts.push(d.data() as Product);
        });
        setProducts(loadedProducts);
      } else {
        setProducts(INITIAL_PRODUCTS);
      }

      // Categories
      const catCol = collection(db, 'categories');
      const catSnap = await getDocs(catCol);
      if (!catSnap.empty) {
        const loadedCats: Category[] = [];
        catSnap.forEach((d) => {
          loadedCats.push(d.data() as Category);
        });
        loadedCats.sort((a, b) => a.order - b.order);
        setCategories(loadedCats);
      } else {
        setCategories(INITIAL_CATEGORIES);
      }
    } catch (err) {
      console.warn('Marketplace using verified local catalog fallback:', err);
      setProducts(INITIAL_PRODUCTS);
      setCategories(INITIAL_CATEGORIES);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const addCategory = useCallback(
    async (data: Partial<Category>) => {
      try {
        const res = await fetch('/api/management/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.uid || '',
            'x-user-role': profile?.role || '',
            'x-user-email': user?.email || '',
          },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (!res.ok || !resData.success) {
          throw new Error(resData.error || 'Failed to add category');
        }
        await refreshCatalog();
        return { success: true, category: resData.category };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error adding category';
        return { success: false, error: msg };
      }
    },
    [user, profile, refreshCatalog]
  );

  const updateCategory = useCallback(
    async (categoryId: string, updates: Partial<Category>) => {
      try {
        const res = await fetch('/api/management/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.uid || '',
            'x-user-role': profile?.role || '',
            'x-user-email': user?.email || '',
          },
          body: JSON.stringify({ ...updates, categoryId }),
        });
        const resData = await res.json();
        if (!res.ok || !resData.success) {
          throw new Error(resData.error || 'Failed to update category');
        }
        await refreshCatalog();
        return { success: true, category: resData.category };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error updating category';
        return { success: false, error: msg };
      }
    },
    [user, profile, refreshCatalog]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      try {
        const res = await fetch(`/api/management/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': user?.uid || '',
            'x-user-role': profile?.role || '',
            'x-user-email': user?.email || '',
          },
        });
        const resData = await res.json();
        if (!res.ok || !resData.success) {
          return {
            success: false,
            error: resData.error || 'Failed to delete category',
            inUseCount: resData.inUseCount,
          };
        }
        await refreshCatalog();
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error deleting category';
        return { success: false, error: msg };
      }
    },
    [user, profile, refreshCatalog]
  );

  // Sync cart from Firestore for authenticated user
  useEffect(() => {
    if (user && user.uid) {
      const currentUid = user.uid;
      async function syncUserCart() {
        try {
          const cartCol = collection(db, 'users', currentUid, 'cart');
          const snap = await getDocs(cartCol);
          if (!snap.empty) {
            const dbCart: CartItem[] = [];
            snap.forEach((d) => dbCart.push(d.data() as CartItem));
            setCart(dbCart);
          }
        } catch (err) {
          console.warn('Could not read user cart from Firestore:', err);
        }
      }
      syncUserCart();
    }
  }, [user]);

  // Sync wishlist from Firestore for authenticated user
  useEffect(() => {
    if (user && user.uid) {
      const currentUid = user.uid;
      async function syncUserWishlist() {
        try {
          const wishCol = collection(db, 'users', currentUid, 'wishlist');
          const snap = await getDocs(wishCol);
          if (!snap.empty) {
            const dbWishlist: string[] = [];
            snap.forEach((d) => dbWishlist.push(d.id));
            setWishlist(dbWishlist);
          }
        } catch (err) {
          console.warn('Could not read user wishlist from Firestore:', err);
        }
      }
      syncUserWishlist();
    }
  }, [user]);

  // Cache cart to localStorage for guest persistence
  useEffect(() => {
    try {
      localStorage.setItem('nexo_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Cache wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexo_wishlist', JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Currency Formatter
  const formatPrice = useCallback((amount: number, currency: string = 'NGN'): string => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`;
    }
    if (currency === 'USD') {
      return `$${amount.toLocaleString()}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  }, []);

  // Cart operations
  const addToCart = useCallback(
    (product: Product, quantity: number = 1, variantId?: string): { success: boolean; message?: string } => {
      // Backend availability guard
      if (product.availabilityStatus === 'OUT_OF_STOCK' || product.availabilityStatus === 'UNAVAILABLE') {
        return { success: false, message: 'This item is currently unavailable and cannot be added to cart.' };
      }

      const effectivePrice = product.discountPrice ?? product.price;
      const itemId = variantId ? `${product.productId}-${variantId}` : product.productId;
      const primaryImage = product.productImages[0]?.url || '';

      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.itemId === itemId);
        let updated: CartItem[];

        if (existingIndex > -1) {
          updated = [...prev];
          const newQty = updated[existingIndex].quantity + quantity;
          // Stock constraint
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: Math.min(newQty, product.stockQuantity),
          };
        } else {
          const newItem: CartItem = {
            itemId,
            productId: product.productId,
            name: product.name,
            slug: product.slug,
            brand: product.brand,
            price: effectivePrice,
            currency: product.currency,
            image: primaryImage,
            quantity: Math.min(quantity, product.stockQuantity),
            variantId,
            addedAt: new Date().toISOString(),
          };
          updated = [newItem, ...prev];
        }

        // Sync to Firestore if authenticated
        if (user) {
          const cartDocRef = doc(db, 'users', user.uid, 'cart', itemId);
          setDoc(cartDocRef, {
            ...updated.find((i) => i.itemId === itemId),
            updatedAt: serverTimestamp(),
          }).catch((err) => console.warn('Cart sync warning:', err));
        }

        return updated;
      });

      return { success: true };
    },
    [user]
  );

  const removeFromCart = useCallback(
    (itemId: string) => {
      setCart((prev) => prev.filter((item) => item.itemId !== itemId));
      if (user) {
        const cartDocRef = doc(db, 'users', user.uid, 'cart', itemId);
        deleteDoc(cartDocRef).catch((err) => console.warn('Cart item removal sync warning:', err));
      }
    },
    [user]
  );

  const updateCartQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(itemId);
        return;
      }
      setCart((prev) =>
        prev.map((item) => {
          if (item.itemId === itemId) {
            const updatedItem = { ...item, quantity };
            if (user) {
              const cartDocRef = doc(db, 'users', user.uid, 'cart', itemId);
              setDoc(cartDocRef, updatedItem, { merge: true }).catch((err) =>
                console.warn('Cart update sync warning:', err)
              );
            }
            return updatedItem;
          }
          return item;
        })
      );
    },
    [removeFromCart, user]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    // Note: Not treated as an order
  }, []);

  // Wishlist operations
  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (productId: string): { success: boolean; requiresAuth?: boolean } => {
      if (!user) {
        return { success: false, requiresAuth: true };
      }

      setWishlist((prev) => {
        const exists = prev.includes(productId);
        const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];

        // Sync to Firestore
        const wishDocRef = doc(db, 'users', user.uid, 'wishlist', productId);
        if (exists) {
          deleteDoc(wishDocRef).catch((err) => console.warn('Wishlist removal warning:', err));
        } else {
          setDoc(wishDocRef, {
            productId,
            addedAt: serverTimestamp(),
          }).catch((err) => console.warn('Wishlist addition warning:', err));
        }

        return updated;
      });

      return { success: true };
    },
    [user]
  );

  // Cart Metrics
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Filtered & Sorted Products
  const filteredProducts = products.filter((prod) => {
    // Category match
    if (filters.category && prod.category.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }
    // Brand match
    if (filters.brand && prod.brand.toLowerCase() !== filters.brand.toLowerCase()) {
      return false;
    }
    // Availability
    if (filters.availability && prod.availabilityStatus !== filters.availability) {
      return false;
    }
    // Price range
    const effectivePrice = prod.discountPrice ?? prod.price;
    if (filters.minPrice !== null && effectivePrice < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== null && effectivePrice > filters.maxPrice) {
      return false;
    }
    // Search Query (Name, Category, Brand, Specs, SKU)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchBrand = prod.brand.toLowerCase().includes(q);
      const matchCategory = prod.category.toLowerCase().includes(q);
      const matchSku = prod.sku.toLowerCase().includes(q);
      const matchDesc = prod.shortDescription.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchCategory && !matchSku && !matchDesc) {
        return false;
      }
    }
    return true;
  });

  // Sorting
  filteredProducts.sort((a, b) => {
    const priceA = a.discountPrice ?? a.price;
    const priceB = b.discountPrice ?? b.price;

    if (filters.sortBy === 'price_asc') return priceA - priceB;
    if (filters.sortBy === 'price_desc') return priceB - priceA;
    if (filters.sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0; // relevance
  });

  const getProductBySlug = useCallback(
    (slug: string): Product | undefined => {
      return products.find((p) => p.slug === slug || p.productId === slug);
    },
    [products]
  );

  const getRelatedProducts = useCallback(
    (currentProduct: Product, limit: number = 3): Product[] => {
      return products
        .filter(
          (p) =>
            p.productId !== currentProduct.productId &&
            (p.category === currentProduct.category || p.brand === currentProduct.brand)
        )
        .slice(0, limit);
    },
    [products]
  );

  return (
    <MarketplaceContext.Provider
      value={{
        products,
        categories,
        loadingProducts,
        filters,
        setFilters,
        resetFilters,
        filteredProducts,
        getProductBySlug,
        getRelatedProducts,
        cart,
        cartCount,
        cartSubtotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        wishlist,
        isWishlisted,
        toggleWishlist,
        formatPrice,
        refreshCatalog,
        addCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = (): MarketplaceContextType => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
