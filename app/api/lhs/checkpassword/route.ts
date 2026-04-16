import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  if (!data.password) {
    return NextResponse.json({}, { status: 400 });
  }

  try {
    const backendResponse = await fetch(`${getBackendUrl()}/lhs/checkpassword`, {
      method: "GET",
      headers: {
        'X-LHS-Key': data.password,
      },
    });

    const response = await backendResponse.json();
    if (response.valid) {
      return NextResponse.json({}, { status: 200 });
    }

    console.log('[LHS - Check password] Not OK')
    return NextResponse.json({}, { status: 400 });
  } catch (error) {
    console.error('[LHS - Check password] Error fetching:', error);
    return NextResponse.json({}, { status: 400 });
  }
}
