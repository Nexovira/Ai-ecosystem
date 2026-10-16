import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingBag,
  CreditCard,
  GraduationCap,
  Briefcase,
  Share2,
  FileText,
  UserCheck,
  Megaphone,
  ArrowLeft,
  Lock,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Star,
  BookOpen,
  Wallet,
  Receipt,
  BarChart3,
  Sparkles,
  Bot,
  Key,
  Gauge,
} from 'lucide-react';
import { isManagementRole, hasManagementPermission, ManagementPermission } from '../../types/management';

interface ManagementLayoutProps {
  children: React.ReactNode;
  activeRoute: string;
  requiredPermission?: ManagementPermission;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export const ManagementLayout: React.FC<ManagementLayoutProps> = ({
  children,
  activeRoute,
  requiredPermission,
  title,
  subtitle,
  actions,
}) => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();

  // Broadcast Modal State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastRecipient, setBroadcastRecipient] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'NORMAL' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [broadcastActionUrl, setBroadcastActionUrl] = useState('/notifications');
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const userRole = profile?.role || '';
  const isAuthorized = isManagementRole(userRole);
  const hasSpecificPermission = requiredPermission ? hasManagementPermission(userRole, requiredPermission) : true;

  // Strict Server-Side & Client Protection: Render Access Restricted Gate if not authorized
  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#011B33] border border-red-500/40 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-red-400 font-bold block mb-1">
              Restricted Clearance
            </span>
            <h2 className="text-xl font-black text-white">Management Authorization Required</h2>
          </div>
          <p className="text-xs text-[#CCD2D9] leading-relaxed">
            The Nexovira Management Area is strictly restricted to verified operations personnel, finance officers,
            content managers, and platform administrators. Unauthorized access attempts are monitored and recorded.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            {!user ? (
              <>
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Sign In as Administrator
                </button>
                <button
                  onClick={() => navigate('/admin-setup')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#01213D] hover:bg-[#01213D]/90 border border-[#08E6F9]/40 text-[#08E6F9] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  First Administrator Setup
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/account')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to User Account
                </button>
                <button
                  onClick={() => navigate('/admin-setup')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#011629] hover:bg-[#011629]/90 border border-[#08E6F9]/30 text-[#08E6F9] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Administrator Bootstrap Portal
                </button>
              </>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/30 text-[#CCD2D9] transition cursor-pointer"
            >
              Go to Ecosystem Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Permission-specific denial inside management
  if (!hasSpecificPermission && requiredPermission) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#011B33] border border-amber-500/40 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold block mb-1">
              Permission Boundary
            </span>
            <h2 className="text-xl font-black text-white">Missing Clearance: {requiredPermission}</h2>
          </div>
          <p className="text-xs text-[#CCD2D9] leading-relaxed">
            Your role (<span className="text-[#08E6F9] font-mono font-bold">{userRole}</span>) does not include permission
            to view or modify this management desk. Contact a Super Administrator to adjust role delegations.
          </p>
          <button
            onClick={() => navigate('/management')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition cursor-pointer flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Management Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastRecipient.trim() || !broadcastTitle.trim() || !broadcastMessage.trim()) {
      setBroadcastFeedback({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setBroadcastSubmitting(true);
    setBroadcastFeedback(null);

    try {
      const res = await fetch('/api/management/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': userRole,
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          recipientUserId: broadcastRecipient.trim(),
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          priority: broadcastPriority,
          actionUrl: broadcastActionUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch broadcast');
      }

      setBroadcastFeedback({ type: 'success', text: 'Authoritative notification dispatched successfully.' });
      setTimeout(() => {
        setBroadcastModalOpen(false);
        setBroadcastRecipient('');
        setBroadcastTitle('');
        setBroadcastMessage('');
        setBroadcastFeedback(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending broadcast';
      setBroadcastFeedback({ type: 'error', text: msg });
    } finally {
      setBroadcastSubmitting(false);
    }
  };

  const navItems = [
    { label: 'Overview', route: '/management', icon: LayoutDashboard, perm: undefined },
    { label: 'Users', route: '/management/users', icon: Users, perm: 'USERS_VIEW' as ManagementPermission },
    { label: 'Sellers', route: '/management/sellers', icon: Store, perm: 'SELLERS_VIEW' as ManagementPermission },
    { label: 'Products', route: '/management/products', icon: Package, perm: 'PRODUCTS_VIEW' as ManagementPermission },
    { label: 'Digital', route: '/management/digital-products', icon: BookOpen, perm: 'DIGITAL_PRODUCTS_VIEW' as ManagementPermission },
    { label: 'Orders', route: '/management/orders', icon: ShoppingBag, perm: 'ORDERS_VIEW' as ManagementPermission },
    { label: 'Payments', route: '/management/payments', icon: CreditCard, perm: 'PAYMENTS_VIEW' as ManagementPermission },
    { label: 'Wallets', route: '/management/wallets', icon: Wallet, perm: 'WALLETS_VIEW' as ManagementPermission },
    { label: 'Transactions', route: '/management/transactions', icon: Receipt, perm: 'TRANSACTIONS_VIEW' as ManagementPermission },
    { label: 'Academy', route: '/management/academy', icon: GraduationCap, perm: 'ACADEMY_VIEW' as ManagementPermission },
    { label: 'Services', route: '/management/services', icon: Briefcase, perm: 'SERVICES_VIEW' as ManagementPermission },
    { label: 'Affiliates', route: '/management/affiliate', icon: Share2, perm: 'AFFILIATES_VIEW' as ManagementPermission },
    { label: 'Reviews', route: '/management/reviews', icon: Star, perm: 'REVIEWS_VIEW' as ManagementPermission },
    { label: 'Analytics', route: '/management/analytics', icon: BarChart3, perm: 'ANALYTICS_VIEW' as ManagementPermission },
    { label: 'AI Governance', route: '/management/ai-governance', icon: Sparkles, perm: 'AI_CONFIG_MANAGE' as ManagementPermission },
    { label: 'Automation Center', route: '/management/automation', icon: Bot, perm: 'AUTOMATION_VIEW' as ManagementPermission },
    { label: 'Integrations', route: '/management/integrations', icon: Key, perm: 'INTEGRATIONS_VIEW' as ManagementPermission },
    { label: 'Reliability & Scale', route: '/management/reliability', icon: Gauge, perm: 'RELIABILITY_VIEW' as ManagementPermission },
    { label: 'Audit Logs', route: '/management/audit-logs', icon: FileText, perm: 'AUDIT_LOGS_VIEW' as ManagementPermission },
    { label: 'Team', route: '/management/team', icon: UserCheck, perm: 'TEAM_MANAGE' as ManagementPermission },
  ];

  const visibleNavItems = navItems.filter((item) =>
    !item.perm ? true : hasManagementPermission(userRole, item.perm)
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Management Top Clearance Banner */}
      <header className="border-b border-[#0682F4]/30 bg-[#011B33]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-md bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] font-mono text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#08E6F9] animate-pulse" />
              NEXOVIRA MANAGEMENT
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#CCD2D9]">
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9] font-bold">
                {userRole}
              </span>
              <span className="text-[#CCD2D9]/60">·</span>
              <span className="truncate max-w-[200px] text-[#CCD2D9]/80 font-mono text-[11px]">{user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasManagementPermission(userRole, 'NOTIFICATIONS_BROADCAST') && (
              <button
                onClick={() => setBroadcastModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9] transition flex items-center gap-1.5 cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Broadcast Message</span>
              </button>
            )}

            <button
              onClick={() => navigate('/account')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#2B7EB5]/30 text-[#CCD2D9] hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>User Hub</span>
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Desks Scrollbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#0682F4] text-white shadow-lg shadow-[#0682F4]/30'
                    : 'text-[#CCD2D9] hover:text-white hover:bg-[#01213D]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Desk Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Desk Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0682F4]/20 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#011B33] border border-[#0682F4]/40 text-[#08E6F9] text-[11px] font-mono font-bold tracking-wider uppercase mb-2">
              <ShieldCheck className="w-3 h-3 text-[#08E6F9]" />
              Internal Control Layer
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{title}</h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">{subtitle}</p>
          </div>
          {actions && <div className="flex items-center gap-2 self-start sm:self-auto">{actions}</div>}
        </div>

        {/* Nested View */}
        {children}
      </main>

      {/* Quick Broadcast Modal */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#011B33] border border-[#0682F4]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Megaphone className="w-4 h-4 text-[#08E6F9]" />
                Dispatch Authoritative Announcement
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="text-[#CCD2D9] hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {broadcastFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  broadcastFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/40 text-red-300'
                }`}
              >
                {broadcastFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{broadcastFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">
                  Recipient User ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. usr_123 or paste specific user ID"
                  value={broadcastRecipient}
                  onChange={(e) => setBroadcastRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">
                  Announcement Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Account Verification Required"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">
                  Message Body <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter notice details for user notification center..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Priority</label>
                  <select
                    value={broadcastPriority}
                    onChange={(e) => setBroadcastPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Action URL</label>
                  <input
                    type="text"
                    value={broadcastActionUrl}
                    onChange={(e) => setBroadcastActionUrl(e.target.value)}
                    placeholder="/account"
                    className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 text-[#CCD2D9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {broadcastSubmitting ? 'Dispatching...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
