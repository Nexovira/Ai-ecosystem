import React from 'react';
import { ArrowRight, ShoppingBag, Briefcase, GraduationCap, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { useRouter } from '../../context/RouterContext';

interface HeroProps {
  onExplore: () => void;
  onGetStarted: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore, onGetStarted }) => {
  const { navigate } = useRouter();

  return (
    <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32 overflow-hidden bg-white border-b border-[#E8EDF2]">
      {/* Subtle brand ambient lighting - restrained electric cyan glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-[#08B3F8]/10 via-[#0169FA]/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-gradient-to-tr from-[#028BFA]/5 to-transparent blur-2xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Clear, High-Contrast Typography & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            
            {/* Quiet, unboxed editorial badge */}
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wider text-[#0169FA] uppercase">
              <span className="w-2 h-2 rounded-full bg-[#08B3F8]" />
              <span>All-In-One Technology Platform</span>
              <span aria-hidden="true" className="text-[#6B7280]">·</span>
              <span className="text-[#6B7280]">Verified Ecosystem</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#14283F] leading-[1.12]">
              One Ecosystem.<br />
              <span className="nexo-brand-gradient-text">Endless Possibilities.</span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg lg:text-xl text-[#6B7280] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Discover products, access professional tech services, develop new skills, and explore digital opportunities — all in one connected ecosystem.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={onExplore}
                className="w-full sm:w-auto shadow-md shadow-[#0169FA]/20 group"
              >
                <span>Explore Nexovira</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={onGetStarted}
                className="w-full sm:w-auto"
              >
                <span>Get Started</span>
              </Button>
            </div>

            {/* Trust Signals (unboxed, clean typography) */}
            <div className="pt-4 border-t border-[#E8EDF2] flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0169FA]" />
                <span>Verified tech experts &amp; services</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0169FA]" />
                <span>Curated physical &amp; digital catalog</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0169FA]" />
                <span>Project-driven academy curriculum</span>
              </span>
            </div>
          </div>

          {/* Right Column: Visual Composition Communicating the Ecosystem */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Central Card with Official Logo & Hub Preview */}
              <div className="rounded-3xl bg-white border border-[#E8EDF2] p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden">
                {/* Top Restrained Accent Hairline */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#08B3F8] via-[#0169FA] to-[#032FC8]" />

                {/* Header inside visual card */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-black flex items-center justify-center p-0.5 shadow-sm">
                      <img
                        src="/assets/aistudio/IMG-20261029-WA0008_84e40fd0.jpg"
                        alt="Nexovira"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-[#14283F] leading-tight">Nexovira Ecosystem</h3>
                      <p className="text-xs text-[#6B7280]">Unified Operational Network</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#0169FA]/10 text-[#0169FA]">
                    Live Hub
                  </span>
                </div>

                {/* Ecosystem 4-Quadrant Preview */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Quadrant 1: Marketplace */}
                  <div
                    onClick={() => navigate('/marketplace')}
                    className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E8EDF2] hover:border-[#028BFA] transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#08B3F8]/10 text-[#08B3F8] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-4 h-4 text-[#0169FA]" />
                    </div>
                    <div className="text-xs font-bold text-[#14283F] group-hover:text-[#0169FA] transition-colors">Marketplace</div>
                    <p className="text-[11px] text-[#6B7280] line-clamp-1">Hardware &amp; Digital</p>
                  </div>

                  {/* Quadrant 2: Tech Services */}
                  <div
                    onClick={() => navigate('/services')}
                    className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E8EDF2] hover:border-[#028BFA] transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#0169FA]/10 text-[#0169FA] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Briefcase className="w-4 h-4 text-[#0169FA]" />
                    </div>
                    <div className="text-xs font-bold text-[#14283F] group-hover:text-[#0169FA] transition-colors">Tech Services</div>
                    <p className="text-[11px] text-[#6B7280] line-clamp-1">Vetted Professionals</p>
                  </div>

                  {/* Quadrant 3: Academy */}
                  <div
                    onClick={() => navigate('/academy')}
                    className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E8EDF2] hover:border-[#028BFA] transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#0148F2]/10 text-[#0148F2] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <GraduationCap className="w-4 h-4 text-[#0148F2]" />
                    </div>
                    <div className="text-xs font-bold text-[#14283F] group-hover:text-[#0169FA] transition-colors">Academy</div>
                    <p className="text-[11px] text-[#6B7280] line-clamp-1">Curriculum &amp; Skills</p>
                  </div>

                  {/* Quadrant 4: Opportunities */}
                  <div
                    onClick={() => navigate('/affiliate')}
                    className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E8EDF2] hover:border-[#028BFA] transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#032FC8]/10 text-[#032FC8] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-4 h-4 text-[#032FC8]" />
                    </div>
                    <div className="text-xs font-bold text-[#14283F] group-hover:text-[#0169FA] transition-colors">Opportunities</div>
                    <p className="text-[11px] text-[#6B7280] line-clamp-1">Affiliate &amp; Rewards</p>
                  </div>
                </div>

                {/* Ecosystem Pulse Bar */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#08B3F8]/10 via-[#0169FA]/10 to-[#032FC8]/10 border border-[#0169FA]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#08B3F8] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0169FA]"></span>
                    </span>
                    <span className="font-semibold text-[#14283F]">Connected Platform</span>
                  </div>
                  <span className="text-[#0169FA] font-medium">Explore All Hubs →</span>
                </div>
              </div>

              {/* Floating Verified Badge */}
              <div className="hidden sm:flex absolute -bottom-5 -left-5 bg-white border border-[#E8EDF2] p-3 rounded-2xl shadow-lg shadow-slate-200/60 items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#08B3F8]/15 flex items-center justify-center text-[#0169FA]">
                  <CheckCircle2 className="w-5 h-5 text-[#0169FA]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#14283F]">Protected Ecosystem</div>
                  <div className="text-[10px] text-[#6B7280]">Role-based verification</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
