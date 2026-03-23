'use client';

import { useState, useEffect } from 'react';
import { Bed, UtensilsCrossed, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import PaymentCard from '@/components/PaymentCard';
import Footer from '@/components/Footer';
import { getEvents, Event } from '@/lib/events';

const iconMap = {
  utensils: UtensilsCrossed,
  bed: Bed,
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
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

    refreshEvents();
    setLoading(false);

    window.addEventListener('storage', refreshEvents);
    window.addEventListener('focus', refreshEvents);
    window.addEventListener('thapar-events-updated', refreshEvents);

    return () => {
      window.removeEventListener('storage', refreshEvents);
      window.removeEventListener('focus', refreshEvents);
      window.removeEventListener('thapar-events-updated', refreshEvents);
    };
  }, []);

  const handlePaymentClick = (optionId: string) => {
    setSelectedOption(optionId);
    // This can later be connected to payment microservice API
    console.log(`Payment initiated for event: ${selectedEvent?.id}, option: ${optionId}`);
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setSelectedOption(null);
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
                        buttonText="Proceed to Payment"
                        isSelected={selectedOption === option.id}
                        onPaymentClick={() => handlePaymentClick(option.id)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
