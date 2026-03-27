import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

function getAdminApiKey(): string {
  const key = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_API_KEY;
  if (!key) {
    throw new Error('Missing ADMIN_API_KEY in frontend environment');
  }
  return key;
}

async function getAuthorizedUrlFromMongo(festId: string): Promise<string | null> {
  try {
    const response = await fetch(`${getBackendUrl()}/admin/fests/${encodeURIComponent(festId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': getAdminApiKey(),
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;

    const authorizedUrl = await getAuthorizedUrlFromMongo(festId);
    if (!authorizedUrl) {
      return NextResponse.json(
        { detail: `Authorized URL not found for fest '${festId}'` },
        { status: 404 }
      );
    }

    try {
      const target = new URL(authorizedUrl);
      return NextResponse.redirect(target.toString(), 307);
    } catch {
      return NextResponse.json(
        { detail: `Invalid authorized_url configured for fest '${festId}'` },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    );
  }
}
