import React, { useState } from 'react';
import {
  ShieldCheck,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Tag,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import { useRouter } from '../../context/RouterContext';

export const SellerApplyPage: React.FC = () => {
  const { user, profile } = useAuth();
  const {
    sellerApplication,
    sellerProfile,
    isVerifiedSeller,
    submitSellerApplication,
    adminApproveApplication,
  } = useSeller();

  const { navigate } = useRouter();

  // Form State
  const [fullName, setFullName] = useState(profile?.fullName || user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessType, setBusinessType] = useState('Registered Business');
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [categories, setCategories] = useState<string[]>(['Appliances', 'Electronics']);
  const [productsSummary, setProductsSummary] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adminApproving, setAdminApproving] = useState(false);

  const availableCategories = [
    'Appliances',
    'Electronics',
    'Computing & Accessories',
    'Phones & Accessories',
    'Home Technology',
    'Other Technology Products',
  ];

  const handleCategoryToggle = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user) {
      setErrorMessage('You must be signed in to submit a merchant application.');
      return;
    }

    if (!businessName.trim() || !businessDescription.trim() || categories.length === 0) {
      setErrorMessage('Please provide your business name, description, and at least one category.');
      return;
    }

    setSubmitting(true);
    const res = await submitSellerApplication({
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      businessName: businessName.trim(),
      businessDescription: businessDescription.trim(),
      businessType,
      businessAddress: businessAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      productCategories: categories,
      productsSummary: productsSummary.trim(),
      websiteUrl: websiteUrl.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      setSuccessMessage('Your merchant application has been submitted for review.');
    } else {
      setErrorMessage(res.error || 'Failed to submit application.');
    }
  };

  const handleAdminApproveTest = async () => {
    if (!user || !user.uid) return;
    setAdminApproving(true);
    const res = await adminApproveApplication(
      user.uid,
      sellerApplication?.businessName || businessName || 'Nexovira Verified Hardware'
    );
    setAdminApproving(false);
    if (res.success) {
      navigate('/seller/dashboard');
    }
  };

  // If user is already verified seller
  if (isVerifiedSeller) {
    return (
      <div className="py-20 sm:py-28 bg-[#01213D] min-h-[80vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#01213D] border border-[#08E6F9]/40 flex items-center justify-center text-[#08E6F9] mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#08E6F9]">
                Verified Merchant Account
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                You are an Authorized Seller
              </h2>
              <p className="text-xs sm:text-sm text-[#CCD2D9] leading-relaxed">
                Your store profile is active on Nexovira. You can manage inventory, add products, and configure your storefront directly from your merchant console.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/seller/dashboard')}
              fullWidth
            >
              <span>Open Seller Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // If application is pending review
  if (sellerApplication?.status === 'PENDING_REVIEW' && !successMessage) {
    const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN';

    return (
      <div className="py-20 sm:py-28 bg-[#01213D] min-h-[80vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#01213D] border border-amber-400/40 flex items-center justify-center text-amber-400 mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                Application Status: Pending Review
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                Application Under Verification
              </h2>
              <p className="text-xs sm:text-sm text-[#CCD2D9] leading-relaxed">
                Your merchant application for <strong>{sellerApplication.businessName}</strong> was submitted on{' '}
                {new Date(sellerApplication.submittedAt).toLocaleDateString()} and is currently undergoing credential review by the Nexovira Merchant Authority.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/20 text-xs text-left space-y-1.5 font-mono text-[#CCD2D9]/80">
              <div>Business: <span className="text-white">{sellerApplication.businessName}</span></div>
              <div>Categories: <span className="text-[#08E6F9]">{sellerApplication.productCategories.join(', ')}</span></div>
              <div>Operating City: <span className="text-white">{sellerApplication.city || 'Standard Hub'}</span></div>
            </div>

            {/* Administrative / Dev Review Action */}
            {isAdmin && (
              <div className="p-4 rounded-xl bg-[#01213D] border border-[#08E6F9]/30 text-left space-y-2">
                <div className="text-xs font-mono font-bold text-[#08E6F9] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Admin Authority Control</span>
                </div>
                <p className="text-[11px] text-[#CCD2D9]/80">
                  As an authenticated administrator, you have permission to approve merchant applications.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAdminApproveTest}
                  disabled={adminApproving}
                  fullWidth
                >
                  <span>{adminApproving ? 'Approving...' : 'Approve Application (Admin Authority)'}</span>
                </Button>
              </div>
            )}

            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/marketplace')}
              fullWidth
            >
              <span>Return to Marketplace</span>
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-24 bg-[#01213D] min-h-[90vh] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#0682F4]/10 blur-[120px] rounded-full pointer-events-none" />

      <Container size="default" className="relative z-10">
        
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex justify-center mb-1">
            <Logo size="md" onClick={() => navigate('/')} />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono tracking-widest text-[#08E6F9] uppercase">
            <span>Merchant Onboarding</span>
            <span aria-hidden="true">·</span>
            <span>Phase 4 Application</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            BECOME A NEXOVIRA SELLER
          </h1>

          <p className="text-sm sm:text-base text-[#CCD2D9] font-normal leading-relaxed">
            Build your presence on Nexovira and bring your products to customers through our growing technology marketplace.
          </p>
        </div>

        {/* Application Form Card */}
        <div className="max-w-3xl mx-auto bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-10 shadow-2xl">
          
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-[#01213D] border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-[#01213D] border border-[#08E6F9]/40 text-xs text-[#08E6F9] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Personal Information */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-[#0682F4]/20 flex items-center gap-2">
                <User className="w-4 h-4 text-[#08E6F9]" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  1. Contact Representative
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your legal name"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@company.com"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+234 (0) 800 000 0000"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Business Information */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-[#0682F4]/20 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#08E6F9]" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  2. Business Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Business / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Electronics & Computing"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Business Entity Type
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none cursor-pointer"
                  >
                    <option value="Registered Business">Registered Business (LLC / Ltd)</option>
                    <option value="Authorized Distributor">Authorized Brand Distributor</option>
                    <option value="Sole Proprietor">Sole Proprietor / Independent Maker</option>
                    <option value="Manufacturer">Original Equipment Manufacturer (OEM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Country of Operation
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Nigeria"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Business Address
                  </label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="Office / Warehouse street address"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lagos, Abuja, Port Harcourt..."
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">State / Region</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State or Region"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Business Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Summarize your commercial operations, supply chain reliability, and customer service approach..."
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Seller Products & Categories */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-[#0682F4]/20 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#08E6F9]" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  3. Product Categories & Scope
                </h3>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#CCD2D9] mb-2">
                  Select Intended Product Categories *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableCategories.map((cat) => {
                    const checked = categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryToggle(cat)}
                        className={`text-left text-xs p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                          checked
                            ? 'bg-[#0682F4]/20 border-[#08E6F9] text-white font-semibold'
                            : 'bg-[#01213D] border-[#0682F4]/20 text-[#CCD2D9] hover:border-[#08E6F9]/40'
                        }`}
                      >
                        <span>{cat}</span>
                        {checked && <CheckCircle2 className="w-4 h-4 text-[#08E6F9]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                  Products Summary
                </label>
                <textarea
                  rows={2}
                  value={productsSummary}
                  onChange={(e) => setProductsSummary(e.target.value)}
                  placeholder="Specific brands, models, or device lines you intend to offer on Nexovira..."
                  className="w-full bg-[#01213D] text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                  Website or Catalog Link (Optional)
                </label>
                <div className="relative flex items-center">
                  <Globe className="absolute left-3.5 w-4 h-4 text-[#0682F4] pointer-events-none" />
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="w-full bg-[#01213D] text-white text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-[#0682F4]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[#CCD2D9]/70 font-mono">
                No bank credentials or confidential passwords required during application.
              </span>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting || categories.length === 0}
                className="w-full sm:w-auto"
              >
                <span>{submitting ? 'Submitting Application...' : 'Submit Seller Application'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>

        </div>
      </Container>
    </div>
  );
};
