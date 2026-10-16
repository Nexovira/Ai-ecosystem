/**
 * Phase 18: Nexovira Analytics & Business Intelligence Types
 *
 * Strict, authoritative analytics models grounded in verified operational records:
 * Orders, Payments, Refunds, Academy, Services, Digital Products, Affiliates, Wallets, and Journals.
 */

export type AnalyticsTimeRange = '7D' | '30D' | '90D' | '1Y' | 'ALL';

export interface TimeSeriesPoint {
  date: string; // ISO Date YYYY-MM-DD
  label: string; // Short formatted date e.g. "Oct 01"
  value: number;
  count?: number;
  secondaryValue?: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface ConversionFunnelStep {
  step: string;
  count: number;
  conversionRate: number; // Percentage from previous step
  dropoffRate: number; // Percentage drop from previous step
}

export interface ManagementAnalyticsData {
  timeRange: AnalyticsTimeRange;
  currency: string;
  generatedAt: string;
  dataFreshness: 'REAL_TIME' | 'RECENTLY_SYNCED' | 'DELAYED';

  // 1. High-Level Performance KPIs
  kpis: {
    totalGrossOrderValue: number;
    confirmedPaymentVolume: number;
    netSales: number; // Gross Order Value minus confirmed Refunds
    totalRefunds: number;
    platformCommissionRevenue: number;
    sellerEarnings: number;
    affiliateCommissions: number;
    completedPayoutsVolume: number;
    totalOrdersCount: number;
    confirmedOrdersCount: number;
    refundedOrdersCount: number;
    averageOrderValue: number;
    totalRegisteredUsers: number;
    activeUsersCount: number;
    totalSellersCount: number;
    verifiedSellersCount: number;
  };

  // 2. Trend Series
  trends: {
    revenueByDay: TimeSeriesPoint[];
    ordersByDay: TimeSeriesPoint[];
    refundsByDay: TimeSeriesPoint[];
    payoutsByDay: TimeSeriesPoint[];
  };

  // 3. Ecosystem Segment Breakdowns
  breakdowns: {
    marketplaceCategories: CategoryBreakdown[];
    digitalProductCategories: CategoryBreakdown[];
    orderStatusDistribution: { status: string; count: number; percentage: number }[];
    paymentGatewayDistribution: { gateway: string; volume: number; count: number }[];
  };

  // 4. Subsystem Performance Aggregates
  subsystems: {
    academy: {
      totalCourses: number;
      publishedCourses: number;
      totalApplications: number;
      acceptedApplications: number;
      activeScholars: number;
      totalScholarshipsVolume: number;
    };
    techServices: {
      totalRequests: number;
      openRequests: number;
      completedRequests: number;
      activeExperts: number;
      verifiedExperts: number;
      bookingConversionRate: number;
    };
    digitalCommerce: {
      totalDigitalProducts: number;
      publishedDigitalProducts: number;
      totalPurchases: number;
      totalDownloadsAuthorized: number;
      activeEntitlements: number;
    };
    affiliateProgram: {
      approvedAffiliates: number;
      attributedReferrals: number;
      qualifyingPurchases: number;
      totalCommissionsPaid: number;
      averageCommissionRate: number;
    };
    financialReconciliation: {
      gatewayReconciledRatio: number; // E.g. 100%
      unbalancedJournalsCount: number;
      activeWalletLiabilities: number;
      pendingPayoutsReserved: number;
    };
  };

  // 5. Customer Funnel & Conversion (Authoritative Checkout Flow)
  funnel: ConversionFunnelStep[];

  // 6. Top Performers
  topSellers: {
    sellerId: string;
    businessName: string;
    salesVolume: number;
    ordersCount: number;
  }[];

  topProducts: {
    productId: string;
    productName: string;
    category: string;
    unitsSold: number;
    salesVolume: number;
  }[];

  topDigitalProducts: {
    productId: string;
    title: string;
    purchasesCount: number;
    volume: number;
  }[];
}

// Seller-Scoped Performance Analytics Contract
export interface SellerAnalyticsData {
  sellerId: string;
  timeRange: AnalyticsTimeRange;
  currency: string;
  generatedAt: string;
  totalProducts: number;
  activeProducts: number;
  totalUnitsSold: number;
  grossSalesVolume: number;
  netEarnings: number;
  refundDeductions: number;
  availableWalletBalance: number;
  pendingBalance: number;
  heldBalance: number;
  averageOrderValue: number;
  orderFulfillmentRate: number;
  recentSalesTrend: TimeSeriesPoint[];
  topSellingProducts: {
    productId: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }[];
}

// Digital Creator Performance Analytics Contract
export interface CreatorAnalyticsData {
  creatorId: string;
  timeRange: AnalyticsTimeRange;
  currency: string;
  generatedAt: string;
  totalPublished: number;
  totalEntitlementsIssued: number;
  totalDownloadsAuthorized: number;
  grossEarnings: number;
  netWalletBalance: number;
  recentSalesTrend: TimeSeriesPoint[];
  assetBreakdown: {
    productId: string;
    title: string;
    downloads: number;
    purchases: number;
    revenue: number;
  }[];
}

// Analytics Export Query Parameters
export interface AnalyticsExportRequest {
  dataset: 'ECOSYSTEM_SUMMARY' | 'ORDERS' | 'FINANCIAL_REVENUE' | 'SELLERS' | 'DIGITAL_COMMERCE';
  timeRange: AnalyticsTimeRange;
  format: 'CSV' | 'JSON';
}
