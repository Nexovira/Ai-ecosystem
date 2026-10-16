export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSyllabusItem {
  week: number;
  title: string;
  topics: string[];
}

export interface Course {
  courseId: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  courseImage: string;
  category: string; // slug
  categoryName?: string;
  instructorName: string;
  instructorTitle?: string;
  instructorProfile?: string;
  instructorImage?: string;
  duration: string; // e.g., '10 Weeks'
  level: CourseLevel;
  requirements: string[];
  learningOutcomes: string[];
  scholarshipFee: number; // strictly 4500 NGN
  currency: 'NGN';
  whatsappGroupLink: string; // Course-specific WhatsApp community link
  status: CourseStatus;
  isFeatured: boolean;
  applicationsOpen: boolean;
  syllabus?: CourseSyllabusItem[];
  createdAt: string;
  updatedAt: string;
}

export type ScholarshipPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface ScholarshipPayment {
  paymentId: string;
  userId: string;
  courseId: string;
  applicationId?: string;
  provider: 'PAYSTACK';
  providerReference: string;
  amount: number; // 4500
  currency: 'NGN';
  paymentStatus: ScholarshipPaymentStatus;
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
  verifiedDate?: string;
}

export type ScholarshipApplicationStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESS_FORM_PENDING'
  | 'FORM_IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApplicationResponses {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  educationalBackground: string;
  currentOccupation: string;
  whyJoin: string;
  learningGoals: string;
  previousExperience: string;
  howCourseWillHelp: string;
  techExperience: string;
  additionalInfo?: string;
}

export interface ScholarshipApplication {
  applicationId: string;
  applicationReference: string; // e.g. "NEX-SCH-2026-XXXX"
  userId: string;
  courseId: string;
  courseTitle?: string;
  courseSlug?: string;
  paymentId: string;
  fullName: string;
  email: string;
  phone: string;
  responses: Partial<ApplicationResponses>;
  status: ScholarshipApplicationStatus;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  submittedDate?: string;
  reviewedDate?: string;
  reviewedBy?: string;
}

export type AcademyNotificationType =
  | 'PAYMENT_SUCCESSFUL'
  | 'PAYMENT_FAILED'
  | 'REGISTRATION_INCOMPLETE'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_ACCEPTED'
  | 'APPLICATION_REJECTED'
  | 'INFO_REQUESTED';

export interface AcademyNotificationEvent {
  eventId: string;
  type: AcademyNotificationType;
  recipient: string;
  recipientType: 'STUDENT' | 'MANAGEMENT';
  applicationId?: string;
  applicationReference?: string;
  courseId?: string;
  courseTitle?: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
