import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Lock,
  Clock,
  Laptop,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Check,
  RefreshCw,
} from 'lucide-react';
import { AccountLayout } from '../../components/account/AccountLayout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { NotificationRecord } from '../../types/notification';

export const AccountSecurityPage: React.FC = () => {
  const { user, profile, changePassword, resendVerificationEmail, signOutUser, reloadCurrentUser } = useAuth();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Audit events state
  const [securityEvents, setSecurityEvents] = useState<NotificationRecord[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    async function loadSecurityEvents() {
      if (!user) return;
      try {
        setEventsLoading(true);
        const res = await fetch(`/api/account/security-audit?userId=${encodeURIComponent(user.uid)}`, {
          headers: {
            'x-user-id': user.uid,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSecurityEvents(data.events || []);
        }
      } catch (err) {
        console.warn('Error fetching security audit events:', err);
      } finally {
        setEventsLoading(false);
      }
    }
    loadSecurityEvents();
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (res.success) {
      setPasswordFeedback({ type: 'success', message: 'Your password was successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Dispatch security notification event
      if (user) {
        fetch('/api/notifications/security-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.uid,
          },
          body: JSON.stringify({
            userId: user.uid,
            type: 'PASSWORD_CHANGED',
            title: 'Account Password Changed',
            message: 'Your Nexovira account security credentials were successfully updated.',
          }),
        }).catch(() => {});
      }
    } else {
      setPasswordFeedback({ type: 'error', message: res.error || 'Password update failed. Verify current password.' });
    }
  };

  const handleResendEmail = async () => {
    setVerifying(true);
    setVerificationFeedback(null);
    const res = await resendVerificationEmail();
    setVerifying(false);
    if (res.success) {
      setVerificationFeedback('A verification email has been dispatched to your email address.');
    } else {
      setVerificationFeedback(res.error || 'Failed to dispatch verification email.');
    }
  };

  return (
    <AccountLayout
      activeTab="security"
      title="Security &amp; Credentials"
      subtitle="Safeguard your authentication credentials, review active sessions, and inspect security events."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Password & Email Verification */}
        <div className="lg:col-span-7 space-y-6">
          {/* Change Password Card */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#0682F4]/20">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#08E6F9]" />
                <span className="text-sm font-bold text-white">Change Account Password</span>
              </div>
              <span className="text-[11px] font-mono text-[#CCD2D9]/60">Strictly encrypted</span>
            </div>

            {passwordFeedback && (
              <div
                className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-[#0682F4]/15 border-[#08E6F9]/40 text-[#08E6F9]'
                    : 'bg-[#01213D] border-[#2B7EB5]/50 text-[#CCD2D9]'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-[#08E6F9]" />
                )}
                <span className="leading-relaxed">{passwordFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#CCD2D9] mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-white placeholder-[#CCD2D9]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#08E6F9] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#CCD2D9] mb-1.5">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-white placeholder-[#CCD2D9]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#08E6F9] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#CCD2D9] mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/40 text-white placeholder-[#CCD2D9]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#08E6F9] focus:border-transparent transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Email Verification Card */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#08E6F9]" />
                <span className="text-sm font-bold text-white">Email Address Verification</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                  user?.emailVerified
                    ? 'bg-[#0682F4]/20 text-[#08E6F9] border-[#08E6F9]/40'
                    : 'bg-[#01213D] text-[#CCD2D9] border-[#2B7EB5]/30'
                }`}
              >
                {user?.emailVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#CCD2D9]">
              <div>
                <p className="text-white font-mono text-sm">{user?.email}</p>
                <p className="mt-1 leading-relaxed">
                  {user?.emailVerified
                    ? 'Your email is confirmed and authenticated for account recovery.'
                    : 'Please verify your email address to enable priority communications and security notices.'}
                </p>
              </div>

              {!user?.emailVerified && (
                <button
                  onClick={handleResendEmail}
                  disabled={verifying}
                  className="px-4 py-2 rounded-xl bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/40 text-xs font-semibold text-[#08E6F9] hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  {verifying ? 'Sending...' : 'Resend Verification'}
                </button>
              )}
            </div>

            {verificationFeedback && (
              <p className="text-xs text-[#08E6F9] font-mono pt-2">{verificationFeedback}</p>
            )}
          </div>
        </div>

        {/* Right Column: Active Session & Security Events */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Session Card */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20">
              <span className="text-xs font-mono uppercase tracking-wider text-[#08E6F9]">
                Active Browser Session
              </span>
              <Laptop className="w-3.5 h-3.5 text-[#CCD2D9]/60" />
            </div>

            <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Current Web Device</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0682F4]/20 text-[#08E6F9] border border-[#08E6F9]/30">
                  Active Now
                </span>
              </div>

              <div className="space-y-1 text-[#CCD2D9]/70 font-mono text-[11px]">
                <p>Platform: {navigator.platform || 'Standard Web Client'}</p>
                <p>Status: Signed in via Firebase Identity</p>
              </div>

              <div className="pt-2 border-t border-[#0682F4]/15 flex justify-end">
                <button
                  onClick={() => signOutUser()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-xs font-semibold text-[#CCD2D9] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Security Activity Log Card */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20">
              <span className="text-xs font-mono uppercase tracking-wider text-[#08E6F9]">
                Security Audit Trail
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#CCD2D9]/60" />
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {eventsLoading ? (
                <div className="p-6 text-center text-xs text-[#CCD2D9]">
                  <div className="w-5 h-5 border-2 border-[#0682F4] border-t-[#08E6F9] rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading audit log...</span>
                </div>
              ) : securityEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#CCD2D9]">
                  <p className="font-semibold text-white">No security alerts recorded</p>
                  <p className="text-[11px] text-[#CCD2D9]/60 mt-1">
                    Your account has maintained steady, verified standing.
                  </p>
                </div>
              ) : (
                securityEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px] truncate">{evt.title}</span>
                      <span className="text-[10px] font-mono text-[#CCD2D9]/60">
                        {new Date(evt.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#CCD2D9] leading-relaxed">
                      {evt.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
};
