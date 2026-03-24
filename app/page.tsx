'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bed, UtensilsCrossed, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getEvents, Event, AccommodationOption } from '@/lib/events';
import { buildInitPayload, getEasebuzzCheckoutUrl, initPayment } from '@/lib/payment';

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

const iconMap = {
  utensils: UtensilsCrossed,
  bed: Bed,
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [activePaymentOptionId, setActivePaymentOptionId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshEvents = () => {
      const latest = getEvents();
      setEvents(latest);
      setSelectedEvent((current) => {
        if (!current) return null;
        return latest.find((event) => event.id === current.id) ?? null;
      });
    };

    try {
      refreshEvents();
    } finally {
      setLoading(false);
    }

    window.addEventListener('storage', refreshEvents);
    window.addEventListener('focus', refreshEvents);
    window.addEventListener('thapar-events-updated', refreshEvents);

    return () => {
      window.removeEventListener('storage', refreshEvents);
      window.removeEventListener('focus', refreshEvents);
      window.removeEventListener('thapar-events-updated', refreshEvents);
    };
  }, []);

  const handlePaymentClick = async (option: AccommodationOption) => {
    setSelectedOption(option.id);
    setPaymentError(null);
    setActivePaymentOptionId(option.id);

    try {
      const expectedAmount = Number(option.price.replace(/[^\d]/g, ''));
      const payload = buildInitPayload(option);
      const payment = await initPayment(payload);

      if (Number.isFinite(expectedAmount) && payment.originalAmount !== expectedAmount) {
        setPaymentError(
          `Amount mismatch: card shows ₹${expectedAmount}, backend returned ₹${payment.originalAmount}. Please update fest pricing in backend admin.`
        );
        return;
      }

      const checkoutUrl = getEasebuzzCheckoutUrl(payment.accessKey, payment.env);

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('lastMerchantOrderId', payment.merchantOrderId);
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Unable to initialize payment.');
    } finally {
      setActivePaymentOptionId(null);
    }
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setSelectedOption(null);
    setPaymentError(null);
  };

  const handleOptionCardSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setPaymentError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading events...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-4xl">
          {!selectedEvent ? (
            <>
              {/* Events Selection Screen */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Select an Event
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Choose an event to proceed with accommodation booking.
                </p>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-12 bg-muted rounded-lg">
                  <p className="text-muted-foreground mb-4">No events available at the moment.</p>
                  <p className="text-sm text-muted-foreground">Please check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                            {event.name}
                          </h2>
                          <p className="text-sm text-primary font-medium">{event.eventDates}</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {event.outsideDescription}
                      </p>
                      <div className="mt-6 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          {event.accommodationOptions.length} accommodation option{event.accommodationOptions.length !== 1 ? 's' : ''} available
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Accommodation Selection Screen */}
              <div className="text-center mb-12">
                <button
                  onClick={handleBackToEvents}
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to Events
                </button>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {selectedEvent.name}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
                  {selectedEvent.eventDates}
                </p>
                <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                  {selectedEvent.insideDescription}
                </p>
              </div>

              {selectedEvent.accommodationOptions.length === 0 ? (
                <div className="text-center py-12 bg-muted rounded-lg">
                  <p className="text-muted-foreground">No accommodation options available for this event.</p>
                </div>
              ) : (
                <>
                  {paymentError && (
                    <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {paymentError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
                    {selectedEvent.accommodationOptions.map((option) => {
                      const IconComponent = iconMap[option.icon];
                      return (
                        <PaymentCard
                          key={option.id}
                          id={option.id}
                          title={option.title}
                          description={option.description}
                          icon={IconComponent}
                          price={option.price}
                          buttonText={activePaymentOptionId === option.id ? 'Starting Payment...' : 'Proceed to Payment'}
                          isSelected={selectedOption === option.id}
                          onCardSelect={() => handleOptionCardSelect(option.id)}
                          onProceedToPayment={() => handlePaymentClick(option)}
                          isLoading={activePaymentOptionId === option.id}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
