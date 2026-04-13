'use client';

import { useEffect, useState } from 'react';
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
  events?: Array<{
    event_id: string;
    name: string;
  }>;
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
    days?: number;
  };
  food?: {
    totalAmount?: number;
    days?: number;
  };
};

type AdminTransaction = {
  merchantOrderId: string;
  easebuzzTxid?: string;
  festId: string;
  eventId?: string;
  teamId?: string;
  teamName?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userState?: string;
  userDistrict?: string;
  collegeName?: string;
  paymentType?: string;
  paymentMode?: string;
  selectedEvents?: string[];
  status?: 'pending' | 'success' | 'failed' | string;
  callbackStatus?: 'pending' | 'sent' | 'failed' | 'skipped' | string;
  originalAmount?: number;
  gstAmount?: number;
  easebuzzFee?: number;
  finalAmount?: number;
  couponDiscount?: number;
  couponCode?: string;
  createdAt?: string;
  completedAt?: string;
  callbackAttempts?: number;
  callbackLastError?: string | null;
  notificationLogs?: Array<{
    attempt: number;
    timestamp: string;
    http_status?: number;
    response_body?: string;
    error?: string;
  }>;
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

function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
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
  const [amountSort, setAmountSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<AdminTransaction | null>(null);

  const selectedFest = fests.find((f) => f.fest_id === selectedFestId) ?? null;
  const eventNameMap = new Map<string, string>();
  for (const fest of fests) {
    for (const ev of fest.events ?? []) {
      eventNameMap.set(ev.event_id, ev.name);
    }
  }

  const getEventLabel = (eventId: string): string => eventNameMap.get(eventId) ?? eventId;

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (amountSort === 'none') return 0;
    const aAmt = a.finalAmount ?? a.originalAmount ?? 0;
    const bAmt = b.finalAmount ?? b.originalAmount ?? 0;
    return amountSort === 'asc' ? aAmt - bAmt : bAmt - aAmt;
  });

  useEffect(() => {
    if (!selectedFestId && fests.length > 0) {
      setSelectedFestId(fests[0].fest_id);
    }
  }, [fests, selectedFestId]);

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
        status: 'success',
        callbackStatus: 'sent',
      });

      try {
        const [transactionsResponse, statsResponse] = await Promise.all([
          fetch(`/api/admin/transactions?${query.toString()}`, { cache: 'no-store' }),
          fetch(`/api/admin/transactions/stats/${encodeURIComponent(selectedFestId)}`, { cache: 'no-store' }),
        ]);

        const transactionsData = await transactionsResponse.json().catch(() => ({}));
        const statsData = await statsResponse.json().catch(() => ({}));

        if (!transactionsResponse.ok) {
          throw new Error(transactionsData.detail || `Failed to load transactions (${transactionsResponse.status})`);
        }
        if (!statsResponse.ok) {
          throw new Error(statsData.detail || `Failed to load stats (${statsResponse.status})`);
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
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load transactions');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLogs();
    return () => { cancelled = true; };
  }, [selectedFestId, page, pageSize]);

  const openTransaction = async (merchantOrderId: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/transactions/${encodeURIComponent(merchantOrderId)}`, {
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Failed to load transaction`);
      setSelectedTransaction(data as AdminTransaction);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load transaction detail');
    } finally {
      setDetailLoading(false);
    }
  };

  if (!fests.length) {
    return (
      <section className="rounded-lg border border-border bg-card p-6 md:p-8 shadow-md">
        <h2 className="text-xl font-semibold text-foreground">Payments</h2>
        <p className="mt-3 text-sm text-muted-foreground">No fests found. Add a fest first.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6 md:p-8 shadow-md">
      {/* Header + Fest selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Confirmed Payments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Showing successful payments with confirmed callbacks.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <label className="block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground mb-1">
            Fest
          </label>
          <select
            value={selectedFestId}
            onChange={(e) => {
              setSelectedFestId(e.target.value);
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
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total"
          value={stats ? String(stats.totalTransactions) : '0'}
          helper={selectedFest?.legal_name}
        />
        <StatCard label="Success" value={stats ? String(stats.successfulTransactions) : '0'} />
        <StatCard label="Failed" value={stats ? String(stats.failedTransactions) : '0'} />
        <StatCard label="Pending" value={stats ? String(stats.pendingTransactions) : '0'} />
        <StatCard label="Collected" value={stats ? formatAmount(stats.totalCollected) : '₹0'} />
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {/* Table + Detail */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <div className="rounded-xl border border-border bg-background/50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Payment log</p>
              <p className="text-xs text-muted-foreground">
                {loading ? 'Loading...' : `${total} confirmed payment${total === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Amount</label>
                <select
                  value={amountSort}
                  onChange={(e) => setAmountSort(e.target.value as 'none' | 'asc' | 'desc')}
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                >
                  <option value="none">Default</option>
                  <option value="asc">Low → High</option>
                  <option value="desc">High → Low</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Rows</label>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Student / Team</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No confirmed payments found for this fest.
                    </TableCell>
                  </TableRow>
                ) : null}

                {sortedTransactions.map((tx) => {
                  const fallbackEventId = tx.eventId || tx.paymentIntentions?.eventRegistration?.eventId || '';
                  const selectedEventIds = tx.selectedEvents ?? [];
                  const eventLabel =
                    selectedEventIds.length > 0
                      ? selectedEventIds.map(getEventLabel).join(', ')
                      : fallbackEventId
                        ? getEventLabel(fallbackEventId)
                        : '-';
                  const personLabel = tx.teamName || tx.userName || tx.userEmail || '-';

                  return (
                    <TableRow
                      key={tx.merchantOrderId}
                      className={selectedTransaction?.merchantOrderId === tx.merchantOrderId ? 'bg-muted/60' : ''}
                    >
                      <TableCell className="font-mono text-xs">{tx.merchantOrderId}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{eventLabel}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{personLabel}</span>
                          <span className="text-xs text-muted-foreground">
                            {tx.userPhone || tx.collegeName || tx.userEmail || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{formatAmount(tx.finalAmount ?? tx.originalAmount)}</span>
                        {tx.originalAmount && tx.finalAmount && tx.originalAmount !== tx.finalAmount ? (
                          <span className="block text-xs text-muted-foreground">Base {formatAmount(tx.originalAmount)}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(tx.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(tx);
                            void openTransaction(tx.merchantOrderId);
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
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={!hasMore || loading} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <aside className="rounded-xl border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Transaction detail</p>
              <p className="text-xs text-muted-foreground">
                {selectedTransaction ? selectedTransaction.merchantOrderId : 'Select a row to view details'}
              </p>
            </div>
            {detailLoading ? <span className="text-xs text-muted-foreground">Loading...</span> : null}
          </div>

          {selectedTransaction ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{selectedTransaction.status || 'success'}</Badge>
                {selectedTransaction.paymentMode && (
                  <Badge variant="outline">{selectedTransaction.paymentMode}</Badge>
                )}
              </div>

              {/* Order IDs */}
              <div className="rounded-lg border border-border bg-background p-3 text-sm space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Internal Order ID</p>
                  <p className="mt-1 break-all font-mono text-xs text-foreground">{selectedTransaction.merchantOrderId}</p>
                </div>
                {selectedTransaction.easebuzzTxid && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">EaseBuzz Txn ID</p>
                    <p className="mt-1 break-all font-mono text-xs text-foreground">{selectedTransaction.easebuzzTxid}</p>
                  </div>
                )}
              </div>

              {/* Participant */}
              <div className="rounded-lg border border-border bg-background p-3 text-sm space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Name</p>
                  <p className="mt-1 text-foreground">{selectedTransaction.userName || '-'}</p>
                </div>
                {selectedTransaction.userEmail && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</p>
                    <p className="mt-1 text-foreground">{selectedTransaction.userEmail}</p>
                  </div>
                )}
                {selectedTransaction.userPhone && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Phone</p>
                    <p className="mt-1 text-foreground">{selectedTransaction.userPhone}</p>
                  </div>
                )}
                {(selectedTransaction.userState || selectedTransaction.userDistrict) && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Location</p>
                    <p className="mt-1 text-foreground">
                      {[selectedTransaction.userDistrict, selectedTransaction.userState].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
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
              </div>

              {/* Selected Events */}
              {(selectedTransaction.selectedEvents?.length ?? 0) > 0 && (
                <div className="rounded-lg border border-border bg-background p-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-2">Selected Events</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTransaction.selectedEvents!.map((eid) => (
                      <span key={eid} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                        {getEventLabel(eid)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Financials */}
              <div className="rounded-lg border border-border bg-background p-3 text-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-3">Financials</p>
                <div className="space-y-1 text-foreground">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base amount</span>
                    <span>{formatAmount(selectedTransaction.originalAmount)}</span>
                  </div>
                  {(selectedTransaction.couponDiscount ?? 0) > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Coupon discount{selectedTransaction.couponCode ? ` (${selectedTransaction.couponCode})` : ''}</span>
                      <span>-{formatAmount(selectedTransaction.couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST</span>
                    <span>{formatAmount(selectedTransaction.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 mt-1 font-medium">
                    <span>Charged to user</span>
                    <span>{formatAmount(
                      (selectedTransaction.originalAmount ?? 0) -
                      (selectedTransaction.couponDiscount ?? 0) +
                      (selectedTransaction.gstAmount ?? 0)
                    )}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>EaseBuzz fee{selectedTransaction.paymentMode ? ` (${selectedTransaction.paymentMode})` : ''}</span>
                    <span>-{formatAmount(selectedTransaction.easebuzzFee)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1 mt-1">
                    <span>Net credited to fest</span>
                    <span>{formatAmount(selectedTransaction.finalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Booking split */}
              <div className="rounded-lg border border-border bg-background p-3 text-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-3">Booking split</p>
                <div className="space-y-1 text-foreground">
                  {(selectedTransaction.paymentIntentions?.accommodation?.totalAmount ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Accommodation{selectedTransaction.paymentIntentions?.accommodation?.days ? ` (${selectedTransaction.paymentIntentions.accommodation.days}d)` : ''}
                      </span>
                      <span>{formatAmount(selectedTransaction.paymentIntentions?.accommodation?.totalAmount)}</span>
                    </div>
                  )}
                  {(selectedTransaction.paymentIntentions?.food?.totalAmount ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Food{selectedTransaction.paymentIntentions?.food?.days ? ` (${selectedTransaction.paymentIntentions.food.days}d)` : ''}
                      </span>
                      <span>{formatAmount(selectedTransaction.paymentIntentions?.food?.totalAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-sm text-center text-muted-foreground">
              {selectedFest
                ? 'Click a transaction row to see details.'
                : 'Pick a fest to see payment logs.'}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
