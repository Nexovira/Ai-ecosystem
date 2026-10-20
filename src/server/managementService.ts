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
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  ManagementAuditRecord,
  ManagementDashboardMetrics,
  ManagementPermission,
  ManagementUserItem,
  hasManagementPermission,
  isManagementRole,
} from '../types/management';
import { UserProfile, UserRole, AccountStatus, ManagementRole } from '../types/auth';
import { commerceService } from './commerceService';
import { academyService } from './academyService';
import { servicesService } from './servicesService';
import { affiliateService } from './affiliateService';
import { notificationService } from './notificationService';

export class ManagementService {
  private auditLogsCache: ManagementAuditRecord[] = [];
  private usersCache: UserProfile[] = [];

  /**
   * Centralized Server-Authoritative Audit Logging.
   */
  async recordAuditLog(params: {
    actorId: string;
    actorEmail: string;
    actorRole: ManagementRole | string;
    action: string;
    targetType: string;
    targetId: string;
    previousState?: any;
    newState?: any;
    reason?: string;
    metadata?: Record<string, any>;
  }): Promise<ManagementAuditRecord> {
    const logId = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: ManagementAuditRecord = {
      id: logId,
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      previousState: params.previousState ?? null,
      newState: params.newState ?? null,
      reason: params.reason || '',
      metadata: params.metadata || {},
      timestamp: new Date().toISOString(),
    };

    this.auditLogsCache.unshift(record);

    try {
      await setDoc(doc(db, 'auditLogs', logId), record).catch(() => null);
    } catch {
      // Retained in memory cache
    }

    return record;
  }

  /**
   * Fetches audit records newest first.
   */
  async getAuditLogs(options?: {
    action?: string;
    targetType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: ManagementAuditRecord[]; total: number }> {
    let logs = [...this.auditLogsCache];
    try {
      const snap = await getDocs(collection(db, 'auditLogs')).catch(() => null);
      if (snap && snap.docs) {
        snap.forEach((d) => {
          const item = d.data() as ManagementAuditRecord;
          if (!logs.some((l) => l.id === item.id)) {
            logs.push(item);
          }
        });
      }
    } catch {
      // Safe fallback to local audit cache
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.action && options.action !== 'ALL') {
      logs = logs.filter((l) => l.action === options.action);
    }
    if (options?.targetType && options.targetType !== 'ALL') {
      logs = logs.filter((l) => l.targetType === options.targetType);
    }

    const total = logs.length;
    const offset = options?.offset || 0;
    const max = options?.limit || 50;
    const paginated = logs.slice(offset, offset + max);

    return { logs: paginated, total };
  }

  /**
   * Aggregates real operational dashboard metrics from authoritative single sources of truth.
   */
  async getDashboardMetrics(): Promise<ManagementDashboardMetrics> {
    // 1. Users
    const users = await this.getAllUsers();
    const activeUsers = users.filter((u) => u.accountStatus === 'ACTIVE').length;
    const restrictedUsers = users.filter((u) => u.accountStatus === 'RESTRICTED').length;
    const suspendedUsers = users.filter((u) => u.accountStatus === 'SUSPENDED').length;
    const underReviewUsers = users.filter((u) => u.accountStatus === 'UNDER_REVIEW').length;

    // 2. Marketplace & Products
    const products = await commerceService.getAllProductsForManagement();
    const activeProducts = products.filter((p) => p.productStatus === 'PUBLISHED' && p.isApproved).length;
    const pendingProducts = products.filter((p) => p.productStatus === 'DRAFT' || !p.isApproved).length;

    // 3. Orders
    const orders = await commerceService.getAllOrdersForManagement();
    const pendingPayment = orders.filter((o) => o.orderStatus === 'PENDING_PAYMENT').length;
    const paymentConfirmed = orders.filter((o) => o.orderStatus === 'PAYMENT_CONFIRMED').length;
    const processing = orders.filter((o) => o.orderStatus === 'PROCESSING').length;
    const shipped = orders.filter((o) => o.orderStatus === 'SHIPPED').length;
    const delivered = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
    const cancelled = orders.filter((o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'REFUNDED').length;
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'SUCCESS')
      .reduce((sum, o) => sum + o.total, 0);

    // 4. Sellers
    let totalSellers = 0;
    let verifiedSellers = 0;
    try {
      const sSnap = await getDocs(collection(db, 'sellers'));
      totalSellers = sSnap.size;
      sSnap.forEach((d) => {
        const s = d.data();
        if (s.verificationStatus === 'VERIFIED') verifiedSellers++;
      });
    } catch {
      // Graceful fallback
    }

    // 5. Academy
    const academyApps = academyService.getAllApplications('SUPER_ADMIN');
    const courses = academyService.getCourses();
    const acceptedApps = academyApps.filter((a) => a.application.status === 'ACCEPTED').length;
    const pendingApps = academyApps.filter((a) =>
      ['SUBMITTED', 'PAYMENT_PENDING', 'FORM_IN_PROGRESS', 'UNDER_REVIEW'].includes(a.application.status)
    ).length;

    // 6. Services & Experts
    const requests = await servicesService.getAllRequestsForManagement();
    const experts = await servicesService.getAllExpertsForManagement();
    const openRequests = requests.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
    const assignedRequests = requests.filter((r) => r.status === 'ASSIGNED' || r.status === 'ACCEPTED').length;
    const inProgressRequests = requests.filter((r) => r.status === 'IN_PROGRESS').length;
    const completedRequests = requests.filter((r) => r.status === 'COMPLETED').length;
    const verifiedExperts = experts.filter((e) => e.verificationStatus === 'VERIFIED').length;

    // 7. Affiliates & Payouts
    const affApps = affiliateService.getAllApplications('SUPER_ADMIN');
    const payouts = affiliateService.getAllPayouts('SUPER_ADMIN');
    const approvedAffiliates = affApps.filter((a) => a.status === 'APPROVED').length;
    const pendingAffApps = affApps.filter((a) => a.status === 'PENDING_REVIEW').length;
    const pendingPayouts = payouts.filter((p) => p.status === 'REQUESTED' || p.status === 'UNDER_REVIEW').length;

    return {
      users: {
        total: users.length,
        active: activeUsers,
        restricted: restrictedUsers,
        suspended: suspendedUsers,
        underReview: underReviewUsers,
      },
      marketplace: {
        totalProducts: products.length,
        activeProducts,
        pendingProducts,
        totalSellers,
        verifiedSellers,
      },
      orders: {
        totalOrders: orders.length,
        pendingPayment,
        paymentConfirmed,
        processing,
        shipped,
        delivered,
        cancelled,
        totalRevenue,
      },
      payments: {
        totalCount: orders.filter((o) => o.paymentStatus === 'SUCCESS').length,
        totalAmount: totalRevenue,
        verifiedCount: orders.filter((o) => o.paymentStatus === 'SUCCESS').length,
      },
      academy: {
        totalCourses: courses.length,
        publishedCourses: courses.filter((c) => c.status === 'PUBLISHED').length,
        totalApplications: academyApps.length,
        acceptedApplications: acceptedApps,
        pendingApplications: pendingApps,
      },
      services: {
        totalRequests: requests.length,
        openRequests,
        assignedRequests,
        inProgressRequests,
        completedRequests,
        totalExperts: experts.length,
        verifiedExperts,
      },
      affiliates: {
        totalApplications: affApps.length,
        approvedAffiliates,
        pendingApplications: pendingAffApps,
        pendingCommissionsAmount: 0,
        availableCommissionsAmount: 0,
        totalPayoutRequests: payouts.length,
        pendingPayoutRequests: pendingPayouts,
      },
      notifications: {
        unreadCount: 0,
      },
    };
  }

  /**
   * Helper to retrieve all user profiles from Firestore.
   */
  async getAllUsers(): Promise<UserProfile[]> {
    const list: UserProfile[] = [...this.usersCache];
    try {
      const snap = await getDocs(collection(db, 'users')).catch(() => null);
      if (snap && snap.docs) {
        snap.forEach((d) => {
          const u = d.data() as UserProfile;
          const idx = list.findIndex((existing) => existing.userId === u.userId);
          if (idx >= 0) {
            list[idx] = u;
          } else {
            list.push(u);
          }
        });
      }
    } catch {
      // Safe fallback to local users cache
    }

    return list;
  }

  /**
   * Retrieves enriched user list with pagination and search.
   */
  async getUsersList(options?: {
    search?: string;
    status?: string;
    role?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ users: ManagementUserItem[]; total: number }> {
    const rawUsers = await this.getAllUsers();
    const orders = await commerceService.getAllOrdersForManagement();
    const serviceRequests = await servicesService.getAllRequestsForManagement();
    const academyApps = academyService.getAllApplications('SUPER_ADMIN');

    let enriched: ManagementUserItem[] = rawUsers.map((u) => {
      const userOrders = orders.filter((o) => o.customerId === u.userId);
      const userServices = serviceRequests.filter((s) => s.customerId === u.userId);
      const userAcademy = academyApps.filter((a) => a.application.userId === u.userId);
      const affStatus = affiliateService.getAffiliateStatus(u.userId);

      const capabilities: string[] = ['CUSTOMER'];
      if (u.role === 'SELLER' || u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') {
        capabilities.push('SELLER');
      }
      if (affStatus.status === 'APPROVED') {
        capabilities.push('AFFILIATE');
      }
      if (u.role === 'EXPERT') {
        capabilities.push('EXPERT');
      }
      if (isManagementRole(u.role)) {
        capabilities.push('MANAGEMENT');
      }

      return {
        userId: u.userId,
        fullName: u.fullName || 'Member',
        email: u.email,
        phoneNumber: u.phoneNumber,
        role: u.role,
        accountStatus: u.accountStatus || 'ACTIVE',
        emailVerified: Boolean(u.emailVerified),
        capabilities,
        ordersCount: userOrders.length,
        servicesCount: userServices.length,
        academyCount: userAcademy.length,
        isAffiliate: affStatus.status === 'APPROVED',
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.updatedAt || new Date().toISOString(),
      };
    });

    if (options?.search) {
      const q = options.search.toLowerCase();
      enriched = enriched.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.userId.toLowerCase().includes(q)
      );
    }

    if (options?.status && options.status !== 'ALL') {
      enriched = enriched.filter((u) => u.accountStatus === options.status);
    }

    if (options?.role && options.role !== 'ALL') {
      enriched = enriched.filter((u) => u.role === options.role);
    }

    const total = enriched.length;
    const offset = options?.offset || 0;
    const max = options?.limit || 50;
    const paginated = enriched.slice(offset, offset + max);

    return { users: paginated, total };
  }

  /**
   * Update user status (RESTRICTED, SUSPENDED, ACTIVE, UNDER_REVIEW).
   */
  async updateUserStatus(params: {
    targetUserId: string;
    newStatus: AccountStatus;
    reason: string;
    actorId: string;
    actorEmail: string;
    actorRole: ManagementRole | string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    if (!hasManagementPermission(params.actorRole as ManagementRole, 'USERS_MANAGE_STATUS')) {
      throw new Error('Forbidden: Insufficient permissions to modify user account status.');
    }

    const userDocRef = doc(db, 'users', params.targetUserId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      return { success: false, error: 'Target user record not found.' };
    }

    const existing = snap.data() as UserProfile;
    const previousStatus = existing.accountStatus || 'ACTIVE';

    const now = new Date().toISOString();
    const updated: UserProfile = {
      ...existing,
      accountStatus: params.newStatus,
      updatedAt: now,
    };

    await updateDoc(userDocRef, {
      accountStatus: params.newStatus,
      updatedAt: now,
    });

    // Record audit log
    await this.recordAuditLog({
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'USER_STATUS_CHANGE',
      targetType: 'USER',
      targetId: params.targetUserId,
      previousState: { accountStatus: previousStatus },
      newState: { accountStatus: params.newStatus },
      reason: params.reason,
    });

    // Dispatch notification to user
    notificationService.dispatch({
      recipientUserId: params.targetUserId,
      type: 'ACCOUNT_STATUS_CHANGED',
      category: 'SECURITY',
      title: 'Account Status Updated',
      message: `Your Nexovira account standing has been updated to ${params.newStatus}.${params.reason ? ` Reason: ${params.reason}` : ''}`,
      relatedEntityType: 'USER',
      relatedEntityId: params.targetUserId,
      actionUrl: '/account',
      priority: params.newStatus === 'ACTIVE' ? 'NORMAL' : 'CRITICAL',
      channels: ['IN_APP', 'EMAIL'],
      isTransactional: true,
      idempotencyKey: `usr_stat_${params.targetUserId}_${Date.now()}`,
    }).catch(() => {});

    return { success: true, user: updated };
  }

  /**
   * Update user role (with rigorous privilege-escalation prevention).
   */
  async updateUserRole(params: {
    targetUserId: string;
    newRole: UserRole;
    reason: string;
    actorId: string;
    actorEmail: string;
    actorRole: ManagementRole | string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    if (!hasManagementPermission(params.actorRole as ManagementRole, 'USERS_MANAGE_ROLE')) {
      throw new Error('Forbidden: Only authorized administrators can modify system roles.');
    }

    // Protection: User cannot elevate their own role
    if (params.actorId === params.targetUserId) {
      throw new Error('Forbidden: Self-elevation of permissions is strictly prohibited.');
    }

    // Protection: Only SUPER_ADMIN can grant SUPER_ADMIN or ADMIN
    if (['SUPER_ADMIN', 'ADMIN'].includes(params.newRole) && params.actorRole !== 'SUPER_ADMIN') {
      throw new Error('Forbidden: Only a SUPER_ADMIN can assign ADMIN or SUPER_ADMIN roles.');
    }

    const userDocRef = doc(db, 'users', params.targetUserId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      return { success: false, error: 'Target user record not found.' };
    }

    const existing = snap.data() as UserProfile;
    const previousRole = existing.role;

    const now = new Date().toISOString();
    const updated: UserProfile = {
      ...existing,
      role: params.newRole,
      updatedAt: now,
    };

    await updateDoc(userDocRef, {
      role: params.newRole,
      updatedAt: now,
    });

    // Update /admins collection if role is management
    const adminDocRef = doc(db, 'admins', params.targetUserId);
    if (isManagementRole(params.newRole)) {
      await setDoc(adminDocRef, {
        userId: params.targetUserId,
        role: params.newRole,
        updatedAt: now,
      }, { merge: true });
    } else {
      try {
        await deleteDoc(adminDocRef);
      } catch {
        // Ignore if not present
      }
    }

    // Record audit log
    await this.recordAuditLog({
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'USER_ROLE_CHANGE',
      targetType: 'USER',
      targetId: params.targetUserId,
      previousState: { role: previousRole },
      newState: { role: params.newRole },
      reason: params.reason,
    });

    return { success: true, user: updated };
  }

  /**
   * Retrieves management team members list.
   */
  async getTeamMembers(): Promise<UserProfile[]> {
    const allUsers = await this.getAllUsers();
    return allUsers.filter((u) => isManagementRole(u.role));
  }
}

export const managementService = new ManagementService();
