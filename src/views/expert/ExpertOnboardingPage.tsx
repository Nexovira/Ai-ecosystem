import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { PortfolioLink, ExpertAvailability } from '../../types/services';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  Sparkles,
} from 'lucide-react';

export const ExpertOnboardingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const { expertProfile, saveMyExpertProfile, activeCategories, fetchMyExpertProfile } = useServices();

  const [fullName, setFullName] = useState<string>('');
  const [professionalTitle, setProfessionalTitle] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(3);
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([]);
  const [location, setLocation] = useState<string>('Lagos, Nigeria');
  const [languages, setLanguages] = useState<string>('English');
  const [availabilityStatus, setAvailabilityStatus] = useState<ExpertAvailability>('AVAILABLE');

  const [portfolioTitle, setPortfolioTitle] = useState<string>('');
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');
  const [portfolioDesc, setPortfolioDesc] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyExpertProfile();
    }
  }, [user, fetchMyExpertProfile]);

  // Prepopulate form if existing profile found
  useEffect(() => {
    if (expertProfile) {
      setFullName(expertProfile.fullName || '');
      setProfessionalTitle(expertProfile.professionalTitle || '');
      setProfileImage(expertProfile.profileImage || '');
      setBio(expertProfile.bio || '');
      setSkillsList(expertProfile.skills || []);
      setSelectedCategories(expertProfile.serviceCategories || []);
      setYearsOfExperience(expertProfile.yearsOfExperience || 3);
      setPortfolioLinks(expertProfile.portfolioLinks || []);
      setLocation(expertProfile.location || 'Lagos, Nigeria');
      setLanguages((expertProfile.languages || ['English']).join(', '));
      setAvailabilityStatus(expertProfile.availabilityStatus || 'AVAILABLE');
    } else if (profile) {
      setFullName(profile.fullName || '');
      setProfileImage(profile.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
    }
  }, [expertProfile, profile]);

  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (s && !skillsList.includes(s)) {
      setSkillsList([...skillsList, s]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkillsList(skillsList.filter((x) => x !== skill));
  };

  const handleToggleCategory = (slug: string) => {
    if (selectedCategories.includes(slug)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== slug));
    } else {
      setSelectedCategories([...selectedCategories, slug]);
    }
  };

  const handleAddPortfolio = () => {
    if (!portfolioTitle.trim() || !portfolioUrl.trim()) return;
    setPortfolioLinks([
      ...portfolioLinks,
      {
        title: portfolioTitle.trim(),
        url: portfolioUrl.trim(),
        description: portfolioDesc.trim() || undefined,
      },
    ]);
    setPortfolioTitle('');
    setPortfolioUrl('');
    setPortfolioDesc('');
  };

  const handleRemovePortfolio = (idx: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!professionalTitle.trim()) {
      setErrorMessage('Please provide your professional title.');
      return;
    }

    if (!bio.trim() || bio.trim().length < 30) {
      setErrorMessage('Please provide a comprehensive bio (minimum 30 characters).');
      return;
    }

    if (selectedCategories.length === 0) {
      setErrorMessage('Please select at least one primary service category.');
      return;
    }

    if (skillsList.length === 0) {
      setErrorMessage('Please add at least 2 technical skills.');
      return;
    }

    try {
      setSaving(true);
      const splitLanguages = languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const res = await saveMyExpertProfile({
        fullName: fullName.trim() || profile?.fullName || 'Ecosystem Specialist',
        professionalTitle: professionalTitle.trim(),
        profileImage: profileImage.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: bio.trim(),
        skills: skillsList,
        serviceCategories: selectedCategories,
        yearsOfExperience: Number(yearsOfExperience) || 1,
        portfolioLinks,
        location: location.trim(),
        languages: splitLanguages.length > 0 ? splitLanguages : ['English'],
        availabilityStatus,
      });

      if (res.success) {
        setSuccessMessage('Professional profile updated successfully! Nexovira management will review updates.');
      } else {
        setErrorMessage(res.error || 'Failed to save expert profile.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/expert/dashboard')}
            className="inline-flex items-center text-xs font-medium text-[#08E6F9] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Expert Console</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#08E6F9]/30 bg-[#08E6F9]/10 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Expert Ecosystem Profile</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Professional Profile Setup
          </h1>

          <p className="text-xs sm:text-sm text-[#CCD2D9]">
            Complete your public trade profile for customer browsing and project assignment. Verification is reviewed and authorized by Nexovira management.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#011B33] border border-[#0682F4]/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8"
        >
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section 1: Identity & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                Full Legal Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                Professional Title *
              </label>
              <input
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder="e.g. Senior Cloud & DevOps Engineer"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
              />
            </div>
          </div>

          {/* Section 2: Avatar URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
              Profile Photo Asset URL
            </label>
            <input
              type="url"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
            />
          </div>

          {/* Section 3: Biography */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
              Professional Biography *
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Describe your background, technical depth, major systems delivered, and domain expertise..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9] resize-y"
            />
          </div>

          {/* Section 4: Service Categories Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
              Specialized Service Categories *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {activeCategories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.slug);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleCategory(cat.slug)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0682F4] text-white border-[#08E6F9]'
                        : 'bg-[#01213D] text-[#CCD2D9] border-[#0682F4]/30 hover:border-[#08E6F9]'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Skills */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
              Technical Skills *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="e.g. AWS, React, Kubernetes..."
                className="flex-1 px-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddSkill}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-lg bg-[#01213D] border border-[#0682F4]/40 text-xs text-white flex items-center gap-1.5"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-[#CCD2D9] hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section 6: Experience & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                Years Experience *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                Location (City, Country) *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lagos, Nigeria"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                Languages (comma separated)
              </label>
              <input
                type="text"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="English, French"
                className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
              />
            </div>
          </div>

          {/* Section 7: Portfolio Links */}
          <div className="space-y-4 pt-4 border-t border-[#0682F4]/20">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
              Portfolio Work / Case Studies
            </label>

            <div className="p-4 rounded-2xl bg-[#01213D] border border-[#0682F4]/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={portfolioTitle}
                  onChange={(e) => setPortfolioTitle(e.target.value)}
                  placeholder="Case Study / Project Title"
                  className="px-3 py-2 rounded-lg bg-[#011B33] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                />
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/... or https://behance.net/..."
                  className="px-3 py-2 rounded-lg bg-[#011B33] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                />
              </div>
              <input
                type="text"
                value={portfolioDesc}
                onChange={(e) => setPortfolioDesc(e.target.value)}
                placeholder="Brief outcome or architectural takeaway (optional)"
                className="w-full px-3 py-2 rounded-lg bg-[#011B33] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddPortfolio}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Portfolio Item</span>
              </Button>
            </div>

            {portfolioLinks.length > 0 && (
              <div className="space-y-2">
                {portfolioLinks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{item.title}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#08E6F9] hover:underline"
                      >
                        {item.url}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePortfolio(idx)}
                      className="text-[#CCD2D9] hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification Notice */}
          <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-xs text-[#CCD2D9] flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#08E6F9] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white">Nexovira Verification Policy:</span>
              <p>
                Submitting updates saves your profile with official tracking. Only authorized Nexovira management can grant the public VERIFIED credential badge.
              </p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={saving}
              className="px-8 font-semibold shadow-lg shadow-[#0682F4]/30"
            >
              {saving ? 'Saving Profile...' : 'Save & Submit for Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
