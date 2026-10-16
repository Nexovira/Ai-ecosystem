import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { ProjectStatusBadge } from '../../components/services/ProjectStatusBadge';
import { ProjectRequest, ProjectUpdate, ProjectRequestStatus } from '../../types/services';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  PlayCircle,
  Eye,
  AlertCircle,
  Send,
  MessageSquare,
  Paperclip,
  File,
  Layers,
  Clock,
  Shield,
} from 'lucide-react';

interface ExpertProjectDetailPageProps {
  projectId: string;
}

export const ExpertProjectDetailPage: React.FC<ExpertProjectDetailPageProps> = ({ projectId }) => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { getRequestDetail, updateProjectStatus, getProjectUpdates, postProjectUpdate } = useServices();

  const [project, setProject] = useState<ProjectRequest | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Status update modal / transition
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRequestDetail(projectId);
      if (res.error || !res.request) {
        setError(res.error || 'Project not found or unauthorized.');
        return;
      }
      setProject(res.request);

      const upd = await getProjectUpdates(projectId);
      setUpdates(upd);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading project');
    } finally {
      setLoading(false);
    }
  }, [projectId, getRequestDetail, getProjectUpdates]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Allowed Status Transitions
  const handleTransition = async (newStatus: ProjectRequestStatus, noteMsg?: string) => {
    try {
      setUpdatingStatus(true);
      const res = await updateProjectStatus(projectId, newStatus, noteMsg || statusNote);
      if (res.success) {
        setStatusNote('');
        loadData();
      } else {
        alert(res.error || 'Could not update project status');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setSendingMessage(true);
      const res = await postProjectUpdate(projectId, messageText);
      if (res.success && res.update) {
        setUpdates((prev) => [...prev, res.update!]);
        setMessageText('');
      } else {
        alert(res.error || 'Failed to send update');
      }
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08E6F9] mx-auto" />
          <p className="text-xs text-[#CCD2D9]">Verifying expert engagement access...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-xs text-[#CCD2D9]">
            {error || 'You are not assigned to this project or it does not exist.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/expert/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Return to Assigned Projects</span>
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
            onClick={() => navigate('/expert/projects')}
            className="inline-flex items-center text-xs font-medium text-[#08E6F9] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to My Projects</span>
          </button>
        </div>

        {/* Top Header Overview Card */}
        <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#0682F4]/20">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-[#08E6F9] bg-[#08E6F9]/10 px-3 py-1 rounded-md border border-[#08E6F9]/30">
                  {project.requestReference}
                </span>
                <span className="text-xs text-[#CCD2D9] px-2.5 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/20">
                  {project.categoryName}
                </span>
                <ProjectStatusBadge status={project.status} size="md" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {project.projectTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#CCD2D9]">
                <span>Client: <strong className="text-white">{project.customerName}</strong></span>
                <span>•</span>
                <span>Timeline: {project.preferredTimeline}</span>
                <span>•</span>
                <span>Priority: {project.priority}</span>
              </div>
            </div>

            {/* Allowed Workflow Action Buttons for Expert */}
            <div className="flex flex-wrap items-center gap-3">
              {project.status === 'ASSIGNED' && (
                <Button
                  variant="primary"
                  size="md"
                  disabled={updatingStatus}
                  onClick={() => handleTransition('ACCEPTED', 'Expert accepted engagement')}
                  className="shadow-lg shadow-[#0682F4]/30 text-xs font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  <span>Accept Assignment</span>
                </Button>
              )}

              {project.status === 'ACCEPTED' && (
                <Button
                  variant="primary"
                  size="md"
                  disabled={updatingStatus}
                  onClick={() => handleTransition('IN_PROGRESS', 'Development kickoff started')}
                  className="shadow-lg shadow-[#0682F4]/30 text-xs font-semibold"
                >
                  <PlayCircle className="w-4 h-4 mr-1.5" />
                  <span>Start Development</span>
                </Button>
              )}

              {project.status === 'IN_PROGRESS' && (
                <Button
                  variant="primary"
                  size="md"
                  disabled={updatingStatus}
                  onClick={() => handleTransition('AWAITING_CUSTOMER', 'Deliverable ready for client verification')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-[#01213D] font-bold text-xs"
                >
                  <Eye className="w-4 h-4 mr-1.5 text-[#01213D]" />
                  <span>Mark Ready for Review</span>
                </Button>
              )}
            </div>
          </div>

          {/* Engagement Meta Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
            <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
              <span className="text-[#CCD2D9] block text-[10px] uppercase font-bold">Assigned Date</span>
              <span className="font-bold text-white text-sm mt-0.5 block">
                {project.assignedAt ? new Date(project.assignedAt).toLocaleDateString() : 'Active'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
              <span className="text-[#CCD2D9] block text-[10px] uppercase font-bold">Current Milestone</span>
              <span className="font-bold text-[#08E6F9] text-sm mt-0.5 block">
                {project.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
              <span className="text-[#CCD2D9] block text-[10px] uppercase font-bold">Delivery Priority</span>
              <span className="font-bold text-white text-sm mt-0.5 block">
                {project.priority}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
              <span className="text-[#CCD2D9] block text-[10px] uppercase font-bold">Client Confirmation</span>
              <span className="font-bold text-emerald-400 text-sm mt-0.5 block flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Verified Client</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Project Specifications */}
            <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 sm:p-8 space-y-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#08E6F9]" />
                <span>Client Project Specifications</span>
              </h2>

              <div>
                <h3 className="text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                  Full Description
                </h3>
                <p className="text-sm text-[#CCD2D9] leading-relaxed whitespace-pre-line">
                  {project.description}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                  Target Objectives & Deliverable Goals
                </h3>
                <p className="text-sm text-[#CCD2D9] leading-relaxed whitespace-pre-line">
                  {project.goals}
                </p>
              </div>

              {project.requiredSkills && project.requiredSkills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-2">
                    Required Capabilities
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.requiredSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded bg-[#01213D] border border-[#0682F4]/30 text-xs text-white"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project.attachments && project.attachments.length > 0 && (
                <div className="pt-4 border-t border-[#0682F4]/20">
                  <h3 className="text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Client Attachments & Briefs</span>
                  </h3>
                  <div className="space-y-2">
                    {project.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <File className="w-4 h-4 text-[#08E6F9] shrink-0" />
                          <span className="text-white truncate">{file.name}</span>
                        </div>
                        {file.url && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#08E6F9] hover:underline shrink-0 text-xs font-semibold"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Project Updates & Communications */}
            <div className="bg-[#011B33] border border-[#0682F4]/25 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#08E6F9]" />
                  <h2 className="text-base font-bold text-white">Project Activity & Communications</h2>
                </div>
                <span className="text-xs text-[#CCD2D9]">
                  Nexovira Verified Thread
                </span>
              </div>

              {/* Feed */}
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                {updates.length === 0 ? (
                  <p className="text-xs text-[#CCD2D9] text-center py-6">
                    No communication records yet.
                  </p>
                ) : (
                  updates.map((upd) => {
                    const isExpert = upd.senderRole === 'EXPERT';
                    const isMgmt = upd.senderRole === 'MANAGEMENT';

                    const roleBadgeColor = isMgmt
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      : isExpert
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      : 'bg-blue-500/10 text-blue-300 border-blue-500/30';

                    return (
                      <div
                        key={upd.updateId}
                        className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                          isExpert
                            ? 'bg-[#01213D] border-[#08E6F9]/40 ml-4'
                            : isMgmt
                            ? 'bg-purple-950/20 border-purple-500/30 mr-4'
                            : 'bg-blue-950/20 border-blue-500/30 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{upd.senderName}</span>
                            <span className={`text-[10px] px-2 py-0.2 rounded border font-semibold uppercase ${roleBadgeColor}`}>
                              {upd.senderRole}
                            </span>
                          </div>
                          <span className="text-[#CCD2D9] text-[10px]">
                            {new Date(upd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[#CCD2D9] leading-relaxed whitespace-pre-line text-xs pt-1">
                          {upd.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send Box */}
              <form onSubmit={handleSendMessage} className="pt-4 border-t border-[#0682F4]/20 flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Post progress update or request clarification from the client..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={sendingMessage || !messageText.trim()}
                  className="px-5 shrink-0"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  <span>Update</span>
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Client Info Card */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
                Client Engagement Information
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[#CCD2D9] block text-[10px]">Client Name</span>
                  <span className="font-bold text-white text-sm">{project.customerName}</span>
                </div>
                <div>
                  <span className="text-[#CCD2D9] block text-[10px]">Service Category</span>
                  <span className="text-white font-medium">{project.categoryName}</span>
                </div>
                <div>
                  <span className="text-[#CCD2D9] block text-[10px]">Requested Timeline</span>
                  <span className="text-white font-medium">{project.preferredTimeline}</span>
                </div>
              </div>
            </div>

            {/* Expert Code of Conduct / Integrity */}
            <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 space-y-3 text-xs text-[#CCD2D9]">
              <div className="flex items-center gap-2 text-[#08E6F9]">
                <Shield className="w-4 h-4" />
                <h4 className="font-bold text-white">Ecosystem Integrity Notice</h4>
              </div>
              <p className="leading-relaxed">
                As a verified Nexovira expert, all project communications, deliverables, and disbursements must occur strictly through the platform. Attempting external bypass or off-platform contracting results in permanent suspension.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
