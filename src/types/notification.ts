export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PUSH';

export type NotificationStatus = 'PENDING' | 'DELIVERED' | 'FAILED' | 'SKIPPED_NO_PROVIDER';

export type NotificationReadStatus = 'UNREAD' | 'READ';

export type NotificationCategory =
  | 'ACCOUNT'
  | 'ORDER'
  | 'PAYMENT'
  | 'MARKETPLACE'
  | 'ACADEMY'
  | 'SERVICES'
  | 'AFFILIATE'
  | 'PAYOUT'
  | 'SECURITY'
  | 'SYSTEM'
  | 'MANAGEMENT';

export type NotificationType =
  // Account
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_SECURITY_EVENT'
  | 'PASSWORD_CHANGED'
  | 'EMAIL_CHANGED'
  | 'ACCOUNT_STATUS_CHANGED'
  // Marketplace
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'PAYMENT_SUCCESSFUL'
  | 'PAYMENT_FAILED'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_CANCELLED'
  | 'ORDER_REFUNDED'
  | 'PRODUCT_STATUS_CHANGED'
  // Seller
  | 'NEW_ORDER'
  | 'SELLER_PAYMENT_RECEIVED'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'SELLER_ACCOUNT_STATUS_CHANGED'
  // Academy
  | 'COURSE_PURCHASED'
  | 'COURSE_ENROLLMENT_CONFIRMED'
  | 'COURSE_STATUS_CHANGED'
  | 'COURSE_COMPLETION'
  // Tech & Digital Services
  | 'SERVICE_REQUEST_SUBMITTED'
  | 'SERVICE_REQUEST_STATUS_CHANGED'
  | 'EXPERT_RESPONSE'
  | 'SERVICE_REQUEST_COMPLETED'
  | 'SERVICE_REQUEST_CANCELLED'
  // Affiliate
  | 'AFFILIATE_APPLICATION_RECEIVED'
  | 'AFFILIATE_APPLICATION_APPROVED'
  | 'AFFILIATE_APPLICATION_REJECTED'
  | 'AFFILIATE_SUSPENDED'
  | 'REFERRAL_CONVERSION'
  | 'COMMISSION_PENDING'
  | 'COMMISSION_APPROVED'
  | 'COMMISSION_AVAILABLE'
  | 'COMMISSION_REVERSED'
  | 'PAYOUT_REQUESTED'
  | 'PAYOUT_PROCESSING'
  | 'PAYOUT_COMPLETED'
  | 'PAYOUT_FAILED'
  // Management
  | 'NEW_AFFILIATE_APPLICATION'
  | 'PAYOUT_REQUIRES_REVIEW'
  | 'SUSPICIOUS_TRANSACTION'
  | 'PLATFORM_ANNOUNCEMENT'
  | 'SYSTEM_ALERT';

export type DeliveryChannelStatus =
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'BOUNCED'
  | 'SKIPPED_NO_PROVIDER'
  | 'SKIPPED_PREFERENCE';

export interface DeliveryLogRecord {
  channel: NotificationChannel;
  status: DeliveryChannelStatus;
  provider?: string;
  providerReference?: string;
  errorMessage?: string;
  attemptedAt: string;
}

export interface NotificationRecord {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  status: NotificationStatus;
  readStatus: NotificationReadStatus;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  deliveryLogs?: DeliveryLogRecord[];
  isTransactional: boolean;
}

export interface UserNotificationPreferences {
  userId: string;
  inAppOrders: boolean;
  inAppPayments: boolean;
  inAppAcademy: boolean;
  inAppServices: boolean;
  inAppAffiliate: boolean;
  inAppMarketing: boolean;
  // Security notifications are mandatory and cannot be disabled
  emailOrders: boolean;
  emailPayments: boolean;
  emailAcademy: boolean;
  emailServices: boolean;
  emailAffiliate: boolean;
  emailMarketing: boolean;
  // Security emails mandatory
  updatedAt: string;
}

export interface NotificationEventPayload {
  recipientUserId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  isTransactional?: boolean;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}
