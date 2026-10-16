import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { PublicExpert } from '../../types/services';
import { ReviewsSection } from '../../components/reviews/ReviewsSection';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Star,
  MapPin,
  Languages,
  Clock,
  Briefcase,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ExpertProfilePageProps {
  slugOrId: string;
}

export const ExpertProfilePage: React.FC<ExpertProfilePageProps> = ({ slugOrId }) => {
  const { navigate } = useRouter();
  const { getExpertBySlugOrId, activeCategories } = useServices();

  const [expert, setExpert] = useState<PublicExpert | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    getExpertBySlugOrId(slugOrId).then((res) => {
      if (mounted) {
        setExpert(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [slugOrId, getExpertBySlugOrId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#08E6F9]" />
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl font-black text-white">Expert Profile Not Found</h1>
          <p className="text-[#CCD2D9]">
            The requested expert profile is not available or is currently not set to public directory listing.
          </p>
          <Button variant="primary" onClick={() => navigate('/services/experts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Return to Experts Directory</span>
          </Button>
        </div>
      </div>
    );
  }

  const availabilityBadge = {
    AVAILABLE: { label: 'Available for New Projects', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    LIMITED: { label: 'Limited Bandwidth', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    UNAVAILABLE: { label: 'Currently Booked', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' },
  }[expert.availabilityStatus] || { label: expert.availabilityStatus, color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/services/experts')}
            className="inline-flex items-center text-xs font-medium text-[#08E6F9] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to All Experts</span>
          </button>
        </div>

        {/* Profile Header Hero Card */}
        <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-3xl p-6 sm:p-10 shadow-2xl mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <img
                src={expert.profileImage}
                alt={expert.fullName}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-[#08E6F9]/40 shadow-xl shrink-0"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-4xl font-black text-white">
                    {expert.fullName}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#08E6F9] bg-[#08E6F9]/10 px-3 py-1 rounded-full border border-[#08E6F9]/40">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Nexovira Expert</span>
                  </span>
                </div>

                <p className="text-sm sm:text-base text-[#0682F4] font-semibold">
                  {expert.professionalTitle}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#CCD2D9] pt-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#08E6F9]" />
                    <span>{expert.location}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#08E6F9]" />
                    <span>{expert.yearsOfExperience} Years Experience</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-[#08E6F9]" />
                    <span>{expert.languages.join(', ')}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Block */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${availabilityBadge.color}`}>
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                <span>{availabilityBadge.label}</span>
              </span>

              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/services/request?expertId=${expert.expertId}`)}
                className="w-full sm:w-auto px-8 shadow-lg shadow-[#0682F4]/30"
              >
                <span>Start a Project</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Two-Column Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Biography */}
            <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#08E6F9]" />
                <span>Professional Biography</span>
              </h2>
              <p className="text-sm text-[#CCD2D9] leading-relaxed whitespace-pre-line">
                {expert.bio}
              </p>
            </div>

            {/* Portfolio Case Studies */}
            <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 sm:p-8 space-y-5">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#08E6F9]" />
                <span>Verified Portfolio Case Studies</span>
              </h2>

              {expert.portfolioLinks.length === 0 ? (
                <p className="text-xs text-[#CCD2D9]">No external links specified.</p>
              ) : (
                <div className="space-y-4">
                  {expert.portfolioLinks.map((p, idx) => (
                    <div
                      key={idx}
                      className="bg-[#01213D] border border-[#0682F4]/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#08E6F9]/40 transition-colors"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-white">{p.title}</h3>
                        {p.description && (
                          <p className="text-xs text-[#CCD2D9] mt-1">{p.description}</p>
                        )}
                      </div>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-semibold text-[#08E6F9] hover:underline shrink-0"
                      >
                        <span>View Work</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Core Competencies & Skills */}
            <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#08E6F9]" />
                <span>Validated Skills</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {expert.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-xs font-medium text-white shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Nexovira Platform Assurance */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#08E6F9]">
                <Shield className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Nexovira Managed Engagement</h3>
              </div>

              <p className="text-xs text-[#CCD2D9] leading-relaxed">
                When you initiate a project with this expert, your request is reviewed and confirmed by Nexovira technical management.
              </p>

              <ul className="space-y-2.5 text-xs text-[#CCD2D9] pt-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>Platform escrow & milestone verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>Comprehensive intellectual property security</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>No independent direct payments or external bypass</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-[#0682F4]/20">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate(`/services/request?expertId=${expert.expertId}`)}
                >
                  <span>Request Project Match</span>
                </Button>
              </div>
            </div>

            {/* Practice Areas Covered */}
            <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#CCD2D9]">
                Specialized Practice Areas
              </h3>

              <div className="space-y-2">
                {expert.serviceCategories.map((slug) => {
                  const cat = activeCategories.find((c) => c.slug === slug || c.id === slug);
                  return (
                    <button
                      key={slug}
                      onClick={() => navigate(`/services/${slug}`)}
                      className="w-full text-left p-2.5 rounded-lg bg-[#01213D] border border-[#0682F4]/20 hover:border-[#08E6F9] transition-colors flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <span className="font-medium text-white group-hover:text-[#08E6F9]">
                        {cat?.name || slug}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#08E6F9] opacity-70" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Client Reviews & Verified Experiences Section */}
        <ReviewsSection
          entityType="EXPERT"
          entityId={expert.expertId}
          entityTitle={expert.fullName}
          expertId={expert.expertId}
          className="mt-12"
        />
      </div>
    </div>
  );
};
