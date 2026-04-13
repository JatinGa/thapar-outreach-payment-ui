'use client';

import Link from 'next/link';
import { useState } from 'react';

const THAPAR_ADDRESS = 'Thapar Main Gate, Bhadson Road, Patiala, Punjab 147004, India';
const THAPAR_PHONE_DISPLAY = '+91 98149-56560';
const THAPAR_PHONE_HREF = 'tel:+919814956560';
const THAPAR_EMAIL = 'accommodationsthapar@gmail.com';
const THAPAR_MAP_QUERY = encodeURIComponent(THAPAR_ADDRESS);
const THAPAR_VIEW_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${THAPAR_MAP_QUERY}`;
const THAPAR_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${THAPAR_MAP_QUERY}`;

export default function Footer() {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(THAPAR_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

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
            <p><span className="font-semibold text-foreground">College:</span> Thapar Institute of Engineering and Technology</p>
            <p>
              <span className="font-semibold text-foreground">Contact:</span>{' '}
              <a
                href={THAPAR_PHONE_HREF}
                className="text-primary hover:text-primary/80 underline underline-offset-2"
              >
                {THAPAR_PHONE_DISPLAY}
              </a>{' '}
              |{' '}
              <a
                href={`mailto:${THAPAR_EMAIL}`}
                className="text-primary hover:text-primary/80 underline underline-offset-2"
              >
                {THAPAR_EMAIL}
              </a>
            </p>
            <div className="space-y-1">
              <p><span className="font-semibold text-foreground">Address:</span> {THAPAR_ADDRESS}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs md:text-sm">
                <a
                  href={THAPAR_VIEW_MAP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline underline-offset-2"
                >
                  View on Map
                </a>
                <a
                  href={THAPAR_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline underline-offset-2"
                >
                  Get Directions
                </a>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="text-primary hover:text-primary/80 underline underline-offset-2"
                >
                  {copied ? 'Address Copied' : 'Copy Address'}
                </button>
              </div>
            </div>
          </div>

          {/* Built By */}
          <div className="border-t border-border/50 pt-4 flex items-center justify-center md:justify-start">
            <p className="text-xs text-foreground/50 tracking-widest uppercase font-medium">
              Built with care by{' '}
              <span className="text-foreground/80 font-semibold tracking-wide">Team CCS</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
