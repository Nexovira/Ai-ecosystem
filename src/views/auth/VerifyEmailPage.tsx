import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, RefreshCw, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

export const VerifyEmailPage: React.FC = () => {
  const { user, profile, resendVerificationEmail, reloadCurrentUser } = useAuth();
  const { navigate } = useRouter();

  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
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
      setFeedback({ type: 'success', message: result.message || 'Verification link sent.' });
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
      setFeedback({ type: 'success', message: 'Email confirmed! Your account is fully verified.' });
      setTimeout(() => navigate('/account'), 1200);
    } else {
      setFeedback({
        type: 'error',
        message: 'Email not yet verified. Please click the link received in your inbox and try again.',
      });
    }
  };

  const userEmail = user?.email || profile?.email || 'your registered email';
  const isAlreadyVerified = Boolean(user?.emailVerified || profile?.emailVerified);

  return (
    <div className="py-16 sm:py-24 bg-[#01213D] min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-[#0682F4]/10 blur-[100px] rounded-full pointer-events-none" />

      <Container size="narrow" className="relative z-10">
        <div className="max-w-md mx-auto">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex justify-center mb-1">
              <Logo size="md" onClick={() => navigate('/')} />
            </div>
            <div className="text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
              Security Protocol
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              VERIFY YOUR EMAIL
            </h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9]/80 font-normal">
              A verification link was dispatched to your inbox to protect your ecosystem identity.
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-[#011629]">
            
            {/* Feedback alert */}
            {feedback && (
              <div
                className={`mb-5 p-3.5 rounded-lg border text-xs flex items-start gap-2.5 animate-in fade-in ${
                  feedback.type === 'success'
                    ? 'bg-[#011629] border-[#08E6F9]/40 text-[#CCD2D9]'
                    : 'bg-[#011629] border-red-500/40 text-red-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{feedback.message}</span>
              </div>
            )}

            {isAlreadyVerified ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#0682F4]/20 border border-[#08E6F9] flex items-center justify-center text-[#08E6F9] mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">
                  Email Address Verified
                </h3>
                <p className="text-xs sm:text-sm text-[#CCD2D9]">
                  Your email ({userEmail}) has been confirmed. Full ecosystem account privileges are active.
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => navigate('/account')}
                  >
                    <span>Proceed to Account Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#01213D] border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9] mx-auto">
                  <Mail className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-[#CCD2D9]/70 font-mono">Dispatched to:</span>
                  <div className="text-sm font-semibold text-white font-mono break-all px-3 py-1.5 rounded-lg bg-[#01213D] border border-[#0682F4]/20">
                    {userEmail}
                  </div>
                </div>

                <p className="text-xs text-[#CCD2D9]/80 leading-relaxed text-left">
                  Please click the link inside the confirmation email to verify ownership.
                  If you don't see it, check your spam or promotions folder.
                </p>

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
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying state...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
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
                    {cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : resending
                      ? 'Sending...'
                      : 'Resend Verification Email'}
                  </Button>
                </div>

                <div className="pt-3 border-t border-[#0682F4]/20 flex items-center justify-between text-xs text-[#CCD2D9]">
                  <button
                    type="button"
                    onClick={() => navigate('/account')}
                    className="hover:text-white transition-colors"
                  >
                    Go to Account
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/signin')}
                    className="text-[#08E6F9] hover:underline"
                  >
                    Return to Sign In
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
