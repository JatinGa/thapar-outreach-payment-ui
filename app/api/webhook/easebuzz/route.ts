import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract EaseBuzz webhook data
    const status = formData.get('status');
    const txnid = formData.get('txnid');
    const amount = formData.get('amount');
    const productinfo = formData.get('productinfo');
    const firstname = formData.get('firstname');
    const email = formData.get('email');
    const Phone = formData.get('Phone');
    const udf1 = formData.get('udf1'); // origin_user_id
    const udf2 = formData.get('udf2'); // fest_id
    const hash = formData.get('hash');

    console.log('[Webhook] EaseBuzz callback received:', {
      status,
      txnid,
      amount,
      udf2,
    });

    // Forward to backend for validation and storage
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    const backendResponse = await fetch(`${backendUrl}/webhook/easebuzz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        Phone,
        udf1,
        udf2,
        hash,
      }),
      cache: 'no-store',
    });

    const backendData = await backendResponse.json().catch(() => ({}));

    // If backend processing failed, still show success to avoid EaseBuzz resend loops
    if (backendResponse.ok && backendData.success) {
      const festAuthorizedUrl = backendData.authorized_url || 'https://accommodationstiet.shop';
      
      return NextResponse.redirect(
        new URL(
          `/payment-success?redirect=${encodeURIComponent(festAuthorizedUrl)}`,
          request.url
        ),
        302
      );
    }

    // Fallback redirect even if backend fails
    return NextResponse.redirect(
      new URL('/payment-success', request.url),
      302
    );
  } catch (error) {
    console.error('[Webhook] Error processing EaseBuzz callback:', error);

    // Always redirect to success page to prevent EaseBuzz from retrying
    return NextResponse.redirect(
      new URL('/payment-success', request.url),
      302
    );
  }
}
