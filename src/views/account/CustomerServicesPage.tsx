import React, { useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { ProjectStatusBadge } from '../../components/services/ProjectStatusBadge';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Briefcase,
  Clock,
  UserCheck,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const CustomerServicesPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { customerRequests, loadingCustomerRequests, fetchCustomerRequests } = useServices();

  useEffect(() => {
    if (user) {
      fetchCustomerRequests();
    }
  }, [user, fetchCustomerRequests]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <Briefcase className="w-12 h-12 text-[#08E6F9] mx-auto" />
          <h1 className="text-2xl font-bold">Sign In Required</h1>
          <p className="text-xs text-[#CCD2D9]">
            Please sign in to view your Nexovira project requests and managed deliverables.
          </p>
          <Button variant="primary" onClick={() => navigate('/signin')}>
            <span>Sign In</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/account')}
            className="inline-flex items-center text-xs font-medium text-[#08E6F9] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to My Account</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-[#0682F4]/20 gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#08E6F9] uppercase">
              Client Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              My Technology Projects
            </h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">
              Track project reviews, assigned ecosystem experts, and milestone deliveries.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/services/request')}
            className="self-start sm:self-auto shrink-0 shadow-lg shadow-[#0682F4]/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Start a New Project</span>
          </Button>
        </div>

        {/* Project Requests List */}
        <div className="mt-8">
          {loadingCustomerRequests ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08E6F9] mx-auto" />
              <p className="text-xs text-[#CCD2D9] mt-3">Loading your project requests...</p>
            </div>
          ) : customerRequests.length === 0 ? (
            <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-3xl p-12 text-center space-y-4 max-w-2xl mx-auto my-8 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-[#0682F4]/20 border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9] mx-auto">
                <Briefcase className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">No Active Service Projects</h2>
              <p className="text-xs text-[#CCD2D9] leading-relaxed">
                You haven&apos;t submitted any project requests yet. Tell us about your technical requirements and get matched with verified specialists under the Nexovira ecosystem.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={() => navigate('/services/request')}
                  className="px-6"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Start Your First Project</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {customerRequests.map((req) => (
                <div
                  key={req.requestId}
                  onClick={() => navigate(`/account/services/${req.requestId}`)}
                  className="bg-[#011B33] border border-[#0682F4]/25 hover:border-[#08E6F9] rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-5 group shadow-md hover:shadow-xl hover:shadow-[#0682F4]/10"
                >
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-[#08E6F9] bg-[#08E6F9]/10 px-2.5 py-0.5 rounded border border-[#08E6F9]/30">
                        {req.requestReference}
                      </span>
                      <span className="text-xs text-[#CCD2D9] px-2 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/20">
                        {req.categoryName}
                      </span>
                      <ProjectStatusBadge status={req.status} size="sm" />
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-[#08E6F9] transition-colors">
                      {req.projectTitle}
                    </h2>

                    <p className="text-xs text-[#CCD2D9] line-clamp-2 max-w-3xl leading-relaxed">
                      {req.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#CCD2D9] pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#08E6F9]" />
                        <span>Created {new Date(req.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span>•</span>
                      <span>
                        Budget: {req.currency} {req.budgetMin.toLocaleString()} - {req.budgetMax.toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>Timeline: {req.preferredTimeline}</span>
                    </div>
                  </div>

                  {/* Right: Assigned Expert & Action */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#0682F4]/20 shrink-0">
                    {req.assignedExpertName ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={req.assignedExpertAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                          alt={req.assignedExpertName}
                          className="w-10 h-10 rounded-full object-cover border border-[#08E6F9]/40"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-white leading-tight">
                            {req.assignedExpertName}
                          </p>
                          <p className="text-[10px] text-[#08E6F9] font-medium leading-tight">
                            Assigned Specialist
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-left text-xs text-[#CCD2D9]">
                        <span className="text-[10px] uppercase font-bold text-amber-400 block">
                          Assignment Pending
                        </span>
                        <span>Under Nexovira Review</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs font-bold text-[#08E6F9] group-hover:translate-x-1 transition-transform">
                      <span>View Project</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
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
