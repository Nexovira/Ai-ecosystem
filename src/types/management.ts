import type { ManagementRole, UserRole, AccountStatus } from './auth';
export type { ManagementRole };

export type ManagementPermission =
  | 'USERS_VIEW'
  | 'USERS_MANAGE_STATUS'
  | 'USERS_MANAGE_ROLE'
  | 'SELLERS_VIEW'
  | 'SELLERS_VERIFY'
  | 'SELLERS_MANAGE_STATUS'
  | 'PRODUCTS_VIEW'
  | 'PRODUCTS_MANAGE'
  | 'PRODUCTS_APPROVE'
  | 'ORDERS_VIEW'
  | 'ORDERS_MANAGE'
  | 'ORDERS_REFUND'
  | 'PAYMENTS_VIEW'
  | 'PAYMENTS_MANAGE'
  | 'ACADEMY_VIEW'
  | 'ACADEMY_MANAGE'
  | 'ACADEMY_PUBLISH'
  | 'SERVICES_VIEW'
  | 'SERVICES_MANAGE'
  | 'SERVICES_ASSIGN'
  | 'EXPERTS_VIEW'
  | 'EXPERTS_MANAGE'
  | 'EXPERTS_VERIFY'
  | 'AFFILIATES_VIEW'
  | 'AFFILIATES_MANAGE'
  | 'AFFILIATES_OFFERS'
  | 'COMMISSIONS_VIEW'
  | 'COMMISSIONS_ADJUST'
  | 'PAYOUTS_VIEW'
  | 'PAYOUTS_PROCESS'
  | 'NOTIFICATIONS_VIEW'
  | 'NOTIFICATIONS_BROADCAST'
  | 'CONTENT_MANAGE'
  | 'REVIEWS_VIEW'
  | 'REVIEWS_MANAGE'
  | 'DIGITAL_PRODUCTS_VIEW'
  | 'DIGITAL_PRODUCTS_MANAGE'
  | 'WALLETS_VIEW'
  | 'WALLETS_MANAGE'
  | 'TRANSACTIONS_VIEW'
  | 'TRANSACTIONS_MANAGE'
  | 'FINANCIAL_AUDIT_VIEW'
  | 'AUDIT_LOGS_VIEW'
  | 'ANALYTICS_VIEW'
  | 'ANALYTICS_EXPORT'
  | 'AI_CONFIG_MANAGE'
  | 'AUTOMATION_VIEW'
  | 'AUTOMATION_MANAGE'
  | 'INTEGRATIONS_VIEW'
  | 'INTEGRATIONS_MANAGE'
  | 'RELIABILITY_VIEW'
  | 'RELIABILITY_MANAGE'
  | 'TEAM_MANAGE';

export const MANAGEMENT_ROLE_PERMISSIONS: Record<ManagementRole, ManagementPermission[]> = {
  SUPER_ADMIN: [
    'USERS_VIEW',
    'USERS_MANAGE_STATUS',
    'USERS_MANAGE_ROLE',
    'SELLERS_VIEW',
    'SELLERS_VERIFY',
    'SELLERS_MANAGE_STATUS',
    'PRODUCTS_VIEW',
    'PRODUCTS_MANAGE',
    'PRODUCTS_APPROVE',
    'ORDERS_VIEW',
    'ORDERS_MANAGE',
    'ORDERS_REFUND',
    'PAYMENTS_VIEW',
    'PAYMENTS_MANAGE',
    'ACADEMY_VIEW',
    'ACADEMY_MANAGE',
    'ACADEMY_PUBLISH',
    'SERVICES_VIEW',
    'SERVICES_MANAGE',
    'SERVICES_ASSIGN',
    'EXPERTS_VIEW',
    'EXPERTS_MANAGE',
    'EXPERTS_VERIFY',
    'AFFILIATES_VIEW',
    'AFFILIATES_MANAGE',
    'AFFILIATES_OFFERS',
    'COMMISSIONS_VIEW',
    'COMMISSIONS_ADJUST',
    'PAYOUTS_VIEW',
    'PAYOUTS_PROCESS',
    'NOTIFICATIONS_VIEW',
    'NOTIFICATIONS_BROADCAST',
    'CONTENT_MANAGE',
    'REVIEWS_VIEW',
    'REVIEWS_MANAGE',
    'DIGITAL_PRODUCTS_VIEW',
    'DIGITAL_PRODUCTS_MANAGE',
    'WALLETS_VIEW',
    'WALLETS_MANAGE',
    'TRANSACTIONS_VIEW',
    'TRANSACTIONS_MANAGE',
    'FINANCIAL_AUDIT_VIEW',
    'AUDIT_LOGS_VIEW',
    'ANALYTICS_VIEW',
    'ANALYTICS_EXPORT',
    'AI_CONFIG_MANAGE',
    'AUTOMATION_VIEW',
    'AUTOMATION_MANAGE',
    'INTEGRATIONS_VIEW',
    'INTEGRATIONS_MANAGE',
    'RELIABILITY_VIEW',
    'RELIABILITY_MANAGE',
    'TEAM_MANAGE',
  ],
  ADMIN: [
    'USERS_VIEW',
    'USERS_MANAGE_STATUS',
    'SELLERS_VIEW',
    'SELLERS_VERIFY',
    'SELLERS_MANAGE_STATUS',
    'PRODUCTS_VIEW',
    'PRODUCTS_MANAGE',
    'PRODUCTS_APPROVE',
    'ORDERS_VIEW',
    'ORDERS_MANAGE',
    'ORDERS_REFUND',
    'PAYMENTS_VIEW',
    'ACADEMY_VIEW',
    'ACADEMY_MANAGE',
    'ACADEMY_PUBLISH',
    'SERVICES_VIEW',
    'SERVICES_MANAGE',
    'SERVICES_ASSIGN',
    'EXPERTS_VIEW',
    'EXPERTS_MANAGE',
    'EXPERTS_VERIFY',
    'AFFILIATES_VIEW',
    'AFFILIATES_MANAGE',
    'AFFILIATES_OFFERS',
    'COMMISSIONS_VIEW',
    'PAYOUTS_VIEW',
    'PAYOUTS_PROCESS',
    'NOTIFICATIONS_VIEW',
    'NOTIFICATIONS_BROADCAST',
    'CONTENT_MANAGE',
    'REVIEWS_VIEW',
    'REVIEWS_MANAGE',
    'DIGITAL_PRODUCTS_VIEW',
    'DIGITAL_PRODUCTS_MANAGE',
    'WALLETS_VIEW',
    'WALLETS_MANAGE',
    'TRANSACTIONS_VIEW',
    'TRANSACTIONS_MANAGE',
    'FINANCIAL_AUDIT_VIEW',
    'AUDIT_LOGS_VIEW',
    'ANALYTICS_VIEW',
    'ANALYTICS_EXPORT',
    'AI_CONFIG_MANAGE',
    'AUTOMATION_VIEW',
    'AUTOMATION_MANAGE',
    'INTEGRATIONS_VIEW',
    'INTEGRATIONS_MANAGE',
    'RELIABILITY_VIEW',
    'RELIABILITY_MANAGE',
    'TEAM_MANAGE',
  ],
  OPERATIONS: [
    'USERS_VIEW',
    'USERS_MANAGE_STATUS',
    'SELLERS_VIEW',
    'SELLERS_VERIFY',
    'PRODUCTS_VIEW',
    'PRODUCTS_MANAGE',
    'ORDERS_VIEW',
    'ORDERS_MANAGE',
    'SERVICES_VIEW',
    'SERVICES_MANAGE',
    'SERVICES_ASSIGN',
    'EXPERTS_VIEW',
    'EXPERTS_MANAGE',
    'ACADEMY_VIEW',
    'ACADEMY_MANAGE',
    'NOTIFICATIONS_VIEW',
    'REVIEWS_VIEW',
    'DIGITAL_PRODUCTS_VIEW',
    'DIGITAL_PRODUCTS_MANAGE',
    'AUDIT_LOGS_VIEW',
    'ANALYTICS_VIEW',
    'AUTOMATION_VIEW',
    'INTEGRATIONS_VIEW',
    'RELIABILITY_VIEW',
  ],
  FINANCE: [
    'ORDERS_VIEW',
    'ORDERS_REFUND',
    'PAYMENTS_VIEW',
    'PAYMENTS_MANAGE',
    'WALLETS_VIEW',
    'WALLETS_MANAGE',
    'TRANSACTIONS_VIEW',
    'TRANSACTIONS_MANAGE',
    'FINANCIAL_AUDIT_VIEW',
    'COMMISSIONS_VIEW',
    'COMMISSIONS_ADJUST',
    'PAYOUTS_VIEW',
    'PAYOUTS_PROCESS',
    'AUDIT_LOGS_VIEW',
    'ANALYTICS_VIEW',
    'ANALYTICS_EXPORT',
  ],
  CONTENT_MANAGER: [
    'PRODUCTS_VIEW',
    'PRODUCTS_MANAGE',
    'PRODUCTS_APPROVE',
    'ACADEMY_VIEW',
    'ACADEMY_MANAGE',
    'ACADEMY_PUBLISH',
    'CONTENT_MANAGE',
    'DIGITAL_PRODUCTS_VIEW',
    'DIGITAL_PRODUCTS_MANAGE',
    'NOTIFICATIONS_VIEW',
  ],
  SUPPORT: [
    'USERS_VIEW',
    'ORDERS_VIEW',
    'SERVICES_VIEW',
    'ACADEMY_VIEW',
    'AFFILIATES_VIEW',
    'NOTIFICATIONS_VIEW',
    'REVIEWS_VIEW',
  ],
  MODERATOR: [
    'PRODUCTS_VIEW',
    'PRODUCTS_APPROVE',
    'SELLERS_VIEW',
    'EXPERTS_VIEW',
    'NOTIFICATIONS_VIEW',
    'REVIEWS_VIEW',
    'REVIEWS_MANAGE',
  ],
  STAFF: [
    'USERS_VIEW',
    'SELLERS_VIEW',
    'PRODUCTS_VIEW',
    'ORDERS_VIEW',
    'ACADEMY_VIEW',
    'SERVICES_VIEW',
    'EXPERTS_VIEW',
    'AFFILIATES_VIEW',
    'NOTIFICATIONS_VIEW',
    'AUDIT_LOGS_VIEW',
  ],
};

export function isManagementRole(role: string): role is ManagementRole {
  return [
    'SUPER_ADMIN',
    'ADMIN',
    'OPERATIONS',
    'FINANCE',
    'CONTENT_MANAGER',
    'SUPPORT',
    'MODERATOR',
    'STAFF',
  ].includes(role);
}

export function hasManagementPermission(role: string, permission: ManagementPermission): boolean {
  if (!isManagementRole(role)) return false;
  const permissions = MANAGEMENT_ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export interface ManagementAuditRecord {
  id: string;
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
  timestamp: string;
}

export interface ManagementDashboardMetrics {
  users: {
    total: number;
    verified: number;
    pendingVerification: number;
    active: number;
    restricted: number;
    suspended: number;
    underReview: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  marketplace: {
    totalProducts: number;
    activeProducts: number;
    pendingProducts: number;
    totalSellers: number;
    verifiedSellers: number;
  };
  orders: {
    totalOrders: number;
    pendingPayment: number;
    paymentConfirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  };
  payments: {
    totalCount: number;
    totalAmount: number;
    verifiedCount: number;
  };
  academy: {
    totalCourses: number;
    publishedCourses: number;
    totalApplications: number;
    acceptedApplications: number;
    pendingApplications: number;
  };
  services: {
    totalRequests: number;
    openRequests: number;
    assignedRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    totalExperts: number;
    verifiedExperts: number;
  };
  affiliates: {
    totalApplications: number;
    approvedAffiliates: number;
    pendingApplications: number;
    pendingCommissionsAmount: number;
    availableCommissionsAmount: number;
    totalPayoutRequests: number;
    pendingPayoutRequests: number;
  };
  notifications: {
    unreadCount: number;
  };
}

export interface ManagementUserItem {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  capabilities: string[];
  ordersCount: number;
  servicesCount: number;
  academyCount: number;
  isAffiliate: boolean;
  createdAt: string;
  updatedAt: string;
}
