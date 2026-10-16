import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, ExternalLink, ShieldAlert, Package, CreditCard, GraduationCap, Briefcase, Share2, Shield, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useRouter } from '../../context/RouterContext';
import { NotificationCategory, NotificationRecord } from '../../types/notification';

export const NotificationBell: React.FC = () => {
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const { navigate } = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpenNotification = async (item: NotificationRecord) => {
    if (item.readStatus === 'UNREAD') {
      await markAsRead(item.id);
    }
    setIsOpen(false);
    if (item.actionUrl) {
      navigate(item.actionUrl as any);
    } else {
      navigate('/notifications');
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'ORDER':
      case 'MARKETPLACE':
        return <Package className="w-4 h-4 text-[#06C3F8]" />;
      case 'PAYMENT':
      case 'PAYOUT':
        return <CreditCard className="w-4 h-4 text-[#08E6F9]" />;
      case 'ACADEMY':
        return <GraduationCap className="w-4 h-4 text-[#0682F4]" />;
      case 'SERVICES':
        return <Briefcase className="w-4 h-4 text-[#26B2E2]" />;
      case 'AFFILIATE':
        return <Share2 className="w-4 h-4 text-[#08E6F9]" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-[#4DDEEA]" />;
      case 'MANAGEMENT':
        return <Shield className="w-4 h-4 text-[#0682F4]" />;
      default:
        return <Bell className="w-4 h-4 text-[#CCD2D9]" />;
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className="relative p-2 rounded-xl bg-[#011B33] border border-[#0682F4]/30 hover:border-[#08E6F9]/60 text-[#CCD2D9] hover:text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#08E6F9]"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0682F4] text-[#000000] text-[10px] font-extrabold flex items-center justify-center border border-[#08E6F9] shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#011B33] border border-[#0682F4]/40 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#0682F4]/20 bg-[#01213D]/90">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0682F4]/20 text-[#08E6F9] border border-[#0682F4]/30">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-[#08E6F9] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#0682F4]/10">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#CCD2D9]">
                <Bell className="w-8 h-8 mx-auto text-[#0682F4]/40 mb-2" />
                <p className="font-semibold text-white">No notifications yet</p>
                <p className="text-[#CCD2D9]/70 mt-1">Real platform events will appear here.</p>
              </div>
            ) : (
              recentNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenNotification(item)}
                  className={`p-3.5 hover:bg-[#01213D]/70 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                    item.readStatus === 'UNREAD' ? 'bg-[#0682F4]/10' : ''
                  }`}
                >
                  <div className="p-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-white truncate">{item.title}</span>
                      {item.readStatus === 'UNREAD' && (
                        <span className="w-2 h-2 rounded-full bg-[#08E6F9] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#CCD2D9] line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-[#CCD2D9]/60 font-mono mt-1.5 block">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#01213D] border-t border-[#0682F4]/20 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/settings/notifications');
              }}
              className="text-[#CCD2D9] hover:text-[#08E6F9] px-2 py-1 transition-colors cursor-pointer"
            >
              Preferences
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="font-bold text-[#08E6F9] hover:text-white flex items-center gap-1 px-2 py-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
