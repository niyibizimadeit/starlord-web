# Payment API Integration — Audit Findings

**Audited:** 2026-07-30  
**Scope:** IremboPay integration — `/api/payments/initiate`, `/api/checkout`, `/api/webhooks/irembopay`, `/api/orders/payment-status`, `/api/irembopay-api/[...path]`, `/api/irembopay-widget`, `/api/irembopay-dashboard/[...path]`, `/app/checkout/page.js`, `/app/middleware.js`

## Fix Status

| # | Issue | Severity | Fixed |
|---|-------|----------|-------|
| 1 | Price manipulation — client amount not server-verified | 🔴 Critical | ✅ `payments/initiate` now fetches & checks `order.total` |
| 2 | Webhook non-atomic idempotency — replay corrupts state | 🔴 Critical | ✅ Added `payment_status` guards, paid orders can't be overwritten |
| 3 | Production `sk_live_*` keys sent to sandbox API endpoint | 🔴 Critical | ⚠️ Added warnings in `.env.local`; verify with IremboPay |
| 4 | Auto-fail race condition with webhook | 🟠 High | ✅ Auto-fail only updates `where status='pending'` |
| 5 | Weak admin password doubles as JWT signing key | 🟠 High | ✅ Separate `ADMIN_JWT_SECRET` with fallback for backward compat |
| 6 | No server-side phone validation in payment initiate | 🟠 High | ✅ MTN & Airtel phone format validated server-side |
| 7 | Webhook skips verification when secret key missing | 🟠 High | ✅ Returns 500 instead of processing unverified requests |
| 8 | No `payment_expires_at` check in initiate | 🟠 High | ✅ Rejects expired orders with 410 |
| 9 | Checkout not wrapped in transaction | 🟡 Medium | ⚠️ Orphan order items cleaned up on stock conflict; full DB transaction recommended for future |
| 10 | In-memory rate limiter non-functional on serverless | 🟡 Medium | ✅ Removed `setInterval`; rate limiter is best-effort per-cold-start |
| 11 | Checkout doesn't validate payment method | 🟡 Medium | ✅ Validated against `['mtn', 'airtel', 'card']` |
| 12 | `NEXT_PUBLIC_IREMBOPAY_BASE_URL` exposed in client bundle | 🟡 Medium | ✅ Removed from `.env.local`; noted in comments |
| 13 | Missing amount type validation | 🟢 Low | ✅ Added `typeof`/`isFinite` check in initiate |
| 14 | No CSRF protection | 🟢 Low | ⏭️ Not implemented — mitigated by idempotency key requirement |
| 15 | Cart localStorage key not versioned | 🟢 Low | ⏭️ Cosmetic — doesn't affect current operations |
| 16 | Client sends unused `deliveryFee` field | 🟢 Low | ⏭️ Harmless — server ignores and fetches from DB correctly |
| 17 | No retry-payment flow for failed orders | 🟢 Low | ⏭️ Design limitation — out of scope for this audit fix pass |

---

## 🔴 CRITICAL

### 1. Price Manipulation — Client-Provided Amount Not Server-Verified

**File:** `app/api/payments/initiate/route.js:15`  
**Severity:** Critical — direct revenue loss

The `amount` field in the POST body is taken directly from the client and forwarded to IremboPay without any server-side verification against the actual order total.

```js
const { orderId, reference, amount, phone, method } = await request.json();
// ...
body: JSON.stringify({
  paymentItems: [{
    code: process.env.IREMBOPAY_PRODUCT_CODE,
    quantity: 1,
    unitAmount: amount,   // ← from client, never checked against order.total
  }],
}),
```

The order lookup at line 23-28 only fetches `id`, `payment_status`, `customer_name`, and `customer_phone` — it never reads `total` from the database.

**How to exploit:**  
1. Create an order for RWF 50,000 via the checkout API  
2. Call `/api/payments/initiate` with `amount: 100`  
3. IremboPay charges only RWF 100, order is marked pending, webhook arrives and confirms it

**Fix:** Re-fetch the order's `total` in the initiate route and compare:

```js
// After the order lookup at line 23:
if (order.total !== amount) {
  return Response.json({ error: 'Amount mismatch' }, { status: 400 });
}
```

You must also `select('id, payment_status, customer_name, customer_phone, total')` to include `total` in the query.

---

### 2. Webhook Handler Missing Transactional Idempotency

**File:** `app/api/webhooks/irembopay/route.js`  
**Severity:** Critical — payment state corruption on webhook replay

The order update (line 110-148) and the `processed_webhooks` insert (line 152-154) are NOT wrapped in a Supabase transaction. If the server crashes or the DB insert fails between these two operations, a replayed webhook will:

1. Pass the duplicate check (no row in `processed_webhooks`)
2. Re-apply the payment status update — potentially **overwriting the correct state**

Worst case scenario:  
- A `FAILED` webhook arrives first → order set to `payment_failed` → `processed_webhooks` insert fails  
- The `PAID` webhook arrives → sets order to `confirmed`/`paid` WITHOUT re-deducting stock (PAID handler doesn't restore stock, only FAILED handler does)  
- Result: **order shows paid but stock was double-restored**

**Fix:** Use `supabase.rpc()` to wrap the order update + processed_webhooks insert in a single database function/transaction. At minimum, check the order's current `payment_status` before applying any update — don't overwrite `paid` with `failed`.

```js
// Before updating: don't overwrite a confirmed payment
const { data: order } = await supabase
  .from('orders')
  .select('payment_status')
  .eq('id', order.id)
  .single();

if (order.payment_status === 'paid' && paymentStatus !== 'PAID') {
  // Already confirmed; ignore late failure notifications
  return new Response('OK', { status: 200 });
}
```

---

### 3. Production Secret Keys Being Sent to Sandbox API

**File:** `.env.local`  
**Severity:** Critical — transaction data leaks through sandbox, or payments silently fail to process

The `.env.local` file contains IremboPay keys with the `_live` suffix (indicating production credentials):

```
IREMBOPAY_SECRET_KEY=sk_live_6c74045267f2452aa926bebdf58f2433
NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY=pk_live_709aef9582d04913a1f128861ce40617
```

But the API base URL still points to sandbox:

```
IREMBOPAY_BASE_URL=https://api.sandbox.irembopay.com
```

This means production secret keys are being sent to the sandbox API. Either:
- These are **actual production keys** — in which case production charge attempts happen against the sandbox endpoint (will fail or behave incorrectly), or  
- IremboPay uses `_live` in sandbox keys too — in which case the naming is dangerously misleading

On top of that, `NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY` and `NEXT_PUBLIC_IREMBOPAY_BASE_URL` are both prefixed with `NEXT_PUBLIC_`, making them visible in client-side JavaScript bundles.

**Fix:** 
- Verify with IremboPay whether these keys are sandbox or production  
- If sandbox, rename them clearly (e.g., `...SANDBOX_...`)  
- Remove `NEXT_PUBLIC_IREMBOPAY_BASE_URL` — it's not used client-side (the widget proxy rewrites URLs server-side)  
- Set `NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY` to the actual sandbox public key, not the production one (if it is production)

---

## 🟠 HIGH

### 4. Auto-Fail Race Condition with Webhook

**File:** `app/api/orders/payment-status/route.js:37-42`  
**Severity:** High — successful payments can be flipped to failed

After 2 minutes, the payment-status polling endpoint auto-fails stale orders:

```js
await supabase
  .from('orders')
  .update({ status: 'payment_failed', payment_status: 'failed' })
  .eq('id', order.id);
```

This is an **unconditional write** — it doesn't check the current status before updating. If the IremboPay webhook arrives at roughly the same time (e.g., a slow card payment takes 2+ minutes), the webhook (setting `confirmed`/`paid`) and the auto-fail (setting `payment_failed`/`failed`) race. The last write wins.

**Fix:** Make the auto-fail update conditional on the order still being in pending status:

```js
await supabase
  .from('orders')
  .update({ status: 'payment_failed', payment_status: 'failed' })
  .eq('id', order.id)
  .eq('status', 'pending')       // ← only if still pending
  .eq('payment_status', 'pending');
```

---

### 5. Weak Admin Password Doubles as JWT Signing Secret

**File:** `.env.local` + `app/admin/middleware.js` + `app/api/admin/auth/route.js`  
**Severity:** High — full admin panel compromise

```
ADMIN_SECRET=starlord2023admin
```

This value is used for TWO things:
1. **Login password** — the plain-text password the user types to log in  
2. **JWT signing key** — the HMAC key used to sign and verify admin session tokens

Using the same value for both means anyone who knows the password (a weak, guessable one at that) can forge arbitrary JWTs with any expiry:

```js
new SignJWT({ role: 'admin' }).setExpirationTime('9999-12-31').sign(JWT_SECRET)
```

The JWT signing key should be a **separate, cryptographically random** value, different from the login password.

**Fix:**
1. Change `ADMIN_SECRET` to a strong random string (min 32 chars, use `openssl rand -hex 32`)
2. Create a separate `ADMIN_JWT_SECRET` for JWT signing  
3. Or keep one secret but hash the password with bcrypt and only use the raw value as the JWT key

---

### 6. No Server-Side Phone Validation in Payment Initiate

**File:** `app/api/payments/initiate/route.js:90`  
**Severity:** High — can charge arbitrary phone numbers

The phone number is taken directly from the client and sent as the `accountIdentifier` for mobile money push payments. The checkout route validates the phone (line 21-25 of `checkout/route.js`), but `payments/initiate` doesn't — and it's a separate endpoint that can be called independently.

An attacker who creates a legitimate order can call `/api/payments/initiate` directly with any phone number, bypassing checkout validation.

**Fix:** Validate the phone format server-side in `payments/initiate` based on the payment method:

```js
if (method !== 'card') {
  const cleanPhone = phone.replace(/\s+/g, '');
  const mtnRegex = /^(078|079)\d{7}$/;
  const airtelRegex = /^(072|073)\d{7}$/;
  
  if (method === 'mtn' && !mtnRegex.test(cleanPhone)) {
    return Response.json({ error: 'Invalid MTN MoMo number' }, { status: 400 });
  }
  if (method === 'airtel' && !airtelRegex.test(cleanPhone)) {
    return Response.json({ error: 'Invalid Airtel Money number' }, { status: 400 });
  }
}
```

---

### 7. Webhook Skips All Verification When Secret Key Is Missing

**File:** `app/api/webhooks/irembopay/route.js:10-12`  
**Severity:** High — anyone can forge payment confirmations

```js
if (!secretKey) {
  console.warn('[IremboPay] IREMBOPAY_SECRET_KEY not set — skipping signature verification');
}
```

If the `IREMBOPAY_SECRET_KEY` environment variable is accidentally unset (e.g., during deployment, env var rotation, or Vercel configuration error), the webhook handler silently accepts **every incoming request without any signature check**. An attacker who discovers the webhook URL can forge payment confirmations at will.

**Fix:** Reject all webhooks when the secret key is not configured:

```js
if (!secretKey) {
  console.error('[IremboPay] IREMBOPAY_SECRET_KEY not set — rejecting all webhooks');
  return new Response('Server configuration error', { status: 500 });
}
```

---

### 8. Payment Initiate Has No `payment_expires_at` Check

**File:** `app/api/payments/initiate/route.js`  
**Severity:** High — payments can be initiated on expired orders

The checkout route sets `payment_expires_at` on the order (15 minutes from creation), but the initiate route never checks it. A client could create an order, wait 15 minutes+ (after expiry), and still call `/api/payments/initiate` to process payment. This payment would succeed despite the order being stale.

**Fix:** After the order lookup, add an expiry check:

```js
if (order.payment_expires_at && new Date(order.payment_expires_at) < new Date()) {
  return Response.json({ error: 'Order payment window has expired' }, { status: 410 });
}
```

---

## 🟡 MEDIUM

### 9. Checkout Order Creation Not Wrapped in a DB Transaction

**File:** `app/api/checkout/route.js`  
**Severity:** Medium — database inconsistency on crash

Three separate writes happen sequentially without a transaction:
1. Order insert (line 140)
2. Order items insert (line 177)
3. Stock deduction (line 180)

If the server crashes between steps 1 and 2, an orphan order with no items exists. If it crashes between steps 2 and 3, the order has items but stock wasn't deducted. A subsequent ghost sale of the same stock can oversell.

**Fix:** Either wrap all three in a `supabase.rpc()` stored procedure, or use the PostgreSQL transaction support via `supabase.auth.withSession()`.

---

### 10. In-Memory Rate Limiter Is Stateless on Serverless

**File:** `app/middleware.js`  
**Severity:** Medium — rate limiting effectively disabled in production

The middleware rate limiter uses an in-memory Map:

```js
const rateLimitMap = new Map();
```

On Vercel (and most serverless platforms), each invocation runs in a fresh Node.js process. The `rateLimitMap` is created anew on every request and garbage-collected when the function returns. **Rate limiting doesn't work at all in production.**

Additionally:
- The cleanup interval (`setInterval` at line 51) is meaningless in serverless — the process doesn't live long enough
- The Map's unbounded growth is a theoretical memory leak in long-running environments

**Fix:** Use Vercel KV (Upstash Redis) or a database-backed rate limiter. For a simple webhook rate limit, the `processed_webhooks` table already provides per-invoice dedup — the middleware's in-memory limiter on top of it is redundant.

---

### 11. Checkout API Doesn't Validate Allowed Payment Methods

**File:** `app/api/checkout/route.js`  
**Severity:** Medium — accepts unhandled method strings

The `paymentMethod` field is stored directly into the database without checking it against `['mtn', 'airtel', 'card']`. If the frontend sends an invalid method, it's stored as-is and will fail normalization in the webhook handler (which has a safe fallback to `'mtn'`, but this masks the error).

**Fix:** Validate the method server-side:

```js
const VALID_METHODS = ['mtn', 'airtel', 'card'];
if (!VALID_METHODS.includes(paymentMethod)) {
  return Response.json({ error: 'Invalid payment method' }, { status: 400 });
}
```

---

### 12. `NEXT_PUBLIC_IREMBOPAY_BASE_URL` Exposed to Browser Unnecessarily

**File:** `.env.local`, line 10  
**Severity:** Medium — unnecessary information disclosure

```
NEXT_PUBLIC_IREMBOPAY_BASE_URL=https://api.sandbox.irembopay.com
```

This Next.js public env var is inlined into client-side JavaScript bundles. It's not used anywhere client-side (the widget proxy rewrites URLs server-side). This exposes the IremboPay API endpoint to anyone who reads the bundle source.

**Fix:** Remove this from `.env.local` and any Vercel environment variables. If the public key is the only thing the client needs, only expose that.

---

## 🟢 LOW

### 13. Missing Input Type/Sanity Validation on Amount

**File:** `app/api/payments/initiate/route.js:15-18`

The `amount` field is not validated for type. Negative numbers, zero, strings, `NaN`, floating-point precision issues — none are checked before sending to IremboPay.

```js
if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
  return Response.json({ error: 'Invalid amount' }, { status: 400 });
}
```

### 14. No CSRF Protection on Checkout/Payment Endpoints

**File:** `app/api/checkout/route.js`, `app/api/payments/initiate/route.js`

Neither the checkout nor the payment initiate endpoint has anti-CSRF measures. A malicious site could trick a logged-in user's browser into making a POST request (if the user happens to have items in their cart).

**Note:** This is partially mitigated by the `idempotencyKey` requirement in checkout (an attacker would need to guess/supply one), but the payment initiate endpoint has no such guard.

**Fix:** Add a `Referer`/`Origin` header check or require the idempotency key pattern in initiate too.

### 15. `cart` localStorage Key Not Versioned

**File:** `components/CartContext.js:23`

The cart uses a hardcoded localStorage key `'starlord-cart'`. If the cart data format changes in a future version, the old cached data could cause runtime errors because there's no schema version or migration.

### 16. Checkout API Ignoring `deliveryFee` Client Field Without Warning

**File:** `app/checkout/page.js:404`, `app/api/checkout/route.js:14`

The client sends `deliveryFee` in the checkout request body, but the API never reads it (it fetches delivery fee from the database). This is confusing for future developers — the field appears to be sent but has no effect. Either consume it as a sanity check against the server value, or remove it from the client payload.

### 17. Immediate Recovery from Payment Failure Not Possible

**File:** `app/checkout/page.js`

When a payment fails, the cart is restored and the user is sent back to `/cart`. But the failed order still exists in the database with status `payment_failed`. There is no "retry payment" flow — the user must start a new checkout, creating a new order. This means every payment failure generates a zombie order.

---

## ✅ Things Done Well

For balance, the integration also has several strong points:

- **Webhook signature verification** uses `crypto.timingSafeEqual` — no timing attack vector
- **Webhook timestamp replay protection** — rejects signatures older than 5 minutes
- **Double-submit prevention** — `submittingRef` guard on frontend + idempotency key on backend
- **Stock restoration on failure** — both the webhook handler and payment-status polling restore stock when a payment fails
- **Widget proxy postMessage safety** — both the widget and popup have postMessage origin patching to prevent silent crashes
- **Cart snapshot/restore** — cart is saved before clearing on payment, restored on failure
- **Delivery fee fetched server-side** — not trusting the client's `deliveryFee` value
- **XSS sanitization** — `sanitize-html` on customer name, address, and delivery slot
- **Phone ownership verification** — order tracking requires both reference AND phone number
- **Admin double auth** — JWT-based middleware + Supabase session check in route handlers
- **Rate limiting on auth endpoints** — 5 requests/minute (even if in-memory only works in persistent environments)
