import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error('Missing NEXT_PUBLIC_BACKEND_URL in frontend .env.local');
  }
  return backendUrl;
}

function getAdminKey(): string {
  const key = process.env.ADMIN_API_KEY;
  if (!key) {
    throw new Error('Missing ADMIN_API_KEY in frontend .env.local');
  }
  return key;
}

function buildAdminHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Admin-Key': getAdminKey(),
  };
}

type PaymentIntentions = {
  eventRegistration?: {
    amount?: number;
  };
  accommodation?: {
    totalAmount?: number;
  };
  food?: {
    totalAmount?: number;
  };
};

type AdminTransaction = {
  status?: string;
  finalAmount?: number;
  paymentIntentions?: PaymentIntentions;
};

type TransactionsPageResponse = {
  transactions?: AdminTransaction[];
  total?: number;
  hasMore?: boolean;
};

async function fetchTransactionsPage(params: {
  festId: string;
  eventId?: string | null;
  status?: string;
  callbackStatus?: string;
  page: number;
  pageSize: number;
}) {
  const query = new URLSearchParams({
    festId: params.festId,
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  if (params.eventId) {
    query.set('eventId', params.eventId);
  }
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.callbackStatus) {
    query.set('callbackStatus', params.callbackStatus);
  }

  const response = await fetch(`${getBackendUrl()}/admin/transactions?${query.toString()}`, {
    method: 'GET',
    headers: buildAdminHeaders(),
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => ({}))) as TransactionsPageResponse & { detail?: string };
  if (!response.ok) {
    throw new Error(data.detail || `Failed to load transactions (${response.status})`);
  }

  return {
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    total: typeof data.total === 'number' ? data.total : 0,
    hasMore: Boolean(data.hasMore),
  };
}

async function fetchTotalCount(params: {
  festId: string;
  eventId?: string | null;
  status?: string;
  callbackStatus?: string;
}) {
  const firstPage = await fetchTransactionsPage({
    ...params,
    page: 1,
    pageSize: 1,
  });
  return firstPage.total;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

const SUCCESS_STATUSES = new Set(['SUCCESS', 'NOTIFIED_SUCCESS']);

function isSuccessfulStatus(status?: string): boolean {
  if (!status) return false;
  return SUCCESS_STATUSES.has(status.trim().toUpperCase());
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');

    const [totalTransactions, failedTransactions, pendingTransactions] = await Promise.all([
      fetchTotalCount({ festId, eventId }),
      fetchTotalCount({ festId, eventId, status: 'failed' }),
      fetchTotalCount({ festId, eventId, status: 'pending' }),
    ]);

    // Treat only callback-sent successful statuses as actually received.
    const receivedTx: AdminTransaction[] = [];
    let page = 1;
    const pageSize = 100;
    let successfulTransactions = 0;

    while (true) {
      const batch = await fetchTransactionsPage({
        festId,
        eventId,
        callbackStatus: 'sent',
        page,
        pageSize,
      });

      const successfulInBatch = batch.transactions.filter((tx) => isSuccessfulStatus(tx.status));
      successfulTransactions += successfulInBatch.length;
      receivedTx.push(...successfulInBatch);

      if (!batch.hasMore) {
        break;
      }
      page += 1;
    }

    const totalCollected = receivedTx.reduce((sum, tx) => sum + toNumber(tx.finalAmount), 0);
    const accommodationTotal = receivedTx.reduce(
      (sum, tx) => sum + toNumber(tx.paymentIntentions?.accommodation?.totalAmount),
      0
    );
    const foodTotal = receivedTx.reduce((sum, tx) => sum + toNumber(tx.paymentIntentions?.food?.totalAmount), 0);
    const eventTotal = receivedTx.reduce(
      (sum, tx) => sum + toNumber(tx.paymentIntentions?.eventRegistration?.amount),
      0
    );

    return NextResponse.json(
      {
        festId,
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        pendingTransactions,
        totalCollected,
        accommodationTotal,
        foodTotal,
        eventTotal,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    );
  }
}