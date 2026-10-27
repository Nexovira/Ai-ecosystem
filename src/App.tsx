import React from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider } from './context/AuthContext';
import { MarketplaceProvider } from './context/MarketplaceContext';
import { CommerceProvider } from './context/CommerceContext';
import { ServicesProvider } from './context/ServicesContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './views/HomePage';
import { FutureScopeView } from './views/FutureScopeView';
import { SignInPage } from './views/auth/SignInPage';
import { RegisterPage } from './views/auth/RegisterPage';
import { ForgotPasswordPage } from './views/auth/ForgotPasswordPage';
import { VerifyEmailPage } from './views/auth/VerifyEmailPage';
import { AccountPage } from './views/account/AccountPage';
import { AccountProfilePage } from './views/account/AccountProfilePage';
import { AccountSettingsPage } from './views/account/AccountSettingsPage';
import { AccountSecurityPage } from './views/account/AccountSecurityPage';
import { MarketplaceHome } from './views/marketplace/MarketplaceHome';
import { ProductDetailPage } from './views/marketplace/ProductDetailPage';
import { ManagementProductFormPage } from './views/management/ManagementProductFormPage';
import { CheckoutPage } from './views/commerce/CheckoutPage';
import { OrderConfirmationPage } from './views/commerce/OrderConfirmationPage';
import { CustomerOrdersPage } from './views/commerce/CustomerOrdersPage';
import { OrderDetailView } from './views/commerce/OrderDetailView';

// Tech & Digital Services Views
import { ServicesLandingPage } from './views/services/ServicesLandingPage';
import { ServiceCategoryPage } from './views/services/ServiceCategoryPage';
import { ExpertsDirectoryPage } from './views/services/ExpertsDirectoryPage';
import { ExpertProfilePage } from './views/services/ExpertProfilePage';
import { ProjectRequestPage } from './views/services/ProjectRequestPage';
import { ApplyExpertPage } from './views/services/ApplyExpertPage';
import { CustomerServicesPage } from './views/account/CustomerServicesPage';
import { CustomerServiceDetailPage } from './views/account/CustomerServiceDetailPage';
import { ExpertDashboardPage } from './views/expert/ExpertDashboardPage';
import { ExpertProjectsPage } from './views/expert/ExpertProjectsPage';
import { ExpertProjectDetailPage } from './views/expert/ExpertProjectDetailPage';
import { ExpertOnboardingPage } from './views/expert/ExpertOnboardingPage';
import { ManagementServicesPage } from './views/management/ManagementServicesPage';

// Academy Views & Provider
import { AcademyProvider } from './context/AcademyContext';
import { AcademyLandingPage } from './views/academy/AcademyLandingPage';
import { CourseDirectoryPage } from './views/academy/CourseDirectoryPage';
import { CourseDetailPage } from './views/academy/CourseDetailPage';
import { ScholarshipApplicationPage } from './views/academy/ScholarshipApplicationPage';
import { ApplicationConfirmationPage } from './views/academy/ApplicationConfirmationPage';
import { CustomerAcademyPage } from './views/account/CustomerAcademyPage';
import { ManagementAcademyPage } from './views/management/ManagementAcademyPage';

// Affiliate & Referral Views & Provider
import { AffiliateProvider } from './context/AffiliateContext';
import { AffiliateLandingPage } from './views/affiliate/AffiliateLandingPage';
import { AffiliateApplyPage } from './views/affiliate/AffiliateApplyPage';
import { AffiliateDashboardPage } from './views/affiliate/AffiliateDashboardPage';
import { AffiliateOffersPage } from './views/affiliate/AffiliateOffersPage';
import { AffiliateWalletPage } from './views/affiliate/AffiliateWalletPage';
import { AffiliatePayoutPage } from './views/affiliate/AffiliatePayoutPage';
import { AffiliateProfilePage } from './views/affiliate/AffiliateProfilePage';
import { ManagementAffiliatePage } from './views/management/ManagementAffiliatePage';

// Notifications & Communication Views & Provider
import { NotificationProvider } from './context/NotificationContext';
import { NotificationCenterPage } from './views/notifications/NotificationCenterPage';
import { NotificationPreferencesPage } from './views/notifications/NotificationPreferencesPage';

// Phase 11: Advanced Management System Views
import { ManagementHubPage } from './views/management/ManagementHubPage';
import { ManagementUsersPage } from './views/management/ManagementUsersPage';
import { ManagementSellersPage } from './views/management/ManagementSellersPage';
import { ManagementProductsPage } from './views/management/ManagementProductsPage';
import { ManagementOrdersPage } from './views/management/ManagementOrdersPage';
import { ManagementPaymentsPage } from './views/management/ManagementPaymentsPage';
import { ManagementAuditLogsPage } from './views/management/ManagementAuditLogsPage';
import { ManagementTeamPage } from './views/management/ManagementTeamPage';

// Phase 12: Unified Search & Discovery View
import { SearchResultsPage } from './views/search/SearchResultsPage';

// Phase 13: Reviews, Ratings & Trust System Views
import { CustomerReviewsPage } from './views/account/CustomerReviewsPage';
import { ManagementReviewsPage } from './views/management/ManagementReviewsPage';

// Phase 14: Digital Products & Content Commerce Views
import { DigitalProductsDiscoveryPage } from './views/digital/DigitalProductsDiscoveryPage';
import { DigitalProductDetailPage } from './views/digital/DigitalProductDetailPage';
import { CustomerDigitalLibraryPage } from './views/account/CustomerDigitalLibraryPage';
import { ManagementDigitalProductsPage } from './views/management/ManagementDigitalProductsPage';

// Phase 15: Wallet & Financial Infrastructure Views
import { WalletOverviewPage } from './views/wallet/WalletOverviewPage';
import { WalletTransactionsPage } from './views/wallet/WalletTransactionsPage';
import { WalletPayoutsPage } from './views/wallet/WalletPayoutsPage';
import { ManagementWalletsPage } from './views/management/ManagementWalletsPage';

// Phase 16: Unified Transactions & Accounting Foundation Views
import { CustomerTransactionsPage } from './views/account/CustomerTransactionsPage';
import { ManagementTransactionsPage } from './views/management/ManagementTransactionsPage';

// Phase 18: Analytics & Business Intelligence Views
import { ManagementAnalyticsPage } from './views/management/ManagementAnalyticsPage';

// Phase 20: AI Ecosystem & Governance Views
import { AiAssistantPage } from './views/ai/AiAssistantPage';
import { ManagementAiGovernancePage } from './views/management/ManagementAiGovernancePage';

// Phase 21: AI-Assisted Operations & Automation Views
import { ManagementAutomationPage } from './views/management/ManagementAutomationPage';

// Phase 22: Ecosystem API & Integrations Views
import { ManagementIntegrationsPage } from './views/management/ManagementIntegrationsPage';

// Phase 23: Scale, Performance & Reliability Views
import { ManagementReliabilityPage } from './views/management/ManagementReliabilityPage';

// Common Views
import { NotFoundPage } from './views/common/NotFoundPage';

const MainRouterView: React.FC = () => {
  const { currentPath, navigate } = useRouter();

  // Phase 12: Global Search & Discovery (/search?q=...)
  if (currentPath.startsWith('/search')) {
    return <SearchResultsPage />;
  }

  // Phase 14: Handle Digital Product Detail Routes /digital-products/:slug
  if (currentPath.startsWith('/digital-products/') && currentPath !== '/digital-products') {
    const slug = currentPath.replace('/digital-products/', '').split('?')[0];
    return <DigitalProductDetailPage slug={slug} />;
  }

  // Handle Product Detail Routes /marketplace/product/:slug
  if (currentPath.startsWith('/marketplace/product/')) {
    const slug = currentPath.replace('/marketplace/product/', '').split('?')[0];
    return <ProductDetailPage slug={slug} />;
  }

  // Handle Admin Product Form Routes (/management/products/new & /management/products/edit/:productId)
  if (currentPath === '/management/products/new') {
    return <ManagementProductFormPage />;
  }
  if (currentPath.startsWith('/management/products/edit/')) {
    const productId = currentPath.replace('/management/products/edit/', '').split('?')[0];
    return <ManagementProductFormPage productId={productId} />;
  }

  // Decommission and block all legacy seller URLs with graceful redirection to marketplace
  if (currentPath.startsWith('/seller')) {
    return <MarketplaceHome />;
  }

  // Handle Single Order Detail Route /account/orders/:orderId
  if (currentPath.startsWith('/account/orders/')) {
    const orderId = currentPath.replace('/account/orders/', '').split('?')[0];
    return <OrderDetailView orderId={orderId} />;
  }

  // Handle Single Customer Service Request Detail Route /account/services/:requestId
  if (currentPath.startsWith('/account/services/')) {
    const requestId = currentPath.replace('/account/services/', '').split('?')[0];
    return <CustomerServiceDetailPage requestId={requestId} />;
  }

  // Handle Single Expert Project Detail Route /expert/projects/:projectId
  if (currentPath.startsWith('/expert/projects/')) {
    const projectId = currentPath.replace('/expert/projects/', '').split('?')[0];
    return <ExpertProjectDetailPage projectId={projectId} />;
  }

  // Handle Public Expert Profile Route /services/experts/:slugOrId
  if (currentPath.startsWith('/services/experts/')) {
    const slugOrId = currentPath.replace('/services/experts/', '').split('?')[0];
    return <ExpertProfilePage slugOrId={slugOrId} />;
  }

  // Handle Dynamic Category Pages /services/:categorySlug (exclude static service paths)
  if (
    currentPath.startsWith('/services/') &&
    !['/services/experts', '/services/request', '/services/apply-expert'].some((p) =>
      currentPath.startsWith(p)
    )
  ) {
    const categorySlug = currentPath.replace('/services/', '').split('?')[0];
    return <ServiceCategoryPage categorySlug={categorySlug} />;
  }

  // Handle Course Details Route /academy/courses/:slug
  if (currentPath.startsWith('/academy/courses/')) {
    const slug = currentPath.replace('/academy/courses/', '').split('?')[0];
    return <CourseDetailPage slug={slug} />;
  }

  // Handle Scholarship Application Confirmation Route /academy/application/:applicationId/confirmation
  if (currentPath.startsWith('/academy/application/') && currentPath.includes('/confirmation')) {
    const applicationId = currentPath.replace('/academy/application/', '').replace('/confirmation', '').split('?')[0];
    return <ApplicationConfirmationPage applicationId={applicationId} />;
  }

  // Handle Scholarship Application Registration Form Route /academy/application/:applicationId
  if (currentPath.startsWith('/academy/application/')) {
    const applicationId = currentPath.replace('/academy/application/', '').split('?')[0];
    return <ScholarshipApplicationPage applicationId={applicationId} />;
  }

  // Handle Public Affiliate Referral Links /r/:affiliateCode or /r/:affiliateCode/:destination
  if (currentPath.startsWith('/r/')) {
    if (typeof window !== 'undefined') {
      window.location.href = currentPath;
    }
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#000000]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0682F4] border-t-[#08E6F9] rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#CCD2D9]">Connecting through verified Nexovira referral link...</p>
        </div>
      </div>
    );
  }

  switch (currentPath.split('?')[0]) {
    case '/':
      return <HomePage onOpenGetStarted={() => navigate('/register')} />;

    case '/marketplace':
      return <MarketplaceHome />;

    case '/checkout':
      return <CheckoutPage />;

    case '/checkout/verify':
    case '/checkout/confirmation':
      return <OrderConfirmationPage />;

    case '/account/orders':
      return <CustomerOrdersPage />;

    case '/account/transactions':
      return <CustomerTransactionsPage />;

    // Services Routes
    case '/services':
      return <ServicesLandingPage />;

    case '/services/experts':
      return <ExpertsDirectoryPage />;

    case '/services/request':
      return <ProjectRequestPage />;

    case '/services/apply-expert':
      return <ApplyExpertPage />;

    case '/account/services':
      return <CustomerServicesPage />;

    case '/expert/dashboard':
      return <ExpertDashboardPage />;

    case '/expert/projects':
      return <ExpertProjectsPage />;

    case '/expert/onboarding':
      return <ExpertOnboardingPage />;

    case '/management/services':
      return <ManagementServicesPage />;

    case '/login':
    case '/signin':
      return <SignInPage />;

    case '/register':
      return <RegisterPage />;

    case '/forgot-password':
      return <ForgotPasswordPage />;

    case '/verify-email':
      return <VerifyEmailPage />;

    case '/account':
      return <AccountPage />;

    case '/account/profile':
      return <AccountProfilePage />;

    case '/account/reviews':
      return <CustomerReviewsPage />;

    case '/settings':
      return <AccountSettingsPage />;

    case '/settings/security':
      return <AccountSecurityPage />;

    // Academy & Scholarship Routes
    case '/academy':
      return <AcademyLandingPage />;

    case '/academy/courses':
      return <CourseDirectoryPage />;

    case '/account/academy':
      return <CustomerAcademyPage />;

    case '/management/academy':
      return <ManagementAcademyPage />;

    // Affiliate & Referral System Routes
    case '/affiliate':
      return <AffiliateLandingPage />;

    case '/affiliate/apply':
      return <AffiliateApplyPage />;

    case '/affiliate/dashboard':
      return <AffiliateDashboardPage />;

    case '/affiliate/offers':
      return <AffiliateOffersPage />;

    case '/affiliate/wallet':
      return <AffiliateWalletPage />;

    case '/affiliate/payout':
    case '/affiliate/payout/request':
      return <AffiliatePayoutPage />;

    case '/affiliate/profile':
      return <AffiliateProfilePage />;

    case '/management/affiliate':
      return <ManagementAffiliatePage />;

    // Phase 11: Advanced Management System Routes
    case '/management':
      return <ManagementHubPage />;

    case '/management/users':
      return <ManagementUsersPage />;

    case '/management/sellers':
      return <ManagementSellersPage />;

    case '/management/products':
      return <ManagementProductsPage />;

    case '/management/orders':
      return <ManagementOrdersPage />;

    case '/management/payments':
      return <ManagementPaymentsPage />;

    case '/management/audit-logs':
      return <ManagementAuditLogsPage />;

    case '/management/team':
      return <ManagementTeamPage />;

    case '/management/reviews':
      return <ManagementReviewsPage />;

    case '/management/digital-products':
      return <ManagementDigitalProductsPage />;

    case '/management/wallets':
      return <ManagementWalletsPage />;

    case '/management/transactions':
      return <ManagementTransactionsPage />;

    case '/management/analytics':
      return <ManagementAnalyticsPage />;

    case '/management/ai-governance':
      return <ManagementAiGovernancePage />;

    case '/management/automation':
      return <ManagementAutomationPage />;

    case '/management/integrations':
      return <ManagementIntegrationsPage />;

    case '/management/reliability':
      return <ManagementReliabilityPage />;

    // Phase 14: Digital Products & Content Commerce Routes
    case '/digital-products':
      return <DigitalProductsDiscoveryPage />;

    case '/account/digital-library':
      return <CustomerDigitalLibraryPage />;

    // Phase 15: Wallet & Financial Infrastructure Routes
    case '/wallet':
      return <WalletOverviewPage />;

    case '/wallet/transactions':
      return <WalletTransactionsPage />;

    case '/wallet/payouts':
      return <WalletPayoutsPage />;

    // Notifications & Communication System Routes
    case '/notifications':
      return <NotificationCenterPage />;

    case '/settings/notifications':
      return <NotificationPreferencesPage />;

    // Phase 20: AI Assistant & Ecosystem View
    case '/ai':
      return <AiAssistantPage />;

    case '/about':
    case '/contact':
    case '/privacy':
    case '/terms':
      return <FutureScopeView route={currentPath} />;

    default:
      return <NotFoundPage requestedPath={currentPath} />;
  }
};

const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#01213D] text-white selection:bg-[#0682F4] selection:text-white">
      {/* Global Navigation Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        <MainRouterView />
      </div>

      {/* Reusable Global Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <NotificationProvider>
          <MarketplaceProvider>
            <CommerceProvider>
              <ServicesProvider>
                <AcademyProvider>
                  <AffiliateProvider>
                    <AppShell />
                  </AffiliateProvider>
                </AcademyProvider>
              </ServicesProvider>
            </CommerceProvider>
          </MarketplaceProvider>
        </NotificationProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
