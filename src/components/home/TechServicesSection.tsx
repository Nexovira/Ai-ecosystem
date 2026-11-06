import React from 'react';
import { ArrowRight, Code, Smartphone, Layout, Cloud, CheckCircle, Briefcase } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../common/Button';

export const TechServicesSection: React.FC = () => {
  const { navigate } = useRouter();
  const { activeCategories, loadingCategories } = useServices();

  // Top 4 core services from authoritative Firestore state
  const coreServices = activeCategories.slice(0, 4);

  if (!loadingCategories && coreServices.length === 0) {
    return null; // Clean empty state: do not display if no categories configured
  }

  const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'cat-web-development': Code,
    'cat-mobile-app-development': Smartphone,
    'cat-ui-ux-design': Layout,
    'cat-cloud-engineering': Cloud,
  };

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-[#E8EDF2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 sm:mb-16">
          <div className="space-y-2">
            <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#0169FA] uppercase">
              Vetted Professional Talent
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14283F] tracking-tight">
              Tech &amp; Digital Services
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280] max-w-xl">
              From web platforms to cloud infrastructure, hire proven engineers and creative designers with milestone-governed escrow.
            </p>
          </div>

          <button
            onClick={() => navigate('/services')}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0169FA] hover:text-[#0148F2] transition-colors cursor-pointer self-start sm:self-auto shrink-0 group"
          >
            <span>Explore All Services</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreServices.map((service) => {
            const Icon = serviceIcons[service.id] || Code;

            return (
              <div
                key={service.id}
                onClick={() => navigate(`/services/category/${service.slug}`)}
                className="group rounded-3xl bg-[#F7F8FA] border border-[#E8EDF2] overflow-hidden hover:border-[#028BFA] transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between cursor-pointer"
              >
                {/* Visual Header - Icon and Geometric Accent (No Images) */}
                <div className="p-6 pb-2 flex items-center justify-between">
                  <div className="p-3.5 rounded-2xl bg-[#011B33] text-[#08E6F9] border border-[#0682F4]/30 shadow-md group-hover:bg-[#0682F4] group-hover:text-white transition-colors duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#0169FA] bg-[#028BFA]/10 px-2.5 py-1 rounded-full">
                    Specialty
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-base text-[#14283F] group-hover:text-[#0169FA] transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-[#6B7280] line-clamp-3 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Skills tags list (clean inline unboxed text) */}
                  <div className="pt-2 border-t border-[#E8EDF2] flex flex-wrap gap-1 text-[11px] text-[#6B7280]">
                    {service.skills.slice(0, 3).map((skill, idx) => (
                      <React.Fragment key={skill}>
                        <span>{skill}</span>
                        {idx < 2 && <span aria-hidden="true">·</span>}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Request Project CTA */}
                  <div className="flex items-center justify-between text-xs font-semibold text-[#0169FA] group-hover:text-[#0148F2]">
                    <span>Request Project</span>
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
