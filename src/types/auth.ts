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
  | 'SELLER'
  | 'EXPERT'
  | ManagementRole;

export type AccountStatus =
  | 'ACTIVE'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'UNDER_REVIEW'
  | 'DISABLED';

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthErrorState {
  code?: string;
  message: string;
}
