import React, { useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAcademy } from '../../context/AcademyContext';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  BookOpen,
  MessageCircle,
  FileText,
} from 'lucide-react';

export const CustomerAcademyPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { studentApplications, fetchStudentApplications, loadingApplications } = useAcademy();

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchStudentApplications();
  }, [user, fetchStudentApplications, navigate]);

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumbs & Title */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs text-[#CCD2D9] mb-3">
            <button onClick={() => navigate('/account')} className="hover:text-white transition-colors">
              Account
            </button>
            <span>/</span>
            <span className="text-[#08E6F9] font-medium">Academy &amp; Scholarships</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                STUDENT ACADEMY HUB
              </h1>
              <p className="mt-1 text-sm text-[#CCD2D9]">
                Track your scholarship applications, review statuses, and access course WhatsApp learning groups.
              </p>
            </div>

            <button
              onClick={() => navigate('/academy/courses')}
              className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#06C3F8] text-[#01213D] font-bold text-xs shadow-md shadow-[#0682F4]/20 hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-[#01213D]" />
              <span>Browse More Courses</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loadingApplications ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-[#01213D] border border-[#0682F4]/20 rounded-2xl h-44" />
            ))}
          </div>
        ) : studentApplications.length === 0 ? (
          <div className="p-16 rounded-2xl bg-[#01213D] border border-[#0682F4]/20 text-center max-w-lg mx-auto">
            <GraduationCap className="w-16 h-16 text-[#08E6F9] mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-white mb-2">No Active Scholarship Applications</h3>
            <p className="text-sm text-[#CCD2D9] mb-6">
              You haven&apos;t applied for any Nexovira Academy scholarship tracks yet. Explore our published courses to
              begin.
            </p>
            <button
              onClick={() => navigate('/academy/courses')}
              className="px-6 py-3 rounded-xl bg-[#0682F4] text-[#01213D] font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4 text-[#01213D]" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {studentApplications.map(({ application, course, payment }) => {
              const isFormPending =
                application.status === 'PAYMENT_SUCCESS_FORM_PENDING' || application.status === 'FORM_IN_PROGRESS';
              const isAccepted = application.status === 'ACCEPTED';
              const isUnderReview =
                application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW';

              return (
                <div
                  key={application.applicationId}
                  className="rounded-2xl bg-[#01213D] border border-[#0682F4]/30 shadow-xl overflow-hidden hover:border-[#08E6F9]/50 transition-all"
                >
                  <div className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Course & Reference Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {course?.courseImage ? (
                        <img
                          src={course.courseImage}
                          alt={course.title}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-[#0682F4]/20"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#0682F4]/20 flex items-center justify-center shrink-0 text-[#08E6F9]">
                          <GraduationCap className="w-8 h-8" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9] text-[11px] font-semibold">
                            {course?.categoryName || 'Academy Track'}
                          </span>
                          <span className="text-xs text-[#CCD2D9]">
                            Ref: <strong className="text-white">{application.applicationReference}</strong>
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                          {course?.title || application.courseTitle}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#CCD2D9] pt-1">
                          {course?.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#06C3F8]" />
                              {course.duration}
                            </span>
                          )}
                          <span>&bull;</span>
                          <span>Instructor: {course?.instructorName || 'Nexovira Faculty'}</span>
                          <span>&bull;</span>
                          <span>
                            {application.submittedDate
                              ? `Submitted: ${new Date(application.submittedDate).toLocaleDateString()}`
                              : `Created: ${new Date(application.createdAt).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Next Steps Action */}
                    <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#0682F4]/20">
                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Payment Status */}
                        <div className="px-2.5 py-1 rounded-md bg-[#0682F4]/20 text-[#08E6F9] text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Fee: ₦{payment?.amount?.toLocaleString() || '4,500'} Paid</span>
                        </div>

                        {/* Application Status */}
                        <div
                          className={`px-3 py-1 rounded-md text-xs font-extrabold uppercase ${
                            isAccepted
                              ? 'bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D]'
                              : isUnderReview
                              ? 'bg-[#0682F4]/30 text-[#08E6F9]'
                              : isFormPending
                              ? 'bg-[#01213D] border border-[#08E6F9] text-[#08E6F9]'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {application.status.replace(/_/g, ' ')}
                        </div>
                      </div>

                      {/* Dynamic Next Step Buttons */}
                      <div>
                        {isFormPending && (
                          <button
                            onClick={() => navigate(`/academy/application/${application.applicationId}`)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4 text-[#01213D]" />
                            <span>Complete Registration Form</span>
                          </button>
                        )}

                        {isUnderReview && (
                          <button
                            onClick={() => navigate(`/academy/application/${application.applicationId}/confirmation`)}
                            className="px-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-white hover:bg-[#0682F4]/10 text-xs font-medium transition-all flex items-center gap-1.5"
                          >
                            <span>View Submission</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAccepted && course?.whatsappGroupLink && (
                          <a
                            href={course.whatsappGroupLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-xl bg-[#08E6F9] text-[#01213D] font-extrabold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md flex items-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4 text-[#01213D]" />
                            <span>JOIN COURSE COMMUNITY</span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#01213D]" />
                          </a>
                        )}

                        {application.status === 'REJECTED' && (
                          <div className="text-xs text-[#CCD2D9] flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-[#CCD2D9]" />
                            <span>Application declined at this time</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
