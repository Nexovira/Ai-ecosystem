import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  ShieldCheck,
  Check,
  AlertCircle,
  SlidersHorizontal,
  ArrowLeft,
  Lock,
  Package,
  CreditCard,
  GraduationCap,
  Briefcase,
  Share2,
  Megaphone,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { UserNotificationPreferences } from '../../types/notification';

export const NotificationPreferencesPage: React.FC = () => {
  const { preferences, preferencesLoading, savePreferences } = useNotifications();
  const { user } = useAuth();
  const { navigate } = useRouter();

  const [formState, setFormState] = useState<Partial<UserNotificationPreferences>>({
    inAppOrders: true,
    inAppPayments: true,
    inAppAcademy: true,
    inAppServices: true,
    inAppAffiliate: true,
    inAppMarketing: true,
    emailOrders: true,
    emailPayments: true,
    emailAcademy: true,
    emailServices: true,
    emailAffiliate: true,
    emailMarketing: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (preferences) {
      setFormState({
        inAppOrders: preferences.inAppOrders,
        inAppPayments: preferences.inAppPayments,
        inAppAcademy: preferences.inAppAcademy,
        inAppServices: preferences.inAppServices,
        inAppAffiliate: preferences.inAppAffiliate,
        inAppMarketing: preferences.inAppMarketing,
        emailOrders: preferences.emailOrders,
        emailPayments: preferences.emailPayments,
        emailAcademy: preferences.emailAcademy,
        emailServices: preferences.emailServices,
        emailAffiliate: preferences.emailAffiliate,
        emailMarketing: preferences.emailMarketing,
      });
    }
  }, [preferences]);

  const handleToggle = (key: keyof UserNotificationPreferences) => {
    setFormState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    const ok = await savePreferences(formState);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#000000] text-white py-24 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 text-center space-y-4">
          <SlidersHorizontal className="w-12 h-12 text-[#08E6F9] mx-auto opacity-60" />
          <h2 className="text-xl font-bold">Authentication Required</h2>
          <p className="text-sm text-[#CCD2D9]">
            Please sign in to configure your personal notification delivery settings.
          </p>
          <button
            onClick={() => navigate('/signin?redirect=/settings/notifications')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] font-bold text-white cursor-pointer hover:opacity-95"
          >
            Sign In to Nexovira
          </button>
        </div>
      </div>
    );
  }

  const preferenceItems = [
    {
      title: 'Orders & Marketplace',
      desc: 'Order confirmations, merchant fulfillment alerts, and shipping progress updates.',
      icon: <Package className="w-5 h-5 text-[#06C3F8]" />,
      inAppKey: 'inAppOrders' as const,
      emailKey: 'emailOrders' as const,
    },
    {
      title: 'Payments & Billing',
      desc: 'Real-time payment verification, invoices, transaction receipts, and refunds.',
      icon: <CreditCard className="w-5 h-5 text-[#08E6F9]" />,
      inAppKey: 'inAppPayments' as const,
      emailKey: 'emailPayments' as const,
    },
    {
      title: 'Academy & Scholarships',
      desc: 'Scholarship application milestones, admission decisions, and cohort schedule notices.',
      icon: <GraduationCap className="w-5 h-5 text-[#0682F4]" />,
      inAppKey: 'inAppAcademy' as const,
      emailKey: 'emailAcademy' as const,
    },
    {
      title: 'Tech & Digital Services',
      desc: 'Project request updates, contractor assignments, milestone approvals, and delivery handoffs.',
      icon: <Briefcase className="w-5 h-5 text-[#26B2E2]" />,
      inAppKey: 'inAppServices' as const,
      emailKey: 'emailServices' as const,
    },
    {
      title: 'Affiliate & Referrals',
      desc: 'Referral link conversion pings, commission clearance notices, and bank payout reviews.',
      icon: <Share2 className="w-5 h-5 text-[#08E6F9]" />,
      inAppKey: 'inAppAffiliate' as const,
      emailKey: 'emailAffiliate' as const,
    },
    {
      title: 'Marketing & Announcements',
      desc: 'Ecosystem feature launches, hardware restocks, seasonal cohorts, and promotional offers.',
      icon: <Megaphone className="w-5 h-5 text-[#4DDEEA]" />,
      inAppKey: 'inAppMarketing' as const,
      emailKey: 'emailMarketing' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/notifications')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#08E6F9] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Notification Center</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#01213D]">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Notification Preferences
              </h1>
              <p className="text-sm text-[#CCD2D9] mt-1">
                Customize which ecosystem events trigger in-app banners or email communications.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || preferencesLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] font-bold text-sm text-white shadow-lg shadow-[#0682F4]/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-xl bg-[#0682F4]/10 border border-[#08E6F9]/40 text-[#08E6F9] text-sm flex items-center gap-3">
            <Check className="w-5 h-5 shrink-0" />
            <span>Your notification preferences have been successfully updated.</span>
          </div>
        )}

        {/* Security Notice (Mandatory) */}
        <div className="p-5 rounded-2xl bg-[#011B33] border border-[#0682F4]/40 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Security Alerts &amp; Critical Notices</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0682F4]/20 text-[#08E6F9] border border-[#08E6F9]/30">
                Always Active
              </span>
            </div>
            <p className="text-xs text-[#CCD2D9] leading-relaxed">
              To protect your account, critical security events (including password changes, suspicious sessions, and administrative oversight alerts) are non-disableable and automatically routed to all active channels.
            </p>
          </div>
        </div>

        {/* Preference Settings Grid */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/20 divide-y divide-[#0682F4]/10 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-3.5 bg-[#01213D] flex items-center justify-between text-xs font-semibold text-[#CCD2D9] uppercase tracking-wider">
              <span>Notification Category</span>
              <div className="flex items-center gap-8">
                <span className="w-16 text-center">In-App</span>
                <span className="w-16 text-center">Email</span>
              </div>
            </div>

            {preferenceItems.map((item) => (
              <div
                key={item.title}
                className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#01213D]/40 transition-colors"
              >
                <div className="flex items-start gap-3.5 max-w-lg">
                  <div className="p-2 rounded-lg bg-[#01213D] border border-[#0682F4]/20 shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-[#CCD2D9]/70 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-8 pt-2 sm:pt-0 self-end sm:self-center">
                  {/* In-App Toggle */}
                  <label className="w-16 flex justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formState[item.inAppKey])}
                      onChange={() => handleToggle(item.inAppKey)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-[#01213D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CCD2D9] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0682F4] border border-[#0682F4]/40 relative" />
                  </label>

                  {/* Email Toggle */}
                  <label className="w-16 flex justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formState[item.emailKey])}
                      onChange={() => handleToggle(item.emailKey)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-[#01213D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CCD2D9] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0682F4] border border-[#0682F4]/40 relative" />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || preferencesLoading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] font-bold text-sm text-white shadow-lg shadow-[#0682F4]/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? 'Saving Changes...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
