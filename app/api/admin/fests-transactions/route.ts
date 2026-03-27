import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fest_ids } = body;

    if (!Array.isArray(fest_ids) || fest_ids.length === 0) {
      return NextResponse.json(
        { detail: 'fest_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    const response = await fetch(`${getBackendUrl()}/admin/fests/check-transactions`, {
      method: 'POST',
      headers: buildAdminHeaders(),
      body: JSON.stringify({ fest_ids }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || `Failed to check transactions (${response.status})` },
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
