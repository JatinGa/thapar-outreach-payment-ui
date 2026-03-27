import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

function getAdminApiKey(): string | null {
  return process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_API_KEY || null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;

    const response = await fetch(`${getBackendUrl()}/portal/fests/${encodeURIComponent(festId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || `Fest not found (${response.status})` },
        { status: response.status }
      );
    }

    let enriched = data;
    if (!data?.authorized_url) {
      const adminKey = getAdminApiKey();
      if (adminKey) {
        const adminResp = await fetch(`${getBackendUrl()}/admin/fests/${encodeURIComponent(festId)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': adminKey,
          },
          cache: 'no-store',
        });
        if (adminResp.ok) {
          const adminFest = await adminResp.json().catch(() => ({}));
          if (typeof adminFest?.authorized_url === 'string') {
            enriched = { ...data, authorized_url: adminFest.authorized_url };
          }
        }
      }
    }

    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    );
  }
}
