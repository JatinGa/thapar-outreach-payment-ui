'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft, Loader2, Pencil, Plus, Save, X, Trash2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type PricingConfig = {
  mode: 'fixed' | 'per_day' | 'bundled';
  fixed_rate?: string;
  food_price?: string;
  accommodation_price?: string;
  bundled_price?: string;
  per_day_rate?: string;
  num_days?: number;
  addon?: {
    accommodation_per_day: string;
    food_per_day: string;
    bundled_discount_percent: string;
  };
  gst_percent: string;
};

type FestEvent = {
  event_id: string;
  name: string;
  description?: string;
};

type EventSelectionConfig = {
  enabled: boolean;
  required: boolean;
  max_selections: number;
};

type AdminFest = {
  fest_id: string;
  legal_name: string;
  event_dates?: string;
  short_description?: string;
  long_description?: string;
  authorized_url: string;
  callback_url: string;
  pricing: PricingConfig;
  available_options: string[];
  events: FestEvent[];
  event_selection: EventSelectionConfig;
  created_at: string;
};

type AdminFestCreateRequest = {
  fest_id: string;
  legal_name: string;
  event_dates?: string;
  short_description?: string;
  long_description?: string;
  authorized_url: string;
  callback_url: string;
  pricing: PricingConfig;
  available_options: string[];
};

type AdminFestUpdateRequest = {
  legal_name: string;
  event_dates?: string;
  short_description?: string;
  long_description?: string;
  authorized_url: string;
  callback_url: string;
  pricing: PricingConfig;
  available_options?: string[];
  event_selection?: EventSelectionConfig;
};

const AdminProtect = dynamic(() => import('@/components/admin/AdminProtect'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  ),
});

const INITIAL_FORM: AdminFestCreateRequest = {
  fest_id: '',
  legal_name: '',
  event_dates: '',
  short_description: '',
  long_description: '',
  authorized_url: 'http://localhost:3000',
  callback_url: 'http://localhost:8000/webhook/easebuzz',
  pricing: {
    mode: 'bundled',
    gst_percent: '18.00',
    addon: {
      accommodation_per_day: '500.00',
      food_per_day: '200.00',
      bundled_discount_percent: '5.00',
    },
  },
  available_options: ['accommodation', 'food', 'bundled'],
};

function inputClass(disabled?: boolean) {
  return `w-full px-3 py-2 rounded-md border border-border bg-background text-sm${disabled ? ' opacity-50 cursor-not-allowed' : ''}`;
}

function AdminFestsContent() {
  const [fests, setFests] = useState<AdminFest[]>([]);
  const [form, setForm] = useState<AdminFestCreateRequest>(INITIAL_FORM);
  const [editingFestId, setEditingFestId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AdminFestUpdateRequest | null>(null);
  const [editingFest, setEditingFest] = useState<AdminFest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingFest, setSavingFest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [festsWithTransactions, setFestsWithTransactions] = useState<Set<string>>(new Set());
  const editSectionRef = useRef<HTMLElement | null>(null);

  // Event management state
  const [newEventName, setNewEventName] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [addingEvent, setAddingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const updatePricingMode = (target: 'create' | 'edit', mode: PricingConfig['mode']) => {
    const basePricing: PricingConfig = {
      mode,
      gst_percent: target === 'create' ? form.pricing.gst_percent : (editForm?.pricing.gst_percent || '18.00'),
    };

    if (mode === 'fixed') {
      basePricing.food_price = target === 'create' ? (form.pricing.food_price || '0.00') : (editForm?.pricing.food_price || '0.00');
      basePricing.accommodation_price = target === 'create' ? (form.pricing.accommodation_price || '0.00') : (editForm?.pricing.accommodation_price || '0.00');
      basePricing.bundled_price = target === 'create' ? (form.pricing.bundled_price || '0.00') : (editForm?.pricing.bundled_price || '0.00');
    }
    if (mode === 'per_day' || mode === 'bundled') {
      basePricing.addon = {
        accommodation_per_day: target === 'create' ? (form.pricing.addon?.accommodation_per_day || '0.00') : (editForm?.pricing.addon?.accommodation_per_day || '0.00'),
        food_per_day: target === 'create' ? (form.pricing.addon?.food_per_day || '0.00') : (editForm?.pricing.addon?.food_per_day || '0.00'),
        bundled_discount_percent: target === 'create' ? (form.pricing.addon?.bundled_discount_percent || '0.00') : (editForm?.pricing.addon?.bundled_discount_percent || '0.00'),
      };
    }

    if (target === 'create') {
      setForm((prev) => ({ ...prev, pricing: basePricing }));
    } else if (editForm) {
      setEditForm({ ...editForm, pricing: basePricing });
    }
  };

  const loadFests = async () => {
    setError(null);
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

  useEffect(() => { loadFests(); }, []);

  useEffect(() => {
    if (editingFestId && editForm) {
      editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingFestId]);

  // Keep editingFest in sync with the fests list (e.g. after adding an event)
  useEffect(() => {
    if (editingFestId) {
      const fresh = fests.find((f) => f.fest_id === editingFestId) ?? null;
      setEditingFest(fresh);
    }
  }, [fests, editingFestId]);

  const handleCreateFest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.fest_id.trim() || !form.legal_name.trim()) {
      setError('Fest ID and legal name are required');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/fests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const created = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(created.detail || `Failed to create fest (${response.status})`);
      setSuccess(`Fest "${created.fest_id}" created successfully.`);
      setForm(INITIAL_FORM);
      await loadFests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create fest');
    } finally {
      setSubmitting(false);
    }
  };

  const beginEditFest = (fest: AdminFest) => {
    setEditingFestId(fest.fest_id);
    setEditingFest(fest);
    setEditForm({
      legal_name: fest.legal_name,
      event_dates: fest.event_dates || '',
      short_description: fest.short_description || '',
      long_description: fest.long_description || '',
      authorized_url: fest.authorized_url,
      callback_url: fest.callback_url,
      pricing: fest.pricing,
      available_options: fest.available_options || ['accommodation', 'food', 'bundled'],
      event_selection: fest.event_selection || { enabled: false, required: false, max_selections: 1 },
    });
    setNewEventName('');
    setNewEventDesc('');
    setError(null);
    setSuccess(null);
  };

  const cancelEditFest = () => {
    setEditingFestId(null);
    setEditForm(null);
    setEditingFest(null);
  };

  const handleSaveFest = async () => {
    if (!editingFestId || !editForm) return;
    setSavingFest(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/fests/${encodeURIComponent(editingFestId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Failed to update fest (${response.status})`);
      setSuccess(`Fest "${data.fest_id}" updated successfully.`);
      cancelEditFest();
      await loadFests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update fest');
    } finally {
      setSavingFest(false);
    }
  };

  const handleDeleteFest = async (festId: string) => {
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/fests/${encodeURIComponent(festId)}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to delete fest (${response.status})`);
      }
      setSuccess(`Fest "${festId}" deleted.`);
      setDeleteConfirm(null);
      cancelEditFest();
      await loadFests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete fest');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddEvent = async () => {
    if (!editingFestId || !newEventName.trim()) return;
    setAddingEvent(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/fests/${encodeURIComponent(editingFestId)}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEventName.trim(), description: newEventDesc.trim() || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Failed to add event (${response.status})`);
      setNewEventName('');
      setNewEventDesc('');
      await loadFests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add event');
    } finally {
      setAddingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!editingFestId) return;
    setDeletingEventId(eventId);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/fests/${encodeURIComponent(editingFestId)}/events/${encodeURIComponent(eventId)}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Failed to delete event (${response.status})`);
      await loadFests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete event');
    } finally {
      setDeletingEventId(null);
    }
  };

  useEffect(() => {
    if (fests.length === 0) return;
    const check = async () => {
      try {
        const response = await fetch('/api/admin/fests-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fest_ids: fests.map((f) => f.fest_id) }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.fests_with_transactions) {
          setFestsWithTransactions(new Set(data.fests_with_transactions));
        }
      } catch {
        // non-critical
      }
    };
    check();
  }, [fests]);

  const OptionToggle = ({
    option,
    options,
    setOptions,
  }: {
    option: string;
    options: string[];
    setOptions: (opts: string[]) => void;
  }) => {
    const active = options.includes(option);
    const label = option === 'accommodation' ? 'Accommodation Only' : option === 'food' ? 'Food Only' : 'Accommodation + Food';
    return (
      <button
        type="button"
        onClick={() => setOptions(active ? options.filter((o) => o !== option) : [...options, option])}
        className={`px-4 py-2 rounded-md border-2 text-sm font-medium transition-all ${
          active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/50'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-primary/80 rounded-lg transition">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold leading-tight">Manage Fests</h1>
              <p className="text-xs text-primary-foreground/70 hidden sm:block">Create, edit &amp; delete fests</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button
                variant="outline"
                className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">View Payments</span>
                <span className="sm:hidden">Payments</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={loadFests}
              className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Refresh
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
        {success && (
          <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Fest */}
          <section className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-md">
            <h2 className="text-xl font-semibold text-foreground mb-1">Create Fest</h2>
            <p className="text-sm text-muted-foreground mb-6">Add a new fest to the system.</p>

            <form onSubmit={handleCreateFest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fest ID</label>
                <input
                  value={form.fest_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, fest_id: e.target.value }))}
                  placeholder="Helix_2026"
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Legal Name</label>
                <input
                  value={form.legal_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, legal_name: e.target.value }))}
                  placeholder="Helix - Thapar University"
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Event Dates</label>
                <input
                  value={form.event_dates || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, event_dates: e.target.value }))}
                  placeholder="17-19 April 2026"
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short Description</label>
                <textarea
                  value={form.short_description || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, short_description: e.target.value }))}
                  rows={2}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Long Description</label>
                <textarea
                  value={form.long_description || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, long_description: e.target.value }))}
                  rows={3}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Authorized URL</label>
                <input
                  value={form.authorized_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, authorized_url: e.target.value }))}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Callback URL</label>
                <input
                  value={form.callback_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, callback_url: e.target.value }))}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pricing Mode</label>
                <select
                  value={form.pricing.mode}
                  onChange={(e) => updatePricingMode('create', e.target.value as PricingConfig['mode'])}
                  className={inputClass()}
                >
                  <option value="bundled">Bundled</option>
                  <option value="fixed">Fixed</option>
                  <option value="per_day">Per Day</option>
                </select>
              </div>

              {form.pricing.mode !== 'bundled' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Available Options</label>
                  <div className="flex flex-wrap gap-2">
                    {['accommodation', 'food', 'bundled'].map((option) => (
                      <OptionToggle
                        key={option}
                        option={option}
                        options={form.available_options}
                        setOptions={(opts) => setForm((prev) => ({ ...prev, available_options: opts }))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {form.pricing.mode === 'fixed' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Food Only Price</label>
                    <input
                      disabled={!form.available_options.includes('food')}
                      value={form.pricing.food_price || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, pricing: { ...prev.pricing, food_price: e.target.value } }))}
                      placeholder={form.available_options.includes('food') ? '0.00' : 'Not available'}
                      className={inputClass(!form.available_options.includes('food'))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Accommodation Only Price</label>
                    <input
                      disabled={!form.available_options.includes('accommodation')}
                      value={form.pricing.accommodation_price || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, pricing: { ...prev.pricing, accommodation_price: e.target.value } }))}
                      placeholder={form.available_options.includes('accommodation') ? '0.00' : 'Not available'}
                      className={inputClass(!form.available_options.includes('accommodation'))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Accommodation + Food Price</label>
                    <input
                      disabled={!form.available_options.includes('bundled')}
                      value={form.pricing.bundled_price || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, pricing: { ...prev.pricing, bundled_price: e.target.value } }))}
                      placeholder={form.available_options.includes('bundled') ? '0.00' : 'Not available'}
                      className={inputClass(!form.available_options.includes('bundled'))}
                    />
                  </div>
                </div>
              )}

              {(form.pricing.mode === 'per_day' || form.pricing.mode === 'bundled') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Accommodation / Day</label>
                    <input
                      disabled={form.pricing.mode === 'per_day' && !form.available_options.includes('accommodation')}
                      value={form.pricing.addon?.accommodation_per_day || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            addon: { accommodation_per_day: e.target.value, food_per_day: prev.pricing.addon?.food_per_day || '0.00', bundled_discount_percent: prev.pricing.addon?.bundled_discount_percent || '0.00' },
                          },
                        }))
                      }
                      className={inputClass(form.pricing.mode === 'per_day' && !form.available_options.includes('accommodation'))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Food / Day</label>
                    <input
                      disabled={form.pricing.mode === 'per_day' && !form.available_options.includes('food')}
                      value={form.pricing.addon?.food_per_day || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            addon: { accommodation_per_day: prev.pricing.addon?.accommodation_per_day || '0.00', food_per_day: e.target.value, bundled_discount_percent: prev.pricing.addon?.bundled_discount_percent || '0.00' },
                          },
                        }))
                      }
                      className={inputClass(form.pricing.mode === 'per_day' && !form.available_options.includes('food'))}
                    />
                  </div>
                  {form.pricing.mode === 'bundled' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Bundle Discount %</label>
                      <input
                        value={form.pricing.addon?.bundled_discount_percent || ''}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              addon: { accommodation_per_day: prev.pricing.addon?.accommodation_per_day || '0.00', food_per_day: prev.pricing.addon?.food_per_day || '0.00', bundled_discount_percent: e.target.value },
                            },
                          }))
                        }
                        className={inputClass()}
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">GST %</label>
                <input
                  value={form.pricing.gst_percent}
                  onChange={(e) => setForm((prev) => ({ ...prev, pricing: { ...prev.pricing, gst_percent: e.target.value } }))}
                  className={inputClass()}
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? 'Creating...' : 'Create Fest'}
              </Button>
            </form>
          </section>

          {/* Existing Fests */}
          <section className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-md">
            <h2 className="text-xl font-semibold text-foreground mb-1">Existing Fests</h2>
            <p className="text-sm text-muted-foreground mb-6">{fests.length} fest{fests.length !== 1 ? 's' : ''} configured.</p>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : fests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fests yet. Create one to get started.</p>
            ) : (
              <div className="space-y-3">
                {fests.map((fest) => (
                  <div key={fest.fest_id} className="border border-border rounded-lg p-4">
                    <p className="font-semibold text-foreground">{fest.legal_name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>ID: {fest.fest_id}</span>
                      {fest.event_dates && <span>Dates: {fest.event_dates}</span>}
                      <span>Pricing: {fest.pricing.mode}</span>
                      <span>GST: {fest.pricing.gst_percent}%</span>
                      {fest.events?.length > 0 && <span>{fest.events.length} event{fest.events.length !== 1 ? 's' : ''}</span>}
                      {fest.event_selection?.enabled && (
                        <span className="text-primary">
                          Events: {fest.event_selection.required ? 'required' : 'optional'}, max {fest.event_selection.max_selections}
                        </span>
                      )}
                    </div>
                    {fest.short_description && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{fest.short_description}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => beginEditFest(fest)} className="gap-1.5">
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                      <AlertDialog open={deleteConfirm === fest.fest_id} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteConfirm(fest.fest_id)}
                          className="gap-1.5"
                          disabled={deleting || festsWithTransactions.has(fest.fest_id)}
                          title={festsWithTransactions.has(fest.fest_id) ? 'Cannot delete a fest with transactions' : ''}
                        >
                          {deleting && deleteConfirm === fest.fest_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </Button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Fest</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <span className="font-semibold">{fest.fest_id}</span>? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex gap-3 justify-end">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteFest(fest.fest_id)}>Delete</AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Edit Fest */}
        {editingFestId && editForm && (
          <section ref={editSectionRef} className="mt-8 bg-card border border-border rounded-lg p-6 md:p-8 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Edit Fest</h2>
                <p className="text-sm text-muted-foreground">{editingFestId}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={cancelEditFest} className="gap-2">
                <X className="w-4 h-4" />
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Legal Name</label>
                <input value={editForm.legal_name} onChange={(e) => setEditForm({ ...editForm, legal_name: e.target.value })} className={inputClass()} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Event Dates</label>
                <input value={editForm.event_dates || ''} onChange={(e) => setEditForm({ ...editForm, event_dates: e.target.value })} className={inputClass()} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Short Description</label>
                <textarea value={editForm.short_description || ''} onChange={(e) => setEditForm({ ...editForm, short_description: e.target.value })} rows={2} className={inputClass()} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Long Description</label>
                <textarea value={editForm.long_description || ''} onChange={(e) => setEditForm({ ...editForm, long_description: e.target.value })} rows={3} className={inputClass()} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Authorized URL</label>
                <input value={editForm.authorized_url} onChange={(e) => setEditForm({ ...editForm, authorized_url: e.target.value })} className={inputClass()} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Callback URL</label>
                <input value={editForm.callback_url} onChange={(e) => setEditForm({ ...editForm, callback_url: e.target.value })} className={inputClass()} />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Pricing Mode</label>
              <select value={editForm.pricing.mode} onChange={(e) => updatePricingMode('edit', e.target.value as PricingConfig['mode'])} className={inputClass()}>
                <option value="bundled">Bundled</option>
                <option value="fixed">Fixed</option>
                <option value="per_day">Per Day</option>
              </select>
            </div>

            {editForm.pricing.mode !== 'bundled' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Available Options</label>
                <div className="flex flex-wrap gap-2">
                  {['accommodation', 'food', 'bundled'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        const curr = editForm.available_options || [];
                        const next = curr.includes(option) ? curr.filter((o) => o !== option) : [...curr, option];
                        setEditForm((prev) => prev ? { ...prev, available_options: next } : prev);
                      }}
                      className={`px-4 py-2 rounded-md border-2 text-sm font-medium transition-all ${
                        (editForm.available_options || []).includes(option)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {option === 'accommodation' ? 'Accommodation Only' : option === 'food' ? 'Food Only' : 'Accommodation + Food'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {editForm.pricing.mode === 'fixed' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Food Only Price</label>
                    <input disabled={!(editForm.available_options || []).includes('food')} value={editForm.pricing.food_price || ''} onChange={(e) => setEditForm({ ...editForm, pricing: { ...editForm.pricing, food_price: e.target.value } })} className={inputClass(!(editForm.available_options || []).includes('food'))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Accommodation Only Price</label>
                    <input disabled={!(editForm.available_options || []).includes('accommodation')} value={editForm.pricing.accommodation_price || ''} onChange={(e) => setEditForm({ ...editForm, pricing: { ...editForm.pricing, accommodation_price: e.target.value } })} className={inputClass(!(editForm.available_options || []).includes('accommodation'))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Accommodation + Food Price</label>
                    <input disabled={!(editForm.available_options || []).includes('bundled')} value={editForm.pricing.bundled_price || ''} onChange={(e) => setEditForm({ ...editForm, pricing: { ...editForm.pricing, bundled_price: e.target.value } })} className={inputClass(!(editForm.available_options || []).includes('bundled'))} />
                  </div>
                </>
              )}

              {(editForm.pricing.mode === 'per_day' || editForm.pricing.mode === 'bundled') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Accommodation / Day</label>
                    <input
                      disabled={editForm.pricing.mode === 'per_day' && !(editForm.available_options || []).includes('accommodation')}
                      value={editForm.pricing.addon?.accommodation_per_day || ''}
                      onChange={(e) => setEditForm({ ...editForm, pricing: { ...editForm.pricing, addon: { accommodation_per_day: e.target.value, food_per_day: editForm.pricing.addon?.food_per_day || '0.00', bundled_discount_percent: editForm.pricing.addon?.bundled_discount_percent || '0.00' } } })}
                      className={inputClass(editForm.pricing.mode === 'per_day' && !(editForm.available_options || []).includes('accommodation'))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Food / Day</label>
                    <input
                      disabled={editForm.pricing.mode === 'per_day' && !(editForm.available_options || []).includes('food')}
                      value={editForm.pricing.addon?.food_per_day || ''}
                      onChange={(e) => setEditForm({ ...editForm, pricing: { ...editForm.pricing, addon: { accommodation_per_day: editForm.pricing.addon?.accommodation_per_day || '0.00', food_per_day: e.target.value, bundled_discount_percent: editForm.pricing.addon?.bundled_discount_percent || '0.00' } } })}
                      className={inputClass(editForm.pricing.mode === 'per_day' && !(editForm.available_options || []).includes('food'))}
                    />
                  </div>
                  {editForm.pricing.mode === 'bundled' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Bundle Discount %</label>
                      <input
                        value={editForm.pricing.addon?.bundled_discount_percent || ''}
                        onChange={(e) => setEditForm({ ...editForm, pricing: { ...editForm.pricing, addon: { accommodation_per_day: editForm.pricing.addon?.accommodation_per_day || '0.00', food_per_day: editForm.pricing.addon?.food_per_day || '0.00', bundled_discount_percent: e.target.value } } })}
                        className={inputClass()}
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">GST %</label>
                <input
                  value={editForm.pricing.gst_percent}
                  onChange={(e) => setEditForm({ ...editForm, pricing: { ...editForm.pricing, gst_percent: e.target.value } })}
                  className={inputClass()}
                />
              </div>
            </div>

            {/* ── Event Selection Config ── */}
            <div className="mt-6 mb-4 border-t border-border pt-6">
              <h3 className="text-base font-semibold text-foreground mb-1">Event Selection</h3>
              <p className="text-xs text-muted-foreground mb-4">
                When enabled, users will see a list of events to select from during payment.
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-primary"
                    checked={editForm.event_selection?.enabled ?? false}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, event_selection: { ...((prev.event_selection) || { required: false, max_selections: 1 }), enabled: e.target.checked } }
                          : prev
                      )
                    }
                  />
                  <span className="text-sm font-medium text-foreground">Enable event selection</span>
                </label>
                {editForm.event_selection?.enabled && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer ml-7">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-primary"
                        checked={editForm.event_selection?.required ?? false}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, event_selection: { ...(prev.event_selection!), required: e.target.checked } }
                              : prev
                          )
                        }
                      />
                      <span className="text-sm text-foreground">Make selection required</span>
                    </label>
                    <div className="ml-7 flex items-center gap-3">
                      <label className="text-sm text-foreground whitespace-nowrap">Max events per person:</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editForm.event_selection?.max_selections ?? 1}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, event_selection: { ...(prev.event_selection!), max_selections: Number(e.target.value) || 1 } }
                              : prev
                          )
                        }
                        className="w-20 px-3 py-1.5 rounded-md border border-border bg-background text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Events List & Management ── */}
            <div className="mt-4 mb-6 border-t border-border pt-6">
              <h3 className="text-base font-semibold text-foreground mb-1">Events</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Add events that attendees can select from during payment.
              </p>

              {/* Existing events */}
              {(editingFest?.events?.length ?? 0) > 0 ? (
                <div className="space-y-2 mb-4">
                  {editingFest!.events.map((ev) => (
                    <div
                      key={ev.event_id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3 bg-background"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{ev.name}</p>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                        )}
                        <p className="text-[10px] font-mono text-muted-foreground mt-1">{ev.event_id}</p>
                      </div>
                      <button
                        type="button"
                        disabled={deletingEventId === ev.event_id}
                        onClick={() => handleDeleteEvent(ev.event_id)}
                        className="flex-shrink-0 p-1.5 rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                        title="Delete event"
                      >
                        {deletingEventId === ev.event_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">No events yet. Add one below.</p>
              )}

              {/* Add event form */}
              <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Event</p>
                <div>
                  <label className="block text-xs font-medium mb-1">Event Name *</label>
                  <input
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    placeholder="e.g. DJ Night, Coding Contest"
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Description (optional)</label>
                  <input
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                    placeholder="Short description of the event"
                    className={inputClass()}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddEvent}
                  disabled={addingEvent || !newEventName.trim()}
                  className="gap-2"
                >
                  {addingEvent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {addingEvent ? 'Adding...' : 'Add Event'}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-border pt-6">
              <Button onClick={handleSaveFest} disabled={savingFest} className="gap-2">
                {savingFest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingFest ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={cancelEditFest}>Cancel</Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function AdminFestsPage() {
  return (
    <AdminProtect>
      <AdminFestsContent />
    </AdminProtect>
  );
}
