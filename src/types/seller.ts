import { ProductAvailability, ProductStatus } from './marketplace';

export type SellerVerificationStatus =
  | 'NOT_SELLER'
  | 'APPLICATION_STARTED'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface SellerApplication {
  applicationId: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  businessName: string;
  businessDescription: string;
  businessType: string;
  businessAddress: string;
  city: string;
  state: string;
  country: string;
  productCategories: string[];
  productsSummary: string;
  websiteUrl?: string;
  status: SellerVerificationStatus;
  submittedAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface SellerProfile {
  sellerId: string;
  userId: string;
  businessName: string;
  slug: string;
  businessDescription: string;
  logoUrl?: string;
  coverImageUrl?: string;
  businessLocation: string;
  contactEmail: string;
  contactPhone?: string;
  categories: string[];
  verificationStatus: SellerVerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormInput {
  name: string;
  slug: string;
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
  shortDescription: string;
  fullDescription: string;
  productImages: { id: string; url: string; alt: string; isPrimary: boolean; order: number }[];
  specifications: { label: string; value: string }[];
  variants?: {
    variantId: string;
    name: string;
    sku: string;
    price: number;
    stockQuantity: number;
    attributes: Record<string, string>;
  }[];
}
