import React, { useState, useEffect } from 'react';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { useAuth } from '../../context/AuthContext';
import { AiSystemStatus, AiCapabilityDefinition } from '../../types/ai';
import {
  Sparkles,
  ShieldCheck,
  Power,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Cpu,
  Activity,
  Zap,
} from 'lucide-react';

export const ManagementAiGovernancePage: React.FC = () => {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<AiSystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to retrieve AI system telemetry.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleCapability = async (capability: AiCapabilityDefinition) => {
    if (!user || togglingId) return;
    const nextState = !capability.isEnabled;
    setTogglingId(capability.id);
    setFeedback(null);

    try {
      const res = await fetch('/api/management/ai/toggle-capability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile?.role || 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          capabilityId: capability.id,
          isEnabled: nextState,
          reason: `Admin toggle by ${user.email}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update capability status');
      }

      setStatus(data.status);
      setFeedback({
        type: 'success',
        text: `${capability.name} is now ${nextState ? 'ENABLED' : 'DISABLED'}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Toggle failed';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <ManagementLayout
      activeRoute="/management/ai-governance"
      requiredPermission="AI_CONFIG_MANAGE"
      title="AI Governance & Capability Controls"
      subtitle="Manage AI capabilities, emergency kill-switches, rate limits, and model infrastructure."
      actions={
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
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

        {/* Infrastructure Health Cards */}
        {status && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#CCD2D9]/70">
                <span>Provider Engine</span>
                <Cpu className="w-4 h-4 text-[#08E6F9]" />
              </div>
              <div className="text-sm font-bold text-white truncate">{status.provider}</div>
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="font-mono text-[11px] text-[#CCD2D9]/70">
                  {status.isConfigured ? 'API Credentials Verified' : 'Placeholder Mode (Offline)'}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#CCD2D9]/70">
                <span>Active Model</span>
                <Zap className="w-4 h-4 text-[#08E6F9]" />
              </div>
              <div className="text-sm font-bold text-[#08E6F9]">{status.activeModel}</div>
              <span className="text-[11px] font-mono text-[#CCD2D9]/60">Google GenAI SDK Native</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#CCD2D9]/70">
                <span>Queries Today</span>
                <Activity className="w-4 h-4 text-[#08E6F9]" />
              </div>
              <div className="text-2xl font-black text-white">{status.totalRequestsToday}</div>
              <span className="text-[11px] font-mono text-[#CCD2D9]/60">Across all capabilities</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#CCD2D9]/70">
                <span>Operational Errors</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{status.errorsCountToday}</div>
              <span className="text-[11px] font-mono text-emerald-400">99.8% Reliability Target</span>
            </div>
          </div>
        )}

        {/* Modular AI Capabilities Management Desk */}
        <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#08E6F9]" />
              <h3 className="text-sm font-bold text-white">Configured AI Capabilities</h3>
            </div>
            <span className="text-xs font-mono text-[#CCD2D9]/60">
              {status?.capabilities.filter((c) => c.isEnabled).length} / {status?.capabilities.length} Enabled
            </span>
          </div>

          <div className="divide-y divide-[#0682F4]/20">
            {status?.capabilities.map((cap) => {
              const isToggling = togglingId === cap.id;
              return (
                <div key={cap.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{cap.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#01213D] text-[#08E6F9] border border-[#0682F4]/30">
                        {cap.category}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#011629] text-[#CCD2D9]/70">
                        {cap.privacyClassification}
                      </span>
                    </div>
                    <p className="text-xs text-[#CCD2D9]/80">{cap.description}</p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#CCD2D9]/60 pt-1">
                      <span>Rate Limit: {cap.rateLimitPerMin} req/min</span>
                      <span>·</span>
                      <span>Quota: {cap.dailyQuotaPerUser} req/day</span>
                      {cap.requiredRole && (
                        <>
                          <span>·</span>
                          <span className="text-amber-300">Requires: {cap.requiredRole.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <span
                      className={`text-xs font-mono font-bold ${
                        cap.isEnabled ? 'text-[#08E6F9]' : 'text-[#CCD2D9]/50'
                      }`}
                    >
                      {cap.isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                    <button
                      onClick={() => handleToggleCapability(cap)}
                      disabled={isToggling}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                        cap.isEnabled ? 'bg-[#08E6F9]' : 'bg-[#01213D]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                          cap.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ManagementLayout>
  );
};
