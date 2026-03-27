import { NextResponse } from 'next/server';

function getAdminPortalPassword(): string {
  const password = process.env.ADMIN_PORTAL_PASSWORD || process.env.ADMIN_API_KEY;
  if (!password) {
    throw new Error('Missing ADMIN_PORTAL_PASSWORD or ADMIN_API_KEY in .env.local');
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { password?: string };
    const enteredPassword = typeof body.password === 'string' ? body.password : '';

    if (!enteredPassword) {
      return NextResponse.json({ detail: 'Password is required' }, { status: 400 });
    }

    if (enteredPassword !== getAdminPortalPassword()) {
      return NextResponse.json({ detail: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    );
  }
}
