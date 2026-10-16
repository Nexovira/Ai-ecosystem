import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

interface AdminConfigStatus {
  success: boolean;
  administratorEmail: string;
  role: string;
  managementRoute: string;
  loginRoute: string;
  signInMethods: Array<{
    id: string;
    name: string;
    recommended: boolean;
    description: string;
  }>;
  rbacEnforced: boolean;
  securityRulesHardened: boolean;
  bootstrapProtected: boolean;
}

export const AdminSetupPage: React.FC = () => {
  const { user, profile, signInWithGoogle } = useAuth();
  const { navigate } = useRouter();

  const [status, setStatus] = useState<AdminConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/first-admin-status')
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load admin status:', err);
        setLoading(false);
      });
  }, []);

  const handleDispatchPasswordReset = async () => {
    setDispatchLoading(true);
    setDispatchResult(null);
    try {
      const res = await fetch('/api/auth/bootstrap-first-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nexoviratech@gmail.com' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDispatchResult({
          success: true,
          message: data.message || 'Password establishment link sent to nexoviratech@gmail.com.',
        });
      } else {
        setDispatchResult({
          success: false,
          message: data.error || 'Failed to dispatch password setup instructions.',
        });
      }
    } catch {
      setDispatchResult({
        success: false,
        message: 'Network error communicating with the authentication authority.',
      });
    } finally {
      setDispatchLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const result = await signInWithGoogle();
    if (result.success) {
      navigate('/management');
    } else if (result.error) {
      setAuthError(result.error);
    }
  };

  const isCurrentAdmin =
    profile?.role === 'SUPER_ADMIN' ||
    user?.email?.toLowerCase() === 'nexoviratech@gmail.com';

  return (
    <div className="py-12 sm:py-20 bg-[#01213D] min-h-[85vh] flex items-center justify-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#0682F4]/10 blur-[120px] rounded-full pointer-events-none" />

      <Container size="narrow" className="relative z-10">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex justify-center mb-1">
              <Logo size="md" onClick={() => navigate('/')} />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0682F4]/10 border border-[#08E6F9]/30 text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrator Control Center
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              FIRST ADMINISTRATOR CONFIGURATION
            </h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9]/80 font-normal max-w-md mx-auto">
              Secure, server-authoritative credential establishment and role verification for the Nexovira Platform.
            </p>
          </div>

          {/* Active Session Status if logged in as Admin */}
          {user && isCurrentAdmin && (
            <div className="p-5 rounded-2xl bg-[#011629] border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Active Administrator Session Verified</h3>
                  <p className="text-xs text-[#CCD2D9]">
                    Signed in as <strong className="text-emerald-400">{user.email}</strong> with role{' '}
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                      {profile?.role || 'SUPER_ADMIN'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => navigate('/management')}
                  className="flex items-center justify-center gap-2"
                >
                  <span>Launch Management Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Configuration Card */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-[#011629] space-y-6">
            {/* Identity Banner */}
            <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/30 space-y-2">
              <div className="text-[11px] font-mono tracking-wider text-[#08E6F9] uppercase font-bold">
                Designated Administrator Account
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-white font-mono text-sm sm:text-base font-bold">
                  <Mail className="w-4 h-4 text-[#0682F4]" />
                  <span>nexoviratech@gmail.com</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#0682F4]/20 border border-[#08E6F9]/40 text-[#08E6F9]">
                  SUPER_ADMIN Clearance
                </span>
              </div>
            </div>

            {/* Error notifications */}
            {authError && (
              <div className="p-3.5 rounded-lg bg-[#011629] border border-red-500/40 text-xs text-[#CCD2D9] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {dispatchResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                  dispatchResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-red-950/40 border-red-500/40 text-red-200'
                }`}
              >
                {dispatchResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{dispatchResult.message}</span>
              </div>
            )}

            {/* Credential Establishment Options */}
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-widest text-[#CCD2D9]/70 font-semibold">
                Credential Establishment Options
              </div>

              {/* Option A: Google Authentication (Recommended) */}
              <div className="p-4 rounded-xl bg-[#01213D]/70 border border-[#0682F4]/20 hover:border-[#08E6F9]/40 transition space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Method 1: Google Sign-In</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-xs text-[#CCD2D9]/80 mt-1 leading-relaxed">
                      Instant, cryptographic sign-in using your verified Google account. No manual password needed.
                      Automatically grants SUPER_ADMIN upon popup approval.
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center gap-2 border-[#0682F4]/40 hover:border-[#08E6F9]"
                >
                  <Sparkles className="w-4 h-4 text-[#08E6F9]" />
                  <span>Authenticate with Google (nexoviratech@gmail.com)</span>
                </Button>
              </div>

              {/* Option B: Dispatch Password Reset Email */}
              <div className="p-4 rounded-xl bg-[#01213D]/70 border border-[#0682F4]/20 hover:border-[#08E6F9]/40 transition space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Method 2: Set / Reset Password via Email</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0682F4]/20 text-[#08E6F9] font-bold border border-[#0682F4]/40">
                      SECURE OOB LINK
                    </span>
                  </div>
                  <p className="text-xs text-[#CCD2D9]/80 mt-1 leading-relaxed">
                    Sends an official Firebase password setup link directly to <strong>nexoviratech@gmail.com</strong>.
                    Establish your private password securely without exposing credentials to logs or third parties.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleDispatchPasswordReset}
                  disabled={dispatchLoading}
                  className="flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>{dispatchLoading ? 'Dispatching Link...' : 'Send Password Setup Link to Email'}</span>
                </Button>
              </div>
            </div>

            {/* Security Assertions Checklist */}
            <div className="pt-2 border-t border-[#0682F4]/20 space-y-2.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#CCD2D9]/70 font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#08E6F9]" />
                Security Invariants & Protections
              </div>
              <ul className="text-xs text-[#CCD2D9]/80 space-y-1.5 pl-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Server-authoritative role verification at <code>requireManagementAuth</code></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Zero-trust Firestore security rules: Ordinary users cannot self-assign admin roles</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Rate-limited bootstrap endpoint to prevent repeated enumeration or spam attacks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Comprehensive audit logging for all administrative actions and security mutations</span>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs">
              <button
                onClick={() => navigate('/signin')}
                className="text-[#08E6F9] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Go to Regular Sign-In Page</span>
              </button>
              <button
                onClick={() => navigate('/management')}
                className="text-[#CCD2D9] hover:text-white cursor-pointer flex items-center gap-1"
              >
                <span>Management Hub URL: <code>/management</code></span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
