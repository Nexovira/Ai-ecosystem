import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';

export const SelectRolePage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile, selectRole } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'AFFILIATE' | 'EXPERT'>('CUSTOMER');
  const [applicationReason, setApplicationReason] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentRole = profile?.role || 'CUSTOMER';
  const pendingRole = profile?.pendingRole;

  const roles = [
    {
      id: 'CUSTOMER' as const,
      title: 'Customer & Client',
      badge: 'Instant Activation',
      tagline: 'Standard Client Account',
      description:
        'Explore verified products, request custom technology projects from vetted specialists, enroll in academy curriculums, and order digital publications.',
      icon: Users,
      gradient: 'from-[#08B3F8] to-[#028BFA]',
      features: [
        'Curated marketplace hardware & digital orders',
        'Request custom software development projects',
        'Enroll in hands-on academy courses',
        'Direct order tracking & digital resource library',
      ],
      dashboard: '/account',
    },
    {
      id: 'AFFILIATE' as const,
      title: 'Affiliate Partner',
      badge: 'Partner Program',
      tagline: 'Performance Marketer',
      description:
        'Promote eligible marketplace products, courses, and platform offerings with unique referral links. Earn performance commissions with 30-day attribution tracking.',
      icon: TrendingUp,
      gradient: 'from-[#028BFA] to-[#0169FA]',
      features: [
        'Tracked 30-day attribution cookies on referrals',
        'Transparent commission rates per eligible offer',
        'Real-time clicks, conversions & commission reporting',
        'Direct local bank account settlements in NGN',
      ],
      dashboard: '/affiliate/dashboard',
    },
    {
      id: 'EXPERT' as const,
      title: 'Specialist & Expert',
      badge: 'Milestone Governance',
      tagline: 'Verified Talent Provider',
      description:
        'Deliver vetted software development, UI/UX design, cloud architecture, and technical consulting to businesses with milestone-governed escrow payments.',
      icon: Briefcase,
      gradient: 'from-[#0169FA] to-[#032FC8]',
      features: [
        'Milestone-secured payments held in escrow',
        'Direct project briefing & client collaboration desk',
        'Verified technical credential badge on profile',
        'Structured deliverable review and milestone releases',
      ],
      dashboard: '/expert/dashboard',
    },
  ];

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!user) {
      navigate(`/register?role=${selectedRole}`);
      return;
    }

    setIsSubmitting(true);
    const skills = skillsText
      ? skillsText.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const res = await selectRole(selectedRole, {
      reason: applicationReason.trim() || undefined,
      portfolioUrl: portfolioUrl.trim() || undefined,
      skills,
    });
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.message || `Role updated successfully to ${selectedRole}.`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to update role.',
      });
    }
  };

  return (
    <div className="py-12 sm:py-20 bg-[#F7F8FA] min-h-[85vh]">
      <Container size="default">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/account')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0169FA] hover:text-[#0148F2] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Account</span>
          </button>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#0169FA] uppercase">
            <Sparkles className="w-4 h-4 text-[#08B3F8]" />
            <span>Role Selection</span>
            <span aria-hidden="true" className="text-[#6B7280]">·</span>
            <span>Ecosystem Pathways</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14283F] tracking-tight">
            Choose Your Nexovira Pathway
          </h1>

          <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
            Configure your active role on the platform. You can transition between client services, affiliate promotion, or specialized technical delivery.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`max-w-2xl mx-auto mb-8 p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-semibold">{feedback.type === 'success' ? 'Confirmed: ' : 'Error: '}</span>
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Current Active Status Indicator */}
        {user && profile && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-white border border-[#E8EDF2] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-[#6B7280]">Current Role:</span>
              <span className="font-bold text-[#0169FA] px-2.5 py-0.5 rounded-full bg-[#0169FA]/10">
                {currentRole}
              </span>
              {pendingRole && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>Pending Application: {pendingRole}</span>
                </span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentRole === 'EXPERT') navigate('/expert/dashboard');
                else if (currentRole === 'AFFILIATE') navigate('/affiliate/dashboard');
                else if (['ADMIN', 'SUPER_ADMIN'].includes(currentRole)) navigate('/management');
                else navigate('/account');
              }}
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            const isCurrentActive = user && currentRole === role.id;
            const isPendingThis = user && pendingRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-6 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-2 border-[#0169FA] ring-2 ring-[#0169FA]/20 shadow-xl shadow-[#0169FA]/10'
                    : 'bg-white border-[#E8EDF2] hover:border-slate-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${role.gradient} text-white flex items-center justify-center shadow-md shadow-[#0169FA]/15`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCurrentActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isPendingThis
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-[#6B7280]'
                    }`}>
                      {isCurrentActive ? 'Active' : isPendingThis ? 'Under Review' : role.badge}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-[#14283F]">{role.title}</h3>
                  <div className="text-xs font-semibold text-[#0169FA] mb-2">{role.tagline}</div>
                  <p className="text-xs text-[#6B7280] leading-relaxed mb-4">{role.description}</p>

                  <div className="space-y-2 pt-3 border-t border-[#E8EDF2] text-xs text-[#252B33]">
                    {role.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0169FA] shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E8EDF2]">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={isSelected ? 'text-[#0169FA]' : 'text-[#6B7280]'}>
                      {isSelected ? 'Selected' : 'Click to Select'}
                    </span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#0169FA] bg-[#0169FA]' : 'border-slate-300'
                    }`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Application / Confirmation Form */}
        <div className="max-w-2xl mx-auto bg-white border border-[#E8EDF2] rounded-3xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleApply} className="space-y-4">
            <div className="border-b border-[#E8EDF2] pb-3">
              <h2 className="font-display font-bold text-lg text-[#14283F]">
                {selectedRole === 'CUSTOMER'
                  ? 'Confirm Customer Role Selection'
                  : `Apply for ${selectedRole === 'AFFILIATE' ? 'Affiliate Partner' : 'Specialist & Expert'} Status`}
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {selectedRole === 'CUSTOMER'
                  ? 'Your account role will immediately become Customer upon saving.'
                  : 'Specialist and partner roles are evaluated by management to verify platform credentials.'}
              </p>
            </div>

            {selectedRole === 'EXPERT' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#14283F] mb-1">
                    Primary Technical Skills (comma-separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="React, TypeScript, AWS, Python, Figma, UI/UX"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14283F] mb-1">
                    Portfolio / GitHub Profile URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://github.com/your-username or portfolio URL"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:outline-none"
                  />
                </div>
              </>
            )}

            {selectedRole !== 'CUSTOMER' && (
              <div>
                <label className="block text-xs font-semibold text-[#14283F] mb-1">
                  {selectedRole === 'AFFILIATE'
                    ? 'Promotional Channels & Experience *'
                    : 'Professional Experience Summary *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={applicationReason}
                  onChange={(e) => setApplicationReason(e.target.value)}
                  placeholder={
                    selectedRole === 'AFFILIATE'
                      ? 'Tell us about your audience, social media reach, website, newsletter, or network...'
                      : 'Summarize your professional background, years of experience, and past deliverables...'
                  }
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:outline-none"
                />
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={isSubmitting || Boolean(user && currentRole === selectedRole && selectedRole === 'CUSTOMER')}
              >
                {isSubmitting ? (
                  <span>Saving Role Configuration...</span>
                ) : user && currentRole === selectedRole && selectedRole === 'CUSTOMER' ? (
                  <span>Currently Active as Customer</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>
                      {selectedRole === 'CUSTOMER' ? 'Activate Customer Role' : `Submit ${selectedRole} Application`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Security / Admin Protection Notice */}
        <div className="mt-8 max-w-2xl mx-auto p-4 rounded-2xl bg-white border border-[#E8EDF2] text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0169FA] shrink-0" />
          <span>
            Administrative privileges cannot be self-assigned through this console and are restricted to authorized platform owners.
          </span>
        </div>
      </Container>
    </div>
  );
};
