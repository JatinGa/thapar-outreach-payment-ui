import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  if (!data.uid || !data.password) {
    return NextResponse.json({}, { status: 400 });
  }

  try {
    const backendResponse = await fetch(`${getBackendUrl()}/lhs/checkout`, {
      method: "POST",
      headers: {
        'X-LHS-Key': data.password,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uid: data.uid }),
    });

    console.log(await backendResponse.json());
    if (backendResponse.ok) {
      return NextResponse.json({}, { status: 200 });
    }

    console.log('[LHS - Checkout] Not OK')
    return NextResponse.json({}, { status: 400 });
  } catch (error) {
    console.error('[LHS - Checkout] Error fetching:', error);
    return NextResponse.json({}, { status: 400 });
  }
}
