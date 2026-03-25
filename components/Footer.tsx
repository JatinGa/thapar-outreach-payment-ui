'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col gap-6">
          {/* Copyright */}
          <p className="text-sm md:text-base text-foreground/80 text-center md:text-left">
            © {new Date().getFullYear()} Thapar Institute of Engineering & Technology
          </p>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-3">
            <Link href="/terms-and-conditions" className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium">
              Terms and Conditions
            </Link>
            <Link href="/privacy-policy" className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium">
              Privacy Policy
            </Link>
            <Link href="/cancellation-and-refund-policy" className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium">
              Cancellation and Refund Policy
            </Link>
            <Link href="/about-us" className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium">
              About Us
            </Link>
            <Link href="/contact" className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium">
              Contact Details
            </Link>
          </nav>

          <div className="text-xs md:text-sm text-foreground/70 text-center md:text-left space-y-1">
            <p>Legal Name: Thapar Institute of Engineering and Technology</p>
            <p>Contact: xxxxx-xxxxx | xxxx@thapar.edu</p>
            <p>Address: Bhadson Road, Adarsh Nagar, Patiala, Punjab 147004, India</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
