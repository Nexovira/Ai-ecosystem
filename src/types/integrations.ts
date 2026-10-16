/**
 * Phase 22: Nexovira Ecosystem API & Integrations Types
 * Scoped API key management, external service adapter registries, and signed outbound webhook contracts.
 */

export type ApiScope =
  | 'profile:read'
  | 'products:read'
  | 'products:write'
  | 'orders:read'
  | 'orders:write'
  | 'services:read'
  | 'academy:read'
  | 'digital:read'
  | 'webhooks:manage';

export type IntegrationEnvironment = 'SANDBOX' | 'PRODUCTION';
export type IntegrationStatus = 'ACTIVE' | 'REVOKED' | 'SUSPENDED';

export interface ApiKeyCredential {
  keyId: string;
  name: string;
  keyPrefix: string; // e.g. "nx_live_9a7b..."
  maskedKey: string; // e.g. "nx_live_...9a7b"
  environment: IntegrationEnvironment;
  status: IntegrationStatus;
  scopes: ApiScope[];
  rateLimitPerMin: number;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export type WebhookEventTopic =
  | 'order.created'
  | 'order.paid'
  | 'order.refunded'
  | 'digital.purchased'
  | 'service.submitted'
  | 'service.completed'
  | 'payout.settled';

export interface WebhookSubscription {
  subscriptionId: string;
  name: string;
  targetUrl: string;
  subscribedEvents: WebhookEventTopic[];
  signingSecret: string;
  status: 'ACTIVE' | 'DISABLED';
  ownerId: string;
  createdAt: string;
  lastDeliveredAt?: string;
  failedDeliveriesCount: number;
}

export interface WebhookDeliveryRecord {
  deliveryId: string;
  subscriptionId: string;
  targetUrl: string;
  eventTopic: WebhookEventTopic;
  eventId: string;
  httpStatusCode?: number;
  deliveryStatus: 'SUCCESS' | 'FAILED' | 'RETRY_PENDING';
  attemptCount: number;
  sentAt: string;
  responsePayloadSnippet?: string;
  errorMessage?: string;
}

export interface ExternalAdapterRegistryEntry {
  adapterId: string;
  name: string;
  category: 'PAYMENT_GATEWAY' | 'SMS_DISPATCH' | 'EMAIL_TRANSACTIONAL' | 'IDENTITY_VERIFICATION';
  provider: string;
  status: 'CONNECTED' | 'CONFIGURATION_REQUIRED' | 'DEGRADED';
  requiredSecrets: string[];
  configuredSecrets: string[];
  capabilities: string[];
  endpointHealthCheck: string;
  lastHealthCheckAt: string;
}

export interface IntegrationsOverviewResponse {
  apiKeys: ApiKeyCredential[];
  webhooks: WebhookSubscription[];
  adapters: ExternalAdapterRegistryEntry[];
  recentDeliveries: WebhookDeliveryRecord[];
  totalActiveKeys: number;
  totalActiveWebhooks: number;
}
