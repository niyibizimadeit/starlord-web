# IremboPay Payment Integration TODO.

**Status**: Core infrastructure complete. Checkout flow, webhook handler, stock reservation, and polling UI all implemented. Pending: IremboPay sandbox credentials to wire up the actual API call.

## ✅ Completed

- [x] Database migrations: removed `pawapay_deposit_id`, added `irembopay_transaction_id`, `payment_expires_at`
- [x] `processed_webhooks` table confirmed exists
- [x] `restore_stock` RPC created (mirrors `deduct_stock`)
- [x] `/api/payments/initiate/route.js` — initiates push payment, stores `irembopay_transaction_id`
- [x] `/api/orders/payment-status/route.js` — polling endpoint for Step 3
- [x] `checkout/route.js` — stock reserved at order creation, `payment_expires_at` set (15 min TTL), returns `total`
- [x] `webhooks/irembopay/route.js` — sig verification, idempotency, order confirmation, stock restore on failure, audit log
- [x] `checkout/page.js` — Step 3 is now a "Check your phone" waiting screen with 4s polling, transitions to paid/failed/expired states

## 📋 Remaining

### 1. Sandbox Access (blocker)
- [ ] Sign up at IremboPay sandbox, get: `IREMBOPAY_PUBLIC_KEY`, `IREMBOPAY_SECRET_KEY`, `IREMBOPAY_WEBHOOK_SECRET`, base URL
- [ ] Add all keys to `.env.local` and Vercel

### 2. Confirm API shape (unblock `/api/payments/initiate`)
   | Item | Assumed | Confirmed |
   |------|---------|-----------|
   | Initiate endpoint | `POST /payments/initiate` | ? |
   | Auth header | `Bearer IREMBOPAY_SECRET_KEY` | ? |
   | Payload fields | `amount, phone, reference, payment_method, callback_url` | ? |
   | Transaction ID field in response | `transaction_id` | ? |
   | Success webhook status | `SUCCESS` | ? |
   | Failure webhook statuses | `FAILED` / `CANCELLED` | ? |
   | Signature header | `x-irembopay-signature` | ? |
   | HMAC algorithm | SHA256 | ? |

### 3. Wire up `/api/payments/initiate` (~30 min once sandbox confirmed)
- [ ] Update endpoint URL, auth format, and payload shape
- [ ] Test with sandbox: MTN success, MTN failure, Airtel success

### 4. Webhook testing
- [ ] Simulate webhook via Postman with sandbox payloads
- [ ] Verify signature validation works
- [ ] Confirm `payment_status` updates trigger polling UI transitions

### 5. Prod rollout
- [ ] Switch `IREMBOPAY_BASE_URL` to production
- [ ] Update webhook URL in IremboPay dashboard: `https://starlordgroup.rw/api/webhooks/irembopay`
- [ ] Live test with small amount
- [ ] Monitor Vercel logs first week

### 6. Optional polish
- [ ] Admin: show `irembopay_transaction_id` in order detail view
- [ ] SMS notification on payment success/failure
- [ ] Payment success rate in analytics dashboard

## 🚨 Known risks
- IremboPay sandbox access delay — only blocker remaining
- Webhook URL must be publicly reachable for sandbox testing (use ngrok locally)

## Progress
- [x] Infrastructure & DB
- [x] Frontend flow
- [x] Webhook handler
- [ ] Sandbox wired up
- [ ] Tested end-to-end
- [ ] Deployed to prod ✅