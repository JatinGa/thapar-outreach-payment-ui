import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

function getMainWebsiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MAIN_WEBSITE_URL ||
    process.env.NEXT_PUBLIC_LOGIN_REDIRECT_URL ||
    'https://www.thapar.edu'
  );
}

function getFestIdFromEntries(entries: Array<[string, string]>): string | null {
  const festId = entries.find(([k]) => k === 'udf2')?.[1];
  return festId && festId.trim() ? festId.trim() : null;
}

function getFestRedirectRoute(request: NextRequest, festId: string): string {
  return new URL(`/api/portal/fests/${encodeURIComponent(festId)}/redirect`, request.url).toString();
}

function paymentSuccessRedirect(
  request: NextRequest,
  entries: Array<[string, string]>,
  redirectUrl?: string
): NextResponse {
  const festId = getFestIdFromEntries(entries);
  const festFallbackUrl = festId ? getFestRedirectRoute(request, festId) : undefined;
  // Fest-specific redirect must take priority when udf2 is present.
  const festAuthorizedUrl = festFallbackUrl || redirectUrl || getMainWebsiteUrl();
  return NextResponse.redirect(
    new URL(
      `/payment-success?redirect=${encodeURIComponent(festAuthorizedUrl)}`,
      request.url
    ),
    302
  );
}

async function forwardToBackendAndRedirect(
  request: NextRequest,
  entries: Array<[string, string]>
): Promise<NextResponse> {
  try {
    const formBody = new URLSearchParams(entries);
    const backendResponse = await fetch(`${getBackendUrl()}/webhook/easebuzz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
      cache: 'no-store',
    });

    const backendData = await backendResponse.json().catch(() => ({}));
    if (backendResponse.ok) {
      const backendAuthorizedUrl =
        typeof backendData.authorized_url === 'string' ? backendData.authorized_url : undefined;
      return paymentSuccessRedirect(request, entries, backendAuthorizedUrl);
    }

    return paymentSuccessRedirect(request, entries);
  } catch (error) {
    console.error('[Webhook] Error processing EaseBuzz callback:', error);
    return paymentSuccessRedirect(request, entries);
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const entries = Array.from(formData.entries()).map(([k, v]) => [k, String(v)] as [string, string]);
  return forwardToBackendAndRedirect(request, entries);
}

export async function GET(request: NextRequest) {
  const entries = Array.from(request.nextUrl.searchParams.entries());
  return forwardToBackendAndRedirect(request, entries);
}
