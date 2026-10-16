import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { PortfolioLink } from '../../types/services';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react';

export const ApplyExpertPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const { activeCategories, applyAsExpert } = useServices();

  const [fullName, setFullName] = useState<string>(profile?.fullName || user?.displayName || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [professionalTitle, setProfessionalTitle] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(3);
  const [location, setLocation] = useState<string>('Lagos, Nigeria');
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([]);

  const [portfolioTitle, setPortfolioTitle] = useState<string>('');
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      { title: portfolioTitle.trim(), url: portfolioUrl.trim() },
    ]);
    setPortfolioTitle('');
    setPortfolioUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Please sign in or register before applying to become an ecosystem expert.');
      return;
    }

    if (!professionalTitle.trim() || !bio.trim()) {
      setErrorMessage('Please provide your professional title and biography.');
      return;
    }

    if (selectedCategories.length === 0) {
      setErrorMessage('Please select at least one service category.');
      return;
    }

    if (skillsList.length === 0) {
      setErrorMessage('Please add at least 2 technical skills.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await applyAsExpert({
        fullName: fullName.trim(),
        email: email.trim(),
        professionalTitle: professionalTitle.trim(),
        bio: bio.trim(),
        skills: skillsList,
        serviceCategories: selectedCategories,
        yearsOfExperience: Number(yearsOfExperience) || 1,
        portfolioLinks,
        location: location.trim(),
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(res.error || 'Failed to submit application.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#01213D] text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center space-y-6 bg-[#011B33] border border-[#08E6F9]/30 rounded-3xl p-10 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Application Received
          </h1>
          <p className="text-xs sm:text-sm text-[#CCD2D9] leading-relaxed">
            Thank you for applying to join the Nexovira Technology Ecosystem. Your application has been registered with status <strong className="text-amber-400">PENDING_REVIEW</strong>. Nexovira management will review your portfolio and reach out regarding role clearance.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Button variant="primary" onClick={() => navigate('/services')}>
              <span>Return to Services</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/services')}
            className="inline-flex items-center text-xs font-medium text-[#08E6F9] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Services</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#08E6F9]/30 bg-[#08E6F9]/10 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join Nexovira Talent</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Apply to Join as an Ecosystem Expert
          </h1>

          <p className="text-xs sm:text-sm text-[#CCD2D9]">
            Work on managed technical client projects. All expert applications are rigorously reviewed by Nexovira management.
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

          {/* Section 1: Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                Full Name *
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
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
              />
            </div>
          </div>

          {/* Section 2: Trade Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
              Professional Trade Title *
            </label>
            <input
              type="text"
              value={professionalTitle}
              onChange={(e) => setProfessionalTitle(e.target.value)}
              placeholder="e.g. Lead Kubernetes & Cloud Infrastructure Engineer"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
            />
          </div>

          {/* Section 3: Biography */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
              Technical Background & Biography *
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Outline your background, years in industry, major production architectures, and why you want to work under Nexovira..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9] resize-y"
            />
          </div>

          {/* Section 4: Practice Categories */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
              Target Practice Categories *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
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
              Primary Technical Skills *
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
                placeholder="e.g. Flutter, Go, Rust, AWS..."
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                Years Commercial Experience *
              </label>
              <input
                type="number"
                min="1"
                max="40"
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
                placeholder="e.g. Nairobi, Kenya"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
              />
            </div>
          </div>

          {/* Section 7: Sample Portfolio Link */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
              Portfolio Links / GitHub / Case Studies
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={portfolioTitle}
                onChange={(e) => setPortfolioTitle(e.target.value)}
                placeholder="Project Title"
                className="px-3 py-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
              />
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="px-3 py-2 rounded-lg bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
              />
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddPortfolio}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add Link</span>
            </Button>

            {portfolioLinks.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {portfolioLinks.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#01213D] border border-[#0682F4]/20 text-xs"
                  >
                    <span className="font-semibold text-white">{p.title}</span>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#08E6F9] hover:underline"
                    >
                      {p.url}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-[#0682F4]/20 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="px-8 font-semibold shadow-lg shadow-[#0682F4]/30"
            >
              {submitting ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
