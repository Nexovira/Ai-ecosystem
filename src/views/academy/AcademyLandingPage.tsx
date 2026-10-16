import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAcademy } from '../../context/AcademyContext';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  Users,
  Compass,
  Zap,
} from 'lucide-react';

export const AcademyLandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { courses, categories, loadingCourses } = useAcademy();

  const featuredCourses = courses.filter((c) => c.isFeatured && c.status === 'PUBLISHED').slice(0, 3);
  const displayCourses = featuredCourses.length > 0 ? featuredCourses : courses.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#01213D] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#0682F4]/20 pt-20 pb-28">
        <div className="absolute inset-0 bg-radial-gradient from-[#0682F4]/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0682F4]/10 border border-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#08E6F9]" />
            <span>Nexovira Academy &bull; Cohort Admissions Open</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 uppercase">
            LEARN. BUILD.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0682F4] via-[#06C3F8] to-[#08E6F9]">
              CREATE.
            </span>
          </h1>

          <p className="max-w-3xl text-lg sm:text-xl text-[#CCD2D9] leading-relaxed mb-10">
            Practical digital skills, guided learning and opportunities designed for the next generation of
            technology builders.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={() => navigate('/academy/courses')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#06C3F8] text-[#01213D] font-bold text-base shadow-lg shadow-[#0682F4]/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-5 h-5 text-[#01213D]" />
            </button>
            <a
              href="#scholarship"
              className="px-8 py-4 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-white font-semibold text-base hover:bg-[#0682F4]/10 transition-all flex items-center justify-center gap-2"
            >
              <span>Apply for Scholarship</span>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-[#0682F4]/20">
            <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#0682F4]/20">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">100%</div>
              <div className="text-xs text-[#CCD2D9] uppercase tracking-wider mt-1">Tuition Scholarship</div>
            </div>
            <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#0682F4]/20">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#08E6F9]">₦4,500</div>
              <div className="text-xs text-[#CCD2D9] uppercase tracking-wider mt-1">Application Fee</div>
            </div>
            <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#0682F4]/20">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">11+</div>
              <div className="text-xs text-[#CCD2D9] uppercase tracking-wider mt-1">Tech Tracks</div>
            </div>
            <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#0682F4]/20">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#06C3F8]">1-on-1</div>
              <div className="text-xs text-[#CCD2D9] uppercase tracking-wider mt-1">Cohort Mentorship</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20 border-b border-[#0682F4]/20 bg-[#01213D]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-2">Curated Curriculum</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Featured Academy Tracks</h2>
            </div>
            <button
              onClick={() => navigate('/academy/courses')}
              className="mt-4 md:mt-0 text-sm font-semibold text-[#08E6F9] hover:underline flex items-center gap-1.5"
            >
              <span>View All Courses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-[#01213D] border border-[#0682F4]/20 rounded-2xl h-96" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayCourses.map((course) => (
                <div
                  key={course.courseId}
                  className="group flex flex-col rounded-2xl bg-[#01213D] border border-[#0682F4]/30 overflow-hidden hover:border-[#08E6F9]/60 hover:shadow-xl hover:shadow-[#0682F4]/10 transition-all duration-300"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                    <img
                      src={course.courseImage}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#01213D]/90 backdrop-blur-md border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold">
                      {course.categoryName || course.category}
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#0682F4] text-[#01213D] text-xs font-bold">
                      {course.level}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#CCD2D9] mb-2">
                        <Clock className="w-3.5 h-3.5 text-[#06C3F8]" />
                        <span>{course.duration}</span>
                        <span>&bull;</span>
                        <span>{course.instructorName}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-[#08E6F9] transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-[#CCD2D9] line-clamp-3 mb-4 leading-relaxed">
                        {course.shortDescription}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#0682F4]/20 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-[#CCD2D9] uppercase tracking-wider">Application Fee</div>
                        <div className="text-lg font-extrabold text-[#08E6F9]">₦{course.scholarshipFee.toLocaleString()} NGN</div>
                      </div>
                      <button
                        onClick={() => navigate(`/academy/courses/${course.slug}`)}
                        className="px-4 py-2 rounded-lg bg-[#0682F4]/20 hover:bg-[#0682F4] text-white hover:text-[#01213D] text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Academy Categories Section */}
      <section className="py-20 border-b border-[#0682F4]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-2">Disciplines</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Explore By Specialty</h2>
            <p className="text-[#CCD2D9] text-sm mt-3">
              Comprehensive tracks designed around commercially viable digital professions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/academy/courses?category=${cat.slug}`)}
                className="p-5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 hover:border-[#08E6F9]/50 hover:bg-[#0682F4]/10 transition-all text-left flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#0682F4]/20 text-[#08E6F9] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">{cat.name}</h3>
                  <p className="text-xs text-[#CCD2D9] line-clamp-2">{cat.description}</p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-[#08E6F9] font-semibold">
                  <span>Browse track</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Scholarship Explanation Section */}
      <section id="scholarship" className="py-24 border-b border-[#0682F4]/20 bg-[#01213D]/70 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0682F4]/10 border border-[#0682F4]/30 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-4">
                <Award className="w-3.5 h-3.5" />
                <span>Nexovira Foundation Scholarship</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
                100% Tuition Coverage. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0682F4] to-[#08E6F9]">
                  Zero Tuition Fees for Accepted Scholars.
                </span>
              </h2>
              <p className="text-[#CCD2D9] text-base leading-relaxed mb-6">
                At Nexovira, we believe world-class engineering and product talent shouldn&apos;t be held back by financial
                gatekeeping. Our scholarship program covers full course tuition for qualified candidates upon acceptance.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-[#0682F4]/20 text-[#08E6F9] mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">₦4,500 One-Time Application Fee</h4>
                    <p className="text-xs text-[#CCD2D9]">
                      Protects cohort integrity, covers administrative verification, and validates serious applicant commitment.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-[#0682F4]/20 text-[#08E6F9] mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Guaranteed Form Unlocking</h4>
                    <p className="text-xs text-[#CCD2D9]">
                      Your payment is strictly verified server-side via Paystack. Once verified, your comprehensive registration form unlocks permanently.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-[#0682F4]/20 text-[#08E6F9] mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Exclusive WhatsApp Cohort Community</h4>
                    <p className="text-xs text-[#CCD2D9]">
                      Accepted students receive direct access to their course-specific WhatsApp group to collaborate directly with instructors and peers.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/academy/courses')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#06C3F8] text-[#01213D] font-bold text-base shadow-lg shadow-[#0682F4]/20 hover:opacity-95 transition-all flex items-center gap-2"
              >
                <span>Select Your Course & Apply</span>
                <ArrowRight className="w-5 h-5 text-[#01213D]" />
              </button>
            </div>

            {/* Right Feature Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#01213D] border border-[#0682F4]/40 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#0682F4]/10 rounded-full blur-3xl pointer-events-none" />

              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
                <GraduationCap className="w-6 h-6 text-[#08E6F9]" />
                <span>The Scholarship Journey</span>
              </h3>

              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#0682F4]/30">
                <div className="flex items-start gap-4 relative">
                  <div className="w-7 h-7 rounded-full bg-[#0682F4] text-[#01213D] font-bold text-xs flex items-center justify-center shrink-0 z-10">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Discover & Select Track</h4>
                    <p className="text-xs text-[#CCD2D9] mt-0.5">
                      Review prerequisites, learning outcomes, and course syllabi across 11+ disciplines.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative">
                  <div className="w-7 h-7 rounded-full bg-[#0682F4] text-[#01213D] font-bold text-xs flex items-center justify-center shrink-0 z-10">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Pay ₦4,500 Application Fee</h4>
                    <p className="text-xs text-[#CCD2D9] mt-0.5">
                      Pay securely via Paystack. Your transaction is verified server-side with zero manual delay.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative">
                  <div className="w-7 h-7 rounded-full bg-[#0682F4] text-[#01213D] font-bold text-xs flex items-center justify-center shrink-0 z-10">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Registration Form Unlocked</h4>
                    <p className="text-xs text-[#CCD2D9] mt-0.5">
                      Complete your educational background, learning ambitions, and experience profile.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative">
                  <div className="w-7 h-7 rounded-full bg-[#0682F4] text-[#01213D] font-bold text-xs flex items-center justify-center shrink-0 z-10">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Review & Admission</h4>
                    <p className="text-xs text-[#CCD2D9] mt-0.5">
                      Management assesses your submission. Track application progress inside your student hub.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative">
                  <div className="w-7 h-7 rounded-full bg-[#08E6F9] text-[#01213D] font-bold text-xs flex items-center justify-center shrink-0 z-10">
                    5
                  </div>
                  <div>
                    <h4 className="font-bold text-[#08E6F9] text-sm">Join Course Community</h4>
                    <p className="text-xs text-[#CCD2D9] mt-0.5">
                      Unlock your course&apos;s private WhatsApp group and begin live cohort sessions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academy Benefits Section */}
      <section className="py-24 border-b border-[#0682F4]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold text-[#08E6F9] uppercase tracking-wider mb-2">The Nexovira Advantage</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Why Learn with Nexovira</h2>
            <p className="text-[#CCD2D9] text-sm mt-3">
              We do not teach abstract theory. You graduate with verified projects, code repositories, and an active professional network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/20 hover:border-[#0682F4] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#0682F4]/20 text-[#08E6F9] flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Production-Grade Capstones</h3>
              <p className="text-sm text-[#CCD2D9] leading-relaxed">
                Build and ship actual applications deployed to public domains. No boilerplate tutorial clones.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/20 hover:border-[#0682F4] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#0682F4]/20 text-[#08E6F9] flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Course-Specific Communities</h3>
              <p className="text-sm text-[#CCD2D9] leading-relaxed">
                Direct access to your instructor and cohort via dedicated WhatsApp learning groups for code reviews and Q&A.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/20 hover:border-[#0682F4] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#0682F4]/20 text-[#08E6F9] flex items-center justify-center mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ecosystem Pathway</h3>
              <p className="text-sm text-[#CCD2D9] leading-relaxed">
                Top graduates gain fast-track consideration for Nexovira Tech & Digital Services Expert network and client engagements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 uppercase tracking-tight">
            Ready to Build Your Technology Future?
          </h2>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#CCD2D9] mb-8">
            Admissions for the upcoming cohort are actively processing. Secure your scholarship application now.
          </p>
          <button
            onClick={() => navigate('/academy/courses')}
            className="px-10 py-5 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#08E6F9] text-[#01213D] font-bold text-lg shadow-xl shadow-[#0682F4]/30 hover:opacity-95 transition-all inline-flex items-center gap-2"
          >
            <span>Explore Courses & Apply</span>
            <ArrowRight className="w-5 h-5 text-[#01213D]" />
          </button>
        </div>
      </section>
    </div>
  );
};
