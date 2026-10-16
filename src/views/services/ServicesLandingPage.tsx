import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { CategoryIcon } from '../../components/services/CategoryIcon';
import {
  ArrowRight,
  Shield,
  CheckCircle2,
  Users,
  Briefcase,
  Star,
  Sparkles,
  Lock,
  Clock,
  Layers,
  Award,
} from 'lucide-react';

export const ServicesLandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { activeCategories, experts } = useServices();

  const workflowSteps = [
    {
      step: '01',
      title: 'Customer Scope',
      desc: 'Submit your requirements, technical needs, timeline, and budget parameters.',
      badge: 'CUSTOMER',
    },
    {
      step: '02',
      title: 'Nexovira Review',
      desc: 'Nexovira technical managers evaluate your requirements and scope architecture.',
      badge: 'NEXOVIRA',
    },
    {
      step: '03',
      title: 'Expert Matching',
      desc: 'We match and assign the optimal verified ecosystem specialist for your stack.',
      badge: 'ASSIGNMENT',
    },
    {
      step: '04',
      title: 'Milestone Execution',
      desc: 'Collaborate through centralized updates with transparent delivery tracking.',
      badge: 'DELIVERY',
    },
    {
      step: '05',
      title: 'Final Completion',
      desc: 'Production deployment, rigorous code sign-off, and verified asset handover.',
      badge: 'COMPLETION',
    },
  ];

  const valueProps = [
    {
      icon: Shield,
      title: 'Verified Technical Vetting',
      desc: 'Only the top 3% of software engineers, cloud architects, and digital professionals are accepted into Nexovira.',
    },
    {
      icon: Lock,
      title: 'Platform-Guaranteed Security',
      desc: 'Zero risky external arrangements. All project milestones, contracts, and IP protections remain guaranteed by Nexovira.',
    },
    {
      icon: Clock,
      title: 'Fast-Track Assignment',
      desc: 'Avoid weeks of generic job board interviewing. Get matched with pre-vetted specialists ready to execute immediately.',
    },
    {
      icon: Layers,
      title: 'Full Lifecycle Oversight',
      desc: 'Nexovira operations supervise scope fidelity, code quality standards, and milestone delivery from start to completion.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#01213D] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 border-b border-[#0682F4]/20">
        {/* Subtle background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#0682F4]/15 to-[#08E6F9]/10 blur-[130px] pointer-events-none rounded-full" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#08E6F9]/30 bg-[#08E6F9]/10 text-[#08E6F9] text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nexovira Tech & Digital Services</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase font-sans">
              Technology.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0682F4] via-[#08E6F9] to-cyan-200">
                Expertise.
              </span>{' '}
              Results.
            </h1>

            <p className="text-lg sm:text-2xl text-[#CCD2D9] max-w-3xl mx-auto font-normal leading-relaxed">
              Tell us what you need. Nexovira connects your project with the right expertise.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/services/request')}
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold shadow-lg shadow-[#0682F4]/30"
              >
                <span>Start a Project</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/services/experts')}
                className="w-full sm:w-auto px-8 py-3.5 text-base font-medium border-[#0682F4]/40 hover:border-[#08E6F9] hover:bg-[#0682F4]/10 text-white"
              >
                <Users className="w-5 h-5 mr-2 text-[#08E6F9]" />
                <span>Explore Experts</span>
              </Button>
            </div>

            {/* Micro guarantees */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#CCD2D9]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#08E6F9]" />
                <span>Rigorous Technical Vetting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#08E6F9]" />
                <span>Managed Escrow Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#08E6F9]" />
                <span>Zero Bypass Integrity</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works: The Nexovira Ecosystem Workflow */}
      <section className="py-20 lg:py-28 bg-[#011B33] border-b border-[#0682F4]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold tracking-widest text-[#08E6F9] uppercase">
              The Nexovira Advantage
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              How Managed Engagements Work
            </p>
            <p className="mt-4 text-[#CCD2D9]">
              Unlike uncurated freelance directories, Nexovira guarantees accountability, milestone tracking, and quality standards at every phase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {workflowSteps.map((s, idx) => (
              <div
                key={s.step}
                className="relative bg-[#01213D] border border-[#0682F4]/20 rounded-2xl p-6 flex flex-col justify-between hover:border-[#08E6F9]/50 transition-all shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-[#0682F4]/40 group-hover:text-[#08E6F9] transition-colors">
                      {s.step}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0682F4]/20 text-[#08E6F9] tracking-wider uppercase">
                      {s.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-xs text-[#CCD2D9] leading-relaxed">{s.desc}</p>
                </div>
                {idx < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-[#0682F4]/40">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Categories Section */}
      <section className="py-20 lg:py-28 border-b border-[#0682F4]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#08E6F9] uppercase">
                Expertise Categories
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
                Comprehensive Technology Capabilities
              </h2>
              <p className="mt-3 text-[#CCD2D9] max-w-2xl">
                Explore dedicated practice areas driven by verified specialists working under the Nexovira ecosystem.
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/services/request')}
              className="self-start md:self-auto shrink-0"
            >
              <span>Custom Request</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => navigate(`/services/${category.slug}`)}
                className="group bg-[#011B33] border border-[#0682F4]/25 hover:border-[#08E6F9] rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-[#0682F4]/10"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#0682F4]/15 border border-[#0682F4]/30 flex items-center justify-center text-[#08E6F9] mb-5 group-hover:scale-105 group-hover:bg-[#08E6F9]/20 transition-all">
                    <CategoryIcon name={category.icon} className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#08E6F9] transition-colors mb-2">
                    {category.name}
                  </h3>
                  <p className="text-xs text-[#CCD2D9] line-clamp-3 mb-4 leading-relaxed">
                    {category.description}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {category.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9]"
                      >
                        {skill}
                      </span>
                    ))}
                    {category.skills.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-[#08E6F9]">
                        +{category.skills.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-xs font-semibold text-[#08E6F9] group-hover:translate-x-1 transition-transform">
                    <span>Explore practice</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Experts Spotlight */}
      <section className="py-20 lg:py-28 bg-[#011B33] border-b border-[#0682F4]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#08E6F9] uppercase">
                Verified Talent
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
                Featured Ecosystem Experts
              </h2>
              <p className="mt-3 text-[#CCD2D9] max-w-2xl">
                Professionals and contractors verified by Nexovira management. All engagements are routed and guaranteed through Nexovira.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/services/experts')}
              className="self-start md:self-auto shrink-0"
            >
              <Users className="w-4 h-4 mr-2" />
              <span>Browse All Experts</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.slice(0, 6).map((expert) => (
              <div
                key={expert.expertId}
                className="bg-[#01213D] border border-[#0682F4]/25 rounded-2xl p-6 flex flex-col justify-between hover:border-[#08E6F9]/60 transition-all shadow-md group"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={expert.profileImage}
                      alt={expert.fullName}
                      className="w-16 h-16 rounded-xl object-cover border border-[#0682F4]/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-white text-base truncate">
                          {expert.fullName}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#08E6F9] bg-[#08E6F9]/10 px-2 py-0.5 rounded-full border border-[#08E6F9]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      </div>
                      <p className="text-xs text-[#0682F4] font-medium truncate mt-0.5">
                        {expert.professionalTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#CCD2D9]">
                        <span>{expert.location}</span>
                        <span>•</span>
                        <span>{expert.yearsOfExperience} yrs exp</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#CCD2D9] line-clamp-3 mb-4 leading-relaxed">
                    {expert.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {expert.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#011B33] border border-[#0682F4]/20 text-[#CCD2D9]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#0682F4]/20 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold">{expert.rating || 5.0}</span>
                    <span className="text-[#CCD2D9] text-[10px]">
                      ({expert.completedProjectsCount || 20}+ projects)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/services/experts/${expert.expertId}`)}
                      className="text-xs font-semibold text-[#08E6F9] hover:underline"
                    >
                      Profile
                    </button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/services/request?expertId=${expert.expertId}`)}
                      className="text-xs h-8 px-3"
                    >
                      Request
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Nexovira Over Direct Hiring */}
      <section className="py-20 lg:py-28 border-b border-[#0682F4]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-[#08E6F9] uppercase">
              Enterprise Trust
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Why Nexovira Managed Services?
            </h2>
            <p className="mt-4 text-[#CCD2D9]">
              Engineered to eliminate the uncertainty, scope creep, and risk of freelance directories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valueProps.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 relative hover:border-[#08E6F9]/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0682F4]/20 border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9] mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{v.title}</h3>
                  <p className="text-xs text-[#CCD2D9] leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 bg-gradient-to-b from-[#011B33] to-[#01213D]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-[#01213D] via-[#012A4E] to-[#01213D] border border-[#08E6F9]/40 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                Ready to execute your next milestone?
              </h2>
              <p className="text-sm sm:text-base text-[#CCD2D9] leading-relaxed">
                Connect your business with verified professionals working under the Nexovira ecosystem. Tell us your requirements today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/services/request')}
                  className="w-full sm:w-auto px-8 py-3 font-semibold"
                >
                  <span>Start a Project</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/services/apply-expert')}
                  className="w-full sm:w-auto px-8 py-3 text-white border-[#0682F4]/40 hover:border-[#08E6F9]"
                >
                  <Award className="w-4 h-4 mr-2 text-[#08E6F9]" />
                  <span>Apply as an Expert</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
