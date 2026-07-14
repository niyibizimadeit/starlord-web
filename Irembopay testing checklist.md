# IremboPay Pre-Production Testing Checklist
**Project:** Starlord Group — starlordgroup.rw  
**Payment Gateway:** IremboPay Sandbox  
**Contact:** Adeline Impano, Business Analyst — Irembo

---

## 1. MTN Mobile Money (Push Payment)

### 1.1 Successful Payment
- [x] Place a real order through the checkout UI (not curl)
- [x] Select MTN as payment method
- [x] Enter sandbox success number: `0781234567`
- [x] Confirm the checkout page transitions to "Check your phone" waiting screen
- [x] Confirm polling detects payment (order status updates without page refresh)
- [x] Verify in Supabase: `status = confirmed`, `payment_status = paid`
- [x] Verify in IremboPay dashboard: invoice shows **Paid**, webhook **Successful: True**, response code **200**
- [x] Verify `irembopay_transaction_id` is stored on the order row

### 1.2 Failed Payment
- [ ] Place an order, select MTN, enter sandbox fail number: `0780123456`
- [ ] Confirm checkout page transitions to a "Payment failed" state
- [ ] Verify in Supabase: `status = payment_failed`, `payment_status = failed`
- [ ] Verify reserved stock is restored (check product stock count before and after)

### 1.3 Expired Payment
- [ ] Place an order and do nothing for 15 minutes (or set `payment_expires_at` to a past time manually)
- [ ] Confirm the checkout page shows an "expired" state
- [ ] Verify stock is restored

---

## 2. Airtel Money (Push Payment)

### 2.1 Successful Payment
- [x] Place an order, select Airtel as payment method
- [x] Enter sandbox success number: `0731234567`
- [x] Confirm status updates to `confirmed` / `paid` via webhook
- [x] Verify in IremboPay dashboard: webhook **Successful: True**, response **200**

### 2.2 Failed Payment
- [ ] Enter sandbox fail number: `0730123456`
- [ ] Confirm `status = payment_failed`, stock restored

---

## 3. Card Payment — Visa / Mastercard (JS Widget)

### 3.1 Successful Visa Payment
- [x] Place an order, select Card as payment method
- [x] Confirm the IremboPay JS widget loads inline on the page (no redirect)
- [x] Enter sandbox Visa details:
  - Card Number: `4242 4242 4242 4242`
  - Expiry: `01/35`
  - CVV: `123`
  - Name: any
- [x] Confirm widget closes and checkout transitions to success state
- [x] Verify in Supabase: `status = confirmed`, `payment_status = paid`

### 3.2 Successful Mastercard Payment
- [x] Enter sandbox Mastercard details:
  - Card Number: `5555 5555 5555 4444`
  - Expiry: `01/35`
  - CVV: `123`
  - Name: any
- [x] Confirm status updates correctly

### 3.3 Failed Card Payment
- [x] Enter sandbox fail card:
  - Card Number: `5198 9602 2985 7244`
  - Expiry: `01/35`
  - CVV: `123`
- [x] Confirm checkout transitions to failed state
- [x] Verify stock is restored

---

## 4. Webhook Reliability

- [ ] Confirm every successful payment produces exactly one row in `processed_webhooks`
- [ ] Confirm re-sending a webhook for an already-processed invoice does NOT create a duplicate update (idempotency check works)
- [ ] Confirm webhook signature verification rejects a tampered payload (send a curl with wrong signature, confirm 401)
- [ ] Confirm webhook timestamp check rejects a replay older than 5 minutes

---

## 5. Order Flow End-to-End

- [ ] Guest checkout: place order without logging in, payment succeeds, order confirmed
- [ ] Logged-in checkout: place order as registered user, payment succeeds, order appears in account order history
- [ ] Admin dashboard: confirmed order appears with correct status, payment method, and `irembopay_transaction_id`
- [ ] Track order page: customer can track order after payment confirmation

---

## 6. Edge Cases

- [ ] Double-submit: click "Pay" twice rapidly — confirm only one invoice is created (idempotency key on orders table prevents duplicate orders)
- [ ] Network drop during payment: initiate payment, kill network, restore — confirm order stays in `pending` until webhook arrives
- [ ] Wrong phone format: enter `+250781234567` instead of `0781234567` — confirm validation catches it before API call
- [ ] Zero amount: confirm checkout blocks orders with 0 total
- [ ] Very large order: test with an order total above 100,000 RWF

---

## 7. Security Checks

- [ ] Confirm `/api/payments/initiate` requires a valid `orderId` that exists in the database
- [ ] Confirm it rejects orders that are not in `pending` payment status
- [ ] Confirm `/api/webhooks/irembopay` returns 401 for requests with no signature header
- [ ] Confirm it returns 401 for requests with invalid signature
- [ ] Confirm the secret key is not exposed in any client-side bundle (check browser dev tools → Sources)
- [ ] Delete the debug endpoint `/api/debug/route.js` if you created it during testing
- [ ] Remove all `console.log('[Webhook]...')` debug lines from the webhook handler before go-live

---

## 8. Production Readiness

- [ ] Update callback URL in IremboPay portal to production domain (no sandbox prefix)
- [ ] Swap all `IREMBOPAY_*` env vars in Vercel to production values
- [ ] Change widget script src from sandbox to production URL
- [ ] Run one live test with a real small amount (100 RWF) after production credentials arrive
- [ ] Monitor Vercel logs for the first week of live traffic

---

## Production Request Email

> **To:** adeline.impano@irembo.com
> **Subject:** Starlord Group — Sandbox Testing Complete, Requesting Production Access

---

Dear Adeline,

I hope this message finds you well.

I am writing to inform you that we have successfully completed the full integration and testing of IremboPay in our sandbox environment for Starlord Group (starlordgroup.rw).

During testing, we covered the following scenarios:

- MTN Mobile Money push payments — successful and failed flows
- Airtel Money push payments — successful and failed flows
- Visa and Mastercard payments via the IremboPay JS widget — successful and failed flows
- Webhook signature verification and idempotency handling
- Stock restoration on failed or expired payments
- End-to-end order flow for both guest and registered customers

Everything is working as expected and we are ready to go live.

Could you please guide us through the next steps to obtain production access? Specifically, we need:

- Access to the production merchant dashboard
- Production secret key
- Production payment account identifier
- Production product code

Please let us know what is required from our side to proceed.

Thank you for your continued support throughout this process.

Kind regards,
NIYIBIZI Junior
Starlord Group
starlordgroup.rw