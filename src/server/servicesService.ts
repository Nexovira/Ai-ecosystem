import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ServiceCategory,
  ExpertProfile,
  PublicExpert,
  ProjectRequest,
  ProjectUpdate,
  ExpertApplication,
  ServiceRequestSubmissionPayload,
  ProjectRequestStatus,
  ExpertAvailability,
  ExpertVerificationStatus,
  AuditLog,
  NotificationEvent,
  NotificationEventType,
} from '../types/services';
import { INITIAL_SERVICE_CATEGORIES, INITIAL_EXPERTS } from '../data/servicesCatalog';

import { db } from '../lib/firebase';
import { notificationService } from './notificationService';
import { sanitizeFirestoreData } from '../utils/productNormalization';

// In-memory runtime caching to guarantee 100% responsiveness and smooth fallbacks
class ServicesService {
  private categoriesCache: ServiceCategory[] = [...INITIAL_SERVICE_CATEGORIES];
  private expertsCache: ExpertProfile[] = [...INITIAL_EXPERTS];
  private requestsCache: ProjectRequest[] = [];
  private updatesCache: Record<string, ProjectUpdate[]> = {};
  private applicationsCache: ExpertApplication[] = [];
  private auditLogsCache: AuditLog[] = [];
  private notificationEventsCache: NotificationEvent[] = [];

  constructor() {
    this.seedInitialData();
  }

  private async seedInitialData() {
    try {
      // Safely load any dynamically configured service categories from Firestore
      const catRef = collection(db, 'serviceCategories');
      const snap = await getDocs(catRef);
      if (!snap.empty) {
        snap.forEach((docSnap) => {
          const cat = docSnap.data() as ServiceCategory;
          const idx = this.categoriesCache.findIndex((c) => c.id === cat.id || c.slug === cat.slug);
          if (idx >= 0) {
            this.categoriesCache[idx] = cat;
          } else {
            this.categoriesCache.push(cat);
          }
        });
      }
    } catch {
      // In-memory catalog from servicesCatalog is default
    }

    try {
      // Safely load any custom expert profiles from Firestore
      const expRef = collection(db, 'experts');
      const expSnap = await getDocs(expRef);
      if (!expSnap.empty) {
        expSnap.forEach((docSnap) => {
          const exp = docSnap.data() as ExpertProfile;
          const idx = this.expertsCache.findIndex((e) => e.expertId === exp.expertId);
          if (idx >= 0) {
            this.expertsCache[idx] = exp;
          } else {
            this.expertsCache.push(exp);
          }
        });
      }
    } catch {
      // In-memory experts from servicesCatalog are default
    }

    try {
      // Safely load expert applications from Firestore
      const appRef = collection(db, 'expertApplications');
      const appSnap = await getDocs(appRef);
      if (!appSnap.empty) {
        appSnap.forEach((docSnap) => {
          const app = docSnap.data() as ExpertApplication;
          const idx = this.applicationsCache.findIndex((a) => a.applicationId === app.applicationId);
          if (idx >= 0) {
            this.applicationsCache[idx] = app;
          } else {
            this.applicationsCache.push(app);
          }
        });
      }
    } catch {
      // Fallback
    }

    try {
      // Safely load project requests from Firestore
      const reqRef = collection(db, 'projectRequests');
      const reqSnap = await getDocs(reqRef);
      if (!reqSnap.empty) {
        const fromDb: ProjectRequest[] = [];
        reqSnap.forEach((docSnap) => {
          fromDb.push(docSnap.data() as ProjectRequest);
        });
        this.requestsCache = fromDb;
      }
    } catch {
      // Fallback
    }
  }

  // ==========================================
  // Audit Logging & Notifications Infrastructure
  // ==========================================

  async recordAuditLog(
    actorId: string,
    actorEmail: string | undefined,
    action: string,
    entityType: 'EXPERT' | 'REQUEST' | 'CATEGORY' | 'SYSTEM',
    entityId: string,
    previousState?: string,
    newState?: string,
    metadata?: Record<string, any>
  ): Promise<AuditLog> {
    const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const log: AuditLog = {
      logId,
      actorId,
      actorEmail: actorEmail || 'management@nexovira.com',
      action,
      entityType,
      entityId,
      previousState,
      newState,
      metadata,
      timestamp: now,
    };

    this.auditLogsCache.unshift(log);
    if (this.auditLogsCache.length > 250) {
      this.auditLogsCache.pop();
    }

    return log;
  }

  async dispatchNotificationEvent(
    eventType: NotificationEventType,
    recipient: string,
    recipientRole: 'MANAGEMENT' | 'CUSTOMER' | 'EXPERT',
    referenceId: string,
    title: string,
    message: string
  ): Promise<NotificationEvent> {
    const eventId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const notif: NotificationEvent = {
      eventId,
      eventType,
      recipient,
      recipientRole,
      referenceId,
      title,
      message,
      status: 'RECORDED',
      createdAt: now,
    };

    this.notificationEventsCache.unshift(notif);
    if (this.notificationEventsCache.length > 250) {
      this.notificationEventsCache.pop();
    }

    // Clean log for audit
    console.log(`[NEXOVIRA NOTIFICATION: ${eventType}] Target: ${recipient} (${recipientRole}) | Ref: ${referenceId}`);

    // Bridge to authoritative centralized notificationService
    if (recipientRole === 'CUSTOMER' || recipientRole === 'EXPERT') {
      const nType = (eventType === 'NEW_PROJECT_REQUEST' || eventType === 'REQUEST_RECEIVED')
        ? 'SERVICE_REQUEST_SUBMITTED'
        : eventType === 'PROJECT_COMPLETED'
        ? 'SERVICE_REQUEST_COMPLETED'
        : 'SERVICE_REQUEST_STATUS_CHANGED';

      notificationService.dispatch({
        recipientUserId: recipient,
        type: nType,
        category: 'SERVICES',
        title,
        message,
        relatedEntityType: 'SERVICE_REQUEST',
        relatedEntityId: referenceId,
        actionUrl: '/account/services',
        priority: 'NORMAL',
        idempotencyKey: `srv_${eventId}`,
      }).catch(() => {});
    } else if (recipientRole === 'MANAGEMENT') {
      notificationService.dispatchToManagement({
        type: 'SYSTEM_ALERT',
        category: 'MANAGEMENT',
        title: `Services Alert: ${title}`,
        message,
        relatedEntityType: 'SERVICE_REQUEST',
        relatedEntityId: referenceId,
        actionUrl: '/management/services',
        priority: 'NORMAL',
        idempotencyKey: `srv_mgmt_${eventId}`,
      }).catch(() => {});
    }

    return notif;
  }

  async getAuditLogsForManagement(): Promise<AuditLog[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'))
      );
      if (!snap.empty) {
        const fromDb: AuditLog[] = [];
        snap.forEach((d) => fromDb.push(d.data() as AuditLog));
        this.auditLogsCache = fromDb;
      }
    } catch {
      // Retain cache
    }
    return [...this.auditLogsCache].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getNotificationEventsForManagement(): Promise<NotificationEvent[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'notificationEvents'), orderBy('createdAt', 'desc'))
      );
      if (!snap.empty) {
        const fromDb: NotificationEvent[] = [];
        snap.forEach((d) => fromDb.push(d.data() as NotificationEvent));
        this.notificationEventsCache = fromDb;
      }
    } catch {
      // Retain cache
    }
    return [...this.notificationEventsCache].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ==========================================
  // Category Operations
  // ==========================================

  async getCategories(includeInactive = false): Promise<ServiceCategory[]> {
    try {
      const snap = await getDocs(collection(db, 'serviceCategories'));
      if (!snap.empty) {
        const fromDb: ServiceCategory[] = [];
        snap.forEach((d) => fromDb.push(d.data() as ServiceCategory));
        // Sort by display order
        fromDb.sort((a, b) => a.displayOrder - b.displayOrder);
        this.categoriesCache = fromDb;
      }
    } catch {
      // Use cache
    }

    if (includeInactive) {
      return [...this.categoriesCache].sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return this.categoriesCache
      .filter((c) => c.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCategoryBySlug(slug: string): Promise<ServiceCategory | null> {
    const categories = await this.getCategories(true);
    return categories.find((c) => c.slug.toLowerCase() === slug.toLowerCase()) || null;
  }

  async createOrUpdateCategory(cat: Partial<ServiceCategory> & { name: string; slug: string }): Promise<ServiceCategory> {
    const id = cat.id || `cat-${cat.slug.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const now = new Date().toISOString();

    const existing = this.categoriesCache.find((c) => c.id === id);
    const updatedCategory: ServiceCategory = {
      id,
      name: cat.name.trim(),
      slug: cat.slug.toLowerCase().trim(),
      description: cat.description || '',
      icon: cat.icon || 'Code',
      isActive: cat.isActive !== undefined ? cat.isActive : true,
      displayOrder: cat.displayOrder || this.categoriesCache.length + 1,
      skills: cat.skills || [],
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    // Update cache
    const idx = this.categoriesCache.findIndex((c) => c.id === id);
    if (idx >= 0) {
      this.categoriesCache[idx] = updatedCategory;
    } else {
      this.categoriesCache.push(updatedCategory);
    }

    this.recordAuditLog(
      'MANAGEMENT',
      'nexoviratech@gmail.com',
      existing ? 'CATEGORY_UPDATED' : 'CATEGORY_CREATED',
      'CATEGORY',
      id,
      existing ? JSON.stringify(existing) : undefined,
      JSON.stringify(updatedCategory)
    );

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<{ success: boolean; mode: 'DELETED' | 'DEACTIVATED'; message: string }> {
    const existing = this.categoriesCache.find((c) => c.id === id || c.slug === id);
    if (!existing) {
      throw new Error('Category not found');
    }

    // Check if any experts or requests are bound to this category
    const hasExperts = this.expertsCache.some((e) =>
      e.serviceCategories.some((sc) => sc.toLowerCase() === existing.slug.toLowerCase())
    );
    const hasRequests = this.requestsCache.some((r) =>
      r.categorySlug.toLowerCase() === existing.slug.toLowerCase()
    );

    if (hasExperts || hasRequests) {
      // Safe deactivation policy: Do not corrupt existing customer requests or expert credentials
      existing.isActive = false;
      existing.updatedAt = new Date().toISOString();
      if (db) {
        setDoc(doc(db, 'serviceCategories', existing.id), { isActive: false, updatedAt: existing.updatedAt }, { merge: true }).catch(() => null);
      }
      return {
        success: true,
        mode: 'DEACTIVATED',
        message: 'Category deactivated to preserve active service requests and expert bindings.',
      };
    }

    // Safe to delete permanently
    this.categoriesCache = this.categoriesCache.filter((c) => c.id !== existing.id);
    if (db) {
      deleteDoc(doc(db, 'serviceCategories', existing.id)).catch(() => null);
    }

    this.recordAuditLog(
      'MANAGEMENT',
      'nexoviratech@gmail.com',
      'CATEGORY_DELETED',
      'CATEGORY',
      existing.id,
      JSON.stringify(existing)
    );

    return { success: true, mode: 'DELETED', message: 'Category permanently removed.' };
  }

  // ==========================================
  // Expert Profile Operations
  // ==========================================

  // Strips private data for public endpoints
  private sanitizePublicExpert(expert: ExpertProfile): PublicExpert {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId, ...safe } = expert;
    return safe;
  }

  async getPublicExperts(filter?: {
    categorySlug?: string;
    skill?: string;
    search?: string;
    availability?: string;
  }): Promise<PublicExpert[]> {
    let list: ExpertProfile[] = [];

    try {
      const snap = await getDocs(collection(db, 'experts'));
      if (!snap.empty) {
        const fromDb: ExpertProfile[] = [];
        snap.forEach((d) => fromDb.push(d.data() as ExpertProfile));
        this.expertsCache = fromDb;
      }
    } catch {
      // Use cache
    }

    list = this.expertsCache.filter(
      (e) => e.verificationStatus === 'VERIFIED' && e.profileVisibility === 'PUBLIC'
    );

    if (filter?.categorySlug) {
      const slug = filter.categorySlug.toLowerCase();
      list = list.filter((e) =>
        e.serviceCategories.some((c) => c.toLowerCase() === slug)
      );
    }

    if (filter?.skill) {
      const skillQuery = filter.skill.toLowerCase();
      list = list.filter((e) =>
        e.skills.some((s) => s.toLowerCase() === skillQuery)
      );
    }

    if (filter?.availability && filter.availability !== 'ALL') {
      list = list.filter((e) => e.availabilityStatus === filter.availability);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.professionalTitle.toLowerCase().includes(q) ||
          e.bio.toLowerCase().includes(q) ||
          e.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    return list.map((e) => this.sanitizePublicExpert(e));
  }

  async getPublicExpertBySlugOrId(identifier: string): Promise<PublicExpert | null> {
    const list = await this.getPublicExperts();
    const expert = list.find(
      (e) =>
        e.expertId.toLowerCase() === identifier.toLowerCase() ||
        e.fullName.toLowerCase().replace(/[^a-z0-9]/g, '-') === identifier.toLowerCase()
    );
    return expert || null;
  }

  async getExpertByUserId(userId: string): Promise<ExpertProfile | null> {
    try {
      const q = query(collection(db, 'experts'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as ExpertProfile;
      }
    } catch {
      // Fallback to cache
    }

    return this.expertsCache.find((e) => e.userId === userId) || null;
  }

  async getAllExpertsForManagement(): Promise<ExpertProfile[]> {
    try {
      const snap = await getDocs(collection(db, 'experts'));
      if (!snap.empty) {
        const fromDb: ExpertProfile[] = [];
        snap.forEach((d) => fromDb.push(d.data() as ExpertProfile));
        this.expertsCache = fromDb;
      }
    } catch {
      // Use cache
    }

    // Also check for pending applications from expertApplications that may not yet be in experts
    try {
      const appSnap = await getDocs(collection(db, 'expertApplications'));
      if (!appSnap.empty) {
        appSnap.forEach((docSnap) => {
          const app = docSnap.data() as ExpertApplication;
          const exists = this.expertsCache.find((e) => e.userId === app.userId || e.expertId === `exp-${app.userId.slice(0, 10)}`);
          if (!exists) {
            const pendingExpert: ExpertProfile = {
              expertId: `exp-${app.userId.slice(0, 10)}`,
              userId: app.userId,
              fullName: app.fullName,
              professionalTitle: app.professionalTitle,
              profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
              bio: app.bio,
              skills: app.skills,
              serviceCategories: app.serviceCategories,
              yearsOfExperience: app.yearsOfExperience,
              portfolioLinks: app.portfolioLinks,
              location: app.location,
              languages: app.languages,
              availabilityStatus: 'AVAILABLE',
              profileVisibility: 'HIDDEN',
              verificationStatus: app.status === 'APPROVED' ? 'VERIFIED' : app.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
              completedProjectsCount: 0,
              rating: 5.0,
              createdAt: app.submittedAt,
              updatedAt: app.updatedAt,
            };
            this.expertsCache.push(pendingExpert);
          }
        });
      }
    } catch {
      // Fallback
    }

    return [...this.expertsCache];
  }

  async updateExpertProfileByExpert(
    userId: string,
    payload: Partial<ExpertProfile>
  ): Promise<{ success: boolean; profile?: ExpertProfile; error?: string }> {
    const existing = await this.getExpertByUserId(userId);
    const now = new Date().toISOString();

    const expertId = existing ? existing.expertId : `exp-${userId.slice(0, 10)}`;

    // Strictly protect verificationStatus, role, and userId!
    const updated: ExpertProfile = {
      expertId,
      userId,
      fullName: payload.fullName || existing?.fullName || 'Professional Expert',
      professionalTitle: payload.professionalTitle || existing?.professionalTitle || 'Ecosystem Specialist',
      profileImage: payload.profileImage || existing?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: payload.bio || existing?.bio || '',
      skills: payload.skills || existing?.skills || [],
      serviceCategories: payload.serviceCategories || existing?.serviceCategories || [],
      yearsOfExperience: payload.yearsOfExperience !== undefined ? Number(payload.yearsOfExperience) : existing?.yearsOfExperience || 1,
      portfolioLinks: payload.portfolioLinks || existing?.portfolioLinks || [],
      location: payload.location || existing?.location || 'Global / Remote',
      languages: payload.languages || existing?.languages || ['English'],
      availabilityStatus: (payload.availabilityStatus as ExpertAvailability) || existing?.availabilityStatus || 'AVAILABLE',
      profileVisibility: payload.profileVisibility || existing?.profileVisibility || 'PUBLIC',
      // Experts CANNOT self-verify! Must be PENDING if newly created, or preserve existing status
      verificationStatus: existing ? existing.verificationStatus : 'PENDING',
      completedProjectsCount: existing?.completedProjectsCount || 0,
      rating: existing?.rating || 5.0,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    // Update in-memory cache
    const idx = this.expertsCache.findIndex((e) => e.expertId === expertId);
    if (idx >= 0) {
      this.expertsCache[idx] = updated;
    } else {
      this.expertsCache.push(updated);
    }

    setDoc(doc(db, 'experts', expertId), sanitizeFirestoreData(updated), { merge: true }).catch((err) => {
      console.warn('Firestore expert profile write notice:', err);
    });

    return { success: true, profile: updated };
  }

  async managementSetExpertStatus(
    expertId: string,
    status: ExpertVerificationStatus,
    visibility?: 'PUBLIC' | 'HIDDEN'
  ): Promise<{ success: boolean; error?: string }> {
    const expert = this.expertsCache.find((e) => e.expertId === expertId);
    if (!expert) {
      return { success: false, error: 'Expert profile not found' };
    }

    const prevStatus = expert.verificationStatus;
    expert.verificationStatus = status;
    if (visibility) expert.profileVisibility = visibility;
    expert.updatedAt = new Date().toISOString();

    // 1. Persist to experts collection
    setDoc(doc(db, 'experts', expertId), sanitizeFirestoreData({
      verificationStatus: status,
      profileVisibility: expert.profileVisibility,
      updatedAt: expert.updatedAt,
    }), { merge: true }).catch((err) => {
      console.warn('Firestore expert status write notice:', err);
    });

    // 2. Persist to expertApplications collection if exists
    const appDocId = `app-exp-${expert.userId}`;
    setDoc(doc(db, 'expertApplications', appDocId), sanitizeFirestoreData({
      status: status === 'VERIFIED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'PENDING_REVIEW',
      updatedAt: expert.updatedAt,
    }), { merge: true }).catch(() => {});

    // 3. Authoritatively update user role in users collection to keep permissions persistent across login/logout!
    if (expert.userId) {
      const targetRole = status === 'VERIFIED' ? 'EXPERT' : 'CUSTOMER';
      setDoc(doc(db, 'users', expert.userId), {
        role: targetRole,
        updatedAt: expert.updatedAt,
      }, { merge: true }).catch((err) => {
        console.warn('Firestore user role sync notice:', err);
      });

      // Dispatch in-app notification
      notificationService.dispatch({
        recipientUserId: expert.userId,
        type: 'ACCOUNT_STATUS_CHANGED',
        category: 'SERVICES',
        title: status === 'VERIFIED' ? 'Expert Status Approved!' : 'Expert Application Update',
        message: status === 'VERIFIED'
          ? 'Congratulations! Your Nexovira Tech & Digital Services expert profile has been verified. You can now receive and manage client project requests.'
          : `Your expert status has been updated to ${status}.`,
        actionUrl: '/expert/dashboard',
        priority: 'HIGH',
      }).catch(() => {});
    }

    this.recordAuditLog(
      'MANAGEMENT',
      'nexoviratech@gmail.com',
      'EXPERT_STATUS_CHANGED',
      'EXPERT',
      expertId,
      prevStatus,
      status,
      { visibility, expertName: expert.fullName }
    );

    return { success: true };
  }

  async managementUpdateExpertProfile(
    expertId: string,
    payload: Partial<ExpertProfile>
  ): Promise<{ success: boolean; profile?: ExpertProfile; error?: string }> {
    const expert = this.expertsCache.find((e) => e.expertId === expertId);
    if (!expert) {
      return { success: false, error: 'Expert profile not found' };
    }

    const now = new Date().toISOString();
    const updated: ExpertProfile = {
      ...expert,
      fullName: payload.fullName ? payload.fullName.trim() : expert.fullName,
      professionalTitle: payload.professionalTitle ? payload.professionalTitle.trim() : expert.professionalTitle,
      profileImage: payload.profileImage || expert.profileImage,
      bio: payload.bio ? payload.bio.trim() : expert.bio,
      skills: payload.skills || expert.skills,
      serviceCategories: payload.serviceCategories || expert.serviceCategories,
      yearsOfExperience: payload.yearsOfExperience !== undefined ? Number(payload.yearsOfExperience) : expert.yearsOfExperience,
      portfolioLinks: payload.portfolioLinks || expert.portfolioLinks,
      location: payload.location || expert.location,
      languages: payload.languages || expert.languages,
      availabilityStatus: payload.availabilityStatus || expert.availabilityStatus,
      profileVisibility: payload.profileVisibility || expert.profileVisibility,
      updatedAt: now,
    };

    const idx = this.expertsCache.findIndex((e) => e.expertId === expertId);
    if (idx >= 0) this.expertsCache[idx] = updated;

    if (db) {
      setDoc(doc(db, 'experts', expertId), sanitizeFirestoreData(updated), { merge: true }).catch(() => null);
    }

    this.recordAuditLog(
      'MANAGEMENT',
      'nexoviratech@gmail.com',
      'EXPERT_PROFILE_UPDATED',
      'EXPERT',
      expertId,
      JSON.stringify(expert),
      JSON.stringify(updated)
    );

    return { success: true, profile: updated };
  }

  async managementDeleteExpert(
    expertId: string
  ): Promise<{ success: boolean; mode: 'DELETED' | 'SUSPENDED'; message: string }> {
    const expert = this.expertsCache.find((e) => e.expertId === expertId);
    if (!expert) {
      throw new Error('Expert profile not found');
    }

    // Check if expert has active non-completed project requests
    const hasActiveRequests = this.requestsCache.some(
      (r) => r.assignedExpertId === expert.expertId && !['COMPLETED', 'CANCELLED'].includes(r.status)
    );

    if (hasActiveRequests) {
      // Safe suspension policy: Protect active customer deliverables
      expert.verificationStatus = 'SUSPENDED';
      expert.profileVisibility = 'HIDDEN';
      expert.updatedAt = new Date().toISOString();

      if (db) {
        setDoc(doc(db, 'experts', expertId), {
          verificationStatus: 'SUSPENDED',
          profileVisibility: 'HIDDEN',
          updatedAt: expert.updatedAt,
        }, { merge: true }).catch(() => null);
      }

      return {
        success: true,
        mode: 'SUSPENDED',
        message: 'Expert suspended and hidden from public directory due to active in-progress client projects.',
      };
    }

    // Safe to delete permanently
    this.expertsCache = this.expertsCache.filter((e) => e.expertId !== expertId);
    if (db) {
      deleteDoc(doc(db, 'experts', expertId)).catch(() => null);
    }

    this.recordAuditLog(
      'MANAGEMENT',
      'nexoviratech@gmail.com',
      'EXPERT_PROFILE_DELETED',
      'EXPERT',
      expertId,
      JSON.stringify(expert)
    );

    return { success: true, mode: 'DELETED', message: 'Expert profile permanently removed from the ecosystem.' };
  }

  // ==========================================
  // Expert Applications (for Customers applying to become an Expert)
  // ==========================================

  async submitExpertApplication(
    userId: string,
    data: Omit<ExpertApplication, 'applicationId' | 'userId' | 'status' | 'submittedAt' | 'updatedAt'>
  ): Promise<{ success: boolean; application?: ExpertApplication; error?: string }> {
    if (!data.fullName || !data.email || !data.professionalTitle || !data.bio) {
      return { success: false, error: 'All primary professional details are required.' };
    }

    const applicationId = `app-exp-${userId}`;
    const expertId = `exp-${userId.slice(0, 10)}`;
    const now = new Date().toISOString();

    const application: ExpertApplication = {
      applicationId,
      userId,
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      professionalTitle: data.professionalTitle.trim(),
      bio: data.bio.trim(),
      skills: data.skills || [],
      serviceCategories: data.serviceCategories || [],
      yearsOfExperience: Number(data.yearsOfExperience) || 1,
      portfolioLinks: data.portfolioLinks || [],
      location: data.location || 'Remote',
      languages: data.languages || ['English'],
      status: 'PENDING_REVIEW',
      submittedAt: now,
      updatedAt: now,
    };

    const idx = this.applicationsCache.findIndex((a) => a.applicationId === applicationId);
    if (idx >= 0) {
      this.applicationsCache[idx] = application;
    } else {
      this.applicationsCache.push(application);
    }

    // Persist application
    setDoc(doc(db, 'expertApplications', applicationId), sanitizeFirestoreData(application), { merge: true }).catch((err) => {
      console.warn('Firestore expertApplication write notice:', err);
    });

    // Also register pending expert profile in experts collection
    const expertProfile: ExpertProfile = {
      expertId,
      userId,
      fullName: application.fullName,
      professionalTitle: application.professionalTitle,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: application.bio,
      skills: application.skills,
      serviceCategories: application.serviceCategories,
      yearsOfExperience: application.yearsOfExperience,
      portfolioLinks: application.portfolioLinks,
      location: application.location,
      languages: application.languages,
      availabilityStatus: 'AVAILABLE',
      profileVisibility: 'HIDDEN',
      verificationStatus: 'PENDING',
      completedProjectsCount: 0,
      rating: 5.0,
      createdAt: now,
      updatedAt: now,
    };

    const expIdx = this.expertsCache.findIndex((e) => e.expertId === expertId || e.userId === userId);
    if (expIdx >= 0) {
      this.expertsCache[expIdx] = expertProfile;
    } else {
      this.expertsCache.push(expertProfile);
    }

    setDoc(doc(db, 'experts', expertId), sanitizeFirestoreData(expertProfile), { merge: true }).catch((err) => {
      console.warn('Firestore pending expert write notice:', err);
    });

    return { success: true, application };
  }

  // ==========================================
  // Project Request Operations
  // ==========================================

  async createProjectRequest(
    customerId: string,
    customerName: string,
    customerEmail: string,
    payload: ServiceRequestSubmissionPayload
  ): Promise<{ success: boolean; request?: ProjectRequest; error?: string }> {
    // 1. Rigorous Server-Side Input Validation
    if (!payload.projectTitle || payload.projectTitle.trim().length < 5) {
      return { success: false, error: 'Project title must be at least 5 characters long.' };
    }
    if (!payload.description || payload.description.trim().length < 20) {
      return { success: false, error: 'Please provide a detailed project description (minimum 20 characters).' };
    }
    if (!payload.goals || payload.goals.trim().length < 10) {
      return { success: false, error: 'Please describe the project goals and expected outcomes.' };
    }
    if (!payload.categoryId) {
      return { success: false, error: 'Please select a service category.' };
    }

    const category = this.categoriesCache.find(
      (c) => c.id === payload.categoryId || c.slug === payload.categoryId
    );
    if (!category) {
      return { success: false, error: 'Invalid service category selected.' };
    }

    const minBudget = Number(payload.budgetMin);
    const maxBudget = Number(payload.budgetMax);
    if (isNaN(minBudget) || isNaN(maxBudget) || minBudget < 0 || maxBudget < minBudget) {
      return { success: false, error: 'Please provide a valid budget range where maximum is greater than or equal to minimum.' };
    }

    // Attachment validation (limit size & count)
    const sanitizedAttachments = (payload.attachments || []).slice(0, 5).map((a, i) => ({
      id: a.id || `att-${Date.now()}-${i}`,
      name: (a.name || 'Attachment').slice(0, 100),
      size: Math.min(a.size || 0, 10 * 1024 * 1024), // Max 10MB
      type: a.type || 'application/octet-stream',
      url: a.url || '',
    }));

    // Generate authoritative reference: NXR-REQ-YYYY-RANDOM
    const year = new Date().getFullYear();
    const randomHex = Math.floor(100000 + Math.random() * 900000);
    const requestReference = `NXR-REQ-${year}-${randomHex}`;
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newRequest: ProjectRequest = {
      requestId,
      requestReference,
      customerId,
      customerName: payload.contactName || customerName || 'Valued Client',
      customerEmail: payload.contactEmail || customerEmail,
      customerPhone: payload.contactPhone || '',
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
      projectTitle: payload.projectTitle.trim(),
      description: payload.description.trim(),
      goals: payload.goals.trim(),
      requiredSkills: Array.isArray(payload.requiredSkills) ? payload.requiredSkills.slice(0, 15) : [],
      budgetMin: minBudget,
      budgetMax: maxBudget,
      currency: (payload.currency || 'NGN').toUpperCase().trim(),
      preferredTimeline: payload.preferredTimeline || 'Flexible',
      priority: payload.priority || 'MEDIUM',
      attachments: sanitizedAttachments,
      additionalNotes: payload.additionalNotes || '',
      status: 'SUBMITTED',
      preferredExpertId: payload.preferredExpertId || '',
      createdBy: customerId,
      createdAt: now,
      updatedAt: now,
    };

    // Pre-populate initial system welcome update in project updates thread
    const initialUpdate: ProjectUpdate = {
      updateId: `upd-${Date.now()}-init`,
      requestId,
      senderId: 'nexovira-system',
      senderName: 'Nexovira Project Desk',
      senderRole: 'MANAGEMENT',
      message: `Project request received and registered under reference ${requestReference}. A Nexovira technical manager is reviewing your requirements to assign the optimal ecosystem expert.`,
      createdAt: now,
    };

    this.requestsCache.unshift(newRequest);
    this.updatesCache[requestId] = [initialUpdate];

    // Persist to Firestore
    setDoc(doc(db, 'projectRequests', requestId), sanitizeFirestoreData(newRequest)).catch((err) => {
      console.warn('Firestore projectRequest write notice:', err);
    });
    setDoc(doc(db, 'projectRequests', requestId, 'updates', initialUpdate.updateId), sanitizeFirestoreData(initialUpdate)).catch(() => {});

    // Dispatch real notification events
    this.dispatchNotificationEvent(
      'NEW_PROJECT_REQUEST',
      'nexoviratech@gmail.com',
      'MANAGEMENT',
      requestReference,
      `New Project Request: ${newRequest.projectTitle}`,
      `A new project request (${requestReference}) has been registered by ${newRequest.customerName} (${newRequest.customerEmail}) in category ${category.name}. Budget: ${newRequest.currency} ${minBudget}-${maxBudget}.`
    );

    this.dispatchNotificationEvent(
      'REQUEST_RECEIVED',
      newRequest.customerEmail,
      'CUSTOMER',
      requestReference,
      `Nexovira Project Registration Confirmation (${requestReference})`,
      `Hello ${newRequest.customerName}, your project "${newRequest.projectTitle}" has been received and logged under reference ${requestReference}. Nexovira operations will review requirements and match you with a verified expert.`
    );

    return { success: true, request: newRequest };
  }

  async getCustomerRequests(customerId: string): Promise<ProjectRequest[]> {
    try {
      const q = query(
        collection(db, 'projectRequests'),
        where('customerId', '==', customerId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const fromDb: ProjectRequest[] = [];
        snap.forEach((d) => fromDb.push(d.data() as ProjectRequest));
        return fromDb.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch {
      // Fallback
    }

    return this.requestsCache
      .filter((r) => r.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getExpertAssignedProjects(expertUserId: string): Promise<ProjectRequest[]> {
    // Find expert profile
    const expert = await this.getExpertByUserId(expertUserId);
    const expertId = expert ? expert.expertId : expertUserId;

    try {
      const q = query(
        collection(db, 'projectRequests'),
        where('assignedExpertId', 'in', [expertId, expertUserId])
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const fromDb: ProjectRequest[] = [];
        snap.forEach((d) => fromDb.push(d.data() as ProjectRequest));
        return fromDb.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch {
      // Fallback
    }

    return this.requestsCache
      .filter((r) => r.assignedExpertId === expertId || r.assignedExpertId === expertUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllRequestsForManagement(): Promise<ProjectRequest[]> {
    try {
      const snap = await getDocs(collection(db, 'projectRequests'));
      if (!snap.empty) {
        const fromDb: ProjectRequest[] = [];
        snap.forEach((d) => fromDb.push(d.data() as ProjectRequest));
        this.requestsCache = fromDb;
      }
    } catch {
      // Fallback
    }
    return [...this.requestsCache].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getRequestById(requestId: string, requesterUserId: string, requesterRole: string): Promise<{ request?: ProjectRequest; error?: string }> {
    let req = this.requestsCache.find((r) => r.requestId === requestId);
    if (!req) {
      try {
        const snap = await getDoc(doc(db, 'projectRequests', requestId));
        if (snap.exists()) {
          req = snap.data() as ProjectRequest;
          this.requestsCache.push(req);
        }
      } catch {
        // Fallback
      }
    }

    if (!req) {
      return { error: 'Project request not found.' };
    }

    const isManagement = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(requesterRole);
    const isCustomerOwner = req.customerId === requesterUserId;

    // Check if expert is assigned
    const expert = await this.getExpertByUserId(requesterUserId);
    const isAssignedExpert = req.assignedExpertId === (expert?.expertId || requesterUserId);

    if (!isManagement && !isCustomerOwner && !isAssignedExpert) {
      return { error: 'Access denied: You are not authorized to view this project.' };
    }

    // If requester is not management, strip internal management notes
    if (!isManagement) {
      const safeReq = { ...req };
      delete safeReq.internalNotes;
      return { request: safeReq };
    }

    return { request: req };
  }

  // ==========================================
  // Assignment & Workflow Transitions
  // ==========================================

  async assignExpertByManagement(
    requestId: string,
    expertId: string,
    managementNotes?: string
  ): Promise<{ success: boolean; request?: ProjectRequest; error?: string }> {
    const req = this.requestsCache.find((r) => r.requestId === requestId);
    if (!req) {
      return { success: false, error: 'Project request not found.' };
    }

    const expert = this.expertsCache.find((e) => e.expertId === expertId);
    if (!expert) {
      return { success: false, error: 'Target expert profile not found.' };
    }

    const prevExpertId = req.assignedExpertId;
    const now = new Date().toISOString();
    req.assignedExpertId = expert.expertId;
    req.assignedExpertName = expert.fullName;
    req.assignedExpertTitle = expert.professionalTitle;
    req.assignedExpertAvatar = expert.profileImage;
    req.assignedAt = now;
    req.status = 'ASSIGNED';
    req.updatedAt = now;
    if (managementNotes) req.internalNotes = managementNotes;

    const assignmentUpdate: ProjectUpdate = {
      updateId: `upd-${Date.now()}-assign`,
      requestId,
      senderId: 'nexovira-management',
      senderName: 'Nexovira Project Operations',
      senderRole: 'MANAGEMENT',
      message: `Expert Assigned: Nexovira has matched your project with ${expert.fullName} (${expert.professionalTitle}). Reviewing scope for kickoff.`,
      createdAt: now,
    };

    if (!this.updatesCache[requestId]) this.updatesCache[requestId] = [];
    this.updatesCache[requestId].push(assignmentUpdate);

    setDoc(doc(db, 'projectRequests', requestId), sanitizeFirestoreData(req), { merge: true }).catch((err) => {
      console.warn('Firestore projectRequest assign notice:', err);
    });
    setDoc(doc(db, 'projectRequests', requestId, 'updates', assignmentUpdate.updateId), sanitizeFirestoreData(assignmentUpdate)).catch(() => {});

    this.recordAuditLog(
      'MANAGEMENT',
      'nexoviratech@gmail.com',
      prevExpertId ? 'PROJECT_REASSIGNED' : 'PROJECT_ASSIGNED',
      'REQUEST',
      requestId,
      prevExpertId,
      expert.expertId,
      { expertName: expert.fullName, internalNotes: managementNotes || '', requestReference: req.requestReference }
    );

    this.dispatchNotificationEvent(
      'EXPERT_ASSIGNED',
      'nexoviratech@gmail.com',
      'MANAGEMENT',
      req.requestReference,
      `Project Assigned: ${req.requestReference}`,
      `Expert ${expert.fullName} has been assigned to project ${req.requestReference}.`
    );

    this.dispatchNotificationEvent(
      'EXPERT_ASSIGNED',
      req.customerEmail,
      'CUSTOMER',
      req.requestReference,
      `Nexovira Match: Expert Assigned to ${req.projectTitle}`,
      `Hello ${req.customerName}, Nexovira has matched your project with verified specialist ${expert.fullName} (${expert.professionalTitle}).`
    );

    return { success: true, request: req };
  }

  async updateRequestStatus(
    requestId: string,
    newStatus: ProjectRequestStatus,
    requesterUserId: string,
    requesterRole: string,
    note?: string
  ): Promise<{ success: boolean; request?: ProjectRequest; error?: string }> {
    const req = this.requestsCache.find((r) => r.requestId === requestId);
    if (!req) return { success: false, error: 'Project request not found.' };

    const previousStatus = req.status;
    const isManagement = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(requesterRole);
    const expert = await this.getExpertByUserId(requesterUserId);
    const isAssignedExpert = req.assignedExpertId === (expert?.expertId || requesterUserId);
    const isCustomer = req.customerId === requesterUserId;

    const now = new Date().toISOString();

    // Enforce strict status transition guards
    if (isCustomer) {
      if (newStatus === 'CANCELLED' && req.status === 'SUBMITTED') {
        req.status = 'CANCELLED';
        req.cancelledAt = now;
      } else {
        return { success: false, error: 'Customers may only cancel requests that are still in SUBMITTED state.' };
      }
    } else if (isAssignedExpert) {
      // Allowed expert transitions:
      // ASSIGNED -> ACCEPTED
      // ACCEPTED -> IN_PROGRESS
      // IN_PROGRESS -> AWAITING_CUSTOMER
      if (req.status === 'ASSIGNED' && newStatus === 'ACCEPTED') {
        req.status = 'ACCEPTED';
      } else if ((req.status === 'ACCEPTED' || req.status === 'ASSIGNED') && newStatus === 'IN_PROGRESS') {
        req.status = 'IN_PROGRESS';
        if (!req.startedAt) req.startedAt = now;
      } else if (req.status === 'IN_PROGRESS' && newStatus === 'AWAITING_CUSTOMER') {
        req.status = 'AWAITING_CUSTOMER';
      } else {
        return { success: false, error: `Experts are not permitted to transition request from ${req.status} to ${newStatus}.` };
      }
    } else if (isManagement) {
      // Management has authoritative orchestration oversight
      req.status = newStatus;
      if (newStatus === 'IN_PROGRESS' && !req.startedAt) req.startedAt = now;
      if (newStatus === 'COMPLETED' && !req.completedAt) req.completedAt = now;
      if (newStatus === 'CANCELLED' && !req.cancelledAt) req.cancelledAt = now;
      if (note) req.internalNotes = note;
    } else {
      return { success: false, error: 'Unauthorized to update this project status.' };
    }

    req.updatedAt = now;

    // Post automatic status log message in updates thread
    const statusUpdateMsg: ProjectUpdate = {
      updateId: `upd-${Date.now()}-status`,
      requestId,
      senderId: requesterUserId,
      senderName: isManagement ? 'Nexovira Operations' : isAssignedExpert ? (expert?.fullName || 'Assigned Expert') : 'Client',
      senderRole: isManagement ? 'MANAGEMENT' : isAssignedExpert ? 'EXPERT' : 'CUSTOMER',
      message: `Status updated to: ${newStatus.replace(/_/g, ' ')}${note ? ` - "${note}"` : ''}`,
      createdAt: now,
    };

    if (!this.updatesCache[requestId]) this.updatesCache[requestId] = [];
    this.updatesCache[requestId].push(statusUpdateMsg);

    setDoc(doc(db, 'projectRequests', requestId), sanitizeFirestoreData(req), { merge: true }).catch((err) => {
      console.warn('Firestore projectRequest status write notice:', err);
    });
    setDoc(doc(db, 'projectRequests', requestId, 'updates', statusUpdateMsg.updateId), sanitizeFirestoreData(statusUpdateMsg)).catch(() => {});

    this.recordAuditLog(
      requesterUserId,
      isManagement ? 'nexoviratech@gmail.com' : undefined,
      'STATUS_UPDATED',
      'REQUEST',
      requestId,
      previousStatus,
      newStatus,
      { reference: req.requestReference, note }
    );

    if (newStatus === 'ACCEPTED') {
      this.dispatchNotificationEvent('EXPERT_ACCEPTS_ASSIGNMENT', 'nexoviratech@gmail.com', 'MANAGEMENT', req.requestReference, 'Expert Accepted Assignment', `Expert accepted project ${req.requestReference}`);
      this.dispatchNotificationEvent('EXPERT_ACCEPTS_ASSIGNMENT', req.customerEmail, 'CUSTOMER', req.requestReference, 'Your Expert has accepted the engagement', `The assigned specialist has accepted your project ${req.requestReference} and is preparing to begin.`);
    } else if (newStatus === 'IN_PROGRESS') {
      this.dispatchNotificationEvent('PROJECT_STARTED', req.customerEmail, 'CUSTOMER', req.requestReference, 'Project Milestone In Progress', `Development has officially commenced on your project ${req.requestReference}.`);
    } else if (newStatus === 'AWAITING_CUSTOMER') {
      this.dispatchNotificationEvent('PROJECT_AWAITING_CUSTOMER', req.customerEmail, 'CUSTOMER', req.requestReference, 'Deliverable Ready for Review', `Your specialist has submitted milestone work for review on project ${req.requestReference}.`);
    } else if (newStatus === 'NEEDS_INFORMATION') {
      this.dispatchNotificationEvent('ADDITIONAL_INFO_REQUESTED', req.customerEmail, 'CUSTOMER', req.requestReference, 'Additional Information Requested', `Nexovira operations has requested additional details regarding project ${req.requestReference}.`);
    } else if (newStatus === 'COMPLETED') {
      this.dispatchNotificationEvent('PROJECT_COMPLETED', req.customerEmail, 'CUSTOMER', req.requestReference, 'Project Successfully Completed', `Your project ${req.requestReference} has been verified and marked completed.`);
      this.dispatchNotificationEvent('PROJECT_COMPLETED', 'nexoviratech@gmail.com', 'MANAGEMENT', req.requestReference, 'Project Completed by Expert', `Project ${req.requestReference} has been completed.`);
    } else if (newStatus === 'CANCELLED') {
      this.dispatchNotificationEvent('REQUEST_CANCELLED', 'nexoviratech@gmail.com', 'MANAGEMENT', req.requestReference, 'Project Request Cancelled', `Project ${req.requestReference} has been cancelled.`);
      this.dispatchNotificationEvent('REQUEST_CANCELLED', req.customerEmail, 'CUSTOMER', req.requestReference, 'Project Request Cancelled', `Your project request ${req.requestReference} has been cancelled.`);
    }

    return { success: true, request: req };
  }


  // ==========================================
  // Project Communication Updates
  // ==========================================

  async getProjectUpdates(
    requestId: string,
    requesterUserId: string,
    requesterRole: string
  ): Promise<{ updates?: ProjectUpdate[]; error?: string }> {
    const authCheck = await this.getRequestById(requestId, requesterUserId, requesterRole);
    if (authCheck.error || !authCheck.request) {
      return { error: authCheck.error || 'Access denied' };
    }

    try {
      const snap = await getDocs(
        query(
          collection(db, 'projectRequests', requestId, 'updates'),
          orderBy('createdAt', 'asc')
        )
      );
      if (!snap.empty) {
        const fromDb: ProjectUpdate[] = [];
        snap.forEach((d) => fromDb.push(d.data() as ProjectUpdate));
        this.updatesCache[requestId] = fromDb;
        return { updates: fromDb };
      }
    } catch {
      // Fallback
    }

    const updates = this.updatesCache[requestId] || [];
    return { updates: [...updates].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) };
  }

  async addProjectUpdate(
    requestId: string,
    senderId: string,
    senderName: string,
    senderRole: 'CUSTOMER' | 'EXPERT' | 'MANAGEMENT',
    message: string,
    attachments?: { id: string; name: string; size: number; type: string; url: string }[]
  ): Promise<{ success: boolean; update?: ProjectUpdate; error?: string }> {
    if (!message || message.trim().length === 0) {
      return { success: false, error: 'Message cannot be empty.' };
    }

    const authCheck = await this.getRequestById(requestId, senderId, senderRole);
    if (authCheck.error || !authCheck.request) {
      return { success: false, error: authCheck.error || 'Not authorized to send updates on this project.' };
    }

    const now = new Date().toISOString();
    const updateId = `upd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newUpdate: ProjectUpdate = {
      updateId,
      requestId,
      senderId,
      senderName,
      senderRole,
      message: message.trim(),
      attachments: attachments || [],
      createdAt: now,
    };

    if (!this.updatesCache[requestId]) this.updatesCache[requestId] = [];
    this.updatesCache[requestId].push(newUpdate);

    setDoc(doc(db, 'projectRequests', requestId, 'updates', updateId), sanitizeFirestoreData(newUpdate)).catch((err) => {
      console.warn('Firestore project update write notice:', err);
    });

    // Update parent request's updatedAt
    const req = this.requestsCache.find((r) => r.requestId === requestId);
    if (req) {
      req.updatedAt = now;
      setDoc(doc(db, 'projectRequests', requestId), { updatedAt: now }, { merge: true }).catch(() => {});
    }

    return { success: true, update: newUpdate };
  }
}

export const servicesService = new ServicesService();
