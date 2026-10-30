import React from 'react';
import { Hero } from '../components/home/Hero';
import { DiscoverSection } from '../components/home/DiscoverSection';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { FeaturedMarketplaceSection } from '../components/home/FeaturedMarketplaceSection';
import { TechServicesSection } from '../components/home/TechServicesSection';
import { AcademySection } from '../components/home/AcademySection';
import { AffiliateSection } from '../components/home/AffiliateSection';
import { FinalCtaSection } from '../components/home/FinalCtaSection';
import { useRouter } from '../context/RouterContext';

interface HomePageProps {
  onOpenGetStarted?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenGetStarted }) => {
  const { navigate } = useRouter();

  const scrollToDiscover = () => {
    const el = document.getElementById('discover');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/marketplace');
    }
  };

  const handleGetStarted = onOpenGetStarted || (() => navigate('/register'));

  return (
    <main className="w-full">
      {/* SECTION B — HERO */}
      <Hero
        onExplore={scrollToDiscover}
        onGetStarted={handleGetStarted}
      />

      {/* SECTION C — DISCOVER NEXOVIRA */}
      <DiscoverSection />

      {/* SECTION D — HOW NEXOVIRA WORKS */}
      <HowItWorksSection />

      {/* SECTION E — FEATURED MARKETPLACE */}
      <FeaturedMarketplaceSection />

      {/* SECTION F — TECH & DIGITAL SERVICES */}
      <TechServicesSection />

      {/* SECTION G — NEXOVIRA ACADEMY */}
      <AcademySection />

      {/* SECTION H — AFFILIATE OPPORTUNITY */}
      <AffiliateSection />

      {/* SECTION I — FINAL CALL TO ACTION */}
      <FinalCtaSection onGetStarted={handleGetStarted} />
    </main>
  );
};
