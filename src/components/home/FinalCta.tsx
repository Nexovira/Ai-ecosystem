import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';

interface FinalCtaProps {
  onExplore: () => void;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ onExplore }) => {
  return (
    <section className="py-20 sm:py-32 bg-[#011B33] relative overflow-hidden">
      {/* Horizon perspective focal line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#08E6F9]/40 to-transparent" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#0682F4]/15 blur-[100px] rounded-full pointer-events-none" />

      <Container size="default" className="relative z-10 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
            <span>Horizon Gateway</span>
            <span aria-hidden="true">·</span>
            <span>Production Ecosystem Engine</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight [text-wrap:balance]">
            ONE PLATFORM. INFINITE HORIZONS.
          </h2>

          <p className="text-base sm:text-lg text-[#CCD2D9] max-w-xl mx-auto font-normal leading-relaxed">
            Experience technology, digital commerce, learning, and expert services unified into one coherent ecosystem.
          </p>

          <div className="pt-4 flex justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={onExplore}
              className="px-8"
            >
              <span>Explore Nexovira</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
