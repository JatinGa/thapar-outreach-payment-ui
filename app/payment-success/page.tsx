'use client';

import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  const [redirectUrl, setRedirectUrl] = useState<string>('https://accommodationstiet.shop');
  const [countdown, setCountdown] = useState(5);
  const [autoRedirecting, setAutoRedirecting] = useState(true);

  useEffect(() => {
    // Get fest's authorized URL from query params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        try {
          const url = new URL(redirect);
          setRedirectUrl(url.toString());
        } catch {
          console.error('Invalid redirect URL:', redirect);
        }
      }

      // Auto-redirect after 5 seconds
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (typeof window !== 'undefined') {
              window.location.href = redirectUrl;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [redirectUrl]);

  const handleRedirectNow = () => {
    if (typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-lg text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-foreground">
            Payment Successful!
          </h1>

          <p className="text-base text-muted-foreground">
            Your payment has been processed successfully. Your booking confirmation has been sent to your email.
          </p>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              Redirecting to fest website in <span className="font-bold text-foreground">{countdown}</span> seconds...
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {redirectUrl}
            </p>
          </div>

          <Button
            onClick={handleRedirectNow}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Go to Website Now
          </Button>

          <p className="text-xs text-muted-foreground">
            Transaction ID: {typeof window !== 'undefined' ? window.sessionStorage.getItem('lastTransactionId') || 'N/A' : 'N/A'}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
