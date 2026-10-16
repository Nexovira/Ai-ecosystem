import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldAlert,
  Info,
  Camera,
} from 'lucide-react';
import { AccountLayout } from '../../components/account/AccountLayout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const AccountProfilePage: React.FC = () => {
  const { user, profile, updateUserProfileData } = useAuth();

  const [fullName, setFullName] = useState(profile?.fullName || user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || user?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCopyId = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setFeedback({ type: 'error', message: 'Full name must be between 2 and 100 characters.' });
      setSaving(false);
      return;
    }

    const res = await updateUserProfileData({
      fullName: trimmedName,
      phoneNumber: phoneNumber.trim(),
      photoURL: photoURL.trim(),
    });

    setSaving(false);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Profile information updated successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update profile.' });
    }
  };

  return (
    <AccountLayout
      activeTab="profile"
      title="Personal Profile & Identity"
      subtitle="Manage your basic personal information and view protected account parameters."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Editable Information Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
              <span className="text-xs font-mono uppercase tracking-wider text-[#08E6F9]">
                Editable Profile Details
              </span>
              <span className="text-xs font-mono text-[#CCD2D9]/60">
                Self-managed
              </span>
            </div>

            {feedback && (
              <div
                className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
                  feedback.type === 'success'
                    ? 'bg-[#0682F4]/15 border-[#08E6F9]/40 text-[#08E6F9]'
                    : 'bg-[#01213D] border-[#2B7EB5]/50 text-[#CCD2D9]'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-[#08E6F9]" />
                )}
                <span className="leading-relaxed">{feedback.message}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#CCD2D9] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-white placeholder-[#CCD2D9]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#08E6F9] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#CCD2D9] mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={25}
                  placeholder="e.g. +234 800 000 0000"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-white placeholder-[#CCD2D9]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#08E6F9] focus:border-transparent transition-all"
                />
                <p className="text-[11px] text-[#CCD2D9]/60 font-mono mt-1">
                  Used for order delivery coordination and direct support contact.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#CCD2D9] mb-1.5">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  maxLength={500}
                  placeholder="https://images.example.com/avatar.jpg"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-white placeholder-[#CCD2D9]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#08E6F9] focus:border-transparent transition-all"
                />
                <p className="text-[11px] text-[#CCD2D9]/60 font-mono mt-1">
                  Provide a secure image URL (HTTPS required).
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Profile</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Privacy & Data Visibility Card */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Info className="w-4 h-4 text-[#08E6F9]" />
              <span>Public vs Private Information Policy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed text-[#CCD2D9]">
              <div className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1.5">
                <span className="font-bold text-[#08E6F9] block uppercase tracking-wider text-[10px]">
                  Shared Contextually
                </span>
                <p>
                  <strong>Full Name &amp; Delivery Address:</strong> Shared with authorized merchants strictly to fulfill and dispatch marketplace orders.
                </p>
                <p>
                  <strong>Contact Info:</strong> Available to assigned technical specialists when active project requests require coordination.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1.5">
                <span className="font-bold text-[#4DDEEA] block uppercase tracking-wider text-[10px]">
                  Strictly Confidential &amp; Protected
                </span>
                <p>
                  <strong>Email &amp; Security Credentials:</strong> Never visible publicly or sold to third parties.
                </p>
                <p>
                  <strong>Financial &amp; Commission Records:</strong> Strictly server-isolated and inaccessible to other members.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Protected Account Parameters */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20">
              <span className="text-xs font-mono uppercase tracking-wider text-[#08E6F9]">
                Protected Account Attributes
              </span>
              <Lock className="w-3.5 h-3.5 text-[#CCD2D9]/60" />
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* User ID */}
              <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1">
                <span className="text-[10px] text-[#CCD2D9]/60 uppercase tracking-wider block">
                  Authoritative User ID
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white truncate font-bold text-[11px]">
                    {user?.uid}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="p-1 rounded bg-[#011B33] hover:bg-[#0682F4]/20 text-[#08E6F9] transition-colors cursor-pointer shrink-0"
                    title="Copy User ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Email Address */}
              <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1">
                <span className="text-[10px] text-[#CCD2D9]/60 uppercase tracking-wider block">
                  Registered Email Address
                </span>
                <span className="text-white font-bold block truncate">
                  {user?.email}
                </span>
                <span className="text-[10px] text-[#08E6F9] block">
                  {user?.emailVerified ? 'Verified Email' : 'Verification Pending'}
                </span>
              </div>

              {/* Role */}
              <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1">
                <span className="text-[10px] text-[#CCD2D9]/60 uppercase tracking-wider block">
                  Ecosystem Security Role
                </span>
                <span className="text-[#08E6F9] font-bold block">
                  {profile?.role || 'CUSTOMER'}
                </span>
                <span className="text-[10px] text-[#CCD2D9]/60 block">
                  Roles are enforced server-authoritatively by Firebase rules.
                </span>
              </div>

              {/* Account Status */}
              <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1">
                <span className="text-[10px] text-[#CCD2D9]/60 uppercase tracking-wider block">
                  Account Standing
                </span>
                <span className="text-white font-bold block">
                  {profile?.accountStatus || 'ACTIVE'}
                </span>
              </div>

              {/* Joined Date */}
              <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1">
                <span className="text-[10px] text-[#CCD2D9]/60 uppercase tracking-wider block">
                  Member Registration Date
                </span>
                <span className="text-[#CCD2D9] block">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Verified Account'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
};
