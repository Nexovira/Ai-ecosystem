import React from 'react';
import { ArrowRight, Share2, ShieldCheck, Wallet, CheckCircle2 } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { Button } from '../common/Button';

export const AffiliateSection: React.FC = () => {
  const { navigate } = useRouter();

  const benefits = [
    {
      title: 'Eligible Product & Service Offers',
      description: 'Promote verified hardware, selected digital publications, and platform services from your unique referral links.',
      icon: Share2,
    },
    {
      title: 'Transparent Commission Rules',
      description: 'Earn tracked commissions on qualifying, paid customer transactions with 30-day attribution cookies.',
      icon: ShieldCheck,
    },
    {
      title: 'Direct Wallet Settlements',
      description: 'Request disbursements directly to your verified local bank account once balances clear the return window.',
      icon: Wallet,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-[#E8EDF2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-3xl bg-[#F7F8FA] border border-[#E8EDF2] p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          {/* Subtle electric cyan glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#08B3F8]/10 via-[#0169FA]/5 to-transparent blur-3xl pointer-events-none rounded-full" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            
            {/* Left Column: Clear Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#0169FA] uppercase">
                Partner &amp; Earn
              </span>

              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14283F] tracking-tight">
                The Nexovira Affiliate Opportunity
              </h2>

              <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed max-w-xl">
                Approved affiliates can recommend eligible Nexovira marketplace products, courses, and digital tools to their network. Earn honest, performance-based commissions on qualifying activity with real-time conversion tracking.
              </p>

              {/* Verified Checklist */}
              <div className="space-y-2.5 pt-2 text-xs sm:text-sm text-[#14283F]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0169FA] shrink-0" />
                  <span>Transparent 30-day attribution tracking on qualified referrals</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0169FA] shrink-0" />
                  <span>Real-time dashboard reporting clicks, orders, and pending balances</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0169FA] shrink-0" />
                  <span>Strict anti-fraud protection and reliable payouts</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/affiliate')}
                  className="shadow-md shadow-[#0169FA]/20 group"
                >
                  <span>Learn About Affiliate Program</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

            {/* Right Column: 3 Structured Benefit Cards */}
            <div className="lg:col-span-5 space-y-3.5">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="p-5 rounded-2xl bg-white border border-[#E8EDF2] shadow-xs flex items-start gap-4 hover:border-[#028BFA] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#0169FA]/10 text-[#0169FA] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#0169FA]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-sm text-[#14283F]">
                        {benefit.title}
                      </h3>
                      <p className="text-xs text-[#6B7280] leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
