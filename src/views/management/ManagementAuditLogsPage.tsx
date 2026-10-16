import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import {
  FileText,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Eye,
  Clock,
  User,
  X,
  Database,
} from 'lucide-react';
import { ManagementAuditRecord } from '../../types/management';

export const ManagementAuditLogsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<ManagementAuditRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL');

  // Inspect Log Detail Modal
  const [inspectingLog, setInspectingLog] = useState<ManagementAuditRecord | null>(null);

  const fetchLogs = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (actionFilter !== 'ALL') queryParams.set('action', actionFilter);
      if (targetTypeFilter !== 'ALL') queryParams.set('targetType', targetTypeFilter);
      queryParams.set('limit', '100');

      const res = await fetch(`/api/management/audit-logs?${queryParams.toString()}`, {
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch audit logs');
      }

      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading audit logs';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user, profile, actionFilter, targetTypeFilter]);

  return (
    <ManagementLayout
      activeRoute="/management/audit-logs"
      requiredPermission="AUDIT_LOGS_VIEW"
      title="Chronological Audit Trail &amp; Compliance Logs"
      subtitle="Authoritative, append-only records of all administrative actions, permission delegations, and operational state modifications."
      actions={
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Trail ({total})
        </button>
      }
    >
      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-[#CCD2D9]">
          <Database className="w-4 h-4 text-[#08E6F9]" />
          <span>Showing immutable records newest first</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#CCD2D9]/70">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
            >
              <option value="ALL">All Actions</option>
              <option value="USER_STATUS_CHANGE">USER STATUS CHANGE</option>
              <option value="USER_ROLE_CHANGE">USER ROLE CHANGE</option>
              <option value="SELLER_VERIFICATION">SELLER VERIFICATION</option>
              <option value="PRODUCT_STATUS_CHANGE">PRODUCT STATUS CHANGE</option>
              <option value="ORDER_STATUS_UPDATE">ORDER STATUS UPDATE</option>
              <option value="ORDER_REFUND">ORDER REFUND</option>
              <option value="NOTIFICATION_BROADCAST">NOTIFICATION BROADCAST</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#CCD2D9]/70">Target Type:</span>
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
            >
              <option value="ALL">All Target Types</option>
              <option value="USER">USER</option>
              <option value="SELLER">SELLER</option>
              <option value="PRODUCT">PRODUCT</option>
              <option value="ORDER">ORDER</option>
              <option value="NOTIFICATION">NOTIFICATION</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#CCD2D9]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#08E6F9]" />
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#CCD2D9]/60">
            No audit logs found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#01213D] border-b border-[#0682F4]/20 text-[#CCD2D9] font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor &amp; Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target Entity</th>
                  <th className="px-4 py-3">Reason / Justification</th>
                  <th className="px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0682F4]/10 text-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#01213D]/40 transition">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-[#CCD2D9]">
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-[#CCD2D9]/50">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs">{log.actorEmail}</div>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9]">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[11px] font-bold text-[#08E6F9]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/30 text-white mr-1.5">
                        {log.targetType}
                      </span>
                      <span className="text-[#CCD2D9]/70">{log.targetId}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#CCD2D9] max-w-xs truncate">
                      {log.reason || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setInspectingLog(log)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] transition cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Log Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#011B33] border border-[#0682F4]/40 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-[#08E6F9]" />
                Audit Record: {inspectingLog.id}
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="text-[#CCD2D9] hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 font-mono text-[11px]">
                <div>
                  <span className="text-[#CCD2D9]/60 block">Actor Email:</span>
                  <span className="text-white font-bold">{inspectingLog.actorEmail}</span>
                </div>
                <div>
                  <span className="text-[#CCD2D9]/60 block">Actor Role:</span>
                  <span className="text-[#08E6F9] font-bold">{inspectingLog.actorRole}</span>
                </div>
                <div>
                  <span className="text-[#CCD2D9]/60 block">Action Type:</span>
                  <span className="text-white font-bold">{inspectingLog.action}</span>
                </div>
                <div>
                  <span className="text-[#CCD2D9]/60 block">Target:</span>
                  <span className="text-white font-bold">{inspectingLog.targetType} ({inspectingLog.targetId})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#CCD2D9]/60 block">Timestamp:</span>
                  <span className="text-white font-bold">{new Date(inspectingLog.timestamp).toISOString()}</span>
                </div>
              </div>

              {inspectingLog.reason && (
                <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1">
                  <span className="text-xs font-bold text-white block">Audit Rationale</span>
                  <p className="text-[11px] text-[#CCD2D9]">{inspectingLog.reason}</p>
                </div>
              )}

              {/* State Diffs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#000000] border border-[#0682F4]/20 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#CCD2D9]/60 block uppercase">
                    Previous State
                  </span>
                  <pre className="text-[10px] font-mono text-amber-300 overflow-x-auto p-2 bg-[#011B33]/50 rounded-lg">
                    {inspectingLog.previousState ? JSON.stringify(inspectingLog.previousState, null, 2) : 'null'}
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-[#000000] border border-[#0682F4]/20 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#CCD2D9]/60 block uppercase">
                    New State
                  </span>
                  <pre className="text-[10px] font-mono text-emerald-300 overflow-x-auto p-2 bg-[#011B33]/50 rounded-lg">
                    {inspectingLog.newState ? JSON.stringify(inspectingLog.newState, null, 2) : 'null'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
};
