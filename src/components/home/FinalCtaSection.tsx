import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { useRouter } from '../../context/RouterContext';

interface FinalCtaSectionProps {
  onGetStarted?: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onGetStarted }) => {
  const { navigate } = useRouter();

  const handleAction = onGetStarted || (() => navigate('/register'));

  return (
    <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
      {/* Restrained brand gradient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#08B3F8]/10 via-[#0169FA]/10 to-[#032FC8]/5 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        {/* Unboxed subtle kicker */}
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wider text-[#0169FA] uppercase">
          <Sparkles className="w-4 h-4 text-[#08B3F8]" />
          <span>Get Started Today</span>
        </div>

        {/* Main Headline */}
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#14283F] tracking-tight leading-[1.15]">
          Your Next Opportunity<br />
          <span className="nexo-brand-gradient-text">Starts Here.</span>
        </h2>

        {/* Supporting text */}
        <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
          Join Nexovira and explore a connected world of products, services, learning, and digital opportunities.
        </p>

        {/* Call to Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleAction}
            className="w-full sm:w-auto shadow-lg shadow-[#0169FA]/25 group text-base px-8 py-3.5"
          >
            <span>Create Your Account</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/marketplace')}
            className="w-full sm:w-auto text-base px-8 py-3.5"
          >
            <span>Explore Marketplace</span>
          </Button>
        </div>

      </div>
    </section>
  );
};
