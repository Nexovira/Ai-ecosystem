import React, { ReactNode } from 'react';
import {
  User,
  Package,
  GraduationCap,
  Briefcase,
  Share2,
  Bell,
  SlidersHorizontal,
  ShieldCheck,
  LayoutDashboard,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Receipt,
} from 'lucide-react';
import { Container } from '../common/Container';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface AccountLayoutProps {
  children: ReactNode;
  activeTab?: 'overview' | 'profile' | 'orders' | 'transactions' | 'academy' | 'services' | 'affiliate' | 'notifications' | 'settings' | 'security';
  title?: string;
  subtitle?: string;
}

export const AccountLayout: React.FC<AccountLayoutProps> = ({
  children,
  activeTab = 'overview',
  title,
  subtitle,
}) => {
  const { currentPath, navigate } = useRouter();
  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications();

  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(profile?.role || '');

  const navItems = [
    { id: 'overview', label: 'Overview', path: '/account', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', path: '/account/profile', icon: User },
    { id: 'orders', label: 'Orders', path: '/account/orders', icon: Package },
    { id: 'transactions', label: 'Transactions', path: '/account/transactions', icon: Receipt },
    { id: 'academy', label: 'Academy', path: '/account/academy', icon: GraduationCap },
    { id: 'services', label: 'Services', path: '/account/services', icon: Briefcase },
    { id: 'affiliate', label: 'Affiliate', path: '/affiliate/dashboard', icon: Share2 },
    { id: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { id: 'settings', label: 'Settings', path: '/settings', icon: SlidersHorizontal },
    { id: 'security', label: 'Security', path: '/settings/security', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white py-8 lg:py-12">
      <Container size="wide">
        {/* Account Header Banner */}
        <div className="mb-8 p-6 sm:p-8 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-radial from-[#0682F4]/20 via-[#01213D]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#01213D] border-2 border-[#0682F4]/50 overflow-hidden shrink-0 flex items-center justify-center shadow-lg">
                {profile?.photoURL || user?.photoURL ? (
                  <img
                    src={profile?.photoURL || user?.photoURL || ''}
                    alt={profile?.fullName || 'User Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-[#08E6F9]" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                    {profile?.fullName || user?.displayName || 'Nexovira Member'}
                  </h1>

                  {/* Account Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      profile?.accountStatus === 'ACTIVE'
                        ? 'bg-[#0682F4]/20 text-[#08E6F9] border-[#08E6F9]/40'
                        : profile?.accountStatus === 'SUSPENDED'
                        ? 'bg-[#01213D] text-[#CCD2D9] border-[#2B7EB5]/30'
                        : 'bg-[#01213D] text-[#CCD2D9] border-[#0682F4]/30'
                    }`}
                  >
                    {profile?.accountStatus || 'ACTIVE'}
                  </span>

                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0682F4] text-[#000000] border border-[#08E6F9]">
                      Staff / Admin
                    </span>
                  )}
                </div>

                <p className="text-xs font-mono text-[#CCD2D9]/80 truncate max-w-sm sm:max-w-md">
                  {user?.email}
                </p>

                {/* Ecosystem Capability Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#01213D] text-[#CCD2D9] border border-[#0682F4]/20">
                    Customer
                  </span>

                  {profile?.role === 'EXPERT' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#01213D] text-[#4DDEEA] border border-[#26B2E2]/40">
                      Expert
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">

              {isAdmin && (
                <button
                  onClick={() => navigate('/management/affiliate')}
                  className="px-3.5 py-2 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/40 text-xs font-semibold text-[#08E6F9] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Management Desk</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Account Horizontal Navigation Bar */}
        <div className="mb-8 border-b border-[#0682F4]/20 overflow-x-auto scrollbar-thin">
          <nav className="flex space-x-1 sm:space-x-2 min-w-max pb-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || currentPath === item.path;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#0682F4] text-white shadow-md shadow-[#0682F4]/20 font-bold'
                      : 'text-[#CCD2D9] hover:text-white hover:bg-[#011B33] border border-transparent hover:border-[#0682F4]/30'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-[#000000] text-[#08E6F9]'
                          : 'bg-[#0682F4] text-[#000000]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section Heading if provided */}
        {(title || subtitle) && (
          <div className="mb-6 space-y-1">
            {title && <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>}
            {subtitle && <p className="text-xs sm:text-sm text-[#CCD2D9]">{subtitle}</p>}
          </div>
        )}

        {/* Main Child View */}
        <div className="space-y-6">{children}</div>
      </Container>
    </div>
  );
};
