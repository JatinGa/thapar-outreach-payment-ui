import { AccommodationOption } from '@/lib/events';

export interface InitPaymentRequest {
  festId: string;
  eventId?: string | null;
  accommodation: Record<string, boolean>;
  food: boolean;
  accommodationOnly: boolean;
  coupon?: string | null;
}

export interface InitPaymentResponse {
  accessKey: string;
  env: 'test' | 'prod' | string;
  merchantOrderId: string;
  originalAmount: number;
  eventAmount: number;
  accommodationAmount: number;
  foodAmount: number;
  discountAmount: number;
  transactionFees: number;
  finalAmount: number;
  message: string;
}

async function ensurePaymentServiceReachable(baseUrl: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Payment backend health check failed (${response.status})`);
    }
  } catch {
    throw new Error('Payment service is unreachable. Start backend on http://localhost:8001 and try again.');
  } finally {
    clearTimeout(timeoutId);
  }
}

function getPaymentApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PAYMENT_API_BASE_URL || 'http://localhost:8001';
}

function getFestId(): string {
  return process.env.NEXT_PUBLIC_PAYMENT_FEST_ID || 'techfest2025';
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

export function buildInitPayload(option: AccommodationOption): InitPaymentRequest {
  const optionText = `${option.title} ${option.description}`.toLowerCase();
  const hasFood = option.icon === 'utensils' || optionText.includes('food') || optionText.includes('meal');

  return {
    festId: getFestId(),
    eventId: null,
    accommodation: {
      day1: true,
      day2: true,
      day3: true,
    },
    food: hasFood,
    accommodationOnly: true,
    coupon: null,
  };
}

export async function initPayment(payload: InitPaymentRequest): Promise<InitPaymentResponse> {
  const baseUrl = getPaymentApiBaseUrl();
  await ensurePaymentServiceReachable(baseUrl);

  try {
    const response = await fetch(`${baseUrl}/payment/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getOptionalAuthHeader(),
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = responseData?.detail || 'Payment initialization failed';
      throw new Error(detail);
    }

    return responseData as InitPaymentResponse;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Could not connect to payment service. Please verify backend URL/CORS and that backend is running.');
    }
    throw error;
  }
}

export function getEasebuzzCheckoutUrl(accessKey: string, env: string): string {
  const checkoutBase = env === 'prod'
    ? 'https://pay.easebuzz.in/pay/'
    : 'https://testpay.easebuzz.in/pay/';

  return `${checkoutBase}${accessKey}`;
}
