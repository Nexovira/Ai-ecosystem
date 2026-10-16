/**
 * Phase 23: Nexovira Scale, Performance & Reliability Types
 * Real-time telemetry, cache registries, dead-letter queues, circuit breakers, and recovery readiness.
 */

export interface SystemResourceMetrics {
  uptimeSeconds: number;
  memoryUsageMb: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  nodeVersion: string;
  activeRequests: number;
  apiP95LatencyMs: number;
  apiP99LatencyMs: number;
  cacheHitRatioPercent: number;
}

export interface CacheClusterEntry {
  cacheKey: string;
  category: 'CATALOG_PUBLIC' | 'ACADEMY_CURRICULUM' | 'SERVICE_DIRECTORY' | 'AGGREGATED_METRICS';
  ttlSeconds: number;
  remainingTtlSeconds: number;
  hitsCount: number;
  sizeBytes: number;
  createdAt: string;
}

export type CircuitBreakerState = 'CLOSED' | 'HALF_OPEN' | 'OPEN';

export interface CircuitBreakerStatus {
  serviceId: string;
  serviceName: string;
  state: CircuitBreakerState;
  failureThreshold: number;
  currentFailures: number;
  recoveryTimeoutSeconds: number;
  lastFailureAt?: string;
  lastStateChangeAt: string;
}

export interface DeadLetterJob {
  jobId: string;
  queueName: 'PAYMENT_CONFIRMATIONS' | 'WEBHOOK_DELIVERIES' | 'AUDIT_DISPATCH' | 'NOTIFICATIONS';
  payloadSummary: string;
  attemptsMade: number;
  maxRetries: number;
  failedAt: string;
  lastError: string;
  canRetry: boolean;
}

export interface BackupRecoveryCheck {
  component: 'FIRESTORE_DATABASE' | 'DIGITAL_ASSET_STORAGE' | 'ENCRYPTION_SECRETS' | 'LEDGER_AUDIT_LOGS';
  status: 'VERIFIED' | 'BACKUP_PENDING' | 'RECOVERY_TEST_PASSED';
  lastBackupAt: string;
  retentionDays: number;
  rpoHours: number; // Recovery Point Objective
  rtoMinutes: number; // Recovery Time Objective
}

export interface ReliabilityOverviewResponse {
  telemetry: SystemResourceMetrics;
  cacheCluster: {
    totalEntries: number;
    totalSizeBytes: number;
    hitRatio: number;
    entries: CacheClusterEntry[];
  };
  circuitBreakers: CircuitBreakerStatus[];
  deadLetterQueue: DeadLetterJob[];
  recoveryReadiness: BackupRecoveryCheck[];
  timestamp: string;
}
