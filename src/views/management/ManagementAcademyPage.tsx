import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAcademy } from '../../context/AcademyContext';
import {
  Course,
  CourseCategory,
  ScholarshipApplication,
  ScholarshipApplicationStatus,
  CourseLevel,
  CourseStatus,
} from '../../types/academy';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  BookOpen,
  Layers,
  CreditCard,
  Bell,
  Eye,
  Edit2,
  Lock,
  Loader2,
  Trash2,
  Save,
} from 'lucide-react';

export const ManagementAcademyPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const {
    courses,
    categories,
    managementApplications,
    fetchManagementApplications,
    reviewApplication,
    saveCourse,
    deleteCourse,
    saveCategory,
    deleteCategory,
    managementPayments,
    fetchManagementPayments,
    managementNotifications,
    fetchManagementNotifications,
    fetchCourses,
  } = useAcademy();

  const isManagement = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(profile?.role || '');

  const [activeTab, setActiveTab] = useState<'applications' | 'courses' | 'categories' | 'payments' | 'notifications'>(
    'applications'
  );

  // Action feedback
  const [academyFeedback, setAcademyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters for Applications Tab
  const [appSearch, setAppSearch] = useState('');
  const [appCourseFilter, setAppCourseFilter] = useState('ALL');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');

  // Application detail modal
  const [selectedApp, setSelectedApp] = useState<{
    application: ScholarshipApplication;
    course: Course | null;
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Course editing modal / state
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  // Category editing state
  const [editingCategory, setEditingCategory] = useState<Partial<CourseCategory> | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<CourseCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  useEffect(() => {
    if (!user || !isManagement) {
      return;
    }

    if (activeTab === 'applications') {
      fetchManagementApplications({
        courseId: appCourseFilter !== 'ALL' ? appCourseFilter : undefined,
        status: appStatusFilter !== 'ALL' ? appStatusFilter : undefined,
        search: appSearch.trim() || undefined,
      });
    } else if (activeTab === 'courses') {
      fetchCourses({ includeAll: true });
    } else if (activeTab === 'payments') {
      fetchManagementPayments();
    } else if (activeTab === 'notifications') {
      fetchManagementNotifications();
    }
  }, [
    user,
    isManagement,
    activeTab,
    appCourseFilter,
    appStatusFilter,
    appSearch,
    fetchManagementApplications,
    fetchCourses,
    fetchManagementPayments,
    fetchManagementNotifications,
  ]);

  if (!user || !isManagement) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white flex items-center justify-center py-24 px-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#01213D] border border-red-500/40 text-center">
          <ShieldAlert className="w-16 h-16 text-[#08E6F9] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Management Access Required</h2>
          <p className="text-sm text-[#CCD2D9] mb-6">
            You must be signed in with an authorized administrative account (Admin, Super Admin, or Staff) to access
            the Academy Management Portal.
          </p>
          <button
            onClick={() => navigate('/signin')}
            className="px-6 py-3 rounded-xl bg-[#0682F4] text-[#01213D] font-bold text-sm hover:opacity-90 transition-all"
          >
            Sign In with Management Credentials
          </button>
        </div>
      </div>
    );
  }

  const handleReviewAction = async (status: ScholarshipApplicationStatus) => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const ok = await reviewApplication(selectedApp.application.applicationId, status, reviewNotes);
      if (ok) {
        setSelectedApp(null);
        setReviewNotes('');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setActionLoading(true);
    try {
      await saveCourse(editingCourse);
      setEditingCourse(null);
      setIsCreatingCourse(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setActionLoading(true);
    try {
      await saveCategory(editingCategory);
      setEditingCategory(null);
      setIsCreatingCategory(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteDeleteCategory = async () => {
    if (!deleteConfirmCategory) return;
    try {
      setDeletingCategory(true);
      setAcademyFeedback(null);
      const res = await deleteCategory(deleteConfirmCategory.id);
      if (res.success) {
        setAcademyFeedback({ type: 'success', message: res.message || `Discipline category ${deleteConfirmCategory.name} processed.` });
        setDeleteConfirmCategory(null);
      } else {
        setAcademyFeedback({ type: 'error', message: res.error || 'Failed to delete category' });
      }
    } finally {
      setDeletingCategory(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#08E6F9] uppercase tracking-wider font-bold mb-1">
              <span>Nexovira Operations Desk</span>
              <span>&bull;</span>
              <span>Academy &amp; Scholarship Registry</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              MANAGEMENT ACADEMY PORTAL
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-md bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold">
              Authorized: {profile?.role || 'STAFF'}
            </span>
          </div>
        </div>

        {academyFeedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between border mb-6 ${
              academyFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/10 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {academyFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0" />
              )}
              <span>{academyFeedback.message}</span>
            </div>
            <button onClick={() => setAcademyFeedback(null)} className="underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#0682F4]/20 mb-8 no-scrollbar">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'applications'
                ? 'bg-[#0682F4] text-[#01213D] shadow-md shadow-[#0682F4]/20'
                : 'bg-[#01213D] text-[#CCD2D9] border border-[#0682F4]/20 hover:border-[#0682F4]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Scholarship Applications ({managementApplications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'courses'
                ? 'bg-[#0682F4] text-[#01213D] shadow-md shadow-[#0682F4]/20'
                : 'bg-[#01213D] text-[#CCD2D9] border border-[#0682F4]/20 hover:border-[#0682F4]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Courses ({courses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'bg-[#0682F4] text-[#01213D] shadow-md shadow-[#0682F4]/20'
                : 'bg-[#01213D] text-[#CCD2D9] border border-[#0682F4]/20 hover:border-[#0682F4]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-[#0682F4] text-[#01213D] shadow-md shadow-[#0682F4]/20'
                : 'bg-[#01213D] text-[#CCD2D9] border border-[#0682F4]/20 hover:border-[#0682F4]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-[#0682F4] text-[#01213D] shadow-md shadow-[#0682F4]/20'
                : 'bg-[#01213D] text-[#CCD2D9] border border-[#0682F4]/20 hover:border-[#0682F4]'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Audit Dispatch Stream</span>
          </button>
        </div>

        {/* TAB 1: APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/25 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#CCD2D9]" />
                <input
                  type="text"
                  placeholder="Search applicant name, email, ref..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-xs text-white placeholder-[#CCD2D9]/60 focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <select
                  value={appCourseFilter}
                  onChange={(e) => setAppCourseFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.courseId} value={c.courseId}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAYMENT_SUCCESS_FORM_PENDING">Payment Verified (Form Pending)</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Applications Table */}
            <div className="rounded-2xl bg-[#01213D] border border-[#0682F4]/25 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#CCD2D9]">
                  <thead className="bg-[#0682F4]/10 text-white uppercase text-[10px] tracking-wider border-b border-[#0682F4]/20">
                    <tr>
                      <th className="px-6 py-3.5">Reference</th>
                      <th className="px-6 py-3.5">Applicant</th>
                      <th className="px-6 py-3.5">Course</th>
                      <th className="px-6 py-3.5">Fee (₦4,500)</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0682F4]/15">
                    {managementApplications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#CCD2D9]">
                          No scholarship applications found.
                        </td>
                      </tr>
                    ) : (
                      managementApplications.map(({ application, course, payment }) => (
                        <tr key={application.applicationId} className="hover:bg-[#0682F4]/5 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-white">
                            {application.applicationReference}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{application.fullName || 'Pending Completion'}</div>
                            <div className="text-[11px] text-[#CCD2D9]">{application.email || application.userId}</div>
                            {application.phone && <div className="text-[11px] text-[#08E6F9]">{application.phone}</div>}
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate">
                            <div className="font-semibold text-white truncate">{course?.title || application.courseTitle}</div>
                            <div className="text-[11px] text-[#06C3F8]">{course?.categoryName || 'Track'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded bg-[#0682F4]/20 text-[#08E6F9] font-bold">
                              ₦{payment?.amount?.toLocaleString() || '4,500'} Paid
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                                application.status === 'ACCEPTED'
                                  ? 'bg-[#08E6F9] text-[#01213D]'
                                  : application.status === 'REJECTED'
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-[#0682F4]/20 text-[#08E6F9]'
                              }`}
                            >
                              {application.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(application.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedApp({ application, course });
                                setReviewNotes(application.internalNotes || '');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#0682F4]/20 hover:bg-[#0682F4] text-white hover:text-[#01213D] font-bold text-xs transition-all inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Review</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COURSES MANAGEMENT */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Course Curriculum Registry</h2>
                <p className="text-xs text-[#CCD2D9]">Manage published tracks, syllabus, duration, and WhatsApp links.</p>
              </div>
              <button
                onClick={() => {
                  setEditingCourse({
                    title: '',
                    slug: '',
                    shortDescription: '',
                    fullDescription: '',
                    category: categories[0]?.slug || 'web-development',
                    duration: '8 Weeks',
                    level: 'Beginner',
                    instructorName: 'Nexovira Faculty',
                    whatsappGroupLink: '',
                    status: 'PUBLISHED',
                    applicationsOpen: true,
                    scholarshipFee: 4500,
                  });
                  setIsCreatingCourse(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4 text-[#01213D]" />
                <span>Create Course</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <div key={c.courseId} className="p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/25 space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'PUBLISHED'
                          ? 'bg-[#08E6F9] text-[#01213D]'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-xs text-[#08E6F9] font-bold">₦4,500 NGN</span>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-1">{c.title}</h3>
                  <p className="text-xs text-[#CCD2D9] line-clamp-2">{c.shortDescription}</p>

                  <div className="text-[11px] text-[#CCD2D9] space-y-1">
                    <div>
                      <strong>Category:</strong> {c.categoryName || c.category}
                    </div>
                    <div>
                      <strong>WhatsApp:</strong>{' '}
                      <span className="text-[#08E6F9] truncate inline-block max-w-[200px] align-bottom">
                        {c.whatsappGroupLink || 'Not configured'}
                      </span>
                    </div>
                    <div>
                      <strong>Applications Open:</strong> {c.applicationsOpen ? 'Yes' : 'No'}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#0682F4]/20 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setEditingCourse({ ...c });
                        setIsCreatingCourse(false);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#0682F4]/20 hover:bg-[#0682F4] text-white hover:text-[#01213D] text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Track</span>
                    </button>

                    {deletingCourseId === c.courseId ? (
                      <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-lg">
                        <span className="text-[10px] text-red-300 font-semibold">Delete?</span>
                        <button
                          onClick={async () => {
                            await deleteCourse(c.courseId);
                            setDeletingCourseId(null);
                          }}
                          className="text-[10px] px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingCourseId(null)}
                          className="text-[10px] text-slate-300 hover:text-white px-1"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingCourseId(c.courseId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Course Track"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Course Disciplines</h2>
                <p className="text-xs text-[#CCD2D9]">Configure specialty categories and visibility.</p>
              </div>
              <button
                onClick={() => {
                  setEditingCategory({
                    name: '',
                    slug: '',
                    description: '',
                    isActive: true,
                    displayOrder: categories.length + 1,
                  });
                  setIsCreatingCategory(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4 text-[#01213D]" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <div key={cat.id} className="p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{cat.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        cat.isActive ? 'bg-[#08E6F9] text-[#01213D]' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-[#CCD2D9] line-clamp-2">{cat.description}</p>
                  <div className="text-[11px] text-[#08E6F9]">Order: #{cat.displayOrder}</div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setEditingCategory({ ...cat });
                        setIsCreatingCategory(false);
                      }}
                      className="flex-1 py-2 rounded-lg bg-[#0682F4]/20 hover:bg-[#0682F4] text-white hover:text-[#01213D] text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmCategory(cat)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-all text-center cursor-pointer"
                      title="Delete Discipline Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS AUDIT */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Scholarship Payment Ledger</h2>
            <div className="rounded-2xl bg-[#01213D] border border-[#0682F4]/25 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#CCD2D9]">
                  <thead className="bg-[#0682F4]/10 text-white uppercase text-[10px] tracking-wider border-b border-[#0682F4]/20">
                    <tr>
                      <th className="px-6 py-3.5">Provider Reference</th>
                      <th className="px-6 py-3.5">Course</th>
                      <th className="px-6 py-3.5">User ID</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Provider</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Verified Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0682F4]/15">
                    {managementPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#CCD2D9]">
                          No scholarship transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      managementPayments.map(({ payment, course }) => (
                        <tr key={payment.paymentId} className="hover:bg-[#0682F4]/5 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-white">
                            {payment.providerReference}
                          </td>
                          <td className="px-6 py-4">{course?.title || payment.courseId}</td>
                          <td className="px-6 py-4 text-[11px] font-mono">{payment.userId}</td>
                          <td className="px-6 py-4 font-bold text-[#08E6F9]">
                            ₦{payment.amount.toLocaleString()} NGN
                          </td>
                          <td className="px-6 py-4">{payment.provider}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                payment.paymentStatus === 'SUCCESS'
                                  ? 'bg-[#08E6F9] text-[#01213D]'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {payment.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {payment.verifiedDate ? new Date(payment.verifiedDate).toLocaleString() : 'Pending'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT DISPATCH STREAM */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Notification &amp; Audit Event Stream</h2>
            <div className="space-y-3">
              {managementNotifications.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#CCD2D9] rounded-2xl bg-[#01213D] border border-[#0682F4]/20">
                  No notification events dispatched yet.
                </div>
              ) : (
                managementNotifications.map((n) => (
                  <div key={n.eventId} className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 flex items-start gap-3">
                    <Bell className="w-4 h-4 text-[#08E6F9] mt-0.5 shrink-0" />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#08E6F9] uppercase">{n.type.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-[#CCD2D9]">{new Date(n.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-white">{n.message}</div>
                      <div className="text-[10px] text-[#CCD2D9] mt-1">
                        Recipient: {n.recipient} ({n.recipientType}) &bull; Ref:{' '}
                        {n.applicationReference || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* APPLICATION REVIEW MODAL */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="max-w-3xl w-full my-8 p-6 sm:p-8 rounded-3xl bg-[#01213D] border border-[#0682F4]/40 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
                <div>
                  <div className="text-xs text-[#08E6F9] font-bold uppercase tracking-wider">
                    Application Review &bull; {selectedApp.application.applicationReference}
                  </div>
                  <h3 className="text-xl font-bold text-white">{selectedApp.course?.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Applicant Profile Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-[#0682F4]/10">
                  <span className="text-[#CCD2D9] block">Full Name:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedApp.application.fullName || 'Pending'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#0682F4]/10">
                  <span className="text-[#CCD2D9] block">Email:</span>
                  <span className="font-bold text-white text-sm">{selectedApp.application.email}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#0682F4]/10">
                  <span className="text-[#CCD2D9] block">Phone / WhatsApp:</span>
                  <span className="font-bold text-[#08E6F9] text-sm">{selectedApp.application.phone}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#0682F4]/10">
                  <span className="text-[#CCD2D9] block">Location:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedApp.application.responses?.city}, {selectedApp.application.responses?.state},{' '}
                    {selectedApp.application.responses?.country}
                  </span>
                </div>
              </div>

              {/* Responses Overview */}
              {selectedApp.application.responses && (
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Why Join This Track:
                    </h4>
                    <p className="p-3 rounded-lg bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9]">
                      {selectedApp.application.responses.whyJoin || 'No response provided'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#08E6F9] uppercase tracking-wider mb-1">Learning Goals:</h4>
                    <p className="p-3 rounded-lg bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9]">
                      {selectedApp.application.responses.learningGoals || 'No response provided'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#08E6F9] uppercase tracking-wider mb-1">
                      Prior Experience:
                    </h4>
                    <p className="p-3 rounded-lg bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9]">
                      {selectedApp.application.responses.previousExperience || 'None stated'}
                    </p>
                  </div>
                </div>
              )}

              {/* Internal Notes (Hidden from Student) */}
              <div>
                <label className="block text-xs font-semibold text-[#08E6F9] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confidential Internal Notes (Staff Only)</span>
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record confidential review remarks or admission conditions..."
                  className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-xs text-white focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              {/* Decision Actions */}
              <div className="pt-4 border-t border-[#0682F4]/20 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#CCD2D9]">
                  Current Status:{' '}
                  <span className="font-bold text-white uppercase">
                    {selectedApp.application.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReviewAction('REJECTED')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 font-bold text-xs transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('UNDER_REVIEW')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-[#0682F4]/20 hover:bg-[#0682F4]/40 text-[#08E6F9] font-bold text-xs transition-all"
                  >
                    <span>Mark Under Review</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('ACCEPTED')}
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-extrabold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md flex items-center gap-1.5"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#01213D]" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#01213D]" />
                    )}
                    <span>Accept Application</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COURSE EDIT / CREATE MODAL */}
        {editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="max-w-2xl w-full my-8 p-6 sm:p-8 rounded-3xl bg-[#01213D] border border-[#0682F4]/40 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
                <h3 className="text-xl font-bold text-white">
                  {isCreatingCourse ? 'Create New Academy Course' : 'Edit Course Track'}
                </h3>
                <button
                  onClick={() => setEditingCourse(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveCourseSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={editingCourse.title || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Category</label>
                    <select
                      value={editingCourse.category || 'web-development'}
                      onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                      className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Skill Level</label>
                    <select
                      value={editingCourse.level || 'Beginner'}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, level: e.target.value as CourseLevel })
                      }
                      className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="All Levels">All Levels</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Duration</label>
                    <input
                      type="text"
                      value={editingCourse.duration || '8 Weeks'}
                      onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                      className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Instructor Name</label>
                    <input
                      type="text"
                      value={editingCourse.instructorName || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, instructorName: e.target.value })}
                      className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">
                    Course WhatsApp Group Link (For accepted students) *
                  </label>
                  <input
                    type="url"
                    placeholder="https://chat.whatsapp.com/..."
                    value={editingCourse.whatsappGroupLink || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, whatsappGroupLink: e.target.value })}
                    className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Short Description</label>
                  <textarea
                    rows={2}
                    value={editingCourse.shortDescription || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, shortDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Full Description</label>
                  <textarea
                    rows={4}
                    value={editingCourse.fullDescription || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, fullDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Publish Status</label>
                    <select
                      value={editingCourse.status || 'PUBLISHED'}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, status: e.target.value as CourseStatus })
                      }
                      className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="UNPUBLISHED">Unpublished</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Applications Open</label>
                    <select
                      value={editingCourse.applicationsOpen ? 'true' : 'false'}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, applicationsOpen: e.target.value === 'true' })
                      }
                      className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                    >
                      <option value="true">Open</option>
                      <option value="false">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#0682F4]/20">
                  <button
                    type="button"
                    onClick={() => setEditingCourse(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-bold text-xs flex items-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#01213D]" /> : <Save className="w-4 h-4 text-[#01213D]" />}
                    <span>Save Course</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CATEGORY EDIT / CREATE MODAL */}
        {editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#01213D] border border-[#0682F4]/40 shadow-2xl space-y-4 text-white">
              <h3 className="text-lg font-bold text-white">
                {isCreatingCategory ? 'New Category' : 'Edit Category'}
              </h3>
              <form onSubmit={handleSaveCategorySubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#01213D] border border-[#0682F4]/30 rounded-lg text-white"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCat"
                    checked={editingCategory.isActive}
                    onChange={(e) => setEditingCategory({ ...editingCategory, isActive: e.target.checked })}
                    className="rounded bg-[#01213D] border-[#0682F4]"
                  />
                  <label htmlFor="isActiveCat" className="text-xs text-[#CCD2D9]">
                    Active in public directory
                  </label>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[#0682F4]/20">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0682F4] text-[#01213D] font-bold text-xs"
                  >
                    Save Category
                  </button>
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
                <h3 className="text-base font-bold text-white">Delete Discipline Category?</h3>
              </div>
              <p className="text-xs text-[#CCD2D9] leading-relaxed">
                You are about to delete <strong>{deleteConfirmCategory.name}</strong> (<span className="font-mono text-[#08E6F9]">{deleteConfirmCategory.slug}</span>).
              </p>
              <div className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-[11px] text-[#CCD2D9] space-y-1">
                <p className="font-semibold text-white">Authoritative Dependency Protection:</p>
                <p>If any courses or student scholarship applications are registered under this category, it will be safely deactivated (<span className="font-mono text-amber-400">isActive: false</span>) to protect enrollment history. If no courses depend on it, it will be permanently removed.</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmCategory(null)}
                  disabled={deletingCategory}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-[#CCD2D9] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
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
      </div>
    </div>
  );
};
