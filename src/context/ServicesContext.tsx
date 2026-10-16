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

interface ServicesContextType {
  categories: ServiceCategory[];
  activeCategories: ServiceCategory[];
  loadingCategories: boolean;
  getCategoryBySlug: (slug: string) => ServiceCategory | undefined;
  saveCategory: (categoryData: Partial<ServiceCategory> & { name: string; slug: string }) => Promise<{ success: boolean; error?: string }>;

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
  setExpertVerification: (expertId: string, status: ExpertVerificationStatus, visibility?: 'PUBLIC' | 'HIDDEN') => Promise<{ success: boolean; error?: string }>;

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

  const [categories, setCategories] = useState<ServiceCategory[]>(INITIAL_SERVICE_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  const [experts, setExperts] = useState<PublicExpert[]>(() =>
    INITIAL_EXPERTS.filter((e) => e.verificationStatus === 'VERIFIED').map(({ userId, ...safe }) => safe)
  );
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

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch('/api/services/categories?includeInactive=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch {
      // Retain fallback
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch Public Experts
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

      const res = await fetch(`/api/services/experts?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.experts)) {
        setExperts(data.experts);
        return data.experts;
      }
    } catch (e) {
      console.warn('Error fetching experts:', e);
    } finally {
      setLoadingExperts(false);
    }
    return experts;
  }, [experts]);

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
      const res = await fetch(`/api/services/expert/me?userId=${user.uid}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setExpertProfile(data.profile);
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
        const res = await fetch('/api/services/expert/profile', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ...data, userId: user.uid, userRole: profile?.role || 'EXPERT' }),
        });
        const result = await res.json();
        if (result.success && result.profile) {
          setExpertProfile(result.profile);
          fetchExperts();
          return { success: true };
        }
        return { success: false, error: result.error || 'Failed to update expert profile' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [user, profile, getAuthHeaders, fetchExperts]
  );

  // Apply to become an expert
  const applyAsExpert = useCallback(
    async (data: any): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Sign in required.' };
      try {
        const res = await fetch('/api/services/expert/apply', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ...data, userId: user.uid }),
        });
        const result = await res.json();
        return result;
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
      const res = await fetch(`/api/services/requests/me?userId=${user.uid}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setCustomerRequests(data.requests);
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
        setExpertVerification,

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
