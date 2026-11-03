import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { ProjectStatusBadge } from '../../components/services/ProjectStatusBadge';
import { ProjectRequestStatus, ExpertVerificationStatus, ServiceCategory, ProjectRequest, ExpertProfile, ExpertAvailability } from '../../types/services';
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
  Trash2,
  ShieldAlert,
  X,
} from 'lucide-react';

export const ManagementServicesPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const {
    categories,
    saveCategory,
    deleteCategory,
    managementRequests,
    loadingManagementRequests,
    fetchManagementRequests,
    assignExpert,
    managementExperts,
    loadingManagementExperts,
    fetchManagementExperts,
    createExpertByAdmin,
    setExpertVerification,
    updateExpertProfileByAdmin,
    deleteExpertByAdmin,
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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

  // Category deletion confirmation state
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<ServiceCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<boolean>(false);

  // Expert search and filter state
  const [expertSearchQuery, setExpertSearchQuery] = useState<string>('');
  const [expertStatusFilter, setExpertStatusFilter] = useState<string>('ALL');
  const [expertVisibilityFilter, setExpertVisibilityFilter] = useState<string>('ALL');

  // New Expert modal state
  const [isNewExpertModalOpen, setIsNewExpertModalOpen] = useState<boolean>(false);
  const [newExpFullName, setNewExpFullName] = useState<string>('');
  const [newExpTitle, setNewExpTitle] = useState<string>('');
  const [newExpBio, setNewExpBio] = useState<string>('');
  const [newExpSkills, setNewExpSkills] = useState<string>('');
  const [newExpYears, setNewExpYears] = useState<number>(5);
  const [newExpLocation, setNewExpLocation] = useState<string>('Remote / Global');
  const [newExpCategory, setNewExpCategory] = useState<string>('custom-engineering');
  const [newExpVisibility, setNewExpVisibility] = useState<'PUBLIC' | 'HIDDEN'>('PUBLIC');
  const [newExpAvailability, setNewExpAvailability] = useState<ExpertAvailability>('AVAILABLE');
  const [newExpVerification, setNewExpVerification] = useState<ExpertVerificationStatus>('VERIFIED');
  const [creatingExpert, setCreatingExpert] = useState<boolean>(false);

  // Expert edit modal state
  const [editingExpert, setEditingExpert] = useState<ExpertProfile | null>(null);
  const [expFullName, setExpFullName] = useState<string>('');
  const [expTitle, setExpTitle] = useState<string>('');
  const [expBio, setExpBio] = useState<string>('');
  const [expSkills, setExpSkills] = useState<string>('');
  const [expYears, setExpYears] = useState<number>(5);
  const [expLocation, setExpLocation] = useState<string>('');
  const [expImage, setExpImage] = useState<string>('');
  const [expVisibility, setExpVisibility] = useState<'PUBLIC' | 'HIDDEN'>('PUBLIC');
  const [expAvailability, setExpAvailability] = useState<ExpertAvailability>('AVAILABLE');
  const [expVerificationStatus, setExpVerificationStatus] = useState<ExpertVerificationStatus>('VERIFIED');
  const [savingExpert, setSavingExpert] = useState<boolean>(false);

  // Expert deletion confirmation state
  const [deleteConfirmExpert, setDeleteConfirmExpert] = useState<ExpertProfile | null>(null);
  const [deletingExpert, setDeletingExpert] = useState<boolean>(false);

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
    setActionError(null);
  };

  const handleExecuteAssign = async () => {
    if (!selectedRequest || !assignExpertId) return;
    try {
      setAssigning(true);
      setActionError(null);
      const res = await assignExpert(selectedRequest.requestId, assignExpertId, internalNotes);
      if (res.success) {
        setSelectedRequest(null);
        fetchManagementRequests();
      } else {
        setActionError(res.error || 'Assignment failed');
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleExecuteStatusUpdate = async () => {
    if (!selectedRequest || !newStatus) return;
    try {
      setAssigning(true);
      setActionError(null);
      const res = await updateProjectStatus(selectedRequest.requestId, newStatus, statusNote);
      if (res.success) {
        setSelectedRequest(null);
        fetchManagementRequests();
      } else {
        setActionError(res.error || 'Status update failed');
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

  const handleExecuteDeleteCategory = async () => {
    if (!deleteConfirmCategory) return;
    try {
      setDeletingCategory(true);
      setActionError(null);
      setActionSuccess(null);
      const res = await deleteCategory(deleteConfirmCategory.id);
      if (res.success) {
        setActionSuccess(res.message || 'Category processed successfully.');
        setDeleteConfirmCategory(null);
      } else {
        setActionError(res.error || 'Failed to delete category');
      }
    } finally {
      setDeletingCategory(false);
    }
  };

  const handleOpenNewExpert = () => {
    setNewExpFullName('');
    setNewExpTitle('Senior Technical Specialist');
    setNewExpBio('Verified Nexovira Technology & Digital Services Specialist.');
    setNewExpSkills('Full-Stack Development, Cloud Architecture, DevOps');
    setNewExpYears(5);
    setNewExpLocation('Remote / Global');
    setNewExpCategory(categories[0]?.slug || 'custom-engineering');
    setNewExpVisibility('PUBLIC');
    setNewExpAvailability('AVAILABLE');
    setNewExpVerification('VERIFIED');
    setActionError(null);
    setIsNewExpertModalOpen(true);
  };

  const handleCreateNewExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpFullName.trim()) {
      setActionError('Specialist full name is required.');
      return;
    }
    if (!newExpTitle.trim()) {
      setActionError('Professional title is required.');
      return;
    }

    try {
      setCreatingExpert(true);
      setActionError(null);
      setActionSuccess(null);
      const res = await createExpertByAdmin({
        fullName: newExpFullName.trim(),
        professionalTitle: newExpTitle.trim(),
        bio: newExpBio.trim(),
        skills: newExpSkills.split(',').map((s) => s.trim()).filter(Boolean),
        serviceCategories: [newExpCategory],
        yearsOfExperience: Number(newExpYears) || 1,
        location: newExpLocation.trim() || 'Remote / Global',
        profileVisibility: newExpVisibility,
        availabilityStatus: newExpAvailability,
        verificationStatus: newExpVerification,
      });

      if (res.success) {
        setActionSuccess(`Specialist profile for ${newExpFullName} created with verified status.`);
        setIsNewExpertModalOpen(false);
      } else {
        setActionError(res.error || 'Failed to create specialist profile');
      }
    } finally {
      setCreatingExpert(false);
    }
  };

  const handleOpenEditExpert = (exp: ExpertProfile) => {
    setEditingExpert(exp);
    setExpFullName(exp.fullName);
    setExpTitle(exp.professionalTitle);
    setExpBio(exp.bio);
    setExpSkills(exp.skills.join(', '));
    setExpYears(exp.yearsOfExperience);
    setExpLocation(exp.location);
    setExpImage(exp.profileImage);
    setExpVisibility(exp.profileVisibility);
    setExpAvailability(exp.availabilityStatus);
    setExpVerificationStatus(exp.verificationStatus);
    setActionError(null);
  };

  const handleSaveExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpert) return;
    try {
      setSavingExpert(true);
      setActionError(null);
      setActionSuccess(null);
      const res = await updateExpertProfileByAdmin(editingExpert.expertId, {
        fullName: expFullName.trim(),
        professionalTitle: expTitle.trim(),
        bio: expBio.trim(),
        skills: expSkills.split(',').map((s) => s.trim()).filter(Boolean),
        yearsOfExperience: Number(expYears) || 0,
        location: expLocation.trim(),
        profileImage: expImage.trim() || editingExpert.profileImage,
        profileVisibility: expVisibility,
        availabilityStatus: expAvailability,
        verificationStatus: expVerificationStatus,
      });

      if (res.success) {
        setActionSuccess(`Specialist profile for ${expFullName} updated successfully.`);
        setEditingExpert(null);
      } else {
        setActionError(res.error || 'Failed to update expert profile');
      }
    } finally {
      setSavingExpert(false);
    }
  };

  const handleToggleVerification = async (exp: ExpertProfile) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      const nextStatus: ExpertVerificationStatus = exp.verificationStatus === 'VERIFIED' ? 'SUSPENDED' : 'VERIFIED';
      const nextVisibility = nextStatus === 'VERIFIED' ? 'PUBLIC' : 'HIDDEN';
      const res = await setExpertVerification(exp.expertId, nextStatus, nextVisibility);
      if (res.success) {
        setActionSuccess(`Specialist ${exp.fullName} verification updated to ${nextStatus}.`);
      } else {
        setActionError(res.error || 'Failed to update verification status');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error changing verification status');
    }
  };

  const handleToggleVisibility = async (exp: ExpertProfile) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      const nextVisibility = exp.profileVisibility === 'PUBLIC' ? 'HIDDEN' : 'PUBLIC';
      const res = await updateExpertProfileByAdmin(exp.expertId, { profileVisibility: nextVisibility });
      if (res.success) {
        setActionSuccess(`Specialist ${exp.fullName} directory visibility updated to ${nextVisibility}.`);
      } else {
        setActionError(res.error || 'Failed to update visibility');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error changing visibility');
    }
  };

  const filteredExperts = managementExperts.filter((exp) => {
    if (expertStatusFilter !== 'ALL' && exp.verificationStatus !== expertStatusFilter) return false;
    if (expertVisibilityFilter !== 'ALL' && exp.profileVisibility !== expertVisibilityFilter) return false;
    if (expertSearchQuery.trim()) {
      const q = expertSearchQuery.toLowerCase();
      const matchName = exp.fullName.toLowerCase().includes(q);
      const matchTitle = exp.professionalTitle.toLowerCase().includes(q);
      const matchLocation = exp.location.toLowerCase().includes(q);
      const matchSkills = exp.skills.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchTitle && !matchLocation && !matchSkills) return false;
    }
    return true;
  });

  const handleExecuteDeleteExpert = async () => {
    if (!deleteConfirmExpert) return;
    try {
      setDeletingExpert(true);
      setActionError(null);
      setActionSuccess(null);
      const res = await deleteExpertByAdmin(deleteConfirmExpert.expertId);
      if (res.success) {
        setActionSuccess(res.message || 'Specialist profile processed successfully.');
        setDeleteConfirmExpert(null);
      } else {
        setActionError(res.error || 'Failed to delete specialist profile');
      }
    } finally {
      setDeletingExpert(false);
    }
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
        {actionSuccess && (
          <div className="p-4 rounded-xl text-xs flex items-center justify-between border bg-emerald-500/10 border-emerald-500/40 text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="underline cursor-pointer">Dismiss</button>
          </div>
        )}
        {actionError && (
          <div className="p-4 rounded-xl text-xs flex items-center justify-between border bg-red-500/10 border-red-500/40 text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="underline cursor-pointer">Dismiss</button>
          </div>
        )}

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
          <div className="space-y-6">
            {/* Header stats & Add Specialist Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="text-[#CCD2D9]">
                  Total Specialists: <strong className="text-white font-mono text-sm">{managementExperts.length}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{managementExperts.filter((e) => e.verificationStatus === 'VERIFIED').length} Verified</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{managementExperts.filter((e) => e.verificationStatus === 'PENDING').length} Pending</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{managementExperts.filter((e) => e.profileVisibility === 'PUBLIC').length} Public</span>
                </span>
              </div>

              <Button variant="primary" size="sm" onClick={handleOpenNewExpert} className="shrink-0">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add New Specialist</span>
              </Button>
            </div>

            {/* Search and Filters Toolbar */}
            <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[#0682F4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search specialists by name, title, skill, or location..."
                  value={expertSearchQuery}
                  onChange={(e) => setExpertSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white placeholder-[#CCD2D9]/50 text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={expertStatusFilter}
                  onChange={(e) => setExpertStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9] shrink-0"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified Only</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <select
                  value={expertVisibilityFilter}
                  onChange={(e) => setExpertVisibilityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9] shrink-0"
                >
                  <option value="ALL">All Visibility</option>
                  <option value="PUBLIC">Public in Directory</option>
                  <option value="HIDDEN">Hidden / Unlisted</option>
                </select>
              </div>
            </div>

            {loadingManagementExperts ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08E6F9] mx-auto" />
                <p className="text-xs text-[#CCD2D9] mt-3">Loading specialists directory...</p>
              </div>
            ) : filteredExperts.length === 0 ? (
              <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-12 text-center text-xs text-[#CCD2D9] space-y-3">
                <Users className="w-10 h-10 text-[#0682F4] mx-auto opacity-60" />
                <p className="font-semibold text-white">No specialist profiles match the selected criteria.</p>
                <p className="text-[11px]">Adjust your search query or filters, or register a new specialist.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExperts.map((exp) => (
                  <div
                    key={exp.expertId}
                    className="bg-[#011B33] border border-[#0682F4]/25 hover:border-[#08E6F9]/50 transition-colors rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg"
                  >
                    <div>
                      <div className="flex items-start gap-3.5 mb-3.5">
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#08E6F9]/20 to-[#0682F4]/30 border border-[#08E6F9]/40 flex items-center justify-center font-bold text-xl text-[#08E6F9] shrink-0 shadow-inner">
                          {exp.fullName ? exp.fullName.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-white text-base truncate">{exp.fullName}</h3>
                            {exp.verificationStatus === 'VERIFIED' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#08E6F9] bg-[#08E6F9]/15 px-2 py-0.5 rounded-full border border-[#08E6F9]/30">
                                <CheckCircle2 className="w-3 h-3 text-[#08E6F9]" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#0682F4] font-medium truncate mt-0.5">{exp.professionalTitle}</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#CCD2D9]">
                            <span>{exp.location}</span>
                            <span>•</span>
                            <span>{exp.yearsOfExperience} yrs exp</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-[#0682F4]/20 mb-3 bg-[#01213D]/50 rounded-xl px-3">
                        <div>
                          <span className="text-[10px] text-[#CCD2D9] uppercase tracking-wider block">Vetting</span>
                          <span
                            className={`font-bold inline-flex items-center gap-1 text-[11px] mt-0.5 ${
                              exp.verificationStatus === 'VERIFIED'
                                ? 'text-emerald-400'
                                : exp.verificationStatus === 'PENDING'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {exp.verificationStatus === 'VERIFIED' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : exp.verificationStatus === 'PENDING' ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            {exp.verificationStatus}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#CCD2D9] uppercase tracking-wider block">Visibility</span>
                          <span
                            className={`font-semibold inline-flex items-center gap-1 text-[11px] mt-0.5 ${
                              exp.profileVisibility === 'PUBLIC' ? 'text-cyan-400' : 'text-zinc-400'
                            }`}
                          >
                            {exp.profileVisibility === 'PUBLIC' ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                            {exp.profileVisibility}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#CCD2D9] line-clamp-2 leading-relaxed mb-3">{exp.bio}</p>

                      {exp.skills && exp.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {exp.skills.slice(0, 3).map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9]"
                            >
                              {skill}
                            </span>
                          ))}
                          {exp.skills.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] text-[#CCD2D9] bg-[#01213D]">
                              +{exp.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#0682F4]/20 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleOpenEditExpert(exp)}
                        className="px-3 py-1.5 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                        title="Edit Specialist Profile"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {exp.verificationStatus !== 'VERIFIED' ? (
                        <button
                          onClick={() => handleToggleVerification(exp)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors shadow-sm"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mark Verified</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleVerification(exp)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                          title="Revoke Verification"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Revoke Verified</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleVisibility(exp)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-white text-xs font-medium cursor-pointer flex items-center gap-1 transition-colors"
                        title={exp.profileVisibility === 'PUBLIC' ? 'Unpublish from directory' : 'Publish to directory'}
                      >
                        {exp.profileVisibility === 'PUBLIC' ? (
                          <>
                            <EyeOff className="w-3 h-3 text-zinc-400" />
                            <span className="text-[11px]">Unpublish</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 text-cyan-400" />
                            <span className="text-[11px]">Publish</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setDeleteConfirmExpert(exp)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold cursor-pointer flex items-center gap-1 ml-auto transition-colors"
                        title="Remove Specialist"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
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
                    <div className="flex items-center gap-3">
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

                    <button
                      onClick={() => setDeleteConfirmCategory(c)}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
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

              {actionError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  {actionError}
                </div>
              )}

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

        {/* MODAL: DELETE CATEGORY CONFIRMATION */}
        {deleteConfirmCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#011B33] border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400">
                <Trash2 className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">Delete Service Category?</h3>
              </div>
              <p className="text-xs text-[#CCD2D9] leading-relaxed">
                You are about to remove <strong>{deleteConfirmCategory.name}</strong> (<span className="font-mono text-[#08E6F9]">{deleteConfirmCategory.slug}</span>).
              </p>
              <div className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-[11px] text-[#CCD2D9] space-y-1">
                <p className="font-semibold text-white">Authoritative Dependency Protection:</p>
                <p>If active specialist profiles or client project requests reference this category, it will be safely deactivated (<span className="font-mono text-amber-400">isActive: false</span>) rather than orphaned. If no active bindings exist, it will be permanently removed.</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#0682F4]/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmCategory(null)}
                  disabled={deletingCategory}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteCategory}
                  disabled={deletingCategory}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingCategory ? 'Processing...' : 'Confirm Removal'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDIT EXPERT PROFILE */}
        {editingExpert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#011B33] border border-[#0682F4]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-4">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#08E6F9]" />
                  <h2 className="text-lg font-bold text-white">Edit Specialist Profile</h2>
                </div>
                <button onClick={() => setEditingExpert(null)} className="text-[#CCD2D9] hover:text-white">✕</button>
              </div>

              <form onSubmit={handleSaveExpert} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Full Legal / Professional Name *
                  </label>
                  <input
                    type="text"
                    value={expFullName}
                    onChange={(e) => setExpFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      value={expYears}
                      onChange={(e) => setExpYears(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Location / Region
                    </label>
                    <input
                      type="text"
                      value={expLocation}
                      onChange={(e) => setExpLocation(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Profile Avatar URL
                  </label>
                  <input
                    type="url"
                    value={expImage}
                    onChange={(e) => setExpImage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={expSkills}
                    onChange={(e) => setExpSkills(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Specialist Bio
                  </label>
                  <textarea
                    value={expBio}
                    onChange={(e) => setExpBio(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Directory Visibility
                    </label>
                    <select
                      value={expVisibility}
                      onChange={(e) => setExpVisibility(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs"
                    >
                      <option value="PUBLIC">PUBLIC</option>
                      <option value="HIDDEN">HIDDEN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Availability Status
                    </label>
                    <select
                      value={expAvailability}
                      onChange={(e) => setExpAvailability(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="LIMITED">LIMITED</option>
                      <option value="UNAVAILABLE">UNAVAILABLE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Vetting Status
                    </label>
                    <select
                      value={expVerificationStatus}
                      onChange={(e) => setExpVerificationStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs"
                    >
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#0682F4]/20 flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingExpert(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={savingExpert}>
                    {savingExpert ? 'Saving...' : 'Save Profile Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: REGISTER NEW VERIFIED SPECIALIST */}
        {isNewExpertModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#011B33] border border-[#08E6F9]/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#08E6F9]/10 border border-[#08E6F9]/30 flex items-center justify-center text-[#08E6F9]">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Register Verified Specialist</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewExpertModalOpen(false)}
                  className="text-[#CCD2D9] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {actionError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleCreateNewExpert} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Specialist Full Name *
                  </label>
                  <input
                    type="text"
                    value={newExpFullName}
                    onChange={(e) => setNewExpFullName(e.target.value)}
                    required
                    placeholder="e.g. Elena Rostova"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white placeholder-[#CCD2D9]/40 text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    value={newExpTitle}
                    onChange={(e) => setNewExpTitle(e.target.value)}
                    required
                    placeholder="e.g. Lead Cloud Architect & Distributed Systems"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white placeholder-[#CCD2D9]/40 text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Primary Service Category
                    </label>
                    <select
                      value={newExpCategory}
                      onChange={(e) => setNewExpCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={newExpYears}
                      onChange={(e) => setNewExpYears(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Location / Region
                    </label>
                    <input
                      type="text"
                      value={newExpLocation}
                      onChange={(e) => setNewExpLocation(e.target.value)}
                      placeholder="e.g. Berlin, Germany / Remote"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white placeholder-[#CCD2D9]/40 text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Specialist Bio & Expertise Overview
                  </label>
                  <textarea
                    value={newExpBio}
                    onChange={(e) => setNewExpBio(e.target.value)}
                    rows={3}
                    placeholder="Provide a comprehensive summary of the specialist's engineering background and capabilities..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white placeholder-[#CCD2D9]/40 text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                    Skills & Technologies (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newExpSkills}
                    onChange={(e) => setNewExpSkills(e.target.value)}
                    placeholder="TypeScript, Kubernetes, Microservices, Security Auditing"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white placeholder-[#CCD2D9]/40 text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Directory Visibility
                    </label>
                    <select
                      value={newExpVisibility}
                      onChange={(e) => setNewExpVisibility(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                    >
                      <option value="PUBLIC">PUBLIC</option>
                      <option value="HIDDEN">HIDDEN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Availability Status
                    </label>
                    <select
                      value={newExpAvailability}
                      onChange={(e) => setNewExpAvailability(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="LIMITED">LIMITED</option>
                      <option value="UNAVAILABLE">UNAVAILABLE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Initial Vetting Status
                    </label>
                    <select
                      value={newExpVerification}
                      onChange={(e) => setNewExpVerification(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                    >
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="PENDING">PENDING</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#0682F4]/20 flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsNewExpertModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={creatingExpert}>
                    {creatingExpert ? 'Registering Specialist...' : 'Register Specialist'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DELETE / SUSPEND EXPERT CONFIRMATION */}
        {deleteConfirmExpert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#011B33] border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400">
                <Trash2 className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">Remove Specialist Profile?</h3>
              </div>
              <p className="text-xs text-[#CCD2D9] leading-relaxed">
                You are about to remove <strong>{deleteConfirmExpert.fullName}</strong> ({deleteConfirmExpert.professionalTitle}).
              </p>
              <div className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-[11px] text-[#CCD2D9] space-y-1">
                <p className="font-semibold text-white">Authoritative Dependency Protection:</p>
                <p>If this specialist has active, non-completed client project requests, their profile will be safely suspended and hidden (<span className="font-mono text-amber-400">SUSPENDED / HIDDEN</span>) so existing client milestone workflows remain intact. If no active projects exist, they will be permanently removed.</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#0682F4]/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmExpert(null)}
                  disabled={deletingExpert}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteExpert}
                  disabled={deletingExpert}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingExpert ? 'Processing...' : 'Confirm Removal'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
};
