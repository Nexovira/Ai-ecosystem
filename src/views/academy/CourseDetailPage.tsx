import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAcademy } from '../../context/AcademyContext';
import { Course } from '../../types/academy';
import { ReviewsSection } from '../../components/reviews/ReviewsSection';
import {
  Clock,
  Award,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Lock,
} from 'lucide-react';

interface CourseDetailPageProps {
  slug: string;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({ slug }) => {
  const { navigate, currentPath } = useRouter();
  const { user } = useAuth();
  const { getCourseBySlug, initiateScholarshipPayment, verifyScholarshipPayment } = useAcademy();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Payment states
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentNotice, setPaymentNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Check URL query parameters for callback verification or apply trigger
  const searchParams = new URLSearchParams(currentPath.includes('?') ? currentPath.split('?')[1] : '');
  const verifyParam = searchParams.get('verify_payment') === 'true';
  const referenceParam = searchParams.get('reference');
  const applyParam = searchParams.get('apply') === 'true';

  // Load course details
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const found = await getCourseBySlug(slug);
        if (!isMounted) return;
        if (!found) {
          setError('Course not found or is currently unpublished.');
        } else {
          setCourse(found);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load course details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [slug, getCourseBySlug]);

  const handleApplyClick = useCallback(async () => {
    if (!course) return;

    // STEP 3: Require authentication
    if (!user) {
      // Store intended return route and redirect to sign in
      sessionStorage.setItem('nexovira_redirect_after_auth', `/academy/courses/${course.slug}?apply=true`);
      navigate('/signin');
      return;
    }

    if (!course.applicationsOpen) {
      setPaymentNotice({
        type: 'error',
        message: 'Applications are currently closed for this course cohort.',
      });
      return;
    }

    setIsProcessingPayment(true);
    setPaymentNotice(null);

    try {
      const res = await initiateScholarshipPayment(course.courseId);

      // Duplicate protection: Already paid and form pending!
      if (res.alreadyPaid && res.applicationId) {
        setPaymentNotice({
          type: 'info',
          message: 'Payment already verified for this course. Redirecting to your unlocked registration form...',
        });
        setTimeout(() => {
          navigate(`/academy/application/${res.applicationId}`);
        }, 1200);
        return;
      }

      // Duplicate protection: Already completed application!
      if (res.alreadyCompleted && res.applicationId) {
        setPaymentNotice({
          type: 'info',
          message: res.message || 'You have already submitted an application for this course. Redirecting to your dashboard...',
        });
        setTimeout(() => {
          navigate('/account/academy');
        }, 1500);
        return;
      }

      if (!res.success || !res.authorizationUrl) {
        throw new Error(res.message || 'Failed to initiate scholarship payment. Please try again.');
      }

      // Redirect to Paystack secure checkout (or test callback URL)
      window.location.href = res.authorizationUrl;
    } catch (err: unknown) {
      setIsProcessingPayment(false);
      const msg = err instanceof Error ? err.message : 'Failed to process payment';
      setPaymentNotice({ type: 'error', message: msg });
    }
  }, [course, user, initiateScholarshipPayment, navigate]);

  // Handle Return from Paystack with verification reference
  useEffect(() => {
    if (verifyParam && referenceParam && !isVerifying) {
      setIsVerifying(true);
      setPaymentNotice({
        type: 'info',
        message: 'Verifying your payment server-side with Paystack. Please do not close this window...',
      });

      verifyScholarshipPayment(referenceParam).then((res) => {
        setIsVerifying(false);
        if (res.success && res.verified && res.applicationId) {
          setPaymentNotice({
            type: 'success',
            message: 'Payment verified successfully! Unlocking your scholarship registration form...',
          });
          setTimeout(() => {
            navigate(`/academy/application/${res.applicationId}`);
          }, 1500);
        } else {
          setPaymentNotice({
            type: 'error',
            message: res.error || 'Payment verification failed. If your account was debited, please contact admissions.',
          });
        }
      });
    }
  }, [verifyParam, referenceParam, isVerifying, verifyScholarshipPayment, navigate]);

  // Handle returning after sign in with ?apply=true
  useEffect(() => {
    if (applyParam && user && course && !isProcessingPayment && !verifyParam) {
      handleApplyClick();
    }
  }, [applyParam, user, course, isProcessingPayment, verifyParam, handleApplyClick]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#08E6F9] mx-auto mb-4" />
          <p className="text-sm text-[#CCD2D9]">Loading course curriculum...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white flex items-center justify-center py-24 px-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/30 text-center">
          <AlertCircle className="w-12 h-12 text-[#08E6F9] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Course Unavailable</h2>
          <p className="text-sm text-[#CCD2D9] mb-6">{error || 'This course is currently not published.'}</p>
          <button
            onClick={() => navigate('/academy/courses')}
            className="px-6 py-3 rounded-xl bg-[#0682F4] text-[#01213D] font-bold text-sm hover:opacity-90 transition-all"
          >
            Explore Available Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-[#CCD2D9] mb-8">
          <button onClick={() => navigate('/academy')} className="hover:text-white transition-colors">
            Academy
          </button>
          <span>/</span>
          <button onClick={() => navigate('/academy/courses')} className="hover:text-white transition-colors">
            Courses
          </button>
          <span>/</span>
          <span className="text-[#08E6F9] font-medium truncate max-w-xs">{course.title}</span>
        </div>

        {/* Verification / Notice Banner */}
        {paymentNotice && (
          <div
            className={`p-4 rounded-xl border mb-8 flex items-center gap-3 ${
              paymentNotice.type === 'success'
                ? 'bg-[#0682F4]/20 border-[#08E6F9] text-white'
                : paymentNotice.type === 'error'
                ? 'bg-[#01213D] border-red-500/40 text-red-200'
                : 'bg-[#0682F4]/10 border-[#0682F4]/40 text-[#08E6F9]'
            }`}
          >
            {isVerifying ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0 text-[#08E6F9]" />
            ) : paymentNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#08E6F9]" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <div className="text-sm font-medium">{paymentNotice.message}</div>
          </div>
        )}

        {/* Course Header Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
          {/* Main Title & Overview Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-md bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold">
                {course.categoryName || course.category}
              </span>
              <span className="px-3 py-1 rounded-md bg-[#0682F4] text-[#01213D] text-xs font-bold">
                {course.level}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#CCD2D9]">
                <Clock className="w-3.5 h-3.5 text-[#06C3F8]" />
                {course.duration}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-lg text-[#CCD2D9] leading-relaxed">{course.shortDescription}</p>

            {/* Instructor Summary */}
            <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 flex items-center gap-4">
              {course.instructorImage ? (
                <img
                  src={course.instructorImage}
                  alt={course.instructorName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#0682F4]"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#0682F4]/20 border border-[#0682F4]/40 flex items-center justify-center font-bold text-lg text-[#08E6F9]">
                  {course.instructorName.charAt(0)}
                </div>
              )}
              <div>
                <div className="text-xs text-[#CCD2D9] uppercase tracking-wider">Lead Instructor &amp; Mentor</div>
                <div className="text-base font-bold text-white">{course.instructorName}</div>
                {course.instructorTitle && (
                  <div className="text-xs text-[#06C3F8]">{course.instructorTitle}</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Action / Scholarship Enrollment Box */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-[#01213D] border border-[#0682F4]/40 shadow-2xl p-6 sm:p-8 space-y-6">
              {/* Media Preview */}
              <div className="rounded-xl overflow-hidden h-44 w-full bg-slate-900 border border-[#0682F4]/20 relative">
                <img src={course.courseImage} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#01213D] via-transparent to-transparent opacity-70" />
              </div>

              {/* Price & Coverage */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs uppercase tracking-wider text-[#CCD2D9]">Scholarship Application</span>
                  <span className="px-2 py-0.5 rounded bg-[#08E6F9]/10 text-[#08E6F9] text-xs font-bold">
                    100% Tuition Covered
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-white">
                  ₦{course.scholarshipFee.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[#CCD2D9]">NGN Fee</span>
                </div>
                <p className="text-xs text-[#CCD2D9] mt-1.5 leading-relaxed">
                  One-time application &amp; identity verification fee. Admitted scholars pay ₦0 tuition.
                </p>
              </div>

              {/* Primary Apply Button */}
              {course.applicationsOpen ? (
                <button
                  onClick={handleApplyClick}
                  disabled={isProcessingPayment || isVerifying}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-[#0682F4]/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#01213D]" />
                      <span>Initiating Paystack...</span>
                    </>
                  ) : (
                    <>
                      <span>APPLY FOR SCHOLARSHIP</span>
                      <ArrowRight className="w-4 h-4 text-[#01213D]" />
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-[#01213D] border border-slate-700 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-sm mb-1">
                    <Lock className="w-4 h-4" />
                    <span>Applications Closed</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Cohort admissions are currently at capacity. Check back soon for the next batch.
                  </p>
                </div>
              )}

              {/* Guarantees */}
              <div className="space-y-3 pt-4 border-t border-[#0682F4]/20 text-xs text-[#CCD2D9]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#08E6F9] shrink-0" />
                  <span>Secured &amp; verified via Paystack</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#08E6F9] shrink-0" />
                  <span>Verified Nexovira Academy Certificate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0" />
                  <span>Permanent form unlock upon verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Curriculum & Information Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {/* Full Course Description */}
            <section className="p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/25">
              <h2 className="text-2xl font-bold text-white mb-4">Course Overview</h2>
              <p className="text-[#CCD2D9] text-base leading-relaxed whitespace-pre-line">
                {course.fullDescription}
              </p>
            </section>

            {/* What Students Will Learn (Outcomes) */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <section className="p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/25">
                <h2 className="text-2xl font-bold text-white mb-6">What You Will Learn &amp; Master</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.learningOutcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-[#0682F4]/20 text-[#08E6F9] mt-0.5 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-[#CCD2D9] leading-snug">{outcome}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Course Syllabus / Modules */}
            {course.syllabus && course.syllabus.length > 0 && (
              <section className="p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/25">
                <h2 className="text-2xl font-bold text-white mb-6">Cohort Curriculum &amp; Syllabus</h2>
                <div className="space-y-4">
                  {course.syllabus.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-0.5 rounded bg-[#0682F4]/20 text-[#08E6F9] font-bold text-xs">
                          Week {item.week}
                        </span>
                        <h3 className="font-bold text-white text-base">{item.title}</h3>
                      </div>
                      <ul className="text-xs text-[#CCD2D9] space-y-1 list-disc list-inside ml-2">
                        {item.topics.map((t, tidx) => (
                          <li key={tidx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Requirements & Prerequisites */}
            {course.requirements && course.requirements.length > 0 && (
              <section className="p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/25">
                <h2 className="text-2xl font-bold text-white mb-6">Prerequisites &amp; Requirements</h2>
                <div className="space-y-3">
                  {course.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#08E6F9] mt-2 shrink-0" />
                      <span className="text-sm text-[#CCD2D9]">{req}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar Additional Information */}
          <div className="space-y-6">
            {/* Instructor Details Card */}
            <div className="p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/25">
              <h3 className="text-lg font-bold text-white mb-4">Instructor Profile</h3>
              <p className="text-xs text-[#CCD2D9] leading-relaxed">
                {course.instructorProfile ||
                  `${course.instructorName} is a vetted member of the Nexovira Faculty with extensive industry track record.`}
              </p>
            </div>

            {/* Admission Schedule */}
            <div className="p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/25">
              <h3 className="text-lg font-bold text-white mb-4">Cohort Schedule</h3>
              <div className="space-y-3 text-xs text-[#CCD2D9]">
                <div className="flex items-center justify-between pb-2 border-b border-[#0682F4]/20">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#08E6F9]" />
                    Application Deadline:
                  </span>
                  <span className="font-semibold text-white">Open Batch</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#0682F4]/20">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#08E6F9]" />
                    Live Sessions:
                  </span>
                  <span className="font-semibold text-white">Evenings &amp; Weekends</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#08E6F9]" />
                    Capstone Presentation:
                  </span>
                  <span className="font-semibold text-white">Final Week</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Student Feedback & Course Ratings */}
        <ReviewsSection
          entityType="COURSE"
          entityId={course.courseId}
          entityTitle={course.title}
          className="mt-14"
        />
      </div>
    </div>
  );
};
