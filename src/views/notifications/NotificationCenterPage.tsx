import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Filter,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Package,
  CreditCard,
  GraduationCap,
  Briefcase,
  Share2,
  Shield,
  SlidersHorizontal,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { NotificationCategory, NotificationPriority, NotificationRecord } from '../../types/notification';

export const NotificationCenterPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    total,
    isLoading,
    selectedCategory,
    selectedReadStatus,
    setSelectedCategory,
    setSelectedReadStatus,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(profile?.role || '');

  const categories: { label: string; value: string }[] = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Orders & Commerce', value: 'ORDER' },
    { label: 'Payments', value: 'PAYMENT' },
    { label: 'Academy', value: 'ACADEMY' },
    { label: 'Tech & Services', value: 'SERVICES' },
    { label: 'Affiliates', value: 'AFFILIATE' },
    { label: 'Security & Auth', value: 'SECURITY' },
    ...(isAdmin ? [{ label: 'Management Desk', value: 'MANAGEMENT' }] : []),
  ];

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    fetchNotifications(cat, selectedReadStatus);
  };

  const handleReadStatusChange = (status: 'ALL' | 'UNREAD' | 'READ') => {
    setSelectedReadStatus(status);
    fetchNotifications(selectedCategory, status);
  };

  const handleAction = async (item: NotificationRecord) => {
    if (item.readStatus === 'UNREAD') {
      await markAsRead(item.id);
    }
    if (item.actionUrl) {
      navigate(item.actionUrl as any);
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#0682F4]/30 text-[#08E6F9] border border-[#08E6F9]/50">
            Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0682F4]/20 text-[#06C3F8] border border-[#06C3F8]/40">
            High Priority
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-[#01213D] text-[#CCD2D9]/70 border border-[#2B7EB5]/20">
            Notice
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-[#01213D] text-[#CCD2D9] border border-[#0682F4]/20">
            Standard
          </span>
        );
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'ORDER':
      case 'MARKETPLACE':
        return <Package className="w-5 h-5 text-[#06C3F8]" />;
      case 'PAYMENT':
      case 'PAYOUT':
        return <CreditCard className="w-5 h-5 text-[#08E6F9]" />;
      case 'ACADEMY':
        return <GraduationCap className="w-5 h-5 text-[#0682F4]" />;
      case 'SERVICES':
        return <Briefcase className="w-5 h-5 text-[#26B2E2]" />;
      case 'AFFILIATE':
        return <Share2 className="w-5 h-5 text-[#08E6F9]" />;
      case 'SECURITY':
        return <ShieldAlert className="w-5 h-5 text-[#4DDEEA]" />;
      case 'MANAGEMENT':
        return <Shield className="w-5 h-5 text-[#0682F4]" />;
      default:
        return <Bell className="w-5 h-5 text-[#CCD2D9]" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#000000] text-white py-24 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 text-center space-y-4">
          <Bell className="w-12 h-12 text-[#08E6F9] mx-auto opacity-60" />
          <h2 className="text-xl font-bold">Authentication Required</h2>
          <p className="text-sm text-[#CCD2D9]">
            Please sign in to access your personal Nexovira Notification Center.
          </p>
          <button
            onClick={() => navigate('/signin?redirect=/notifications')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] font-bold text-white cursor-pointer hover:opacity-95"
          >
            Sign In to Nexovira
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#01213D]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-2">
              <Bell className="w-3.5 h-3.5" />
              Unified Communication System
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Notification Center
            </h1>
            <p className="text-sm text-[#CCD2D9] mt-1">
              Real platform activity, order confirmations, commission updates, and security events.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings/notifications')}
              className="px-4 py-2.5 rounded-xl bg-[#011B33] hover:bg-[#01213D] border border-[#0682F4]/30 text-sm font-medium text-[#CCD2D9] hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#08E6F9]" />
              <span>Preferences</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#06C3F8] hover:from-[#0682F4] hover:to-[#08E6F9] font-bold text-sm text-white transition-all shadow-md shadow-[#0682F4]/20 flex items-center gap-2 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All Read ({unreadCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="space-y-4">
          {/* Read Status Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {(['ALL', 'UNREAD', 'READ'] as const).map((status) => {
              const active = selectedReadStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => handleReadStatusChange(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#0682F4] text-white shadow-md shadow-[#0682F4]/30'
                      : 'bg-[#011B33] text-[#CCD2D9] border border-[#0682F4]/20 hover:border-[#08E6F9]/50 hover:text-white'
                  }`}
                >
                  {status === 'ALL' ? 'All Activity' : status === 'UNREAD' ? `Unread (${unreadCount})` : 'Read'}
                </button>
              );
            })}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((cat) => {
              const active = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#01213D] border border-[#08E6F9] text-[#08E6F9]'
                      : 'bg-[#011B33]/80 border border-[#0682F4]/20 text-[#CCD2D9] hover:text-white hover:border-[#0682F4]/40'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-16 rounded-2xl bg-[#011B33]/50 border border-[#0682F4]/20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#0682F4] border-t-[#08E6F9] rounded-full animate-spin" />
              <p className="text-xs text-[#CCD2D9] font-mono">Syncing real platform notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-16 rounded-2xl bg-[#011B33]/40 border border-[#0682F4]/20 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-center mx-auto text-[#08E6F9]/50">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">No Notifications Found</h3>
              <p className="text-xs text-[#CCD2D9] max-w-sm mx-auto leading-relaxed">
                {selectedReadStatus === 'UNREAD'
                  ? 'You are all caught up! There are no unread notifications in this category.'
                  : 'No verified events have been logged for this filter.'}
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = item.readStatus === 'UNREAD';
              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    isUnread
                      ? 'bg-[#011B33] border-[#0682F4]/50 shadow-lg shadow-[#0682F4]/10'
                      : 'bg-[#011B33]/60 border-[#0682F4]/20 hover:border-[#0682F4]/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/30 shrink-0 mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#08E6F9] shrink-0" />
                        )}
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        {getPriorityBadge(item.priority)}
                        <span className="text-[11px] font-mono text-[#08E6F9]/80 uppercase px-2 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/30">
                          {item.category}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-[#CCD2D9] leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-[#CCD2D9]/60 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#0682F4]" />
                          {new Date(item.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {item.channels && item.channels.length > 0 && (
                          <span>
                            Channels: {item.channels.join(', ')}
                          </span>
                        )}

                        {item.readAt && (
                          <span>Read: {new Date(item.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#0682F4]/10 shrink-0">
                    {item.actionUrl && (
                      <button
                        onClick={() => handleAction(item)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#01213D] to-[#0682F4] hover:from-[#0682F4] hover:to-[#08E6F9] border border-[#0682F4]/40 flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#CCD2D9] hover:text-white bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-[#08E6F9]" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
