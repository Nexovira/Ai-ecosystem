import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, ArrowUpRight, User, LogOut, Shield, Briefcase, Bell, Search, Wallet, ChevronDown } from 'lucide-react';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { NotificationBell } from '../notifications/NotificationBell';
import { GlobalSearchBar } from '../search/GlobalSearchBar';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { RoutePath } from '../../types';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentPath, navigate } = useRouter();
  const { user, profile, signOutUser } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const primaryNavLinks: { label: string; path: RoutePath }[] = [
    { label: 'Home', path: '/' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Tech & Services', path: '/services' },
    { label: 'Academy', path: '/academy' },
    { label: 'About', path: '/about' },
  ];

  const moreLinks: { label: string; path: RoutePath; description: string }[] = [
    { label: 'Affiliate Program', path: '/affiliate', description: 'Promote eligible offers and earn commissions' },
    { label: 'Digital Products', path: '/digital-products', description: 'Guides, ebooks, and digital resources' },
    { label: 'AI Ecosystem', path: '/ai', description: 'Integrated artificial intelligence services' },
  ];

  const handleNav = (path: RoutePath) => {
    navigate(path);
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  };

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOutUser();
    navigate('/');
  };

  const displayName = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || 'Member';
  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E8EDF2] transition-colors shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 items-center justify-between">
          
          {/* Zone 1: Official Logo */}
          <div className="flex items-center">
            <Logo
              size="md"
              variant="dark"
              onClick={() => handleNav('/')}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0169FA] rounded-md"
            />
          </div>

          {/* Zone 2: Clean Navigation Links (Desktop) */}
          <nav
            className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium"
            aria-label="Main Navigation"
          >
            {primaryNavLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`relative py-1.5 transition-colors cursor-pointer select-none ${
                    isActive
                      ? 'text-[#0169FA] font-semibold'
                      : 'text-[#252B33] hover:text-[#0169FA]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#08B3F8] to-[#0169FA] rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Dropdown for Secondary Opportunities */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`flex items-center gap-1 py-1.5 transition-colors cursor-pointer text-sm font-medium select-none ${
                  moreDropdownOpen || moreLinks.some((l) => currentPath === l.path)
                    ? 'text-[#0169FA] font-semibold'
                    : 'text-[#252B33] hover:text-[#0169FA]'
                }`}
                aria-expanded={moreDropdownOpen}
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreDropdownOpen ? 'rotate-180 text-[#0169FA]' : 'text-[#6B7280]'}`} />
              </button>

              {moreDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E8EDF2] p-2 shadow-xl shadow-slate-200/60 animate-in fade-in zoom-in-95 duration-150 z-50">
                  {moreLinks.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer flex flex-col gap-0.5 ${
                        currentPath === item.path
                          ? 'bg-[#F7F8FA] text-[#0169FA]'
                          : 'hover:bg-[#F7F8FA] text-[#111827]'
                      }`}
                    >
                      <span className="text-xs font-semibold">{item.label}</span>
                      <span className="text-[11px] text-[#6B7280] leading-tight">{item.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Global Search Bar */}
          <div className="hidden xl:flex items-center">
            <GlobalSearchBar variant="header" className="w-52" />
          </div>

          {/* Zone 3: Primary Actions (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              // Authenticated User Controls
              <div className="flex items-center gap-2.5">
                {/* Expert Console for approved experts */}
                {profile?.role === 'EXPERT' && (
                  <button
                    onClick={() => handleNav('/expert/dashboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8EDF2] bg-white text-xs font-medium text-[#14283F] hover:border-[#0169FA] hover:text-[#0169FA] transition-all cursor-pointer shadow-xs"
                    title="Access Expert Console"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-[#0169FA]" />
                    <span>Expert Console</span>
                  </button>
                )}

                {/* Operations Desk for management */}
                {isAdmin && (
                  <button
                    onClick={() => handleNav('/management/hub' as RoutePath)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8EDF2] bg-white text-xs font-medium text-[#14283F] hover:border-[#0169FA] hover:text-[#0169FA] transition-all cursor-pointer shadow-xs"
                    title="Management Hub"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#0169FA]" />
                    <span>Admin Hub</span>
                  </button>
                )}

                {/* Notifications Bell */}
                <NotificationBell />

                {/* Financial Wallet */}
                <button
                  onClick={() => handleNav('/wallet' as RoutePath)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8EDF2] bg-white text-xs font-medium text-[#14283F] hover:border-[#0169FA] hover:text-[#0169FA] transition-all cursor-pointer shadow-xs"
                  title="Financial Wallet"
                >
                  <Wallet className="w-3.5 h-3.5 text-[#0169FA]" />
                  <span>Wallet</span>
                </button>

                {/* Account Profile Pill */}
                <button
                  onClick={() => handleNav('/account')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E8EDF2] bg-white hover:border-[#0169FA] transition-all cursor-pointer shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#0169FA] to-[#08B3F8] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-[#14283F] max-w-[110px] truncate">
                    {displayName}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] font-bold text-[#0169FA] bg-[#0169FA]/10 px-1.5 py-0.5 rounded-md">Admin</span>
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNav('/signin')}
                  className="text-sm font-semibold text-[#14283F] hover:text-[#0169FA] px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleNav('/register')}
                  className="shadow-sm shadow-[#0169FA]/20"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger & Quick Actions */}
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
                  className="p-1.5 rounded-xl bg-white border border-[#E8EDF2] text-[#0169FA]"
                  aria-label="Account"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Search Button */}
            <button
              onClick={() => handleNav('/search')}
              className="p-1.5 rounded-xl bg-white border border-[#E8EDF2] text-[#0169FA] hover:bg-[#F7F8FA] transition"
              aria-label="Search Ecosystem"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#14283F] hover:text-[#0169FA] rounded-xl hover:bg-[#F7F8FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0169FA] transition-colors cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#0169FA]" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E8EDF2] bg-white px-5 py-6 shadow-xl animate-in slide-in-from-top-2 duration-200 space-y-4">
          {/* Global Search in Mobile Drawer */}
          <div>
            <GlobalSearchBar
              variant="standalone"
              onSearchSubmit={() => setMobileMenuOpen(false)}
              placeholder="Search Nexovira products, services, courses..."
            />
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Mobile Navigation">
            {primaryNavLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-left text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#0169FA]/10 text-[#0169FA]'
                      : 'text-[#14283F] hover:bg-[#F7F8FA] hover:text-[#0169FA]'
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-40" />
                </button>
              );
            })}

            {/* Additional Sections in Mobile */}
            <div className="pt-2 border-t border-[#E8EDF2] space-y-1">
              <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Ecosystem Hubs
              </span>
              {moreLinks.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-left text-xs font-medium transition-colors ${
                    currentPath === item.path
                      ? 'bg-[#0169FA]/10 text-[#0169FA]'
                      : 'text-[#252B33] hover:bg-[#F7F8FA] hover:text-[#0169FA]'
                  }`}
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
                </button>
              ))}
            </div>

            <div className="pt-4 mt-2 border-t border-[#E8EDF2] flex flex-col gap-2.5">
              {user ? (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => handleNav('/account')}
                    className="justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#0169FA]" />
                      <span>Account ({displayName})</span>
                    </span>
                    {isAdmin && <Shield className="w-4 h-4 text-[#0169FA]" />}
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
                    Get Started
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
