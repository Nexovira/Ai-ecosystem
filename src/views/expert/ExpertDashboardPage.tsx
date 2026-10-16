import React, { useEffect, useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { ProjectStatusBadge } from '../../components/services/ProjectStatusBadge';
import { ExpertAvailability } from '../../types/services';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  ChevronRight,
  UserCheck,
  Award,
  Shield,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const ExpertDashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const {
    expertProfile,
    loadingExpertProfile,
    fetchMyExpertProfile,
    expertProjects,
    loadingExpertProjects,
    fetchExpertProjects,
    saveMyExpertProfile,
  } = useServices();

  const [togglingAvailability, setTogglingAvailability] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyExpertProfile();
      fetchExpertProjects();
    }
  }, [user, fetchMyExpertProfile, fetchExpertProjects]);

  // Role Guard
  const isExpertRole = ['EXPERT', 'ADMIN', 'SUPER_ADMIN'].includes(profile?.role || '');

  if (!user) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <Briefcase className="w-12 h-12 text-[#08E6F9] mx-auto" />
          <h1 className="text-2xl font-bold">Sign In Required</h1>
          <p className="text-xs text-[#CCD2D9]">
            Please sign in with your expert credentials to access your console.
          </p>
          <Button variant="primary" onClick={() => navigate('/signin')}>
            <span>Sign In</span>
          </Button>
        </div>
      </div>
    );
  }

  if (!isExpertRole) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Expert Account Required</h1>
          <p className="text-xs text-[#CCD2D9] leading-relaxed">
            Your current account role is <strong className="text-white">{profile?.role || 'CUSTOMER'}</strong>. To access the expert console, you must be accepted as an authorized contractor under the Nexovira ecosystem.
          </p>
          <div className="pt-2 flex flex-col gap-3">
            <Button variant="primary" onClick={() => navigate('/services/apply-expert')}>
              <span>Apply to Join as an Expert</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/services')}>
              <span>Explore Tech & Digital Services</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleAvailabilityChange = async (newStatus: ExpertAvailability) => {
    try {
      setTogglingAvailability(true);
      await saveMyExpertProfile({ availabilityStatus: newStatus });
    } finally {
      setTogglingAvailability(false);
    }
  };

  // Status breakdowns
  const newAssignments = expertProjects.filter((p) => p.status === 'ASSIGNED');
  const activeProjects = expertProjects.filter((p) => ['ACCEPTED', 'IN_PROGRESS', 'AWAITING_CUSTOMER'].includes(p.status));
  const completedProjects = expertProjects.filter((p) => p.status === 'COMPLETED');

  const verificationBadge = {
    VERIFIED: { label: 'Verified Ecosystem Expert', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    PENDING: { label: 'Verification Under Review', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    REJECTED: { label: 'Application Declined', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    SUSPENDED: { label: 'Account Suspended', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' },
  }[expertProfile?.verificationStatus || 'PENDING'];

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-[#0682F4]/20 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold tracking-widest text-[#08E6F9] uppercase">
                Expert Console
              </span>
              <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${verificationBadge.color}`}>
                {verificationBadge.label}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Welcome back, {expertProfile?.fullName || profile?.fullName || 'Specialist'}
            </h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">
              Manage your assigned engagements, milestone status, and public visibility.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/expert/onboarding')}
              className="text-xs border-[#0682F4]/40 hover:border-[#08E6F9]"
            >
              <span>Edit Professional Profile</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/expert/projects')}
              className="text-xs shadow-lg shadow-[#0682F4]/20"
            >
              <Briefcase className="w-4 h-4 mr-1.5" />
              <span>All Projects ({expertProjects.length})</span>
            </Button>
          </div>
        </div>

        {/* Availability Toggle Box */}
        <div className="my-8 bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#08E6F9]" />
              <span>Contracting Availability</span>
            </h2>
            <p className="text-xs text-[#CCD2D9]">
              Controls whether Nexovira management prioritizes your profile for incoming customer assignments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['AVAILABLE', 'LIMITED', 'UNAVAILABLE'] as ExpertAvailability[]).map((st) => (
              <button
                key={st}
                disabled={togglingAvailability}
                onClick={() => handleAvailabilityChange(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  (expertProfile?.availabilityStatus || 'AVAILABLE') === st
                    ? st === 'AVAILABLE'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : st === 'LIMITED'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-zinc-600 text-white shadow-md'
                    : 'bg-[#01213D] border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white'
                }`}
              >
                {st === 'AVAILABLE' ? 'Available' : st === 'LIMITED' ? 'Limited' : 'Unavailable'}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#011B33] border border-[#0682F4]/25 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#CCD2D9] uppercase tracking-wider">
                New Assignments
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{newAssignments.length}</p>
            <p className="text-xs text-[#CCD2D9] mt-2">Awaiting your scope acceptance</p>
          </div>

          <div className="bg-[#011B33] border border-[#0682F4]/25 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#CCD2D9] uppercase tracking-wider">
                Active Projects
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <PlayCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-[#08E6F9]">{activeProjects.length}</p>
            <p className="text-xs text-[#CCD2D9] mt-2">Currently in progress or review</p>
          </div>

          <div className="bg-[#011B33] border border-[#0682F4]/25 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#CCD2D9] uppercase tracking-wider">
                Completed
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-400">{completedProjects.length}</p>
            <p className="text-xs text-[#CCD2D9] mt-2">Delivered & verified deliverables</p>
          </div>
        </div>

        {/* Assigned Projects Section */}
        <div className="bg-[#011B33] border border-[#0682F4]/25 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
            <div>
              <h2 className="text-lg font-bold text-white">Assigned Engagements</h2>
              <p className="text-xs text-[#CCD2D9] mt-0.5">
                Projects assigned to you by Nexovira management.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/expert/projects')}
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {loadingExpertProjects ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08E6F9] mx-auto" />
              <p className="text-xs text-[#CCD2D9] mt-3">Loading projects...</p>
            </div>
          ) : expertProjects.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Briefcase className="w-10 h-10 text-[#08E6F9] mx-auto opacity-70" />
              <h3 className="text-base font-bold text-white">No Assigned Projects Currently</h3>
              <p className="text-xs text-[#CCD2D9] max-w-sm mx-auto">
                When Nexovira management matches a client project request to your skill set, it will appear here for your review and kickoff.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {expertProjects.slice(0, 5).map((project) => (
                <div
                  key={project.requestId}
                  onClick={() => navigate(`/expert/projects/${project.requestId}`)}
                  className="bg-[#01213D] border border-[#0682F4]/20 hover:border-[#08E6F9] rounded-2xl p-5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#08E6F9] bg-[#08E6F9]/10 px-2.5 py-0.5 rounded border border-[#08E6F9]/30">
                        {project.requestReference}
                      </span>
                      <span className="text-xs text-[#CCD2D9]">
                        {project.categoryName}
                      </span>
                      <ProjectStatusBadge status={project.status} size="sm" />
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-[#08E6F9] transition-colors">
                      {project.projectTitle}
                    </h3>

                    <p className="text-xs text-[#CCD2D9] line-clamp-1">
                      {project.description}
                    </p>

                    <div className="text-[11px] text-[#CCD2D9] flex items-center gap-3 pt-1">
                      <span>Client: {project.customerName}</span>
                      <span>•</span>
                      <span>Timeline: {project.preferredTimeline}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-[#08E6F9] shrink-0">
                    <span>Manage</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
