# Payment Flow Implementation Guide (Frontend)

## Overview
When the user clicks "Proceed to Payment", the frontend must initiate a payment in two stages:
1. **Backend initiation**: POST to `/api/payment/initiate` to get EaseBuzz credentials and transaction details
2. **Auto-submit to EaseBuzz**: Create a hidden form and auto-submit it to the EaseBuzz payment gateway

## Critical Bug Fix

**Do NOT render the JSON response from `/api/payment/initiate` to the user.**

The response from `POST /api/payment/initiate` contains sensitive payment data (hash, merchant key) that must be submitted to EaseBuzz immediately via a hidden form, never displayed or exposed to the user.

## Correct Implementation

```javascript
async function handlePaymentClick(option) {
  try {
    // Step 1: Get signed payment credentials from backend
    const response = await fetch('/api/payment/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fest_id: selectedFest.fest_id,
        origin_user_id: launchContext.origin_user_id,
        launch_exp: launchContext.launch_exp,     // optional
        launch_sig: launchContext.launch_sig,     // optional
        user_name: userDetails.name,
        user_state: userDetails.state,
        user_district: userDetails.district,
        booking: {
          accommodation_days: 3,
          food_days: 0,
          accommodation_amount: '2.04',
          food_amount: '0.00',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to initiate payment');
    }

    const paymentData = await response.json();

    // Step 2: Create a hidden form with the payment data
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.easebuzz_payment_url; // Route to EaseBuzz payment page

    // Step 3: Add all required fields as hidden inputs
    const fields = {
      key: paymentData.key,
      txnid: paymentData.txnid,
      amount: paymentData.amount,
      productinfo: paymentData.productinfo,
      firstname: paymentData.firstname,
      email: paymentData.email,
      phone: paymentData.phone,
      surl: paymentData.surl,
      furl: paymentData.furl,
      hash: paymentData.hash,
      udf1: paymentData.udf1,
      udf2: paymentData.udf2,
      udf3: paymentData.udf3,
      udf4: paymentData.udf4,
      udf5: paymentData.udf5,
    };

    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value ?? '';
      form.appendChild(input);
    });

    // Step 4: Append to DOM and auto-submit
    document.body.appendChild(form);
    form.submit(); // This redirects user to EaseBuzz payment page
  } catch (error) {
    console.error('Payment initiation failed:', error);
    setPaymentError(error.message);
  }
}
```

## Response Format

The backend returns a `PaymentInitiateResponse` with this structure:

```json
{
  "internal_tx_id": "uuid-string",
  "easebuzz_payment_url": "https://testpay.easebuzz.in/payment/initiateLink",
  "key": "MERCHANT_KEY",
  "txnid": "unique-transaction-id",
  "hash": "sha512-hash-of-signed-fields",
  "amount": "2.04",
  "productinfo": "AccommodationBooking",
  "firstname": "User Name",
  "email": "user@example.com",
  "phone": "9999999999",
  "udf1": "user-id",
  "udf2": "fest-id",
  "udf3": "unused",
  "udf4": "unused",
  "udf5": "unused",
  "surl": "https://api.accommodationstiet.shop/webhook/easebuzz",
  "furl": "https://api.accommodationstiet.shop/webhook/easebuzz"
}
```

## Key Points

- **Never display** the response JSON to the user
- **Always auto-submit** the form immediately after creation
- The form will POST to the EaseBuzz payment gateway URL (`easebuzz_payment_url`)
- User will be redirected to EaseBuzz to enter payment details (card, UPI, etc.)
- After payment, EaseBuzz will POST back to the `surl` or `furl` callback URL

## Notes

- The hash field is a signed digest of the transaction data; it must not be modified
- The merchant key is sensitive and must never be exposed in the browser console or used for other purposes
- Optional fields (`launch_exp`, `launch_sig`) are only needed if the payment was initiated with a launch signature; otherwise, omit them
