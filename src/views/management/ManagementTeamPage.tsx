import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import {
  UserCheck,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Users,
  Key,
} from 'lucide-react';
import { UserProfile, ManagementRole } from '../../types/auth';
import { MANAGEMENT_ROLE_PERMISSIONS } from '../../types/management';

export const ManagementTeamPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delegation Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [targetRole, setTargetRole] = useState<ManagementRole>('OPERATIONS');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  const fetchTeam = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/management/team', {
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch team members');
      }

      setMembers(data.members || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading management team';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [user, profile]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim() || !assignmentReason.trim() || !user || !profile) return;

    setSubmittingAssign(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/management/team/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          targetUserId: targetUserId.trim(),
          role: targetRole,
          reason: assignmentReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign management role');
      }

      setActionFeedback({
        type: 'success',
        text: `Assigned role ${targetRole} to user ${targetUserId.trim()}.`,
      });
      setAssignModalOpen(false);
      setTargetUserId('');
      setAssignmentReason('');
      fetchTeam();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error delegating role';
      setActionFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingAssign(false);
    }
  };

  return (
    <ManagementLayout
      activeRoute="/management/team"
      requiredPermission="TEAM_MANAGE"
      title="Management Team &amp; Permission Architecture"
      subtitle="Authoritative role delegations, internal staff rosters, and strict separation of duties."
      actions={
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => setAssignModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0682F4] hover:bg-[#05A9F7] transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#0682F4]/30"
            >
              <Plus className="w-3.5 h-3.5" />
              Delegate Role
            </button>
          )}
          <button
            onClick={fetchTeam}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Roster
          </button>
        </div>
      }
    >
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/10 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Team Roster Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-[#08E6F9]" />
          Active Management Personnel ({members.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div
              key={m.userId}
              className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">{m.fullName || 'Staff Member'}</h4>
                    <span className="font-mono text-[11px] text-[#CCD2D9]/70 block">{m.email}</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9]">
                    {m.role}
                  </span>
                </div>
                <div className="text-[10px] text-[#CCD2D9]/50 font-mono">
                  ID: {m.userId} · Status: <span className="text-emerald-400">{m.accountStatus || 'ACTIVE'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#0682F4]/20 flex items-center justify-between text-[11px] text-[#CCD2D9]/60 font-mono">
                <span>Joined {new Date(m.createdAt || Date.now()).toLocaleDateString()}</span>
                {m.emailVerified && <span className="text-emerald-400">Verified</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Permission Matrix Reference */}
      <div className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#0682F4]/20">
          <Key className="w-4 h-4 text-[#08E6F9]" />
          <div>
            <h3 className="text-sm font-bold text-white">Separation of Duties: Permission Matrix</h3>
            <p className="text-[11px] text-[#CCD2D9]/70">
              Granular capabilities cryptographically and server-enforced across all 8 internal management roles.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#01213D] border-b border-[#0682F4]/20 text-[#CCD2D9] font-mono text-[10px]">
              <tr>
                <th className="px-3 py-2.5">Role Designation</th>
                <th className="px-3 py-2.5">Scope Description</th>
                <th className="px-3 py-2.5">Enforced Capabilities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0682F4]/10 text-white font-mono text-[11px]">
              {Object.entries(MANAGEMENT_ROLE_PERMISSIONS).map(([role, perms]) => (
                <tr key={role} className="hover:bg-[#01213D]/40 transition">
                  <td className="px-3 py-3 font-bold text-[#08E6F9] whitespace-nowrap">
                    {role}
                  </td>
                  <td className="px-3 py-3 text-[#CCD2D9] font-sans text-xs">
                    {role === 'SUPER_ADMIN' && 'Complete platform clearance: role delegation, refunds, seller KYC, and full operations.'}
                    {role === 'ADMIN' && 'Platform operations, product approval, fulfillment dispatch, and team moderation.'}
                    {role === 'OPERATIONS' && 'User standing, seller KYC, order logistics, service assignments, and Academy.'}
                    {role === 'FINANCE' && 'Refunds processing, gateway payments ledger, commissions audits, and payouts.'}
                    {role === 'CONTENT_MANAGER' && 'Marketplace listings approval, Academy course authoring, and content curation.'}
                    {role === 'SUPPORT' && 'Customer inquiry resolution, view orders, user accounts, and services.'}
                    {role === 'MODERATOR' && 'Product quality moderation, seller reviews, and expert verification.'}
                    {role === 'STAFF' && 'Read-only operational visibility across ecosystem departments.'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {perms.map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delegate Role Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#011B33] border border-[#0682F4]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <UserCheck className="w-4 h-4 text-[#08E6F9]" />
                Delegate Internal Management Role
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-[#CCD2D9] hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">
                  Target User ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste target user ID (e.g. usr_123)"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Assigned Management Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as ManagementRole)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                >
                  <option value="OPERATIONS">OPERATIONS</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="CONTENT_MANAGER">CONTENT MANAGER</option>
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">
                  Audit Justification <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter administrative justification for granting this management role..."
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 text-[#CCD2D9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submittingAssign ? 'Assigning...' : 'Confirm Delegation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
};
