import React from 'react';
import { Compass, CheckSquare, Sparkles } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Explore',
      description: 'Discover verified products, specialized tech services, learning tracks, and curated digital resources across the ecosystem.',
      icon: Compass,
      gradient: 'from-[#08B3F8] to-[#028BFA]',
    },
    {
      number: '02',
      title: 'Choose',
      description: 'Select exactly what meets your goals — whether buying hardware, requesting a custom development project, or enrolling in a course.',
      icon: CheckSquare,
      gradient: 'from-[#028BFA] to-[#0169FA]',
    },
    {
      number: '03',
      title: 'Get Started',
      description: 'Create an account to track your orders, collaborate with experts, access course lessons, or participate in affiliate opportunities.',
      icon: Sparkles,
      gradient: 'from-[#0169FA] to-[#0148F2]',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-[#E8EDF2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#0169FA] uppercase">
            Simple Process
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14283F] tracking-tight">
            How Nexovira Works
          </h2>
          <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
            Getting value from the Nexovira ecosystem is simple, straightforward, and secure.
          </p>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Subtle connecting horizontal line on desktop */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-[#E8EDF2] -z-0" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative z-10 flex flex-col items-center text-center p-6 sm:p-8 rounded-3xl bg-[#F7F8FA] border border-[#E8EDF2] hover:border-[#028BFA] transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 space-y-4"
              >
                {/* Step Icon with Gradient Badge */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${step.gradient} text-white flex items-center justify-center shadow-md shadow-[#0169FA]/20`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Editorial Index */}
                <span className="text-xs font-mono font-bold tracking-widest text-[#0169FA]">
                  STEP {step.number}
                </span>

                {/* Step Title */}
                <h3 className="font-display font-bold text-xl text-[#14283F]">
                  {step.title}
                </h3>

                {/* Step Description */}
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
