import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAffiliate } from '../../context/AffiliateContext';
import {
  Share2,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Send,
  Building,
  Users,
  Globe,
} from 'lucide-react';

const PROMOTION_CHANNEL_OPTIONS = [
  'Tech Blog / Industry Website',
  'YouTube / Video Tech Reviewer',
  'LinkedIn Professional Network',
  'X (Twitter) & Tech Creator Audience',
  'WhatsApp / Telegram Tech Community',
  'Developer / Tech Newsletter',
  'Campus / University Tech Ambassador',
  'Corporate Consultancy / IT Solutions Provider',
];

const PREFERRED_CATEGORIES = [
  'Laptops & Computing Hardware',
  'Audio & Acoustic Systems',
  'Workspace & Ergonomic Furniture',
  'Nexovira Academy Software Cohorts',
  'Applied AI & Multi-Agent Engineering',
];

export const AffiliateApplyPage: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { user } = useAuth();
  const { affiliateStatus, application, applyForProgram, isLoading } = useAffiliate();

  const [fullName, setFullName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [platformLinks, setPlatformLinks] = useState('');
  const [audienceDescription, setAudienceDescription] = useState('');
  const [promotionalExperience, setPromotionalExperience] = useState('');
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (!fullName && user.displayName) setFullName(user.displayName);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user, fullName, email]);

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const toggleCategory = (cat: string) => {
    setPreferredCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      navigate('/signin?redirect=/affiliate/apply');
      return;
    }

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setFormError('Please provide your full legal name, active email, and contact phone number.');
      return;
    }

    if (selectedChannels.length === 0) {
      setFormError('Please select at least one promotion channel.');
      return;
    }

    if (!audienceDescription.trim() || audienceDescription.length < 20) {
      setFormError('Please provide a brief description of your audience or promotional reach (at least 20 characters).');
      return;
    }

    if (!promotionalExperience.trim()) {
      setFormError('Please outline your previous promotional experience or distribution approach.');
      return;
    }

    setIsSubmitting(true);
    const result = await applyForProgram({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      promotionChannels: selectedChannels,
      platformLinks: platformLinks.trim() || undefined,
      audienceDescription: audienceDescription.trim(),
      promotionalExperience: promotionalExperience.trim(),
      preferredCategories,
      additionalInfo: additionalInfo.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error || 'Failed to submit application. Please try again.');
    }
  };

  // State 1: Unauthenticated
  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0682F4]/20 text-[#08E6F9] mx-auto flex items-center justify-center mb-6">
            <Share2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Sign In to Apply</h2>
          <p className="text-sm text-[#CCD2D9] mb-6">
            An authenticated Nexovira customer account is required to apply for the Affiliate Program and receive tracked referral commissions.
          </p>
          <button
            onClick={() => navigate(`/signin?redirect=${encodeURIComponent(currentPath)}`)}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#06C3F8] hover:from-[#0682F4] hover:to-[#08E6F9] shadow-lg shadow-[#0682F4]/20 transition cursor-pointer"
          >
            Sign In with Nexovira
          </button>
        </div>
      </div>
    );
  }

  // State 2: Already Approved
  if (affiliateStatus === 'APPROVED') {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full p-8 rounded-2xl bg-[#01213D]/40 border border-[#0682F4]/50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0682F4]/20 text-[#08E6F9] mx-auto flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2">You Are an Approved Affiliate!</h2>
          <p className="text-sm text-[#CCD2D9] mb-8 leading-relaxed">
            Your affiliate account is currently active. You can generate custom referral links, track visitor clicks, inspect pending commissions, and request payouts.
          </p>
          <button
            onClick={() => navigate('/affiliate/dashboard')}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] shadow-lg shadow-[#0682F4]/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            Launch Affiliate Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // State 3: Pending Review (Prevent duplicate application)
  if (affiliateStatus === 'PENDING_REVIEW') {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4">
        <div className="max-w-xl w-full p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/40 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] mx-auto flex items-center justify-center mb-6">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-[#01213D] text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-4 border border-[#0682F4]/30">
            Application Under Review
          </div>

          <h2 className="text-2xl font-extrabold mb-3">Application Received</h2>
          <p className="text-sm text-[#CCD2D9] mb-6 leading-relaxed">
            Thank you for applying to the Nexovira Affiliate Program. Our partner review desk is evaluating your promotional reach and audience profile.
          </p>

          {application && (
            <div className="text-left bg-[#000000]/50 rounded-xl p-5 mb-8 border border-[#2B7EB5]/20 text-xs space-y-2">
              <div className="flex justify-between border-b border-[#2B7EB5]/10 pb-2">
                <span className="text-[#CCD2D9]">Applicant:</span>
                <span className="font-semibold text-white">{application.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-[#2B7EB5]/10 pb-2">
                <span className="text-[#CCD2D9]">Contact Email:</span>
                <span className="font-semibold text-white">{application.email}</span>
              </div>
              <div className="flex justify-between border-b border-[#2B7EB5]/10 pb-2">
                <span className="text-[#CCD2D9]">Submitted On:</span>
                <span className="font-semibold text-white">
                  {new Date(application.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#CCD2D9]">Selected Channels:</span>
                <span className="font-semibold text-[#08E6F9]">
                  {application.promotionChannels.length} Channels
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/affiliate')}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-medium text-[#CCD2D9] bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#2B7EB5]/30 transition cursor-pointer"
            >
              Back to Overview
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#01213D] to-[#0682F4] hover:to-[#08E6F9] transition cursor-pointer"
            >
              Explore Nexovira Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Suspended or Rejected
  if (affiliateStatus === 'SUSPENDED' || affiliateStatus === 'REJECTED') {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#01213D] border border-[#2B7EB5]/50 text-[#CCD2D9] mx-auto flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-[#08E6F9]" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2">
            {affiliateStatus === 'SUSPENDED' ? 'Affiliate Account Suspended' : 'Application Not Approved'}
          </h2>
          <p className="text-sm text-[#CCD2D9] mb-6 leading-relaxed">
            {affiliateStatus === 'SUSPENDED'
              ? 'Your affiliate privileges have been temporarily paused due to management compliance review. Please contact partner support.'
              : 'Our partner desk was unable to approve your application at this time. You may contact partner support for more information.'}
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="w-full py-3.5 px-6 rounded-xl font-medium text-white bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#2B7EB5]/30 transition cursor-pointer"
          >
            Return to Marketplace
          </button>
        </div>
      </div>
    );
  }

  // State 5: Fresh Application Form
  return (
    <div className="min-h-screen bg-[#000000] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-4">
            <Share2 className="w-3.5 h-3.5" />
            Partner Application
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Apply to the Nexovira Affiliate Network
          </h1>
          <p className="mt-3 text-sm text-[#CCD2D9] max-w-xl mx-auto">
            Provide details about your audience and promotional channels. All applications undergo authoritative management review before approval.
          </p>
        </div>

        {/* Error banner */}
        {formError && (
          <div className="mb-8 p-4 rounded-xl bg-[#01213D]/60 border border-[#0682F4]/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#08E6F9] shrink-0 mt-0.5" />
            <div className="text-sm text-[#CCD2D9]">{formError}</div>
          </div>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Contact Information */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#2B7EB5]/20 pb-3">
              <Users className="w-5 h-5 text-[#08E6F9]" />
              Applicant Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Babatunde Adeleke"
                  className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                  Phone Number (with country code) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Channels & Reach */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#2B7EB5]/20 pb-3">
              <Globe className="w-5 h-5 text-[#08E6F9]" />
              Promotion Channels & Distribution
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-3">
                Where will you promote Nexovira? (Select all that apply) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROMOTION_CHANNEL_OPTIONS.map((channel) => {
                  const isChecked = selectedChannels.includes(channel);
                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleChannel(channel)}
                      className={`p-3.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#0682F4]/20 border-[#0682F4] text-white'
                          : 'bg-[#000000]/60 border-[#2B7EB5]/20 text-[#CCD2D9] hover:border-[#2B7EB5]/50'
                      }`}
                    >
                      <span>{channel}</span>
                      {isChecked && <CheckCircle className="w-4 h-4 text-[#08E6F9] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Platform / Social Media / Website URLs
              </label>
              <input
                type="text"
                value={platformLinks}
                onChange={(e) => setPlatformLinks(e.target.value)}
                placeholder="e.g. https://youtube.com/@mychannel, https://x.com/myhandle"
                className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-sm"
              />
              <p className="text-[11px] text-[#CCD2D9]/70 mt-1.5">
                Comma-separated links to your active channels, publication, or profile.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Audience Size & Demographics *
              </label>
              <textarea
                required
                rows={3}
                value={audienceDescription}
                onChange={(e) => setAudienceDescription(e.target.value)}
                placeholder="Describe your audience: estimated monthly views, subscriber count, developer communities, student base, or client segment..."
                className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-sm"
              />
            </div>
          </div>

          {/* Section 3: Promotional Experience & Category Alignment */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#2B7EB5]/20 pb-3">
              <Building className="w-5 h-5 text-[#08E6F9]" />
              Strategy & Focus
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Promotional Approach & Experience *
              </label>
              <textarea
                required
                rows={3}
                value={promotionalExperience}
                onChange={(e) => setPromotionalExperience(e.target.value)}
                placeholder="How do you plan to introduce Nexovira products or courses to your audience? (e.g. YouTube hardware unboxings, LinkedIn case studies, campus presentations...)"
                className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-3">
                Preferred Offer Categories
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PREFERRED_CATEGORIES.map((cat) => {
                  const isChecked = preferredCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#0682F4]/20 border-[#0682F4] text-white'
                          : 'bg-[#000000]/60 border-[#2B7EB5]/20 text-[#CCD2D9] hover:border-[#2B7EB5]/50'
                      }`}
                    >
                      <span>{cat}</span>
                      {isChecked && <CheckCircle className="w-4 h-4 text-[#08E6F9] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Additional Notes / Special Requests (Optional)
              </label>
              <textarea
                rows={2}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Any additional context you'd like our review team to consider..."
                className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-sm"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <p className="text-xs text-[#CCD2D9]">
              By submitting, you agree to the Nexovira Affiliate Terms and anti-fraud guidelines.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] shadow-lg shadow-[#0682F4]/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  Submit Application for Review
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
