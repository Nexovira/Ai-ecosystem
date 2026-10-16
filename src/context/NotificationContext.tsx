import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  NotificationRecord,
  UserNotificationPreferences,
  NotificationCategory,
  NotificationReadStatus,
} from '../types/notification';

interface NotificationContextType {
  notifications: NotificationRecord[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  selectedCategory: string;
  selectedReadStatus: NotificationReadStatus | 'ALL';
  preferences: UserNotificationPreferences | null;
  preferencesLoading: boolean;
  setSelectedCategory: (cat: string) => void;
  setSelectedReadStatus: (status: NotificationReadStatus | 'ALL') => void;
  fetchNotifications: (cat?: string, readStatus?: NotificationReadStatus | 'ALL') => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  savePreferences: (updates: Partial<UserNotificationPreferences>) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedReadStatus, setSelectedReadStatus] = useState<NotificationReadStatus | 'ALL'>('ALL');
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState<boolean>(false);

  const getHeaders = useCallback((): HeadersInit => {
    if (!user) return {};
    return {
      'x-user-id': user.uid,
      'x-user-role': profile?.role || 'CUSTOMER',
      'Content-Type': 'application/json',
    };
  }, [user, profile]);

  // Fast fetch of unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch(`/api/notifications/unread-count?userId=${encodeURIComponent(user.uid)}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
      }
    } catch (err) {
      console.warn('Error fetching unread notification count:', err);
    }
  }, [user, getHeaders]);

  // Fetch full notification list
  const fetchNotifications = useCallback(
    async (categoryOverride?: string, readOverride?: NotificationReadStatus | 'ALL') => {
      if (!user) {
        setNotifications([]);
        setTotal(0);
        setUnreadCount(0);
        return;
      }

      const activeCategory = categoryOverride !== undefined ? categoryOverride : selectedCategory;
      const activeRead = readOverride !== undefined ? readOverride : selectedReadStatus;

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('userId', user.uid);
        if (activeCategory && activeCategory !== 'ALL') {
          params.append('category', activeCategory);
        }
        if (activeRead && activeRead !== 'ALL') {
          params.append('readStatus', activeRead);
        }

        const res = await fetch(`/api/notifications?${params.toString()}`, {
          headers: getHeaders(),
        });

        if (!res.ok) {
          throw new Error('Failed to retrieve notifications');
        }

        const data = await res.json();
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
        setUnreadCount(data.unreadCount || 0);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading notifications';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [user, selectedCategory, selectedReadStatus, getHeaders]
  );

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      return;
    }

    try {
      setPreferencesLoading(true);
      const res = await fetch(`/api/notifications/preferences?userId=${encodeURIComponent(user.uid)}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences || null);
      }
    } catch (err) {
      console.warn('Error fetching notification preferences:', err);
    } finally {
      setPreferencesLoading(false);
    }
  }, [user, getHeaders]);

  // Initial loading and interval refresh
  useEffect(() => {
    if (user) {
      refreshUnreadCount();
      fetchNotifications();
      fetchPreferences();

      // Gentle refresh of count every 45s
      const timer = setInterval(() => {
        refreshUnreadCount();
      }, 45000);

      return () => clearInterval(timer);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
      setPreferences(null);
    }
  }, [user, refreshUnreadCount, fetchNotifications, fetchPreferences]);

  // Mark single notification as read
  const markAsRead = async (id: string): Promise<boolean> => {
    if (!user) return false;

    // Optimistically update local list
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readStatus: 'READ', readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId: user.uid }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<boolean> => {
    if (!user) return false;

    // Optimistically update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readStatus: 'READ', readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId: user.uid }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // Save user preferences
  const savePreferences = async (updates: Partial<UserNotificationPreferences>): Promise<boolean> => {
    if (!user) return false;

    try {
      setPreferencesLoading(true);
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId: user.uid, ...updates }),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      if (data.preferences) {
        setPreferences(data.preferences);
      }
      return true;
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      return false;
    } finally {
      setPreferencesLoading(false);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        total,
        isLoading,
        error,
        selectedCategory,
        selectedReadStatus,
        preferences,
        preferencesLoading,
        setSelectedCategory,
        setSelectedReadStatus,
        fetchNotifications,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        savePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
