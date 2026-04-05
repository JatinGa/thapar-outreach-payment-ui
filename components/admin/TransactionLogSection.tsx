'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type AdminFestSummary = {
  fest_id: string;
  legal_name: string;
};

type AdminEventSummary = {
  eventId: string;
  name: string;
  isActive?: boolean;
  paymentRequired?: boolean;
  eventType?: string;
};

type PaymentIntentions = {
  eventRegistration?: {
    eventId?: string;
    eventType?: string;
    teamName?: string;
    teamId?: string;
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
  merchantOrderId: string;
  festId: string;
  eventId?: string;
  teamId?: string;
  teamName?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  collegeName?: string;
  paymentType?: string;
  status?: 'pending' | 'success' | 'failed' | string;
  callbackStatus?: 'pending' | 'sent' | 'failed' | 'skipped' | string;
  originalAmount?: number;
  finalAmount?: number;
  createdAt?: string;
  completedAt?: string;
  callbackAttempts?: number;
  callbackLastError?: string | null;
  paymentIntentions?: PaymentIntentions;
};

type TransactionStats = {
  festId: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalCollected: number;
  accommodationTotal: number;
  foodTotal: number;
  eventTotal: number;
};

type TransactionLogSectionProps = {
  fests: AdminFestSummary[];
};

function formatAmount(amount?: number) {
  if (typeof amount !== 'number') return '-';
  return `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function statusVariant(status?: string) {
  switch (status) {
    case 'success':
    case 'sent':
      return 'default' as const;
    case 'pending':
      return 'secondary' as const;
    case 'failed':
      return 'destructive' as const;
    case 'skipped':
      return 'outline' as const;
    default:
      return 'outline' as const;
  }
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export default function TransactionLogSection({ fests }: TransactionLogSectionProps) {
  const [selectedFestId, setSelectedFestId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCallbackStatus, setSelectedCallbackStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [events, setEvents] = useState<AdminEventSummary[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<AdminTransaction | null>(null);

  const selectedFest = useMemo(
    () => fests.find((fest) => fest.fest_id === selectedFestId) || null,
    [fests, selectedFestId]
  );

  const selectedEvent = useMemo(
    () => events.find((event) => event.eventId === selectedEventId) || null,
    [events, selectedEventId]
  );

  useEffect(() => {
    if (!selectedFestId && fests.length > 0) {
      setSelectedFestId(fests[0].fest_id);
    }
  }, [fests, selectedFestId]);

  useEffect(() => {
    if (!selectedFestId) {
      setEvents([]);
      return;
    }

    let cancelled = false;
    const loadEvents = async () => {
      setEventsLoading(true);
      try {
        const response = await fetch(`/api/admin/fests/${encodeURIComponent(selectedFestId)}/events`, {
          cache: 'no-store',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.detail || `Failed to load events (${response.status})`);
        }

        if (!cancelled) {
          setEvents(Array.isArray(data.events) ? data.events : []);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setEvents([]);
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load events');
        }
      } finally {
        if (!cancelled) {
          setEventsLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [selectedFestId]);

  useEffect(() => {
    if (!selectedFestId) {
      setTransactions([]);
      setStats(null);
      setTotal(0);
      setHasMore(false);
      return;
    }

    let cancelled = false;
    const loadLogs = async () => {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        festId: selectedFestId,
        page: String(page),
        pageSize: String(pageSize),
      });

      if (selectedEventId !== 'all') {
        query.set('eventId', selectedEventId);
      }
      if (selectedStatus !== 'all') {
        query.set('status', selectedStatus);
      }
      if (selectedCallbackStatus !== 'all') {
        query.set('callbackStatus', selectedCallbackStatus);
      }

      try {
        const [transactionsResponse, statsResponse] = await Promise.all([
          fetch(`/api/admin/transactions?${query.toString()}`, { cache: 'no-store' }),
          fetch(
            `/api/admin/transactions/stats/${encodeURIComponent(selectedFestId)}${
              selectedEventId !== 'all' ? `?eventId=${encodeURIComponent(selectedEventId)}` : ''
            }`,
            { cache: 'no-store' }
          ),
        ]);

        const transactionsData = await transactionsResponse.json().catch(() => ({}));
        const statsData = await statsResponse.json().catch(() => ({}));

        if (!transactionsResponse.ok) {
          throw new Error(transactionsData.detail || `Failed to load transactions (${transactionsResponse.status})`);
        }

        if (!statsResponse.ok) {
          throw new Error(statsData.detail || `Failed to load transaction stats (${statsResponse.status})`);
        }

        if (!cancelled) {
          setTransactions(Array.isArray(transactionsData.transactions) ? transactionsData.transactions : []);
          setStats(statsData as TransactionStats);
          setTotal(typeof transactionsData.total === 'number' ? transactionsData.total : 0);
          setHasMore(Boolean(transactionsData.hasMore));
        }
      } catch (fetchError) {
        if (!cancelled) {
          setTransactions([]);
          setStats(null);
          setTotal(0);
          setHasMore(false);
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load transaction logs');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      cancelled = true;
    };
  }, [selectedFestId, selectedEventId, selectedStatus, selectedCallbackStatus, page, pageSize]);

  const openTransaction = async (merchantOrderId: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/transactions/${encodeURIComponent(merchantOrderId)}`, {
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || `Failed to load transaction ${merchantOrderId}`);
      }

      setSelectedTransaction(data as AdminTransaction);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load transaction detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const retryCallback = async () => {
    if (!selectedTransaction) return;

    setRetrying(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/transactions/${encodeURIComponent(selectedTransaction.merchantOrderId)}/retry-callback`,
        { method: 'POST' }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || `Failed to retry callback (${response.status})`);
      }

      await openTransaction(selectedTransaction.merchantOrderId);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to retry callback');
    } finally {
      setRetrying(false);
    }
  };

  if (!fests.length) {
    return (
      <section className="lg:col-span-2 rounded-lg border border-border bg-card p-6 md:p-8 shadow-md">
        <h2 className="text-xl font-semibold text-foreground">Transaction Logs</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Create a fest first, then transaction logs will appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="lg:col-span-2 rounded-lg border border-border bg-card p-6 md:p-8 shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Transaction Logs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track payments by fest and event, including callback status and retry history.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Fest
            </label>
            <select
              value={selectedFestId}
              onChange={(event) => {
                setSelectedFestId(event.target.value);
                setSelectedEventId('all');
                setPage(1);
                setSelectedTransaction(null);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {fests.map((fest) => (
                <option key={fest.fest_id} value={fest.fest_id}>
                  {fest.legal_name} ({fest.fest_id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Event
            </label>
            <select
              value={selectedEventId}
              onChange={(event) => {
                setSelectedEventId(event.target.value);
                setPage(1);
                setSelectedTransaction(null);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              disabled={!selectedFestId || eventsLoading}
            >
              <option value="all">All events</option>
              {events.map((event) => (
                <option key={event.eventId} value={event.eventId}>
                  {event.name} ({event.eventId})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(event) => {
                setSelectedStatus(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Callback
            </label>
            <select
              value={selectedCallbackStatus}
              onChange={(event) => {
                setSelectedCallbackStatus(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Transactions"
          value={stats ? String(stats.totalTransactions) : '0'}
          helper={selectedEvent ? `${selectedEvent.name}` : selectedFest?.legal_name}
        />
        <StatCard label="Success" value={stats ? String(stats.successfulTransactions) : '0'} />
        <StatCard label="Failed" value={stats ? String(stats.failedTransactions) : '0'} />
        <StatCard label="Pending" value={stats ? String(stats.pendingTransactions) : '0'} />
        <StatCard label="Collected" value={stats ? formatAmount(stats.totalCollected) : '₹0'} />
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-xl border border-border bg-background/50">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Payment log</p>
              <p className="text-xs text-muted-foreground">
                {loading ? 'Loading...' : `${total} record${total === 1 ? '' : 's'} found`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Rows</label>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Student / Team</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Callback</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No transactions match the current filters.
                  </TableCell>
                </TableRow>
              ) : null}

              {transactions.map((transaction) => {
                const transactionEventId =
                  transaction.eventId || transaction.paymentIntentions?.eventRegistration?.eventId || '-';
                const eventLabel =
                  events.find((event) => event.eventId === transactionEventId)?.name || transactionEventId;
                const personLabel = transaction.teamName || transaction.userName || transaction.userEmail || '-';

                return (
                  <TableRow
                    key={transaction.merchantOrderId}
                    className={selectedTransaction?.merchantOrderId === transaction.merchantOrderId ? 'bg-muted/60' : ''}
                  >
                    <TableCell className="font-medium">{transaction.merchantOrderId}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{eventLabel}</span>
                        <span className="text-xs text-muted-foreground">{transactionEventId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{personLabel}</span>
                        <span className="text-xs text-muted-foreground">
                          {transaction.userPhone || transaction.collegeName || transaction.userEmail || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatAmount(transaction.finalAmount ?? transaction.originalAmount)}</span>
                        {transaction.originalAmount && transaction.finalAmount && transaction.originalAmount !== transaction.finalAmount ? (
                          <span className="text-xs text-muted-foreground">
                            Base {formatAmount(transaction.originalAmount)}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(transaction.status)}>{transaction.status || 'unknown'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(transaction.callbackStatus)}>
                        {transaction.callbackStatus || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          void openTransaction(transaction.merchantOrderId);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Loading transaction logs...
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing page {page} of {Math.max(1, Math.ceil(total / pageSize))}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={!hasMore || loading} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Transaction detail</p>
              <p className="text-xs text-muted-foreground">
                {selectedTransaction ? selectedTransaction.merchantOrderId : 'Select a row to inspect the log'}
              </p>
            </div>
            {detailLoading ? <span className="text-xs text-muted-foreground">Loading...</span> : null}
          </div>

          {selectedTransaction ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusVariant(selectedTransaction.status)}>{selectedTransaction.status || 'unknown'}</Badge>
                <Badge variant={statusVariant(selectedTransaction.callbackStatus)}>
                  callback {selectedTransaction.callbackStatus || 'unknown'}
                </Badge>
              </div>

              <div className="rounded-lg border border-border bg-background p-3 text-sm">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Order ID</p>
                    <p className="mt-1 break-all text-foreground">{selectedTransaction.merchantOrderId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Event</p>
                    <p className="mt-1 text-foreground">
                      {selectedTransaction.eventId || selectedTransaction.paymentIntentions?.eventRegistration?.eventId || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Participant</p>
                    <p className="mt-1 text-foreground">
                      {selectedTransaction.teamName || selectedTransaction.userName || selectedTransaction.userEmail || '-'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Final amount</p>
                      <p className="mt-1 text-foreground">{formatAmount(selectedTransaction.finalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Payment type</p>
                      <p className="mt-1 text-foreground">{selectedTransaction.paymentType || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Created</p>
                      <p className="mt-1 text-foreground">{formatDate(selectedTransaction.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Completed</p>
                      <p className="mt-1 text-foreground">{formatDate(selectedTransaction.completedAt)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Callback attempts</p>
                    <p className="mt-1 text-foreground">{selectedTransaction.callbackAttempts ?? 0}</p>
                  </div>
                  {selectedTransaction.callbackLastError ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Callback error</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-destructive">
                        {selectedTransaction.callbackLastError}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-3 text-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Payment split</p>
                <div className="mt-3 space-y-2 text-foreground">
                  <p>Event: {formatAmount(selectedTransaction.paymentIntentions?.eventRegistration?.amount)}</p>
                  <p>Accommodation: {formatAmount(selectedTransaction.paymentIntentions?.accommodation?.totalAmount)}</p>
                  <p>Food: {formatAmount(selectedTransaction.paymentIntentions?.food?.totalAmount)}</p>
                </div>
              </div>

              {selectedTransaction.status === 'success' && selectedTransaction.callbackStatus !== 'sent' ? (
                <Button
                  className="w-full"
                  onClick={() => void retryCallback()}
                  disabled={retrying}
                >
                  {retrying ? 'Retrying callback...' : 'Retry callback'}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              {selectedFest
                ? 'Click a transaction row to inspect its payment split, status, and callback history.'
                : 'Pick a fest to see transaction logs.'}
            </div>
          )}
        </aside>
      </div>

      {eventsLoading ? <p className="mt-4 text-xs text-muted-foreground">Loading event list...</p> : null}
    </section>
  );
}