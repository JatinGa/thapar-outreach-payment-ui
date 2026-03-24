'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface PaymentStatusResponse {
  status: 'pending' | 'success' | 'failed' | string;
  merchantOrderId: string;
  amount?: number;
  paymentType?: string;
  createdAt?: string;
  completedAt?: string;
  callbackStatus?: 'pending' | 'sent' | 'failed' | 'skipped' | string;
}

function getPaymentApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PAYMENT_API_BASE_URL || 'http://localhost:8001';
}

function getOptionalAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const token =
    window.localStorage.getItem('firebaseIdToken') ||
    window.localStorage.getItem('sessionToken') ||
    process.env.NEXT_PUBLIC_PAYMENT_AUTH_TOKEN;

  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
}

export default function TransactionStatusPage() {
  const params = useParams<{ merchantOrderId: string }>();
  const merchantOrderId = params?.merchantOrderId;

  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const shouldPoll = useMemo(() => {
    if (!data) return false;
    return data.status === 'pending' || data.callbackStatus === 'pending';
  }, [data]);

  useEffect(() => {
    if (!merchantOrderId) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`${getPaymentApiBaseUrl()}/payment/status/${merchantOrderId}`, {
          method: 'GET',
          headers: {
            ...getOptionalAuthHeader(),
          },
          credentials: 'include',
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body?.detail || 'Could not fetch payment status');
        }

        if (!cancelled) {
          setData(body as PaymentStatusResponse);
          setError(null);
          setLoading(false);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Could not fetch payment status');
          setLoading(false);
        }
      }
    };

    fetchStatus();

    intervalId = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [merchantOrderId]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-xl p-8 shadow-md">
        <h1 className="text-2xl font-bold text-foreground mb-2">Payment Status</h1>
        <p className="text-muted-foreground mb-6">Order: {merchantOrderId}</p>

        {loading ? (
          <p className="text-muted-foreground">Checking payment status...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <div className="space-y-2 text-sm mb-8">
            <p><span className="font-medium text-foreground">Status:</span> <span className="text-muted-foreground">{data?.status}</span></p>
            <p><span className="font-medium text-foreground">Amount:</span> <span className="text-muted-foreground">{data?.amount ?? '-'}</span></p>
            <p><span className="font-medium text-foreground">Payment Type:</span> <span className="text-muted-foreground">{data?.paymentType ?? '-'}</span></p>
            <p><span className="font-medium text-foreground">Callback:</span> <span className="text-muted-foreground">{data?.callbackStatus ?? '-'}</span></p>
            {shouldPoll && <p className="text-muted-foreground">Still processing. This page refreshes automatically.</p>}
          </div>
        )}

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
