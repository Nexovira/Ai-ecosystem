/**
 * Phase 21: Nexovira AI-Assisted Operations & Workflow Automation Types
 * Permission-controlled automation, workflow execution lifecycles, and human approval queues.
 */

export type WorkflowStatus =
  | 'DRAFT'
  | 'DISABLED'
  | 'ENABLED'
  | 'QUEUED'
  | 'RUNNING'
  | 'AWAITING_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETRY_PENDING';

export type WorkflowCategory =
  | 'COMMERCE_OPERATIONS'
  | 'FINANCIAL_RECONCILIATION'
  | 'COMMUNICATION_AUTOMATION'
  | 'CONTENT_MODERATION'
  | 'SERVICE_OPERATIONS'
  | 'SYSTEM_HEALTH';

export type TriggerType =
  | 'EVENT_VERIFIED_PAYMENT'
  | 'EVENT_ORDER_CREATED'
  | 'EVENT_SELLER_APPLIED'
  | 'EVENT_DIGITAL_PURCHASE'
  | 'EVENT_DISCREPANCY_FLAGGED'
  | 'MANUAL_DISPATCH'
  | 'SCHEDULED_INTERVAL';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface WorkflowDefinition {
  id: string;
  name: string;
  category: WorkflowCategory;
  description: string;
  triggerType: TriggerType;
  requiresAiAssistance: boolean;
  requiresHumanApproval: boolean;
  requiredRole: string[];
  isEnabled: boolean;
  idempotencyStrategy: string;
  maxRetries: number;
  lastExecutionAt?: string;
  totalExecutionsCount: number;
  successCount: number;
  failureCount: number;
}

export interface WorkflowExecutionRun {
  runId: string;
  workflowId: string;
  workflowName: string;
  triggerSource: string;
  status: WorkflowStatus;
  startedAt: string;
  completedAt?: string;
  actorId?: string;
  actorEmail?: string;
  aiContributed: boolean;
  aiSummaryReport?: string;
  inputPayload?: any;
  resultPayload?: any;
  approvalRequestId?: string;
  errorMessage?: string;
  retryAttempt: number;
}

export interface HumanApprovalRequest {
  requestId: string;
  workflowId: string;
  workflowName: string;
  category: WorkflowCategory;
  actionRequested: string;
  reason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requestedBy: string;
  requestedAt: string;
  requiredApprovalRole: string[];
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  associatedRecordRef?: {
    type: 'ORDER' | 'SELLER' | 'TRANSACTION' | 'PRODUCT' | 'PAYOUT';
    id: string;
  };
}

export interface AutomationSystemMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  pendingApprovalsCount: number;
  aiAssistedRunsCount: number;
  lastSyncAt: string;
}
