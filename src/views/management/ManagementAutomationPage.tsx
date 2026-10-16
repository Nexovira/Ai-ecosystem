import React, { useState, useEffect } from 'react';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { useAuth } from '../../context/AuthContext';
import {
  WorkflowDefinition,
  WorkflowExecutionRun,
  HumanApprovalRequest,
  AutomationSystemMetrics,
} from '../../types/automation';
import {
  Bot,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Power,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  Filter,
  FileText,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const ManagementAutomationPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecutionRun[]>([]);
  const [approvals, setApprovals] = useState<HumanApprovalRequest[]>([]);
  const [metrics, setMetrics] = useState<AutomationSystemMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'workflows' | 'executions' | 'approvals'>('workflows');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const getHeaders = (): HeadersInit => {
    if (!user) return {};
    return {
      'Content-Type': 'application/json',
      'x-user-id': user.uid,
      'x-user-role': profile?.role || 'SUPER_ADMIN',
      'x-user-email': user.email || 'nexoviratech@gmail.com',
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/management/automation/overview', {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setWorkflows(data.workflows || []);
        setExecutions(data.executions || []);
        setApprovals(data.approvals || []);
        setMetrics(data.metrics || null);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to load automation records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleWorkflow = async (wf: WorkflowDefinition) => {
    try {
      const nextState = !wf.isEnabled;
      const res = await fetch(`/api/management/automation/workflows/${wf.id}/toggle`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ isEnabled: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkflows((prev) =>
          prev.map((item) => (item.id === wf.id ? { ...item, isEnabled: nextState } : item))
        );
        setFeedback({
          type: 'success',
          text: `Workflow ${wf.name} is now ${nextState ? 'ENABLED' : 'DISABLED'}.`,
        });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to toggle workflow.' });
    }
  };

  const handleDispatchWorkflow = async (wf: WorkflowDefinition) => {
    if (dispatchingId) return;
    setDispatchingId(wf.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/management/automation/workflows/${wf.id}/execute`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason: 'Manual trigger from Automation Center' }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `Workflow dispatched successfully. Run ID: ${data.run.runId} (${data.run.status}).`,
        });
        loadData();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Dispatch rejected.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to dispatch workflow.' });
    } finally {
      setDispatchingId(null);
    }
  };

  const handleDecideApproval = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/management/automation/approvals/${requestId}/decide`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          decision,
          notes: `${decision} by ${profile?.fullName || user?.email}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `Approval ${requestId} marked as ${decision}.`,
        });
        loadData();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Action rejected.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to record approval decision.' });
    }
  };

  return (
    <ManagementLayout
      activeRoute="/management/automation"
      requiredPermission="AUTOMATION_VIEW"
      title="Management Automation Center"
      subtitle="Supervise permission-controlled workflows, human-in-the-loop approvals, and audit runs."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/40 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Telemetry Metric Cards */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#CCD2D9]/70">
                <span>Active Workflows</span>
                <Bot className="w-4 h-4 text-[#08E6F9]" />
              </div>
              <div className="text-2xl font-black text-white">
                {metrics.activeWorkflows} / {metrics.totalWorkflows}
              </div>
              <span className="text-[11px] font-mono text-emerald-400">Policy enforced & ready</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#CCD2D9]/70">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{metrics.pendingApprovalsCount}</div>
              <span className="text-[11px] font-mono text-[#CCD2D9]/60">Requires human review</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#CCD2D9]/70">
                <span>Total Executions</span>
                <Activity className="w-4 h-4 text-[#08E6F9]" />
              </div>
              <div className="text-2xl font-black text-white">{metrics.totalExecutions}</div>
              <span className="text-[11px] font-mono text-emerald-400">
                {metrics.successfulExecutions} successful
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#CCD2D9]/70">
                <span>AI-Assisted Runs</span>
                <Sparkles className="w-4 h-4 text-[#08E6F9]" />
              </div>
              <div className="text-2xl font-black text-[#08E6F9]">{metrics.aiAssistedRunsCount}</div>
              <span className="text-[11px] font-mono text-[#CCD2D9]/60">Gemini 3.8 Flash grounded</span>
            </div>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex bg-[#01213D] border border-[#0682F4]/30 rounded-xl p-1 gap-1 max-w-md">
          {[
            { id: 'workflows', label: 'Workflows Directory' },
            { id: 'approvals', label: `Approval Queue (${approvals.filter((a) => a.status === 'PENDING').length})` },
            { id: 'executions', label: 'Execution Runs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#08E6F9] text-black shadow-md'
                  : 'text-[#CCD2D9] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: WORKFLOWS DIRECTORY */}
        {activeTab === 'workflows' && (
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#08E6F9]" />
                <h3 className="text-sm font-bold text-white">Configured Operational Workflows</h3>
              </div>
              <span className="text-xs font-mono text-[#CCD2D9]/60">{workflows.length} Standard Workflows</span>
            </div>

            <div className="divide-y divide-[#0682F4]/20">
              {workflows.map((wf) => (
                <div key={wf.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{wf.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#01213D] text-[#08E6F9] border border-[#0682F4]/30">
                        {wf.category}
                      </span>
                      {wf.requiresHumanApproval && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Human Gate
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#CCD2D9]/80">{wf.description}</p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#CCD2D9]/60 pt-1">
                      <span>Trigger: {wf.triggerType}</span>
                      <span>·</span>
                      <span>Executions: {wf.totalExecutionsCount}</span>
                      <span>·</span>
                      <span>Roles: {wf.requiredRole.join(', ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                      onClick={() => handleDispatchWorkflow(wf)}
                      disabled={dispatchingId === wf.id || !wf.isEnabled}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0682F4]/20 hover:bg-[#0682F4]/30 border border-[#0682F4]/40 text-[#08E6F9] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{dispatchingId === wf.id ? 'Running...' : 'Dispatch'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleWorkflow(wf)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        wf.isEnabled ? 'bg-[#08E6F9]' : 'bg-[#01213D]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                          wf.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: APPROVAL QUEUE */}
        {activeTab === 'approvals' && (
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Human-In-The-Loop Approval Queue</h3>
              </div>
              <span className="text-xs font-mono text-[#CCD2D9]/60">Segregation of Duties Enforced</span>
            </div>

            <div className="divide-y divide-[#0682F4]/20">
              {approvals.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#CCD2D9]/60 font-mono">
                  No approval requests pending review.
                </div>
              ) : (
                approvals.map((req) => (
                  <div key={req.requestId} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#08E6F9]">{req.requestId}</span>
                        <span className="text-xs font-bold text-white">{req.actionRequested}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            req.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300'
                              : req.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#CCD2D9]/90">{req.reason}</p>
                      <div className="text-[11px] font-mono text-[#CCD2D9]/60 flex items-center gap-2">
                        <span>Workflow: {req.workflowName}</span>
                        <span>·</span>
                        <span>Requested: {new Date(req.requestedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {req.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecideApproval(req.requestId, 'APPROVED')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition cursor-pointer"
                        >
                          Approve Action
                        </button>
                        <button
                          onClick={() => handleDecideApproval(req.requestId, 'REJECTED')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-[11px] font-mono text-[#CCD2D9]/60">
                        <span>Decided by: {req.reviewedBy}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EXECUTION RUNS */}
        {activeTab === 'executions' && (
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#08E6F9]" />
                <h3 className="text-sm font-bold text-white">Execution Audit Trail</h3>
              </div>
              <span className="text-xs font-mono text-[#CCD2D9]/60">Immutable Run Log</span>
            </div>

            <div className="space-y-3">
              {executions.map((run) => (
                <div key={run.runId} className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#08E6F9]">{run.runId}</span>
                      <span className="text-xs font-bold text-white">{run.workflowName}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        run.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : run.status === 'RUNNING'
                          ? 'bg-[#08E6F9]/20 text-[#08E6F9] animate-pulse'
                          : run.status === 'AWAITING_APPROVAL'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>

                  {run.aiSummaryReport && (
                    <div className="p-2.5 rounded-lg bg-[#011629] border border-[#0682F4]/30 text-xs text-[#CCD2D9] font-mono">
                      <span className="text-[#08E6F9] font-bold block mb-1">AI Operational Summary:</span>
                      {run.aiSummaryReport}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#CCD2D9]/60">
                    <span>Source: {run.triggerSource}</span>
                    <span>Started: {new Date(run.startedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
};
