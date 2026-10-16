import React from 'react';
import { ArrowRight, Code2, Layout, Cloud, Palette, Cpu, PenLine, Globe } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { useRouter } from '../../context/RouterContext';

export const TechServicesPreview: React.FC = () => {
  const { navigate } = useRouter();

  const services = [
    {
      title: 'Web Development',
      description: 'Modern full-stack architectures, high-performance web applications, and scalable API platforms.',
      icon: Code2,
    },
    {
      title: 'UI/UX Design',
      description: 'Product design systems, high-fidelity interactive interfaces, and accessibility-first user flows.',
      icon: Layout,
    },
    {
      title: 'Cloud Engineering',
      description: 'Reliable cloud infrastructure, container orchestration, CI/CD pipelines, and zero-downtime deployments.',
      icon: Cloud,
    },
    {
      title: 'Graphic Design',
      description: 'Vector brand assets, identity guidelines, digital typography, and publication systems.',
      icon: Palette,
    },
    {
      title: 'Prompt Engineering',
      description: 'System instruction optimization, fine-tuned generative workflows, and agentic task orchestration.',
      icon: Cpu,
    },
    {
      title: 'Writing & Blogging',
      description: 'Technical documentation, editorial content strategy, case studies, and brand narrative engineering.',
      icon: PenLine,
    },
    {
      title: 'Specialized Digital Expertise',
      description: 'Custom digital transformations, data engineering, performance audits, and bespoke solutions.',
      icon: Globe,
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#011B33]/50 border-b border-[#0682F4]/15 relative">
      <Container size="wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Vision & Narrative */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
              <span>Expertise & Solutions</span>
              <span aria-hidden="true">·</span>
              <span>Nexovira Services</span>
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              TURN IDEAS INTO SOLUTIONS
            </h2>

            <p className="text-base text-[#CCD2D9] leading-relaxed font-normal">
              Nexovira Tech & Services is architected to assemble dedicated technical
              and creative capability under one ecosystem. From system engineering to
              product design, ideas are transformed into production-grade reality.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/services')}
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/services/request')}
              >
                <span>Start a Project</span>
              </Button>
            </div>

            <div className="pt-4 border-t border-[#0682F4]/20">
              <span className="text-xs text-[#08E6F9] font-mono block">
                Guaranteed milestones, verified contractors, and platform escrow protection.
              </span>
            </div>
          </div>

          {/* Right Column: Service Disciplines Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <div
                  key={svc.title}
                  className={`p-6 rounded-xl bg-[#01213D] border border-[#0682F4]/20 hover:border-[#08E6F9]/50 transition-all duration-200 ${
                    idx === services.length - 1 ? 'sm:col-span-2' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#011629] border border-[#0682F4]/30 flex items-center justify-center text-[#08E6F9] mb-4">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-base text-white mb-2">
                    {svc.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#CCD2D9]/80 leading-relaxed">
                    {svc.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </Container>
    </section>
  );
};
