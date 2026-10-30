import React from 'react';
import { ArrowRight, Code, Smartphone, Layout, Cloud, CheckCircle, Briefcase } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { INITIAL_SERVICE_CATEGORIES } from '../../data/servicesCatalog';
import { Button } from '../common/Button';

export const TechServicesSection: React.FC = () => {
  const { navigate } = useRouter();

  // Top 4 core services
  const coreServices = INITIAL_SERVICE_CATEGORIES.slice(0, 4);

  const serviceImages: Record<string, string> = {
    'cat-web-development': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
    'cat-mobile-app-development': 'https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=800&auto=format&fit=crop',
    'cat-ui-ux-design': 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=800&auto=format&fit=crop',
    'cat-cloud-engineering': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
  };

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
            const imgUrl = serviceImages[service.id] || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop';

            return (
              <div
                key={service.id}
                onClick={() => navigate(`/services/category/${service.slug}`)}
                className="group rounded-3xl bg-[#F7F8FA] border border-[#E8EDF2] overflow-hidden hover:border-[#028BFA] transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between cursor-pointer"
              >
                {/* Visual Imagery */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={imgUrl}
                    alt={service.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 p-2 rounded-xl bg-white/95 text-[#0169FA] shadow-xs">
                    <Icon className="w-4 h-4" />
                  </div>
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
