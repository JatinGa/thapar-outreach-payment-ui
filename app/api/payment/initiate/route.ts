import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
}

function buildEasebuzzPayUrl(initiateUrl: string, accessKey: string): string {
  const url = new URL(initiateUrl);
  return `${url.origin}/pay/${accessKey}`;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const callbackUrl = new URL('/api/webhook/easebuzz', request.url).toString();

    const response = await fetch(`${getBackendUrl()}/payment/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || `Payment initiation failed (${response.status})` },
        { status: response.status }
      );
    }

    const fields = {
      key: data.key,
      txnid: data.txnid,
      amount: data.amount,
      productinfo: data.productinfo,
      firstname: data.firstname,
      email: data.email,
      phone: data.phone,
      // Force browser callback through frontend route to show success page UX.
      surl: callbackUrl,
      furl: callbackUrl,
      hash: data.hash,
      udf1: data.udf1 || '',
      udf2: data.udf2 || '',
      udf3: data.udf3 || '',
      udf4: data.udf4 || '',
      udf5: data.udf5 || '',
    };

    const easebuzzResp = await fetch(data.easebuzz_payment_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields),
      cache: 'no-store',
    });

    const easebuzzJson = await easebuzzResp.json().catch(() => ({}));
    if (!easebuzzResp.ok || easebuzzJson.status !== 1 || !easebuzzJson.data) {
      return NextResponse.json(
        {
          detail:
            easebuzzJson.error_desc ||
            `EaseBuzz initiation failed (${easebuzzResp.status})`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        ...data,
        surl: callbackUrl,
        furl: callbackUrl,
        easebuzz_access_key: String(easebuzzJson.data),
        easebuzz_redirect_url: buildEasebuzzPayUrl(
          String(data.easebuzz_payment_url),
          String(easebuzzJson.data)
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    );
  }
}
