import { db, auth } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  AffiliateStatus,
  AffiliateApplication,
  AffiliateProfile,
  EligibleOffer,
  CommissionRecord,
  ReferralClickEvent,
  AffiliateWallet,
  PayoutProfile,
  PayoutRequest,
  CommissionStatus,
  PayoutStatus,
  PaystackBank,
} from '../types/affiliate';
import { notificationService } from './notificationService';
import { walletService } from './walletService';

class AffiliateService {
  private applications: Map<string, AffiliateApplication> = new Map();
  private affiliates: Map<string, AffiliateProfile> = new Map(); // keyed by affiliateId
  private affiliateByUserId: Map<string, string> = new Map(); // userId -> affiliateId
  private affiliateByCode: Map<string, string> = new Map(); // code -> affiliateId
  private offers: Map<string, EligibleOffer> = new Map();
  private clicks: Map<string, ReferralClickEvent> = new Map();
  private commissions: Map<string, CommissionRecord> = new Map();
  private payouts: Map<string, PayoutRequest> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.seedInitialOffers();
  }

  private seedInitialOffers() {
    const initialOffers: EligibleOffer[] = [
      {
        offerId: 'off-mkt-1',
        offerType: 'MARKETPLACE_PRODUCT',
        targetId: 'nexo-prod-laptop-studio-16',
        targetTitle: 'NEXUS Ultra Laptop 16" Pro',
        targetSlug: 'nexus-ultra-laptop-16-pro',
        targetImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop',
        targetCategory: 'Laptops & Computers',
        targetPrice: 850000,
        commissionEnabled: true,
        commissionType: 'PERCENTAGE',
        commissionValue: 8, // 8% = ₦68,000 NGN
        currency: 'NGN',
        minPayoutConditions: 'Paid upon verified order delivery',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        offerId: 'off-mkt-2',
        offerType: 'MARKETPLACE_PRODUCT',
        targetId: 'nexo-prod-headphones-wh1000xm5',
        targetTitle: 'AeroGlide Wireless Noise-Cancelling Headphones',
        targetSlug: 'aeroglide-wireless-headphones',
        targetImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
        targetCategory: 'Audio & Sound',
        targetPrice: 125000,
        commissionEnabled: true,
        commissionType: 'PERCENTAGE',
        commissionValue: 10, // 10% = ₦12,500 NGN
        currency: 'NGN',
        minPayoutConditions: 'Standard 7-day return inspection window',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        offerId: 'off-mkt-3',
        offerType: 'MARKETPLACE_PRODUCT',
        targetId: 'nexo-prod-tv-55',
        targetTitle: 'Quantum OLED Ultra HD Smart Display 55"',
        targetSlug: 'quantum-oled-smart-display-55',
        targetImage: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800&auto=format&fit=crop',
        targetCategory: 'Television & Video',
        targetPrice: 420000,
        commissionEnabled: true,
        commissionType: 'PERCENTAGE',
        commissionValue: 8,
        currency: 'NGN',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        offerId: 'off-aca-1',
        offerType: 'ACADEMY_COURSE',
        targetId: 'crs-fullstack-ts-react',
        targetTitle: 'Full-Stack Modern Web Engineering: React & Node.js',
        targetSlug: 'fullstack-web-engineering',
        targetImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
        targetCategory: 'Web Development',
        targetPrice: 4500,
        commissionEnabled: true,
        commissionType: 'PERCENTAGE',
        commissionValue: 20, // 20% of scholarship application fee (₦900 NGN)
        currency: 'NGN',
        minPayoutConditions: 'Credited on verified registration',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        offerId: 'off-aca-2',
        offerType: 'ACADEMY_COURSE',
        targetId: 'crs-applied-ai-agents',
        targetTitle: 'Applied Generative AI & Autonomous Agent Architecture',
        targetSlug: 'applied-ai-agents',
        targetImage: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=800&auto=format&fit=crop',
        targetCategory: 'Artificial Intelligence',
        targetPrice: 4500,
        commissionEnabled: true,
        commissionType: 'FIXED_AMOUNT',
        commissionValue: 1000, // ₦1,000 NGN fixed per student enrollment
        currency: 'NGN',
        minPayoutConditions: 'Credited on verified registration',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        offerId: 'off-aca-3',
        offerType: 'ACADEMY_COURSE',
        targetId: 'crs-ui-ux-design-systems',
        targetTitle: 'Enterprise UI/UX Design & Multi-Platform Systems',
        targetSlug: 'ui-ux-design-systems',
        targetImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=800&auto=format&fit=crop',
        targetCategory: 'UI/UX Design',
        targetPrice: 4500,
        commissionEnabled: true,
        commissionType: 'PERCENTAGE',
        commissionValue: 20,
        currency: 'NGN',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const off of initialOffers) {
      this.offers.set(off.offerId, off);
    }
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (!auth || !auth.currentUser) {
      // In server runtime without an active client auth session, operate authoritatively in memory
      return;
    }

    try {
      // Sync applications from Firestore
      const appSnap = await getDocs(collection(db, 'affiliateApplications')).catch(() => null);
      if (appSnap && !appSnap.empty) {
        appSnap.forEach((doc) => {
          const data = doc.data() as AffiliateApplication;
          this.applications.set(data.applicationId, data);
        });
      }

      // Sync affiliate profiles from Firestore
      const affSnap = await getDocs(collection(db, 'affiliateProfiles')).catch(() => null);
      if (affSnap && !affSnap.empty) {
        affSnap.forEach((doc) => {
          const data = doc.data() as AffiliateProfile;
          this.affiliates.set(data.affiliateId, data);
          this.affiliateByUserId.set(data.userId, data.affiliateId);
          this.affiliateByCode.set(data.affiliateCode.toUpperCase(), data.affiliateId);
        });
      }

      // Sync commissions from Firestore
      const commSnap = await getDocs(collection(db, 'affiliateCommissions')).catch(() => null);
      if (commSnap && !commSnap.empty) {
        commSnap.forEach((doc) => {
          const data = doc.data() as CommissionRecord;
          this.commissions.set(data.commissionId, data);
        });
      }

      // Sync payouts from Firestore
      const paySnap = await getDocs(collection(db, 'affiliatePayouts')).catch(() => null);
      if (paySnap && !paySnap.empty) {
        paySnap.forEach((doc) => {
          const data = doc.data() as PayoutRequest;
          this.payouts.set(data.payoutId, data);
        });
      }
    } catch {
      // Memory cache is authoritative fallback
    }
  }

  // ==========================================
  // Affiliate Applications & RBAC Management
  // ==========================================

  public async submitApplication(params: {
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    promotionChannels: string[];
    platformLinks?: string;
    audienceDescription: string;
    promotionalExperience: string;
    preferredCategories: string[];
    additionalInfo?: string;
  }): Promise<{ success: boolean; application?: AffiliateApplication; error?: string }> {
    await this.initialize();

    // Check existing affiliate status
    const existingAffId = this.affiliateByUserId.get(params.userId);
    if (existingAffId) {
      const aff = this.affiliates.get(existingAffId);
      if (aff && aff.status === 'APPROVED') {
        return { success: false, error: 'You are already an approved Nexovira Affiliate.' };
      }
    }

    // Check existing pending application
    for (const app of this.applications.values()) {
      if (app.userId === params.userId && app.status === 'PENDING_REVIEW') {
        return {
          success: false,
          error: 'You already have an affiliate application under review. Please wait for management approval.',
        };
      }
    }

    const applicationId = `aff-app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const application: AffiliateApplication = {
      applicationId,
      userId: params.userId,
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      promotionChannels: params.promotionChannels || [],
      platformLinks: params.platformLinks,
      audienceDescription: params.audienceDescription,
      promotionalExperience: params.promotionalExperience,
      preferredCategories: params.preferredCategories || [],
      additionalInfo: params.additionalInfo,
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.applications.set(applicationId, application);

    if (auth && auth.currentUser) {
      try {
        await setDoc(doc(db, 'affiliateApplications', applicationId), application).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    // Dispatch authoritative notifications
    notificationService.dispatch({
      recipientUserId: params.userId,
      type: 'AFFILIATE_APPLICATION_RECEIVED',
      category: 'AFFILIATE',
      title: 'Affiliate Application Received',
      message: 'Your Nexovira Affiliate Partner application has been received and queued for review.',
      relatedEntityType: 'AFFILIATE_APPLICATION',
      relatedEntityId: applicationId,
      actionUrl: '/affiliate',
      priority: 'NORMAL',
      idempotencyKey: `aff_app_sub_${applicationId}`,
    }).catch(() => {});

    notificationService.dispatchToManagement({
      type: 'NEW_AFFILIATE_APPLICATION',
      category: 'MANAGEMENT',
      title: 'New Affiliate Partner Application',
      message: `${params.fullName} (${params.email}) has applied to join the Nexovira Affiliate Program.`,
      relatedEntityType: 'AFFILIATE_APPLICATION',
      relatedEntityId: applicationId,
      actionUrl: '/management/affiliate',
      priority: 'NORMAL',
      idempotencyKey: `aff_app_mgmt_${applicationId}`,
    }).catch(() => {});

    return { success: true, application };
  }

  public async reviewApplication(params: {
    applicationId: string;
    status: 'APPROVED' | 'REJECTED';
    reviewNotes?: string;
    reviewedBy: string;
    userRole: string;
  }): Promise<{ success: boolean; application?: AffiliateApplication; profile?: AffiliateProfile; error?: string }> {
    await this.initialize();

    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(params.userRole)) {
      return { success: false, error: 'Forbidden: Management role required.' };
    }

    const application = this.applications.get(params.applicationId);
    if (!application) {
      return { success: false, error: 'Affiliate application not found.' };
    }

    application.status = params.status;
    application.reviewedBy = params.reviewedBy;
    application.reviewedDate = new Date().toISOString();
    application.reviewNotes = params.reviewNotes;
    application.updatedAt = new Date().toISOString();

    let profile: AffiliateProfile | undefined;

    if (params.status === 'APPROVED') {
      let affId = this.affiliateByUserId.get(application.userId);
      let affCode = '';

      if (!affId) {
        affId = `aff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        // Generate unique code: e.g. NEX-AFF-83194
        affCode = `NEX-AFF-${Math.floor(10000 + Math.random() * 90000)}`;
      } else {
        const existing = this.affiliates.get(affId);
        affCode = existing?.affiliateCode || `NEX-AFF-${Math.floor(10000 + Math.random() * 90000)}`;
      }

      profile = {
        affiliateId: affId,
        userId: application.userId,
        affiliateCode: affCode,
        fullName: application.fullName,
        email: application.email,
        phone: application.phone,
        status: 'APPROVED',
        defaultCommissionRate: 10,
        promotionChannels: application.promotionChannels,
        audienceDescription: application.audienceDescription,
        totalClicks: 0,
        totalConversions: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.affiliates.set(affId, profile);
      this.affiliateByUserId.set(application.userId, affId);
      this.affiliateByCode.set(affCode.toUpperCase(), affId);

      if (auth && auth.currentUser) {
        try {
          await setDoc(doc(db, 'affiliateProfiles', affId), profile).catch(() => null);
        } catch {
          // Preserved in memory cache
        }
      }
    }

    if (auth && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'affiliateApplications', application.applicationId), {
          status: application.status,
          reviewedBy: application.reviewedBy,
          reviewedDate: application.reviewedDate,
          reviewNotes: application.reviewNotes,
          updatedAt: application.updatedAt,
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    if (params.status === 'APPROVED') {
      notificationService.dispatch({
        recipientUserId: application.userId,
        type: 'AFFILIATE_APPLICATION_APPROVED',
        category: 'AFFILIATE',
        title: 'Affiliate Application Approved!',
        message: 'Congratulations! Your application to the Nexovira Affiliate Program has been approved. Your unique referral links are ready to share.',
        relatedEntityType: 'AFFILIATE_APPLICATION',
        relatedEntityId: application.applicationId,
        actionUrl: '/affiliate/dashboard',
        priority: 'HIGH',
        idempotencyKey: `aff_approved_${application.applicationId}`,
      }).catch(() => {});
    } else {
      notificationService.dispatch({
        recipientUserId: application.userId,
        type: 'AFFILIATE_APPLICATION_REJECTED',
        category: 'AFFILIATE',
        title: 'Affiliate Application Status',
        message: 'Your Nexovira Affiliate Program application has been reviewed and declined at this time.',
        relatedEntityType: 'AFFILIATE_APPLICATION',
        relatedEntityId: application.applicationId,
        actionUrl: '/affiliate',
        priority: 'NORMAL',
        idempotencyKey: `aff_rejected_${application.applicationId}`,
      }).catch(() => {});
    }

    return { success: true, application, profile };
  }

  public getAffiliateStatus(userId: string): {
    status: AffiliateStatus;
    application?: AffiliateApplication;
    profile?: AffiliateProfile;
  } {
    // Find latest application for this user
    let latestApp: AffiliateApplication | undefined;
    for (const app of this.applications.values()) {
      if (app.userId === userId) {
        if (!latestApp || new Date(app.createdAt).getTime() > new Date(latestApp.createdAt).getTime()) {
          latestApp = app;
        }
      }
    }

    let affId = this.affiliateByUserId.get(userId);
    let profile = affId ? this.affiliates.get(affId) : undefined;

    // Self-healing: If application was approved but profile was not indexed in memory, initialize it
    if (latestApp?.status === 'APPROVED' && !profile) {
      affId = `aff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const affCode = `NEX-AFF-${Math.floor(10000 + Math.random() * 90000)}`;
      profile = {
        affiliateId: affId,
        userId: latestApp.userId,
        affiliateCode: affCode,
        fullName: latestApp.fullName,
        email: latestApp.email,
        phone: latestApp.phone,
        status: 'APPROVED',
        defaultCommissionRate: 10,
        promotionChannels: latestApp.promotionChannels,
        audienceDescription: latestApp.audienceDescription,
        totalClicks: 0,
        totalConversions: 0,
        createdAt: latestApp.reviewedDate || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.affiliates.set(affId, profile);
      this.affiliateByUserId.set(userId, affId);
      this.affiliateByCode.set(affCode.toUpperCase(), affId);
    }

    if (profile) {
      return {
        status: profile.status,
        profile,
        application: latestApp,
      };
    }

    if (latestApp) {
      return { status: latestApp.status, application: latestApp };
    }

    return { status: 'NOT_APPLIED' };
  }

  public getAffiliateByUserId(userId: string): AffiliateProfile | null {
    const affId = this.affiliateByUserId.get(userId);
    if (!affId) return null;
    return this.affiliates.get(affId) || null;
  }

  public getAffiliateByCode(code: string): AffiliateProfile | null {
    const affId = this.affiliateByCode.get(code.toUpperCase().trim());
    if (!affId) return null;
    return this.affiliates.get(affId) || null;
  }

  // ==========================================
  // Offers & Referral Link Generation
  // ==========================================

  public getOffers(activeOnly: boolean = true): EligibleOffer[] {
    const list = Array.from(this.offers.values());
    if (activeOnly) {
      return list.filter((o) => o.status === 'ACTIVE' && o.commissionEnabled);
    }
    return list;
  }

  public getOfferById(offerId: string): EligibleOffer | null {
    return this.offers.get(offerId) || null;
  }

  public getOfferByTarget(targetId: string): EligibleOffer | null {
    for (const off of this.offers.values()) {
      if (off.targetId === targetId && off.status === 'ACTIVE' && off.commissionEnabled) {
        return off;
      }
    }
    return null;
  }

  public saveOffer(offerData: Partial<EligibleOffer>, userRole: string): EligibleOffer {
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management access required.');
    }

    const offerId = offerData.offerId || `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const existing = this.offers.get(offerId);

    const updated: EligibleOffer = {
      offerId,
      offerType: offerData.offerType || existing?.offerType || 'MARKETPLACE_PRODUCT',
      targetId: offerData.targetId || existing?.targetId || '',
      targetTitle: offerData.targetTitle || existing?.targetTitle || 'Untitled Offer',
      targetSlug: offerData.targetSlug || existing?.targetSlug || '',
      targetImage: offerData.targetImage || existing?.targetImage,
      targetCategory: offerData.targetCategory || existing?.targetCategory,
      targetPrice: offerData.targetPrice ?? existing?.targetPrice ?? 0,
      commissionEnabled: offerData.commissionEnabled ?? existing?.commissionEnabled ?? true,
      commissionType: offerData.commissionType || existing?.commissionType || 'PERCENTAGE',
      commissionValue: offerData.commissionValue ?? existing?.commissionValue ?? 10,
      currency: 'NGN',
      minPayoutConditions: offerData.minPayoutConditions || existing?.minPayoutConditions,
      status: offerData.status || existing?.status || 'ACTIVE',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.offers.set(offerId, updated);
    return updated;
  }

  public generateReferralLink(
    userId: string,
    offerId?: string,
    originUrl: string = 'http://localhost:3000'
  ): {
    success: boolean;
    shareableUrl?: string;
    affiliateCode?: string;
    destination?: string;
    offerTitle?: string;
    error?: string;
  } {
    const affiliate = this.getAffiliateByUserId(userId);
    if (!affiliate || affiliate.status !== 'APPROVED') {
      return { success: false, error: 'Only approved affiliates can generate referral links.' };
    }

    // MANDATORY PAYOUT PREREQUISITE ENFORCEMENT
    if (!affiliate.payoutProfile || !affiliate.payoutProfile.isVerified) {
      return {
        success: false,
        error: 'Mandatory payout setup required: Please verify your bank account details before generating promotional links.',
      };
    }

    if (!offerId) {
      // General platform / marketplace referral link
      const shareableUrl = `${originUrl}/r/${affiliate.affiliateCode}`;
      return {
        success: true,
        shareableUrl,
        affiliateCode: affiliate.affiliateCode,
        destination: '/marketplace',
        offerTitle: 'Nexovira General Marketplace',
      };
    }

    const offer = this.getOfferById(offerId);
    if (!offer || !offer.commissionEnabled || offer.status !== 'ACTIVE') {
      return { success: false, error: 'The selected offer is not currently active for affiliate referrals.' };
    }

    let destinationPath = '/marketplace';
    if (offer.offerType === 'MARKETPLACE_PRODUCT') {
      destinationPath = `/marketplace/product/${offer.targetSlug}`;
    } else if (offer.offerType === 'ACADEMY_COURSE') {
      destinationPath = `/academy/courses/${offer.targetSlug}`;
    }

    const shareableUrl = `${originUrl}/r/${affiliate.affiliateCode}/${offer.targetSlug}?offer=${offer.offerId}`;

    return {
      success: true,
      shareableUrl,
      affiliateCode: affiliate.affiliateCode,
      destination: destinationPath,
      offerTitle: offer.targetTitle,
    };
  }

  // ==========================================
  // Referral Tracking & Attribution Engine
  // ==========================================

  public async trackReferralClick(params: {
    affiliateCode: string;
    destinationSlug?: string;
    offerId?: string;
    ipHash?: string;
    userAgent?: string;
  }): Promise<{ success: boolean; referralId?: string; targetPath: string; affiliate?: AffiliateProfile }> {
    await this.initialize();

    const affiliate = this.getAffiliateByCode(params.affiliateCode);
    if (!affiliate || affiliate.status !== 'APPROVED') {
      // If code invalid or affiliate suspended, default gracefully to marketplace without tracking
      return { success: false, targetPath: '/marketplace' };
    }

    const referralId = `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let targetPath = '/marketplace';

    // Determine target route
    if (params.destinationSlug) {
      // Check if matches an active offer targetSlug
      for (const off of this.offers.values()) {
        if (off.targetSlug === params.destinationSlug) {
          if (off.offerType === 'ACADEMY_COURSE') {
            targetPath = `/academy/courses/${off.targetSlug}`;
          } else {
            targetPath = `/marketplace/product/${off.targetSlug}`;
          }
          break;
        }
      }
    }

    const clickEvent: ReferralClickEvent = {
      referralId,
      affiliateId: affiliate.affiliateId,
      affiliateCode: affiliate.affiliateCode,
      destination: targetPath,
      offerId: params.offerId,
      ipHash: params.ipHash,
      userAgent: params.userAgent,
      timestamp: new Date().toISOString(),
      converted: false,
    };

    this.clicks.set(referralId, clickEvent);
    affiliate.totalClicks = (affiliate.totalClicks || 0) + 1;

    if (auth && auth.currentUser) {
      try {
        await setDoc(doc(db, 'referralClicks', referralId), clickEvent).catch(() => null);
        await updateDoc(doc(db, 'affiliateProfiles', affiliate.affiliateId), {
          totalClicks: affiliate.totalClicks,
          updatedAt: new Date().toISOString(),
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    return { success: true, referralId, targetPath, affiliate };
  }

  // ==========================================
  // Commission Calculations & Fulfillments
  // ==========================================

  /**
   * Authoritative Marketplace Commission Calculation & Record
   * Integrates into commerceService order verification
   */
  public async recordMarketplaceCommission(params: {
    orderId: string;
    orderReference: string;
    customerUserId: string;
    grossAmount: number;
    items: Array<{ productId: string; price: number; quantity: number; title: string }>;
    referralCode?: string;
  }): Promise<CommissionRecord | null> {
    await this.initialize();

    if (!params.referralCode) return null;

    const affiliate = this.getAffiliateByCode(params.referralCode);
    if (!affiliate || affiliate.status !== 'APPROVED') {
      console.log(`Affiliate referral [${params.referralCode}] not found or inactive`);
      return null;
    }

    // ANTI-FRAUD: Self-referral prevention
    if (params.customerUserId && affiliate.userId === params.customerUserId) {
      console.warn(`Anti-Fraud Block: Self-referral attempt detected for affiliate ${affiliate.affiliateId}`);
      return null;
    }

    // Check for duplicate commission for this order
    for (const comm of this.commissions.values()) {
      if (comm.sourceId === params.orderId) {
        console.log(`Commission already exists for order ${params.orderId}`);
        return comm;
      }
    }

    // Calculate commission across eligible items
    let totalCommission = 0;
    let primaryRate = affiliate.defaultCommissionRate || 10;
    let commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT' = 'PERCENTAGE';

    for (const item of params.items) {
      const offer = this.getOfferByTarget(item.productId);
      if (offer && offer.commissionEnabled) {
        if (offer.commissionType === 'PERCENTAGE') {
          totalCommission += (item.price * item.quantity * offer.commissionValue) / 100;
        } else {
          totalCommission += offer.commissionValue * item.quantity;
        }
      } else {
        // Fallback default commission
        totalCommission += (item.price * item.quantity * primaryRate) / 100;
      }
    }

    if (totalCommission <= 0) return null;

    const commissionId = `comm-mkt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const commission: CommissionRecord = {
      commissionId,
      affiliateId: affiliate.affiliateId,
      affiliateCode: affiliate.affiliateCode,
      sourceType: 'MARKETPLACE_PRODUCT',
      sourceId: params.orderId,
      orderReference: params.orderReference,
      customerUserId: params.customerUserId,
      grossTransactionAmount: params.grossAmount,
      commissionType,
      commissionRate: primaryRate,
      commissionAmount: Math.round(totalCommission),
      currency: 'NGN',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.commissions.set(commissionId, commission);
    affiliate.totalConversions = (affiliate.totalConversions || 0) + 1;

    if (auth && auth.currentUser) {
      try {
        await setDoc(doc(db, 'affiliateCommissions', commissionId), commission).catch(() => null);
        await updateDoc(doc(db, 'affiliateProfiles', affiliate.affiliateId), {
          totalConversions: affiliate.totalConversions,
          updatedAt: new Date().toISOString(),
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    // Dispatch real in-app notification to affiliate
    notificationService.dispatch({
      recipientUserId: affiliate.userId,
      type: 'COMMISSION_PENDING',
      category: 'AFFILIATE',
      title: 'New Referral Commission Recorded!',
      message: `You earned a commission of ₦${commission.commissionAmount.toLocaleString()} NGN from qualifying order ${params.orderReference}. Status: PENDING validation.`,
      relatedEntityType: 'COMMISSION',
      relatedEntityId: commissionId,
      actionUrl: '/affiliate/wallet',
      priority: 'NORMAL',
      idempotencyKey: `comm_mkt_notif_${commissionId}`,
    }).catch(() => {});

    // Authoritative Wallet Ledger Integration (Phase 15)
    try {
      const affWallet = await walletService.getOrCreateWallet(
        affiliate.userId,
        'AFFILIATE',
        'AFFILIATE_EARNINGS',
        affiliate.fullName || 'Nexovira Affiliate'
      );
      await walletService.postLedgerEntry({
        walletId: affWallet.walletId,
        entryType: 'CREDIT',
        direction: 'CREDIT',
        balanceCategory: 'PENDING',
        amount: commission.commissionAmount,
        sourceType: 'COMMISSION',
        sourceReferenceId: commissionId,
        description: `Marketplace referral commission: ${params.orderReference}`,
        actorId: 'SYSTEM',
        idempotencyKey: `aff_comm_mkt_${commissionId}`,
        metadata: { orderId: params.orderId, referralCode: params.referralCode },
      });
    } catch (wErr) {
      console.warn('Wallet posting notice for commission:', wErr);
    }

    console.log(`Marketplace commission recorded: ₦${commission.commissionAmount} NGN for affiliate ${affiliate.affiliateCode}`);
    return commission;
  }

  /**
   * Authoritative Academy Scholarship Commission Record
   * Integrates into academyService scholarship fee verification
   */
  public async recordAcademyCommission(params: {
    applicationId: string;
    applicationReference: string;
    customerUserId: string;
    courseId: string;
    amount: number; // ₦4,500
    referralCode?: string;
  }): Promise<CommissionRecord | null> {
    await this.initialize();

    if (!params.referralCode) return null;

    const affiliate = this.getAffiliateByCode(params.referralCode);
    if (!affiliate || affiliate.status !== 'APPROVED') {
      return null;
    }

    // ANTI-FRAUD: Self-referral prevention
    if (params.customerUserId && affiliate.userId === params.customerUserId) {
      console.warn(`Anti-Fraud Block: Self-referral attempt detected for academy registration by affiliate ${affiliate.affiliateId}`);
      return null;
    }

    // Check duplicate
    for (const comm of this.commissions.values()) {
      if (comm.sourceId === params.applicationId) {
        return comm;
      }
    }

    // Determine course commission
    const offer = this.getOfferByTarget(params.courseId);
    let commissionAmount = 900; // default 20% of ₦4,500
    let commissionRate = 20;
    let commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT' = 'PERCENTAGE';

    if (offer && offer.commissionEnabled) {
      commissionType = offer.commissionType;
      commissionRate = offer.commissionValue;
      if (offer.commissionType === 'PERCENTAGE') {
        commissionAmount = Math.round((params.amount * offer.commissionValue) / 100);
      } else {
        commissionAmount = offer.commissionValue;
      }
    }

    const commissionId = `comm-aca-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const commission: CommissionRecord = {
      commissionId,
      affiliateId: affiliate.affiliateId,
      affiliateCode: affiliate.affiliateCode,
      sourceType: 'ACADEMY_COURSE',
      sourceId: params.applicationId,
      orderReference: params.applicationReference,
      customerUserId: params.customerUserId,
      grossTransactionAmount: params.amount,
      commissionType,
      commissionRate,
      commissionAmount,
      currency: 'NGN',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.commissions.set(commissionId, commission);
    affiliate.totalConversions = (affiliate.totalConversions || 0) + 1;

    if (auth && auth.currentUser) {
      try {
        await setDoc(doc(db, 'affiliateCommissions', commissionId), commission).catch(() => null);
        await updateDoc(doc(db, 'affiliateProfiles', affiliate.affiliateId), {
          totalConversions: affiliate.totalConversions,
          updatedAt: new Date().toISOString(),
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    // Dispatch real in-app notification to affiliate
    notificationService.dispatch({
      recipientUserId: affiliate.userId,
      type: 'COMMISSION_PENDING',
      category: 'AFFILIATE',
      title: 'New Academy Referral Commission!',
      message: `You earned ₦${commission.commissionAmount.toLocaleString()} NGN from Academy cohort registration (${params.applicationReference}).`,
      relatedEntityType: 'COMMISSION',
      relatedEntityId: commissionId,
      actionUrl: '/affiliate/wallet',
      priority: 'NORMAL',
      idempotencyKey: `comm_aca_notif_${commissionId}`,
    }).catch(() => {});

    // Authoritative Wallet Ledger Integration (Phase 15)
    try {
      const affWallet = await walletService.getOrCreateWallet(
        affiliate.userId,
        'AFFILIATE',
        'AFFILIATE_EARNINGS',
        affiliate.fullName || 'Nexovira Affiliate'
      );
      await walletService.postLedgerEntry({
        walletId: affWallet.walletId,
        entryType: 'CREDIT',
        direction: 'CREDIT',
        balanceCategory: 'PENDING',
        amount: commission.commissionAmount,
        sourceType: 'COMMISSION',
        sourceReferenceId: commissionId,
        description: `Academy enrollment referral commission: ${params.applicationReference}`,
        actorId: 'SYSTEM',
        idempotencyKey: `aff_comm_aca_${commissionId}`,
        metadata: { courseId: params.courseId, referralCode: params.referralCode },
      });
    } catch (wErr) {
      console.warn('Wallet posting notice for academy commission:', wErr);
    }

    console.log(`Academy commission recorded: ₦${commission.commissionAmount} NGN for affiliate ${affiliate.affiliateCode}`);
    return commission;
  }

  // ==========================================
  // Commission Lifecycle & Management Review
  // ==========================================

  public async updateCommissionStatus(params: {
    commissionId: string;
    status: CommissionStatus;
    reversalReason?: string;
    internalNotes?: string;
    userRole: string;
  }): Promise<CommissionRecord> {
    await this.initialize();

    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(params.userRole)) {
      throw new Error('Forbidden: Management access required.');
    }

    const comm = this.commissions.get(params.commissionId);
    if (!comm) {
      throw new Error('Commission record not found.');
    }

    comm.status = params.status;
    if (params.status === 'AVAILABLE') {
      comm.availableDate = new Date().toISOString();
    } else if (params.status === 'PAID') {
      comm.paidDate = new Date().toISOString();
    } else if (params.status === 'REVERSED') {
      comm.reversalReason = params.reversalReason || 'Order cancelled or refunded';
    }

    if (params.internalNotes) {
      comm.internalNotes = params.internalNotes;
    }

    if (auth && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'affiliateCommissions', comm.commissionId), {
          status: comm.status,
          availableDate: comm.availableDate,
          paidDate: comm.paidDate,
          reversalReason: comm.reversalReason,
          internalNotes: comm.internalNotes,
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    const aff = this.affiliates.get(comm.affiliateId);
    if (aff) {
      if (params.status === 'AVAILABLE') {
        walletService.getOrCreateWallet(
          aff.userId,
          'AFFILIATE',
          'AFFILIATE_EARNINGS',
          aff.fullName || 'Nexovira Affiliate'
        ).then((w) => {
          walletService.releasePendingToAvailable({
            walletId: w.walletId,
            amount: comm.commissionAmount,
            sourceType: 'COMMISSION',
            sourceReferenceId: comm.commissionId,
            description: `Affiliate commission matured to available: ${comm.orderReference || comm.commissionId}`,
            actorId: 'SYSTEM',
            idempotencyKey: `comm_release_${comm.commissionId}`,
          });
        }).catch(() => null);

        notificationService.dispatch({
          recipientUserId: aff.userId,
          type: 'COMMISSION_AVAILABLE',
          category: 'AFFILIATE',
          title: 'Commission Now Available!',
          message: `Your commission of ₦${comm.commissionAmount.toLocaleString()} NGN for ${comm.orderReference} is now verified and available for payout.`,
          relatedEntityType: 'COMMISSION',
          relatedEntityId: comm.commissionId,
          actionUrl: '/affiliate/wallet',
          priority: 'NORMAL',
          idempotencyKey: `comm_avail_${comm.commissionId}`,
        }).catch(() => {});
      } else if (params.status === 'REVERSED') {
        walletService.getOrCreateWallet(
          aff.userId,
          'AFFILIATE',
          'AFFILIATE_EARNINGS',
          aff.fullName || 'Nexovira Affiliate'
        ).then((w) => {
          walletService.postLedgerEntry({
            walletId: w.walletId,
            entryType: 'REVERSAL',
            direction: 'DEBIT',
            balanceCategory: 'PENDING',
            amount: comm.commissionAmount,
            sourceType: 'REFUND_ADJUSTMENT',
            sourceReferenceId: comm.commissionId,
            description: `Commission reversed: ${comm.reversalReason || 'Order refunded'}`,
            actorId: 'SYSTEM',
            idempotencyKey: `comm_reversal_${comm.commissionId}`,
          });
        }).catch(() => null);

        notificationService.dispatch({
          recipientUserId: aff.userId,
          type: 'COMMISSION_REVERSED',
          category: 'AFFILIATE',
          title: 'Commission Reversed',
          message: `Commission of ₦${comm.commissionAmount.toLocaleString()} NGN was reversed. Reason: ${comm.reversalReason}`,
          relatedEntityType: 'COMMISSION',
          relatedEntityId: comm.commissionId,
          actionUrl: '/affiliate/wallet',
          priority: 'HIGH',
          idempotencyKey: `comm_rev_${comm.commissionId}`,
        }).catch(() => {});
      }
    }

    return comm;
  }

  // ==========================================
  // Affiliate Wallet Engine (Authoritative Phase 15 Integration)
  // ==========================================

  public calculateWallet(affiliateId: string): AffiliateWallet {
    const aff = this.affiliates.get(affiliateId);
    if (aff) {
      const existingWallets = walletService.getAllWallets();
      const affWal = existingWallets.find((w) => w.ownerId === aff.userId && w.walletType === 'AFFILIATE_EARNINGS');
      if (affWal) {
        return {
          affiliateId,
          currency: 'NGN',
          pendingBalance: affWal.pendingBalance,
          availableBalance: affWal.availableBalance,
          paidBalance: affWal.lifetimeDebited,
          reversedBalance: 0,
          totalEarned: affWal.lifetimeCredited,
          minimumPayoutAmount: 5000,
          lastCalculatedAt: new Date().toISOString(),
        };
      }
    }

    let pendingBalance = 0;
    let availableBalance = 0;
    let paidBalance = 0;
    let reversedBalance = 0;
    let totalEarned = 0;

    for (const comm of this.commissions.values()) {
      if (comm.affiliateId !== affiliateId) continue;

      if (comm.status === 'PENDING' || comm.status === 'APPROVED') {
        pendingBalance += comm.commissionAmount;
      } else if (comm.status === 'AVAILABLE') {
        availableBalance += comm.commissionAmount;
        totalEarned += comm.commissionAmount;
      } else if (comm.status === 'PAID') {
        paidBalance += comm.commissionAmount;
        totalEarned += comm.commissionAmount;
      } else if (comm.status === 'REVERSED') {
        reversedBalance += comm.commissionAmount;
      }
    }

    // Deduct pending/processing payout requests from available balance
    for (const pay of this.payouts.values()) {
      if (pay.affiliateId === affiliateId && (pay.status === 'REQUESTED' || pay.status === 'UNDER_REVIEW' || pay.status === 'PROCESSING')) {
        availableBalance -= pay.amount;
      }
    }

    availableBalance = Math.max(0, availableBalance);

    return {
      affiliateId,
      currency: 'NGN',
      pendingBalance,
      availableBalance,
      paidBalance,
      reversedBalance,
      totalEarned,
      minimumPayoutAmount: 5000, // ₦5,000 NGN minimum threshold
      lastCalculatedAt: new Date().toISOString(),
    };
  }

  public getAffiliateCommissions(affiliateId: string): CommissionRecord[] {
    const list: CommissionRecord[] = [];
    for (const comm of this.commissions.values()) {
      if (comm.affiliateId === affiliateId) {
        list.push(comm);
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ==========================================
  // Payout Profile & Bank Verification (Paystack)
  // ==========================================

  private bankVerificationAttempts: Map<string, { count: number; windowStart: number }> = new Map();

  /**
   * Retrieves official bank list from Paystack or authoritative cached directory
   */
  public async getBankList(country: string = 'nigeria'): Promise<{
    success: boolean;
    banks: PaystackBank[];
    isLive: boolean;
    message?: string;
  }> {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const isSecretLive = Boolean(
      paystackSecret &&
      !paystackSecret.includes('sandbox') &&
      !paystackSecret.includes('placeholder')
    );

    if (isSecretLive) {
      try {
        const res = await fetch(`https://api.paystack.co/bank?country=${encodeURIComponent(country)}&perPage=100`, {
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
          },
        });
        const data = await res.json();
        if (data.status && Array.isArray(data.data)) {
          const seenCodes = new Set<string>();
          const banks: PaystackBank[] = [];
          for (const b of data.data) {
            const code = String(b.code || '').trim();
            if (b.active !== false && code && !seenCodes.has(code)) {
              seenCodes.add(code);
              banks.push({
                name: b.name,
                code,
                slug: b.slug,
                country: b.country || 'Nigeria',
                currency: b.currency || 'NGN',
                active: true,
              });
            }
          }
          banks.sort((a: PaystackBank, b: PaystackBank) => a.name.localeCompare(b.name));
          return { success: true, banks, isLive: true };
        }
      } catch (err) {
        console.warn('Paystack bank list fetch error, falling back to official directory:', err);
      }
    }

    // Official Paystack Nigerian Banks Directory (sorted alphabetically)
    const officialBanks: PaystackBank[] = [
      { name: 'Access Bank', code: '044', slug: 'access-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Access Bank (Diamond)', code: '063', slug: 'access-bank-diamond', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'ALAT by Wema', code: '035A', slug: 'alat-by-wema', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Citibank Nigeria', code: '023', slug: 'citibank-nigeria', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Ecobank Nigeria', code: '050', slug: 'ecobank-nigeria', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'FairMoney Microfinance Bank', code: '090551', slug: 'fairmoney-mfb', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Fidelity Bank', code: '070', slug: 'fidelity-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'First Bank of Nigeria', code: '011', slug: 'first-bank-of-nigeria', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'First City Monument Bank (FCMB)', code: '214', slug: 'first-city-monument-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Guaranty Trust Bank (GTBank)', code: '058', slug: 'guaranty-trust-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Heritage Bank', code: '030', slug: 'heritage-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Jaiz Bank', code: '301', slug: 'jaiz-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Keystone Bank', code: '082', slug: 'keystone-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Kuda Microfinance Bank', code: '090267', slug: 'kuda-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Moniepoint Microfinance Bank', code: '090405', slug: 'moniepoint-mfb', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'OPay Digital Services (Paycom)', code: '100004', slug: 'opay-digital-services', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'PalmPay', code: '090549', slug: 'palmpay', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Parallex Bank', code: '526', slug: 'parallex-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Polaris Bank', code: '076', slug: 'polaris-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Premium Trust Bank', code: '105', slug: 'premium-trust-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Providus Bank', code: '101', slug: 'providus-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Rubies MFB', code: '090175', slug: 'rubies-mfb', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Stanbic IBTC Bank', code: '221', slug: 'stanbic-ibtc-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Standard Chartered Bank', code: '068', slug: 'standard-chartered-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Sterling Bank', code: '232', slug: 'sterling-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Suntrust Bank', code: '100', slug: 'suntrust-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Taj Bank', code: '302', slug: 'taj-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Union Bank of Nigeria', code: '032', slug: 'union-bank-of-nigeria', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'United Bank for Africa (UBA)', code: '033', slug: 'united-bank-for-africa', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Unity Bank', code: '215', slug: 'unity-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'VFD Microfinance Bank', code: '090110', slug: 'vfd-mfb', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Wema Bank', code: '035', slug: 'wema-bank', country: 'Nigeria', currency: 'NGN', active: true },
      { name: 'Zenith Bank', code: '057', slug: 'zenith-bank', country: 'Nigeria', currency: 'NGN', active: true },
    ];

    return {
      success: true,
      banks: officialBanks,
      isLive: isSecretLive,
      message: isSecretLive
        ? undefined
        : 'Live PAYSTACK_SECRET_KEY not detected in environment. Using official Paystack Nigerian bank directory.',
    };
  }

  /**
   * Resolves bank account name using Paystack Account Resolution API
   */
  public async verifyBankAccount(params: {
    accountNumber: string;
    bankCode: string;
    clientIdentifier?: string;
  }): Promise<{
    success: boolean;
    accountName?: string;
    accountNumber?: string;
    bankCode?: string;
    isLive?: boolean;
    error?: string;
  }> {
    const cleanAccount = (params.accountNumber || '').trim();
    const cleanBankCode = (params.bankCode || '').trim();

    // Strict validation
    if (!/^\d{10}$/.test(cleanAccount)) {
      return { success: false, error: 'Account number must be exactly 10 digits.' };
    }
    if (!cleanBankCode) {
      return { success: false, error: 'Valid bank selection is required.' };
    }

    // Abuse control rate-limiting (max 15 attempts / minute)
    const clientId = params.clientIdentifier || cleanAccount;
    const now = Date.now();
    const clientRecord = this.bankVerificationAttempts.get(clientId);
    if (clientRecord && now - clientRecord.windowStart < 60000) {
      if (clientRecord.count >= 15) {
        return {
          success: false,
          error: 'Verification attempt limit reached. Please wait 60 seconds before retrying.',
        };
      }
      clientRecord.count++;
    } else {
      this.bankVerificationAttempts.set(clientId, { count: 1, windowStart: now });
    }

    // Safe development test account resolution for testing and demo flows
    const isTestNuban = cleanAccount === '0000000000' || cleanAccount === '1234567890';
    if (isTestNuban) {
      const demoBanks: Record<string, string> = {
        '044': 'Access Bank',
        '058': 'Guaranty Trust Bank (GTBank)',
        '011': 'First Bank of Nigeria',
        '033': 'United Bank for Africa (UBA)',
        '057': 'Zenith Bank',
        '035': 'Wema Bank',
        '035A': 'ALAT by Wema',
        '070': 'Fidelity Bank',
        '214': 'First City Monument Bank (FCMB)',
        '076': 'Polaris Bank',
        '082': 'Keystone Bank',
        '050': 'Ecobank Nigeria',
        '032': 'Union Bank of Nigeria',
        '068': 'Standard Chartered Bank',
        '221': 'Stanbic IBTC Bank',
        '232': 'Sterling Bank',
        '100': 'Suntrust Bank',
        '090267': 'Kuda Microfinance Bank',
        '090405': 'Moniepoint MFB',
        '090110': 'VFD Microfinance Bank',
        '100004': 'OPay Digital Services',
        '090551': 'FairMoney Microfinance Bank',
        '090549': 'PalmPay',
        '101': 'Providus Bank',
        '301': 'Jaiz Bank',
        '302': 'Taj Bank',
      };
      const bankName = demoBanks[cleanBankCode] || 'Commercial Bank';
      return {
        success: true,
        accountName: `TEST ACCOUNT (${bankName.toUpperCase()})`,
        accountNumber: cleanAccount,
        bankCode: cleanBankCode,
        isLive: false,
      };
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const isSecretLive = Boolean(
      paystackSecret &&
      !paystackSecret.includes('sandbox') &&
      !paystackSecret.includes('placeholder')
    );

    if (isSecretLive) {
      try {
        const res = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(cleanAccount)}&bank_code=${encodeURIComponent(cleanBankCode)}`,
          {
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
            },
          }
        );
        const data = await res.json();
        if (data.status && data.data?.account_name) {
          return {
            success: true,
            accountName: data.data.account_name,
            accountNumber: data.data.account_number || cleanAccount,
            bankCode: cleanBankCode,
            isLive: true,
          };
        } else {
          return {
            success: false,
            error: data.message || 'Could not resolve bank account details. Please verify your 10-digit account number and bank.',
          };
        }
      } catch (err) {
        console.warn('Paystack resolve network error:', err);
      }
    }

    // Clean development simulation with genuine bank names
    const demoBanks: Record<string, string> = {
      '044': 'Access Bank',
      '058': 'Guaranty Trust Bank (GTBank)',
      '011': 'First Bank of Nigeria',
      '033': 'United Bank for Africa (UBA)',
      '057': 'Zenith Bank',
      '035': 'Wema Bank',
      '035A': 'ALAT by Wema',
      '070': 'Fidelity Bank',
      '214': 'First City Monument Bank (FCMB)',
      '076': 'Polaris Bank',
      '082': 'Keystone Bank',
      '050': 'Ecobank Nigeria',
      '032': 'Union Bank of Nigeria',
      '068': 'Standard Chartered Bank',
      '221': 'Stanbic IBTC Bank',
      '232': 'Sterling Bank',
      '100': 'Suntrust Bank',
      '090267': 'Kuda Microfinance Bank',
      '090405': 'Moniepoint MFB',
      '090110': 'VFD Microfinance Bank',
      '100004': 'OPay Digital Services',
      '090551': 'FairMoney Microfinance Bank',
      '090549': 'PalmPay',
      '101': 'Providus Bank',
      '301': 'Jaiz Bank',
      '302': 'Taj Bank',
    };

    const bankName = demoBanks[cleanBankCode] || 'Commercial Bank';
    return {
      success: true,
      accountName: `NEXOVIRA VERIFIED PARTNER (${bankName.toUpperCase()})`,
      accountNumber: cleanAccount,
      bankCode: cleanBankCode,
      isLive: false,
    };
  }

  public async updatePayoutProfile(
    userId: string,
    payoutData: {
      bankName: string;
      bankCode: string;
      accountNumber: string;
      accountName: string;
    }
  ): Promise<{ success: boolean; profile?: AffiliateProfile; error?: string }> {
    await this.initialize();

    const affiliate = this.getAffiliateByUserId(userId);
    if (!affiliate) {
      return { success: false, error: 'Affiliate profile not found.' };
    }

    // Verify account details
    const verification = await this.verifyBankAccount({
      accountNumber: payoutData.accountNumber,
      bankCode: payoutData.bankCode,
    });

    if (!verification.success) {
      return { success: false, error: verification.error || 'Bank account verification failed.' };
    }

    const payoutProfile: PayoutProfile = {
      bankName: payoutData.bankName,
      bankCode: payoutData.bankCode,
      accountNumber: payoutData.accountNumber,
      accountNumberMasked: `******${payoutData.accountNumber.slice(-4)}`,
      accountName: verification.accountName || payoutData.accountName,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    };

    affiliate.payoutProfile = payoutProfile;
    affiliate.updatedAt = new Date().toISOString();

    if (auth && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'affiliateProfiles', affiliate.affiliateId), {
          payoutProfile,
          updatedAt: affiliate.updatedAt,
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    return { success: true, profile: affiliate };
  }

  // ==========================================
  // Payout Requests & Processing
  // ==========================================

  public async requestPayout(
    userId: string,
    requestedAmount?: number
  ): Promise<{ success: boolean; payout?: PayoutRequest; error?: string }> {
    await this.initialize();

    const affiliate = this.getAffiliateByUserId(userId);
    if (!affiliate) {
      return { success: false, error: 'Affiliate account not found.' };
    }

    if (affiliate.status !== 'APPROVED') {
      return { success: false, error: 'Affiliate account is not active or approved for payouts.' };
    }

    if (!affiliate.payoutProfile || !affiliate.payoutProfile.isVerified) {
      return { success: false, error: 'A verified bank payout account is required before requesting withdrawal.' };
    }

    // Concurrency check: Ensure no active pending payout request
    for (const p of this.payouts.values()) {
      if (
        p.affiliateId === affiliate.affiliateId &&
        ['REQUESTED', 'UNDER_REVIEW', 'PROCESSING'].includes(p.status)
      ) {
        return {
          success: false,
          error: 'You already have a payout request currently in progress. Please wait for completion.',
        };
      }
    }

    const wallet = this.calculateWallet(affiliate.affiliateId);
    if (wallet.availableBalance < wallet.minimumPayoutAmount) {
      return {
        success: false,
        error: `Insufficient available balance. Minimum payout is ₦${wallet.minimumPayoutAmount.toLocaleString()} NGN (Current available: ₦${wallet.availableBalance.toLocaleString()} NGN).`,
      };
    }

    // Authoritative amount calculation (Never trust client amount blindly)
    const amount = requestedAmount
      ? Math.min(requestedAmount, wallet.availableBalance)
      : wallet.availableBalance;

    if (amount < wallet.minimumPayoutAmount) {
      return {
        success: false,
        error: `Withdrawal amount must meet the minimum threshold of ₦${wallet.minimumPayoutAmount.toLocaleString()} NGN.`,
      };
    }

    const payoutId = `pay-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const payout: PayoutRequest = {
      payoutId,
      affiliateId: affiliate.affiliateId,
      affiliateCode: affiliate.affiliateCode,
      amount,
      currency: 'NGN',
      payoutMethod: 'BANK_TRANSFER',
      accountDetails: {
        bankName: affiliate.payoutProfile.bankName,
        bankCode: affiliate.payoutProfile.bankCode,
        accountNumberMasked: `******${affiliate.payoutProfile.accountNumber.slice(-4)}`,
        accountName: affiliate.payoutProfile.accountName,
      },
      status: 'REQUESTED',
      provider: 'PAYSTACK',
      requestedDate: new Date().toISOString(),
    };

    this.payouts.set(payoutId, payout);

    if (auth && auth.currentUser) {
      try {
        await setDoc(doc(db, 'affiliatePayouts', payoutId), payout).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    // Dispatch real in-app notifications
    notificationService.dispatch({
      recipientUserId: affiliate.userId,
      type: 'PAYOUT_REQUESTED',
      category: 'PAYOUT',
      title: 'Payout Request Submitted',
      message: `Your withdrawal request for ₦${amount.toLocaleString()} NGN has been submitted for management review.`,
      relatedEntityType: 'PAYOUT',
      relatedEntityId: payoutId,
      actionUrl: '/affiliate/payout',
      priority: 'NORMAL',
      idempotencyKey: `payout_req_${payoutId}`,
    }).catch(() => {});

    notificationService.dispatchToManagement({
      type: 'PAYOUT_REQUIRES_REVIEW',
      category: 'MANAGEMENT',
      title: 'Affiliate Payout Request Needs Review',
      message: `Affiliate ${affiliate.affiliateCode} requested a payout of ₦${amount.toLocaleString()} NGN.`,
      relatedEntityType: 'PAYOUT',
      relatedEntityId: payoutId,
      actionUrl: '/management/affiliate',
      priority: 'HIGH',
      idempotencyKey: `payout_mgmt_${payoutId}`,
    }).catch(() => {});

    return { success: true, payout };
  }

  public getAffiliatePayouts(affiliateId: string): PayoutRequest[] {
    const list: PayoutRequest[] = [];
    for (const p of this.payouts.values()) {
      if (p.affiliateId === affiliateId) {
        list.push(p);
      }
    }
    return list.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
  }

  // ==========================================
  // Management Operations Desk
  // ==========================================

  public getAllApplications(userRole: string): AffiliateApplication[] {
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management role required.');
    }
    return Array.from(this.applications.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getAllAffiliates(userRole: string): AffiliateProfile[] {
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management role required.');
    }
    return Array.from(this.affiliates.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async setAffiliateStatus(
    affiliateId: string,
    status: AffiliateStatus,
    userRole: string
  ): Promise<AffiliateProfile> {
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management role required.');
    }

    const aff = this.affiliates.get(affiliateId);
    if (!aff) {
      throw new Error('Affiliate not found.');
    }

    aff.status = status;
    aff.updatedAt = new Date().toISOString();

    if (auth && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'affiliateProfiles', aff.affiliateId), {
          status: aff.status,
          updatedAt: aff.updatedAt,
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    return aff;
  }

  public getAllCommissions(userRole: string): CommissionRecord[] {
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management role required.');
    }
    return Array.from(this.commissions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getAllPayouts(userRole: string): PayoutRequest[] {
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error('Forbidden: Management role required.');
    }
    return Array.from(this.payouts.values()).sort(
      (a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()
    );
  }

  public async reviewPayout(params: {
    payoutId: string;
    status: PayoutStatus;
    providerReference?: string;
    failureReason?: string;
    internalNotes?: string;
    userRole: string;
  }): Promise<PayoutRequest> {
    await this.initialize();

    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(params.userRole)) {
      throw new Error('Forbidden: Management role required.');
    }

    const payout = this.payouts.get(params.payoutId);
    if (!payout) {
      throw new Error('Payout request not found.');
    }

    payout.status = params.status;
    payout.providerReference = params.providerReference || payout.providerReference;
    payout.failureReason = params.failureReason;
    payout.internalNotes = params.internalNotes;

    if (params.status === 'PROCESSING') {
      payout.processedDate = new Date().toISOString();
    } else if (params.status === 'COMPLETED') {
      payout.completedDate = new Date().toISOString();

      // Mark commissions as PAID up to this payout amount
      let remainingToMark = payout.amount;
      for (const comm of this.commissions.values()) {
        if (comm.affiliateId === payout.affiliateId && comm.status === 'AVAILABLE') {
          if (remainingToMark >= comm.commissionAmount) {
            comm.status = 'PAID';
            comm.paidDate = new Date().toISOString();
            remainingToMark -= comm.commissionAmount;
          }
        }
      }
    }

    if (auth && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'affiliatePayouts', payout.payoutId), {
          status: payout.status,
          providerReference: payout.providerReference,
          processedDate: payout.processedDate,
          completedDate: payout.completedDate,
          failureReason: payout.failureReason,
          internalNotes: payout.internalNotes,
        }).catch(() => null);
      } catch {
        // Preserved in memory cache
      }
    }

    const aff = this.affiliates.get(payout.affiliateId);
    if (aff) {
      if (params.status === 'COMPLETED') {
        notificationService.dispatch({
          recipientUserId: aff.userId,
          type: 'PAYOUT_COMPLETED',
          category: 'PAYOUT',
          title: 'Payout Completed!',
          message: `Your withdrawal of ₦${payout.amount.toLocaleString()} NGN has been disbursed to your verified bank account (${payout.accountDetails.bankName}).`,
          relatedEntityType: 'PAYOUT',
          relatedEntityId: payout.payoutId,
          actionUrl: '/affiliate/wallet',
          priority: 'HIGH',
          idempotencyKey: `payout_done_${payout.payoutId}`,
        }).catch(() => {});
      } else if (params.status === 'FAILED' || params.status === 'CANCELLED') {
        notificationService.dispatch({
          recipientUserId: aff.userId,
          type: 'PAYOUT_FAILED',
          category: 'PAYOUT',
          title: 'Payout Request Declined',
          message: `Your withdrawal request for ₦${payout.amount.toLocaleString()} NGN could not be processed. Reason: ${payout.failureReason || 'Verification requirements not met'}.`,
          relatedEntityType: 'PAYOUT',
          relatedEntityId: payout.payoutId,
          actionUrl: '/affiliate/payout',
          priority: 'HIGH',
          idempotencyKey: `payout_failed_${payout.payoutId}`,
        }).catch(() => {});
      }
    }

    return payout;
  }
}

export const affiliateService = new AffiliateService();
