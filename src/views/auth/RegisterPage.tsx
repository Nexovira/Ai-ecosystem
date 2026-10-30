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
    <div className="py-16 sm:py-24 bg-[#F7F8FA] min-h-[85vh] flex items-center justify-center relative overflow-hidden">
      {/* Subtle brand ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-gradient-to-r from-[#08B3F8]/10 to-[#0169FA]/5 blur-3xl rounded-full pointer-events-none" />

      <Container size="narrow" className="relative z-10">
        <div className="max-w-lg mx-auto">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex justify-center mb-1">
              <Logo size="md" variant="dark" onClick={() => navigate('/')} />
            </div>
            <div className="text-xs font-semibold tracking-wider text-[#0169FA] uppercase">
              Member Registration
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14283F] tracking-tight">
              Create Your Nexovira Account
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] font-normal">
              Register as a verified customer to join the evolving ecosystem.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-[#E8EDF2] rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#14283F] mb-1.5">
                  Full Name *
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3.5 w-4 h-4 text-[#0169FA] pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="First and last name"
                    autoComplete="name"
                    className="w-full bg-[#F7F8FA] text-[#14283F] text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0169FA] placeholder:text-[#6B7280] transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-[#14283F] mb-1.5">
                  Email Address *
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

              {/* Optional Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-[#14283F] mb-1.5">
                  Phone Number (Optional)
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 w-4 h-4 text-[#0169FA] pointer-events-none" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                    maxLength={25}
                    className="w-full bg-[#F7F8FA] text-[#14283F] text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0169FA] placeholder:text-[#6B7280] transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#14283F] mb-1.5">
                  Password *
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#0169FA] pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    className="w-full bg-[#F7F8FA] text-[#14283F] text-sm pl-10 pr-11 py-2.5 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0169FA] placeholder:text-[#6B7280] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#6B7280] hover:text-[#14283F] transition-colors cursor-pointer p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-[#0169FA]" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E8EDF2] space-y-1.5 text-xs">
                <span className="text-[#6B7280] font-semibold block mb-1">Password Requirements:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-[#6B7280]'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 font-medium' : 'text-[#6B7280]'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-600 font-medium' : 'text-[#6B7280]'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-[#6B7280]'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 col-span-2 ${hasSpecial ? 'text-emerald-600 font-medium' : 'text-[#6B7280]'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Special character (!@#$%^&*)</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-[#14283F] mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#0169FA] pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className="w-full bg-[#F7F8FA] text-[#14283F] text-sm pl-10 pr-11 py-2.5 rounded-xl border border-[#E8EDF2] focus:border-[#0169FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0169FA] placeholder:text-[#6B7280] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-[#6B7280] hover:text-[#14283F] transition-colors cursor-pointer p-1"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-[#0169FA]" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                )}
              </div>

              {/* Policy Checkboxes */}
              <div className="space-y-2.5 pt-2 border-t border-[#E8EDF2] text-xs text-[#6B7280]">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#E8EDF2] text-[#0169FA] focus:ring-[#0169FA]"
                  />
                  <span>
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/terms')}
                      className="text-[#0169FA] hover:underline font-semibold"
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
                    className="mt-0.5 w-4 h-4 rounded border-[#E8EDF2] text-[#0169FA] focus:ring-[#0169FA]"
                  />
                  <span>
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/privacy')}
                      className="text-[#0169FA] hover:underline font-semibold"
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
                  className="shadow-sm shadow-[#0169FA]/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="mt-5 p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E8EDF2] flex items-start gap-2 text-xs text-[#6B7280]">
              <Shield className="w-4 h-4 text-[#0169FA] shrink-0 mt-0.5" />
              <span>
                Standard registration provisions a verified <strong>CUSTOMER</strong> account. Expert, Affiliate, and Administrative roles are subject to backend credentialing.
              </span>
            </div>

            {/* Sign In Callout */}
            <div className="mt-5 pt-4 border-t border-[#E8EDF2] text-center text-xs text-[#6B7280]">
              <span>Already have an account?</span>{' '}
              <button
                type="button"
                onClick={() => navigate('/signin')}
                className="text-[#0169FA] hover:underline font-bold cursor-pointer"
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
