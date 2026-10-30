import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

export const ForgotPasswordPage: React.FC = () => {
  const { sendResetInstructions } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const result = await sendResetInstructions(email);
    setLoading(false);
    setSubmitted(true);
    setFeedbackMessage(result.message);
  };

  return (
    <div className="py-16 sm:py-24 bg-[#F7F8FA] min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-[#0169FA]/5 blur-[100px] rounded-full pointer-events-none" />

      <Container size="narrow" className="relative z-10">
        <div className="max-w-md mx-auto">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex justify-center mb-1">
              <Logo size="md" variant="dark" onClick={() => navigate('/')} />
            </div>
            <div className="text-xs font-semibold tracking-wider text-[#0169FA] uppercase">
              Account Recovery
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14283F] tracking-tight">
              Forgot Your Password?
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] font-normal">
              Enter your verified email to receive instructions to reset your password.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-[#E8EDF2] rounded-3xl p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#0169FA]/10 border border-[#0169FA]/20 flex items-center justify-center text-[#0169FA] mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#14283F]">
                  Instructions Dispatched
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  {feedbackMessage}
                </p>
                <div className="pt-3">
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => navigate('/signin')}
                  >
                    <span>Return to Sign In</span>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14283F] mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[#0169FA] pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      autoComplete="email"
                      className="w-full bg-[#F7F8FA] text-[#14283F] text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0169FA] placeholder:text-[#6B7280] transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={loading || !email.trim()}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending reset instructions...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>Send Instructions</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>

                <div className="pt-3 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/signin')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#0169FA] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};
