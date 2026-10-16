import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { CategoryIcon } from '../../components/services/CategoryIcon';
import { ReviewsSection } from '../../components/reviews/ReviewsSection';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Users,
  Star,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';

interface ServiceCategoryPageProps {
  categorySlug: string;
}

export const ServiceCategoryPage: React.FC<ServiceCategoryPageProps> = ({ categorySlug }) => {
  const { navigate } = useRouter();
  const { getCategoryBySlug, experts, activeCategories } = useServices();

  const category = getCategoryBySlug(categorySlug);

  // If category is not found or inactive, show friendly fallback
  if (!category || !category.isActive) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0682F4]/20 border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9]">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white">Category Not Found</h1>
          <p className="text-[#CCD2D9]">
            The requested service practice area does not exist or is currently inactive.
          </p>
          <Button variant="primary" onClick={() => navigate('/services')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Return to Services Overview</span>
          </Button>
        </div>
      </div>
    );
  }

  // Filter experts specializing in this category
  const relevantExperts = experts.filter((e) =>
    e.serviceCategories.some(
      (c) => c.toLowerCase() === category.slug.toLowerCase() || c.toLowerCase() === category.id.toLowerCase()
    )
  );

  return (
    <div className="min-h-screen bg-[#01213D] text-white">
      {/* Category Hero Banner */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-[#0682F4]/20 bg-gradient-to-b from-[#011B33] to-[#01213D]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb / Back */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/services')}
              className="inline-flex items-center text-xs font-medium text-[#08E6F9] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to All Practice Areas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#08E6F9]/30 bg-[#08E6F9]/10 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nexovira Specialized Practice</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0682F4]/20 border border-[#08E6F9]/40 flex items-center justify-center text-[#08E6F9] shrink-0">
                  <CategoryIcon name={category.icon} className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    {category.name}
                  </h1>
                  <span className="text-xs text-[#08E6F9] font-medium tracking-wide">
                    Vetted Ecosystem Engineering
                  </span>
                </div>
              </div>

              <p className="text-base sm:text-lg text-[#CCD2D9] max-w-3xl leading-relaxed">
                {category.description}
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(`/services/request?category=${category.slug}`)}
                  className="px-8 font-semibold shadow-lg shadow-[#0682F4]/30"
                >
                  <span>Start a {category.name} Project</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/services/experts')}
                  className="border-[#0682F4]/40 hover:border-[#08E6F9] text-white"
                >
                  <Users className="w-4 h-4 mr-2 text-[#08E6F9]" />
                  <span>Browse Category Experts</span>
                </Button>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="lg:col-span-4 bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-5 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#08E6F9]" />
                <span>Practice Standards</span>
              </h3>

              <ul className="space-y-3 text-xs text-[#CCD2D9]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>Pre-screened technical competence & commercial experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>Managed milestone tracking via Nexovira Operations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>Intellectual property assignment & NDA guaranteed</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>Direct accountability with zero freelancer bypass</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-[#0682F4]/20">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => navigate(`/services/request?category=${category.slug}`)}
                >
                  <span>Request Scope Review</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Expertise & Skills Covered */}
      <section className="py-16 border-b border-[#0682F4]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#08E6F9]">
              Capabilities
            </h2>
            <p className="mt-1 text-2xl font-extrabold text-white">
              Core Competencies & Technologies
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {category.skills.map((skill) => (
              <div
                key={skill}
                className="px-4 py-2 rounded-xl bg-[#011B33] border border-[#0682F4]/30 text-sm font-medium text-white flex items-center gap-2 shadow-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#08E6F9]" />
                <span>{skill}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Relevant Expert Profiles for this Category */}
      <section className="py-20 bg-[#011B33] border-b border-[#0682F4]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#08E6F9] uppercase">
                Vetted Specialists
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
                Experts in {category.name}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#CCD2D9]">
                Specialists vetted and managed under the Nexovira ecosystem.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/services/experts')}
            >
              <span>Explore All Experts</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {relevantExperts.length === 0 ? (
            <div className="bg-[#01213D] border border-[#0682F4]/20 rounded-2xl p-8 text-center space-y-4">
              <Users className="w-10 h-10 text-[#08E6F9] mx-auto opacity-70" />
              <h3 className="text-lg font-bold text-white">
                Vetting Additional Specialists in {category.name}
              </h3>
              <p className="text-xs text-[#CCD2D9] max-w-md mx-auto">
                Nexovira technical managers are continuously matching new projects with verified contractors. You can still submit your request.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate(`/services/request?category=${category.slug}`)}
              >
                <span>Submit {category.name} Request</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relevantExperts.map((expert) => (
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
                        ({expert.completedProjectsCount || 18}+)
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
                        onClick={() => navigate(`/services/request?category=${category.slug}&expertId=${expert.expertId}`)}
                        className="text-xs h-8 px-3"
                      >
                        Request
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Verified Client Reviews for this Service Category */}
          <div className="mt-16 pt-12 border-t border-[#0682F4]/20">
            <ReviewsSection
              entityType="SERVICE"
              entityId={category.slug}
              entityTitle={category.name}
            />
          </div>
        </div>
      </section>

      {/* Explore Other Categories */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#CCD2D9] mb-6">
            Other Technology Practice Areas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {activeCategories
              .filter((c) => c.id !== category.id)
              .slice(0, 6)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/services/${c.slug}`)}
                  className="bg-[#011B33] border border-[#0682F4]/20 hover:border-[#08E6F9] p-3 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-[#08E6F9] truncate">
                    {c.name}
                  </p>
                  <p className="text-[10px] text-[#CCD2D9] truncate mt-1">Explore</p>
                </button>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};
