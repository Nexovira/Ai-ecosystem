import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Edit2,
  Lock,
  UserCheck,
  Package,
  Briefcase,
  GraduationCap,
  Share2,
  X,
  Save,
} from 'lucide-react';
import { ManagementUserItem } from '../../types/management';
import { AccountStatus, UserRole } from '../../types/auth';

export const ManagementUsersPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<ManagementUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Status Modal State
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<ManagementUserItem | null>(null);
  const [newStatus, setNewStatus] = useState<AccountStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Role Modal State
  const [selectedUserForRole, setSelectedUserForRole] = useState<ManagementUserItem | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('CUSTOMER');
  const [roleReason, setRoleReason] = useState('');
  const [submittingRole, setSubmittingRole] = useState(false);

  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      if (roleFilter !== 'ALL') queryParams.set('role', roleFilter);

      const res = await fetch(`/api/management/users?${queryParams.toString()}`, {
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading users';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user, profile, statusFilter, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForStatus || !user || !profile) return;
    if (!statusReason.trim()) {
      setActionFeedback({ type: 'error', text: 'Audit reason is required for status changes.' });
      return;
    }

    setSubmittingStatus(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/management/users/${selectedUserForStatus.userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user status');
      }

      setActionFeedback({ type: 'success', text: `Account status updated to ${newStatus}.` });
      setSelectedUserForStatus(null);
      setStatusReason('');
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating status';
      setActionFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRole || !user || !profile) return;
    if (!roleReason.trim()) {
      setActionFeedback({ type: 'error', text: 'Audit reason is required for role modification.' });
      return;
    }

    setSubmittingRole(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/management/users/${selectedUserForRole.userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          role: newRole,
          reason: roleReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user role');
      }

      setActionFeedback({ type: 'success', text: `System role modified to ${newRole}.` });
      setSelectedUserForRole(null);
      setRoleReason('');
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating role';
      setActionFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingRole(false);
    }
  };

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            ACTIVE
          </span>
        );
      case 'RESTRICTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            RESTRICTED
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
            SUSPENDED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            UNDER REVIEW
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CCD2D9]/10 text-[#CCD2D9]">
            {status}
          </span>
        );
    }
  };

  return (
    <ManagementLayout
      activeRoute="/management/users"
      requiredPermission="USERS_VIEW"
      title="User Accounts &amp; Security Desk"
      subtitle="Authoritative administration of all member identities, permissions, account standing, and cross-ecosystem capabilities."
      actions={
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Users ({total})
        </button>
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

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#CCD2D9]/60" />
          <input
            type="text"
            placeholder="Search by name, email, or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#CCD2D9]/70">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="RESTRICTED">RESTRICTED</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#CCD2D9]/70">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="SELLER">SELLER</option>
              <option value="EXPERT">EXPERT</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER ADMIN</option>
              <option value="OPERATIONS">OPERATIONS</option>
              <option value="FINANCE">FINANCE</option>
              <option value="SUPPORT">SUPPORT</option>
              <option value="CONTENT_MANAGER">CONTENT MANAGER</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#CCD2D9]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#08E6F9]" />
            Loading authorized user records...
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#CCD2D9]/60">
            No user records matched your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#01213D] border-b border-[#0682F4]/20 text-[#CCD2D9] font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3">User &amp; Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Standing</th>
                  <th className="px-4 py-3">Ecosystem Activity</th>
                  <th className="px-4 py-3">Capabilities</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0682F4]/10 text-white">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-[#01213D]/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs">{u.fullName}</div>
                      <div className="text-[11px] text-[#CCD2D9]/70 font-mono">{u.email}</div>
                      <div className="text-[10px] text-[#CCD2D9]/40 font-mono mt-0.5">ID: {u.userId}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9]">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(u.accountStatus)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3 text-[11px] text-[#CCD2D9]/80 font-mono">
                        <span title="Marketplace Orders" className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-[#0682F4]" /> {u.ordersCount}
                        </span>
                        <span title="Services Projects" className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-[#26B2E2]" /> {u.servicesCount}
                        </span>
                        <span title="Academy Enrollments" className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-[#08E6F9]" /> {u.academyCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#01213D] border border-[#0682F4]/30 text-[#CCD2D9]"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUserForStatus(u);
                            setNewStatus(u.accountStatus);
                            setStatusReason('');
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] transition cursor-pointer"
                        >
                          Status
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUserForRole(u);
                            setNewRole(u.role);
                            setRoleReason('');
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white transition cursor-pointer"
                        >
                          Role
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Status Modal */}
      {selectedUserForStatus && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#011B33] border border-[#0682F4]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-[#08E6F9]" />
                Update Account Standing
              </div>
              <button
                onClick={() => setSelectedUserForStatus(null)}
                className="text-[#CCD2D9] hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#CCD2D9] space-y-1">
              <div>
                <span className="text-[#CCD2D9]/60">User:</span> <strong className="text-white">{selectedUserForStatus.fullName}</strong>
              </div>
              <div className="font-mono text-[11px]">
                <span className="text-[#CCD2D9]/60">Email:</span> {selectedUserForStatus.email}
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">New Standing</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AccountStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                >
                  <option value="ACTIVE">ACTIVE (Full access granted)</option>
                  <option value="RESTRICTED">RESTRICTED (Limited actions, withdrawals frozen)</option>
                  <option value="SUSPENDED">SUSPENDED (Account completely disabled)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW (Temporary compliance hold)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">
                  Audit Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State operational rationale for changing this user's standing..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setSelectedUserForStatus(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 text-[#CCD2D9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submittingStatus ? 'Saving...' : 'Commit Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modification Modal */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#011B33] border border-[#0682F4]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <UserCheck className="w-4 h-4 text-[#08E6F9]" />
                Modify System Role
              </div>
              <button
                onClick={() => setSelectedUserForRole(null)}
                className="text-[#CCD2D9] hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#CCD2D9] space-y-1">
              <div>
                <span className="text-[#CCD2D9]/60">User:</span> <strong className="text-white">{selectedUserForRole.fullName}</strong>
              </div>
              <div className="font-mono text-[11px]">
                <span className="text-[#CCD2D9]/60">Email:</span> {selectedUserForRole.email}
              </div>
              <div className="text-[11px] text-amber-400">
                Self-elevation is prevented on the server. Super Admin authorization is required to grant admin-level privileges.
              </div>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                >
                  <option value="CUSTOMER">CUSTOMER (Standard consumer)</option>
                  <option value="SELLER">SELLER (Marketplace vendor)</option>
                  <option value="EXPERT">EXPERT (Services specialist)</option>
                  <option value="SUPPORT">SUPPORT (Support specialist)</option>
                  <option value="CONTENT_MANAGER">CONTENT MANAGER (Products &amp; Academy)</option>
                  <option value="OPERATIONS">OPERATIONS (Operations desk)</option>
                  <option value="FINANCE">FINANCE (Payments &amp; Payouts)</option>
                  <option value="ADMIN">ADMIN (General Administrator)</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN (Full Platform Authority)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">
                  Audit Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State formal administrative reason for modifying this role delegation..."
                  value={roleReason}
                  onChange={(e) => setRoleReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setSelectedUserForRole(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 text-[#CCD2D9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRole}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submittingRole ? 'Saving...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
};
