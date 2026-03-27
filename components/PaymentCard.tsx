'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  price: string;
  buttonText: string;
  isSelected: boolean;
  onCardSelect: () => void;
  onProceedToPayment: () => void;
  isLoading?: boolean;
}

export default function PaymentCard({
  id,
  title,
  description,
  icon: Icon,
  price,
  buttonText,
  isSelected,
  onCardSelect,
  onProceedToPayment,
  isLoading = false,
}: PaymentCardProps) {
  return (
    <div
      className={`relative group bg-card rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border-2 cursor-pointer ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onClick={onCardSelect}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          {isSelected && (
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-lg md:text-xl font-bold text-foreground mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          {description}
        </p>

        {/* Divider */}
        <div className="w-12 h-1 bg-primary/20 rounded-full mb-6" />

        {/* Price */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">Price per person</p>
          <p className="text-3xl md:text-4xl font-bold text-primary">
            {price}
          </p>
        </div>

        {/* Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onCardSelect();
          }}
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
            isSelected
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg'
          }`}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
