import React, { useEffect, useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import {
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
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Clock,
  Activity,
  CheckCircle2,
  Search,
  Database,
} from 'lucide-react';
import { ManagementDashboardMetrics, ManagementAuditRecord } from '../../types/management';
import { SearchIndexStatus } from '../../types/search';

export const ManagementHubPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = useState<ManagementDashboardMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<ManagementAuditRecord[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchIndexStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const headers = {
        'x-user-id': user.uid,
        'x-user-role': profile.role || '',
        'x-user-email': user.email || '',
      };

      const [metricsRes, logsRes, searchRes] = await Promise.all([
        fetch('/api/management/dashboard', { headers }),
        fetch('/api/management/audit-logs?limit=6', { headers }),
        fetch('/api/management/search/status', { headers }).catch(() => null),
      ]);

      if (!metricsRes.ok) {
        throw new Error('Failed to load dashboard metrics');
      }

      const metricsData = await metricsRes.json();
      setMetrics(metricsData.metrics);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setRecentLogs(logsData.logs || []);
      }

      if (searchRes && searchRes.ok) {
        const searchData = await searchRes.json();
        setSearchStatus(searchData.status || null);
      }
    } catch (err: unknown) {
      console.error('Error fetching management overview:', err);
      const msg = err instanceof Error ? err.message : 'Error loading metrics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    if (!user || !profile) return;
    setReindexing(true);
    try {
      const res = await fetch('/api/management/search/reindex', {
        method: 'POST',
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchStatus(data.status || null);
        await loadData();
      }
    } catch (err) {
      console.error('Error triggering reindex:', err);
    } finally {
      setReindexing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, profile]);

  const formatNaira = (amount: number) => `₦${(amount || 0).toLocaleString()} NGN`;

  return (
    <ManagementLayout
      activeRoute="/management"
      title="Ecosystem Command Overview"
      subtitle="Authoritative real-time operational metrics across all 11 Nexovira digital domains."
      actions={
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      }
    >
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* User Ecosystem */}
        <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#CCD2D9]/70">
              Users &amp; Accounts
            </span>
            <div className="p-2 rounded-xl bg-[#0682F4]/10 text-[#08E6F9]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{metrics?.users.total ?? '—'}</div>
            <div className="text-[11px] text-[#CCD2D9]/70 mt-1 flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">{metrics?.users.active ?? 0} Active</span>
              <span>·</span>
              <span className="text-amber-400 font-semibold">{metrics?.users.restricted ?? 0} Restricted</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/management/users')}
            className="text-[11px] font-bold text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer pt-1"
          >
            Manage User Security <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Marketplace & Products */}
        <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#CCD2D9]/70">
              Marketplace Catalog
            </span>
            <div className="p-2 rounded-xl bg-[#0682F4]/10 text-[#08E6F9]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{metrics?.marketplace.totalProducts ?? '—'}</div>
            <div className="text-[11px] text-[#CCD2D9]/70 mt-1 flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">
                {metrics?.marketplace.activeProducts ?? 0} Published
              </span>
              <span>·</span>
              <span className="text-amber-400 font-semibold">
                {metrics?.marketplace.pendingProducts ?? 0} Pending Review
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/management/products')}
            className="text-[11px] font-bold text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer pt-1"
          >
            Catalog Moderation <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Orders & Volume */}
        <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#CCD2D9]/70">
              Orders &amp; Fulfillment
            </span>
            <div className="p-2 rounded-xl bg-[#0682F4]/10 text-[#08E6F9]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{metrics?.orders.totalOrders ?? '—'}</div>
            <div className="text-[11px] text-[#CCD2D9]/70 mt-1 flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">
                {metrics?.orders.paymentConfirmed ?? 0} Paid
              </span>
              <span>·</span>
              <span className="text-cyan-400 font-semibold">
                {metrics?.orders.processing ?? 0} In Process
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/management/orders')}
            className="text-[11px] font-bold text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer pt-1"
          >
            Order Desk <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Total Financial Volume */}
        <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#CCD2D9]/70">
              Gross Transaction Volume
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-white truncate">
              {metrics ? formatNaira(metrics.orders.totalRevenue) : '—'}
            </div>
            <div className="text-[11px] text-[#CCD2D9]/70 mt-1 flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">
                {metrics?.payments.verifiedCount ?? 0} Verified Tx
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/management/payments')}
            className="text-[11px] font-bold text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer pt-1"
          >
            Financial Audits <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Domain Operational Desks Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Academy Desk */}
        <div className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#0682F4]/10 text-[#08E6F9]">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Academy &amp; Scholarships</h3>
                <span className="text-[11px] text-[#CCD2D9]/60">Cohort Admissions &amp; Curricula</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
                <span className="text-[#CCD2D9]/60 text-[10px] block uppercase font-mono">Courses</span>
                <span className="text-base font-bold text-white">{metrics?.academy.publishedCourses ?? 0} Published</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
                <span className="text-[#CCD2D9]/60 text-[10px] block uppercase font-mono">Applications</span>
                <span className="text-base font-bold text-amber-400">
                  {metrics?.academy.pendingApplications ?? 0} Pending
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/management/academy')}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Open Academy Management <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tech & Digital Services Desk */}
        <div className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#0682F4]/10 text-[#08E6F9]">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Tech &amp; Digital Services</h3>
                <span className="text-[11px] text-[#CCD2D9]/60">Client Scopes &amp; Expert Dispatch</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
                <span className="text-[#CCD2D9]/60 text-[10px] block uppercase font-mono">Open Scopes</span>
                <span className="text-base font-bold text-white">{metrics?.services.openRequests ?? 0} Requests</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
                <span className="text-[#CCD2D9]/60 text-[10px] block uppercase font-mono">Verified Experts</span>
                <span className="text-base font-bold text-emerald-400">
                  {metrics?.services.verifiedExperts ?? 0} Active
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/management/services')}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Open Services Desk <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Affiliate & Referral Desk */}
        <div className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#0682F4]/10 text-[#08E6F9]">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Affiliate Partner Network</h3>
                <span className="text-[11px] text-[#CCD2D9]/60">Commissions &amp; Payout Liquidity</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
                <span className="text-[#CCD2D9]/60 text-[10px] block uppercase font-mono">Partners</span>
                <span className="text-base font-bold text-white">
                  {metrics?.affiliates.approvedAffiliates ?? 0} Approved
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
                <span className="text-[#CCD2D9]/60 text-[10px] block uppercase font-mono">Payouts</span>
                <span className="text-base font-bold text-amber-400">
                  {metrics?.affiliates.pendingPayoutRequests ?? 0} Pending
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/management/affiliate')}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Open Affiliate Desk <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Operational Audit Feed Preview */}
      <div className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#08E6F9]" />
            <h3 className="text-sm font-bold text-white">Recent Immutable Audit Activity</h3>
          </div>
          <button
            onClick={() => navigate('/management/audit-logs')}
            className="text-xs font-bold text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer"
          >
            View All Audit Logs <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#CCD2D9]/60">
            No audit records recorded yet. All administrative operations will be appended here.
          </div>
        ) : (
          <div className="divide-y divide-[#0682F4]/10">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-[#08E6F9]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-white px-2 py-0.5 rounded bg-[#0682F4]/20 border border-[#0682F4]/40">
                        {log.action}
                      </span>
                      <span className="text-[#CCD2D9]/80 font-mono text-[11px]">
                        Target: {log.targetType} ({log.targetId})
                      </span>
                    </div>
                    {log.reason && (
                      <p className="text-[11px] text-[#CCD2D9]/70 mt-0.5 line-clamp-1">
                        Reason: {log.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-[#CCD2D9]/60 font-mono shrink-0 sm:self-center">
                  <span>By: {log.actorEmail}</span>
                  <span>·</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ManagementLayout>
  );
};
