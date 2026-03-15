'use client';

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <p className="text-sm md:text-base text-foreground/80">
            © {new Date().getFullYear()} Thapar Institute of Engineering & Technology
          </p>

          {/* Links */}
          <nav className="flex items-center gap-6 md:gap-8">
            <a
              href="#privacy"
              className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium"
            >
              Privacy Policy
            </a>
            <span className="text-foreground/30">|</span>
            <a
              href="#support"
              className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium"
            >
              Support
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
