import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Truck,
  ArrowRight,
  AlertCircle,
  Lock,
  ChevronRight,
  CheckCircle2,
  Package,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useCommerce } from '../../context/CommerceContext';
import { useRouter } from '../../context/RouterContext';
import { DeliveryInfo, CheckoutCalculation } from '../../types/commerce';

export const CheckoutPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { cart, clearCart, formatPrice } = useMarketplace();
  const { validateCartItems, initializeCheckout } = useCommerce();
  const { navigate } = useRouter();

  // Delivery Form State
  const [fullName, setFullName] = useState(profile?.fullName || user?.displayName || '');
  const [email, setEmail] = useState(user?.email || profile?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [country, setCountry] = useState('Nigeria');
  const [state, setState] = useState('Lagos State');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Payment Provider Option
  const [selectedProvider, setSelectedProvider] = useState<'PAYSTACK' | 'TEST_GATEWAY'>('PAYSTACK');

  // Calculation and Verification State
  const [calcResult, setCalcResult] = useState<CheckoutCalculation | null>(null);
  const [calcLoading, setCalcLoading] = useState(true);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync user details on auth update
  useEffect(() => {
    if (profile?.fullName && !fullName) setFullName(profile.fullName);
    if ((user?.email || profile?.email) && !email) setEmail(user?.email || profile?.email || '');
    if (profile?.phoneNumber && !phoneNumber) setPhoneNumber(profile.phoneNumber);
  }, [profile, user]);

  // Server-authoritative price & stock recalculation
  useEffect(() => {
    let isCancelled = false;

    async function recalculate() {
      if (cart.length === 0) {
        setCalcLoading(false);
        return;
      }

      setCalcLoading(true);
      setCalcError(null);

      const itemsPayload = cart.map((c) => ({
        productId: c.productId,
        quantity: c.quantity,
        variantId: c.variantId,
      }));

      const res = await validateCartItems(itemsPayload);

      if (isCancelled) return;

      if (res.success && res.calculation) {
        setCalcResult(res.calculation);
      } else {
        setCalcError(res.error || 'Server pricing validation failed. Some items may be out of stock.');
      }
      setCalcLoading(false);
    }

    recalculate();

    return () => {
      isCancelled = true;
    };
  }, [cart, validateCartItems]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!user) {
      navigate('/signin');
      return;
    }

    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !city.trim() || !address.trim()) {
      setSubmitError('Please complete all required delivery and contact fields.');
      return;
    }

    if (!calcResult || calcResult.items.length === 0) {
      setSubmitError('No valid items found in order. Please refresh your cart.');
      return;
    }

    setSubmitting(true);

    const deliveryInfo: DeliveryInfo = {
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      country: country.trim(),
      state: state.trim(),
      city: city.trim(),
      address: address.trim(),
      deliveryNotes: deliveryNotes.trim() || undefined,
    };

    const itemsPayload = calcResult.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      variantId: i.variantId,
    }));

    const result = await initializeCheckout(deliveryInfo, itemsPayload, selectedProvider);

    setSubmitting(false);

    if (result.success && result.authorizationUrl) {
      // Clear client cart cache so customer doesn't duplicate
      clearCart();

      // If test mode direct redirect or Paystack checkout URL
      if (result.authorizationUrl.startsWith('http://') || result.authorizationUrl.startsWith('https://')) {
        window.location.href = result.authorizationUrl;
      } else {
        navigate(result.authorizationUrl);
      }
    } else {
      setSubmitError(result.error || 'Unable to initialize checkout. Please check connection and try again.');
    }
  };

  // Auth gate
  if (!user) {
    return (
      <div className="py-24 bg-[#01213D] min-h-[80vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#01213D] border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9] mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display font-bold text-2xl text-white">Sign In to Checkout</h2>
              <p className="text-xs sm:text-sm text-[#CCD2D9]">
                To ensure transaction security, order traceability, and seller escrow protection, please sign in before finalizing your purchase.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <Button variant="primary" size="md" onClick={() => navigate('/signin')} fullWidth>
                <span>Sign In to Nexovira</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/register')} fullWidth>
                Create Free Account
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Empty cart gate
  if (cart.length === 0 && !submitting) {
    return (
      <div className="py-24 bg-[#01213D] min-h-[80vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#01213D] border border-[#0682F4]/40 flex items-center justify-center text-[#CCD2D9]/40 mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display font-bold text-2xl text-white">Your Cart is Empty</h2>
              <p className="text-xs sm:text-sm text-[#CCD2D9]">
                Add hardware or appliance items from the verified marketplace catalog to proceed with checkout.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => navigate('/marketplace')} fullWidth>
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 bg-[#01213D] min-h-screen">
      <Container size="wide">
        {/* Breadcrumb Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0682F4]/20 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#08E6F9]">
              <span>Marketplace</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#CCD2D9]/50" />
              <span>Cart</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#CCD2D9]/50" />
              <span className="text-white font-bold">Secure Checkout</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              NEXOVIRA COMMERCE CHECKOUT
            </h1>
            <p className="text-xs text-[#CCD2D9]/80">
              Verified multi-merchant escrow and real-time bank gateway processing.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#011B33] border border-[#0682F4]/30 text-xs font-mono text-[#08E6F9] self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-[#08E6F9]" />
            <span>256-Bit Bank Level Encryption</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {(calcError || submitError) && (
          <div className="mb-8 p-4 rounded-xl bg-[#011629] border border-red-500/50 flex items-start gap-3 text-red-200 text-xs leading-relaxed animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-red-300 mb-0.5">Checkout Notice:</div>
              <div>{submitError || calcError}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Delivery & Payment Details */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Section 1: Customer Contact & Delivery Details */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#0682F4]/20">
                <div className="w-8 h-8 rounded-lg bg-[#01213D] border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9]">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-white">Delivery Information</h2>
                  <p className="text-[11px] text-[#CCD2D9]/70">Enter recipient coordinates for direct merchant fulfillment.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Chukwuma Adeleke"
                    className="w-full bg-[#01213D] text-white text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none placeholder:text-[#CCD2D9]/30"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-[#01213D] text-white text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none placeholder:text-[#CCD2D9]/30"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+234 800 000 0000"
                    maxLength={25}
                    className="w-full bg-[#01213D] text-white text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none placeholder:text-[#CCD2D9]/30"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#01213D] text-white text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none placeholder:text-[#CCD2D9]/30"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    State / Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Lagos State, Abuja FCT"
                    className="w-full bg-[#01213D] text-white text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none placeholder:text-[#CCD2D9]/30"
                  />
                </div>

                {/* City */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Ikeja, Lekki, Victoria Island"
                    className="w-full bg-[#01213D] text-white text-sm px-3.5 py-2.5 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none placeholder:text-[#CCD2D9]/30"
                  />
                </div>

                {/* Street Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#CCD2D9] mb-1.5">
                    Physical Delivery Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Plot / House number, street name, landmark"
                    className="w-full bg-[#01213D] text-white text-sm p-3 rounded-lg border border-[#0682F4]/30 focus:border-[#08E6F9] focus:outline-none placeholder:text-[#CCD2D9]/30 resize-none"
                  />
                </div>

                {/* Optional Delivery Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-[#CCD2D9]/80 mb-1.5">
                    Special Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Call upon arrival at security gate"
                    className="w-full bg-[#01213D] text-white text-sm px-3.5 py-2 rounded-lg border border-[#0682F4]/20 focus:border-[#08E6F9] focus:outline-none placeholder:text-[#CCD2D9]/30 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Payment Provider Selection */}
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#0682F4]/20">
                <div className="w-8 h-8 rounded-lg bg-[#01213D] border border-[#0682F4]/40 flex items-center justify-center text-[#08E6F9]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-white">Payment Method & Gateway</h2>
                  <p className="text-[11px] text-[#CCD2D9]/70">Secure, encrypted settlement channels.</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Paystack Option */}
                <label
                  className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedProvider === 'PAYSTACK'
                      ? 'bg-[#0682F4]/15 border-[#08E6F9] shadow-lg shadow-[#0682F4]/10'
                      : 'bg-[#01213D] border-[#0682F4]/20 hover:border-[#0682F4]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment_provider"
                        checked={selectedProvider === 'PAYSTACK'}
                        onChange={() => setSelectedProvider('PAYSTACK')}
                        className="mt-1 text-[#08E6F9] focus:ring-[#08E6F9]"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-sm text-white">
                            Paystack Payment Gateway
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#08E6F9]/20 text-[#08E6F9] border border-[#08E6F9]/40">
                            Verified Instant
                          </span>
                        </div>
                        <p className="text-xs text-[#CCD2D9]/80 leading-relaxed">
                          Pay with Mastercard, Visa, Verve, Bank Transfer, USSD, or Apple Pay through Paystack's PCI-DSS Level 1 certified gateway.
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Additional Provider Placeholder (Architecture ready for Flutterwave, Moniepoint) */}
                <div className="p-3.5 rounded-xl bg-[#01213D]/40 border border-[#0682F4]/10 text-xs text-[#CCD2D9]/60 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#0682F4] shrink-0" />
                  <span>
                    Additional African payment rails (Flutterwave, Moniepoint) are modularly supported by the backend architecture.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Confirmation Box */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-[#0682F4]/20">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#08E6F9]" />
                  <h3 className="font-display font-bold text-base text-white">Order Summary</h3>
                </div>
                <span className="text-xs font-mono text-[#08E6F9]">
                  {calcResult?.itemCount || cart.length} units
                </span>
              </div>

              {/* Items List Preview */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {calcLoading ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-[#0682F4] border-t-[#08E6F9] rounded-full animate-spin mx-auto" />
                    <span className="text-xs font-mono text-[#CCD2D9]">Verifying stock & live pricing...</span>
                  </div>
                ) : (
                  (calcResult?.items || []).map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#01213D] border border-[#0682F4]/20">
                      <div className="w-12 h-12 rounded bg-[#011629] overflow-hidden shrink-0 border border-[#0682F4]/20">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-[#CCD2D9]/40">Item</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{item.name}</h4>
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#CCD2D9] pt-1">
                          <span>Qty: {item.quantity}</span>
                          <span className="text-white font-bold">{formatPrice(item.itemTotal, item.currency)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="pt-3 border-t border-[#0682F4]/20 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-[#CCD2D9]">
                  <span>Item Subtotal</span>
                  <span className="text-white font-semibold">
                    {formatPrice(calcResult?.subtotal || 0, 'NGN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#CCD2D9]">
                  <span>Logistics & Delivery Fee</span>
                  <span className="text-white font-semibold">
                    {formatPrice(calcResult?.deliveryFee || 0, 'NGN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#CCD2D9]">
                  <span>Platform Discounts</span>
                  <span className="text-[#08E6F9] font-semibold">
                    {formatPrice(calcResult?.discount || 0, 'NGN')}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#0682F4]/20 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-display font-bold text-white block">Total Payable</span>
                    <span className="text-[10px] text-[#CCD2D9]/60">Guaranteed server-verified amount</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-[#08E6F9]">
                    {formatPrice(calcResult?.total || 0, 'NGN')}
                  </div>
                </div>
              </div>

              {/* Security Reassurance */}
              <div className="p-3 rounded-lg bg-[#01213D] border border-[#0682F4]/20 text-[11px] text-[#CCD2D9] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#08E6F9] shrink-0" />
                <span>Inventory is verified and escrow held until confirmed payment.</span>
              </div>

              {/* Pay Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={submitting || calcLoading || (calcResult?.items.length || 0) === 0}
                className="py-3.5 text-sm font-bold tracking-wide"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Initiating Payment...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Pay {formatPrice(calcResult?.total || 0, 'NGN')}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
};
