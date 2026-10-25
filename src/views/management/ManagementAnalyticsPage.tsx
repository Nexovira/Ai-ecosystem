import React, { useState, useEffect, useCallback } from 'react';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import {
  ManagementAnalyticsData,
  AnalyticsTimeRange,
  TimeSeriesPoint,
  CategoryBreakdown,
  ConversionFunnelStep,
} from '../../types/analytics';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  GraduationCap,
  Briefcase,
  Share2,
  BookOpen,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const ManagementAnalyticsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();

  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30D');
  const [data, setData] = useState<ManagementAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback((): HeadersInit => {
    if (!user) return {};
    return {
      'x-user-id': user.uid,
      'x-user-role': profile?.role || 'SUPER_ADMIN',
      'Content-Type': 'application/json',
    };
  }, [user, profile]);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/management/analytics?range=${timeRange}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load authoritative analytics data');
      const json = await res.json();
      setData(json.data || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error retrieving business intelligence metrics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [timeRange, getHeaders]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const res = await fetch(`/api/management/analytics/export?range=${timeRange}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to export business intelligence report');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexovira-bi-report-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error exporting report';
      setError(`Export Failed: ${msg}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ManagementLayout
      activeRoute="/management/analytics"
      requiredPermission="ANALYTICS_VIEW"
      title="Business Intelligence & Analytics Hub"
      subtitle="Authoritative cross-ecosystem operational intelligence, financial performance, and customer conversion tracking."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex bg-[#01213D] border border-[#0682F4]/30 rounded-xl p-1 gap-1">
            {(['7D', '30D', '90D', '1Y', 'ALL'] as AnalyticsTimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  timeRange === range
                    ? 'bg-[#08E6F9] text-black shadow-md shadow-[#08E6F9]/20'
                    : 'text-[#CCD2D9] hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={handleExportCsv}
            disabled={exporting || loading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
            <span>Export CSV</span>
          </button>

          {/* Refresh */}
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Freshness Banner */}
        <div className="flex items-center justify-between text-xs text-[#CCD2D9]/70 bg-[#011B33] border border-[#0682F4]/20 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#08E6F9] animate-pulse" />
            <span>Grounded in authoritative order, wallet, and ledger records</span>
          </div>
          <div className="font-mono text-[11px] text-[#CCD2D9]/50">
            {data ? `Report Generated: ${new Date(data.generatedAt).toLocaleTimeString()}` : 'Syncing...'}
          </div>
        </div>

        {/* 1. PRIMARY FINANCIAL KPIS */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gross Order Value */}
            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70">Gross Order Value</span>
                <div className="p-2 rounded-lg bg-[#0682F4]/20 text-[#08E6F9]">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white">
                ₦{data.kpis.totalGrossOrderValue.toLocaleString()}{' '}
                <span className="text-xs font-mono text-[#08E6F9] font-normal">NGN</span>
              </div>
              <div className="text-[11px] font-mono text-[#CCD2D9]/60 flex items-center gap-1">
                <span>{data.kpis.confirmedOrdersCount} confirmed paid orders</span>
              </div>
            </div>

            {/* Net Sales */}
            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70">Net Sales Volume</span>
                <div className="p-2 rounded-lg bg-[#0682F4]/20 text-[#08E6F9]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#08E6F9]">
                ₦{data.kpis.netSales.toLocaleString()}{' '}
                <span className="text-xs font-mono text-white font-normal">NGN</span>
              </div>
              <div className="text-[11px] font-mono text-[#CCD2D9]/60">
                Gross less ₦{data.kpis.totalRefunds.toLocaleString()} refunds
              </div>
            </div>

            {/* Platform Revenue */}
            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70">Platform 10% Fees</span>
                <div className="p-2 rounded-lg bg-[#0682F4]/20 text-[#08E6F9]">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white">
                ₦{data.kpis.platformCommissionRevenue.toLocaleString()}{' '}
                <span className="text-xs font-mono text-[#08E6F9] font-normal">NGN</span>
              </div>
              <div className="text-[11px] font-mono text-[#CCD2D9]/60">
                Seller net: ₦{data.kpis.sellerEarnings.toLocaleString()}
              </div>
            </div>

            {/* Average Order Value */}
            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[#CCD2D9]/70">Average Order Value</span>
                <div className="p-2 rounded-lg bg-[#0682F4]/20 text-[#08E6F9]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white">
                ₦{data.kpis.averageOrderValue.toLocaleString()}{' '}
                <span className="text-xs font-mono text-[#08E6F9] font-normal">NGN</span>
              </div>
              <div className="text-[11px] font-mono text-[#CCD2D9]/60">
                Across {data.kpis.totalOrdersCount} checkout events
              </div>
            </div>
          </div>
        )}

        {/* 2. TRENDS & VISUALIZATIONS */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Revenue Trend Visual Bar Chart */}
            <div className="lg:col-span-8 p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#08E6F9]" />
                  <h3 className="text-sm font-bold text-white">Daily Revenue Trend</h3>
                </div>
                <span className="text-xs font-mono text-[#CCD2D9]/60">Last {data.trends.revenueByDay.length} Active Days</span>
              </div>

              {/* Native Responsive Bar Chart */}
              <div className="h-48 flex items-end gap-2 pt-6 pb-2 border-b border-[#0682F4]/20">
                {data.trends.revenueByDay.map((pt, idx) => {
                  const maxVal = Math.max(...data.trends.revenueByDay.map((p) => p.value), 1000);
                  const heightPercent = Math.max(10, Math.round((pt.value / maxVal) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition bg-black/90 text-[#08E6F9] text-[10px] font-mono px-2 py-1 rounded border border-[#0682F4]/40 whitespace-nowrap z-20 pointer-events-none">
                        ₦{pt.value.toLocaleString()} NGN
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all duration-300 ${
                          pt.value > 0
                            ? 'bg-gradient-to-t from-[#0682F4] to-[#08E6F9] group-hover:brightness-125'
                            : 'bg-[#01213D] border-t border-[#0682F4]/30'
                        }`}
                      />
                      <span className="text-[10px] font-mono text-[#CCD2D9]/50 truncate w-full text-center">
                        {pt.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-[#CCD2D9]/70 pt-1 font-mono">
                <span>Min: ₦0</span>
                <span>Max: ₦{Math.max(...data.trends.revenueByDay.map((p) => p.value), 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Category Performance Breakdown */}
            <div className="lg:col-span-4 p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#08E6F9]" />
                  <h3 className="text-sm font-bold text-white">Marketplace Categories</h3>
                </div>
                <span className="text-xs font-mono text-[#CCD2D9]/60">{data.breakdowns.marketplaceCategories.length} Types</span>
              </div>

              <div className="space-y-3">
                {data.breakdowns.marketplaceCategories.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#CCD2D9]/60">
                    No confirmed sales in current window.
                  </div>
                ) : (
                  data.breakdowns.marketplaceCategories.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#CCD2D9] font-medium">{cat.category}</span>
                        <span className="font-mono font-bold text-white">₦{cat.revenue.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-[#01213D] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#0682F4] to-[#08E6F9] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, cat.percentage)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-[#CCD2D9]/50">
                        <span>{cat.count} units sold</span>
                        <span>{cat.percentage}% share</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. CHECKOUT CONVERSION FUNNEL */}
        {data && (
          <div className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#08E6F9]" />
                <h3 className="text-sm font-bold text-white">Checkout & Order Fulfillment Funnel</h3>
              </div>
              <span className="text-xs font-mono text-[#CCD2D9]/60">Verified Pipeline Tracking</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.funnel.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 relative space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#CCD2D9]/70">Step 0{idx + 1}</span>
                    <span className="font-mono font-bold text-[#08E6F9]">{step.conversionRate}%</span>
                  </div>
                  <div className="text-sm font-bold text-white">{step.step}</div>
                  <div className="text-xl font-black text-white">{step.count.toLocaleString()}</div>
                  <div className="w-full bg-[#000000] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#08E6F9] h-full rounded-full"
                      style={{ width: `${step.conversionRate}%` }}
                    />
                  </div>
                  {idx > 0 && (
                    <div className="text-[10px] font-mono text-red-400">
                      Dropoff: {step.dropoffRate}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SUBSYSTEM CROSS-ECOSYSTEM AGGREGATES */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Academy */}
            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-3">
              <div className="flex items-center gap-2 text-[#08E6F9]">
                <GraduationCap className="w-5 h-5" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Nexovira Academy</h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Published Courses:</span>
                  <span className="font-bold text-white">{data.subsystems.academy.publishedCourses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Applications Filed:</span>
                  <span className="font-bold text-white">{data.subsystems.academy.totalApplications}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Accepted Scholars:</span>
                  <span className="font-bold text-[#08E6F9]">{data.subsystems.academy.acceptedApplications}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Scholarships Volume:</span>
                  <span className="font-mono text-white">₦{data.subsystems.academy.totalScholarshipsVolume.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Tech & Services */}
            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-3">
              <div className="flex items-center gap-2 text-[#08E6F9]">
                <Briefcase className="w-5 h-5" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Tech & Services</h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Total Requests:</span>
                  <span className="font-bold text-white">{data.subsystems.techServices.totalRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Active Experts:</span>
                  <span className="font-bold text-white">{data.subsystems.techServices.activeExperts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Completed Projects:</span>
                  <span className="font-bold text-[#08E6F9]">{data.subsystems.techServices.completedRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Conversion Rate:</span>
                  <span className="font-mono text-white">{data.subsystems.techServices.bookingConversionRate}%</span>
                </div>
              </div>
            </div>

            {/* Digital Commerce */}
            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-3">
              <div className="flex items-center gap-2 text-[#08E6F9]">
                <BookOpen className="w-5 h-5" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Digital Products</h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Active Publications:</span>
                  <span className="font-bold text-white">{data.subsystems.digitalCommerce.publishedDigitalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Purchases & Licenses:</span>
                  <span className="font-bold text-white">{data.subsystems.digitalCommerce.totalPurchases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Authorized Downloads:</span>
                  <span className="font-bold text-[#08E6F9]">{data.subsystems.digitalCommerce.totalDownloadsAuthorized}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Active Entitlements:</span>
                  <span className="font-mono text-white">{data.subsystems.digitalCommerce.activeEntitlements}</span>
                </div>
              </div>
            </div>

            {/* Affiliate Program */}
            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-3">
              <div className="flex items-center gap-2 text-[#08E6F9]">
                <Share2 className="w-5 h-5" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Affiliate Referrals</h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Approved Affiliates:</span>
                  <span className="font-bold text-white">{data.subsystems.affiliateProgram.approvedAffiliates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Attributed Referrals:</span>
                  <span className="font-bold text-white">{data.subsystems.affiliateProgram.attributedReferrals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Commissions Paid:</span>
                  <span className="font-mono font-bold text-[#08E6F9]">₦{data.subsystems.affiliateProgram.totalCommissionsPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CCD2D9]/70">Avg Commission:</span>
                  <span className="font-mono text-white">{data.subsystems.affiliateProgram.averageCommissionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
};
