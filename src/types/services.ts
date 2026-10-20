export type ExpertAvailability = 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
export type ExpertVisibility = 'PUBLIC' | 'HIDDEN';
export type ExpertVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface PortfolioLink {
  title: string;
  url: string;
  description?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  displayOrder: number;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export type ServiceListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface ServiceListing {
  id: string;
  listingId: string;
  title: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  priceStartingFrom: number;
  currency: string;
  deliveryDaysEstimate: number;
  revisionsAllowed: number;
  deliverables: string[];
  skills: string[];
  imageUrl: string;
  galleryImages?: string[];
  providerId?: string;
  providerName?: string;
  providerRole?: 'EXPERT' | 'MANAGEMENT';
  status: ServiceListingStatus;
  isAvailableForBooking: boolean;
  featured: boolean;
  orderCount?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertProfile {
  expertId: string;
  userId: string;
  fullName: string;
  professionalTitle: string;
  profileImage: string;
  bio: string;
  skills: string[];
  serviceCategories: string[]; // Category slugs or IDs
  yearsOfExperience: number;
  portfolioLinks: PortfolioLink[];
  location: string;
  languages: string[];
  availabilityStatus: ExpertAvailability;
  profileVisibility: ExpertVisibility;
  verificationStatus: ExpertVerificationStatus;
  completedProjectsCount?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

// Public-safe Expert representation that strips any private details
export type PublicExpert = Omit<ExpertProfile, 'userId'> & {
  // Safe to display publicly
};

export type ProjectRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEEDS_INFORMATION'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'AWAITING_CUSTOMER'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ProjectAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // Safe data URL or asset link
}

export interface ProjectRequest {
  requestId: string;
  requestReference: string; // e.g. NXR-REQ-2026-XXXXX
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  projectTitle: string;
  description: string;
  goals: string; // What customer wants to achieve
  requiredSkills: string[];
  budgetMin: number;
  budgetMax: number;
  currency: string; // NGN, USD, GBP, EUR
  preferredTimeline: string;
  priority: ProjectPriority;
  attachments: ProjectAttachment[];
  additionalNotes?: string;
  status: ProjectRequestStatus;
  assignedExpertId?: string;
  assignedExpertName?: string;
  assignedExpertTitle?: string;
  assignedExpertAvatar?: string;
  preferredExpertId?: string;
  internalNotes?: string; // Visible only to Nexovira Management
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface ProjectUpdate {
  updateId: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'EXPERT' | 'MANAGEMENT';
  message: string;
  attachments?: ProjectAttachment[];
  createdAt: string;
}

export interface ExpertApplication {
  applicationId: string;
  userId: string;
  fullName: string;
  email: string;
  professionalTitle: string;
  bio: string;
  skills: string[];
  serviceCategories: string[];
  yearsOfExperience: number;
  portfolioLinks: PortfolioLink[];
  location: string;
  languages: string[];
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface ServiceRequestSubmissionPayload {
  categoryId: string;
  projectTitle: string;
  description: string;
  goals: string;
  requiredSkills: string[];
  budgetMin: number;
  budgetMax: number;
  currency: string;
  preferredTimeline: string;
  priority: ProjectPriority;
  attachments?: ProjectAttachment[];
  additionalNotes?: string;
  preferredExpertId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface AuditLog {
  logId: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  entityType: 'EXPERT' | 'REQUEST' | 'CATEGORY' | 'SYSTEM';
  entityId: string;
  previousState?: string;
  newState?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export type NotificationEventType =
  | 'NEW_PROJECT_REQUEST'
  | 'REQUEST_RECEIVED'
  | 'REQUEST_MOVED_TO_REVIEW'
  | 'EXPERT_ASSIGNED'
  | 'EXPERT_ACCEPTS_ASSIGNMENT'
  | 'ADDITIONAL_INFO_REQUESTED'
  | 'PROJECT_STARTED'
  | 'PROJECT_AWAITING_CUSTOMER'
  | 'PROJECT_COMPLETED'
  | 'REQUEST_CANCELLED';

export interface NotificationEvent {
  eventId: string;
  eventType: NotificationEventType;
  recipient: string;
  recipientRole: 'MANAGEMENT' | 'CUSTOMER' | 'EXPERT';
  referenceId: string;
  title: string;
  message: string;
  status: 'RECORDED' | 'DISPATCHED';
  createdAt: string;
}

export interface AiProjectAnalysisResult {
  likelyCategorySlug: string;
  likelyCategoryName: string;
  suggestedSkills: string[];
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'ENTERPRISE';
  clarifyingQuestions: string[];
  missingInformation: string[];
  strategicAdvice: string;
}

