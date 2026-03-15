'use client';

import { useState } from 'react';
import { Bed, UtensilsCrossed } from 'lucide-react';
import Header from '@/components/Header';
import PaymentCard from '@/components/PaymentCard';
import Footer from '@/components/Footer';

export default function Home() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const paymentOptions = [
    {
      id: 'accommodation-food',
      title: 'Accommodation + Food',
      description: 'Includes accommodation and meals for 17–19 April. Food services will be provided by Sodexo.',
      icon: UtensilsCrossed,
      price: '₹5,999',
      buttonText: 'Proceed to Payment',
    },
    {
      id: 'accommodation-only',
      title: 'Accommodation Only',
      description: 'Includes accommodation for 17–19 April. Meals are not included in this plan.',
      icon: Bed,
      price: '₹3,499',
      buttonText: 'Proceed to Payment',
    },
  ];

  const handlePaymentClick = (optionId: string) => {
    setSelectedOption(optionId);
    // This can later be connected to payment microservice API
    console.log(`Payment initiated for: ${optionId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-4xl">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Accommodation Payment
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Please select your preferred accommodation package for 17–19 April. Meal services, where applicable, will be provided by Sodexo.
            </p>
          </div>

          {/* Payment Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
            {paymentOptions.map((option) => (
              <PaymentCard
                key={option.id}
                {...option}
                isSelected={selectedOption === option.id}
                onPaymentClick={() => handlePaymentClick(option.id)}
              />
            ))}
          </div>


        </div>
      </main>

      <Footer />
    </div>
  );
}
