import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAffiliate } from '../../context/AffiliateContext';
import {
  Package,
  BookOpen,
  Share2,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  X,
  AlertTriangle,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { EligibleOffer } from '../../types/affiliate';
import { AffiliateOnboardingChecklist } from '../../components/affiliate/AffiliateOnboardingChecklist';
import {
  copyTextToClipboard,
  shareLinkNatively,
  buildPublicProductUrl,
  buildReferralUrl,
  buildShortReferralUrl,
} from '../../utils/affiliateLinkUtils';

export const AffiliateOffersPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { offers, profile, affiliateStatus, generateReferralLink, isLoading } = useAffiliate();

  const [activeTab, setActiveTab] = useState<'ALL' | 'MARKETPLACE' | 'ACADEMY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfferForLink, setSelectedOfferForLink] = useState<EligibleOffer | null>(null);
  const [generatedLinkUrl, setGeneratedLinkUrl] = useState<string | null>(null);
  const [shortLinkUrl, setShortLinkUrl] = useState<string | null>(null);
  const [normalProductUrl, setNormalProductUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [copySuccessMsg, setCopySuccessMsg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [showManualCopyModal, setShowManualCopyModal] = useState<string | null>(null);

  const hasVerifiedPayout = Boolean(profile?.payoutProfile?.isVerified);

  const filteredOffers = offers.filter((off) => {
    if (activeTab === 'MARKETPLACE' && off.offerType !== 'MARKETPLACE_PRODUCT') return false;
    if (activeTab === 'ACADEMY' && off.offerType !== 'ACADEMY_COURSE') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        off.targetTitle.toLowerCase().includes(q) ||
        (off.targetCategory && off.targetCategory.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleGenerateClick = async (offer: EligibleOffer) => {
    if (!user) {
      navigate('/signin?redirect=/affiliate/offers');
      return;
    }

    if (affiliateStatus !== 'APPROVED') {
      navigate('/affiliate/apply');
      return;
    }

    // Requirement 3: Enforce payout verification
    if (!hasVerifiedPayout) {
      navigate('/affiliate/payout');
      return;
    }

    setSelectedOfferForLink(offer);
    setIsGenerating(true);
    setLinkError(null);
    setGeneratedLinkUrl(null);
    setShortLinkUrl(null);
    setLinkCopied(false);
    setCopySuccessMsg(null);

    const isAcademy = offer.offerType === 'ACADEMY_COURSE';
    const normalUrl = buildPublicProductUrl(offer.targetSlug, isAcademy);
    setNormalProductUrl(normalUrl);

    if (profile?.affiliateCode) {
      const refUrl = buildReferralUrl(offer.targetSlug, profile.affiliateCode, isAcademy);
      const shortUrl = buildShortReferralUrl(offer.targetSlug, profile.affiliateCode);
      setGeneratedLinkUrl(refUrl);
      setShortLinkUrl(shortUrl);
    }

    const result = await generateReferralLink(offer.offerId);
    setIsGenerating(false);

    if (result.success && result.shareableUrl) {
      setShortLinkUrl(result.shareableUrl);
    } else if (!result.success) {
      setLinkError(result.error || 'Failed to generate link.');
    }
  };

  const handleCopyLink = async (urlToCopy: string) => {
    if (!urlToCopy) return;
    setCopySuccessMsg(null);
    const result = await copyTextToClipboard(urlToCopy);
    if (result.success) {
      setLinkCopied(true);
      setCopySuccessMsg('Referral link copied to clipboard!');
      setTimeout(() => {
        setLinkCopied(false);
        setCopySuccessMsg(null);
      }, 3000);
    } else {
      setShowManualCopyModal(urlToCopy);
    }
  };

  const handleShareLink = async (urlToShare: string, title: string) => {
    if (!urlToShare) return;
    const res = await shareLinkNatively({
      title: `${title} — Nexovira`,
      text: `Check out ${title} on Nexovira with guaranteed authenticity and verified delivery.`,
      url: urlToShare,
    });
    if (!res.supported) {
      handleCopyLink(urlToShare);
    }
  };

  const formatNaira = (amount: number) => {
    return `₦${(amount || 0).toLocaleString()} NGN`;
  };

  const calculateEstimatedEarnings = (offer: EligibleOffer) => {
    if (offer.commissionType === 'PERCENTAGE') {
      return Math.round((offer.targetPrice * offer.commissionValue) / 100);
    }
    return offer.commissionValue;
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#01213D] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#01213D] border border-[#0682F4]/40 text-[#08E6F9] text-xs font-semibold uppercase tracking-wider mb-3">
              <Share2 className="w-3.5 h-3.5" />
              Product & Course Discovery
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Eligible Affiliate Offers
            </h1>
            <p className="mt-2 text-sm text-[#CCD2D9] max-w-2xl">
              Browse approved Nexovira hardware and engineering academy cohorts with configured commission rates.
              Generate unique, server-tracked referral links to share on any external website, blog, or social channel.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {affiliateStatus === 'APPROVED' && (
              <button
                onClick={() => navigate('/affiliate/dashboard')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/40 transition cursor-pointer"
              >
                Dashboard
              </button>
            )}
            <button
              onClick={() => navigate('/affiliate/payout')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/40 transition cursor-pointer"
            >
              Payout Details
            </button>
          </div>
        </div>

        {/* Payout Gate Warning if approved but bank is not verified */}
        {affiliateStatus === 'APPROVED' && !hasVerifiedPayout && !isLoading && (
          <AffiliateOnboardingChecklist
            onSetupClick={() => navigate('/affiliate/payout')}
            showActions={true}
          />
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#01213D]/60 border border-[#2B7EB5]/20 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#0682F4] text-white'
                  : 'text-[#CCD2D9] hover:text-white'
              }`}
            >
              All Offers ({offers.length})
            </button>
            <button
              onClick={() => setActiveTab('MARKETPLACE')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'MARKETPLACE'
                  ? 'bg-[#0682F4] text-white'
                  : 'text-[#CCD2D9] hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Hardware ({offers.filter((o) => o.offerType === 'MARKETPLACE_PRODUCT').length})
            </button>
            <button
              onClick={() => setActiveTab('ACADEMY')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'ACADEMY'
                  ? 'bg-[#0682F4] text-white'
                  : 'text-[#CCD2D9] hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Academy ({offers.filter((o) => o.offerType === 'ACADEMY_COURSE').length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CCD2D9]/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter offers or categories..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#01213D]/40 border border-[#2B7EB5]/30 focus:border-[#0682F4] focus:outline-none text-white text-xs placeholder:text-[#CCD2D9]/50"
            />
          </div>
        </div>

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-[#01213D]/20 border border-[#2B7EB5]/20">
            <Package className="w-12 h-12 text-[#2B7EB5]/50 mx-auto mb-4" />
            <h3 className="text-base font-bold text-white">No eligible offers found</h3>
            <p className="text-xs text-[#CCD2D9] max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'Try broadening your search criteria.'
                : 'No commissionable offers currently active in this category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => {
              const estimatedEarnings = calculateEstimatedEarnings(offer);
              const isMarketplace = offer.offerType === 'MARKETPLACE_PRODUCT';
              const publicOfferUrl = buildPublicProductUrl(offer.targetSlug, !isMarketplace);

              return (
                <div
                  key={offer.offerId}
                  className="rounded-2xl bg-[#01213D]/30 border border-[#2B7EB5]/30 overflow-hidden flex flex-col justify-between hover:border-[#0682F4]/60 transition duration-200 group"
                >
                  <div>
                    {/* Offer Image */}
                    {offer.targetImage && (
                      <div className="h-44 w-full relative overflow-hidden bg-[#000000]">
                        <img
                          src={offer.targetImage}
                          alt={offer.targetTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                              isMarketplace
                                ? 'bg-[#01213D]/80 border-[#0682F4]/60 text-[#08E6F9]'
                                : 'bg-[#01213D]/80 border-[#06C3F8]/60 text-[#06C3F8]'
                            }`}
                          >
                            {isMarketplace ? 'Computing Hardware' : 'Academy Cohort'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="text-[11px] font-semibold text-[#08E6F9] uppercase tracking-wider mb-1">
                        {offer.targetCategory}
                      </div>
                      <h3 className="text-base font-bold text-white leading-snug line-clamp-2 mb-2">
                        {offer.targetTitle}
                      </h3>

                      {/* Public URL indicator */}
                      <div className="mb-3">
                        <a
                          href={publicOfferUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#CCD2D9] hover:text-[#08E6F9] inline-flex items-center gap-1 transition"
                        >
                          <ExternalLink className="w-3 h-3 text-[#08E6F9]" />
                          View Public Product Page
                        </a>
                      </div>

                      {/* Pricing & Commission Details */}
                      <div className="p-3.5 rounded-xl bg-[#000000]/60 border border-[#2B7EB5]/20 space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#CCD2D9]">Customer Price:</span>
                          <span className="font-semibold text-white">
                            {formatNaira(offer.targetPrice)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#CCD2D9]">Commission Rate:</span>
                          <span className="font-bold text-[#08E6F9]">
                            {offer.commissionType === 'PERCENTAGE'
                              ? `${offer.commissionValue}%`
                              : `${formatNaira(offer.commissionValue)} Fixed`}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-[#2B7EB5]/10 flex items-center justify-between text-xs">
                          <span className="text-[#CCD2D9] font-medium">Est. Payout / Unit:</span>
                          <span className="font-extrabold text-[#08E6F9] text-sm">
                            {formatNaira(estimatedEarnings)}
                          </span>
                        </div>
                      </div>

                      {offer.minPayoutConditions && (
                        <p className="text-[11px] text-[#CCD2D9]/70 italic mb-2">
                          * {offer.minPayoutConditions}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => handleGenerateClick(offer)}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#06C3F8] hover:from-[#0682F4] hover:to-[#08E6F9] transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#0682F4]/20"
                    >
                      <Share2 className="w-4 h-4" />
                      {hasVerifiedPayout ? 'Get Referral Link & Share' : 'Verify Bank to Unlock Link'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Link Generation & Copy Modal */}
        {selectedOfferForLink && (
          <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-xl w-full p-6 sm:p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/60 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedOfferForLink(null)}
                className="absolute top-5 right-5 text-[#CCD2D9] hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 text-[#08E6F9] text-xs font-bold uppercase tracking-wider mb-2">
                <Share2 className="w-4 h-4" />
                Referral Link Ready
              </div>

              {/* Product Header in Modal */}
              <div className="flex items-start gap-4 mb-4">
                {selectedOfferForLink.targetImage && (
                  <img
                    src={selectedOfferForLink.targetImage}
                    alt={selectedOfferForLink.targetTitle}
                    className="w-16 h-16 rounded-xl object-cover bg-black shrink-0 border border-[#2B7EB5]/30"
                  />
                )}
                <div>
                  <h2 className="text-lg font-extrabold text-white leading-snug">
                    {selectedOfferForLink.targetTitle}
                  </h2>
                  <div className="text-xs text-[#08E6F9] mt-0.5 font-semibold">
                    {selectedOfferForLink.targetCategory} • Est. Commission: {formatNaira(calculateEstimatedEarnings(selectedOfferForLink))}
                  </div>
                </div>
              </div>

              {copySuccessMsg && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {copySuccessMsg}
                </div>
              )}

              {isGenerating ? (
                <div className="py-8 text-center text-sm text-[#CCD2D9]">
                  Generating server-signed link...
                </div>
              ) : linkError ? (
                <div className="p-4 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-xs text-[#CCD2D9] mb-4">
                  {linkError}
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Public Normal URL Info */}
                  <div className="p-3 rounded-xl bg-[#000000]/60 border border-[#2B7EB5]/20 text-xs">
                    <span className="text-[#CCD2D9]">Public Store URL:</span>{' '}
                    <a
                      href={normalProductUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-white/80 hover:text-[#08E6F9] inline-flex items-center gap-1 underline ml-1"
                    >
                      {normalProductUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Primary Unique Referral URL */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-[#CCD2D9] uppercase tracking-wider">
                        Your Unique Referral URL (With Ref Code) *
                      </label>
                      <span className="text-[10px] text-[#08E6F9] font-mono">
                        Code: {profile?.affiliateCode}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#000000] border border-[#2B7EB5]/40 font-mono text-xs text-[#08E6F9] break-all select-all flex items-center justify-between gap-2">
                      <span>{generatedLinkUrl || shortLinkUrl}</span>
                    </div>
                  </div>

                  {/* Short / Direct Link Option */}
                  {shortLinkUrl && (
                    <div>
                      <label className="block text-[11px] font-semibold text-[#CCD2D9] uppercase tracking-wider mb-1.5">
                        Compact Slug Link
                      </label>
                      <div className="p-3 rounded-xl bg-[#000000]/60 border border-[#2B7EB5]/30 font-mono text-xs text-[#CCD2D9] break-all select-all">
                        {shortLinkUrl}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons: Copy, Preview, Share */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => handleCopyLink(generatedLinkUrl || shortLinkUrl || '')}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#0682F4]/20"
                    >
                      {linkCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Referral Link
                        </>
                      )}
                    </button>

                    <a
                      href={generatedLinkUrl || shortLinkUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#000000] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer flex items-center justify-center gap-1.5"
                      title="Open link in new browser tab to test destination"
                    >
                      <ExternalLink className="w-4 h-4 text-[#08E6F9]" />
                      Preview
                    </a>

                    <button
                      onClick={() => handleShareLink(generatedLinkUrl || shortLinkUrl || '', selectedOfferForLink.targetTitle)}
                      className="py-3 px-4 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#000000] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer flex items-center justify-center gap-1.5"
                      title="Share using native device share sheet"
                    >
                      <Share2 className="w-4 h-4 text-[#08E6F9]" />
                      Share
                    </button>
                  </div>
                  <p className="text-[11px] text-[#CCD2D9]/70 leading-relaxed">
                    Attribution is automatically preserved when buyers visit via this link. Safe to share on any external website, blog, or social network.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Copy Fallback Modal */}
        {showManualCopyModal && (
          <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 rounded-2xl bg-[#01213D] border border-[#0682F4]/60 shadow-2xl relative">
              <button
                onClick={() => setShowManualCopyModal(null)}
                className="absolute top-4 right-4 text-[#CCD2D9] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-white mb-2">Copy Referral Link</h3>
              <p className="text-xs text-[#CCD2D9] mb-4">
                Clipboard write permission was restricted by your browser. Please select all the text below and press <strong className="text-white">Ctrl+C</strong> (or <strong className="text-white">Cmd+C</strong> on Mac):
              </p>
              <textarea
                readOnly
                value={showManualCopyModal}
                className="w-full h-24 p-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/40 font-mono text-xs text-[#08E6F9] select-all focus:outline-none"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowManualCopyModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0682F4] hover:bg-[#05A9F7] cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
