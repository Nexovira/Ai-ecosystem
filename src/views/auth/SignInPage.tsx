import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

export const SignInPage: React.FC = () => {
  const { signInUser, signInWithGoogle, user } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to account via effect (never during render)
  React.useEffect(() => {
    if (user && !loading) {
      navigate('/account');
    }
  }, [user, loading, navigate]);

  if (user && !loading) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    const result = await signInUser(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/account');
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);

    if (result.success) {
      navigate('/account');
    } else if (result.error) {
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="py-16 sm:py-24 bg-[#01213D] min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-[#0682F4]/10 blur-[100px] rounded-full pointer-events-none" />

      <Container size="narrow" className="relative z-10">
        <div className="max-w-md mx-auto">
          
          {/* Brand & Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex justify-center mb-1">
              <Logo size="md" onClick={() => navigate('/')} />
            </div>
            <div className="text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
              Authentication Portal
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              WELCOME BACK TO NEXOVIRA
            </h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9]/80 font-normal">
              Sign in to manage your profile and access the intelligent ecosystem.
            </p>
          </div>

          {/* Card Form */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-[#011629]">
            
            {/* Error Display */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-[#011629] border border-red-500/40 text-xs text-[#CCD2D9] flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-[#0682F4] pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    autoComplete="email"
                    className="w-full bg-[#01213D] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none focus:ring-1 focus:ring-[#08E6F9] placeholder:text-[#CCD2D9]/30 transition-colors"
                  />
                </div>
              </div>

              {/* Password with working visibility toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono text-[#CCD2D9]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-[#08E6F9] hover:text-[#7CF9FD] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#0682F4] pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full bg-[#01213D] text-white text-sm pl-10 pr-11 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none focus:ring-1 focus:ring-[#08E6F9] placeholder:text-[#CCD2D9]/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#CCD2D9]/60 hover:text-white transition-colors cursor-pointer p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-[#08E6F9]" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#01213D] border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#0682F4]/20" />
              </div>
              <span className="relative bg-[#011B33] px-3 text-[11px] font-mono text-[#CCD2D9]/50 uppercase">
                Or Continue With
              </span>
            </div>

            {/* Google Authentication */}
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              disabled={loading}
              onClick={handleGoogleSignIn}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#08E6F9"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#0682F4"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#CCD2D9"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#4DDEEA"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            {/* Registration Callout */}
            <div className="mt-6 pt-5 border-t border-[#0682F4]/20 text-center text-xs text-[#CCD2D9]">
              <span>Don't have a Nexovira account?</span>{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-[#08E6F9] hover:underline font-semibold cursor-pointer"
              >
                Create Account
              </button>
            </div>

            {/* Administrator Setup Portal */}
            <div className="mt-4 pt-3 border-t border-[#0682F4]/10 text-center">
              <button
                type="button"
                onClick={() => navigate('/admin-setup')}
                className="text-[11px] font-mono text-[#08E6F9]/80 hover:text-[#08E6F9] hover:underline cursor-pointer inline-flex items-center gap-1.5"
              >
                <Lock className="w-3 h-3" />
                <span>First Administrator Setup & Role Verification</span>
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
