import React, { useState, useMemo } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import {
  Search,
  Filter,
  CheckCircle2,
  Star,
  ArrowRight,
  ArrowLeft,
  Users,
  Briefcase,
  X,
} from 'lucide-react';

export const ExpertsDirectoryPage: React.FC = () => {
  const { navigate } = useRouter();
  const { experts, activeCategories } = useServices();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSkill, setSelectedSkill] = useState<string>('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'name'>('rating');

  // Extract all unique skills across verified experts
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    experts.forEach((e) => e.skills.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [experts]);

  // Filtered and sorted experts
  const filteredExperts = useMemo(() => {
    let list = [...experts];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.professionalTitle.toLowerCase().includes(q) ||
          e.bio.toLowerCase().includes(q) ||
          e.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'ALL') {
      list = list.filter((e) =>
        e.serviceCategories.some(
          (c) => c.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }

    if (selectedSkill !== 'ALL') {
      list = list.filter((e) =>
        e.skills.some((s) => s.toLowerCase() === selectedSkill.toLowerCase())
      );
    }

    if (selectedAvailability !== 'ALL') {
      list = list.filter((e) => e.availabilityStatus === selectedAvailability);
    }

    if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    } else if (sortBy === 'experience') {
      list.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    return list;
  }, [experts, searchTerm, selectedCategory, selectedSkill, selectedAvailability, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedSkill('ALL');
    setSelectedAvailability('ALL');
  };

  const isFiltered =
    searchTerm !== '' ||
    selectedCategory !== 'ALL' ||
    selectedSkill !== 'ALL' ||
    selectedAvailability !== 'ALL';

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/services')}
            className="inline-flex items-center text-xs font-medium text-[#08E6F9] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Tech & Digital Services</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#0682F4]/20 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#08E6F9]/30 bg-[#08E6F9]/10 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>Verified Ecosystem Talent</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ecosystem Experts Directory
            </h1>
            <p className="mt-2 text-[#CCD2D9] max-w-2xl text-sm sm:text-base">
              Browse approved contractors working under Nexovira. All engagements and communications are secured and managed through the Nexovira platform.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/services/request')}
            className="self-start md:self-auto shrink-0 shadow-lg shadow-[#0682F4]/20"
          >
            <span>Start a Project</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <div className="my-8 bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CCD2D9]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, title, skill, or keyword..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white placeholder-[#CCD2D9]/50 text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
              />
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9] cursor-pointer"
              >
                <option value="ALL">All Practice Categories</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Skill Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9] cursor-pointer"
              >
                <option value="ALL">All Technical Skills</option>
                {allSkills.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability / Sort Dropdown */}
            <div className="md:col-span-2">
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9] cursor-pointer"
              >
                <option value="ALL">Availability (All)</option>
                <option value="AVAILABLE">Available Now</option>
                <option value="LIMITED">Limited Bandwidth</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
          </div>

          {/* Sub-bar: Results count and Reset */}
          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#0682F4]/20 text-xs text-[#CCD2D9]">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong className="text-white">{filteredExperts.length}</strong> vetted expert
                {filteredExperts.length === 1 ? '' : 's'}
              </span>

              {isFiltered && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-[#08E6F9] hover:underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span>Sort by:</span>
              <button
                onClick={() => setSortBy('rating')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  sortBy === 'rating' ? 'bg-[#0682F4] text-white font-bold' : 'text-[#CCD2D9] hover:text-white'
                }`}
              >
                Rating
              </button>
              <button
                onClick={() => setSortBy('experience')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  sortBy === 'experience' ? 'bg-[#0682F4] text-white font-bold' : 'text-[#CCD2D9] hover:text-white'
                }`}
              >
                Experience
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  sortBy === 'name' ? 'bg-[#0682F4] text-white font-bold' : 'text-[#CCD2D9] hover:text-white'
                }`}
              >
                Name
              </button>
            </div>
          </div>
        </div>

        {/* Experts Grid */}
        {filteredExperts.length === 0 ? (
          <div className="bg-[#011B33] border border-[#0682F4]/20 rounded-2xl p-12 text-center space-y-4 my-8">
            <Users className="w-12 h-12 text-[#08E6F9] mx-auto opacity-70" />
            <h3 className="text-lg font-bold text-white">No experts match your current filters</h3>
            <p className="text-xs text-[#CCD2D9] max-w-md mx-auto">
              Try adjusting your search keywords or clearing active filters to see all available specialists.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              <span>Clear All Filters</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map((expert) => {
              const availabilityColor =
                expert.availabilityStatus === 'AVAILABLE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : expert.availabilityStatus === 'LIMITED'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';

              return (
                <div
                  key={expert.expertId}
                  className="bg-[#011B33] border border-[#0682F4]/25 hover:border-[#08E6F9]/60 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-md group"
                >
                  <div>
                    {/* Top Row: Avatar & Primary Info */}
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={expert.profileImage}
                        alt={expert.fullName}
                        className="w-16 h-16 rounded-xl object-cover border border-[#0682F4]/40 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-white text-base truncate">
                            {expert.fullName}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#08E6F9] bg-[#08E6F9]/10 px-2 py-0.5 rounded-full border border-[#08E6F9]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        </div>
                        <p className="text-xs text-[#0682F4] font-medium truncate mt-0.5">
                          {expert.professionalTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#CCD2D9]">
                          <span>{expert.location}</span>
                          <span>•</span>
                          <span>{expert.yearsOfExperience} yrs exp</span>
                        </div>
                      </div>
                    </div>

                    {/* Availability status tag */}
                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${availabilityColor}`}
                      >
                        {expert.availabilityStatus === 'AVAILABLE'
                          ? 'Available for Projects'
                          : expert.availabilityStatus === 'LIMITED'
                          ? 'Limited Availability'
                          : 'Currently Booked'}
                      </span>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-xs text-[#CCD2D9] line-clamp-3 mb-4 leading-relaxed">
                      {expert.bio}
                    </p>

                    {/* Skills Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {expert.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#01213D] border border-[#0682F4]/20 text-[#CCD2D9]"
                        >
                          {skill}
                        </span>
                      ))}
                      {expert.skills.length > 4 && (
                        <span className="text-[10px] px-1 py-0.5 text-[#08E6F9]">
                          +{expert.skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Action Card */}
                  <div className="pt-4 border-t border-[#0682F4]/20 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold">{expert.rating || 5.0}</span>
                      <span className="text-[#CCD2D9] text-[10px]">
                        ({expert.completedProjectsCount || 20}+)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/services/experts/${expert.expertId}`)}
                        className="text-xs font-semibold text-[#08E6F9] hover:underline cursor-pointer"
                      >
                        View Profile
                      </button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/services/request?expertId=${expert.expertId}`)}
                        className="text-xs h-8 px-3"
                      >
                        Request
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Safety & Integrity Callout */}
        <div className="mt-16 bg-[#011B33] border border-[#0682F4]/25 rounded-2xl p-6 text-center text-xs text-[#CCD2D9]">
          <p className="max-w-2xl mx-auto">
            All expert interactions, agreements, milestone disbursements, and deliverables are protected and administered under the Nexovira Platform Agreement. Independent or direct transactions outside the platform violate system integrity.
          </p>
        </div>
      </div>
    </div>
  );
};
