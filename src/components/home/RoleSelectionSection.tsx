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
  Lock,
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

export const RoleSelectionSection: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile, selectRole } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'AFFILIATE' | 'EXPERT'>('CUSTOMER');
  const [applicationReason, setApplicationReason] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const currentRole = profile?.role || 'CUSTOMER';
  const pendingRole = profile?.pendingRole;

  const roles = [
    {
      id: 'CUSTOMER' as const,
      title: 'Client & Learner',
      badge: 'Immediate Activation',
      tagline: 'Access the Full Ecosystem',
      description:
        'Browse & purchase electronics, request tailored software projects from verified experts, enroll in academy curriculums, and access downloadable digital publications.',
      icon: Users,
      gradient: 'from-[#08B3F8] to-[#028BFA]',
      features: [
        'Curated marketplace hardware & digital orders',
        'Request custom software & engineering projects',
        'Enroll in hands-on practical academy courses',
        'Direct order tracking & digital resource library',
      ],
      actionText: user ? 'Select Customer Role' : 'Get Started as Customer',
      dashboardPath: '/account',
    },
    {
      id: 'AFFILIATE' as const,
      title: 'Affiliate Partner',
      badge: 'Partner Program',
      tagline: 'Promote & Earn in NGN',
      description:
        'Recommend eligible marketplace products, courses, and platform offerings to your audience. Earn performance commissions with 30-day referral attribution.',
      icon: TrendingUp,
      gradient: 'from-[#028BFA] to-[#0169FA]',
      features: [
        'Tracked 30-day attribution cookie on referrals',
        'Transparent commission rates per eligible offer',
        'Real-time click, conversion & commission reporting',
        'Direct local bank account settlements in NGN',
      ],
      actionText: user ? 'Join Affiliate Program' : 'Register as Affiliate',
      dashboardPath: '/affiliate/dashboard',
    },
    {
      id: 'EXPERT' as const,
      title: 'Specialist & Expert',
      badge: 'Milestone Governance',
      tagline: 'Provide Professional Services',
      description:
        'Deliver vetted software development, UI/UX design, cloud architecture, and technical consulting to businesses with milestone-governed escrow payments.',
      icon: Briefcase,
      gradient: 'from-[#0169FA] to-[#032FC8]',
      features: [
        'Milestone-secured payments held in escrow',
        'Direct project briefing & client collaboration desk',
        'Verified technical credential badge on profile',
        'Structured project milestones and deliverable review',
      ],
      actionText: user ? 'Apply as Specialist' : 'Register as Expert',
      dashboardPath: '/expert/dashboard',
    },
  ];

  const handleRoleAction = async (roleId: 'CUSTOMER' | 'AFFILIATE' | 'EXPERT') => {
    setFeedback(null);

    if (!user) {
      // Direct visitor to registration with target role pre-selected
      navigate(`/register?role=${roleId}`);
      return;
    }

    if (roleId === 'CUSTOMER') {
      setIsSubmitting(true);
      const res = await selectRole('CUSTOMER');
      setIsSubmitting(false);

      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Your account is active as Customer.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to update role.',
        });
      }
    } else {
      setSelectedRole(roleId);
      setShowApplyModal(true);
    }
  };

  const handleConfirmApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await selectRole(selectedRole, {
      reason: applicationReason.trim(),
      portfolioUrl: portfolioUrl.trim() || undefined,
    });

    setIsSubmitting(false);
    setShowApplyModal(false);
    setApplicationReason('');
    setPortfolioUrl('');

    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.message || `Your ${selectedRole.toLowerCase()} application has been registered.`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to submit application.',
      });
    }
  };

  return (
    <section id="role-selection" className="py-16 sm:py-24 bg-white border-b border-[#E8EDF2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wider text-[#0169FA] uppercase">
            <Sparkles className="w-4 h-4 text-[#08B3F8]" />
            <span>Operational Roles</span>
            <span aria-hidden="true" className="text-[#6B7280]">·</span>
            <span>Choose Your Pathway</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14283F] tracking-tight">
            How Do You Want to Use Nexovira?
          </h2>

          <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
            Select the role that fits your goals today. Every authenticated user account can seamlessly transition between client, partner, or specialized provider capabilities.
          </p>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`max-w-3xl mx-auto mb-8 p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 ${
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
              <span className="font-semibold">{feedback.type === 'success' ? 'Update Confirmed: ' : 'Notice: '}</span>
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* User Current Role Status Card if Logged In */}
        {user && profile && (
          <div className="max-w-3xl mx-auto mb-10 p-5 rounded-2xl bg-[#F7F8FA] border border-[#E8EDF2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#08B3F8] to-[#0169FA] text-white flex items-center justify-center font-bold text-sm">
                {(profile.fullName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs text-[#6B7280]">Signed in as <span className="font-semibold text-[#14283F]">{profile.fullName || user.email}</span></div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-[#14283F]">Current Active Role:</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0169FA]/10 text-[#0169FA]">
                    {currentRole}
                  </span>
                  {pendingRole && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3 h-3" />
                      <span>{pendingRole} (Pending Review)</span>
                    </span>
                  )}
                </div>
              </div>
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
              className="shrink-0"
            >
              <span>Go to Role Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* 3 Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isCurrentActive = Boolean(user && currentRole === role.id);
            const isPendingThis = Boolean(user && pendingRole === role.id);

            return (
              <div
                key={role.id}
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  isCurrentActive
                    ? 'bg-white border-2 border-[#0169FA] shadow-xl shadow-[#0169FA]/10'
                    : 'bg-[#F7F8FA] border border-[#E8EDF2] hover:border-[#028BFA] hover:bg-white hover:shadow-lg hover:shadow-slate-200/50'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${role.gradient} text-white flex items-center justify-center shadow-md shadow-[#0169FA]/15`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    isCurrentActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isPendingThis
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-white border border-[#E8EDF2] text-[#6B7280]'
                  }`}>
                    {isCurrentActive ? 'Active Role' : isPendingThis ? 'Under Review' : role.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="space-y-3 mb-6">
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#14283F]">{role.title}</h3>
                    <div className="text-xs font-semibold text-[#0169FA]">{role.tagline}</div>
                  </div>
                  <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                    {role.description}
                  </p>
                </div>

                {/* Feature Checklist */}
                <div className="space-y-2.5 py-4 border-t border-[#E8EDF2] text-xs text-[#14283F] mb-6">
                  {role.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0169FA] shrink-0 mt-0.5" />
                      <span className="leading-tight text-[#252B33]">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                <div className="pt-2">
                  <Button
                    variant={isCurrentActive ? 'secondary' : 'primary'}
                    size="md"
                    fullWidth
                    disabled={isSubmitting || isCurrentActive}
                    onClick={() => handleRoleAction(role.id)}
                    className={!isCurrentActive ? 'shadow-sm shadow-[#0169FA]/20' : ''}
                  >
                    {isCurrentActive ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Current Role</span>
                      </span>
                    ) : isPendingThis ? (
                      <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                        <Clock className="w-4 h-4" />
                        <span>Application Pending</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span>{role.actionText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Admin Protection Notice */}
        <div className="mt-12 max-w-2xl mx-auto p-4 rounded-2xl bg-[#F7F8FA] border border-[#E8EDF2] text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0169FA] shrink-0" />
          <span>
            Nexovira operates strict role isolation. Administrative desk access requires authorization and cannot be self-selected.
          </span>
        </div>

      </div>

      {/* Role Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E8EDF2] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider text-[#0169FA] uppercase">
                Role Application
              </span>
              <h3 className="font-display font-bold text-xl text-[#14283F]">
                Apply for {selectedRole} Specialization
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Provide brief details for management review. Your account will remain active as Customer while your application is evaluated.
              </p>
            </div>

            <form onSubmit={handleConfirmApplication} className="space-y-4">
              {selectedRole === 'EXPERT' && (
                <div>
                  <label className="block text-xs font-semibold text-[#14283F] mb-1">
                    Portfolio or GitHub URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://github.com/your-username or portfolio"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#14283F] mb-1">
                  Experience / Promotional Background *
                </label>
                <textarea
                  required
                  rows={3}
                  value={applicationReason}
                  onChange={(e) => setApplicationReason(e.target.value)}
                  placeholder={
                    selectedRole === 'EXPERT'
                      ? 'Briefly describe your core technologies and notable past projects...'
                      : 'Describe your promotional channels, website, social handles, or audience...'
                  }
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8EDF2]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowApplyModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || !applicationReason.trim()}
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
