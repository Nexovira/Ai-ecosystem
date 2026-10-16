export type ReviewEntityType = 'PRODUCT' | 'SERVICE' | 'EXPERT' | 'COURSE' | 'DIGITAL_PRODUCT';

export type ReviewStatus =
  | 'PUBLISHED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'HIDDEN'
  | 'REPORTED'
  | 'REMOVED';

export type VerificationType =
  | 'VERIFIED_PURCHASE'
  | 'VERIFIED_SERVICE'
  | 'VERIFIED_EXPERIENCE'
  | 'VERIFIED_ENROLLMENT'
  | 'NONE';

export interface ReviewResponse {
  responderId: string;
  responderRole: 'SELLER' | 'EXPERT' | 'FACULTY' | 'MANAGEMENT';
  responderName: string;
  responseText: string;
  respondedAt: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatar?: string;
  isAnonymous?: boolean;
  entityType: ReviewEntityType;
  entityId: string; // productId, serviceSlug, expertId, courseId
  entityTitle?: string;
  rating: number; // strictly 1 | 2 | 3 | 4 | 5
  title?: string;
  body: string;
  status: ReviewStatus;
  verificationType: VerificationType;
  verificationReference?: string; // orderReference, requestReference, applicationReference
  sellerId?: string; // for products
  expertId?: string; // for expert reviews
  reportCount?: number;
  response?: ReviewResponse;
  createdAt: string;
  updatedAt: string;
}

export type ReviewReportReason =
  | 'SPAM'
  | 'OFFENSIVE'
  | 'HARASSMENT'
  | 'FRAUDULENT'
  | 'PERSONAL_INFO'
  | 'IRRELEVANT'
  | 'OTHER';

export interface ReviewReport {
  id: string;
  reviewId: string;
  reporterId: string;
  reporterEmail?: string;
  reason: ReviewReportReason;
  explanation?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolvedBy?: string;
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ReviewEligibilityResult {
  isEligible: boolean;
  reason?: string;
  verificationType: VerificationType;
  verificationReference?: string;
  alreadyReviewed: boolean;
  existingReview?: Review | null;
}

export interface RatingSummary {
  entityType: ReviewEntityType;
  entityId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewInput {
  entityType: ReviewEntityType;
  entityId: string;
  rating: number;
  title?: string;
  body: string;
  isAnonymous?: boolean;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  body?: string;
  isAnonymous?: boolean;
}
