import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  Course,
  CourseCategory,
  ScholarshipApplication,
  ScholarshipPayment,
  ApplicationResponses,
  ScholarshipApplicationStatus,
  AcademyNotificationEvent,
} from '../types/academy';

interface AcademyContextType {
  courses: Course[];
  categories: CourseCategory[];
  loadingCourses: boolean;
  error: string | null;
  fetchCourses: (filters?: { category?: string; level?: string; search?: string; includeAll?: boolean }) => Promise<Course[]>;
  getCourseBySlug: (slug: string) => Promise<Course | null>;
  fetchCategories: (includeInactive?: boolean) => Promise<CourseCategory[]>;

  // Student Flow
  initiateScholarshipPayment: (courseId: string) => Promise<{
    success: boolean;
    alreadyCompleted?: boolean;
    alreadyPaid?: boolean;
    applicationId?: string;
    paymentId?: string;
    reference?: string;
    authorizationUrl?: string;
    isTestMode?: boolean;
    amount?: number;
    currency?: string;
    message?: string;
  }>;
  verifyScholarshipPayment: (reference: string) => Promise<{
    success: boolean;
    verified: boolean;
    applicationId?: string;
    courseId?: string;
    courseSlug?: string;
    error?: string;
  }>;
  getApplication: (applicationId: string) => Promise<{
    success: boolean;
    application?: ScholarshipApplication;
    course?: Course | null;
    error?: string;
  }>;
  submitRegistration: (
    applicationId: string,
    responses: ApplicationResponses
  ) => Promise<{ success: boolean; application?: ScholarshipApplication; error?: string }>;
  studentApplications: Array<{
    application: ScholarshipApplication;
    course: Course | null;
    payment: ScholarshipPayment | null;
  }>;
  fetchStudentApplications: () => Promise<void>;
  loadingApplications: boolean;

  // Management Ops
  managementApplications: Array<{
    application: ScholarshipApplication;
    course: Course | null;
    payment: ScholarshipPayment | null;
  }>;
  fetchManagementApplications: (filters?: { courseId?: string; status?: string; search?: string }) => Promise<void>;
  reviewApplication: (
    applicationId: string,
    status: ScholarshipApplicationStatus,
    internalNotes?: string
  ) => Promise<boolean>;
  saveCourse: (data: Partial<Course>) => Promise<Course | null>;
  deleteCourse: (courseId: string) => Promise<boolean>;
  saveCategory: (data: Partial<CourseCategory>) => Promise<CourseCategory | null>;
  managementPayments: Array<{
    payment: ScholarshipPayment;
    course: Course | null;
    application: ScholarshipApplication | null;
  }>;
  fetchManagementPayments: () => Promise<void>;
  managementNotifications: AcademyNotificationEvent[];
  fetchManagementNotifications: () => Promise<void>;
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [studentApplications, setStudentApplications] = useState<
    Array<{ application: ScholarshipApplication; course: Course | null; payment: ScholarshipPayment | null }>
  >([]);
  const [loadingApplications, setLoadingApplications] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Management states
  const [managementApplications, setManagementApplications] = useState<
    Array<{ application: ScholarshipApplication; course: Course | null; payment: ScholarshipPayment | null }>
  >([]);
  const [managementPayments, setManagementPayments] = useState<
    Array<{ payment: ScholarshipPayment; course: Course | null; application: ScholarshipApplication | null }>
  >([]);
  const [managementNotifications, setManagementNotifications] = useState<AcademyNotificationEvent[]>([]);

  const isManagement = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(profile?.role || '');

  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (user?.uid) headers['x-user-id'] = user.uid;
    if (user?.email) headers['x-user-email'] = user.email;
    if (profile?.role) headers['x-user-role'] = profile.role;
    return headers;
  }, [user, profile]);

  const fetchCategories = useCallback(async (includeInactive = false): Promise<CourseCategory[]> => {
    try {
      const res = await fetch(`/api/academy/categories?includeInactive=${includeInactive}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
        return data.categories;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch academy categories:', err);
      return [];
    }
  }, []);

  const fetchCourses = useCallback(
    async (filters?: { category?: string; level?: string; search?: string; includeAll?: boolean }): Promise<Course[]> => {
      setLoadingCourses(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters?.category) params.set('category', filters.category);
        if (filters?.level && filters.level !== 'ALL') params.set('level', filters.level);
        if (filters?.search) params.set('search', filters.search);
        if (filters?.includeAll && isManagement) params.set('includeAll', 'true');

        const res = await fetch(`/api/academy/courses?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          setCourses(data.courses);
          return data.courses;
        } else {
          throw new Error(data.error || 'Failed to retrieve courses');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error';
        setError(msg);
        return [];
      } finally {
        setLoadingCourses(false);
      }
    },
    [getAuthHeaders, isManagement]
  );

  const getCourseBySlug = useCallback(
    async (slug: string): Promise<Course | null> => {
      try {
        const res = await fetch(`/api/academy/courses/${encodeURIComponent(slug)}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success && data.course) {
          return data.course;
        }
        return null;
      } catch (err) {
        console.error('Error fetching course by slug:', err);
        return null;
      }
    },
    [getAuthHeaders]
  );

  const initiateScholarshipPayment = async (courseId: string) => {
    if (!user) {
      return { success: false, message: 'You must be signed in to apply for a scholarship.' };
    }

    try {
      const res = await fetch('/api/academy/scholarships/initiate-payment', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courseId,
          userId: user.uid,
          userEmail: user.email,
        }),
      });
      const data = await res.json();
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment initiation failed';
      return { success: false, message: msg };
    }
  };

  const verifyScholarshipPayment = async (reference: string) => {
    try {
      const res = await fetch('/api/academy/scholarships/verify-payment', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reference,
          userId: user?.uid,
        }),
      });
      const data = await res.json();
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment verification failed';
      return { success: false, verified: false, error: msg };
    }
  };

  const getApplication = async (applicationId: string) => {
    try {
      const res = await fetch(`/api/academy/applications/${encodeURIComponent(applicationId)}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to retrieve application' };
      }
      return { success: true, application: data.application, course: data.course };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Application fetch failed';
      return { success: false, error: msg };
    }
  };

  const submitRegistration = async (applicationId: string, responses: ApplicationResponses) => {
    try {
      const res = await fetch(`/api/academy/applications/${encodeURIComponent(applicationId)}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user?.uid,
          responses,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Submission failed' };
      }
      return { success: true, application: data.application };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during submission';
      return { success: false, error: msg };
    }
  };

  const fetchStudentApplications = useCallback(async () => {
    if (!user) return;
    setLoadingApplications(true);
    try {
      const res = await fetch('/api/academy/applications/user/me', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        setStudentApplications(data.applications);
      }
    } catch (err) {
      console.error('Error fetching student applications:', err);
    } finally {
      setLoadingApplications(false);
    }
  }, [user, getAuthHeaders]);

  const fetchManagementApplications = useCallback(
    async (filters?: { courseId?: string; status?: string; search?: string }) => {
      if (!isManagement) return;
      try {
        const params = new URLSearchParams();
        if (filters?.courseId) params.set('courseId', filters.courseId);
        if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
        if (filters?.search) params.set('search', filters.search);

        const res = await fetch(`/api/academy/management/applications?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.applications)) {
          setManagementApplications(data.applications);
        }
      } catch (err) {
        console.error('Error fetching management applications:', err);
      }
    },
    [isManagement, getAuthHeaders]
  );

  const reviewApplication = async (
    applicationId: string,
    status: ScholarshipApplicationStatus,
    internalNotes?: string
  ): Promise<boolean> => {
    if (!isManagement) return false;
    try {
      const res = await fetch(`/api/academy/management/applications/${encodeURIComponent(applicationId)}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, internalNotes }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchManagementApplications();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error reviewing application:', err);
      return false;
    }
  };

  const saveCourse = async (data: Partial<Course>): Promise<Course | null> => {
    if (!isManagement) return null;
    try {
      const isEdit = !!data.courseId;
      const url = isEdit ? `/api/academy/courses/${data.courseId}` : '/api/academy/courses';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.course) {
        await fetchCourses({ includeAll: true });
        return json.course;
      }
      return null;
    } catch (err) {
      console.error('Error saving course:', err);
      return null;
    }
  };

  const deleteCourse = async (courseId: string): Promise<boolean> => {
    if (!isManagement) return false;
    try {
      const res = await fetch(`/api/academy/courses/${encodeURIComponent(courseId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCourses({ includeAll: true });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting course:', err);
      return false;
    }
  };

  const saveCategory = async (data: Partial<CourseCategory>): Promise<CourseCategory | null> => {
    if (!isManagement) return null;
    try {
      const res = await fetch('/api/academy/categories', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.category) {
        await fetchCategories(true);
        return json.category;
      }
      return null;
    } catch (err) {
      console.error('Error saving category:', err);
      return null;
    }
  };

  const fetchManagementPayments = useCallback(async () => {
    if (!isManagement) return;
    try {
      const res = await fetch('/api/academy/management/payments', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.payments)) {
        setManagementPayments(data.payments);
      }
    } catch (err) {
      console.error('Error fetching management payments:', err);
    }
  }, [isManagement, getAuthHeaders]);

  const fetchManagementNotifications = useCallback(async () => {
    if (!isManagement) return;
    try {
      const res = await fetch('/api/academy/management/notifications', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setManagementNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Error fetching management notifications:', err);
    }
  }, [isManagement, getAuthHeaders]);

  // Initial load
  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, [fetchCategories, fetchCourses]);

  // Load student applications if user is logged in
  useEffect(() => {
    if (user) {
      fetchStudentApplications();
    } else {
      setStudentApplications([]);
    }
  }, [user, fetchStudentApplications]);

  return (
    <AcademyContext.Provider
      value={{
        courses,
        categories,
        loadingCourses,
        error,
        fetchCourses,
        getCourseBySlug,
        fetchCategories,
        initiateScholarshipPayment,
        verifyScholarshipPayment,
        getApplication,
        submitRegistration,
        studentApplications,
        fetchStudentApplications,
        loadingApplications,
        managementApplications,
        fetchManagementApplications,
        reviewApplication,
        saveCourse,
        deleteCourse,
        saveCategory,
        managementPayments,
        fetchManagementPayments,
        managementNotifications,
        fetchManagementNotifications,
      }}
    >
      {children}
    </AcademyContext.Provider>
  );
};

export const useAcademy = (): AcademyContextType => {
  const context = useContext(AcademyContext);
  if (!context) {
    throw new Error('useAcademy must be used within an AcademyProvider');
  }
  return context;
};
