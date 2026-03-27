'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bed, UtensilsCrossed, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchFests, initiatePayment, checkBackendHealth, Fest, BookingDetail } from '@/lib/backend';

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

export default function Home() {
  const [fests, setFests] = useState<Fest[]>([]);
  const [selectedFest, setSelectedFest] = useState<Fest | null>(null);
  const [selectedOption, setSelectedOption] = useState<AccommodationOption | null>(null);
  const [userDetails, setUserDetails] = useState({ name: '', state: '', district: '' });
  const [activePaymentOptionId, setActivePaymentOptionId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    const loadFests = async () => {
      try {
        const isHealthy = await checkBackendHealth();
        setBackendReady(isHealthy);

        if (isHealthy) {
          const festList = await fetchFests();
          setFests(festList);
        } else {
          setPaymentError('Backend service is unavailable. Please try again later.');
        }
      } catch (error) {
        setPaymentError(
          error instanceof Error ? error.message : 'Failed to load fests'
        );
      } finally {
        setLoading(false);
      }
    };

    loadFests();
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
        source: 'direct_portal',
        user_name: userDetails.name,
        user_state: userDetails.state,
        user_district: userDetails.district,
        booking,
      });

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('lastTransactionId', response.internal_tx_id);

        // EaseBuzz expects a POST form submission with signed fields.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = response.easebuzz_payment_url;

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
    setSelectedFest(null);
    setSelectedOption(null);
    setUserDetails({ name: '', state: '', district: '' });
    setPaymentError(null);
  };

  const handleOptionSelect = (option: AccommodationOption) => {
    setSelectedOption(option);
    setPaymentError(null);
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

  const accommodationOptions: AccommodationOption[] = (() => {
    if (!selectedFest) return [];

    const optionDays = selectedFest.pricing.num_days || DEFAULT_OPTION_DAYS;
    const baseOptions: AccommodationOption[] = [
      { id: 'accommodation', title: 'Accommodation Only', price: getDisplayPrice(selectedFest, 'accommodation', optionDays), days: optionDays, icon: 'bed' },
      { id: 'food', title: 'Food Only', price: getDisplayPrice(selectedFest, 'food', optionDays), days: optionDays, icon: 'utensils' },
      { id: 'bundled', title: 'Accommodation + Food', price: getDisplayPrice(selectedFest, 'bundled', optionDays), days: optionDays, icon: 'bed' },
    ];

    // Bundled mode always supports all three booking choices.
    if (selectedFest.pricing.mode === 'bundled') return baseOptions;

    const allowed = new Set(selectedFest.available_options || ['accommodation', 'food', 'bundled']);
    return baseOptions.filter((option) => allowed.has(option.id));
  })();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-6xl">
          {!selectedFest ? (
            <>
              {/* Fest Selection Screen */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Accommodation Booking
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Select a festival to proceed with accommodation booking.
                </p>
              </div>

              {!backendReady ? (
                <div className="text-center py-12 bg-muted rounded-lg">
                  <p className="text-muted-foreground mb-4">Backend service is unavailable.</p>
                </div>
              ) : fests.length === 0 ? (
                <div className="text-center py-12 bg-muted rounded-lg">
                  <p className="text-muted-foreground mb-4">No fests available at the moment.</p>
                  <p className="text-sm text-muted-foreground">Please check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fests.map((fest) => (
                    <div
                      key={fest.fest_id}
                      onClick={() => setSelectedFest(fest)}
                      className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 break-words">
                            {fest.legal_name}
                          </h2>
                          <p className="text-sm text-primary font-medium">{fest.event_dates || 'TBA'}</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p
                        className="text-muted-foreground text-sm leading-relaxed break-words"
                        style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {fest.short_description || 'Join us for an unforgettable experience.'}
                      </p>
                      <div className="mt-6 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Accommodation options available
                        </p>
                      </div>
                    </div>
                  ))}
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
                  Back to Fests
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
                {selectedOption && (
                  <div className="bg-card border border-border rounded-lg p-8 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-foreground mb-6">Your Details</h2>
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
                        <input
                          type="text"
                          placeholder="Enter your state"
                          value={userDetails.state}
                          onChange={(e) => setUserDetails({ ...userDetails, state: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">District *</label>
                        <input
                          type="text"
                          placeholder="Enter your district"
                          value={userDetails.district}
                          onChange={(e) => setUserDetails({ ...userDetails, district: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handlePaymentClick(selectedOption)}
                      disabled={activePaymentOptionId !== null}
                      className="w-full mt-6 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {activePaymentOptionId ? 'Processing Payment...' : 'Proceed to Payment'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
