import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { ProjectStatusBadge } from '../../components/services/ProjectStatusBadge';
import { ProjectRequest, ProjectUpdate } from '../../types/services';
import {
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  Paperclip,
  File,
  DollarSign,
  Calendar,
  Layers,
  Ban,
  MessageSquare,
  Sparkles,
  Star,
} from 'lucide-react';

interface CustomerServiceDetailPageProps {
  requestId: string;
}

export const CustomerServiceDetailPage: React.FC<CustomerServiceDetailPageProps> = ({ requestId }) => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { getRequestDetail, updateProjectStatus, getProjectUpdates, postProjectUpdate } = useServices();

  const [request, setRequest] = useState<ProjectRequest | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New message form
  const [messageText, setMessageText] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRequestDetail(requestId);
      if (res.error || !res.request) {
        setError(res.error || 'Project request not found');
        return;
      }
      setRequest(res.request);

      const upd = await getProjectUpdates(requestId);
      setUpdates(upd);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading project');
    } finally {
      setLoading(false);
    }
  }, [requestId, getRequestDetail, getProjectUpdates]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setSendingMessage(true);
      setActionFeedback(null);
      const res = await postProjectUpdate(requestId, messageText);
      if (res.success && res.update) {
        setUpdates((prev) => [...prev, res.update!]);
        setMessageText('');
      } else {
        setActionFeedback({ type: 'error', message: res.error || 'Failed to send update' });
      }
    } catch {
      setActionFeedback({ type: 'error', message: 'Network error sending update' });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      setCancelling(true);
      setActionFeedback(null);
      const res = await updateProjectStatus(requestId, 'CANCELLED', 'Cancelled by client');
      if (res.success) {
        setShowCancelConfirm(false);
        loadData();
      } else {
        setActionFeedback({ type: 'error', message: res.error || 'Could not cancel request' });
      }
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08E6F9] mx-auto" />
          <p className="text-xs text-[#CCD2D9]">Verifying project access...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Access Restricted</h1>
          <p className="text-xs text-[#CCD2D9]">
            {error || 'You are not authorized to view this project request or it does not exist.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/account/services')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Return to My Projects</span>
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
            onClick={() => navigate('/account/services')}
            className="inline-flex items-center text-xs font-medium text-[#08E6F9] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to My Projects</span>
          </button>
        </div>

        {/* Top Header Card */}
        <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#0682F4]/20">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-black text-[#08E6F9] bg-[#08E6F9]/10 px-3 py-1 rounded-md border border-[#08E6F9]/30">
                  {request.requestReference}
                </span>
                <span className="text-xs text-[#CCD2D9] px-2.5 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/25">
                  {request.categoryName}
                </span>
                <ProjectStatusBadge status={request.status} size="md" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {request.projectTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#CCD2D9] pt-1">
                <span>Created {new Date(request.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>Priority: {request.priority}</span>
                <span>•</span>
                <span>Timeline: {request.preferredTimeline}</span>
              </div>
            </div>

            {/* Cancel Action (if in SUBMITTED state) */}
            {request.status === 'SUBMITTED' && (
              <div className="flex items-center gap-2">
                {showCancelConfirm ? (
                  <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 p-1.5 rounded-xl">
                    <span className="text-xs text-rose-300 font-semibold px-1">Confirm cancel?</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelRequest}
                      disabled={cancelling}
                      className="bg-rose-600 hover:bg-rose-700 text-white border-none text-xs px-2.5 py-1"
                    >
                      {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                    </Button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="text-xs text-[#CCD2D9] hover:text-white px-1.5"
                    >
                      Nevermind
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={cancelling}
                    className="text-rose-400 border-rose-500/40 hover:bg-rose-500/10 text-xs"
                  >
                    <Ban className="w-3.5 h-3.5 mr-1.5" />
                    <span>Cancel Request</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
            <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
              <span className="text-[#CCD2D9] block text-[10px] uppercase font-bold">Budget Allocation</span>
              <span className="font-bold text-white text-sm mt-0.5 block">
                {request.currency} {request.budgetMin.toLocaleString()} - {request.budgetMax.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
              <span className="text-[#CCD2D9] block text-[10px] uppercase font-bold">Delivery Phase</span>
              <span className="font-bold text-[#08E6F9] text-sm mt-0.5 block">
                {request.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
              <span className="text-[#CCD2D9] block text-[10px] uppercase font-bold">Target Timeline</span>
              <span className="font-bold text-white text-sm mt-0.5 block">
                {request.preferredTimeline}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
              <span className="text-[#CCD2D9] block text-[10px] uppercase font-bold">Escrow Guarantee</span>
              <span className="font-bold text-emerald-400 text-sm mt-0.5 block flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Protected</span>
              </span>
            </div>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column: Project Brief & Interactive Messages */}
          <div className="lg:col-span-8 space-y-8">
            {/* Project Scope Brief */}
            <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 sm:p-8 space-y-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#08E6F9]" />
                <span>Project Scope & Specifications</span>
              </h2>

              <div>
                <h3 className="text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                  Description
                </h3>
                <p className="text-sm text-[#CCD2D9] leading-relaxed whitespace-pre-line">
                  {request.description}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                  Target Objectives & Deliverable Goals
                </h3>
                <p className="text-sm text-[#CCD2D9] leading-relaxed whitespace-pre-line">
                  {request.goals}
                </p>
              </div>

              {request.requiredSkills && request.requiredSkills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-2">
                    Required Capabilities
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {request.requiredSkills.map((s) => (
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

              {request.attachments && request.attachments.length > 0 && (
                <div className="pt-4 border-t border-[#0682F4]/20">
                  <h3 className="text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attached Briefs & Assets</span>
                  </h3>
                  <div className="space-y-2">
                    {request.attachments.map((file) => (
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
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Project Communication Thread */}
            <div className="bg-[#011B33] border border-[#0682F4]/25 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#08E6F9]" />
                  <h2 className="text-base font-bold text-white">Project Activity & Communications</h2>
                </div>
                <span className="text-xs text-[#CCD2D9]">
                  Nexovira Managed Channel
                </span>
              </div>

              {/* Message Feed */}
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                {updates.length === 0 ? (
                  <p className="text-xs text-[#CCD2D9] text-center py-6">
                    No messages recorded yet.
                  </p>
                ) : (
                  updates.map((upd) => {
                    const isClient = upd.senderRole === 'CUSTOMER';
                    const isMgmt = upd.senderRole === 'MANAGEMENT';
                    const isExp = upd.senderRole === 'EXPERT';

                    const roleBadgeColor = isMgmt
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      : isExp
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      : 'bg-blue-500/10 text-blue-300 border-blue-500/30';

                    return (
                      <div
                        key={upd.updateId}
                        className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                          isClient
                            ? 'bg-[#01213D] border-[#0682F4]/40 ml-4'
                            : isMgmt
                            ? 'bg-purple-950/20 border-purple-500/30 mr-4'
                            : 'bg-cyan-950/20 border-cyan-500/30 mr-4'
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

              {actionFeedback && (
                <div className={`p-2.5 rounded-xl text-xs mb-3 ${actionFeedback.type === 'error' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'}`}>
                  {actionFeedback.message}
                </div>
              )}

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="pt-4 border-t border-[#0682F4]/20 flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Post an update, clarify a requirement, or ask Nexovira..."
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
                  <span>Send</span>
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar: Assigned Expert & Delivery Safeguards */}
          <div className="lg:col-span-4 space-y-6">
            {/* Assigned Expert Box */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
                Assigned Specialist
              </h3>

              {request.assignedExpertName ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={request.assignedExpertAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                      alt={request.assignedExpertName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#08E6F9]/40 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-white text-base">
                        {request.assignedExpertName}
                      </h4>
                      <p className="text-xs text-[#0682F4] font-medium">
                        {request.assignedExpertTitle || 'Nexovira Ecosystem Expert'}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Assigned & Vetted</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#CCD2D9] leading-relaxed">
                    This verified contractor is working directly under Nexovira quality control and milestone supervision.
                  </p>

                  {request.assignedExpertId && (
                    <div className="space-y-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => navigate(`/services/experts/${request.assignedExpertId}`)}
                        className="text-xs"
                      >
                        <span>View Expert Profile</span>
                      </Button>

                      {['COMPLETED', 'DELIVERED'].includes(request.status) && (
                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth
                          onClick={() => navigate(`/services/experts/${request.assignedExpertId}`)}
                          className="text-xs flex items-center justify-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>Review Expert Experience</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Review & Assignment in Progress</h4>
                  <p className="text-xs text-[#CCD2D9] leading-relaxed">
                    Nexovira technical operations are assessing technical fit, bandwidth, and architectural requirements to assign the optimal specialist.
                  </p>
                </div>
              )}
            </div>

            {/* Platform Security Assurance */}
            <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#08E6F9]">
                <Shield className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Nexovira Delivery Guarantee</h3>
              </div>

              <ul className="space-y-2.5 text-xs text-[#CCD2D9]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>Work milestone verification prior to completion</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>Protected intellectual property & automated NDA</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                  <span>Dedicated escalation support with Nexovira leadership</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
