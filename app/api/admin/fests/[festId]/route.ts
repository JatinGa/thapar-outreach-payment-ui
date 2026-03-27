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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;
    const payload = await request.json();

    const response = await fetch(`${getBackendUrl()}/admin/fests/${encodeURIComponent(festId)}`, {
      method: 'PATCH',
      headers: buildAdminHeaders(),
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || `Failed to update fest pricing (${response.status})` },
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;

    const response = await fetch(`${getBackendUrl()}/admin/fests/${encodeURIComponent(festId)}`, {
      method: 'DELETE',
      headers: buildAdminHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { detail: data.detail || `Failed to delete fest (${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: `Fest ${festId} deleted` }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    );
  }
}
