import React, { useState, useEffect } from 'react';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { useAuth } from '../../context/AuthContext';
import {
  ApiKeyCredential,
  WebhookSubscription,
  ExternalAdapterRegistryEntry,
  WebhookDeliveryRecord,
  ApiScope,
  IntegrationEnvironment,
} from '../../types/integrations';
import {
  Key,
  ShieldCheck,
  Send,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Activity,
  Globe,
  Radio,
  ExternalLink,
} from 'lucide-react';

export const ManagementIntegrationsPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'keys' | 'adapters' | 'webhooks' | 'deliveries'>('keys');
  const [apiKeys, setApiKeys] = useState<ApiKeyCredential[]>([]);
  const [adapters, setAdapters] = useState<ExternalAdapterRegistryEntry[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Key Modal
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [newKeyEnv, setNewKeyEnv] = useState<IntegrationEnvironment>('PRODUCTION');
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>(['products:read', 'orders:read']);
  const [issuedRawKey, setIssuedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  const availableScopes: ApiScope[] = [
    'products:read',
    'products:write',
    'orders:read',
    'orders:write',
    'profile:read',
    'services:read',
    'academy:read',
    'digital:read',
  ];

  const getHeaders = (): HeadersInit => {
    if (!user) return {};
    return {
      'Content-Type': 'application/json',
      'x-user-id': user.uid,
      'x-user-role': profile?.role || 'SUPER_ADMIN',
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/management/integrations/overview', {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setApiKeys(data.data.apiKeys || []);
        setAdapters(data.data.adapters || []);
        setWebhooks(data.data.webhooks || []);
        setDeliveries(data.data.recentDeliveries || []);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to retrieve integration records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/management/integrations/keys', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newKeyName,
          environment: newKeyEnv,
          scopes: selectedScopes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIssuedRawKey(data.rawSecretKey);
        setFeedback({
          type: 'success',
          text: `API Key '${newKeyName}' issued successfully. Make sure to copy it now!`,
        });
        loadData();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to issue API Key' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error creating API Key.' });
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm(`Are you sure you want to permanently revoke API Key ${keyId}?`)) return;

    try {
      const res = await fetch(`/api/management/integrations/keys/${keyId}/revoke`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: `Key ${keyId} revoked.` });
        loadData();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Revocation failed' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to revoke key.' });
    }
  };

  const toggleScope = (scope: ApiScope) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  return (
    <ManagementLayout
      activeRoute="/management/integrations"
      requiredPermission="INTEGRATIONS_VIEW"
      title="Ecosystem API & Integrations Hub"
      subtitle="Manage scoped API credentials, approved external service adapters, and outbound signed webhooks."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIssuedRawKey(null);
              setNewKeyName('');
              setShowKeyModal(true);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#08E6F9] text-black shadow-md hover:brightness-110 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue API Key</span>
          </button>

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
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex bg-[#01213D] border border-[#0682F4]/30 rounded-xl p-1 gap-1 max-w-lg">
          {[
            { id: 'keys', label: `API Keys (${apiKeys.length})` },
            { id: 'adapters', label: `Service Adapters (${adapters.length})` },
            { id: 'webhooks', label: `Webhooks (${webhooks.length})` },
            { id: 'deliveries', label: 'Delivery Log' },
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

        {/* TAB 1: API KEYS */}
        {activeTab === 'keys' && (
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#08E6F9]" />
                <h3 className="text-sm font-bold text-white">Registered API Credentials</h3>
              </div>
              <span className="text-xs font-mono text-[#CCD2D9]/60">HMAC-SHA256 Hashed Secrets</span>
            </div>

            <div className="divide-y divide-[#0682F4]/20">
              {apiKeys.map((k) => (
                <div key={k.keyId} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{k.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#01213D] text-[#08E6F9] border border-[#0682F4]/30">
                        {k.environment}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          k.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {k.status}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-[#CCD2D9]">
                      Token: <span className="text-white">{k.maskedKey}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {k.scopes.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#011629] border border-[#0682F4]/20 text-[#CCD2D9]/80"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] font-mono text-[#CCD2D9]/60 pt-1 flex items-center gap-3">
                      <span>Rate Limit: {k.rateLimitPerMin} req/min</span>
                      <span>·</span>
                      <span>Owner: {k.ownerEmail}</span>
                    </div>
                  </div>

                  {k.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleRevokeKey(k.keyId)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition flex items-center gap-1.5 cursor-pointer self-end md:self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: EXTERNAL SERVICE ADAPTERS */}
        {activeTab === 'adapters' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adapters.map((ad) => (
              <div key={ad.adapterId} className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#01213D] text-[#08E6F9] border border-[#0682F4]/30">
                      {ad.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        ad.status === 'CONNECTED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ad.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{ad.name}</h4>
                    <p className="text-xs text-[#CCD2D9]/70">{ad.provider}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#CCD2D9]/50 block">Capabilities</span>
                    <div className="flex flex-wrap gap-1">
                      {ad.capabilities.map((c, idx) => (
                        <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#011629] text-[#CCD2D9]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#0682F4]/20 text-[11px] font-mono text-[#CCD2D9]/60">
                  <span>Endpoint: {ad.endpointHealthCheck}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: WEBHOOK SUBSCRIPTIONS */}
        {activeTab === 'webhooks' && (
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#08E6F9]" />
                <h3 className="text-sm font-bold text-white">Outbound Webhook Endpoints</h3>
              </div>
              <span className="text-xs font-mono text-[#CCD2D9]/60">HMAC-SHA256 Signed Payloads</span>
            </div>

            <div className="divide-y divide-[#0682F4]/20">
              {webhooks.map((wh) => (
                <div key={wh.subscriptionId} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{wh.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {wh.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-[#08E6F9] truncate">{wh.targetUrl}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {wh.subscribedEvents.map((e) => (
                      <span key={e} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#011629] text-[#CCD2D9]">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DELIVERY LOG */}
        {activeTab === 'deliveries' && (
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#08E6F9]" />
                <h3 className="text-sm font-bold text-white">Recent Webhook Deliveries</h3>
              </div>
              <span className="text-xs font-mono text-[#CCD2D9]/60">HTTP 200 Acknowledgments</span>
            </div>

            <div className="space-y-3">
              {deliveries.map((del) => (
                <div key={del.deliveryId} className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#08E6F9] font-bold">{del.deliveryId}</span>
                    <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      HTTP {del.httpStatusCode}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-white truncate">{del.targetUrl}</div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#CCD2D9]/60">
                    <span>Topic: {del.eventTopic}</span>
                    <span>Sent: {new Date(del.sentAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Issue API Key */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#011B33] border border-[#0682F4]/40 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#08E6F9]" />
                  <span>Issue New API Credential</span>
                </h3>
                <button onClick={() => setShowKeyModal(false)} className="text-[#CCD2D9] hover:text-white cursor-pointer">
                  ✕
                </button>
              </div>

              {issuedRawKey ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs">
                    <strong className="block mb-1">Copy Your Secret Key Now!</strong>
                    This token is hashed with HMAC-SHA256 and will never be displayed again.
                  </div>

                  <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/40 flex items-center justify-between gap-2 font-mono text-xs text-white break-all">
                    <span>{issuedRawKey}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(issuedRawKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-[#0682F4]/20 hover:bg-[#0682F4]/30 text-[#08E6F9] shrink-0 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="w-full py-2.5 rounded-xl bg-[#08E6F9] text-black font-bold text-xs cursor-pointer hover:brightness-110"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[#CCD2D9] mb-1">Integration Name</label>
                    <input
                      type="text"
                      required
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. ERP Inventory Sync Client"
                      className="w-full bg-[#01213D] text-white text-xs px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#CCD2D9] mb-1">Environment</label>
                    <select
                      value={newKeyEnv}
                      onChange={(e) => setNewKeyEnv(e.target.value as any)}
                      className="w-full bg-[#01213D] text-white text-xs px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                    >
                      <option value="PRODUCTION">Production (Live)</option>
                      <option value="SANDBOX">Sandbox (Test)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#CCD2D9] mb-1">Granted Scopes</label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableScopes.map((scope) => (
                        <label
                          key={scope}
                          className="flex items-center gap-2 p-2 rounded-lg bg-[#01213D] border border-[#0682F4]/20 text-xs font-mono text-[#CCD2D9] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedScopes.includes(scope)}
                            onChange={() => toggleScope(scope)}
                            className="rounded border-[#0682F4]/40 text-[#08E6F9] focus:ring-0"
                          />
                          <span>{scope}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#08E6F9] text-black font-bold text-xs cursor-pointer hover:brightness-110 shadow-lg"
                  >
                    Generate Scoped Key
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
};
