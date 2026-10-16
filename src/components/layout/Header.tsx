import React, { useState } from 'react';
import { Menu, X, ArrowUpRight, User, LogOut, Shield, Store, Briefcase, Bell, Search, Wallet } from 'lucide-react';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { NotificationBell } from '../notifications/NotificationBell';
import { GlobalSearchBar } from '../search/GlobalSearchBar';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import { RoutePath } from '../../types';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentPath, navigate } = useRouter();
  const { user, profile, signOutUser } = useAuth();

  const navLinks: { label: string; path: RoutePath }[] = [
    { label: 'AI Ecosystem', path: '/ai' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Tech & Services', path: '/services' },
    { label: 'Academy', path: '/academy' },
    { label: 'Affiliates', path: '/affiliate' },
    { label: 'Digital Products', path: '/digital-products' },
  ];

  const handleNav = (path: RoutePath) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOutUser();
    navigate('/');
  };

  const displayName = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || 'Member';
  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN';
  const { isVerifiedSeller } = useSeller();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#01213D]/90 backdrop-blur-md border-b border-[#0682F4]/20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between">
          
          {/* Zone 1: Brand Zone */}
          <div className="flex items-center">
            <Logo
              size="md"
              onClick={() => handleNav('/')}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08E6F9] rounded-md"
            />
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav
            className="hidden lg:flex items-center gap-7 text-sm font-medium"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`relative py-1 transition-colors hover:text-white cursor-pointer select-none ${
                    isActive ? 'text-[#08E6F9] font-semibold' : 'text-[#CCD2D9]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0682F4] to-[#08E6F9] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Global Search Bar */}
          <div className="hidden lg:flex items-center">
            <GlobalSearchBar variant="header" className="w-44 xl:w-64" />
          </div>

          {/* Zone 3: Primary Actions (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              // Authenticated User Controls
              <div className="flex items-center gap-3">
                {isVerifiedSeller ? (
                  <button
                    onClick={() => handleNav('/seller/dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      currentPath.startsWith('/seller')
                        ? 'bg-[#08E6F9]/20 border-[#08E6F9] text-[#08E6F9]'
                        : 'bg-[#011B33] border-[#0682F4]/40 text-[#CCD2D9] hover:border-[#08E6F9] hover:text-white'
                    }`}
                    title="Access Merchant Console"
                  >
                    <Store className="w-3.5 h-3.5 text-[#08E6F9]" />
                    <span>Merchant Console</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNav('/seller/apply')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#0682F4]/30 bg-[#011B33] text-xs text-[#CCD2D9] hover:text-[#08E6F9] hover:border-[#08E6F9]/50 transition-colors cursor-pointer"
                    title="Apply to become an authorized merchant"
                  >
                    <Store className="w-3.5 h-3.5 text-[#CCD2D9]" />
                    <span>Sell</span>
                  </button>
                )}

                {/* Expert Console for approved experts */}
                {profile?.role === 'EXPERT' && (
                  <button
                    onClick={() => handleNav('/expert/dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      currentPath.startsWith('/expert')
                        ? 'bg-[#08E6F9]/20 border-[#08E6F9] text-[#08E6F9]'
                        : 'bg-[#011B33] border-[#0682F4]/40 text-[#CCD2D9] hover:border-[#08E6F9] hover:text-white'
                    }`}
                    title="Access Expert Console"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-[#08E6F9]" />
                    <span>Expert Console</span>
                  </button>
                )}

                {/* Operations Desk for management */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleNav('/management/services')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        currentPath.startsWith('/management/services')
                          ? 'bg-[#0682F4]/20 border-[#08E6F9] text-[#08E6F9]'
                          : 'bg-[#011B33] border-[#0682F4]/40 text-[#CCD2D9] hover:border-[#08E6F9] hover:text-white'
                      }`}
                      title="Services Desk"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#08E6F9]" />
                      <span>Services Ops</span>
                    </button>

                    <button
                      onClick={() => handleNav('/management/academy')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        currentPath.startsWith('/management/academy')
                          ? 'bg-[#0682F4]/20 border-[#08E6F9] text-[#08E6F9]'
                          : 'bg-[#011B33] border-[#0682F4]/40 text-[#CCD2D9] hover:border-[#08E6F9] hover:text-white'
                      }`}
                      title="Academy Management Portal"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#08E6F9]" />
                      <span>Academy Ops</span>
                    </button>

                    <button
                      onClick={() => handleNav('/management/affiliate')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        currentPath.startsWith('/management/affiliate')
                          ? 'bg-[#0682F4]/20 border-[#08E6F9] text-[#08E6F9]'
                          : 'bg-[#011B33] border-[#0682F4]/40 text-[#CCD2D9] hover:border-[#08E6F9] hover:text-white'
                      }`}
                      title="Affiliate Management Desk"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#08E6F9]" />
                      <span>Affiliate Ops</span>
                    </button>
                  </div>
                )}

                {/* Notifications Bell */}
                <NotificationBell />

                {/* Financial Wallet */}
                <button
                  onClick={() => handleNav('/wallet' as RoutePath)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    currentPath.startsWith('/wallet')
                      ? 'bg-[#0682F4]/20 border-[#08E6F9] text-[#08E6F9]'
                      : 'bg-[#011B33] border-[#0682F4]/30 text-[#CCD2D9] hover:border-[#08E6F9]/60 hover:text-white'
                  }`}
                  title="Financial Wallet"
                >
                  <Wallet className="w-3.5 h-3.5 text-[#08E6F9]" />
                  <span className="hidden sm:inline">Wallet</span>
                </button>

                <button
                  onClick={() => handleNav('/account')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    currentPath === '/account'
                      ? 'bg-[#0682F4]/20 border-[#08E6F9] text-white'
                      : 'bg-[#011B33] border-[#0682F4]/30 text-[#CCD2D9] hover:border-[#08E6F9]/60 hover:text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-[#0682F4] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium max-w-[120px] truncate">
                    {displayName}
                  </span>
                  {isAdmin && (
                    <Shield className="w-3 h-3 text-[#08E6F9] shrink-0" aria-label="Administrator" />
                  )}
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs px-3"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </Button>
              </div>
            ) : (
              // Unauthenticated User Controls
              <>
                <button
                  onClick={() => handleNav('/seller/apply')}
                  className="text-xs font-medium text-[#CCD2D9] hover:text-[#08E6F9] px-2.5 py-1.5 rounded-lg border border-[#0682F4]/30 bg-[#011B33] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Sell</span>
                </button>
                <button
                  onClick={() => handleNav('/signin')}
                  className="text-sm font-medium text-[#CCD2D9] hover:text-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleNav('/register')}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger & Quick Action */}
          <div className="flex lg:hidden items-center gap-2">
            {!user ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleNav('/register')}
                className="text-xs h-8 px-3"
              >
                Get Started
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <NotificationBell />
                <button
                  onClick={() => handleNav('/account')}
                  className="p-1.5 rounded-lg bg-[#011B33] border border-[#0682F4]/30 text-[#08E6F9]"
                  aria-label="Account"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Search Button */}
            <button
              onClick={() => handleNav('/search')}
              className="p-1.5 rounded-lg bg-[#011B33] border border-[#0682F4]/30 text-[#08E6F9] hover:bg-[#0682F4]/20 transition"
              aria-label="Search Ecosystem"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#CCD2D9] hover:text-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08E6F9] transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#08E6F9]" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#0682F4]/20 bg-[#011B33] px-5 py-6 shadow-2xl animate-in slide-in-from-top-2 duration-200 space-y-4">
          {/* Global Search in Mobile Drawer */}
          <div>
            <GlobalSearchBar
              variant="standalone"
              onSearchSubmit={() => setMobileMenuOpen(false)}
              placeholder="Search Nexovira..."
            />
          </div>

          <nav className="flex flex-col gap-3" aria-label="Mobile Navigation">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0682F4]/20 text-[#08E6F9]'
                      : 'text-[#CCD2D9] hover:bg-[#0682F4]/10 hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-50" />
                </button>
              );
            })}

            <div className="pt-4 mt-2 border-t border-[#0682F4]/20 flex flex-col gap-2.5">
              {user ? (
                <>
                  {isVerifiedSeller ? (
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onClick={() => handleNav('/seller/dashboard')}
                      className="justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-[#01213D]" />
                        <span>Merchant Console</span>
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-[#01213D]" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="md"
                      fullWidth
                      onClick={() => handleNav('/seller/apply')}
                      className="justify-between text-[#08E6F9] border-[#08E6F9]/40"
                    >
                      <span className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-[#08E6F9]" />
                        <span>Apply as Merchant / Sell</span>
                      </span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => handleNav('/notifications')}
                    className="justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#08E6F9]" />
                      <span>Notifications</span>
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[#CCD2D9]" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => handleNav('/account')}
                    className="justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#08E6F9]" />
                      <span>Account ({displayName})</span>
                    </span>
                    {isAdmin && <Shield className="w-4 h-4 text-[#08E6F9]" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => handleNav('/signin')}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => handleNav('/register')}
                  >
                    Create Account
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
