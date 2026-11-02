import React from 'react';
import { ArrowRight, GraduationCap, Clock, Award, BookOpen, User } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { INITIAL_COURSES } from '../../data/academyCatalog';
import { Button } from '../common/Button';

export const AcademySection: React.FC = () => {
  const { navigate } = useRouter();

  // Top 3 featured courses
  const featuredCourses = INITIAL_COURSES.slice(0, 3);

  return (
    <section className="py-16 sm:py-24 bg-[#F7F8FA] border-b border-[#E8EDF2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 sm:mb-16">
          <div className="space-y-2">
            <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#0169FA] uppercase">
              Skills &amp; Engineering Education
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14283F] tracking-tight">
              Nexovira Academy
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280] max-w-xl">
              Practical, project-driven learning taught by working senior industry practitioners with verified certificate credentials.
            </p>
          </div>

          <button
            onClick={() => navigate('/academy')}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0169FA] hover:text-[#0148F2] transition-colors cursor-pointer self-start sm:self-auto shrink-0 group"
          >
            <span>Explore All Courses</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Courses Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCourses.map((course) => {
            return (
              <div
                key={course.courseId}
                className="group rounded-3xl bg-white border border-[#E8EDF2] overflow-hidden hover:border-[#028BFA] transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between"
              >
                {/* Course Header Surface (No External Stock Photo) */}
                <div
                  onClick={() => navigate(`/academy/course/${course.slug}`)}
                  className="relative h-32 bg-[#011B33] border-b border-[#0682F4]/20 p-5 flex flex-col justify-between cursor-pointer group-hover:bg-[#01213D] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9]">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9]">
                      {course.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#CCD2D9]/70 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#08E6F9]" />
                    <span>{course.duration}</span>
                    <span>·</span>
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Certificate</span>
                  </div>
                </div>

                {/* Course Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3
                      onClick={() => navigate(`/academy/course/${course.slug}`)}
                      className="font-display font-bold text-base text-[#14283F] group-hover:text-[#0169FA] transition-colors line-clamp-2 cursor-pointer leading-snug"
                    >
                      {course.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B7280] line-clamp-2 leading-relaxed">
                      {course.shortDescription}
                    </p>
                  </div>

                  {/* Instructor Information - Monogram Initials Avatar */}
                  {course.instructorName && (
                    <div className="pt-3 border-t border-[#E8EDF2] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#011B33] text-[#08E6F9] border border-[#0682F4]/30 font-bold text-xs flex items-center justify-center shrink-0">
                        {course.instructorName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#14283F] truncate">
                          {course.instructorName}
                        </div>
                        <div className="text-[11px] text-[#6B7280] truncate">
                          {course.instructorTitle}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View Course Action */}
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => navigate(`/academy/course/${course.slug}`)}
                    className="text-xs group-hover:bg-[#0169FA] group-hover:text-white group-hover:border-[#0169FA] transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View Course</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
