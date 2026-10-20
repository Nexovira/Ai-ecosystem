export type DigitalProductType =
  | 'EBOOK'
  | 'PDF'
  | 'GUIDE'
  | 'TEMPLATE'
  | 'DIGITAL_RESOURCE'
  | 'DOCUMENT'
  | 'OTHER_APPROVED';

export type DigitalProductStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export type DigitalProductVisibility = 'PUBLIC' | 'PRIVATE';

export interface DigitalFileMetadata {
  fileName: string;
  fileSize: number; // in bytes
  fileType: string; // extension e.g. 'pdf', 'epub', 'zip'
  mimeType: string;
  pageCount?: number;
  version: string; // e.g. '1.0'
  checksum?: string;
}

export interface DigitalPreviewInfo {
  previewType: 'SAMPLE_PAGES' | 'EXCERPT' | 'PREVIEW_PDF' | 'IMAGES';
  excerptText?: string;
  previewImages?: string[];
  samplePdfUrl?: string;
  previewPageCount?: number;
}

export interface DigitalProduct {
  id: string;
  productId: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorRole: 'SELLER' | 'EXPERT' | 'MANAGEMENT';
  category: string;
  categorySlug: string;
  categoryName: string;
  price: number;
  currency: string; // 'NGN'
  isFree: boolean;
  productType: DigitalProductType;
  status: DigitalProductStatus;
  visibility: DigitalProductVisibility;
  coverImage: string;
  previewInfo: DigitalPreviewInfo;
  fileMetadata: DigitalFileMetadata;
  storagePath: string; // Internal protected storage reference - NOT exposed publicly
  externalFileUrl?: string; // Authoritative URL for deliverable ebook / PDF / file
  downloadLimit: number; // 0 or -1 for unlimited, or e.g. 10
  affiliateEligible: boolean;
  commissionRate?: number; // e.g. 10 = 10%
  salesCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface DigitalProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  displayOrder: number;
}

export type EntitlementStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface DigitalEntitlement {
  id: string;
  entitlementId: string;
  userId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  productType: DigitalProductType;
  coverImage: string;
  orderId: string; // Order ID or 'FREE_ACQUISITION'
  orderReference?: string;
  status: EntitlementStatus;
  downloadCount: number;
  maxDownloads: number; // -1 for unlimited
  fileVersion: string;
  grantedAt: string;
  revokedAt?: string;
  lastDownloadedAt?: string;
}

export interface DigitalDownloadLog {
  id: string;
  entitlementId: string;
  userId: string;
  productId: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

export type DigitalReportReason =
  | 'MISLEADING'
  | 'INAPPROPRIATE'
  | 'COPYRIGHT_VIOLATION'
  | 'MALICIOUS_FILE'
  | 'SPAM'
  | 'OTHER';

export interface DigitalProductReport {
  id: string;
  productId: string;
  reporterId: string;
  reporterEmail: string;
  reason: DigitalReportReason;
  explanation: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface CreateDigitalProductInput {
  title: string;
  shortDescription: string;
  description: string;
  categorySlug: string;
  price: number;
  currency?: string;
  isFree?: boolean;
  productType: DigitalProductType;
  coverImage?: string;
  previewInfo?: Partial<DigitalPreviewInfo>;
  fileMetadata: DigitalFileMetadata;
  storagePath?: string;
  externalFileUrl?: string;
  visibility?: DigitalProductVisibility;
  downloadLimit?: number;
  affiliateEligible?: boolean;
  commissionRate?: number;
}

export interface UpdateDigitalProductInput {
  title?: string;
  shortDescription?: string;
  description?: string;
  categorySlug?: string;
  price?: number;
  productType?: DigitalProductType;
  coverImage?: string;
  previewInfo?: Partial<DigitalPreviewInfo>;
  fileMetadata?: Partial<DigitalFileMetadata>;
  storagePath?: string;
  externalFileUrl?: string;
  downloadLimit?: number;
  affiliateEligible?: boolean;
  commissionRate?: number;
  status?: DigitalProductStatus;
  visibility?: DigitalProductVisibility;
}
