import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  if (!data.password) {
    console.log(1, data)
    return NextResponse.json({}, { status: 400 });
  }
  try {
    const backendResponse = await fetch(`${getBackendUrl()}/lhs`, {
      method: "GET",
      headers: {
        'X-LHS-Key': data.password
      },
      cache: 'no-store',
    });

    const backendData = await backendResponse.json().catch(() => ({}));
    if (backendResponse.ok) {
      console.log(2)
      return NextResponse.json(backendData.transactions, { status: 200 });
    }

    console.log('[LHS] Not OK')
    return NextResponse.json({}, { status: 400 });
  } catch (error) {
    console.error('[LHS] Error fetching:', error);
    return NextResponse.json({}, { status: 400 });
  }
}
