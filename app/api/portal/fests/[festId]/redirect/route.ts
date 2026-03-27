import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

function getFallbackRedirectUrl(): string {
  return process.env.NEXT_PUBLIC_LOGIN_REDIRECT_URL || 'https://accommodationstiet.shop';
}

function getAdminApiKey(): string | null {
  return process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_API_KEY || null;
}

async function getAuthorizedUrlFromMongo(festId: string): Promise<string | null> {
  const adminKey = getAdminApiKey();
  if (!adminKey) return null;

  try {
    const response = await fetch(`${getBackendUrl()}/admin/fests/${encodeURIComponent(festId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const data = await response.json().catch(() => ({}));
    return typeof data?.authorized_url === 'string' ? data.authorized_url : null;
  } catch {
    return null;
  }
}

async function getAuthorizedUrlFromPublicFest(festId: string): Promise<string | null> {
  try {
    const response = await fetch(`${getBackendUrl()}/portal/fests/${encodeURIComponent(festId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const data = await response.json().catch(() => ({}));
    return typeof data?.authorized_url === 'string' ? data.authorized_url : null;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;

    const authorizedUrl =
      (await getAuthorizedUrlFromMongo(festId)) ||
      (await getAuthorizedUrlFromPublicFest(festId)) ||
      getFallbackRedirectUrl();

    try {
      const target = new URL(authorizedUrl);
      return NextResponse.redirect(target.toString(), 307);
    } catch {
      return NextResponse.redirect(getFallbackRedirectUrl(), 307);
    }
  } catch (error) {
    return NextResponse.redirect(getFallbackRedirectUrl(), 307);
  }
}
