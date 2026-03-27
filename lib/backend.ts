/**
 * Central Payment Portal API Client
 * Interfaces with the real backend at realbackend/central-payment-service
 */

export interface PricingConfig {
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
}

export interface Fest {
  fest_id: string;
  legal_name: string;
  event_dates?: string;
  short_description?: string;
  long_description?: string;
  pricing: PricingConfig;
  available_options?: string[];
  accommodation_per_day?: string;
  food_per_day?: string;
  bundled_price?: string;
}

export interface BookingDetail {
  accommodation_days: number;
  food_days: number;
  accommodation_amount: string;
  food_amount: string;
}

export interface PaymentInitiateRequest {
  fest_id: string;
  origin_user_id?: string;
  source?: 'fest_redirect' | 'direct_portal';
  user_name: string;
  user_state: string;
  user_district: string;
  booking: BookingDetail;
  coupon_code?: string | null;
}

export interface PaymentInitiateResponse {
  internal_tx_id: string;
  easebuzz_payment_url: string;
  txnid: string;
  key: string;
  hash: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  udf1: string;
  udf2: string;
  udf3: string;
  udf4: string;
  udf5: string;
  surl: string;
  furl: string;
}

export interface AdminFest {
  fest_id: string;
  legal_name: string;
  authorized_url: string;
  callback_url: string;
  pricing: PricingConfig;
  created_at: string;
}

export interface AdminFestCreateRequest {
  fest_id: string;
  legal_name: string;
  authorized_url: string;
  callback_url: string;
  pricing: PricingConfig;
}

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

function getAdminApiKey(): string {
  return process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';
}

function getAdminHeaders(): Record<string, string> {
  const apiKey = getAdminApiKey();
  if (!apiKey) {
    throw new Error('Missing NEXT_PUBLIC_ADMIN_API_KEY. Please set it in .env.local');
  }

  return {
    'Content-Type': 'application/json',
    'X-Admin-Key': apiKey,
  };
}

export async function fetchFests(): Promise<Fest[]> {
  const url = `${getBackendUrl()}/portal/fests`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch fests (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Could not fetch fests from backend'
    );
  }
}

export async function fetchFest(festId: string): Promise<Fest> {
  const url = `${getBackendUrl()}/portal/fests/${festId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Fest not found (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Could not fetch fest details');
  }
}

export async function initiatePayment(
  payload: PaymentInitiateRequest
): Promise<PaymentInitiateResponse> {
  const url = `${getBackendUrl()}/payment/initiate`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Payment initiation failed (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Could not connect to backend. Ensure backend is running on ' + getBackendUrl()
      );
    }
    throw error;
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  const url = `${getBackendUrl()}/health`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function listAdminFests(): Promise<AdminFest[]> {
  const url = `${getBackendUrl()}/admin/fests`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAdminHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to load admin fests (${response.status})`);
  }

  return await response.json();
}

export async function createAdminFest(payload: AdminFestCreateRequest): Promise<AdminFest> {
  const url = `${getBackendUrl()}/admin/fests`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create fest (${response.status})`);
  }

  return await response.json();
}
