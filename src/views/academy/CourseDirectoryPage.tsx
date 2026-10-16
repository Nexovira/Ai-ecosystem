import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAcademy } from '../../context/AcademyContext';
import { Search, Filter, Clock, ArrowRight, BookOpen, Layers } from 'lucide-react';

export const CourseDirectoryPage: React.FC = () => {
  const { navigate, currentPath } = useRouter();
  const { courses, categories, loadingCourses, fetchCourses } = useAcademy();

  // Parse initial query params from currentPath (e.g. ?category=web-development)
  const initialParams = useMemo(() => {
    const urlParts = currentPath.split('?');
    if (urlParts.length > 1) {
      return new URLSearchParams(urlParts[1]);
    }
    return new URLSearchParams();
  }, [currentPath]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialParams.get('category') || 'ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'title'>('newest');

  useEffect(() => {
    fetchCourses({
      category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      level: selectedLevel !== 'ALL' ? selectedLevel : undefined,
      search: searchQuery.trim() || undefined,
    });
  }, [selectedCategory, selectedLevel, searchQuery, fetchCourses]);

  const filteredAndSortedCourses = useMemo(() => {
    let list = [...courses].filter((c) => c.status === 'PUBLISHED');

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [courses, sortBy]);

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumbs & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-[#CCD2D9] mb-3">
            <button onClick={() => navigate('/academy')} className="hover:text-white transition-colors">
              Academy
            </button>
            <span>/</span>
            <span className="text-[#08E6F9] font-medium">Courses Directory</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            ACADEMY COURSES &amp; TRACKS
          </h1>
          <p className="mt-2 text-base text-[#CCD2D9] max-w-3xl">
            Choose from comprehensive, industry-designed technology curricula. Complete with 100% tuition scholarship
            coverage for admitted students.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/30 shadow-xl mb-10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CCD2D9]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, skills, topics, or mentors..."
                className="w-full pl-11 pr-4 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white placeholder-[#CCD2D9]/60 text-sm focus:outline-none focus:border-[#08E6F9] transition-all"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <div className="relative">
                <Layers className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#08E6F9] pointer-events-none" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all appearance-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Level Dropdown */}
            <div>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#08E6F9] pointer-events-none" />
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 bg-[#01213D] border border-[#0682F4]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#08E6F9] transition-all appearance-none cursor-pointer"
                >
                  <option value="ALL">All Skill Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 no-scrollbar border-t border-[#0682F4]/15">
            <span className="text-xs text-[#CCD2D9] whitespace-nowrap shrink-0">Filter by track:</span>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-[#0682F4] text-[#01213D]'
                  : 'bg-[#01213D] text-[#CCD2D9] border border-[#0682F4]/20 hover:border-[#0682F4]'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-[#0682F4] text-[#01213D]'
                    : 'bg-[#01213D] text-[#CCD2D9] border border-[#0682F4]/20 hover:border-[#0682F4]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info & Sort */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-[#CCD2D9]">
            Showing <span className="font-bold text-white">{filteredAndSortedCourses.length}</span> published course
            {filteredAndSortedCourses.length === 1 ? '' : 's'}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#CCD2D9]">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'title')}
              className="bg-[#01213D] border border-[#0682F4]/30 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="title">Course Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Course Cards Grid */}
        {loadingCourses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-[#01213D] border border-[#0682F4]/20 rounded-2xl h-96" />
            ))}
          </div>
        ) : filteredAndSortedCourses.length === 0 ? (
          <div className="p-16 rounded-2xl bg-[#01213D] border border-[#0682F4]/20 text-center max-w-xl mx-auto">
            <BookOpen className="w-12 h-12 text-[#08E6F9] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Matching Courses Found</h3>
            <p className="text-sm text-[#CCD2D9] mb-6">
              We couldn&apos;t find courses matching your current filters. Try selecting a different category or clearing
              your search term.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedLevel('ALL');
              }}
              className="px-6 py-2.5 rounded-xl bg-[#0682F4] text-[#01213D] font-bold text-sm hover:opacity-90 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedCourses.map((course) => (
              <div
                key={course.courseId}
                className="group flex flex-col rounded-2xl bg-[#01213D] border border-[#0682F4]/30 overflow-hidden hover:border-[#08E6F9]/60 hover:shadow-2xl hover:shadow-[#0682F4]/15 transition-all duration-300"
              >
                {/* Course Header Image */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-900">
                  <img
                    src={course.courseImage}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#01213D] via-transparent to-transparent opacity-60" />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-[#01213D]/90 backdrop-blur-md border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold">
                    {course.categoryName || course.category}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#0682F4] text-[#01213D] text-xs font-bold">
                    {course.level}
                  </div>
                  {course.isFeatured && (
                    <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-[#08E6F9] text-[#01213D] text-[10px] font-extrabold uppercase tracking-wide">
                      Featured
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#CCD2D9] mb-2.5">
                      <Clock className="w-3.5 h-3.5 text-[#06C3F8]" />
                      <span>{course.duration}</span>
                      <span>&bull;</span>
                      <span className="truncate">{course.instructorName}</span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-[#08E6F9] transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-sm text-[#CCD2D9] line-clamp-3 mb-4 leading-relaxed">
                      {course.shortDescription}
                    </p>

                    {/* Key Outcomes Teaser */}
                    {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                      <div className="space-y-1 mb-4">
                        <div className="text-[11px] font-semibold text-[#08E6F9] uppercase tracking-wider">
                          Key Learning:
                        </div>
                        <div className="text-xs text-[#CCD2D9] line-clamp-2">
                          &bull; {course.learningOutcomes.slice(0, 2).join(' • ')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer with Price & Apply CTA */}
                  <div className="pt-4 border-t border-[#0682F4]/20 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#CCD2D9] uppercase tracking-wider">Application Fee</div>
                      <div className="text-lg font-extrabold text-[#08E6F9]">
                        ₦{course.scholarshipFee.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-[#CCD2D9]">NGN</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/academy/courses/${course.slug}`)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0682F4] to-[#06C3F8] text-[#01213D] font-bold text-xs shadow-md shadow-[#0682F4]/20 hover:opacity-95 transition-all flex items-center gap-1.5"
                    >
                      <span>View &amp; Apply</span>
                      <ArrowRight className="w-4 h-4 text-[#01213D]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
