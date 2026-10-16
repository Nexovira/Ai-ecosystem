import React from 'react';
import { Hero } from '../components/home/Hero';
import { AiInterfacePreview } from '../components/home/AiInterfacePreview';
import { EcosystemSection } from '../components/home/EcosystemSection';
import { TechServicesPreview } from '../components/home/TechServicesPreview';
import { AcademyPreview } from '../components/home/AcademyPreview';
import { MarketplacePreview } from '../components/home/MarketplacePreview';
import { BrandStatement } from '../components/home/BrandStatement';
import { FinalCta } from '../components/home/FinalCta';

interface HomePageProps {
  onOpenGetStarted: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenGetStarted }) => {
  const scrollToEcosystem = () => {
    const el = document.getElementById('ecosystem');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="w-full">
      {/* Hero Section */}
      <Hero
        onExplore={scrollToEcosystem}
        onDiscover={scrollToEcosystem}
      />

      {/* AI Interface Preview */}
      <AiInterfacePreview />

      {/* Ecosystem Six Pillars Grid */}
      <EcosystemSection />

      {/* Tech & Services Preview */}
      <TechServicesPreview />

      {/* Academy Preview */}
      <AcademyPreview />

      {/* Marketplace Preview */}
      <MarketplacePreview />

      {/* Minimalist Brand Statement */}
      <BrandStatement />

      {/* Final Closing Call To Action */}
      <FinalCta onExplore={scrollToEcosystem} />
    </main>
  );
};
