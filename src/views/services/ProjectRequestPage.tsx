import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../context/ServicesContext';
import { Button } from '../../components/common/Button';
import { ProjectPriority, ProjectAttachment } from '../../types/services';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Shield,
  UploadCloud,
  File,
  X,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const ProjectRequestPage: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { user, profile } = useAuth();
  const { activeCategories, submitProjectRequest, getExpertBySlugOrId, analyzeProjectWithAi } = useServices();

  // Parse URL search params
  const urlParams = new URLSearchParams(currentPath.includes('?') ? currentPath.split('?')[1] : '');
  const preselectedCategory = urlParams.get('category') || '';
  const preselectedExpertId = urlParams.get('expertId') || '';

  // Form State
  const [categoryId, setCategoryId] = useState<string>(preselectedCategory);
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [goals, setGoals] = useState<string>('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState<string>('');
  const [currency, setCurrency] = useState<string>('NGN');
  const [budgetMin, setBudgetMin] = useState<number | ''>('');
  const [budgetMax, setBudgetMax] = useState<number | ''>('');
  const [preferredTimeline, setPreferredTimeline] = useState<string>('1-2 weeks');
  const [priority, setPriority] = useState<ProjectPriority>('MEDIUM');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [contactName, setContactName] = useState<string>(profile?.fullName || user?.displayName || '');
  const [contactEmail, setContactEmail] = useState<string>(user?.email || '');
  const [contactPhone, setContactPhone] = useState<string>(profile?.phoneNumber || '');

  // Attachments
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);

  // Preferred expert banner state
  const [preferredExpertName, setPreferredExpertName] = useState<string>('');

  // AI Scope Assistant State
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // UI State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunAiAnalysis = async () => {
    if (!description.trim() || description.trim().length < 15) {
      setAiNotice('Please enter at least 15 characters in the description before requesting AI scope analysis.');
      return;
    }
    setAiNotice(null);
    setAiAnalyzing(true);
    try {
      const res = await analyzeProjectWithAi(projectTitle, description);
      if (res.success && res.analysis) {
        setAiResult(res.analysis);
      } else {
        setAiNotice(res.error || 'Nexovira AI assistant is currently unavailable.');
      }
    } catch {
      setAiNotice('AI assistant service is currently unavailable.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // If preselected expert, fetch their name
  useEffect(() => {
    if (preselectedExpertId) {
      getExpertBySlugOrId(preselectedExpertId).then((exp) => {
        if (exp) {
          setPreferredExpertName(exp.fullName);
          if (!categoryId && exp.serviceCategories.length > 0) {
            setCategoryId(exp.serviceCategories[0]);
          }
        }
      });
    }
  }, [preselectedExpertId, getExpertBySlugOrId, categoryId]);

  // Sync category if URL param changes
  useEffect(() => {
    if (preselectedCategory && !categoryId) {
      setCategoryId(preselectedCategory);
    }
  }, [preselectedCategory, categoryId]);

  // Sync user info if available
  useEffect(() => {
    if (user && !contactEmail) {
      setContactEmail(user.email || '');
      setContactName(profile?.fullName || user.displayName || '');
    }
  }, [user, profile, contactEmail]);

  // Skill tags handler
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (s: string) => {
    setSkillsList(skillsList.filter((x) => x !== s));
  };

  // Safe file attachments upload (mock base64 preview with strict 5MB limit)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: ProjectAttachment[] = [];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSizeBytes) {
        setErrorMessage(`File "${file.name}" exceeds the 5MB maximum size.`);
        continue;
      }

      const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      newAttachments.push({
        id,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: URL.createObjectURL(file),
      });
    }

    setAttachments([...attachments, ...newAttachments].slice(0, 5));
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Please sign in or create an account first to register your project with Nexovira.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Please select a service category for your project.');
      return;
    }

    if (!projectTitle.trim() || projectTitle.trim().length < 5) {
      setErrorMessage('Project title must be at least 5 characters long.');
      return;
    }

    if (!description.trim() || description.trim().length < 20) {
      setErrorMessage('Please provide a detailed project description (minimum 20 characters).');
      return;
    }

    if (!goals.trim() || goals.trim().length < 10) {
      setErrorMessage('Please describe the business goals or outcomes you want to achieve.');
      return;
    }

    const min = Number(budgetMin);
    const max = Number(budgetMax);

    if (budgetMin === '' || budgetMax === '' || isNaN(min) || isNaN(max)) {
      setErrorMessage('Please enter both minimum and maximum budget amounts.');
      return;
    }

    if (min < 0 || max < min) {
      setErrorMessage('Maximum budget must be greater than or equal to minimum budget.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitProjectRequest({
        categoryId,
        projectTitle,
        description,
        goals,
        requiredSkills: skillsList,
        budgetMin: min,
        budgetMax: max,
        currency,
        preferredTimeline,
        priority,
        attachments,
        additionalNotes,
        preferredExpertId: preselectedExpertId || undefined,
        contactName,
        contactEmail,
        contactPhone,
      });

      if (res.success && res.request) {
        navigate(`/account/services/${res.request.requestId}`);
      } else {
        setErrorMessage(res.error || 'Failed to submit request. Please try again.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#01213D] text-white py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#08E6F9]/30 bg-[#08E6F9]/10 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nexovira Managed Engagement</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Start a Tech & Digital Project
          </h1>

          <p className="text-sm text-[#CCD2D9]">
            Tell us what you need. Nexovira evaluates your project requirements and matches you with verified specialists under platform-guaranteed milestones.
          </p>
        </div>

        {/* Preferred Expert Notice if present */}
        {preferredExpertName && (
          <div className="mb-8 p-4 rounded-2xl bg-[#011B33] border border-[#08E6F9]/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#08E6F9] shrink-0" />
              <div className="text-xs">
                <span className="text-white font-semibold">Preferred Specialist: </span>
                <span className="text-[#08E6F9] font-bold">{preferredExpertName}</span>
                <p className="text-[#CCD2D9] mt-0.5">
                  Your engagement will prioritize assignment to this verified expert upon Nexovira scope confirmation.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/services/request')}
              className="text-xs text-[#CCD2D9] hover:text-white underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Main Request Form */}
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

          {/* Section 1: Practice Category */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
              1. Service Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9] cursor-pointer"
            >
              <option value="">Select a Service Category</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section 2: Project Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                2. Project Title *
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Next.js FinTech Platform with Automated Payroll"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                3. Detailed Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe your project, architecture requirements, user stories, current technical environment, or key specifications..."
                required
                className="w-full px-4 py-3 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9] resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                4. What do you want to achieve? (Expected Goals) *
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
                placeholder="What is the primary objective or business metric this project must satisfy?"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9] resize-y"
              />
            </div>

            {/* AI Scope Assistant Trigger & Result (Section 20: Foundation Only) */}
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#01213D] border border-[#0682F4]/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#08E6F9]/15 flex items-center justify-center text-[#08E6F9] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Nexovira AI Scope Assistant</h4>
                    <p className="text-[11px] text-[#CCD2D9]">
                      Optionally analyze your requirements for recommended categories, skills, and clarifying questions.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={aiAnalyzing || !description.trim()}
                  onClick={handleRunAiAnalysis}
                  className="text-xs border-[#08E6F9]/40 text-[#08E6F9] hover:bg-[#08E6F9]/10 shrink-0"
                >
                  {aiAnalyzing ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 border-2 border-[#08E6F9] border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing Scope...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analyze Scope</span>
                    </div>
                  )}
                </Button>
              </div>

              {aiNotice && (
                <div className="mt-2.5 p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-xs text-[#CCD2D9] flex items-center justify-between">
                  <span>{aiNotice}</span>
                  <button
                    type="button"
                    onClick={() => setAiNotice(null)}
                    className="text-[#CCD2D9] hover:text-white ml-2 text-xs cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {aiResult && (
                <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-[#01213D] border border-[#08E6F9]/50 space-y-4 shadow-xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#08E6F9]" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        AI Scope Analysis Results
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiResult(null)}
                      className="text-xs text-[#CCD2D9] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Suggested Category */}
                    <div className="p-3 rounded-xl bg-[#011B33] border border-[#0682F4]/30 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-[#CCD2D9] uppercase font-bold">Suggested Category</span>
                        <p className="font-bold text-white text-sm mt-0.5">{aiResult.likelyCategoryName}</p>
                      </div>
                      {aiResult.likelyCategorySlug && categoryId !== aiResult.likelyCategorySlug && (
                        <button
                          type="button"
                          onClick={() => setCategoryId(aiResult.likelyCategorySlug)}
                          className="mt-2 text-left text-xs font-semibold text-[#08E6F9] hover:underline cursor-pointer"
                        >
                          → Apply Category
                        </button>
                      )}
                    </div>

                    {/* Complexity Estimate */}
                    <div className="p-3 rounded-xl bg-[#011B33] border border-[#0682F4]/30">
                      <span className="text-[10px] text-[#CCD2D9] uppercase font-bold">Scope Complexity</span>
                      <p className="font-bold text-[#08E6F9] text-sm mt-0.5">
                        {aiResult.estimatedComplexity || 'MEDIUM'}
                      </p>
                      {aiResult.strategicAdvice && (
                        <p className="text-[11px] text-[#CCD2D9] mt-1 leading-snug">
                          {aiResult.strategicAdvice}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Suggested Skills */}
                  {aiResult.suggestedSkills && aiResult.suggestedSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Suggested Technical Competencies</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newSkills = Array.from(new Set([...skillsList, ...aiResult.suggestedSkills]));
                            setSkillsList(newSkills);
                          }}
                          className="text-xs text-[#08E6F9] hover:underline font-semibold cursor-pointer"
                        >
                          Add All Skills
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiResult.suggestedSkills.map((sk: string) => (
                          <span
                            key={sk}
                            onClick={() => {
                              if (!skillsList.includes(sk)) setSkillsList([...skillsList, sk]);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#011B33] border border-[#08E6F9]/30 text-xs text-white cursor-pointer hover:border-[#08E6F9]"
                            title="Click to add"
                          >
                            + {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clarifying Questions */}
                  {aiResult.clarifyingQuestions && aiResult.clarifyingQuestions.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#0682F4]/20 text-xs">
                      <span className="font-bold text-amber-300">Clarifying Questions to Consider:</span>
                      <ul className="list-disc list-inside space-y-1 text-[#CCD2D9] text-[11px]">
                        {aiResult.clarifyingQuestions.map((q: string, idx: number) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Required Skills / Tech Stack */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
              5. Required Skills or Technologies (Optional)
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
                placeholder="e.g. React, Kubernetes, Figma, Python..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddSkill}
              >
                Add Skill
              </Button>
            </div>

            {skillsList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#01213D] border border-[#0682F4]/40 text-xs text-white"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#CCD2D9] hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Budget Range & Multi-Currency */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
              6. Budget Range *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[#CCD2D9] mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9] cursor-pointer"
                >
                  <option value="NGN">NGN (₦) - Nigerian Naira</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#CCD2D9] mb-1">Minimum Amount</label>
                <input
                  type="number"
                  min="0"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 500000"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#CCD2D9] mb-1">Maximum Amount</label>
                <input
                  type="number"
                  min="0"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 1500000"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Timeline & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                7. Preferred Timeline *
              </label>
              <select
                value={preferredTimeline}
                onChange={(e) => setPreferredTimeline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9] cursor-pointer"
              >
                <option value="Less than 1 week">Less than 1 week (Fast-track)</option>
                <option value="1-2 weeks">1-2 weeks</option>
                <option value="1 month">1 month</option>
                <option value="2-3 months">2-3 months</option>
                <option value="3+ months">3+ months</option>
                <option value="Flexible">Flexible schedule</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
                8. Urgency Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9] cursor-pointer"
              >
                <option value="LOW">Low - Exploration / Future Scope</option>
                <option value="MEDIUM">Medium - Standard Production</option>
                <option value="HIGH">High - Urgent Business Requirement</option>
                <option value="URGENT">Urgent - Mission Critical Immediate</option>
              </select>
            </div>
          </div>

          {/* Section 6: Attachments */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
              9. Attachments / Project Briefs (Optional)
            </label>
            <div className="border-2 border-dashed border-[#0682F4]/30 rounded-2xl p-6 text-center hover:border-[#08E6F9] transition-colors bg-[#01213D]">
              <UploadCloud className="w-8 h-8 text-[#08E6F9] mx-auto mb-2" />
              <p className="text-xs text-white font-medium">
                Click or drag files here to upload project specifications (PDF, DOCX, PNG, JPG, ZIP)
              </p>
              <p className="text-[11px] text-[#CCD2D9] mt-1">Maximum 5MB per file (up to 5 files)</p>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="mt-3 text-xs text-[#CCD2D9] file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0682F4] file:text-white hover:file:bg-[#0682F4]/80 cursor-pointer"
              />
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <File className="w-4 h-4 text-[#08E6F9] shrink-0" />
                      <span className="text-white truncate">{file.name}</span>
                      <span className="text-[#CCD2D9] text-[10px]">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(file.id)}
                      className="text-[#CCD2D9] hover:text-white ml-2 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 7: Additional Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#08E6F9] mb-1.5">
              10. Additional Notes
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={2}
              placeholder="Any NDA requirements, communication preferences, or specific constraints..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-sm focus:outline-none focus:border-[#08E6F9] resize-y"
            />
          </div>

          {/* Section 8: Contact Information Verification */}
          <div className="space-y-3 pt-4 border-t border-[#0682F4]/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#08E6F9]">
              11. Contact Confirmation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[#CCD2D9] mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#CCD2D9] mb-1">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#CCD2D9] mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+234..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs sm:text-sm focus:outline-none focus:border-[#08E6F9]"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-6 border-t border-[#0682F4]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#CCD2D9]">
              <Shield className="w-4 h-4 text-[#08E6F9]" />
              <span>Strict Nexovira Managed Delivery Guarantee</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="w-full sm:w-auto px-8 shadow-xl shadow-[#0682F4]/30 font-semibold"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Submitting Project Request...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Submit Request to Nexovira</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
