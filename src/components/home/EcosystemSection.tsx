import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Cpu, ShoppingBag, Terminal, GraduationCap, FileCode, Users } from 'lucide-react';
import { Container } from '../common/Container';
import { useRouter } from '../../context/RouterContext';
import { EcosystemPillar } from '../../types';

export const EcosystemSection: React.FC = () => {
  const { navigate } = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const pillars: (EcosystemPillar & { icon: React.FC<{ className?: string }> })[] = [
    {
      number: '01',
      title: 'AI Ecosystem',
      tagline: 'Intelligent Interfaces',
      description: 'Intelligent experiences designed to help users explore, create and solve.',
      route: '/ai',
      icon: Cpu,
      capabilities: ['Contextual Discovery', 'Workflow Reasoning', 'Autonomous Assistants'],
    },
    {
      number: '02',
      title: 'Marketplace',
      tagline: 'Hardware & Devices',
      description: 'Appliances, electronics and technology products.',
      route: '/marketplace',
      icon: ShoppingBag,
      capabilities: ['Next-Gen Consumer Tech', 'Smart Home Infrastructure', 'Verified Hardware'],
    },
    {
      number: '03',
      title: 'Tech & Services',
      tagline: 'Professional Execution',
      description: 'Technology and digital expertise for projects, solutions and professional services.',
      route: '/services',
      icon: Terminal,
      capabilities: ['Full-Stack Engineering', 'UI/UX System Design', 'Cloud Architecture'],
    },
    {
      number: '04',
      title: 'Academy',
      tagline: 'Applied Education',
      description: 'Courses, learning experiences and future scholarship opportunities.',
      route: '/academy',
      icon: GraduationCap,
      capabilities: ['Technical Masteries', 'Hands-on Labs', 'Scholarship Pathways'],
    },
    {
      number: '05',
      title: 'Digital Products',
      tagline: 'Engineered Assets',
      description: 'Digital resources, publications and downloadable products.',
      route: '/digital-products',
      icon: FileCode,
      capabilities: ['Architecture Blueprints', 'Design Systems', 'Technical Publications'],
    },
    {
      number: '06',
      title: 'Affiliate',
      tagline: 'Collaborative Growth',
      description: 'A future platform for partnerships and referral opportunities.',
      route: '/services',
      icon: Users,
      capabilities: ['Ecosystem Referrals', 'Partner Networks', 'Shared Value Distribution'],
    },
  ];

  // Motion variants with respect for prefers-reduced-motion
  const containerVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.45,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <section id="ecosystem" className="py-20 sm:py-28 bg-[#01213D] border-b border-[#0682F4]/15 relative">
      <Container size="wide">
        <div className="max-w-3xl mb-14 sm:mb-20 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
            <span>Modular Core</span>
            <span aria-hidden="true">·</span>
            <span>Six Disciplines</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            EXPLORE THE NEXOVIRA ECOSYSTEM
          </h2>

          <p className="text-base sm:text-lg text-[#CCD2D9] max-w-2xl font-normal leading-relaxed">
            One platform. Multiple possibilities. Built to evolve with the way
            people learn, work, create, discover and access technology.
          </p>
        </div>

        {/* 6 Premium Ecosystem Cards Grid with Framer Motion entrance */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.number}
                variants={cardVariants}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : { y: -4, transition: { duration: 0.2, ease: 'easeOut' } }
                }
                onClick={() => navigate(pillar.route)}
                className="group relative bg-[#011B33]/80 border border-[#0682F4]/20 hover:border-[#08E6F9]/60 rounded-xl p-6 sm:p-8 flex flex-col justify-between transition-colors duration-300 hover:shadow-xl hover:shadow-[#0682F4]/10 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(pillar.route);
                  }
                }}
              >
                <div>
                  {/* Top Line: Tabular Editorial Number + Icon */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#0682F4]/15">
                    <span className="font-mono text-2xl font-bold tracking-tight text-[#08E6F9] tabular-nums">
                      {pillar.number}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-center text-[#08E6F9] group-hover:border-[#08E6F9] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <div className="space-y-1.5 mb-3">
                    <span className="text-xs font-semibold tracking-wider uppercase text-[#0682F4] group-hover:text-[#4DDEEA] transition-colors">
                      {pillar.tagline}
                    </span>
                    <h3 className="font-display font-bold text-xl text-white tracking-wide group-hover:text-[#08E6F9] transition-colors">
                      {pillar.title}
                    </h3>
                  </div>

                  {/* Core Description */}
                  <p className="text-sm text-[#CCD2D9]/80 leading-relaxed font-normal mb-6">
                    {pillar.description}
                  </p>
                </div>

                {/* Capabilities Metadata List (Clean unboxed text with bullets) */}
                <div className="pt-4 border-t border-[#0682F4]/15 space-y-3">
                  <div className="text-[11px] font-mono tracking-wider uppercase text-[#CCD2D9]/50">
                    Capabilities Preview
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#CCD2D9]/90 font-medium">
                    {pillar.capabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#08E6F9]" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Exploration Link */}
                  <div className="pt-3 flex items-center justify-between text-xs font-semibold text-[#08E6F9] group-hover:text-[#7CF9FD] transition-colors">
                    <span>Preview Area</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
};
