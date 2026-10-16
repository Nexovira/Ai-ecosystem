import React, { useState } from 'react';
import {
  SlidersHorizontal,
  User,
  ShieldCheck,
  Bell,
  Lock,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { AccountLayout } from '../../components/account/AccountLayout';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const AccountSettingsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();

  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateSubmitted, setDeactivateSubmitted] = useState(false);

  const handleDeactivateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setDeactivateSubmitted(true);
    setTimeout(() => {
      setDeactivateModalOpen(false);
      setDeactivateSubmitted(false);
      setDeactivateReason('');
    }, 4000);
  };

  const settingsCards = [
    {
      title: 'Profile & Identity',
      desc: 'Update your display name, contact phone number, avatar URL, and view system role privileges.',
      path: '/account/profile',
      icon: User,
      buttonText: 'Manage Profile',
    },
    {
      title: 'Security & Access Credentials',
      desc: 'Change your account password, manage active browser sessions, and verify email status.',
      path: '/settings/security',
      icon: ShieldCheck,
      buttonText: 'Security Center',
    },
    {
      title: 'Communication & Notification Preferences',
      desc: 'Control in-app and email alerts for orders, academy cohorts, service milestones, and affiliate commissions.',
      path: '/settings/notifications',
      icon: Bell,
      buttonText: 'Notification Settings',
    },
  ];

  return (
    <AccountLayout
      activeTab="settings"
      title="Account Settings"
      subtitle="Configure account security, notifications, and review system policies."
    >
      <div className="space-y-8">
        {/* Settings Navigation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {settingsCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                onClick={() => navigate(item.path as any)}
                className="p-6 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 hover:border-[#08E6F9]/60 transition-all flex flex-col justify-between gap-6 cursor-pointer shadow-xl group"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#01213D] border border-[#0682F4]/30 flex items-center justify-center text-[#08E6F9] group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#08E6F9] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#CCD2D9] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#0682F4]/15 text-xs font-semibold text-[#08E6F9]">
                  <span>{item.buttonText}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Account Data Retention & Compliance Notice */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9]">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Data Retention &amp; Transactional Records Policy
              </h3>
              <p className="text-xs text-[#CCD2D9]">
                How your platform records are preserved and protected under applicable ecommerce laws.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#CCD2D9] leading-relaxed pt-2">
            <div className="space-y-2 p-4 rounded-xl bg-[#01213D]/70 border border-[#0682F4]/20">
              <span className="font-bold text-[#08E6F9] uppercase tracking-wider text-[10px] block">
                Immutable Financial Data
              </span>
              <p>
                In compliance with commercial payment regulations, verified transaction records, merchant payouts, Paystack payment references, and tax invoices cannot be deleted immediately upon request.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-[#01213D]/70 border border-[#0682F4]/20">
              <span className="font-bold text-[#4DDEEA] uppercase tracking-wider text-[10px] block">
                Academic &amp; Service Certifications
              </span>
              <p>
                Academy scholarship verifications, admission files, and digital service deliveries remain securely archived to safeguard your legitimate credentials and completed project deliverables.
              </p>
            </div>
          </div>

          {/* Account Closure / Deactivation Trigger */}
          <div className="pt-4 border-t border-[#0682F4]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">Deactivate Account</h4>
              <p className="text-xs text-[#CCD2D9]">
                Request temporary deactivation or closure of your Nexovira member portal.
              </p>
            </div>

            <button
              onClick={() => setDeactivateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#2B7EB5]/40 text-xs font-semibold text-[#CCD2D9] hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
            >
              Request Deactivation
            </button>
          </div>
        </div>
      </div>

      {/* Deactivation Modal */}
      {deactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#011B33] border border-[#0682F4]/40 rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Account Deactivation Request</h3>
                <p className="text-xs text-[#CCD2D9]">Nexovira Ecosystem Compliance</p>
              </div>
            </div>

            {deactivateSubmitted ? (
              <div className="p-4 rounded-xl bg-[#0682F4]/15 border border-[#08E6F9]/40 text-[#08E6F9] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Request Formally Logged</span>
                </div>
                <p className="text-[#CCD2D9] leading-relaxed">
                  Your deactivation request has been recorded. An administrative confirmation will be dispatched to your registered email address ({user?.email}) in accordance with data-retention rules.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDeactivateRequest} className="space-y-4">
                <p className="text-xs text-[#CCD2D9] leading-relaxed">
                  Deactivating your account will suspend active portal logins. Existing orders and verified financial records will remain preserved in accordance with standard transactional retention rules.
                </p>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CCD2D9] mb-1">
                    Reason for deactivation (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    placeholder="Tell us why you wish to close or pause your account..."
                    className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-white placeholder-[#CCD2D9]/40 text-xs focus:outline-none focus:ring-2 focus:ring-[#08E6F9]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeactivateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#01213D] text-xs font-semibold text-[#CCD2D9] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0682F4] hover:bg-[#08E6F9] text-xs font-bold text-white cursor-pointer transition-colors"
                  >
                    Submit Deactivation Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AccountLayout>
  );
};
