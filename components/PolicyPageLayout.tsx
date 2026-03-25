import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PolicyPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function PolicyPageLayout({ title, lastUpdated, children }: PolicyPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-10 md:py-14">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Back to Home
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-4">{title}</h1>
            <p className="text-sm text-muted-foreground mt-2">Last updated: {lastUpdated}</p>
          </div>

          <div className="space-y-6 text-sm md:text-base leading-7 text-foreground/90">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
