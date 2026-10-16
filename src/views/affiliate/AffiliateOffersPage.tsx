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
} from 'lucide-react';
import { EligibleOffer } from '../../types/affiliate';

export const AffiliateOffersPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { offers, profile, affiliateStatus, generateReferralLink, isLoading } = useAffiliate();

  const [activeTab, setActiveTab] = useState<'ALL' | 'MARKETPLACE' | 'ACADEMY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfferForLink, setSelectedOfferForLink] = useState<EligibleOffer | null>(null);
  const [generatedLinkUrl, setGeneratedLinkUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

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

    setSelectedOfferForLink(offer);
    setIsGenerating(true);
    setLinkError(null);
    setGeneratedLinkUrl(null);
    setLinkCopied(false);

    const result = await generateReferralLink(offer.offerId);
    setIsGenerating(false);

    if (result.success && result.shareableUrl) {
      setGeneratedLinkUrl(result.shareableUrl);
    } else {
      setLinkError(result.error || 'Failed to generate link.');
    }
  };

  const copyGeneratedLink = () => {
    if (!generatedLinkUrl) return;
    navigator.clipboard.writeText(generatedLinkUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
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
              Product Discovery
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Eligible Affiliate Offers
            </h1>
            <p className="mt-2 text-sm text-[#CCD2D9] max-w-2xl">
              Browse approved Nexovira hardware and academy programs with configured commission rates.
              Generate targeted referral links and track conversions directly.
            </p>
          </div>

          {affiliateStatus === 'APPROVED' && (
            <button
              onClick={() => navigate('/affiliate/dashboard')}
              className="self-start md:self-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#01213D] hover:text-white border border-[#2B7EB5]/40 transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          )}
        </div>

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
              Marketplace
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
              Academy Cohorts
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CCD2D9]/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search offers or categories..."
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
                            {isMarketplace ? 'Hardware' : 'Academy Cohort'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="text-[11px] font-semibold text-[#08E6F9] uppercase tracking-wider mb-1">
                        {offer.targetCategory}
                      </div>
                      <h3 className="text-base font-bold text-white leading-snug line-clamp-2 mb-3">
                        {offer.targetTitle}
                      </h3>

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
                      Generate Referral Link
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Link Generation Modal */}
        {selectedOfferForLink && (
          <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-lg w-full p-6 sm:p-8 rounded-2xl bg-[#01213D] border border-[#0682F4]/60 shadow-2xl relative">
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

              <h2 className="text-xl font-extrabold text-white mb-1">
                {selectedOfferForLink.targetTitle}
              </h2>
              <p className="text-xs text-[#CCD2D9] mb-6">
                Share this link with your audience. Any qualifying purchases made within 30 days will be server-attributed to your affiliate wallet.
              </p>

              {isGenerating ? (
                <div className="py-8 text-center text-sm text-[#CCD2D9]">
                  Generating server-signed link...
                </div>
              ) : linkError ? (
                <div className="p-4 rounded-xl bg-[#000000] border border-[#2B7EB5]/30 text-xs text-[#CCD2D9] mb-4">
                  {linkError}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#CCD2D9] uppercase tracking-wider mb-1.5">
                      Your Unique Referral URL
                    </label>
                    <div className="p-3 rounded-xl bg-[#000000] border border-[#2B7EB5]/40 font-mono text-xs text-[#08E6F9] break-all select-all">
                      {generatedLinkUrl}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={copyGeneratedLink}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#01213D] via-[#0682F4] to-[#08E6F9] hover:from-[#0682F4] hover:to-[#08E6F9] transition cursor-pointer flex items-center justify-center gap-2"
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
                    <button
                      onClick={() => setSelectedOfferForLink(null)}
                      className="py-3 px-4 rounded-xl text-xs font-semibold text-[#CCD2D9] bg-[#000000] hover:text-white border border-[#2B7EB5]/30 transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
