import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '../common/Button';
import { Container } from '../common/Container';
import { ConvergenceVisualizer } from './ConvergenceVisualizer';

interface HeroProps {
  onExplore: () => void;
  onDiscover: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore, onDiscover }) => {
  return (
    <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden nexo-grid-bg border-b border-[#0682F4]/15">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#0682F4]/10 blur-[120px] rounded-full pointer-events-none" />

      <Container size="wide" className="relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          
          {/* Subtle architectural kicker (unboxed, zero-pill discipline) */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium tracking-[0.2em] text-[#08E6F9] uppercase">
            <span>Horizon Gateway</span>
            <span aria-hidden="true" className="text-[#0682F4]">·</span>
            <span>Intelligent Foundation</span>
            <span aria-hidden="true" className="text-[#0682F4]">·</span>
            <span>Phase 1</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-[1.08] [text-wrap:balance]">
            ONE ECOSYSTEM.<br />
            <span className="nexo-cyan-gradient-text">MANY POSSIBILITIES.</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg lg:text-xl text-[#CCD2D9] max-w-2xl leading-relaxed font-normal [text-wrap:balance]">
            Nexovira brings technology, digital services, learning, commerce and
            intelligent experiences together in one evolving ecosystem.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={onExplore}
              className="w-full sm:w-auto"
            >
              <span>Explore Nexovira</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={onDiscover}
              className="w-full sm:w-auto"
            >
              <Compass className="w-4 h-4 text-[#08E6F9]" />
              <span>Discover the Ecosystem</span>
            </Button>
          </div>
        </div>

        {/* Sophisticated Convergence & Geometric Pathways Visualizer */}
        <div className="mt-14 sm:mt-18 pt-6">
          <ConvergenceVisualizer />
        </div>
      </Container>
    </section>
  );
};
