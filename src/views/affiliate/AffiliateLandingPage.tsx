import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAffiliate } from '../../context/AffiliateContext';
import {
  Share2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  Award,
  BookOpen,
  ShoppingBag,
  ExternalLink,
  Users,
  Building,
  ArrowRight,
} from 'lucide-react';

export const AffiliateLandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { affiliateStatus, profile, isLoading } = useAffiliate();

  const handleCtaClick = () => {
    if (!user) {
      navigate('/signin?redirect=/affiliate/apply');
      return;
    }

    if (affiliateStatus === 'APPROVED') {
      if (!profile?.payoutProfile?.isVerified) {
        navigate('/affiliate/payout');
      } else {
        navigate('/affiliate/dashboard');
      }
    } else if (affiliateStatus === 'PENDING_REVIEW') {
      navigate('/affiliate/apply');
    } else {
      navigate('/affiliate/apply');
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#01213D] py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0682F4]/20 via-[#01213D]/10 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-6">
              <Share2 className="w-3.5 h-3.5" />
              Official Nexovira Partner Ecosystem
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Earn Verified Commissions Promoting{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0682F4] via-[#06C3F8] to-[#08E6F9]">
                Nexovira Innovations
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-[#CCD2D9] leading-relaxed">
              Connect ambitious builders, developers, and businesses with authentic computing hardware,
              enterprise tech equipment, and world-class software engineering cohorts. Earn transparent,
              server-verified commissions on every qualified referral.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleCtaClick}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#06C3F8] hover:from-[#0682F4] hover:to-[#08E6F9] shadow-lg shadow-[#0682F4]/25 transition duration-200 flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                {affiliateStatus === 'APPROVED' ? (
                  !profile?.payoutProfile?.isVerified ? (
                    <>
                      Verify Bank to Activate Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Go to Affiliate Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )
                ) : affiliateStatus === 'PENDING_REVIEW' ? (
                  <>
                    View Application Status
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Join the Affiliate Program
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/affiliate/offers')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-medium text-[#CCD2D9] bg-[#01213D]/60 hover:bg-[#01213D] border border-[#2B7EB5]/30 hover:border-[#0682F4] transition duration-200 flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                Explore Eligible Offers
                <ExternalLink className="w-4 h-4 text-[#08E6F9]" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/20 backdrop-blur-sm">
              <div className="p-3 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#08E6F9]">Up to 20%</div>
                <div className="text-xs text-[#CCD2D9] mt-1 font-medium">Commission Rate</div>
              </div>
              <div className="p-3 text-center border-l border-[#2B7EB5]/20">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#08E6F9]">30 Days</div>
                <div className="text-xs text-[#CCD2D9] mt-1 font-medium">Attribution Window</div>
              </div>
              <div className="p-3 text-center border-l border-[#2B7EB5]/20">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#08E6F9]">₦5,000</div>
                <div className="text-xs text-[#CCD2D9] mt-1 font-medium">Low Minimum Payout</div>
              </div>
              <div className="p-3 text-center border-l border-[#2B7EB5]/20">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#08E6F9]">Real-Time</div>
                <div className="text-xs text-[#CCD2D9] mt-1 font-medium">Server-Side Tracking</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-b border-[#01213D] bg-[#01213D]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#08E6F9] uppercase tracking-widest mb-3">
              Transparent Attribution
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold">
              How the Nexovira Affiliate Architecture Works
            </p>
            <p className="mt-4 text-[#CCD2D9] text-base">
              No guesswork or arbitrary adjustments. Every step is cryptographically verified and server-governed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 relative flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0682F4] to-[#01213D] flex items-center justify-center font-bold text-white text-lg mb-6 shadow-md shadow-[#0682F4]/20">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Apply & Review</h3>
              <p className="text-sm text-[#CCD2D9] leading-relaxed">
                Submit your verified promotional channels and audience details. Our team reviews every application to ensure genuine ecosystem alignment.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 relative flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0682F4] to-[#01213D] flex items-center justify-center font-bold text-white text-lg mb-6 shadow-md shadow-[#0682F4]/20">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Generate Unique Links</h3>
              <p className="text-sm text-[#CCD2D9] leading-relaxed">
                Receive your assigned affiliate slug (<code className="text-[#08E6F9] bg-[#000000] px-1.5 py-0.5 rounded text-xs">/r/CODE/target</code>). Generate targeted referral links for eligible products or cohorts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 relative flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0682F4] to-[#01213D] flex items-center justify-center font-bold text-white text-lg mb-6 shadow-md shadow-[#0682F4]/20">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Qualifying Conversion</h3>
              <p className="text-sm text-[#CCD2D9] leading-relaxed">
                When a referred customer completes an authentic purchase or scholarship enrollment, our backend confirms payment and creates a pending commission.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#01213D]/40 border border-[#2B7EB5]/30 relative flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0682F4] to-[#01213D] flex items-center justify-center font-bold text-white text-lg mb-6 shadow-md shadow-[#0682F4]/20">
                4
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Direct Bank Payout</h3>
              <p className="text-sm text-[#CCD2D9] leading-relaxed">
                Once the commission hold period concludes, funds become available in your wallet. Request instant payout directly to your verified Nigerian bank account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Eligible Offers Highlights */}
      <section className="py-20 border-b border-[#01213D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-xs font-bold text-[#08E6F9] uppercase tracking-widest mb-3">
                Commission Opportunities
              </h2>
              <p className="text-3xl font-extrabold text-white">
                What Can You Promote?
              </p>
              <p className="mt-2 text-[#CCD2D9] text-sm max-w-xl">
                Only genuine, active inventory and active educational cohorts carry affiliate commissions.
              </p>
            </div>

            <button
              onClick={() => navigate('/affiliate/offers')}
              className="mt-4 md:mt-0 text-sm font-semibold text-[#08E6F9] hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              Browse All Active Offers
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Marketplace Offers Card */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#01213D]/60 to-[#000000] border border-[#2B7EB5]/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-[#0682F4]/20 text-[#08E6F9]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Commercial Marketplace</h3>
                    <p className="text-xs text-[#CCD2D9]">Hardware & Tech Products</p>
                  </div>
                </div>

                <p className="text-sm text-[#CCD2D9] leading-relaxed mb-6">
                  Earn up to 10% on laptops, noise-cancelling audio devices, ergonomic motorized desks, and computing accessories with guaranteed order verification.
                </p>

                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-start gap-2.5 text-[#CCD2D9]">
                    <CheckCircle className="w-4 h-4 text-[#08E6F9] mt-0.5 shrink-0" />
                    <span><strong>NEXUS Ultra Laptop 16" Pro:</strong> Earn ₦68,000 NGN (8%)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[#CCD2D9]">
                    <CheckCircle className="w-4 h-4 text-[#08E6F9] mt-0.5 shrink-0" />
                    <span><strong>AeroGlide Wireless Headphones:</strong> Earn ₦12,500 NGN (10%)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[#CCD2D9]">
                    <CheckCircle className="w-4 h-4 text-[#08E6F9] mt-0.5 shrink-0" />
                    <span><strong>OmniDesk Ergonomic Standing Desk:</strong> Earn ₦34,000 NGN (10%)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#2B7EB5]/20 flex items-center justify-between text-xs text-[#CCD2D9]">
                <span>Returns protection window: 7 days</span>
                <span className="text-[#08E6F9] font-semibold">Active Offers</span>
              </div>
            </div>

            {/* Academy Offers Card */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#01213D]/60 to-[#000000] border border-[#2B7EB5]/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-[#0682F4]/20 text-[#08E6F9]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Nexovira Academy</h3>
                    <p className="text-xs text-[#CCD2D9]">Engineering & AI Cohorts</p>
                  </div>
                </div>

                <p className="text-sm text-[#CCD2D9] leading-relaxed mb-6">
                  Refer candidates to our intensive technology programs. Earn generous commissions on verified scholarship application fee settlements.
                </p>

                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-start gap-2.5 text-[#CCD2D9]">
                    <CheckCircle className="w-4 h-4 text-[#08E6F9] mt-0.5 shrink-0" />
                    <span><strong>Applied Generative AI & Agents:</strong> Earn ₦1,000 NGN fixed per student</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[#CCD2D9]">
                    <CheckCircle className="w-4 h-4 text-[#08E6F9] mt-0.5 shrink-0" />
                    <span><strong>Full-Stack Modern Web Engineering:</strong> Earn ₦900 NGN (20%)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[#CCD2D9]">
                    <CheckCircle className="w-4 h-4 text-[#08E6F9] mt-0.5 shrink-0" />
                    <span><strong>Enterprise UI/UX Design Systems:</strong> Earn ₦900 NGN (20%)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#2B7EB5]/20 flex items-center justify-between text-xs text-[#CCD2D9]">
                <span>Direct registration settlement</span>
                <span className="text-[#08E6F9] font-semibold">Active Cohorts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules & Integrity Safeguards */}
      <section className="py-20 border-b border-[#01213D] bg-[#01213D]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-xs font-bold text-[#08E6F9] uppercase tracking-widest mb-3">
              Compliance & Security
            </h2>
            <p className="text-3xl font-extrabold text-white">
              Built on Trust & Mathematical Accuracy
            </p>
            <p className="mt-4 text-[#CCD2D9] text-base">
              Nexovira enforces strict anti-fraud safeguards to protect affiliates and customers alike.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#01213D]/30 border border-[#2B7EB5]/20">
              <ShieldCheck className="w-8 h-8 text-[#08E6F9] mb-4" />
              <h3 className="text-base font-bold text-white mb-2">Anti Self-Referral</h3>
              <p className="text-xs text-[#CCD2D9] leading-relaxed">
                The attribution engine cross-checks affiliate ownership against customer profiles. Purchasing through one's own referral link is systematically blocked.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#01213D]/30 border border-[#2B7EB5]/20">
              <TrendingUp className="w-8 h-8 text-[#08E6F9] mb-4" />
              <h3 className="text-base font-bold text-white mb-2">Server-Authoritative Balances</h3>
              <p className="text-xs text-[#CCD2D9] leading-relaxed">
                Wallet balances and commission amounts are computed entirely server-side from verified payment provider callbacks. Client parameters are never trusted.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#01213D]/30 border border-[#2B7EB5]/20">
              <DollarSign className="w-8 h-8 text-[#08E6F9] mb-4" />
              <h3 className="text-base font-bold text-white mb-2">Double-Payout Immunity</h3>
              <p className="text-xs text-[#CCD2D9] leading-relaxed">
                Concurrency locks prevent duplicate payout submissions. Each withdrawal request maps directly to settled commission records with full audit tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Partner with Nexovira?
          </h2>
          <p className="mt-4 text-base text-[#CCD2D9] max-w-2xl mx-auto">
            Join vetted creators, developers, educators, and enterprise partners building high-integrity income streams.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleCtaClick}
              className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] shadow-xl shadow-[#0682F4]/30 transition duration-200 cursor-pointer flex items-center gap-2"
            >
              Start Your Application Today
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
