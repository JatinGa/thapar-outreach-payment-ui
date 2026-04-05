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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;
    const response = await fetch(`${getBackendUrl()}/admin/fests/${encodeURIComponent(festId)}/events`, {
      method: 'GET',
      headers: buildAdminHeaders(),
      cache: 'no-store',
    });

    if (response.status === 404) {
      return NextResponse.json({ events: [], total: 0 }, { status: 200 });
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || `Failed to load events (${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    );
  }
}