import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, RefreshCw, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

export const VerifyEmailPage: React.FC = () => {
  const { user, profile, resendVerificationEmail, verifyEmailWithActionCode, reloadCurrentUser } = useAuth();
  const { navigate } = useRouter();

  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Read email or action code parameters from query string if available
  const [paramEmail, setParamEmail] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailInQuery = params.get('email');
      if (emailInQuery) setParamEmail(emailInQuery);

      const oobCode = params.get('oobCode');
      const mode = params.get('mode');

      // If user arrived from clicking verification link in their email
      if (oobCode && (mode === 'verifyEmail' || !mode)) {
        setVerifyingCode(true);
        verifyEmailWithActionCode(oobCode).then((res) => {
          setVerifyingCode(false);
          if (res.success) {
            setFeedback({
              type: 'success',
              message: res.message || 'Your email address has been successfully verified! Account active.',
            });
            setTimeout(() => navigate('/account'), 1500);
          } else {
            setFeedback({
              type: 'error',
              message: res.error || 'Verification link expired or already used. Please request a new link.',
            });
          }
        });
      }
    }
  }, [verifyEmailWithActionCode, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setFeedback(null);

    const result = await resendVerificationEmail();
    setResending(false);

    if (result.success) {
      setFeedback({ type: 'success', message: result.message || 'Verification link dispatched successfully. Please check your inbox.' });
      setCooldown(60);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to dispatch verification email.' });
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setFeedback(null);
    const isVerified = await reloadCurrentUser();
    setChecking(false);

    if (isVerified) {
      setFeedback({ type: 'success', message: 'Email confirmed! Your account is fully active. Redirecting...' });
      setTimeout(() => navigate('/account'), 1200);
    } else {
      setFeedback({
        type: 'error',
        message: 'Email not yet verified. Please click the link received in your inbox and try again.',
      });
    }
  };

  const userEmail = user?.email || profile?.email || paramEmail || 'your registered email';
  const isAlreadyVerified = Boolean(user?.emailVerified || profile?.emailVerified);

  return (
    <div className="py-16 sm:py-24 bg-[#F7F8FA] min-h-[85vh] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-gradient-to-r from-[#08B3F8]/10 to-[#0169FA]/5 blur-3xl rounded-full pointer-events-none" />

      <Container size="narrow" className="relative z-10">
        <div className="max-w-md mx-auto">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex justify-center mb-1">
              <Logo size="md" variant="dark" onClick={() => navigate('/')} />
            </div>
            <div className="text-xs font-semibold tracking-wider text-[#0169FA] uppercase">
              Account Security
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14283F] tracking-tight">
              {isAlreadyVerified ? 'Email Verified' : 'Check Your Email'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] font-normal">
              {isAlreadyVerified
                ? 'Your email address is verified and active across all Nexovira services.'
                : "Your Nexovira account has been created successfully. We've sent a verification link to your email address."}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white border border-[#E8EDF2] rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            
            {/* Feedback alert */}
            {feedback && (
              <div
                className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{feedback.message}</span>
              </div>
            )}

            {verifyingCode ? (
              <div className="text-center py-8 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0169FA]" />
                <p className="text-sm font-semibold text-[#14283F]">Verifying your email token...</p>
                <p className="text-xs text-[#6B7280]">Please wait while we confirm your credentials with Firebase Authentication.</p>
              </div>
            ) : isAlreadyVerified ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#14283F]">
                  Email Address Verified
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280]">
                  Your email address (<strong className="text-[#14283F] font-mono">{userEmail}</strong>) is confirmed. Your account is active.
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => navigate('/account')}
                  >
                    <span>Proceed to Account Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#0169FA]/10 border border-[#0169FA]/20 flex items-center justify-center text-[#0169FA] mx-auto">
                  <Mail className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-[#6B7280]">Verification email sent to:</span>
                  <div className="text-sm font-semibold text-[#14283F] font-mono break-all px-3 py-2 rounded-xl bg-[#F7F8FA] border border-[#E8EDF2]">
                    {userEmail}
                  </div>
                </div>

                <div className="text-xs text-[#6B7280] space-y-2 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="leading-relaxed text-[#14283F] font-medium">
                    Please check your inbox and click the verification link to activate your email address.
                  </p>
                  <p className="leading-relaxed">
                    Can't find the email? Check your spam or junk folder.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={checking}
                    onClick={handleCheckStatus}
                  >
                    {checking ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying state...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>I Have Verified My Email</span>
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    disabled={cooldown > 0 || resending}
                    onClick={handleResend}
                  >
                    {resending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#0169FA] border-t-transparent rounded-full animate-spin" />
                        <span>Resending link...</span>
                      </span>
                    ) : cooldown > 0 ? (
                      <span>Resend available in {cooldown}s</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#0169FA]" />
                        <span>Resend Verification Email</span>
                      </span>
                    )}
                  </Button>
                </div>

                <div className="pt-2 border-t border-[#E8EDF2]">
                  <button
                    type="button"
                    onClick={() => navigate('/signin')}
                    className="text-xs text-[#0169FA] hover:underline font-bold cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};
