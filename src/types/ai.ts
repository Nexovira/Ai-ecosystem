/**
 * Phase 20: Nexovira AI Ecosystem Types
 * Modular, secure, permission-aware AI capability definitions, configurations, and conversation contracts.
 */

export type AiCapabilityId =
  | 'ECOSYSTEM_ASSISTANT'
  | 'MARKETPLACE_DISCOVERY'
  | 'ACADEMY_LEARNING_COMPANION'
  | 'SELLER_LISTING_OPTIMIZER'
  | 'SERVICES_PROJECT_SCOPER'
  | 'REVIEWS_SUMMARY_ANALYZER';

export interface AiCapabilityDefinition {
  id: AiCapabilityId;
  name: string;
  category: 'NAVIGATION' | 'COMMERCE' | 'EDUCATION' | 'CREATION' | 'SERVICES' | 'TRUST';
  description: string;
  targetUsers: string[];
  requiredRole?: string[];
  isEnabled: boolean;
  rateLimitPerMin: number;
  dailyQuotaPerUser: number;
  privacyClassification: 'PUBLIC_READ' | 'USER_ISOLATED' | 'MERCHANT_OWNED';
  modelAlias: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  contextLinks?: { label: string; url: string }[];
  suggestedPrompts?: string[];
}

export interface AiConversationSession {
  sessionId: string;
  userId?: string;
  capabilityId: AiCapabilityId;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AiSystemStatus {
  isConfigured: boolean;
  provider: string;
  activeModel: string;
  capabilities: AiCapabilityDefinition[];
  totalRequestsToday: number;
  errorsCountToday: number;
}

// Request & Response payload contracts
export interface AiAssistantRequest {
  message: string;
  sessionId?: string;
  capabilityId?: AiCapabilityId;
  context?: {
    currentPath?: string;
    productId?: string;
    courseId?: string;
    serviceCategory?: string;
  };
}

export interface AiAssistantResponse {
  success: boolean;
  available: boolean;
  sessionId: string;
  message?: string;
  contextLinks?: { label: string; url: string }[];
  suggestedPrompts?: string[];
  structuredData?: any;
  error?: string;
}

export interface SellerListingOptimizationRequest {
  currentTitle?: string;
  currentDescription?: string;
  targetCategory?: string;
  bulletFeatures?: string[];
  price?: number;
}

export interface SellerListingOptimizationResponse {
  success: boolean;
  available: boolean;
  optimizedTitle: string;
  optimizedDescription: string;
  keyHighlights: string[];
  suggestedTags: string[];
  readabilityScore: string;
  error?: string;
}
