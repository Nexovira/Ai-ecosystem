import React from 'react';
import { Mail, ArrowUpRight } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useRouter } from '../../context/RouterContext';
import { RoutePath } from '../../types';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  const exploreLinks: { label: string; path: RoutePath }[] = [
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Tech & Services', path: '/services' },
    { label: 'Academy', path: '/academy' },
    { label: 'Digital Products', path: '/digital-products' },
    { label: 'AI Ecosystem', path: '/ai' },
  ];

  const companyLinks: { label: string; path: RoutePath }[] = [
    { label: 'About Nexovira', path: '/about' },
    { label: 'Contact Us', path: '/contact' },
  ];

  const opportunityLinks: { label: string; path: RoutePath }[] = [
    { label: 'Affiliate Program', path: '/affiliate' },
    { label: 'Join as an Expert', path: '/services/apply-expert' },
    { label: 'Academy Scholarships', path: '/academy/scholarships' },
  ];

  const supportLinks: { label: string; path: RoutePath }[] = [
    { label: 'Help & FAQs', path: '/about' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Privacy Policy', path: '/privacy' },
  ];

  return (
    <footer className="border-t border-[#E8EDF2] bg-[#14283F] text-[#E8EDF2] relative overflow-hidden">
      {/* Restrained brand gradient top accent hairline */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#08B3F8] via-[#0169FA] to-[#032FC8]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <Logo size="md" variant="light" onClick={() => navigate('/')} />
            <p className="text-xs font-semibold tracking-wider text-[#08B3F8] uppercase">
              One Ecosystem. Endless Possibilities.
            </p>
            <p className="text-xs sm:text-sm text-[#E8EDF2]/80 leading-relaxed max-w-sm">
              Discover hardware products, access verified tech professionals, build modern engineering skills, and participate in expanding digital opportunities.
            </p>
            <div className="pt-2">
              <a
                href="mailto:nexoviratech@gmail.com"
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#08B3F8] hover:text-white transition-colors font-medium group"
              >
                <Mail className="w-4 h-4 text-[#028BFA] group-hover:text-[#08B3F8]" />
                <span>nexoviratech@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Column 1: Explore */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-white uppercase">
              Explore
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {exploreLinks.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-left text-[#E8EDF2]/80 hover:text-[#08B3F8] transition-colors py-0.5 cursor-pointer flex items-center gap-1 group"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#08B3F8]" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Opportunities */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-white uppercase">
              Opportunities
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {opportunityLinks.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-left text-[#E8EDF2]/80 hover:text-[#08B3F8] transition-colors py-0.5 cursor-pointer flex items-center gap-1 group"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#08B3F8]" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-white uppercase">
              Company
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {companyLinks.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-left text-[#E8EDF2]/80 hover:text-[#08B3F8] transition-colors py-0.5 cursor-pointer flex items-center gap-1 group"
                  >
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support & Legal */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-white uppercase">
              Support
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {supportLinks.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-left text-[#E8EDF2]/80 hover:text-[#08B3F8] transition-colors py-0.5 cursor-pointer flex items-center gap-1 group"
                  >
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E8EDF2]/60">
          <p>© {new Date().getFullYear()} NEXOVIRA. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Official Brand Identity</span>
            <span>·</span>
            <span>Secure Ecosystem Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
