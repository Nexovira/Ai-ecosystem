import React, { useState, useEffect } from 'react';
import {
  Package,
  GraduationCap,
  Briefcase,
  Share2,
  Bell,
  ShieldCheck,
  Store,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  Lock,
  MessageSquare,
  BookOpen,
  Wallet,
} from 'lucide-react';
import { AccountLayout } from '../../components/account/AccountLayout';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSeller } from '../../context/SellerContext';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { isManagementRole } from '../../types/management';

interface EcosystemSummary {
  orders: {
    total: number;
    totalSpent: number;
    recent: any[];
  };
  academy: {
    total: number;
    recent: any[];
  };
  services: {
    total: number;
    activeCount: number;
    recent: any[];
  };
  affiliate: {
    isAffiliate: boolean;
    status: string;
    affiliateCode: string | null;
    totalEarned: number;
    availableBalance: number;
    pendingBalance: number;
    totalConversions: number;
  };
  notifications: {
    unreadCount: number;
  };
  capabilities: string[];
}

export const AccountPage: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const { formatPrice } = useMarketplace();
  const { isVerifiedSeller } = useSeller();
  const { unreadCount } = useNotifications();

  const [summary, setSummary] = useState<EcosystemSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/account/summary?userId=${encodeURIComponent(user.uid)}`, {
          headers: {
            'x-user-id': user.uid,
            'x-user-role': profile?.role || 'CUSTOMER',
          },
        });

        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary || null);
        }
      } catch (err) {
        console.warn('Error loading account summary:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [user, profile]);

  if (authLoading) {
    return (
      <div className="min-h-[70vh] bg-[#000000] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0682F4] border-t-[#08E6F9] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#CCD2D9]">Loading account profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#000000] text-white py-24 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 text-center space-y-4 shadow-2xl">
          <Lock className="w-12 h-12 text-[#08E6F9] mx-auto opacity-60" />
          <h2 className="text-xl font-bold">Authentication Required</h2>
          <p className="text-sm text-[#CCD2D9]">
            Please sign in to access your unified Nexovira Ecosystem Account Hub.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="primary" size="md" onClick={() => navigate('/signin?redirect=/account')}>
              Sign In
            </Button>
            <Button variant="secondary" size="md" onClick={() => navigate('/register')}>
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isSuspended = profile?.accountStatus === 'SUSPENDED';

  return (
    <AccountLayout
      activeTab="overview"
      title="Ecosystem Hub"
      subtitle="Your connected dashboard across marketplace orders, digital services, academy cohorts, and affiliate earnings."
    >
      {/* Account Standing Alert if Suspended or Restricted */}
      {isSuspended && (
        <div className="mb-6 p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/40 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Account Under Administrative Review</h3>
            <p className="text-xs text-[#CCD2D9] mt-1 leading-relaxed">
              Your member account is currently restricted. You may still view your historical receipts, orders, and certificates, but new transactions or applications cannot be initiated until verified by Nexovira compliance.
            </p>
          </div>
        </div>
      )}

      {/* Ecosystem Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Orders Card */}
        <div
          onClick={() => navigate('/account/orders')}
          className="p-5 sm:p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 hover:border-[#08E6F9]/60 transition-all cursor-pointer shadow-lg space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-[#06C3F8] group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-[#08E6F9] group-hover:translate-x-0.5 transition-transform flex items-center">
              View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#CCD2D9]/70 block">
              Marketplace Orders
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-white">
                {summary?.orders.total || 0}
              </span>
              <span className="text-xs font-mono text-[#08E6F9]">
                {formatPrice(summary?.orders.totalSpent || 0)} spent
              </span>
            </div>
          </div>
        </div>

        {/* Academy Card */}
        <div
          onClick={() => navigate('/account/academy')}
          className="p-5 sm:p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 hover:border-[#08E6F9]/60 transition-all cursor-pointer shadow-lg space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-[#0682F4] group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-[#08E6F9] group-hover:translate-x-0.5 transition-transform flex items-center">
              View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#CCD2D9]/70 block">
              Academy Cohorts
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-white">
                {summary?.academy.total || 0}
              </span>
              <span className="text-xs text-[#CCD2D9]/80 font-mono">
                Active enrollments
              </span>
            </div>
          </div>
        </div>

        {/* Services Card */}
        <div
          onClick={() => navigate('/account/services')}
          className="p-5 sm:p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 hover:border-[#08E6F9]/60 transition-all cursor-pointer shadow-lg space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-[#26B2E2] group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-[#08E6F9] group-hover:translate-x-0.5 transition-transform flex items-center">
              View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#CCD2D9]/70 block">
              Tech &amp; Digital Services
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-white">
                {summary?.services.total || 0}
              </span>
              <span className="text-xs text-[#08E6F9] font-mono">
                {summary?.services.activeCount || 0} in progress
              </span>
            </div>
          </div>
        </div>

        {/* Affiliate Card */}
        <div
          onClick={() =>
            navigate(summary?.affiliate.isAffiliate ? '/affiliate/dashboard' : '/affiliate/apply')
          }
          className="p-5 sm:p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 hover:border-[#08E6F9]/60 transition-all cursor-pointer shadow-lg space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-[#08E6F9] group-hover:scale-105 transition-transform">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-[#08E6F9] group-hover:translate-x-0.5 transition-transform flex items-center">
              {summary?.affiliate.isAffiliate ? 'Portal' : 'Apply'} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#CCD2D9]/70 block">
              Affiliate Earnings
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              {summary?.affiliate.isAffiliate ? (
                <>
                  <span className="text-xl font-black text-white">
                    {formatPrice(summary.affiliate.availableBalance)}
                  </span>
                  <span className="text-xs text-[#CCD2D9]/70 font-mono">available</span>
                </>
              ) : (
                <span className="text-xs font-bold text-[#08E6F9]">
                  {summary?.affiliate.status === 'PENDING_REVIEW'
                    ? 'Application Under Review'
                    : 'Earn commissions'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Internal Management Desk Launcher (Only visible to verified management roles) */}
      {isManagementRole(profile?.role || '') && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#011B33] via-[#01213D] to-[#011B33] border border-[#0682F4]/50 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Internal Management Layer
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9]">
                  {profile?.role}
                </span>
              </div>
              <p className="text-[11px] text-[#CCD2D9]/70 mt-0.5">
                Executive control desk for users, sellers, products, orders, payouts, and system audit logs.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/management')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-[#0682F4]/30"
          >
            Open Management Hub
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Cross-Ecosystem Quick Launcher Bar */}
      <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-3">
        <span className="text-xs font-mono uppercase tracking-wider text-[#08E6F9] block">
          Ecosystem Hub Navigation
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => navigate('/marketplace')}
            className="p-3 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/20 hover:border-[#08E6F9]/50 text-left transition-all cursor-pointer group"
          >
            <ShoppingBag className="w-4 h-4 text-[#06C3F8] mb-1.5" />
            <span className="text-xs font-bold text-white block group-hover:text-[#08E6F9]">Marketplace</span>
            <span className="text-[10px] text-[#CCD2D9]/60 block truncate">Browse catalog</span>
          </button>

          <button
            onClick={() => navigate('/academy/courses')}
            className="p-3 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/20 hover:border-[#08E6F9]/50 text-left transition-all cursor-pointer group"
          >
            <GraduationCap className="w-4 h-4 text-[#0682F4] mb-1.5" />
            <span className="text-xs font-bold text-white block group-hover:text-[#08E6F9]">Academy</span>
            <span className="text-[10px] text-[#CCD2D9]/60 block truncate">Scholarship courses</span>
          </button>

          <button
            onClick={() => navigate('/services')}
            className="p-3 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/20 hover:border-[#08E6F9]/50 text-left transition-all cursor-pointer group"
          >
            <Briefcase className="w-4 h-4 text-[#26B2E2] mb-1.5" />
            <span className="text-xs font-bold text-white block group-hover:text-[#08E6F9]">Tech Services</span>
            <span className="text-[10px] text-[#CCD2D9]/60 block truncate">Hire specialists</span>
          </button>

          <button
            onClick={() => navigate(summary?.affiliate.isAffiliate ? '/affiliate/dashboard' : '/affiliate')}
            className="p-3 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/20 hover:border-[#08E6F9]/50 text-left transition-all cursor-pointer group"
          >
            <Share2 className="w-4 h-4 text-[#08E6F9] mb-1.5" />
            <span className="text-xs font-bold text-white block group-hover:text-[#08E6F9]">Affiliates</span>
            <span className="text-[10px] text-[#CCD2D9]/60 block truncate">
              {summary?.affiliate.isAffiliate ? 'Wallet & links' : 'Join program'}
            </span>
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="p-3 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/20 hover:border-[#08E6F9]/50 text-left transition-all cursor-pointer group"
          >
            <Bell className="w-4 h-4 text-[#4DDEEA] mb-1.5" />
            <span className="text-xs font-bold text-white block group-hover:text-[#08E6F9]">Notifications</span>
            <span className="text-[10px] text-[#CCD2D9]/60 block truncate">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </span>
          </button>

          <button
            onClick={() => navigate('/wallet')}
            className="p-3 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/20 hover:border-[#08E6F9]/50 text-left transition-all cursor-pointer group"
          >
            <Wallet className="w-4 h-4 text-[#08E6F9] mb-1.5" />
            <span className="text-xs font-bold text-white block group-hover:text-[#08E6F9]">Financial Wallet</span>
            <span className="text-[10px] text-[#CCD2D9]/60 block truncate">Balances &amp; payouts</span>
          </button>

          <button
            onClick={() => navigate('/account/digital-library')}
            className="p-3 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/20 hover:border-[#08E6F9]/50 text-left transition-all cursor-pointer group"
          >
            <BookOpen className="w-4 h-4 text-[#08E6F9] mb-1.5" />
            <span className="text-xs font-bold text-white block group-hover:text-[#08E6F9]">Digital Library</span>
            <span className="text-[10px] text-[#CCD2D9]/60 block truncate">Owned publications</span>
          </button>

          <button
            onClick={() => navigate('/account/reviews')}
            className="p-3 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/20 hover:border-[#08E6F9]/50 text-left transition-all cursor-pointer group"
          >
            <MessageSquare className="w-4 h-4 text-[#06C3F8] mb-1.5" />
            <span className="text-xs font-bold text-white block group-hover:text-[#08E6F9]">My Reviews</span>
            <span className="text-[10px] text-[#CCD2D9]/60 block truncate">Ratings &amp; feedback</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="p-3 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/20 hover:border-[#08E6F9]/50 text-left transition-all cursor-pointer group"
          >
            <ShieldCheck className="w-4 h-4 text-[#CCD2D9] mb-1.5" />
            <span className="text-xs font-bold text-white block group-hover:text-[#08E6F9]">Settings</span>
            <span className="text-[10px] text-[#CCD2D9]/60 block truncate">Security &amp; profile</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders & Recent Services/Academy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Recent Orders Activity */}
        <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#06C3F8]" />
              <h3 className="text-sm font-bold text-white">Recent Orders</h3>
            </div>
            <button
              onClick={() => navigate('/account/orders')}
              className="text-xs text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {summary?.orders.recent && summary.orders.recent.length > 0 ? (
              summary.orders.recent.map((ord: any) => (
                <div
                  key={ord.orderId}
                  onClick={() => navigate(`/account/orders/${ord.orderId}`)}
                  className="p-4 rounded-xl bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 hover:border-[#0682F4]/40 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="font-mono font-bold text-white block truncate">
                      {ord.orderReference}
                    </span>
                    <span className="text-[11px] text-[#CCD2D9]/70 block truncate">
                      {ord.items?.length || 1} item(s) · {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-white font-mono block">
                      {formatPrice(ord.total, ord.currency)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0682F4]/20 text-[#08E6F9] border border-[#08E6F9]/30">
                      {ord.orderStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[#CCD2D9] space-y-2">
                <Package className="w-8 h-8 mx-auto text-[#0682F4]/40" />
                <p className="font-semibold text-white">No marketplace orders yet</p>
                <p className="text-[#CCD2D9]/70">Explore tech hardware and components in our catalog.</p>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-[#0682F4] text-white font-semibold cursor-pointer text-xs hover:bg-[#08E6F9]"
                >
                  Browse Marketplace
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Services & Academy Activity */}
        <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#26B2E2]" />
              <h3 className="text-sm font-bold text-white">Services &amp; Academy Projects</h3>
            </div>
            <button
              onClick={() => navigate('/account/services')}
              className="text-xs text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {summary?.services.recent && summary.services.recent.length > 0 ? (
              summary.services.recent.map((req: any) => (
                <div
                  key={req.requestId}
                  onClick={() => navigate(`/account/services/${req.requestId}`)}
                  className="p-4 rounded-xl bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 hover:border-[#0682F4]/40 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="font-bold text-white block truncate">
                      {req.projectTitle}
                    </span>
                    <span className="text-[11px] text-[#CCD2D9]/70 font-mono block">
                      Ref: {req.requestReference} · {req.categoryName}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0682F4]/20 text-[#08E6F9] border border-[#08E6F9]/30">
                      {req.status}
                    </span>
                  </div>
                </div>
              ))
            ) : summary?.academy.recent && summary.academy.recent.length > 0 ? (
              summary.academy.recent.map((app: any) => (
                <div
                  key={app.application.applicationId}
                  onClick={() => navigate('/account/academy')}
                  className="p-4 rounded-xl bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 hover:border-[#0682F4]/40 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="font-bold text-white block truncate">
                      {app.course?.title || 'Nexovira Academy Course'}
                    </span>
                    <span className="text-[11px] text-[#CCD2D9]/70 font-mono block">
                      Application Ref: {app.application.applicationReference}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0682F4]/20 text-[#08E6F9] border border-[#08E6F9]/30">
                      {app.application.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[#CCD2D9] space-y-2">
                <Briefcase className="w-8 h-8 mx-auto text-[#0682F4]/40" />
                <p className="font-semibold text-white">No active services or courses</p>
                <p className="text-[#CCD2D9]/70">Hire an expert or enroll in an Academy scholarship cohort.</p>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={() => navigate('/services')}
                    className="px-3 py-1.5 rounded-lg bg-[#01213D] border border-[#0682F4]/40 text-white font-semibold cursor-pointer text-xs hover:bg-[#0682F4]/20"
                  >
                    Tech Services
                  </button>
                  <button
                    onClick={() => navigate('/academy/courses')}
                    className="px-3 py-1.5 rounded-lg bg-[#0682F4] text-white font-semibold cursor-pointer text-xs hover:bg-[#08E6F9]"
                  >
                    Academy Cohorts
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
};
