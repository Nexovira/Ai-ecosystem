import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAcademy } from '../../context/AcademyContext';
import { ScholarshipApplication, Course } from '../../types/academy';
import {
  CheckCircle2,
  Calendar,
  MessageCircle,
  ExternalLink,
  ArrowRight,
  GraduationCap,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ApplicationConfirmationPageProps {
  applicationId: string;
}

export const ApplicationConfirmationPage: React.FC<ApplicationConfirmationPageProps> = ({ applicationId }) => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { getApplication } = useAcademy();

  const [application, setApplication] = useState<ScholarshipApplication | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!user) {
        navigate('/signin');
        return;
      }

      try {
        const res = await getApplication(applicationId);
        if (!isMounted) return;
        if (res.success && res.application) {
          setApplication(res.application);
          setCourse(res.course || null);
        }
      } catch (err) {
        console.error('Failed to load application confirmation:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [applicationId, user, getApplication, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#08E6F9] mx-auto mb-4" />
          <p className="text-sm text-[#CCD2D9]">Loading application details...</p>
        </div>
      </div>
    );
  }

  const isAccepted = application?.status === 'ACCEPTED';
  const whatsappLink = course?.whatsappGroupLink;

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Confirmation Box */}
        <div className="rounded-3xl bg-[#01213D] border border-[#0682F4]/40 shadow-2xl p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-[#0682F4]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Success Check Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0682F4] to-[#08E6F9] text-[#01213D] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#0682F4]/30">
            <CheckCircle2 className="w-10 h-10 text-[#01213D]" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0682F4]/15 border border-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Application Reference: {application?.applicationReference || 'NEX-SCH-CONFIRMED'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase mb-4">
            APPLICATION RECEIVED
          </h1>

          <p className="text-base sm:text-lg text-[#CCD2D9] max-w-xl mx-auto leading-relaxed mb-8">
            Your Nexovira Academy scholarship application has been successfully submitted and verified.
          </p>

          {/* Course Details Card */}
          <div className="p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/20 text-left mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#0682F4]/20">
              <div>
                <span className="text-[11px] text-[#CCD2D9] uppercase tracking-wider">Enrolled Track</span>
                <h3 className="text-lg font-bold text-white">{course?.title || application?.courseTitle}</h3>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#CCD2D9] uppercase tracking-wider">Application Status</span>
                <div className="inline-block ml-2 px-2.5 py-1 rounded-md bg-[#0682F4]/20 text-[#08E6F9] text-xs font-bold uppercase">
                  {application?.status?.replace(/_/g, ' ') || 'SUBMITTED'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#CCD2D9] block">Tuition Coverage:</span>
                <span className="font-bold text-[#08E6F9]">100% Scholarship</span>
              </div>
              <div>
                <span className="text-[#CCD2D9] block">Application Fee:</span>
                <span className="font-bold text-white">₦4,500 NGN (Paid)</span>
              </div>
              <div>
                <span className="text-[#CCD2D9] block">Submitted Date:</span>
                <span className="font-bold text-white">
                  {application?.submittedDate
                    ? new Date(application.submittedDate).toLocaleDateString()
                    : 'Just now'}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Course Community Card (If Accepted or Available) */}
          {isAccepted && whatsappLink ? (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#01213D] to-[#0682F4]/20 border border-[#08E6F9]/60 text-left mb-8 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#08E6F9] text-[#01213D] flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5 text-[#01213D]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Your Cohort WhatsApp Community is Active!</h4>
                  <p className="text-xs text-[#08E6F9]">Join your peers and mentor for live onboarding &amp; announcements.</p>
                </div>
              </div>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md"
              >
                <span>JOIN COURSE COMMUNITY</span>
                <ExternalLink className="w-4 h-4 text-[#01213D]" />
              </a>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/20 text-left mb-8">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#08E6F9]" />
                <span>What Happens Next?</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#CCD2D9]">
                <li className="flex items-start gap-2">
                  <span className="text-[#08E6F9] font-bold">&bull;</span>
                  <span>
                    Our admissions team reviews your learning goals, background, and commitment to the cohort.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#08E6F9] font-bold">&bull;</span>
                  <span>
                    You will receive status updates via email and inside your student academy dashboard.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#08E6F9] font-bold">&bull;</span>
                  <span>
                    Once accepted, your course-specific WhatsApp group link unlocks so you can meet your mentor and cohort.
                  </span>
                </li>
              </ul>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/account/academy')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0682F4] text-[#01213D] font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0682F4]/20"
            >
              <GraduationCap className="w-4 h-4 text-[#01213D]" />
              <span>Go to Student Hub</span>
            </button>

            <button
              onClick={() => navigate('/academy/courses')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white font-semibold text-sm hover:bg-[#0682F4]/10 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore More Courses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
