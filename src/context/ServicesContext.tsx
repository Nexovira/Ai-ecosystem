import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  ServiceCategory,
  PublicExpert,
  ExpertProfile,
  ProjectRequest,
  ProjectUpdate,
  ServiceRequestSubmissionPayload,
  ProjectRequestStatus,
  ExpertVerificationStatus,
  AuditLog,
  NotificationEvent,
  AiProjectAnalysisResult,
} from '../types/services';
import { INITIAL_SERVICE_CATEGORIES, INITIAL_EXPERTS } from '../data/servicesCatalog';
import { safeApiFetch } from '../lib/apiClient';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';

interface ServicesContextType {
  categories: ServiceCategory[];
  activeCategories: ServiceCategory[];
  loadingCategories: boolean;
  getCategoryBySlug: (slug: string) => ServiceCategory | undefined;
  saveCategory: (categoryData: Partial<ServiceCategory> & { name: string; slug: string }) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; mode?: 'DELETED' | 'DEACTIVATED'; message?: string; error?: string }>;

  experts: PublicExpert[];
  loadingExperts: boolean;
  fetchExperts: (filters?: { categorySlug?: string; skill?: string; search?: string; availability?: string }) => Promise<PublicExpert[]>;
  getExpertBySlugOrId: (slugOrId: string) => Promise<PublicExpert | null>;

  expertProfile: ExpertProfile | null;
  loadingExpertProfile: boolean;
  fetchMyExpertProfile: () => Promise<void>;
  saveMyExpertProfile: (data: Partial<ExpertProfile>) => Promise<{ success: boolean; error?: string }>;
  applyAsExpert: (data: any) => Promise<{ success: boolean; error?: string }>;

  customerRequests: ProjectRequest[];
  loadingCustomerRequests: boolean;
  fetchCustomerRequests: () => Promise<void>;
  submitProjectRequest: (payload: ServiceRequestSubmissionPayload) => Promise<{ success: boolean; request?: ProjectRequest; error?: string }>;
  getRequestDetail: (requestId: string) => Promise<{ request?: ProjectRequest; error?: string }>;

  expertProjects: ProjectRequest[];
  loadingExpertProjects: boolean;
  fetchExpertProjects: () => Promise<void>;
  updateProjectStatus: (requestId: string, status: ProjectRequestStatus, note?: string) => Promise<{ success: boolean; error?: string }>;

  getProjectUpdates: (requestId: string) => Promise<ProjectUpdate[]>;
  postProjectUpdate: (requestId: string, message: string, attachments?: any[]) => Promise<{ success: boolean; update?: ProjectUpdate; error?: string }>;

  managementRequests: ProjectRequest[];
  loadingManagementRequests: boolean;
  fetchManagementRequests: () => Promise<void>;
  assignExpert: (requestId: string, expertId: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  managementExperts: ExpertProfile[];
  loadingManagementExperts: boolean;
  fetchManagementExperts: () => Promise<void>;
  createExpertByAdmin: (data: Partial<ExpertProfile>) => Promise<{ success: boolean; expert?: ExpertProfile; error?: string }>;
  setExpertVerification: (expertId: string, status: ExpertVerificationStatus, visibility?: 'PUBLIC' | 'HIDDEN') => Promise<{ success: boolean; error?: string }>;
  updateExpertProfileByAdmin: (expertId: string, data: Partial<ExpertProfile>) => Promise<{ success: boolean; error?: string }>;
  deleteExpertByAdmin: (expertId: string) => Promise<{ success: boolean; mode?: 'DELETED' | 'SUSPENDED'; message?: string; error?: string }>;

  auditLogs: AuditLog[];
  loadingAuditLogs: boolean;
  fetchAuditLogs: () => Promise<void>;

  notifications: NotificationEvent[];
  loadingNotifications: boolean;
  fetchNotifications: () => Promise<void>;

  analyzeProjectWithAi: (title: string, description: string) => Promise<{ success: boolean; available?: boolean; analysis?: AiProjectAnalysisResult; error?: string }>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export const ServicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  const [experts, setExperts] = useState<PublicExpert[]>([]);
  const [loadingExperts, setLoadingExperts] = useState<boolean>(false);

  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  const [loadingExpertProfile, setLoadingExpertProfile] = useState<boolean>(false);

  const [customerRequests, setCustomerRequests] = useState<ProjectRequest[]>([]);
  const [loadingCustomerRequests, setLoadingCustomerRequests] = useState<boolean>(false);

  const [expertProjects, setExpertProjects] = useState<ProjectRequest[]>([]);
  const [loadingExpertProjects, setLoadingExpertProjects] = useState<boolean>(false);

  const [managementRequests, setManagementRequests] = useState<ProjectRequest[]>([]);
  const [loadingManagementRequests, setLoadingManagementRequests] = useState<boolean>(false);

  const [managementExperts, setManagementExperts] = useState<ExpertProfile[]>([]);
  const [loadingManagementExperts, setLoadingManagementExperts] = useState<boolean>(false);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);

  // Helper to build authenticated API request headers
  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (user?.uid) {
      headers['x-user-id'] = user.uid;
    }
    if (profile?.fullName || user?.displayName) {
      headers['x-user-name'] = profile?.fullName || user?.displayName || 'Member';
    }
    if (user?.email) {
      headers['x-user-email'] = user.email;
    }
    if (profile?.role) {
      headers['x-user-role'] = profile.role;
    }
    return headers;
  }, [user, profile]);

  // Fetch Categories with dual-layer API + authoritative Firestore fallback
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await safeApiFetch('/api/services/categories?includeInactive=true');
      const resAny = res as any;
      if (res && res.success && Array.isArray(resAny.categories) && resAny.categories.length > 0) {
        setCategories(resAny.categories);
        return;
      }

      // Direct Firestore authoritative query fallback
      if (db) {
        const snap = await getDocs(collection(db, 'serviceCategories')).catch(() => null);
        if (snap && !snap.empty) {
          const list: ServiceCategory[] = [];
          snap.forEach((d) => list.push(d.data() as ServiceCategory));
          list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          setCategories(list);
        }
      }
    } catch (err) {
      console.warn('Categories fetch notice:', err);
      if (db) {
        try {
          const snap = await getDocs(collection(db, 'serviceCategories'));
          if (!snap.empty) {
            const list: ServiceCategory[] = [];
            snap.forEach((d) => list.push(d.data() as ServiceCategory));
            list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            setCategories(list);
          }
        } catch {
          // ignore
        }
      }
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch Public Experts with dual-layer API + authoritative Firestore fallback
  const fetchExperts = useCallback(async (filters?: {
    categorySlug?: string;
    skill?: string;
    search?: string;
    availability?: string;
  }): Promise<PublicExpert[]> => {
    try {
      setLoadingExperts(true);
      const params = new URLSearchParams();
      if (filters?.categorySlug) params.append('category', filters.categorySlug);
      if (filters?.skill) params.append('skill', filters.skill);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.availability) params.append('availability', filters.availability);

      const res = await safeApiFetch(`/api/services/experts?${params.toString()}`);
      const resAny = res as any;
      if (res && res.success && Array.isArray(resAny.experts) && resAny.experts.length > 0) {
        setExperts(resAny.experts);
        return resAny.experts;
      }

      // Direct Firestore authoritative query fallback
      if (db) {
        const snap = await getDocs(collection(db, 'experts')).catch(() => null);
        if (snap && !snap.empty) {
          const list: PublicExpert[] = [];
          snap.forEach((d) => {
            const exp = d.data() as ExpertProfile;
            if (exp.profileVisibility === 'PUBLIC' && exp.verificationStatus === 'VERIFIED') {
              list.push({
                expertId: exp.expertId || d.id,
                fullName: exp.fullName,
                professionalTitle: exp.professionalTitle,
                bio: exp.bio,
                skills: exp.skills || [],
                serviceCategories: exp.serviceCategories || [],
                availabilityStatus: exp.availabilityStatus,
                profileVisibility: exp.profileVisibility,
                verificationStatus: exp.verificationStatus,
                rating: exp.rating || 5,
                yearsOfExperience: typeof exp.yearsOfExperience === 'number' ? exp.yearsOfExperience : 5,
                completedProjectsCount: exp.completedProjectsCount || 0,
                location: exp.location,
                languages: exp.languages || ['English'],
                portfolioLinks: exp.portfolioLinks || [],
                profileImage: exp.profileImage || '',
                createdAt: typeof exp.createdAt === 'string' ? exp.createdAt : new Date().toISOString(),
                updatedAt: typeof exp.updatedAt === 'string' ? exp.updatedAt : new Date().toISOString(),
              });
            }
          });
          setExperts(list);
          return list;
        }
      }
    } catch (e) {
      console.warn('Error fetching experts:', e);
      if (db) {
        try {
          const snap = await getDocs(collection(db, 'experts'));
          if (!snap.empty) {
            const list: PublicExpert[] = [];
            snap.forEach((d) => {
              const exp = d.data() as ExpertProfile;
              if (exp.profileVisibility === 'PUBLIC' && exp.verificationStatus === 'VERIFIED') {
                list.push({
                  expertId: exp.expertId || d.id,
                  fullName: exp.fullName,
                  professionalTitle: exp.professionalTitle,
                  bio: exp.bio,
                  skills: exp.skills || [],
                  serviceCategories: exp.serviceCategories || [],
                  availabilityStatus: exp.availabilityStatus,
                  profileVisibility: exp.profileVisibility,
                  verificationStatus: exp.verificationStatus,
                  rating: exp.rating || 5,
                  yearsOfExperience: typeof exp.yearsOfExperience === 'number' ? exp.yearsOfExperience : 5,
                  completedProjectsCount: exp.completedProjectsCount || 0,
                  location: exp.location,
                  languages: exp.languages || ['English'],
                  portfolioLinks: exp.portfolioLinks || [],
                  profileImage: exp.profileImage || '',
                  createdAt: typeof exp.createdAt === 'string' ? exp.createdAt : new Date().toISOString(),
                  updatedAt: typeof exp.updatedAt === 'string' ? exp.updatedAt : new Date().toISOString(),
                });
              }
            });
            setExperts(list);
            return list;
          }
        } catch {
          // ignore
        }
      }
    } finally {
      setLoadingExperts(false);
    }
    return [];
  }, []);

  // Initial load
  useEffect(() => {
    fetchCategories();
    fetchExperts();
  }, [fetchCategories, fetchExperts]);

  // Get Category by Slug
  const getCategoryBySlug = useCallback(
    (slug: string) => {
      return categories.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
    },
    [categories]
  );

  // Active categories for public views
  const activeCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Single Expert Detail
  const getExpertBySlugOrId = useCallback(
    async (slugOrId: string): Promise<PublicExpert | null> => {
      try {
        const res = await fetch(`/api/services/experts/${encodeURIComponent(slugOrId)}`);
        const data = await res.json();
        if (data.success && data.expert) {
          return data.expert;
        }
      } catch {
        // Fallback search in memory
      }
      return (
        experts.find(
          (e) =>
            e.expertId.toLowerCase() === slugOrId.toLowerCase() ||
            e.fullName.toLowerCase().replace(/[^a-z0-9]/g, '-') === slugOrId.toLowerCase()
        ) || null
      );
    },
    [experts]
  );

  // Fetch Authenticated Expert's Own Profile
  const fetchMyExpertProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingExpertProfile(true);
      const res = await safeApiFetch<{ success: boolean; profile?: ExpertProfile }>(
        `/api/services/expert/me?userId=${user.uid}`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (res.data?.success && res.data.profile) {
        setExpertProfile(res.data.profile);
      } else if (db) {
        // Direct Firestore fallback
        const docRef = doc(db, 'experts', `exp-${user.uid.slice(0, 10)}`);
        const snap = await getDoc(docRef).catch(() => null);
        if (snap && snap.exists()) {
          setExpertProfile(snap.data() as ExpertProfile);
        }
      }
    } catch (e) {
      console.warn('Error fetching expert profile:', e);
    } finally {
      setLoadingExpertProfile(false);
    }
  }, [user, getAuthHeaders]);

  // Save/Update Authenticated Expert's Profile
  const saveMyExpertProfile = useCallback(
    async (data: Partial<ExpertProfile>): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Sign in required.' };
      try {
        const res = await safeApiFetch<{ success: boolean; profile?: ExpertProfile; error?: string }>(
          '/api/services/expert/profile',
          {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ...data, userId: user.uid, userRole: profile?.role || 'EXPERT' }),
          }
        );
        if (res.data?.success && res.data.profile) {
          setExpertProfile(res.data.profile);
          fetchExperts();
          return { success: true };
        }

        // Direct Firestore sync fallback
        if (db) {
          const expertId = `exp-${user.uid.slice(0, 10)}`;
          const now = new Date().toISOString();
          await setDoc(doc(db, 'experts', expertId), {
            ...data,
            userId: user.uid,
            updatedAt: now,
          }, { merge: true }).catch(() => null);
          return { success: true };
        }

        return { success: false, error: res.error || 'Failed to update expert profile' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [user, profile, getAuthHeaders, fetchExperts]
  );

  // Apply to become an expert (with safe API parsing and authoritative Firestore fallback)
  const applyAsExpert = useCallback(
    async (data: any): Promise<{ success: boolean; message?: string; error?: string }> => {
      if (!user) return { success: false, error: 'Sign in required.' };
      try {
        const res = await safeApiFetch<{ success: boolean; application?: any; message?: string; error?: string }>(
          '/api/services/expert/apply',
          {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ...data, userId: user.uid }),
          }
        );

        if (res.data?.success) {
          return {
            success: true,
            message: res.data.message || 'Your specialist application has been submitted and is pending review by management.',
          };
        }

        // Direct authoritative Firestore fallback if API is unreachable (e.g. Vercel rewrite or proxy issue)
        if (db) {
          const now = new Date().toISOString();
          const applicationId = `app-exp-${user.uid}`;
          const roleAppId = `roleapp_${user.uid}_expert`;
          const expertId = `exp-${user.uid.slice(0, 10)}`;

          const expertAppData = {
            applicationId,
            userId: user.uid,
            fullName: (data.fullName || user.displayName || 'Specialist').trim(),
            email: (data.email || user.email || '').trim(),
            professionalTitle: (data.professionalTitle || 'Ecosystem Specialist').trim(),
            bio: (data.bio || '').trim(),
            skills: data.skills || [],
            serviceCategories: data.serviceCategories || [],
            yearsOfExperience: Number(data.yearsOfExperience) || 1,
            portfolioLinks: data.portfolioLinks || [],
            location: data.location || 'Remote',
            languages: data.languages || ['English'],
            status: 'PENDING_REVIEW',
            submittedAt: now,
            updatedAt: now,
          };

          const roleAppData = {
            applicationId: roleAppId,
            userId: user.uid,
            userEmail: expertAppData.email,
            userName: expertAppData.fullName,
            currentRole: 'CUSTOMER',
            targetRole: 'EXPERT',
            status: 'PENDING_REVIEW',
            reason: expertAppData.bio,
            skills: expertAppData.skills,
            portfolioUrl: (data.portfolioLinks && data.portfolioLinks[0]?.url) || '',
            professionalTitle: expertAppData.professionalTitle,
            location: expertAppData.location,
            yearsOfExperience: expertAppData.yearsOfExperience,
            serviceCategories: expertAppData.serviceCategories,
            createdAt: now,
            updatedAt: now,
          };

          await setDoc(doc(db, 'expertApplications', applicationId), expertAppData, { merge: true }).catch(() => null);
          await setDoc(doc(db, 'expertApplications', user.uid), expertAppData, { merge: true }).catch(() => null);
          await setDoc(doc(db, 'roleApplications', roleAppId), roleAppData, { merge: true }).catch(() => null);
          await setDoc(doc(db, 'users', user.uid), {
            pendingRole: 'EXPERT',
            roleApplicationId: roleAppId,
            updatedAt: now,
          }, { merge: true }).catch(() => null);

          await setDoc(doc(db, 'experts', expertId), {
            expertId,
            userId: user.uid,
            fullName: expertAppData.fullName,
            professionalTitle: expertAppData.professionalTitle,
            bio: expertAppData.bio,
            skills: expertAppData.skills,
            serviceCategories: expertAppData.serviceCategories,
            yearsOfExperience: expertAppData.yearsOfExperience,
            portfolioLinks: expertAppData.portfolioLinks,
            location: expertAppData.location,
            availabilityStatus: 'AVAILABLE',
            profileVisibility: 'HIDDEN',
            verificationStatus: 'PENDING',
            completedProjectsCount: 0,
            rating: 5.0,
            createdAt: now,
            updatedAt: now,
          }, { merge: true }).catch(() => null);

          return {
            success: true,
            message: 'Your specialist application has been recorded and is pending review by management.',
          };
        }

        return {
          success: false,
          error: res.error || 'Failed to submit specialist application.',
        };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [user, getAuthHeaders]
  );

  // Fetch Customer's Own Project Requests
  const fetchCustomerRequests = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingCustomerRequests(true);
      const res = await safeApiFetch<{ success: boolean; requests?: ProjectRequest[] }>(
        `/api/services/requests/me?userId=${user.uid}`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (res.data?.success && Array.isArray(res.data.requests)) {
        setCustomerRequests(res.data.requests);
      }
    } catch (e) {
      console.warn('Error fetching customer requests:', e);
    } finally {
      setLoadingCustomerRequests(false);
    }
  }, [user, getAuthHeaders]);

  // Submit Project Request
  const submitProjectRequest = useCallback(
    async (payload: ServiceRequestSubmissionPayload): Promise<{ success: boolean; request?: ProjectRequest; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Please sign in or create an account to start your project.' };
      }
      try {
        const res = await fetch('/api/services/requests', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...payload,
            customerId: user.uid,
            contactName: payload.contactName || profile?.fullName || user.displayName || 'Client',
            contactEmail: payload.contactEmail || user.email || '',
          }),
        });
        const result = await res.json();
        if (result.success && result.request) {
          setCustomerRequests((prev) => [result.request!, ...prev]);
          return { success: true, request: result.request };
        }
        return { success: false, error: result.error || 'Failed to submit request' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [user, profile, getAuthHeaders]
  );

  // Get Single Request Detail
  const getRequestDetail = useCallback(
    async (requestId: string): Promise<{ request?: ProjectRequest; error?: string }> => {
      if (!user) return { error: 'Authentication required' };
      try {
        const res = await fetch(`/api/services/requests/${requestId}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success && data.request) {
          return { request: data.request };
        }
        return { error: data.error || 'Project not found' };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Failed to load project details' };
      }
    },
    [user, getAuthHeaders]
  );

  // Fetch Expert Assigned Projects
  const fetchExpertProjects = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingExpertProjects(true);
      const res = await fetch(`/api/services/expert/projects?userId=${user.uid}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setExpertProjects(data.projects);
      }
    } catch (e) {
      console.warn('Error fetching expert projects:', e);
    } finally {
      setLoadingExpertProjects(false);
    }
  }, [user, getAuthHeaders]);

  // Update Project Status
  const updateProjectStatus = useCallback(
    async (requestId: string, status: ProjectRequestStatus, note?: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Authentication required' };
      try {
        const res = await fetch(`/api/services/requests/${requestId}/status`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status,
            note,
            userId: user.uid,
            userRole: profile?.role || 'CUSTOMER',
          }),
        });
        const result = await res.json();
        if (result.success) {
          // Refresh state lists
          fetchCustomerRequests();
          fetchExpertProjects();
          if (['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(profile?.role || '')) {
            fetchManagementRequests();
          }
          return { success: true };
        }
        return { success: false, error: result.error || 'Failed to update status' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, getAuthHeaders, fetchCustomerRequests, fetchExpertProjects]
  );

  // Project Communication Updates
  const getProjectUpdates = useCallback(
    async (requestId: string): Promise<ProjectUpdate[]> => {
      if (!user) return [];
      try {
        const res = await fetch(`/api/services/projects/${requestId}/updates`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.updates)) {
          return data.updates;
        }
      } catch (e) {
        console.warn('Error fetching updates:', e);
      }
      return [];
    },
    [user, getAuthHeaders]
  );

  const postProjectUpdate = useCallback(
    async (
      requestId: string,
      message: string,
      attachments?: any[]
    ): Promise<{ success: boolean; update?: ProjectUpdate; error?: string }> => {
      if (!user) return { success: false, error: 'Authentication required' };
      try {
        const isManagement = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(profile?.role || '');
        const isExpert = profile?.role === 'EXPERT';
        const senderRole = isManagement ? 'MANAGEMENT' : isExpert ? 'EXPERT' : 'CUSTOMER';

        const res = await fetch(`/api/services/projects/${requestId}/updates`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            message,
            attachments,
            senderId: user.uid,
            senderName: profile?.fullName || user.displayName || 'Member',
            senderRole,
          }),
        });
        const result = await res.json();
        return result;
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [user, profile, getAuthHeaders]
  );

  // Management: Fetch all requests
  const fetchManagementRequests = useCallback(async () => {
    try {
      setLoadingManagementRequests(true);
      const res = await fetch('/api/services/management/requests', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setManagementRequests(data.requests);
      }
    } catch (e) {
      console.warn('Error fetching management requests:', e);
    } finally {
      setLoadingManagementRequests(false);
    }
  }, [getAuthHeaders]);

  // Management: Assign expert
  const assignExpert = useCallback(
    async (requestId: string, expertId: string, notes?: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/services/management/assign', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ requestId, expertId, internalNotes: notes }),
        });
        const result = await res.json();
        if (result.success) {
          fetchManagementRequests();
          return { success: true };
        }
        return { success: false, error: result.error || 'Failed to assign expert' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [getAuthHeaders, fetchManagementRequests]
  );

  // Management: Fetch all experts
  const fetchManagementExperts = useCallback(async () => {
    try {
      setLoadingManagementExperts(true);
      const res = await fetch('/api/services/management/experts', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.experts)) {
        setManagementExperts(data.experts);
      }
    } catch (e) {
      console.warn('Error fetching management experts:', e);
    } finally {
      setLoadingManagementExperts(false);
    }
  }, [getAuthHeaders]);

  // Management: Create new specialist profile
  const createExpertByAdmin = useCallback(
    async (
      data: Partial<ExpertProfile>
    ): Promise<{ success: boolean; expert?: ExpertProfile; error?: string }> => {
      try {
        const res = await fetch('/api/services/management/experts', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.success) {
          fetchManagementExperts();
          fetchExperts();
          return { success: true, expert: result.expert };
        }
        return { success: false, error: result.error || 'Failed to create specialist' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [getAuthHeaders, fetchManagementExperts, fetchExperts]
  );

  // Management: Set expert verification status
  const setExpertVerification = useCallback(
    async (
      expertId: string,
      status: ExpertVerificationStatus,
      visibility?: 'PUBLIC' | 'HIDDEN'
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/services/management/experts/${expertId}/verification`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status, profileVisibility: visibility }),
        });
        const result = await res.json();
        if (result.success) {
          fetchManagementExperts();
          fetchExperts();
          return { success: true };
        }
        return { success: false, error: result.error || 'Failed to update verification' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [getAuthHeaders, fetchManagementExperts, fetchExperts]
  );

  // Management: Save / update service category
  const saveCategory = useCallback(
    async (
      categoryData: Partial<ServiceCategory> & { name: string; slug: string }
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/services/categories', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(categoryData),
        });
        const result = await res.json();
        if (result.success) {
          fetchCategories();
          return { success: true };
        }
        return { success: false, error: result.error || 'Failed to save category' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [getAuthHeaders, fetchCategories]
  );

  // Management: Delete / Deactivate service category
  const deleteCategory = useCallback(
    async (
      id: string
    ): Promise<{ success: boolean; mode?: 'DELETED' | 'DEACTIVATED'; message?: string; error?: string }> => {
      try {
        const res = await fetch(`/api/services/categories/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        const result = await res.json();
        if (result.success) {
          fetchCategories();
          return { success: true, mode: result.mode, message: result.message };
        }
        return { success: false, error: result.error || 'Failed to delete category' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [getAuthHeaders, fetchCategories]
  );

  // Management: Update expert profile
  const updateExpertProfileByAdmin = useCallback(
    async (
      expertId: string,
      data: Partial<ExpertProfile>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/services/management/experts/${encodeURIComponent(expertId)}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.success) {
          fetchManagementExperts();
          fetchExperts();
          return { success: true };
        }
        return { success: false, error: result.error || 'Failed to update expert profile' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [getAuthHeaders, fetchManagementExperts, fetchExperts]
  );

  // Management: Delete / Suspend expert
  const deleteExpertByAdmin = useCallback(
    async (
      expertId: string
    ): Promise<{ success: boolean; mode?: 'DELETED' | 'SUSPENDED'; message?: string; error?: string }> => {
      try {
        const res = await fetch(`/api/services/management/experts/${encodeURIComponent(expertId)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        const result = await res.json();
        if (result.success) {
          fetchManagementExperts();
          fetchExperts();
          return { success: true, mode: result.mode, message: result.message };
        }
        return { success: false, error: result.error || 'Failed to delete expert' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [getAuthHeaders, fetchManagementExperts, fetchExperts]
  );

  // Management: Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoadingAuditLogs(true);
      const res = await fetch('/api/services/management/audit-logs', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.auditLogs)) {
        setAuditLogs(data.auditLogs);
      }
    } catch (e) {
      console.warn('Error fetching audit logs:', e);
    } finally {
      setLoadingAuditLogs(false);
    }
  }, [getAuthHeaders]);

  // Management: Fetch notification events
  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const res = await fetch('/api/services/management/notifications', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.warn('Error fetching notifications:', e);
    } finally {
      setLoadingNotifications(false);
    }
  }, [getAuthHeaders]);

  // AI Project Requirement Analysis
  const analyzeProjectWithAi = useCallback(
    async (
      title: string,
      description: string
    ): Promise<{ success: boolean; available?: boolean; analysis?: AiProjectAnalysisResult; error?: string }> => {
      try {
        const res = await fetch('/api/services/analyze-project', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ title, description }),
        });
        const data = await res.json();
        return data;
      } catch (err: unknown) {
        return {
          success: false,
          available: false,
          error: err instanceof Error ? err.message : 'Network error communicating with AI service',
        };
      }
    },
    [getAuthHeaders]
  );

  // Auto-fetch user-scoped data when user signs in
  useEffect(() => {
    if (user) {
      fetchCustomerRequests();
      if (profile?.role === 'EXPERT' || profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN') {
        fetchMyExpertProfile();
        fetchExpertProjects();
      }
      if (profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN' || profile?.role === 'STAFF') {
        fetchManagementRequests();
        fetchManagementExperts();
        fetchAuditLogs();
        fetchNotifications();
      }
    } else {
      setCustomerRequests([]);
      setExpertProjects([]);
      setExpertProfile(null);
      setAuditLogs([]);
      setNotifications([]);
    }
  }, [user, profile, fetchCustomerRequests, fetchMyExpertProfile, fetchExpertProjects, fetchManagementRequests, fetchManagementExperts, fetchAuditLogs, fetchNotifications]);

  return (
    <ServicesContext.Provider
      value={{
        categories,
        activeCategories,
        loadingCategories,
        getCategoryBySlug,
        saveCategory,
        deleteCategory,

        experts,
        loadingExperts,
        fetchExperts,
        getExpertBySlugOrId,

        expertProfile,
        loadingExpertProfile,
        fetchMyExpertProfile,
        saveMyExpertProfile,
        applyAsExpert,

        customerRequests,
        loadingCustomerRequests,
        fetchCustomerRequests,
        submitProjectRequest,
        getRequestDetail,

        expertProjects,
        loadingExpertProjects,
        fetchExpertProjects,
        updateProjectStatus,

        getProjectUpdates,
        postProjectUpdate,

        managementRequests,
        loadingManagementRequests,
        fetchManagementRequests,
        assignExpert,
        managementExperts,
        loadingManagementExperts,
        fetchManagementExperts,
        createExpertByAdmin,
        setExpertVerification,
        updateExpertProfileByAdmin,
        deleteExpertByAdmin,

        auditLogs,
        loadingAuditLogs,
        fetchAuditLogs,

        notifications,
        loadingNotifications,
        fetchNotifications,

        analyzeProjectWithAi,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = (): ServicesContextType => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};
