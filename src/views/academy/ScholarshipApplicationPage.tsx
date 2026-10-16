import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAcademy } from '../../context/AcademyContext';
import { ScholarshipApplication, Course, ApplicationResponses } from '../../types/academy';
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface ScholarshipApplicationPageProps {
  applicationId: string;
}

export const ScholarshipApplicationPage: React.FC<ScholarshipApplicationPageProps> = ({ applicationId }) => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const { getApplication, submitRegistration } = useAcademy();

  const [application, setApplication] = useState<ScholarshipApplication | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [educationalBackground, setEducationalBackground] = useState('');
  const [currentOccupation, setCurrentOccupation] = useState('');
  const [whyJoin, setWhyJoin] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [previousExperience, setPreviousExperience] = useState('');
  const [howCourseWillHelp, setHowCourseWillHelp] = useState('');
  const [techExperience, setTechExperience] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Load application with strict ownership check
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!user) {
        sessionStorage.setItem('nexovira_redirect_after_auth', `/academy/application/${applicationId}`);
        navigate('/signin');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await getApplication(applicationId);
        if (!isMounted) return;

        if (!res.success || !res.application) {
          setError(res.error || 'Unable to access application.');
          return;
        }

        // Anti-IDOR check
        if (res.application.userId !== user.uid && !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(profile?.role || '')) {
          setError('Unauthorized access. You can only view your own scholarship application.');
          return;
        }

        // If already submitted, forward to confirmation or status view
        if (['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED'].includes(res.application.status)) {
          navigate(`/academy/application/${applicationId}/confirmation`);
          return;
        }

        setApplication(res.application);
        setCourse(res.course || null);

        // Pre-fill fields with user account info or existing responses
        setFullName(res.application.fullName || profile?.fullName || user.displayName || '');
        setEmail(res.application.email || user.email || '');
        setPhone(res.application.phone || profile?.phoneNumber || '');

        if (res.application.responses) {
          const r = res.application.responses;
          if (r.country) setCountry(r.country);
          if (r.state) setState(r.state);
          if (r.city) setCity(r.city);
          if (r.educationalBackground) setEducationalBackground(r.educationalBackground);
          if (r.currentOccupation) setCurrentOccupation(r.currentOccupation);
          if (r.whyJoin) setWhyJoin(r.whyJoin);
          if (r.learningGoals) setLearningGoals(r.learningGoals);
          if (r.previousExperience) setPreviousExperience(r.previousExperience);
          if (r.howCourseWillHelp) setHowCourseWillHelp(r.howCourseWillHelp);
          if (r.techExperience) setTechExperience(r.techExperience);
          if (r.additionalInfo) setAdditionalInfo(r.additionalInfo);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load application.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [applicationId, user, profile, getApplication, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!fullName.trim() || !email.trim() || !phone.trim() || !state.trim() || !whyJoin.trim() || !educationalBackground.trim()) {
      setFormError('Please fill in all required fields indicated with *.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    const responses: ApplicationResponses = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      country: country.trim(),
      state: state.trim(),
      city: city.trim(),
      educationalBackground: educationalBackground.trim(),
      currentOccupation: currentOccupation.trim(),
      whyJoin: whyJoin.trim(),
      learningGoals: learningGoals.trim(),
      previousExperience: previousExperience.trim(),
      howCourseWillHelp: howCourseWillHelp.trim(),
      techExperience: techExperience.trim(),
      additionalInfo: additionalInfo.trim(),
    };

    try {
      const res = await submitRegistration(applicationId, responses);
      if (!res.success) {
        throw new Error(res.error || 'Failed to submit scholarship registration.');
      }
      navigate(`/academy/application/${applicationId}/confirmation`);
    } catch (err: unknown) {
      setSubmitting(false);
      setFormError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#08E6F9] mx-auto mb-4" />
          <p className="text-sm text-[#CCD2D9]">Verifying scholarship access &amp; loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white flex items-center justify-center py-24 px-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/30 text-center">
          <Lock className="w-12 h-12 text-[#08E6F9] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Registration Form Locked</h2>
          <p className="text-sm text-[#CCD2D9] mb-6">
            {error || 'A verified ₦4,500 NGN scholarship fee payment is required to unlock this registration form.'}
          </p>
          <button
            onClick={() => navigate('/academy/courses')}
            className="px-6 py-3 rounded-xl bg-[#0682F4] text-[#01213D] font-bold text-sm hover:opacity-90 transition-all"
          >
            Explore Academy Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Step Progress Indicator */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/30 shadow-xl mb-10">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#0682F4] text-[#01213D] font-bold flex items-center justify-center mb-1">
                <CheckCircle2 className="w-5 h-5 text-[#01213D]" />
              </div>
              <span className="font-bold text-[#08E6F9]">1. Payment Verified</span>
              <span className="text-[10px] text-[#CCD2D9]">₦4,500 Paid</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-bold flex items-center justify-center mb-1 animate-pulse">
                2
              </div>
              <span className="font-bold text-white">2. Registration</span>
              <span className="text-[10px] text-[#08E6F9]">Form Unlocked</span>
            </div>
            <div className="flex flex-col items-center opacity-60">
              <div className="w-8 h-8 rounded-full bg-[#01213D] border border-[#0682F4]/40 text-[#CCD2D9] font-bold flex items-center justify-center mb-1">
                3
              </div>
              <span className="font-bold text-[#CCD2D9]">3. Review &amp; Access</span>
              <span className="text-[10px] text-[#CCD2D9]">Cohort Community</span>
            </div>
          </div>
        </div>

        {/* Application Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0682F4]/10 border border-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-3">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Scholarship Registration &bull; Reference: {application.applicationReference}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Complete Your Registration</h1>
          <p className="mt-2 text-sm text-[#CCD2D9]">
            Enrolling for:{' '}
            <span className="font-bold text-white">
              {course?.title || application.courseTitle || 'Nexovira Academy Track'}
            </span>
          </p>
        </div>

        {formError && (
          <div className="p-4 rounded-xl bg-[#01213D] border border-red-500/50 text-red-200 text-sm mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* The Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Personal & Contact Information */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/25 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#0682F4]/20 text-[#08E6F9] text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Personal &amp; Contact Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chukwuma Obi"
                  className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. chukwuma@example.com"
                  className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  WhatsApp Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 801 234 5678"
                  className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
                />
                <span className="text-[11px] text-[#CCD2D9]/70 mt-1 block">
                  Used for admissions verification &amp; WhatsApp community admission.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  State / Region *
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Lagos, Abuja, Rivers, etc."
                  className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  City / Town
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Ikeja, Lekki, Port Harcourt"
                  className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Educational & Professional Background */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/25 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#0682F4]/20 text-[#08E6F9] text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Educational &amp; Professional Background</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  Highest Level of Education *
                </label>
                <select
                  required
                  value={educationalBackground}
                  onChange={(e) => setEducationalBackground(e.target.value)}
                  className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
                >
                  <option value="">Select Level</option>
                  <option value="High School / Secondary">High School / Secondary</option>
                  <option value="Undergraduate Student">Undergraduate Student</option>
                  <option value="Bachelor's Degree">Bachelor&apos;s Degree</option>
                  <option value="Master's / Postgraduate">Master&apos;s / Postgraduate</option>
                  <option value="Self-Taught / Other">Self-Taught / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  Current Status / Occupation *
                </label>
                <input
                  type="text"
                  required
                  value={currentOccupation}
                  onChange={(e) => setCurrentOccupation(e.target.value)}
                  placeholder="e.g. Student, Software Intern, Designer, Freelancer"
                  className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Previous Technical or Relevant Experience
              </label>
              <textarea
                rows={3}
                value={previousExperience}
                onChange={(e) => setPreviousExperience(e.target.value)}
                placeholder="Briefly describe any prior coding, design, or digital tools experience you have (no experience is completely fine for beginner tracks)."
                className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
              />
            </div>
          </div>

          {/* Section 3: Learning Goals & Motivation */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/25 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#0682F4]/20 text-[#08E6F9] text-xs flex items-center justify-center font-bold">
                3
              </span>
              <span>Learning Goals &amp; Scholarship Motivation</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Why do you want to join this course? *
              </label>
              <textarea
                required
                rows={3}
                value={whyJoin}
                onChange={(e) => setWhyJoin(e.target.value)}
                placeholder="Explain what motivates you to pursue this track and what you hope to achieve upon completion."
                className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                What are your specific learning objectives? *
              </label>
              <textarea
                required
                rows={3}
                value={learningGoals}
                onChange={(e) => setLearningGoals(e.target.value)}
                placeholder="What projects or capabilities are you aiming to build by the end of the cohort?"
                className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                How will this course help your career or business?
              </label>
              <textarea
                rows={2}
                value={howCourseWillHelp}
                onChange={(e) => setHowCourseWillHelp(e.target.value)}
                placeholder="e.g. Transitioning into engineering, landing freelance clients, launching a startup product"
                className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Additional Comments / Information
              </label>
              <textarea
                rows={2}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Any links to your GitHub, portfolio, LinkedIn, or special circumstances you would like the review board to know."
                className="w-full px-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#CCD2D9] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#08E6F9]" />
              <span>Your responses will be securely reviewed by the Nexovira Admissions Board.</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-[#0682F4]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#01213D]" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <span>Submit Scholarship Application</span>
                  <ArrowRight className="w-4 h-4 text-[#01213D]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
