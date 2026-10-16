import React from 'react';
import { ArrowRight, Monitor, Home, Headphones, Radio } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { useRouter } from '../../context/RouterContext';

export const MarketplacePreview: React.FC = () => {
  const { navigate } = useRouter();

  const categories = [
    {
      title: 'Consumer Electronics & Computing',
      scope: 'Laptops, workstations, mobile computing, and ergonomic peripherals.',
      icon: Monitor,
      architectureNote: 'Category 01 Blueprint',
    },
    {
      title: 'Smart Appliances & Connected Living',
      scope: 'Energy-efficient home automation, culinary tech, and intelligent living systems.',
      icon: Home,
      architectureNote: 'Category 02 Blueprint',
    },
    {
      title: 'Acoustics & Studio Hardware',
      scope: 'High-fidelity audio monitoring, studio recording, and acoustic instruments.',
      icon: Headphones,
      architectureNote: 'Category 03 Blueprint',
    },
    {
      title: 'Network Infrastructure & Devices',
      scope: 'Mesh routers, hardware security keys, and low-latency networking.',
      icon: Radio,
      architectureNote: 'Category 04 Blueprint',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#011B33]/40 border-b border-[#0682F4]/15 relative">
      <Container size="wide">
        <div className="max-w-3xl mb-14 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
            <span>Hardware & Living</span>
            <span aria-hidden="true">·</span>
            <span>Marketplace Blueprint</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            TECHNOLOGY FOR EVERYDAY LIVING
          </h2>

          <p className="text-base sm:text-lg text-[#CCD2D9] font-normal leading-relaxed">
            Introducing the future Nexovira marketplace for appliances, electronics
            and technology products. Designed to curate dependable, high-performance
            hardware for modern lifestyles.
          </p>
        </div>

        {/* Carefully Designed Visual Placeholders (Zero fake products, prices, or reviews) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                className="bg-[#01213D] border border-[#0682F4]/20 rounded-xl p-6 flex flex-col justify-between hover:border-[#08E6F9]/40 transition-colors"
              >
                <div>
                  {/* Category Placeholder Icon Graphic */}
                  <div className="w-12 h-12 rounded-lg bg-[#011629] border border-[#0682F4]/30 flex items-center justify-center text-[#08E6F9] mb-6">
                    <Icon className="w-6 h-6" />
                  </div>

                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0682F4] block mb-2">
                    {cat.architectureNote}
                  </span>

                  <h3 className="font-display font-bold text-lg text-white mb-2 leading-snug">
                    {cat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#CCD2D9]/75 leading-relaxed">
                    {cat.scope}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#0682F4]/15 flex items-center justify-between text-xs text-[#CCD2D9]/50 font-mono">
                  <span>Inventory Pipeline</span>
                  <span className="text-[#08E6F9]">Phase 2 Onward</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Advisory notice */}
        <div className="mt-10 p-4 rounded-xl bg-[#01213D]/80 border border-[#0682F4]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#CCD2D9]/80 font-normal">
            <strong className="text-white font-semibold">Strict Phase 1 Integrity:</strong> No mock transactions, fake prices, or fictitious reviews. Real catalog integration will take place when the secure marketplace backend deploys.
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/marketplace')}
            className="shrink-0 text-xs"
          >
            <span>View Marketplace Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Container>
    </section>
  );
};
