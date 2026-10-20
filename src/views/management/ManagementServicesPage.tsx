import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { ProjectStatusBadge } from '../../components/services/ProjectStatusBadge';
import { ProjectRequestStatus, ExpertVerificationStatus, ServiceCategory, ProjectRequest, ExpertProfile } from '../../types/services';
import {
  Shield,
  Layers,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  ArrowRight,
  Filter,
  AlertCircle,
  Search,
  MessageSquare,
} from 'lucide-react';

export const ManagementServicesPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const {
    categories,
    saveCategory,
    managementRequests,
    loadingManagementRequests,
    fetchManagementRequests,
    assignExpert,
    managementExperts,
    loadingManagementExperts,
    fetchManagementExperts,
    setExpertVerification,
    updateProjectStatus,
    auditLogs,
    loadingAuditLogs,
    fetchAuditLogs,
    notifications,
    loadingNotifications,
    fetchNotifications,
  } = useServices();

  const [activeTab, setActiveTab] = useState<'requests' | 'experts' | 'categories' | 'audit' | 'notifications'>('requests');

  // Request modal / assign state
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [assignExpertId, setAssignExpertId] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [assigning, setAssigning] = useState<boolean>(false);

  // Status override state
  const [newStatus, setNewStatus] = useState<ProjectRequestStatus | ''>('');
  const [statusNote, setStatusNote] = useState<string>('');

  // Category modal state
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [catName, setCatName] = useState<string>('');
  const [catSlug, setCatSlug] = useState<string>('');
  const [catDesc, setCatDesc] = useState<string>('');
  const [catIcon, setCatIcon] = useState<string>('Code');
  const [catActive, setCatActive] = useState<boolean>(true);
  const [catOrder, setCatOrder] = useState<number>(1);
  const [catSkills, setCatSkills] = useState<string>('');

  const isManagement = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(profile?.role || '');

  useEffect(() => {
    if (user && isManagement) {
      fetchManagementRequests();
      fetchManagementExperts();
      fetchAuditLogs();
      fetchNotifications();
    }
  }, [user, isManagement, fetchManagementRequests, fetchManagementExperts, fetchAuditLogs, fetchNotifications]);

  if (!user || !isManagement) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white py-24 px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">Nexovira Management Clearance Required</h1>
        <p className="text-xs text-[#CCD2D9] max-w-md mx-auto">
          Access to ecosystem operational controls is restricted to authorized platform management and staff roles.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          <span>Return to Homepage</span>
        </Button>
      </div>
    );
  }

  const handleOpenAssignModal = (req: ProjectRequest) => {
    setSelectedRequest(req);
    setAssignExpertId(req.assignedExpertId || '');
    setInternalNotes(req.internalNotes || '');
    setNewStatus('');
  };

  const handleExecuteAssign = async () => {
    if (!selectedRequest || !assignExpertId) return;
    try {
      setAssigning(true);
      const res = await assignExpert(selectedRequest.requestId, assignExpertId, internalNotes);
      if (res.success) {
        setSelectedRequest(null);
        fetchManagementRequests();
      } else {
        alert(res.error || 'Assignment failed');
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleExecuteStatusUpdate = async () => {
    if (!selectedRequest || !newStatus) return;
    try {
      setAssigning(true);
      const res = await updateProjectStatus(selectedRequest.requestId, newStatus, statusNote);
      if (res.success) {
        setSelectedRequest(null);
        fetchManagementRequests();
      } else {
        alert(res.error || 'Status update failed');
      }
    } finally {
      setAssigning(false);
    }
  };

  // Category Edit / Create handlers
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatIcon('Code');
    setCatActive(true);
    setCatOrder(categories.length + 1);
    setCatSkills('');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: ServiceCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description);
    setCatIcon(cat.icon);
    setCatActive(cat.isActive);
    setCatOrder(cat.displayOrder);
    setCatSkills(cat.skills.join(', '));
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) return;

    const skillsArr = catSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await saveCategory({
      id: editingCategory?.id,
      name: catName.trim(),
      slug: catSlug.trim().toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: catDesc.trim(),
      icon: catIcon.trim(),
      isActive: catActive,
      displayOrder: Number(catOrder) || 1,
      skills: skillsArr,
    });

    setIsCategoryModalOpen(false);
  };

  return (
    <ManagementLayout
      activeRoute="/management/services"
      title="Tech & Digital Services Management"
      subtitle="Authoritative assignment desk, expert vetting registry, service catalog management, and audit logs."
      requiredPermission="SERVICES_VIEW"
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            fetchManagementRequests();
            fetchManagementExperts();
            fetchAuditLogs();
            fetchNotifications();
          }}
          className="text-xs"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Tab Switcher */}
        <div className="my-8 flex flex-wrap gap-3 border-b border-[#0682F4]/20 pb-4">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#0682F4] text-white shadow-lg shadow-[#0682F4]/20'
                : 'bg-[#011B33] text-[#CCD2D9] border border-[#0682F4]/20 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Project Requests ({managementRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('experts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'experts'
                ? 'bg-[#0682F4] text-white shadow-lg shadow-[#0682F4]/20'
                : 'bg-[#011B33] text-[#CCD2D9] border border-[#0682F4]/20 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Ecosystem Experts ({managementExperts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#0682F4] text-white shadow-lg shadow-[#0682F4]/20'
                : 'bg-[#011B33] text-[#CCD2D9] border border-[#0682F4]/20 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Service Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#0682F4] text-white shadow-lg shadow-[#0682F4]/20'
                : 'bg-[#011B33] text-[#CCD2D9] border border-[#0682F4]/20 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-[#0682F4] text-white shadow-lg shadow-[#0682F4]/20'
                : 'bg-[#011B33] text-[#CCD2D9] border border-[#0682F4]/20 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Notifications ({notifications.length})</span>
          </button>
        </div>

        {/* TAB 1: PROJECT REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {loadingManagementRequests ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08E6F9] mx-auto" />
                <p className="text-xs text-[#CCD2D9] mt-3">Loading incoming requests...</p>
              </div>
            ) : managementRequests.length === 0 ? (
              <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-12 text-center text-xs text-[#CCD2D9]">
                No customer project requests found.
              </div>
            ) : (
              <div className="space-y-3">
                {managementRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="bg-[#011B33] border border-[#0682F4]/25 hover:border-[#08E6F9] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-[#08E6F9] bg-[#08E6F9]/10 px-2.5 py-0.5 rounded border border-[#08E6F9]/30">
                          {req.requestReference}
                        </span>
                        <span className="text-xs text-[#CCD2D9] px-2 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/20">
                          {req.categoryName}
                        </span>
                        <ProjectStatusBadge status={req.status} size="sm" />
                      </div>

                      <h3 className="text-base font-bold text-white">{req.projectTitle}</h3>
                      <p className="text-xs text-[#CCD2D9] line-clamp-1">{req.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#CCD2D9] pt-1">
                        <span>Client: <strong className="text-white">{req.customerName}</strong> ({req.customerEmail})</span>
                        <span>•</span>
                        <span>Budget: {req.currency} {req.budgetMin.toLocaleString()} - {req.budgetMax.toLocaleString()}</span>
                        <span>•</span>
                        <span>
                          Assigned: {req.assignedExpertName ? <strong className="text-emerald-400">{req.assignedExpertName}</strong> : <span className="text-amber-400">Unassigned</span>}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/account/services/${req.requestId}`)}
                        className="text-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />
                        <span>Thread</span>
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenAssignModal(req)}
                        className="text-xs"
                      >
                        <span>Manage & Assign</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXPERTS REGISTRY */}
        {activeTab === 'experts' && (
          <div className="space-y-4">
            {loadingManagementExperts ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08E6F9] mx-auto" />
                <p className="text-xs text-[#CCD2D9] mt-3">Loading experts...</p>
              </div>
            ) : managementExperts.length === 0 ? (
              <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-12 text-center text-xs text-[#CCD2D9]">
                No expert profiles registered in the system.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {managementExperts.map((exp) => (
                  <div
                    key={exp.expertId}
                    className="bg-[#011B33] border border-[#0682F4]/25 rounded-2xl p-6 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={exp.profileImage}
                          alt={exp.fullName}
                          className="w-14 h-14 rounded-xl object-cover border border-[#0682F4]/40 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-white text-base truncate">{exp.fullName}</h3>
                          <p className="text-xs text-[#0682F4] font-medium truncate">{exp.professionalTitle}</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#CCD2D9]">
                            <span>{exp.location}</span>
                            <span>•</span>
                            <span>{exp.yearsOfExperience} yrs</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs py-2 border-y border-[#0682F4]/20 mb-3">
                        <span className="text-[#CCD2D9]">Vetting Status:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            exp.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : exp.verificationStatus === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {exp.verificationStatus}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-[#CCD2D9]">Directory Visibility:</span>
                        <span className="font-semibold text-white">{exp.profileVisibility}</span>
                      </div>

                      <p className="text-xs text-[#CCD2D9] line-clamp-2">{exp.bio}</p>
                    </div>

                    <div className="pt-3 border-t border-[#0682F4]/20 flex flex-wrap items-center gap-2">
                      {exp.verificationStatus !== 'VERIFIED' ? (
                        <button
                          onClick={() => setExpertVerification(exp.expertId, 'VERIFIED', 'PUBLIC')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                        >
                          Verify & Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => setExpertVerification(exp.expertId, 'SUSPENDED', 'HIDDEN')}
                          className="px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          Suspend
                        </button>
                      )}

                      {exp.verificationStatus !== 'REJECTED' && (
                        <button
                          onClick={() => setExpertVerification(exp.expertId, 'REJECTED', 'HIDDEN')}
                          className="px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SERVICE CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#CCD2D9]">
                Total Categories: <strong>{categories.length}</strong> (Active publicly: {categories.filter((c) => c.isActive).length})
              </p>
              <Button variant="primary" size="sm" onClick={handleOpenNewCategory}>
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add New Category</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#011B33] border border-[#0682F4]/25 rounded-2xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#01213D] text-[#08E6F9]">
                        Order: {c.displayOrder}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base">{c.name}</h3>
                    <p className="text-xs text-[#CCD2D9] line-clamp-2">{c.description}</p>
                    <p className="text-[11px] text-[#08E6F9] font-mono">slug: /services/{c.slug}</p>
                  </div>

                  <div className="pt-3 border-t border-[#0682F4]/20 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenEditCategory(c)}
                      className="text-xs font-semibold text-[#08E6F9] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      onClick={() =>
                        saveCategory({
                          ...c,
                          isActive: !c.isActive,
                        })
                      }
                      className="text-xs text-[#CCD2D9] hover:text-white cursor-pointer"
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS (Section 22: Management Action Audit Trail) */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs text-[#CCD2D9]">
                Total Audit Records: <strong>{auditLogs.length}</strong> (Immutable historical ledger of operational actions)
              </p>
              <Button variant="outline" size="sm" onClick={() => fetchAuditLogs()} className="text-xs">
                Refresh Logs
              </Button>
            </div>

            {loadingAuditLogs ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08E6F9] mx-auto" />
                <p className="text-xs text-[#CCD2D9] mt-3">Loading operational audit logs...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-12 text-center text-xs text-[#CCD2D9]">
                No management audit records logged yet.
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.logId}
                    className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/25 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#0682F4]/20 text-[#08E6F9] border border-[#08E6F9]/30">
                          {log.action}
                        </span>
                        <span className="font-bold text-white uppercase text-[11px]">
                          Target: {log.entityType} ({log.entityId})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#CCD2D9]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[#CCD2D9] text-[11px]">
                      <span>Actor: <strong className="text-white">{log.actorEmail || log.actorId}</strong></span>
                      {log.previousState && (
                        <span>Prev: <code className="text-rose-300 font-mono text-[10px]">{log.previousState}</code></span>
                      )}
                      {log.newState && (
                        <span>New: <code className="text-emerald-300 font-mono text-[10px]">{log.newState}</code></span>
                      )}
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="p-2 rounded-lg bg-[#01213D] border border-[#0682F4]/20 font-mono text-[10px] text-[#CCD2D9] overflow-x-auto">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: NOTIFICATIONS (Section 19: Notifications Foundation) */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div>
                <p className="text-xs text-[#CCD2D9]">
                  Total Dispatched Events: <strong>{notifications.length}</strong>
                </p>
                <p className="text-[11px] text-[#08E6F9]">
                  Management Destination: <strong>nexoviratech@gmail.com</strong>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchNotifications()} className="text-xs">
                Refresh Events
              </Button>
            </div>

            {loadingNotifications ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08E6F9] mx-auto" />
                <p className="text-xs text-[#CCD2D9] mt-3">Loading notification events...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-12 text-center text-xs text-[#CCD2D9]">
                No notification events recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.eventId}
                    className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/25 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#08E6F9]/10 text-[#08E6F9] border border-[#08E6F9]/30">
                          {notif.eventType}
                        </span>
                        <span className="font-bold text-white text-sm">
                          {notif.title}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#CCD2D9]">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-[#CCD2D9] leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#CCD2D9] pt-1 border-t border-[#0682F4]/20">
                      <span>Recipient: <strong className="text-white">{notif.recipient}</strong></span>
                      <span>•</span>
                      <span>Role: <strong className="text-[#08E6F9]">{notif.recipientRole}</strong></span>
                      <span>•</span>
                      <span>Ref: <strong className="text-white font-mono">{notif.referenceId}</strong></span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold font-mono">[{notif.status}]</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL: ASSIGN / UPDATE REQUEST */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#011B33] border border-[#0682F4]/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-4">
                <div>
                  <span className="font-mono text-xs text-[#08E6F9] font-bold">
                    {selectedRequest.requestReference}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1">
                    Manage Project Engagement
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-[#CCD2D9] hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Assignment Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1.5">
                    Assign Ecosystem Expert
                  </label>
                  <select
                    value={assignExpertId}
                    onChange={(e) => setAssignExpertId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9] cursor-pointer"
                  >
                    <option value="">Select a Verified Expert</option>
                    {managementExperts
                      .filter((e) => e.verificationStatus === 'VERIFIED')
                      .map((exp) => (
                        <option key={exp.expertId} value={exp.expertId}>
                          {exp.fullName} — {exp.professionalTitle} ({exp.availabilityStatus})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1.5">
                    Internal Management Notes (Confidential)
                  </label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={3}
                    placeholder="Staff notes on scope pricing, contractor SLA, or client risk assessment..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  disabled={assigning || !assignExpertId}
                  onClick={handleExecuteAssign}
                >
                  {assigning ? 'Assigning Expert...' : 'Confirm Expert Assignment'}
                </Button>
              </div>

              {/* Status Override */}
              <div className="pt-4 border-t border-[#0682F4]/20 space-y-3">
                <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider">
                  Update Workflow Status (Authorized Management)
                </label>
                <div className="flex gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ProjectRequestStatus)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs"
                  >
                    <option value="">Select Status to Transition</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="NEEDS_INFORMATION">NEEDS_INFORMATION</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="AWAITING_CUSTOMER">AWAITING_CUSTOMER</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={assigning || !newStatus}
                    onClick={handleExecuteStatusUpdate}
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CATEGORY EDIT / CREATE */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#011B33] border border-[#0682F4]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-4">
                <h2 className="text-lg font-bold text-white">
                  {editingCategory ? 'Edit Service Category' : 'Create New Category'}
                </h2>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="text-[#CCD2D9] hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={catSkills}
                    onChange={(e) => setCatSkills(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={catOrder}
                      onChange={(e) => setCatOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="catActive"
                      checked={catActive}
                      onChange={(e) => setCatActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0682F4]"
                    />
                    <label htmlFor="catActive" className="text-xs text-white cursor-pointer">
                      Active Publicly
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#0682F4]/20 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCategoryModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Save Category
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
};
