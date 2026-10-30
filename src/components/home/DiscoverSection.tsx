import React from 'react';
import { ArrowRight, ShoppingBag, Briefcase, GraduationCap, TrendingUp } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { RoutePath } from '../../types';

interface DiscoverCardProps {
  title: string;
  description: string;
  image: string;
  actionText: string;
  path: RoutePath;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

export const DiscoverSection: React.FC = () => {
  const { navigate } = useRouter();

  const cards: DiscoverCardProps[] = [
    {
      title: 'Marketplace',
      description: 'Discover electronics, appliances, digital publications, and computing essentials verified for quality.',
      image: '/assets/images/marketplace_laptop_1790288896761.jpg',
      actionText: 'Browse Marketplace',
      path: '/marketplace',
      icon: ShoppingBag,
      accentColor: 'from-[#08B3F8] to-[#028BFA]',
    },
    {
      title: 'Tech & Digital Services',
      description: 'Connect with verified software engineers, UI/UX designers, and cloud architects for your project requirements.',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
      actionText: 'Explore Services',
      path: '/services',
      icon: Briefcase,
      accentColor: 'from-[#028BFA] to-[#0169FA]',
    },
    {
      title: 'Nexovira Academy',
      description: 'Build production-ready skills through project-driven courses, real curriculum, and guided scholarships.',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop',
      actionText: 'Browse Courses',
      path: '/academy',
      icon: GraduationCap,
      accentColor: 'from-[#0169FA] to-[#0148F2]',
    },
    {
      title: 'Digital Opportunities',
      description: 'Participate as an approved affiliate to promote eligible offers and earn transparent commissions.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
      actionText: 'Discover Opportunities',
      path: '/affiliate',
      icon: TrendingUp,
      accentColor: 'from-[#0148F2] to-[#032FC8]',
    },
  ];

  return (
    <section id="discover" className="py-16 sm:py-24 bg-[#F7F8FA] border-b border-[#E8EDF2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#0169FA] uppercase">
            Discover Nexovira
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14283F] tracking-tight">
            Four Connected Hubs. One Platform.
          </h2>
          <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
            Every section of Nexovira is designed to solve a real need — whether you are acquiring quality technology, hiring experienced talent, mastering engineering, or growing your income.
          </p>
        </div>

        {/* Four Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={() => navigate(card.path)}
                className="group rounded-3xl bg-white border border-[#E8EDF2] overflow-hidden hover:border-[#028BFA] transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between cursor-pointer"
              >
                {/* Top Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={card.image}
                    alt={card.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle Corner Icon Pill */}
                  <div className={`absolute top-3 left-3 p-2 rounded-xl bg-gradient-to-r ${card.accentColor} text-white shadow-md shadow-slate-900/10`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-lg text-[#14283F] group-hover:text-[#0169FA] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Clean Text Action */}
                  <div className="pt-2 border-t border-[#E8EDF2] flex items-center justify-between text-xs font-semibold text-[#0169FA] group-hover:text-[#0148F2]">
                    <span>{card.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
