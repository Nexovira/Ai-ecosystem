import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAffiliate } from '../../context/AffiliateContext';
import {
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface AffiliateOnboardingChecklistProps {
  onSetupClick?: () => void;
  showActions?: boolean;
}

export const AffiliateOnboardingChecklist: React.FC<AffiliateOnboardingChecklistProps> = ({
  onSetupClick,
  showActions = true,
}) => {
  const { navigate } = useRouter();
  const { profile, application } = useAffiliate();

  const isApproved = profile?.status === 'APPROVED' || application?.status === 'APPROVED';
  const hasBankDetails = Boolean(profile?.payoutProfile?.accountNumber && profile?.payoutProfile?.bankCode);
  const isVerified = Boolean(profile?.payoutProfile?.isVerified);
  const isProfileSaved = Boolean(profile?.payoutProfile && isVerified);
  const isDashboardUnlocked = isApproved && isVerified;

  const approvalDate = application?.reviewedDate || profile?.createdAt;
  const formattedApprovalDate = approvalDate
    ? new Date(approvalDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  const stages = [
    {
      id: 1,
      title: 'Affiliate application approved',
      description: `Approved on ${formattedApprovalDate}. Identity and promotional channels validated.`,
      isComplete: isApproved,
      isCurrent: !isApproved,
    },
    {
      id: 2,
      title: 'Bank payout details entered',
      description: 'Select your commercial or microfinance bank and 10-digit NUBAN account number.',
      isComplete: hasBankDetails,
      isCurrent: isApproved && !hasBankDetails,
    },
    {
      id: 3,
      title: 'Bank account successfully verified',
      description: 'Live account-name resolution via Paystack official verification gateway.',
      isComplete: isVerified,
      isCurrent: hasBankDetails && !isVerified,
    },
    {
      id: 4,
      title: 'Payout profile saved',
      description: 'Server-authenticated record linked to your Nexovira affiliate wallet.',
      isComplete: isProfileSaved,
      isCurrent: isVerified && !isProfileSaved,
    },
    {
      id: 5,
      title: 'Affiliate promotion dashboard unlocked',
      description: 'Generate unique referral links, track conversion attribution, and view commissions.',
      isComplete: isDashboardUnlocked,
      isCurrent: isProfileSaved && !isDashboardUnlocked,
    },
  ];

  const handleAction = () => {
    if (onSetupClick) {
      onSetupClick();
    } else {
      navigate('/affiliate/payout');
    }
  };

  return (
    <div className="rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 p-6 sm:p-8 backdrop-blur-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#2B7EB5]/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0682F4]/20 border border-[#0682F4]/40 text-[#08E6F9] text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Application Accepted
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Your affiliate application has been accepted.
          </h2>
          <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">
            Next step: Verify your bank account to activate your affiliate dashboard.
          </p>
        </div>

        {showActions && !isDashboardUnlocked && (
          <button
            onClick={handleAction}
            className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] transition shadow-md shadow-[#0682F4]/20 cursor-pointer flex items-center gap-2 whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <Building2 className="w-4 h-4" />
            Set Up Payout Account
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Decision Details Bar */}
      {application && (
        <div className="mt-4 p-3.5 rounded-xl bg-[#000000]/50 border border-[#2B7EB5]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#CCD2D9]">
            <Calendar className="w-4 h-4 text-[#08E6F9]" />
            <span>Decision Date:</span>
            <strong className="text-white">{formattedApprovalDate}</strong>
          </div>
          <div className="flex items-center gap-2 text-[#CCD2D9]">
            <FileCheck className="w-4 h-4 text-[#08E6F9]" />
            <span>Assigned Partner Code:</span>
            <strong className="text-[#08E6F9] font-mono">{profile?.affiliateCode || 'Generated on verification'}</strong>
          </div>
          {application.reviewNotes && (
            <div className="w-full pt-2 border-t border-[#2B7EB5]/10 text-xs text-[#CCD2D9]">
              <span className="font-semibold text-white">Partner Review Note:</span> {application.reviewNotes}
            </div>
          )}
        </div>
      )}

      {/* 5-Stage Checklist */}
      <div className="mt-6 space-y-4">
        <div className="text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
          Onboarding Activation Checklist (5 Stages)
        </div>

        {stages.map((stage) => {
          return (
            <div
              key={stage.id}
              className={`p-4 rounded-xl border transition flex items-start gap-4 ${
                stage.isComplete
                  ? 'bg-[#01213D]/60 border-[#0682F4]/40 text-white'
                  : stage.isCurrent
                  ? 'bg-[#01213D]/90 border-[#08E6F9] text-white shadow-sm shadow-[#0682F4]/10'
                  : 'bg-[#000000]/40 border-[#2B7EB5]/20 text-[#CCD2D9]/70'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {stage.isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-[#08E6F9]" />
                ) : stage.isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#08E6F9] flex items-center justify-center text-[10px] font-bold text-[#08E6F9] animate-pulse">
                    {stage.id}
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-[#2B7EB5]/40" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-xs sm:text-sm font-bold ${
                      stage.isComplete
                        ? 'text-white'
                        : stage.isCurrent
                        ? 'text-[#08E6F9]'
                        : 'text-[#CCD2D9]/80'
                    }`}
                  >
                    Stage {stage.id}: {stage.title}
                  </h4>
                  {stage.isComplete && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0682F4]/20 text-[#08E6F9] uppercase tracking-wider">
                      Done
                    </span>
                  )}
                  {stage.isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#08E6F9]/20 text-[#08E6F9] uppercase tracking-wider animate-pulse">
                      Action Required
                    </span>
                  )}
                  {!stage.isComplete && !stage.isCurrent && (
                    <span className="flex items-center gap-1 text-[10px] text-[#CCD2D9]/50">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#CCD2D9] mt-1 leading-relaxed">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Guarantee Note */}
      <div className="mt-6 p-4 rounded-xl bg-[#000000]/60 border border-[#2B7EB5]/20 flex items-start gap-3 text-xs text-[#CCD2D9]">
        <AlertCircle className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
        <p>
          <strong className="text-white">Security & Regulatory Compliance:</strong> Bank account resolution is conducted securely through Paystack official verification endpoints. Your credentials are never stored in browser memory or public scripts.
        </p>
      </div>
    </div>
  );
};
