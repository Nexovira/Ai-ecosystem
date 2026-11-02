export type ManagementRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'CONTENT_MANAGER'
  | 'SUPPORT'
  | 'MODERATOR'
  | 'STAFF';

export type UserRole =
  | 'CUSTOMER'
  | 'AFFILIATE'
  | 'SELLER'
  | 'EXPERT'
  | ManagementRole;

export type AccountStatus =
  | 'ACTIVE'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'UNDER_REVIEW'
  | 'DISABLED';

export type RoleApplicationStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface RoleApplication {
  applicationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  currentRole: UserRole;
  targetRole: 'AFFILIATE' | 'EXPERT';
  status: RoleApplicationStatus;
  reason?: string;
  skills?: string[];
  portfolioUrl?: string;
  socialChannels?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  role: UserRole;
  pendingRole?: UserRole | null;
  roleApplicationId?: string | null;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthErrorState {
  code?: string;
  message: string;
}
