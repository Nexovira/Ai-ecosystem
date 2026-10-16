import React from 'react';
import { Mail, ArrowUpRight } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useRouter } from '../../context/RouterContext';
import { RoutePath } from '../../types';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  const navItems: { label: string; path: RoutePath }[] = [
    { label: 'AI Ecosystem', path: '/ai' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Tech & Services', path: '/services' },
    { label: 'Academy', path: '/academy' },
    { label: 'Affiliate Program', path: '/affiliate' },
    { label: 'Digital Products', path: '/digital-products' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const legalItems: { label: string; path: RoutePath }[] = [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
  ];

  return (
    <footer className="border-t border-[#0682F4]/20 bg-[#011629] text-[#CCD2D9] relative overflow-hidden">
      {/* Subtle background ambient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#08E6F9]/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <Logo size="md" onClick={() => navigate('/')} />
            <p className="text-sm font-semibold tracking-widest text-[#08E6F9] uppercase">
              MANY POSSIBILITIES. ONE INTELLIGENT ECOSYSTEM.
            </p>
            <p className="text-xs sm:text-sm text-[#CCD2D9]/70 leading-relaxed max-w-sm">
              Nexovira is being built as a premium technology ecosystem bringing
              together intelligent tools, digital services, education, and
              commerce under a unified platform.
            </p>
            <div className="pt-2">
              <a
                href="mailto:nexoviratech@gmail.com"
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#08E6F9] hover:text-[#7CF9FD] transition-colors font-medium group"
              >
                <Mail className="w-4 h-4 text-[#0682F4] group-hover:text-[#08E6F9]" />
                <span>nexoviratech@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Navigation Links Column */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-semibold tracking-wider text-white uppercase mb-3">
              Ecosystem Navigation
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {navItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-left text-[#CCD2D9] hover:text-[#08E6F9] transition-colors py-1 cursor-pointer flex items-center gap-1 group"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#08E6F9]" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect & Legal Column */}
          <div className="md:col-span-3 space-y-4">
            <div>
              <div className="text-xs font-semibold tracking-wider text-white uppercase mb-3">
                Connect
              </div>
              <div className="flex items-center gap-4 text-sm">
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#CCD2D9] hover:text-[#08E6F9] transition-colors"
                >
                  LinkedIn
                </a>
                <span className="text-[#CCD2D9]/30">·</span>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#CCD2D9] hover:text-[#08E6F9] transition-colors"
                >
                  X
                </a>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-xs font-semibold tracking-wider text-white uppercase mb-2">
                Legal
              </div>
              <ul className="space-y-1.5 text-xs text-[#CCD2D9]/80">
                {legalItems.map((legal) => (
                  <li key={legal.path}>
                    <button
                      onClick={() => navigate(legal.path)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {legal.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#0682F4]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#CCD2D9]/60">
          <p>© {new Date().getFullYear()} NEXOVIRA. All rights reserved.</p>
          <p className="tracking-wide">
            Phase 1 Foundation · Architectural Baseline
          </p>
        </div>
      </div>
    </footer>
  );
};
