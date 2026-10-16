import React, { useEffect, useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { ProjectStatusBadge } from '../../components/services/ProjectStatusBadge';
import {
  ArrowLeft,
  Briefcase,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';

export const ExpertProjectsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const { expertProjects, loadingExpertProjects, fetchExpertProjects } = useServices();

  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    if (user) {
      fetchExpertProjects();
    }
  }, [user, fetchExpertProjects]);

  const isExpertRole = ['EXPERT', 'ADMIN', 'SUPER_ADMIN'].includes(profile?.role || '');

  if (!user || !isExpertRole) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white py-24 px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Expert Authentication Required</h1>
        <Button variant="primary" onClick={() => navigate('/signin')}>
          <span>Sign In</span>
        </Button>
      </div>
    );
  }

  const filteredProjects = expertProjects.filter((p) => {
    if (filterStatus === 'ALL') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/expert/dashboard')}
            className="inline-flex items-center text-xs font-medium text-[#08E6F9] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Expert Console</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-[#0682F4]/20 gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#08E6F9] uppercase">
              Assigned Work
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              My Contract Engagements
            </h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">
              Review assigned client briefs, advance development milestones, and communicate with clients.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="my-6 flex flex-wrap items-center gap-2 text-xs">
          {['ALL', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_CUSTOMER', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#0682F4] text-white font-bold shadow-md'
                  : 'bg-[#011B33] border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All Engagements' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Projects List */}
        {loadingExpertProjects ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08E6F9] mx-auto" />
            <p className="text-xs text-[#CCD2D9] mt-3">Loading assigned projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto my-8">
            <Briefcase className="w-12 h-12 text-[#08E6F9] mx-auto opacity-70" />
            <h2 className="text-lg font-bold text-white">No Matching Engagements</h2>
            <p className="text-xs text-[#CCD2D9]">
              There are currently no assigned projects matching this filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div
                key={project.requestId}
                onClick={() => navigate(`/expert/projects/${project.requestId}`)}
                className="bg-[#011B33] border border-[#0682F4]/25 hover:border-[#08E6F9] rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-5 group shadow-md"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#08E6F9] bg-[#08E6F9]/10 px-2.5 py-0.5 rounded border border-[#08E6F9]/30">
                      {project.requestReference}
                    </span>
                    <span className="text-xs text-[#CCD2D9] px-2 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/20">
                      {project.categoryName}
                    </span>
                    <ProjectStatusBadge status={project.status} size="sm" />
                  </div>

                  <h2 className="text-lg font-bold text-white group-hover:text-[#08E6F9] transition-colors">
                    {project.projectTitle}
                  </h2>

                  <p className="text-xs text-[#CCD2D9] line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#CCD2D9] pt-1">
                    <span>Client: <strong className="text-white">{project.customerName}</strong></span>
                    <span>•</span>
                    <span>Timeline: {project.preferredTimeline}</span>
                    <span>•</span>
                    <span>Assigned: {project.assignedAt ? new Date(project.assignedAt).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#0682F4]/20">
                  <div className="flex items-center gap-1 text-xs font-bold text-[#08E6F9] group-hover:translate-x-1 transition-transform">
                    <span>Manage Engagement</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
