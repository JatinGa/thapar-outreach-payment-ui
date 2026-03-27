'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft, Loader2, Pencil, Plus, Save, X, Trash2 } from 'lucide-react';
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

function AdminPageContent() {
  const [fests, setFests] = useState<AdminFest[]>([]);
  const [form, setForm] = useState<AdminFestCreateRequest>(INITIAL_FORM);
  const [editingFestId, setEditingFestId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AdminFestUpdateRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingFest, setSavingFest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [festsWithTransactions, setFestsWithTransactions] = useState<Set<string>>(new Set());
  const editSectionRef = useRef<HTMLElement | null>(null);

  const updatePricingMode = (
    target: 'create' | 'edit',
    mode: PricingConfig['mode']
  ) => {
    const basePricing: PricingConfig = {
      mode,
      gst_percent: target === 'create' ? form.pricing.gst_percent : (editForm?.pricing.gst_percent || '18.00'),
    };

    if (mode === 'fixed') {
      basePricing.food_price = target === 'create' ? (form.pricing.food_price || '0.00') : (editForm?.pricing.food_price || '0.00');
      basePricing.accommodation_price = target === 'create' ? (form.pricing.accommodation_price || '0.00') : (editForm?.pricing.accommodation_price || '0.00');
      basePricing.bundled_price = target === 'create' ? (form.pricing.bundled_price || '0.00') : (editForm?.pricing.bundled_price || '0.00');
    }
    if (mode === 'per_day') {
      basePricing.addon = {
        accommodation_per_day:
          target === 'create'
            ? (form.pricing.addon?.accommodation_per_day || '0.00')
            : (editForm?.pricing.addon?.accommodation_per_day || '0.00'),
        food_per_day:
          target === 'create'
            ? (form.pricing.addon?.food_per_day || '0.00')
            : (editForm?.pricing.addon?.food_per_day || '0.00'),
        bundled_discount_percent:
          target === 'create'
            ? (form.pricing.addon?.bundled_discount_percent || '0.00')
            : (editForm?.pricing.addon?.bundled_discount_percent || '0.00'),
      };
    }
    if (mode === 'bundled') {
      basePricing.addon = {
        accommodation_per_day:
          target === 'create'
            ? (form.pricing.addon?.accommodation_per_day || '0.00')
            : (editForm?.pricing.addon?.accommodation_per_day || '0.00'),
        food_per_day:
          target === 'create'
            ? (form.pricing.addon?.food_per_day || '0.00')
            : (editForm?.pricing.addon?.food_per_day || '0.00'),
        bundled_discount_percent:
          target === 'create'
            ? (form.pricing.addon?.bundled_discount_percent || '0.00')
            : (editForm?.pricing.addon?.bundled_discount_percent || '0.00'),
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
      if (!response.ok) {
        throw new Error(data.detail || `Failed to load fests (${response.status})`);
      }
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

  useEffect(() => {
    if (editingFestId && editForm) {
      editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingFestId]);

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
      if (!response.ok) {
        throw new Error(created.detail || `Failed to create fest (${response.status})`);
      }
      setSuccess(`Fest ${created.fest_id} created in MongoDB`);
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
    setEditForm({
      legal_name: fest.legal_name,
      event_dates: fest.event_dates || '',
      short_description: fest.short_description || '',
      long_description: fest.long_description || '',
      authorized_url: fest.authorized_url,
      callback_url: fest.callback_url,
      pricing: fest.pricing,
      available_options: fest.available_options || ['accommodation', 'food', 'bundled'],
    });
    setError(null);
    setSuccess(null);
  };

  const cancelEditFest = () => {
    setEditingFestId(null);
    setEditForm(null);
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
      if (!response.ok) {
        throw new Error(data.detail || `Failed to update fest (${response.status})`);
      }

      setSuccess(`Fest updated: ${data.fest_id}`);
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
      const response = await fetch(`/api/admin/fests/${encodeURIComponent(festId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to delete fest (${response.status})`);
      }

      setSuccess(`Fest ${festId} deleted successfully`);
      setDeleteConfirm(null);
      cancelEditFest();
      await loadFests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete fest');
    } finally {
      setDeleting(false);
    }
  };

  const checkFestTransactions = async (festIds: string[]) => {
    try {
      const response = await fetch('/api/admin/fests-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fest_ids: festIds }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.fests_with_transactions) {
        setFestsWithTransactions(new Set(data.fests_with_transactions));
      }
    } catch (e) {
      // Silently fail - transactions check is non-critical
    }
  };

  useEffect(() => {
    if (fests.length > 0) {
      checkFestTransactions(fests.map(f => f.fest_id));
    }
  }, [fests]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-primary/80 rounded-lg transition">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Portal (MongoDB)</h1>
          </div>
          <Button
            variant="outline"
            onClick={loadFests}
            className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
          >
            Refresh
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-md">
          <h2 className="text-xl font-semibold text-foreground mb-4">Create Fest</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This calls secure frontend API routes, which then call backend <span className="font-medium">/admin/fests</span> and store the fest in MongoDB.
          </p>

          <form onSubmit={handleCreateFest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Fest ID</label>
              <input
                value={form.fest_id}
                onChange={(e) => setForm((prev) => ({ ...prev, fest_id: e.target.value }))}
                placeholder="Helix_2026"
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Legal Name</label>
              <input
                value={form.legal_name}
                onChange={(e) => setForm((prev) => ({ ...prev, legal_name: e.target.value }))}
                placeholder="Helix - Thapar University"
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Event Dates</label>
              <input
                value={form.event_dates || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, event_dates: e.target.value }))}
                placeholder="17-19 April 2026"
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Short Description</label>
              <textarea
                value={form.short_description || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, short_description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Long Description</label>
              <textarea
                value={form.long_description || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, long_description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Authorized URL</label>
              <input
                value={form.authorized_url}
                onChange={(e) => setForm((prev) => ({ ...prev, authorized_url: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Callback URL</label>
              <input
                value={form.callback_url}
                onChange={(e) => setForm((prev) => ({ ...prev, callback_url: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pricing Mode</label>
              <select
                value={form.pricing.mode}
                onChange={(e) => updatePricingMode('create', e.target.value as PricingConfig['mode'])}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              >
                <option value="bundled">bundled</option>
                <option value="fixed">fixed</option>
                <option value="per_day">per_day</option>
              </select>
            </div>

            {form.pricing.mode !== 'bundled' && (
              <div>
                <label className="block text-sm font-medium mb-2">Available Accommodation Options</label>
                <div className="flex flex-wrap gap-2">
                  {['accommodation', 'food', 'bundled'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const newOptions = form.available_options.includes(option)
                          ? form.available_options.filter(o => o !== option)
                          : [...form.available_options, option];
                        setForm((prev) => ({ ...prev, available_options: newOptions }));
                      }}
                      className={`px-4 py-2 rounded-md border-2 font-medium transition-all ${
                        form.available_options.includes(option)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {option === 'accommodation' && 'Accommodation Only'}
                      {option === 'food' && 'Food Only'}
                      {option === 'bundled' && 'Accommodation + Food'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.pricing.mode === 'fixed' && (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Food Only Price</label>
                  <input
                    disabled={!form.available_options.includes('food')}
                    value={form.pricing.food_price || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, food_price: e.target.value },
                      }))
                    }
                    placeholder={form.available_options.includes('food') ? '0.00' : 'Not available'}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!form.available_options.includes('food') && (
                    <p className="text-xs text-muted-foreground mt-1">Enable "Food Only" option above to set price</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Accommodation Only Price</label>
                  <input
                    disabled={!form.available_options.includes('accommodation')}
                    value={form.pricing.accommodation_price || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, accommodation_price: e.target.value },
                      }))
                    }
                    placeholder={form.available_options.includes('accommodation') ? '0.00' : 'Not available'}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!form.available_options.includes('accommodation') && (
                    <p className="text-xs text-muted-foreground mt-1">Enable "Accommodation Only" option above to set price</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Accommodation + Food Price</label>
                  <input
                    disabled={!form.available_options.includes('bundled')}
                    value={form.pricing.bundled_price || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, bundled_price: e.target.value },
                      }))
                    }
                    placeholder={form.available_options.includes('bundled') ? '0.00' : 'Not available'}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!form.available_options.includes('bundled') && (
                    <p className="text-xs text-muted-foreground mt-1">Enable "Accommodation + Food" option above to set price</p>
                  )}
                </div>
              </div>
            )}

            {form.pricing.mode === 'per_day' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Accommodation / Day</label>
                  <input
                    disabled={!form.available_options.includes('accommodation')}
                    value={form.pricing.addon?.accommodation_per_day || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pricing: {
                          ...prev.pricing,
                          addon: {
                            accommodation_per_day: e.target.value,
                            food_per_day: prev.pricing.addon?.food_per_day || '0.00',
                            bundled_discount_percent:
                              prev.pricing.addon?.bundled_discount_percent || '0.00',
                          },
                        },
                      }))
                    }
                    placeholder={form.available_options.includes('accommodation') ? '0.00' : 'Not available'}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!form.available_options.includes('accommodation') && (
                    <p className="text-xs text-muted-foreground mt-1">Enable "Accommodation Only" option above to set price</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Food / Day</label>
                  <input
                    disabled={!form.available_options.includes('food')}
                    value={form.pricing.addon?.food_per_day || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pricing: {
                          ...prev.pricing,
                          addon: {
                            accommodation_per_day:
                              prev.pricing.addon?.accommodation_per_day || '0.00',
                            food_per_day: e.target.value,
                            bundled_discount_percent:
                              prev.pricing.addon?.bundled_discount_percent || '0.00',
                          },
                        },
                      }))
                    }
                    placeholder={form.available_options.includes('food') ? '0.00' : 'Not available'}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!form.available_options.includes('food') && (
                    <p className="text-xs text-muted-foreground mt-1">Enable "Food Only" option above to set price</p>
                  )}
                </div>
              </div>
            )}

            {form.pricing.mode === 'bundled' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Accommodation / Day</label>
                <input
                  value={form.pricing.addon?.accommodation_per_day || ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pricing: {
                        ...prev.pricing,
                        addon: {
                          accommodation_per_day: e.target.value,
                          food_per_day: prev.pricing.addon?.food_per_day || '0.00',
                          bundled_discount_percent:
                            prev.pricing.addon?.bundled_discount_percent || '0.00',
                        },
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Food / Day</label>
                <input
                  value={form.pricing.addon?.food_per_day || ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pricing: {
                        ...prev.pricing,
                        addon: {
                          accommodation_per_day:
                            prev.pricing.addon?.accommodation_per_day || '0.00',
                          food_per_day: e.target.value,
                          bundled_discount_percent:
                            prev.pricing.addon?.bundled_discount_percent || '0.00',
                        },
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
            </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.pricing.mode === 'bundled' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Bundle Discount %</label>
                  <input
                    value={form.pricing.addon?.bundled_discount_percent || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pricing: {
                          ...prev.pricing,
                          addon: {
                            accommodation_per_day:
                              prev.pricing.addon?.accommodation_per_day || '0.00',
                            food_per_day: prev.pricing.addon?.food_per_day || '0.00',
                            bundled_discount_percent: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-md border border-border bg-background"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">GST %</label>
                <input
                  value={form.pricing.gst_percent}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing, gst_percent: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {submitting ? 'Creating...' : 'Create Fest In MongoDB'}
            </Button>
          </form>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          {success && <p className="mt-4 text-sm text-green-600">{success}</p>}
        </section>

        <section className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-md">
          <h2 className="text-xl font-semibold text-foreground mb-4">Existing Fests (From MongoDB)</h2>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading fests...</p>
          ) : fests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fests found yet.</p>
          ) : (
            <div className="space-y-3">
              {fests.map((fest) => (
                <div key={fest.fest_id} className="border border-border rounded-md p-4">
                  <p className="font-semibold text-foreground">{fest.legal_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID: {fest.fest_id}</p>
                  <p className="text-xs text-muted-foreground mt-1">Dates: {fest.event_dates || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pricing Mode: {fest.pricing.mode}</p>
                  <p className="text-xs text-muted-foreground mt-1">GST: {fest.pricing.gst_percent}%</p>
                  <p className="text-xs text-muted-foreground mt-1 break-words">Short: {fest.short_description || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground mt-1 break-words">Long: {fest.long_description || 'N/A'}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => beginEditFest(fest)} className="gap-2">
                      <Pencil className="w-4 h-4" />
                      Edit Fest
                    </Button>
                    <AlertDialog open={deleteConfirm === fest.fest_id} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => setDeleteConfirm(fest.fest_id)} 
                        className="gap-2" 
                        disabled={deleting || festsWithTransactions.has(fest.fest_id)}
                        title={festsWithTransactions.has(fest.fest_id) ? 'Cannot delete fest with transactions' : ''}
                      >
                        {deleting && deleteConfirm === fest.fest_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Fest</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold">{fest.fest_id}</span>? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3 justify-end">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteFest(fest.fest_id)}>
                            Delete
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {editingFestId && editForm && (
          <section ref={editSectionRef} className="lg:col-span-2 bg-card border border-border rounded-lg p-6 md:p-8 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Edit Fest: {editingFestId}</h2>
              <Button variant="ghost" size="sm" onClick={cancelEditFest} className="gap-2">
                <X className="w-4 h-4" />
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Legal Name</label>
                <input
                  value={editForm.legal_name}
                  onChange={(e) => setEditForm({ ...editForm, legal_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Event Dates</label>
                <input
                  value={editForm.event_dates || ''}
                  onChange={(e) => setEditForm({ ...editForm, event_dates: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Short Description</label>
                <textarea
                  value={editForm.short_description || ''}
                  onChange={(e) => setEditForm({ ...editForm, short_description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Long Description</label>
                <textarea
                  value={editForm.long_description || ''}
                  onChange={(e) => setEditForm({ ...editForm, long_description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Authorized URL</label>
                <input
                  value={editForm.authorized_url}
                  onChange={(e) => setEditForm({ ...editForm, authorized_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Callback URL</label>
                <input
                  value={editForm.callback_url}
                  onChange={(e) => setEditForm({ ...editForm, callback_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Pricing Mode</label>
              <select
                value={editForm.pricing.mode}
                onChange={(e) => updatePricingMode('edit', e.target.value as PricingConfig['mode'])}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              >
                <option value="bundled">bundled</option>
                <option value="fixed">fixed</option>
                <option value="per_day">per_day</option>
              </select>
            </div>

            {editForm.pricing.mode !== 'bundled' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Available Accommodation Options</label>
                <div className="flex flex-wrap gap-2">
                  {['accommodation', 'food', 'bundled'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const newOptions = (editForm.available_options || []).includes(option)
                          ? (editForm.available_options || []).filter(o => o !== option)
                          : [...(editForm.available_options || []), option];
                        setEditForm((prev) => ({ ...prev, available_options: newOptions }));
                      }}
                      className={`px-4 py-2 rounded-md border-2 font-medium transition-all ${
                        (editForm.available_options || []).includes(option)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {option === 'accommodation' && 'Accommodation Only'}
                      {option === 'food' && 'Food Only'}
                      {option === 'bundled' && 'Accommodation + Food'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              {editForm.pricing.mode === 'fixed' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Food Only Price</label>
                    <input
                      disabled={!(editForm.available_options || []).includes('food')}
                      value={editForm.pricing.food_price || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          pricing: { ...editForm.pricing, food_price: e.target.value },
                        })
                      }
                      placeholder={(editForm.available_options || []).includes('food') ? '0.00' : 'Not available'}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {!(editForm.available_options || []).includes('food') && (
                      <p className="text-xs text-muted-foreground mt-1">Enable "Food Only" option above to set price</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Accommodation Only Price</label>
                    <input
                      disabled={!(editForm.available_options || []).includes('accommodation')}
                      value={editForm.pricing.accommodation_price || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          pricing: { ...editForm.pricing, accommodation_price: e.target.value },
                        })
                      }
                      placeholder={(editForm.available_options || []).includes('accommodation') ? '0.00' : 'Not available'}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {!(editForm.available_options || []).includes('accommodation') && (
                      <p className="text-xs text-muted-foreground mt-1">Enable "Accommodation Only" option above to set price</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Accommodation + Food Price</label>
                    <input
                      disabled={!(editForm.available_options || []).includes('bundled')}
                      value={editForm.pricing.bundled_price || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          pricing: { ...editForm.pricing, bundled_price: e.target.value },
                        })
                      }
                      placeholder={(editForm.available_options || []).includes('bundled') ? '0.00' : 'Not available'}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {!(editForm.available_options || []).includes('bundled') && (
                      <p className="text-xs text-muted-foreground mt-1">Enable "Accommodation + Food" option above to set price</p>
                    )}
                  </div>
                </>
              )}

              {editForm.pricing.mode === 'per_day' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Accommodation / Day</label>
                    <input
                      disabled={!(editForm.available_options || []).includes('accommodation')}
                      value={editForm.pricing.addon?.accommodation_per_day || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          pricing: {
                            ...editForm.pricing,
                            addon: {
                              accommodation_per_day: e.target.value,
                              food_per_day: editForm.pricing.addon?.food_per_day || '0.00',
                              bundled_discount_percent:
                                editForm.pricing.addon?.bundled_discount_percent || '0.00',
                            },
                          },
                        })
                      }
                      placeholder={(editForm.available_options || []).includes('accommodation') ? '0.00' : 'Not available'}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {!(editForm.available_options || []).includes('accommodation') && (
                      <p className="text-xs text-muted-foreground mt-1">Enable "Accommodation Only" option above to set price</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Food / Day</label>
                    <input
                      disabled={!(editForm.available_options || []).includes('food')}
                      value={editForm.pricing.addon?.food_per_day || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          pricing: {
                            ...editForm.pricing,
                            addon: {
                              accommodation_per_day:
                                editForm.pricing.addon?.accommodation_per_day || '0.00',
                              food_per_day: e.target.value,
                              bundled_discount_percent:
                                editForm.pricing.addon?.bundled_discount_percent || '0.00',
                            },
                          },
                        })
                      }
                      placeholder={(editForm.available_options || []).includes('food') ? '0.00' : 'Not available'}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {!(editForm.available_options || []).includes('food') && (
                      <p className="text-xs text-muted-foreground mt-1">Enable "Food Only" option above to set price</p>
                    )}
                  </div>
                </>
              )}

              {editForm.pricing.mode === 'bundled' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Accommodation / Day</label>
                    <input
                      value={editForm.pricing.addon?.accommodation_per_day || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          pricing: {
                            ...editForm.pricing,
                            addon: {
                              accommodation_per_day: e.target.value,
                              food_per_day: editForm.pricing.addon?.food_per_day || '0.00',
                              bundled_discount_percent:
                                editForm.pricing.addon?.bundled_discount_percent || '0.00',
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-md border border-border bg-background"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Food / Day</label>
                    <input
                      value={editForm.pricing.addon?.food_per_day || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          pricing: {
                            ...editForm.pricing,
                            addon: {
                              accommodation_per_day:
                                editForm.pricing.addon?.accommodation_per_day || '0.00',
                              food_per_day: e.target.value,
                              bundled_discount_percent:
                                editForm.pricing.addon?.bundled_discount_percent || '0.00',
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-md border border-border bg-background"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bundle Discount %</label>
                    <input
                      value={editForm.pricing.addon?.bundled_discount_percent || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          pricing: {
                            ...editForm.pricing,
                            addon: {
                              accommodation_per_day:
                                editForm.pricing.addon?.accommodation_per_day || '0.00',
                              food_per_day: editForm.pricing.addon?.food_per_day || '0.00',
                              bundled_discount_percent: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-md border border-border bg-background"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">GST %</label>
                <input
                  value={editForm.pricing.gst_percent}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      pricing: { ...editForm.pricing, gst_percent: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button onClick={handleSaveFest} disabled={savingFest} className="gap-2">
                {savingFest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingFest ? 'Saving...' : 'Save Fest'}
              </Button>
              <Button variant="outline" onClick={cancelEditFest}>Cancel</Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminProtect>
      <AdminPageContent />
    </AdminProtect>
  );
}
