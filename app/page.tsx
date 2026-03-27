'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bed, UtensilsCrossed, ChevronRight } from 'lucide-react';
import { getAllStates, getDistricts } from 'india-state-district';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchFests, fetchFest, initiatePayment, checkBackendHealth, verifyLaunch, LaunchVerifyError, Fest, BookingDetail } from '@/lib/backend';

const PaymentCard = dynamic(() => import('@/components/PaymentCard'), {
  loading: () => (
    <div className="bg-card border border-border rounded-xl p-8 shadow-md animate-pulse">
      <div className="h-8 w-1/2 bg-muted rounded mb-4" />
      <div className="h-4 w-full bg-muted rounded mb-2" />
      <div className="h-4 w-4/5 bg-muted rounded mb-6" />
      <div className="h-10 w-full bg-muted rounded" />
    </div>
  ),
});

interface AccommodationOption {
  id: string;
  title: string;
  price: string;
  days: number;
  icon: 'utensils' | 'bed';
}

const DEFAULT_OPTION_DAYS = 3;

const iconMap = {
  utensils: UtensilsCrossed,
  bed: Bed,
};

const INDIAN_STATES = getAllStates();

export default function Home() {
  const [publicFests, setPublicFests] = useState<Fest[]>([]);
  const [selectedFest, setSelectedFest] = useState<Fest | null>(null);
  const [selectedOption, setSelectedOption] = useState<AccommodationOption | null>(null);
  const [userDetails, setUserDetails] = useState({ name: '', state: '', district: '' });
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [activePaymentOptionId, setActivePaymentOptionId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [loginRedirectUrl, setLoginRedirectUrl] = useState('https://accommodationstiet.shop');
  const [launchContext, setLaunchContext] = useState<{
    origin_user_id: string;
    launch_exp?: number;
    launch_sig?: string;
  } | null>(null);

  useEffect(() => {
    const loadFestFromLaunch = async () => {
      const defaultRedirect = process.env.NEXT_PUBLIC_LOGIN_REDIRECT_URL || 'https://accommodationstiet.shop';

      const redirectToLogin = (url: string, message: string) => {
        setLoginRedirectUrl(url);
        setPaymentError(message);
      };

      try {
        const query = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const fest_id = query.get('fest_id');
        const origin_user_id = query.get('origin_user_id');
        const expParam = query.get('exp');
        const sig = query.get('sig');

        // Keep homepage and booking flow separate.
        if (typeof window !== 'undefined' && window.location.pathname === '/' && fest_id && origin_user_id) {
          window.location.replace(`/booking?${query.toString()}`);
          return;
        }

        const isHealthy = await checkBackendHealth();
        setBackendReady(isHealthy);

        if (!isHealthy) {
          setPaymentError('Backend service is unavailable. Please try again later.');
          return;
        }

        if (!fest_id || !origin_user_id) {
          const fests = await fetchFests();
          setPublicFests(fests);
          return;
        }

        if (!expParam || !sig) {
          if (fest_id && origin_user_id) {
            const fest = await fetchFest(fest_id);
            setSelectedFest(fest);
            setLoginRedirectUrl(fest.authorized_url || defaultRedirect);
            setLaunchContext({
              origin_user_id,
            });
            setPaymentError(null);
            return;
          }
        }

        const exp = Number(expParam);
        if (!Number.isFinite(exp)) {
          redirectToLogin(defaultRedirect, 'Invalid launch data. Please login again from your fest website.');
          return;
        }

        if (!sig) {
          redirectToLogin(defaultRedirect, 'Invalid launch signature. Please login again from your fest website.');
          return;
        }

        const launchCheck = await verifyLaunch({
          fest_id,
          origin_user_id,
          exp,
          sig,
        });
        setLoginRedirectUrl(launchCheck.redirect_url || defaultRedirect);

        const fest = await fetchFest(fest_id);
        setSelectedFest(fest);
        setLaunchContext({
          origin_user_id,
          launch_exp: exp,
          launch_sig: sig,
        });
      } catch (error) {
        const fallback =
          error instanceof LaunchVerifyError && error.redirectUrl
            ? error.redirectUrl
            : process.env.NEXT_PUBLIC_LOGIN_REDIRECT_URL || 'https://accommodationstiet.shop';
        setPublicFests([]);
        redirectToLogin(fallback, error instanceof Error ? error.message : 'Launch verification failed.');
      } finally {
        setLoading(false);
      }
    };

    loadFestFromLaunch();
  }, []);

  const handlePaymentClick = async (option: AccommodationOption) => {
    setPaymentError(null);
    setActivePaymentOptionId(option.id);

    if (!selectedFest) {
      setPaymentError('No fest selected');
      setActivePaymentOptionId(null);
      return;
    }

    if (!userDetails.name || !userDetails.state || !userDetails.district) {
      setPaymentError('Please fill in all required fields');
      setActivePaymentOptionId(null);
      return;
    }

    if (!launchContext) {
      setPaymentError('Session expired. Please login again from your fest website.');
      setActivePaymentOptionId(null);
      return;
    }

    try {
      const booking: BookingDetail = {
        accommodation_days:
          option.id === 'accommodation' || option.id === 'bundled' ? option.days : 0,
        food_days:
          option.id === 'food' || option.id === 'bundled' ? option.days : 0,
        accommodation_amount: '0.00',
        food_amount: '0.00',
      };

      const response = await initiatePayment({
        fest_id: selectedFest.fest_id,
        origin_user_id: launchContext.origin_user_id,
        ...(launchContext.launch_exp && launchContext.launch_sig
          ? {
              launch_exp: launchContext.launch_exp,
              launch_sig: launchContext.launch_sig,
            }
          : {}),
        user_name: userDetails.name,
        user_state: userDetails.state,
        user_district: userDetails.district,
        booking,
      });

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('lastTransactionId', response.internal_tx_id);

        if (response.easebuzz_redirect_url) {
          window.location.href = response.easebuzz_redirect_url;
          return;
        }

        // Fallback for older API behavior: post signed fields directly to initiate endpoint.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = response.easebuzz_payment_url;
        form.style.display = 'none';

        const fields: Record<string, string> = {
          key: response.key,
          txnid: response.txnid,
          amount: response.amount,
          productinfo: response.productinfo,
          firstname: response.firstname,
          email: response.email,
          phone: response.phone,
          surl: response.surl,
          furl: response.furl,
          hash: response.hash,
          udf1: response.udf1,
          udf2: response.udf2,
          udf3: response.udf3,
          udf4: response.udf4,
          udf5: response.udf5,
        };

        Object.entries(fields).forEach(([name, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value ?? '';
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      }
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : 'payment is not yet live'
      );
    } finally {
      setActivePaymentOptionId(null);
    }
  };

  const handleBackToFests = () => {
    if (typeof window !== 'undefined') {
      window.location.href = loginRedirectUrl;
    }
  };

  const handleOptionSelect = (option: AccommodationOption) => {
    setSelectedOption(option);
    setPaymentError(null);
  };

  const handleOpenFestWebsite = (fest: Fest) => {
    setPaymentError(`Redirecting to ${fest.legal_name} website...`);
    if (typeof window !== 'undefined') {
      window.location.href = `/api/portal/fests/${encodeURIComponent(fest.fest_id)}/redirect`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading fests...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!backendReady) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-6 py-4 max-w-md">
              <p className="text-destructive font-medium">Backend Service Unavailable</p>
              <p className="text-sm text-muted-foreground mt-2">
                {paymentError || 'The payment service is currently unavailable. Please try again later.'}
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const toAmount = (value?: string | number | null): number => {
    if (value === null || value === undefined) return 0;
    const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatInr = (value: number): string => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getDisplayPrice = (fest: Fest, optionId: string, days: number): string => {
    const pricing = fest.pricing;

    if (pricing.mode === 'fixed') {
      if (optionId === 'accommodation') return formatInr(toAmount(pricing.accommodation_price ?? pricing.fixed_rate));
      if (optionId === 'food') return formatInr(toAmount(pricing.food_price ?? pricing.fixed_rate));
      return formatInr(toAmount(pricing.bundled_price ?? pricing.fixed_rate));
    }

    if (pricing.mode === 'per_day') {
      if (optionId === 'accommodation') {
        const total = toAmount(pricing.addon?.accommodation_per_day ?? pricing.per_day_rate) * days;
        return formatInr(total);
      }
      if (optionId === 'food') {
        const total = toAmount(pricing.addon?.food_per_day ?? pricing.per_day_rate) * days;
        return formatInr(total);
      }
      const accommodation = toAmount(pricing.addon?.accommodation_per_day ?? pricing.per_day_rate) * days;
      const food = toAmount(pricing.addon?.food_per_day ?? pricing.per_day_rate) * days;
      return formatInr(accommodation + food);
    }

    const accommodation = toAmount(pricing.addon?.accommodation_per_day) * days;
    const food = toAmount(pricing.addon?.food_per_day) * days;
    if (optionId === 'accommodation') return formatInr(accommodation);
    if (optionId === 'food') return formatInr(food);

    const discountPercent = toAmount(pricing.addon?.bundled_discount_percent);
    const subtotal = accommodation + food;
    const discounted = subtotal * (1 - discountPercent / 100);
    return formatInr(discounted);
  };

  const getOptionAmount = (fest: Fest, optionId: string, days: number): number => {
    const pricing = fest.pricing;

    if (pricing.mode === 'fixed') {
      if (optionId === 'accommodation') return toAmount(pricing.accommodation_price ?? pricing.fixed_rate);
      if (optionId === 'food') return toAmount(pricing.food_price ?? pricing.fixed_rate);
      return toAmount(pricing.bundled_price ?? pricing.fixed_rate);
    }

    if (pricing.mode === 'per_day') {
      if (optionId === 'accommodation') {
        return toAmount(pricing.addon?.accommodation_per_day ?? pricing.per_day_rate) * days;
      }
      if (optionId === 'food') {
        return toAmount(pricing.addon?.food_per_day ?? pricing.per_day_rate) * days;
      }
      const accommodation = toAmount(pricing.addon?.accommodation_per_day ?? pricing.per_day_rate) * days;
      const food = toAmount(pricing.addon?.food_per_day ?? pricing.per_day_rate) * days;
      return accommodation + food;
    }

    const accommodation = toAmount(pricing.addon?.accommodation_per_day) * days;
    const food = toAmount(pricing.addon?.food_per_day) * days;
    if (optionId === 'accommodation') return accommodation;
    if (optionId === 'food') return food;

    const discountPercent = toAmount(pricing.addon?.bundled_discount_percent);
    const subtotal = accommodation + food;
    return subtotal * (1 - discountPercent / 100);
  };

  const getAllowedOptions = (fest: Fest): Set<string> => {
    const fromBackend = Array.isArray(fest.available_options)
      ? fest.available_options.filter((opt) => ['accommodation', 'food', 'bundled'].includes(opt))
      : [];

    if (fromBackend.length > 0) {
      return new Set(fromBackend);
    }

    // Fallback when older backend responses omit available_options.
    // Infer visibility from configured prices/rates so disabled options don't render.
    const pricing = fest.pricing;
    const inferred: string[] = [];

    if (pricing.mode === 'fixed') {
      if (toAmount(pricing.accommodation_price ?? pricing.fixed_rate) > 0) inferred.push('accommodation');
      if (toAmount(pricing.food_price ?? pricing.fixed_rate) > 0) inferred.push('food');
      if (toAmount(pricing.bundled_price ?? pricing.fixed_rate) > 0) inferred.push('bundled');
    } else {
      const accRate = toAmount(pricing.addon?.accommodation_per_day ?? pricing.per_day_rate);
      const foodRate = toAmount(pricing.addon?.food_per_day ?? pricing.per_day_rate);
      if (accRate > 0) inferred.push('accommodation');
      if (foodRate > 0) inferred.push('food');
      if (accRate > 0 && foodRate > 0) inferred.push('bundled');
    }

    return new Set(inferred);
  };

  const accommodationOptions: AccommodationOption[] = (() => {
    if (!selectedFest) return [];

    const optionDays = selectedFest.pricing.num_days || DEFAULT_OPTION_DAYS;
    const baseOptions: AccommodationOption[] = [
      { id: 'accommodation', title: 'Accommodation Only', price: getDisplayPrice(selectedFest, 'accommodation', optionDays), days: optionDays, icon: 'bed' },
      { id: 'food', title: 'Food Only', price: getDisplayPrice(selectedFest, 'food', optionDays), days: optionDays, icon: 'utensils' },
      { id: 'bundled', title: 'Accommodation + Food', price: getDisplayPrice(selectedFest, 'bundled', optionDays), days: optionDays, icon: 'bed' },
    ];

    const allowed = getAllowedOptions(selectedFest);
    return baseOptions.filter((option) => {
      if (!allowed.has(option.id)) return false;
      return getOptionAmount(selectedFest, option.id, optionDays) > 0;
    });
  })();

  const availableDistricts = selectedStateCode ? getDistricts(selectedStateCode) : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-6xl">
          {!selectedFest ? (
            <>
              {/* Public Fest Listing Screen */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Available Fests
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Select a fest to continue on its official website.
                </p>
              </div>

              {paymentError && (
                <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {paymentError}
                </div>
              )}

              {!backendReady ? (
                <div className="text-center py-12 bg-muted rounded-lg">
                  <p className="text-muted-foreground mb-4">Backend service is unavailable.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publicFests.length === 0 ? (
                    <div className="md:col-span-2 text-center py-12 bg-muted rounded-lg">
                      <p className="text-muted-foreground mb-2">No fests are available right now.</p>
                    </div>
                  ) : (
                    publicFests.map((fest) => (
                      <div key={fest.fest_id} className="bg-card border border-border rounded-lg p-6 shadow-sm">
                        <h3 className="text-2xl font-bold text-foreground mb-2">{fest.legal_name}</h3>
                        <p className="text-sm text-muted-foreground mb-1">{fest.event_dates || 'Dates to be announced'}</p>
                        <p className="text-sm text-muted-foreground mb-6">
                          {fest.short_description || fest.long_description || 'Open fest website to continue registration and payment.'}
                        </p>
                        <button
                          onClick={() => handleOpenFestWebsite(fest)}
                          className="w-full px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                        >
                          Go to Fest Website
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Accommodation Selection & User Details Screen */}
              <div className="text-center mb-12">
                <button
                  onClick={handleBackToFests}
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to Fest Website
                </button>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {selectedFest.legal_name}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
                  {selectedFest.event_dates || 'Special Event'}
                </p>
                <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                  {selectedFest.long_description || 'Select your accommodation and provide your details to proceed with payment.'}
                </p>
              </div>

              {paymentError && (
                <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {paymentError}
                </div>
              )}

              <div className="w-full">
                {/* Accommodation Options */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Choose Accommodation</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {accommodationOptions.map((option) => {
                      const IconComponent = iconMap[option.icon];
                      const getDescription = (optionId: string) => {
                        if (optionId === 'accommodation') return 'Accommodation only for the event duration';
                        if (optionId === 'food') return 'Meals and food services for the event duration';
                        if (optionId === 'bundled') return 'Both accommodation and meals will be provided';
                        return '';
                      };
                      return (
                        <PaymentCard
                          key={option.id}
                          id={option.id}
                          title={option.title}
                          description={getDescription(option.id)}
                          icon={IconComponent}
                          price={option.price}
                          buttonText={activePaymentOptionId === option.id ? 'Processing...' : 'Select'}
                          isSelected={selectedOption?.id === option.id}
                          onCardSelect={() => handleOptionSelect(option)}
                          onProceedToPayment={() => handlePaymentClick(option)}
                          isLoading={activePaymentOptionId === option.id}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* User Details Form */}
                <div className="bg-card border border-border rounded-lg p-8 max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Your Details</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Select an accommodation option above, then fill your details.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={userDetails.name}
                        onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">State *</label>
                      <select
                        value={selectedStateCode}
                        onChange={(e) => {
                          const code = e.target.value;
                          const stateName = INDIAN_STATES.find((state) => state.code === code)?.name || '';
                          setSelectedStateCode(code);
                          setUserDetails((prev) => ({
                            ...prev,
                            state: stateName,
                            district: '',
                          }));
                        }}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select your state</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state.code} value={state.code}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">District *</label>
                      <select
                        value={userDetails.district}
                        onChange={(e) => setUserDetails({ ...userDetails, district: e.target.value })}
                        disabled={!selectedStateCode}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="">{selectedStateCode ? 'Select your district' : 'Select state first'}</option>
                        {availableDistricts.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!selectedOption) {
                        setPaymentError('Please select an accommodation option first.');
                        return;
                      }
                      handlePaymentClick(selectedOption);
                    }}
                    disabled={activePaymentOptionId !== null}
                    className="w-full mt-6 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {activePaymentOptionId ? 'Processing Payment...' : 'Proceed to Payment'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
