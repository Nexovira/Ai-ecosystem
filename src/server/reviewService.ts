import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  Review,
  ReviewReport,
  ReviewEntityType,
  ReviewStatus,
  VerificationType,
  ReviewEligibilityResult,
  RatingSummary,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewReportReason,
} from '../types/review';
import { commerceService } from './commerceService';
import { servicesService } from './servicesService';
import { academyService } from './academyService';
import { notificationService } from './notificationService';
import { managementService } from './managementService';
import { digitalProductService } from './digitalProductService';

// Basic XSS & HTML tag sanitization helper
function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        case "'":
          return '&#x27;';
        case '&':
          return '&amp;';
        default:
          return char;
      }
    })
    .trim();
}

export class ReviewService {
  private reviewsCache: Review[] = [];
  private reportsCache: ReviewReport[] = [];
  private isInitialized = false;

  // In-memory rate limiting map for reports: reporterId -> timestamp[]
  private reportRateLimitMap: Map<string, number[]> = new Map();

  constructor() {
    this.init().catch(() => {
      // Background init handled safely
    });
  }

  private async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!auth || !auth.currentUser) {
      // Server runs in memory-authoritative mode without active client session
      return;
    }

    try {
      if (db) {
        // Load reviews from Firestore
        const revSnap = await getDocs(collection(db, 'reviews')).catch(() => null);
        if (revSnap && !revSnap.empty) {
          revSnap.forEach((d) => {
            const data = d.data() as Review;
            if (!this.reviewsCache.some((r) => r.id === data.id)) {
              this.reviewsCache.push(data);
            }
          });
        }

        // Load review reports
        const repSnap = await getDocs(collection(db, 'reviewReports')).catch(() => null);
        if (repSnap && !repSnap.empty) {
          repSnap.forEach((d) => {
            const data = d.data() as ReviewReport;
            if (!this.reportsCache.some((r) => r.id === data.id)) {
              this.reportsCache.push(data);
            }
          });
        }
      }
    } catch {
      // Memory store is authoritative
    }
  }

  /**
   * Helper: Find existing review by user for an entity
   */
  public findUserReview(userId: string, entityType: ReviewEntityType, entityId: string): Review | null {
    return (
      this.reviewsCache.find(
        (r) =>
          r.userId === userId &&
          r.entityType === entityType &&
          r.entityId === entityId &&
          r.status !== 'REMOVED'
      ) || null
    );
  }

  /**
   * Authoritative Server-Side Eligibility Engine
   * Strictly evaluates genuine transactions / enrollments / service engagements.
   * NEVER trusts client-submitted claims.
   */
  public async checkEligibility(
    userId: string,
    entityType: ReviewEntityType,
    entityId: string
  ): Promise<ReviewEligibilityResult> {
    await this.init();

    if (!userId || !entityId || !entityType) {
      return {
        isEligible: false,
        reason: 'User authentication and target entity parameters are required.',
        verificationType: 'NONE',
        alreadyReviewed: false,
      };
    }

    // 1. Check if user has already reviewed this entity
    const existing = this.findUserReview(userId, entityType, entityId);
    if (existing) {
      return {
        isEligible: false,
        reason: 'You have already submitted a review for this experience.',
        verificationType: existing.verificationType,
        verificationReference: existing.verificationReference,
        alreadyReviewed: true,
        existingReview: existing,
      };
    }

    // 2. Entity-Specific Authoritative Validation
    switch (entityType) {
      case 'PRODUCT': {
        const product = await commerceService.getProductById(entityId);
        if (!product) {
          return {
            isEligible: false,
            reason: 'The specified product does not exist in the catalog.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        // Anti-Fraud: Sellers cannot review their own products
        if (product.sellerId === userId || product.sellerId === `seller-${userId}`) {
          return {
            isEligible: false,
            reason: 'Merchants and product owners are not permitted to review their own products.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        // Check customer orders for verified completed purchase of this productId
        const orders = await commerceService.getCustomerOrders(userId);
        const validOrder = orders.find((o) => {
          const isPaid =
            o.paymentStatus === 'SUCCESS' ||
            ['DELIVERED', 'COMPLETED', 'PAYMENT_CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(
              o.orderStatus
            );
          const hasItem = o.items.some((it) => it.productId === entityId);
          return isPaid && hasItem;
        });

        if (!validOrder) {
          return {
            isEligible: false,
            reason:
              'Review submission requires a verified, completed purchase of this product from the Nexovira Marketplace.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        return {
          isEligible: true,
          verificationType: 'VERIFIED_PURCHASE',
          verificationReference: validOrder.orderReference,
          alreadyReviewed: false,
        };
      }

      case 'SERVICE': {
        // Query service requests for this customer matching the service category
        const requests = await servicesService.getCustomerRequests(userId);
        const validRequest = requests.find((r) => {
          const isTargetCat =
            r.categorySlug === entityId ||
            r.categoryId === entityId ||
            r.categorySlug.toLowerCase() === entityId.toLowerCase();
          const isEligibleStatus = ['COMPLETED', 'DELIVERED', 'ACCEPTED', 'IN_PROGRESS'].includes(r.status);
          return isTargetCat && isEligibleStatus;
        });

        if (!validRequest) {
          return {
            isEligible: false,
            reason:
              'Service reviews are unlocked only for customers with an active or completed project in this service category.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        return {
          isEligible: true,
          verificationType: 'VERIFIED_SERVICE',
          verificationReference: validRequest.requestReference,
          alreadyReviewed: false,
        };
      }

      case 'EXPERT': {
        const experts = await servicesService.getPublicExperts();
        const expert = experts.find((e) => e.expertId === entityId);
        if (!expert) {
          return {
            isEligible: false,
            reason: 'Target expert profile was not found or is currently private.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        // Anti-Fraud: Experts cannot review themselves
        if (expert.expertId === entityId && (expert as any).userId === userId) {
          return {
            isEligible: false,
            reason: 'Specialists cannot review their own professional profile.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        // Query customer requests assigned to this expert
        const requests = await servicesService.getCustomerRequests(userId);
        const validRequest = requests.find((r) => {
          const isAssigned = r.assignedExpertId === expert.expertId;
          const isEligibleStatus = ['COMPLETED', 'DELIVERED', 'ACCEPTED', 'IN_PROGRESS'].includes(r.status);
          return isAssigned && isEligibleStatus;
        });

        if (!validRequest) {
          return {
            isEligible: false,
            reason:
              'Expert reviews are reserved for clients who have engaged this specialist on a confirmed or completed project.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        return {
          isEligible: true,
          verificationType: 'VERIFIED_EXPERIENCE',
          verificationReference: validRequest.requestReference,
          alreadyReviewed: false,
        };
      }

      case 'COURSE': {
        const courses = academyService.getCourses();
        const course = courses.find((c) => c.courseId === entityId || c.slug === entityId);
        if (!course) {
          return {
            isEligible: false,
            reason: 'Course was not found in the Nexovira Academy registry.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        // Query student applications for this course
        const apps = academyService.getStudentApplications(userId);
        const validApp = apps.find((item) => {
          const isCourse = item.application.courseId === course.courseId;
          const isEnrolled = [
            'ENROLLED',
            'APPROVED',
            'ACCEPTED',
            'SUBMITTED',
            'PAYMENT_SUCCESS_FORM_PENDING',
          ].includes(item.application.status);
          return isCourse && isEnrolled;
        });

        if (!validApp) {
          return {
            isEligible: false,
            reason:
              'Course feedback is reserved for students with verified enrollment or an active scholarship cohort record.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        return {
          isEligible: true,
          verificationType: 'VERIFIED_ENROLLMENT',
          verificationReference: validApp.application.applicationReference,
          alreadyReviewed: false,
        };
      }

      case 'DIGITAL_PRODUCT': {
        const dp = await digitalProductService.getProductById(entityId);
        if (!dp) {
          return {
            isEligible: false,
            reason: 'Target digital product was not found in the catalog.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        // Anti-Fraud: Creators cannot review their own digital products
        if (dp.creatorId === userId || dp.creatorId === `seller-${userId}`) {
          return {
            isEligible: false,
            reason: 'Authors and creators cannot review their own digital publications.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        // Check if user has an active entitlement for this digital product
        const entitlement = await digitalProductService.getUserEntitlementForProduct(userId, entityId);
        if (!entitlement || entitlement.status !== 'ACTIVE') {
          return {
            isEligible: false,
            reason: 'Review submission requires an active purchase or verified license for this publication.',
            verificationType: 'NONE',
            alreadyReviewed: false,
          };
        }

        return {
          isEligible: true,
          verificationType: 'VERIFIED_PURCHASE',
          verificationReference: entitlement.orderReference || entitlement.entitlementId,
          alreadyReviewed: false,
        };
      }

      default:
        return {
          isEligible: false,
          reason: 'Unsupported entity type for review submission.',
          verificationType: 'NONE',
          alreadyReviewed: false,
        };
    }
  }

  /**
   * Submit a verified review.
   */
  public async createReview(
    userId: string,
    userDisplayName: string,
    userAvatar: string | undefined,
    input: CreateReviewInput
  ): Promise<Review> {
    await this.init();

    // 1. Strict Server-Side Rating Scale Validation (1 to 5)
    const rating = Math.round(Number(input.rating));
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be an integer between 1 and 5 stars.');
    }

    // 2. Strict Content Length & Sanitization
    const sanitizedTitle = sanitizeText(input.title || '').slice(0, 100);
    const sanitizedBody = sanitizeText(input.body || '');

    if (sanitizedBody.length < 10) {
      throw new Error('Review content must be at least 10 characters long.');
    }
    if (sanitizedBody.length > 2000) {
      throw new Error('Review content cannot exceed 2000 characters.');
    }

    // 3. Server Eligibility Verification
    const eligibility = await this.checkEligibility(userId, input.entityType, input.entityId);
    if (!eligibility.isEligible) {
      throw new Error(eligibility.reason || 'You are not eligible to review this experience.');
    }

    // 4. Resolve Entity Metadata (Title, Seller/Expert)
    let entityTitle = input.entityId;
    let sellerId: string | undefined;
    let expertId: string | undefined;

    if (input.entityType === 'PRODUCT') {
      const p = await commerceService.getProductById(input.entityId);
      if (p) {
        entityTitle = p.name;
        sellerId = p.sellerId;
      }
    } else if (input.entityType === 'EXPERT') {
      const exp = (await servicesService.getPublicExperts()).find(
        (e) => e.expertId === input.entityId
      );
      if (exp) {
        entityTitle = exp.fullName;
        expertId = exp.expertId;
      }
    } else if (input.entityType === 'COURSE') {
      const crs = academyService.getCourses().find(
        (c) => c.courseId === input.entityId || c.slug === input.entityId
      );
      if (crs) {
        entityTitle = crs.title;
      }
    } else if (input.entityType === 'SERVICE') {
      const cat = (await servicesService.getCategories()).find(
        (c) => c.id === input.entityId || c.slug === input.entityId
      );
      if (cat) {
        entityTitle = cat.name;
      }
    } else if (input.entityType === 'DIGITAL_PRODUCT') {
      const dp = await digitalProductService.getProductById(input.entityId);
      if (dp) {
        entityTitle = dp.title;
        sellerId = dp.creatorId;
      }
    }

    // 5. Build New Review Document
    const now = new Date().toISOString();
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const review: Review = {
      id: reviewId,
      userId,
      userDisplayName: input.isAnonymous ? 'Verified Customer' : (userDisplayName || 'Nexovira Member'),
      userAvatar: input.isAnonymous ? undefined : userAvatar,
      isAnonymous: Boolean(input.isAnonymous),
      entityType: input.entityType,
      entityId: input.entityId,
      entityTitle,
      rating,
      title: sanitizedTitle,
      body: sanitizedBody,
      status: 'PUBLISHED',
      verificationType: eligibility.verificationType,
      verificationReference: eligibility.verificationReference,
      sellerId,
      expertId,
      reportCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Save to Cache
    this.reviewsCache.unshift(review);

    // Save to Firestore if authenticated
    if (db && auth && auth.currentUser) {
      try {
        await setDoc(doc(db, 'reviews', reviewId), review).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    // 6. Dispatch Notifications
    // To customer
    notificationService
      .dispatch({
        recipientUserId: userId,
        type: 'SYSTEM_ALERT',
        category: 'SYSTEM',
        title: 'Review Published',
        message: `Your verified ${rating}-star review for "${entityTitle}" has been published. Thank you for contributing to ecosystem trust.`,
        relatedEntityType: 'MARKETPLACE',
        relatedEntityId: input.entityId,
        actionUrl: `/account/reviews`,
        priority: 'NORMAL',
        idempotencyKey: `review_conf_${reviewId}`,
      })
      .catch(() => {});

    // To seller or expert if applicable
    if (sellerId) {
      notificationService
        .dispatch({
          recipientUserId: sellerId,
          type: 'SELLER_PAYMENT_RECEIVED',
          category: 'MARKETPLACE',
          title: 'New Customer Review',
          message: `A customer has posted a ${rating}-star verified review for your product "${entityTitle}".`,
          relatedEntityType: 'PRODUCT',
          relatedEntityId: input.entityId,
          actionUrl: `/management/reviews`,
          priority: 'NORMAL',
          idempotencyKey: `seller_review_notif_${reviewId}`,
        })
        .catch(() => {});
    }

    return review;
  }

  /**
   * Edit existing review.
   * Strictly enforces owner authorization (IDOR protection).
   */
  public async updateReview(
    reviewId: string,
    userId: string,
    input: UpdateReviewInput
  ): Promise<Review> {
    await this.init();

    const review = this.reviewsCache.find((r) => r.id === reviewId);
    if (!review) {
      throw new Error('Review not found.');
    }

    // IDOR Protection: Only the reviewer can edit
    if (review.userId !== userId) {
      throw new Error('Forbidden: You can only edit your own reviews.');
    }

    if (review.status === 'REMOVED') {
      throw new Error('Cannot edit a review that has been removed.');
    }

    let updatedRating = review.rating;
    if (input.rating !== undefined) {
      const r = Math.round(Number(input.rating));
      if (isNaN(r) || r < 1 || r > 5) {
        throw new Error('Rating must be an integer between 1 and 5 stars.');
      }
      updatedRating = r;
    }

    let updatedBody = review.body;
    if (input.body !== undefined) {
      const b = sanitizeText(input.body);
      if (b.length < 10) {
        throw new Error('Review content must be at least 10 characters long.');
      }
      if (b.length > 2000) {
        throw new Error('Review content cannot exceed 2000 characters.');
      }
      updatedBody = b;
    }

    const updatedTitle =
      input.title !== undefined ? sanitizeText(input.title).slice(0, 100) : review.title;

    const now = new Date().toISOString();
    review.rating = updatedRating;
    review.title = updatedTitle;
    review.body = updatedBody;
    if (input.isAnonymous !== undefined) {
      review.isAnonymous = Boolean(input.isAnonymous);
      if (review.isAnonymous) {
        review.userDisplayName = 'Verified Customer';
        review.userAvatar = undefined;
      }
    }
    review.updatedAt = now;

    // Update Firestore
    if (db && auth && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'reviews', reviewId), {
          rating: review.rating,
          title: review.title,
          body: review.body,
          isAnonymous: review.isAnonymous,
          userDisplayName: review.userDisplayName,
          userAvatar: review.userAvatar,
          updatedAt: now,
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    return review;
  }

  /**
   * Delete / Archive review.
   * Does not destroy moderation history; sets status to REMOVED.
   */
  public async deleteReview(reviewId: string, userId: string, isAdmin = false): Promise<{ success: boolean }> {
    await this.init();

    const review = this.reviewsCache.find((r) => r.id === reviewId);
    if (!review) {
      throw new Error('Review not found.');
    }

    // IDOR Protection: Owner or Admin only
    if (!isAdmin && review.userId !== userId) {
      throw new Error('Forbidden: You can only delete your own reviews.');
    }

    const now = new Date().toISOString();
    review.status = 'REMOVED';
    review.updatedAt = now;

    if (db && auth && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'reviews', reviewId), {
          status: 'REMOVED',
          updatedAt: now,
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    return { success: true };
  }

  /**
   * Get reviews for public entity display.
   * Only returns PUBLISHED reviews.
   */
  public async getReviewsForEntity(
    entityType: ReviewEntityType,
    entityId: string,
    options: {
      sort?: 'recent' | 'highest' | 'lowest' | 'verified';
      starFilter?: number;
      verifiedOnly?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    reviews: Review[];
    summary: RatingSummary;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await this.init();

    // 1. Gather all published reviews for this entity
    const allEntityReviews = this.reviewsCache.filter(
      (r) =>
        r.entityType === entityType &&
        (r.entityId === entityId || r.entityId.toLowerCase() === entityId.toLowerCase()) &&
        r.status === 'PUBLISHED'
    );

    // 2. Mathematically compute RatingSummary
    const summary = this.computeRatingSummary(entityType, entityId, allEntityReviews);

    // 3. Filter reviews according to query parameters
    let filtered = [...allEntityReviews];

    if (options.starFilter && options.starFilter >= 1 && options.starFilter <= 5) {
      filtered = filtered.filter((r) => r.rating === options.starFilter);
    }

    if (options.verifiedOnly) {
      filtered = filtered.filter((r) => r.verificationType !== 'NONE');
    }

    // 4. Sort
    const sort = options.sort || 'recent';
    if (sort === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'verified') {
      filtered.sort((a, b) => {
        const aVer = a.verificationType !== 'NONE' ? 1 : 0;
        const bVer = b.verificationType !== 'NONE' ? 1 : 0;
        return bVer - aVer || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // Default: recent
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // 5. Server Pagination
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 6));
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      reviews: paginated,
      summary,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Helper: Calculate accurate mathematical rating summary
   */
  public computeRatingSummary(
    entityType: ReviewEntityType,
    entityId: string,
    publishedReviews?: Review[]
  ): RatingSummary {
    const list =
      publishedReviews !== undefined
        ? publishedReviews
        : this.reviewsCache.filter(
            (r) =>
              r.entityType === entityType &&
              (r.entityId === entityId || r.entityId.toLowerCase() === entityId.toLowerCase()) &&
              r.status === 'PUBLISHED'
          );

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of list) {
      const star = r.rating as 1 | 2 | 3 | 4 | 5;
      if (counts[star] !== undefined) {
        counts[star]++;
        sum += star;
      }
    }

    const totalReviews = list.length;
    const averageRating = totalReviews > 0 ? Math.round((sum / totalReviews) * 10) / 10 : 0;

    return {
      entityType,
      entityId,
      averageRating,
      totalReviews,
      ratingDistribution: counts,
    };
  }

  /**
   * Get all reviews submitted by a specific user.
   */
  public async getUserReviews(userId: string): Promise<Review[]> {
    await this.init();
    return this.reviewsCache
      .filter((r) => r.userId === userId && r.status !== 'REMOVED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Report an inappropriate review.
   * Includes rate limiting and spam prevention.
   */
  public async reportReview(
    reviewId: string,
    reporterId: string,
    reporterEmail: string,
    reason: ReviewReportReason,
    explanation?: string
  ): Promise<ReviewReport> {
    await this.init();

    const review = this.reviewsCache.find((r) => r.id === reviewId);
    if (!review) {
      throw new Error('Review not found.');
    }

    // Rate Limiting Check: Max 5 reports per 10 minutes per reporter
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    const existingTimestamps = (this.reportRateLimitMap.get(reporterId) || []).filter((t) => t > tenMinutesAgo);

    if (existingTimestamps.length >= 5) {
      throw new Error('Report submission rate limit reached. Please wait a few minutes before reporting again.');
    }

    // Prevent duplicate report from same reporter for the same review
    const existingReport = this.reportsCache.find(
      (rep) => rep.reviewId === reviewId && rep.reporterId === reporterId
    );
    if (existingReport) {
      throw new Error('You have already submitted a report for this review.');
    }

    const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const report: ReviewReport = {
      id: reportId,
      reviewId,
      reporterId,
      reporterEmail,
      reason,
      explanation: sanitizeText(explanation || '').slice(0, 500),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    // Store report
    this.reportsCache.unshift(report);
    existingTimestamps.push(now);
    this.reportRateLimitMap.set(reporterId, existingTimestamps);

    // Update review report count
    review.reportCount = (review.reportCount || 0) + 1;
    if (review.reportCount >= 3 && review.status === 'PUBLISHED') {
      review.status = 'REPORTED';
    }

    if (db && auth && auth.currentUser) {
      try {
        await setDoc(doc(db, 'reviewReports', reportId), report).catch(() => null);
        await updateDoc(doc(db, 'reviews', reviewId), {
          reportCount: review.reportCount,
          status: review.status,
          updatedAt: new Date().toISOString(),
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    return report;
  }

  /**
   * Merchant / Provider response to a review.
   */
  public async respondToReview(
    reviewId: string,
    responderId: string,
    responderRole: 'SELLER' | 'EXPERT' | 'FACULTY' | 'MANAGEMENT',
    responderName: string,
    responseText: string
  ): Promise<Review> {
    await this.init();

    const review = this.reviewsCache.find((r) => r.id === reviewId);
    if (!review) {
      throw new Error('Review not found.');
    }

    // Authorization check
    if (responderRole === 'SELLER') {
      if (review.sellerId && review.sellerId !== responderId && review.sellerId !== `seller-${responderId}`) {
        throw new Error('Unauthorized: You can only respond to reviews on your own merchandise.');
      }
    } else if (responderRole === 'EXPERT') {
      if (review.expertId && review.expertId !== responderId) {
        throw new Error('Unauthorized: You can only respond to reviews on your own expert practice.');
      }
    }

    const sanitized = sanitizeText(responseText);
    if (sanitized.length < 5 || sanitized.length > 1000) {
      throw new Error('Response must be between 5 and 1000 characters.');
    }

    const now = new Date().toISOString();
    review.response = {
      responderId,
      responderRole,
      responderName: sanitizeText(responderName || 'Authorized Merchant'),
      responseText: sanitized,
      respondedAt: now,
    };
    review.updatedAt = now;

    if (db && auth && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'reviews', reviewId), {
          response: review.response,
          updatedAt: now,
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    // Notify reviewer of the provider response
    notificationService
      .dispatch({
        recipientUserId: review.userId,
        type: 'EXPERT_RESPONSE',
        category: 'SYSTEM',
        title: 'Response to Your Review',
        message: `${responderName} posted a response to your review on "${review.entityTitle || 'the platform'}".`,
        relatedEntityType: 'MARKETPLACE',
        relatedEntityId: review.entityId,
        actionUrl: `/account/reviews`,
        priority: 'NORMAL',
        idempotencyKey: `review_resp_${reviewId}`,
      })
      .catch(() => {});

    return review;
  }

  /**
   * Management: Fetch all reviews and reports with filtering
   */
  public async getAllReviewsForManagement(options: {
    status?: string;
    entityType?: string;
    reportedOnly?: boolean;
    search?: string;
  } = {}): Promise<{ reviews: Review[]; reports: ReviewReport[]; total: number }> {
    await this.init();

    let list = [...this.reviewsCache];

    if (options.status && options.status !== 'ALL') {
      list = list.filter((r) => r.status === options.status);
    }

    if (options.entityType && options.entityType !== 'ALL') {
      list = list.filter((r) => r.entityType === options.entityType);
    }

    if (options.reportedOnly) {
      list = list.filter((r) => (r.reportCount || 0) > 0 || r.status === 'REPORTED');
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.body.toLowerCase().includes(q) ||
          r.userDisplayName.toLowerCase().includes(q) ||
          r.entityTitle?.toLowerCase().includes(q) ||
          r.entityId.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      reviews: list,
      reports: this.reportsCache,
      total: list.length,
    };
  }

  /**
   * Management: Moderate review status (PUBLISHED, HIDDEN, REMOVED, UNDER_REVIEW).
   * Fully audit logged.
   */
  public async moderateReview(
    reviewId: string,
    newStatus: ReviewStatus,
    reason: string,
    actorId: string,
    actorEmail: string,
    actorRole: string
  ): Promise<Review> {
    await this.init();

    const review = this.reviewsCache.find((r) => r.id === reviewId);
    if (!review) {
      throw new Error('Review not found.');
    }

    const previousStatus = review.status;
    const now = new Date().toISOString();
    review.status = newStatus;
    review.updatedAt = now;

    if (db && auth && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'reviews', reviewId), {
          status: newStatus,
          updatedAt: now,
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    // Audit log
    await managementService.recordAuditLog({
      actorId,
      actorEmail,
      actorRole,
      action: 'REVIEW_MODERATED',
      targetType: 'REVIEW',
      targetId: reviewId,
      previousState: { status: previousStatus },
      newState: { status: newStatus },
      reason: reason || 'Review moderation action',
    });

    // Notify reviewer if removed or hidden
    if (newStatus === 'HIDDEN' || newStatus === 'REMOVED') {
      notificationService
        .dispatch({
          recipientUserId: review.userId,
          type: 'SYSTEM_ALERT',
          category: 'SECURITY',
          title: 'Review Policy Notification',
          message: `Your review for "${review.entityTitle || 'item'}" was set to ${newStatus} by content moderation: ${reason || 'Policy guidelines'}.`,
          relatedEntityType: 'MARKETPLACE',
          relatedEntityId: review.entityId,
          actionUrl: '/account/reviews',
          priority: 'NORMAL',
          idempotencyKey: `mod_notif_${reviewId}_${newStatus}`,
        })
        .catch(() => {});
    }

    return review;
  }

  /**
   * Management: Resolve or dismiss review report
   */
  public async resolveReport(
    reportId: string,
    resolution: 'RESOLVED' | 'DISMISSED',
    note: string,
    actorId: string,
    actorEmail: string,
    actorRole: string
  ): Promise<ReviewReport> {
    await this.init();

    const report = this.reportsCache.find((rep) => rep.id === reportId);
    if (!report) {
      throw new Error('Report not found.');
    }

    const now = new Date().toISOString();
    report.status = resolution;
    report.resolvedBy = actorId;
    report.resolutionNote = sanitizeText(note);
    report.resolvedAt = now;

    if (db && auth && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'reviewReports', reportId), {
          status: resolution,
          resolvedBy: actorId,
          resolutionNote: report.resolutionNote,
          resolvedAt: now,
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    // Audit log
    await managementService.recordAuditLog({
      actorId,
      actorEmail,
      actorRole,
      action: 'REPORT_RESOLVED',
      targetType: 'REPORT',
      targetId: reportId,
      newState: { status: resolution, note },
      reason: `Report marked as ${resolution}`,
    });

    return report;
  }
}

export const reviewService = new ReviewService();
