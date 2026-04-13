'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TransactionLogSection from '@/components/admin/TransactionLogSection';

type AdminFestSummary = {
  fest_id: string;
  legal_name: string;
};

const AdminProtect = dynamic(() => import('@/components/admin/AdminProtect'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  ),
});

function AdminPaymentsContent() {
  const [fests, setFests] = useState<AdminFestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFests = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/admin/fests', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Failed to load fests (${response.status})`);
      setFests(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load fests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFests();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-primary/80 rounded-lg transition">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold leading-tight">Payments</h1>
              <p className="text-xs text-primary-foreground/70 hidden sm:block">Confirmed &amp; delivered</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/fests">
              <Button
                variant="outline"
                className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Manage Fests</span>
                <span className="sm:hidden">Fests</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={loadFests}
              className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 py-8 md:py-12 flex-1">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {loading ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            Loading fests...
          </div>
        ) : (
          <TransactionLogSection fests={fests.map(({ fest_id, legal_name }) => ({ fest_id, legal_name }))} />
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminProtect>
      <AdminPaymentsContent />
    </AdminProtect>
  );
}
