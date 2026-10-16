import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, Phone, ArrowRight, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

export const RegisterPage: React.FC = () => {
  const { registerUser, user } = useAuth();
  const { navigate } = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);

  // If already logged in, redirect to account via effect (never during render)
  React.useEffect(() => {
    if (user && !justRegistered && !loading) {
      navigate('/account');
    }
  }, [user, justRegistered, loading, navigate]);

  if (user && !justRegistered && !loading) {
    return null;
  }

  // Strong password checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Please satisfy all password security requirements.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Password and confirmation do not match.');
      return;
    }

    if (!acceptTerms || !acceptPrivacy) {
      setErrorMessage('You must accept both the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    setLoading(true);
    setJustRegistered(true);
    const result = await registerUser(
      email.trim(),
      password,
      fullName.trim(),
      phoneNumber.trim() || undefined
    );
    setLoading(false);

    if (result.success) {
      navigate('/verify-email');
    } else {
      setJustRegistered(false);
      setErrorMessage(result.error || 'Registration failed. Please review your input.');
    }
  };

  return (
    <div className="py-16 sm:py-24 bg-[#01213D] min-h-[85vh] flex items-center justify-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-[#0682F4]/10 blur-[110px] rounded-full pointer-events-none" />

      <Container size="narrow" className="relative z-10">
        <div className="max-w-lg mx-auto">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex justify-center mb-1">
              <Logo size="md" onClick={() => navigate('/')} />
            </div>
            <div className="text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
              Member Registration · Phase 2
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              CREATE YOUR NEXOVIRA ACCOUNT
            </h1>
            <p className="text-xs sm:text-sm text-[#CCD2D9]/80 font-normal">
              Register as a verified customer to join the evolving ecosystem.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-[#011629]">
            
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-[#011629] border border-red-500/40 text-xs text-[#CCD2D9] flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                  Full Name *
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3.5 w-4 h-4 text-[#0682F4] pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="First and last name"
                    autoComplete="name"
                    className="w-full bg-[#01213D] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none focus:ring-1 focus:ring-[#08E6F9] placeholder:text-[#CCD2D9]/30 transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                  Email Address *
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

              {/* Optional Phone Number */}
              <div>
                <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                  Phone Number (Optional)
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 w-4 h-4 text-[#0682F4] pointer-events-none" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                    maxLength={25}
                    className="w-full bg-[#01213D] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none focus:ring-1 focus:ring-[#08E6F9] placeholder:text-[#CCD2D9]/30 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                  Password *
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#0682F4] pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
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

              {/* Password Requirements Checklist */}
              <div className="p-3 rounded-lg bg-[#011629] border border-[#0682F4]/20 space-y-1.5 text-[11px] font-mono">
                <span className="text-[#CCD2D9]/70 block mb-1">Password Requirements:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-[#08E6F9]' : 'text-[#CCD2D9]/40'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-[#08E6F9]' : 'text-[#CCD2D9]/40'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-[#08E6F9]' : 'text-[#CCD2D9]/40'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-[#08E6F9]' : 'text-[#CCD2D9]/40'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 col-span-2 ${hasSpecial ? 'text-[#08E6F9]' : 'text-[#CCD2D9]/40'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Special character (!@#$%^&*)</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#0682F4] pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className="w-full bg-[#01213D] text-white text-sm pl-10 pr-11 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none focus:ring-1 focus:ring-[#08E6F9] placeholder:text-[#CCD2D9]/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-[#CCD2D9]/60 hover:text-white transition-colors cursor-pointer p-1"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-[#08E6F9]" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="mt-1 text-xs text-red-400">Passwords do not match.</p>
                )}
              </div>

              {/* Policy Checkboxes */}
              <div className="space-y-2.5 pt-2 border-t border-[#0682F4]/20 text-xs text-[#CCD2D9]">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded bg-[#01213D] border-[#0682F4]/50 text-[#0682F4] focus:ring-[#08E6F9]"
                  />
                  <span>
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/terms')}
                      className="text-[#08E6F9] hover:underline font-medium"
                    >
                      Terms of Service
                    </button>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded bg-[#01213D] border-[#0682F4]/50 text-[#0682F4] focus:ring-[#08E6F9]"
                  />
                  <span>
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/privacy')}
                      className="text-[#08E6F9] hover:underline font-medium"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={loading || !acceptTerms || !acceptPrivacy || !isPasswordValid || !passwordsMatch}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#01213D] border-t-transparent rounded-full animate-spin" />
                      <span>Creating your account...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            </form>

            {/* Role Notice */}
            <div className="mt-5 p-3 rounded-lg bg-[#011629] border border-[#0682F4]/20 flex items-start gap-2 text-[11px] text-[#CCD2D9]/70">
              <Shield className="w-4 h-4 text-[#08E6F9] shrink-0 mt-0.5" />
              <span>
                Standard registration provisions a verified <strong>CUSTOMER</strong> account. Seller, Expert, and Administrative roles are subject to backend credentialing.
              </span>
            </div>

            {/* Sign In Callout */}
            <div className="mt-5 pt-4 border-t border-[#0682F4]/20 text-center text-xs text-[#CCD2D9]">
              <span>Already have an account?</span>{' '}
              <button
                type="button"
                onClick={() => navigate('/signin')}
                className="text-[#08E6F9] hover:underline font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
