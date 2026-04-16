import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  if (!data.uid) {
    return NextResponse.json({}, { status: 400 });
  }

  try {
    const backendResponse = await fetch(`${getBackendUrl()}/lhs/checkin`, {
      method: "POST",
      headers: {
        'X-LHS-Key': data.password
      },
      body: JSON.stringify({ uid: data.uid }),
    });

    if (backendResponse.ok) {
      return NextResponse.json({}, { status: 200 });
    }

    console.log('[LHS - Checkin] Not OK')
    return NextResponse.json({}, { status: 400 });
  } catch (error) {
    console.error('[LHS - Checkin] Error fetching:', error);
    return NextResponse.json({}, { status: 400 });
  }
}
