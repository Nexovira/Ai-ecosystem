export type ProductAvailability = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNAVAILABLE';

export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'OUT_OF_STOCK' | 'ARCHIVED';

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductVariant {
  variantId: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  attributes: Record<string, string>;
}

export interface Product {
  productId: string;
  sellerId: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  subcategory?: string;
  brand: string;
  sku: string;
  price: number;
  currency: string;
  discountPrice?: number;
  stockQuantity: number;
  availabilityStatus: ProductAvailability;
  productStatus: ProductStatus;
  isApproved?: boolean;
  productImages: ProductImage[];
  specifications: ProductSpecification[];
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  order: number;
}

export interface CartItem {
  itemId: string;
  productId: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
  variantId?: string;
  addedAt: string;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export type MarketplaceSortOption =
  | 'relevance'
  | 'newest'
  | 'price_asc'
  | 'price_desc';

export interface MarketplaceFilterState {
  category: string;
  brand: string;
  minPrice: number | null;
  maxPrice: number | null;
  availability: string;
  searchQuery: string;
  sortBy: MarketplaceSortOption;
  page: number;
}
