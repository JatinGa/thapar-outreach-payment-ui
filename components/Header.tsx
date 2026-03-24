'use client';

import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Text */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 md:w-12 md:h-12 bg-primary-foreground rounded-lg overflow-hidden flex items-center justify-center">
              <Image
                src="/thapar-logo.jpeg"
                alt="Thapar Institute logo"
                fill
                sizes="48px"
                className="object-contain p-1"
                priority
              />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold leading-tight">
                Thapar Institute of Engineering & Technology
              </h1>
              <p className="text-xs md:text-sm opacity-90">Payment Portal</p>
            </div>
          </div>

          {/* Right: Subtitle (visible on larger screens) */}
          <div className="hidden md:block text-right">
            <p className="text-sm opacity-90">Secure Payment Processing</p>
          </div>
        </div>
      </div>
    </header>
  );
}
