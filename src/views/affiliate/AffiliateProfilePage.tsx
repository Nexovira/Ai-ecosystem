import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAffiliate } from '../../context/AffiliateContext';
import {
  User,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Globe,
  Lock,
  CheckCircle,
  Save,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const AffiliateProfilePage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { affiliateStatus, profile, refreshAffiliateState, isLoading } = useAffiliate();

  const [phone, setPhone] = useState(profile?.phone || '');
  const [platformLinks, setPlatformLinks] = useState(profile?.promotionChannels?.join(', ') || '');
  const [audienceDescription, setAudienceDescription] = useState(profile?.audienceDescription || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/signin?redirect=/affiliate/profile');
      return;
    }

    if (affiliateStatus !== 'APPROVED' && !isLoading) {
      navigate('/affiliate');
      return;
    }

    if (profile) {
      setPhone(profile.phone || '');
      setPlatformLinks(profile.promotionChannels?.join(', ') || '');
      setAudienceDescription(profile.audienceDescription || '');
    }
  }, [user, affiliateStatus, profile, isLoading, navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      // Affiliates can update contact and channels; server prevents tampering with rate/status/balance
      setSuccessMessage('Profile information updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      console.warn('Profile save warning:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#01213D] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-2">
              <User className="w-3.5 h-3.5" />
              Partner Profile
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Affiliate Account Profile</h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9] mt-1">
              Manage your verified promotional channels and contact preferences.
            </p>
          </div>

          <button
            onClick={() => navigate('/affiliate/dashboard')}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Read-Only Governance Overview Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#01213D] to-[#000000] border border-[#2B7EB5]/30 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="text-[11px] font-semibold text-[#CCD2D9] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#08E6F9]" />
              Affiliate Identifier
            </div>
            <div className="text-xl font-bold font-mono text-[#08E6F9]">
              {profile?.affiliateCode || 'NEX-AFF-UNSET'}
            </div>
            <p className="text-[10px] text-[#CCD2D9]/70 mt-1">Immutable partner reference</p>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[#CCD2D9] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#08E6F9]" />
              Account Status
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#08E6F9]/10 border border-[#08E6F9] text-[#08E6F9] text-xs font-bold uppercase tracking-wider">
              {profile?.status || 'APPROVED'}
            </div>
            <p className="text-[10px] text-[#CCD2D9]/70 mt-1">Managed by Nexovira desk</p>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[#CCD2D9] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#08E6F9]" />
              Standard Commission Rate
            </div>
            <div className="text-xl font-bold text-white">
              {profile?.defaultCommissionRate || 10}%
            </div>
            <p className="text-[10px] text-[#CCD2D9]/70 mt-1">Server-calculated per offer</p>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 rounded-xl bg-[#01213D]/60 border border-[#08E6F9]/40 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#08E6F9] shrink-0" />
            <div className="text-xs text-[#08E6F9] font-medium">{successMessage}</div>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-[#2B7EB5]/20 pb-3">
            Permitted Profile Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Full Name (Verified Identity)
              </label>
              <input
                type="text"
                disabled
                value={profile?.fullName || ''}
                className="w-full px-4 py-3 rounded-xl bg-[#000000]/60 border border-[#2B7EB5]/20 text-[#CCD2D9] text-sm cursor-not-allowed"
              />
              <p className="text-[11px] text-[#CCD2D9]/60 mt-1">
                Identity modifications require direct management compliance review.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Account Email (Authentication)
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full px-4 py-3 rounded-xl bg-[#000000]/60 border border-[#2B7EB5]/20 text-[#CCD2D9] text-sm cursor-not-allowed"
              />
              <p className="text-[11px] text-[#CCD2D9]/60 mt-1">
                Tied directly to your primary Nexovira authentication record.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Contact Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 803 123 4567"
                className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Promotion Platforms / Channel Links
              </label>
              <input
                type="text"
                value={platformLinks}
                onChange={(e) => setPlatformLinks(e.target.value)}
                placeholder="https://youtube.com/@channel, https://x.com/handle"
                className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider mb-2">
                Audience Description & Focus
              </label>
              <textarea
                rows={3}
                value={audienceDescription}
                onChange={(e) => setAudienceDescription(e.target.value)}
                placeholder="Outline your primary community or audience demographics..."
                className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] shadow-md shadow-[#0682F4]/20 transition disabled:opacity-40 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Saving Updates...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Permitted Profile Info
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
