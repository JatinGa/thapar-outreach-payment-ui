import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

function getAdminApiKey(): string | null {
  return process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_API_KEY || null;
}

async function fetchAuthorizedUrlMap(): Promise<Record<string, string>> {
  const adminKey = getAdminApiKey();
  if (!adminKey) return {};

  try {
    const response = await fetch(`${getBackendUrl()}/admin/fests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
      },
      cache: 'no-store',
    });

    if (!response.ok) return {};
    const data = await response.json().catch(() => []);
    if (!Array.isArray(data)) return {};

    const entries = data
      .filter((fest) => typeof fest?.fest_id === 'string' && typeof fest?.authorized_url === 'string')
      .map((fest) => [fest.fest_id, fest.authorized_url] as const);

    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const [response, authorizedUrlMap] = await Promise.all([
      fetch(`${getBackendUrl()}/portal/fests`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
      fetchAuthorizedUrlMap(),
    ]);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || `Failed to fetch fests (${response.status})` },
        { status: response.status }
      );
    }

    const merged = Array.isArray(data)
      ? data.map((fest) => {
          if (typeof fest?.fest_id !== 'string') return fest;
          const authorized_url = fest.authorized_url || authorizedUrlMap[fest.fest_id];
          return authorized_url ? { ...fest, authorized_url } : fest;
        })
      : data;

    return NextResponse.json(merged, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    );
  }
}
