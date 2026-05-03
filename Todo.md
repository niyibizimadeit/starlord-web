# IremboPay Payment Integration TODO

**Status**: Project complete except payments. Current: Manual processing post-checkout. Goal: Full MTN MoMo/Airtel Money via IremboPay sandbox → prod.

## 📋 Step-by-Step Integration Plan

### 1. **Prep & Research (1-2 hours)**
   - [ ] Sign up IremboPay Sandbox: Get merchant account, API keys (public/secret), webhook secret.
   - [ ] Review docs: Confirm:
     | Item | Current Assumption | Confirm |
     |------|--------------------|---------|
     | Success status | `SUCCESS` | ? |
     | Fail status | `FAILED`/`CANCELLED` | ? |
     | Payload fields | `transaction_id`, `status`, `order_reference`, `payment_method` | ? |
     | Sig header | `x-irembopay-signature` | ? |
     | HMAC alg | SHA256 | ? |
     | Payment URL | `/payments/initiate` (POST/GET?) | ? |
     | Required params | `amount`, `phone`, `reference`, `callback_url` | ? |
   - [ ] Create Supabase table `processed_webhooks` if missing:
     ```sql
     CREATE TABLE processed_webhooks (
       id SERIAL PRIMARY KEY,
       transaction_id TEXT UNIQUE NOT NULL,
       order_id UUID REFERENCES orders(id),
       created_at TIMESTAMP DEFAULT NOW()
     );
     ```

### 2. **Environment Vars (Vercel + .env.local)**
   - [ ] Add to `.env.local` & Vercel:
     ```
     IREMBOPAY_PUBLIC_KEY=...
     IREMBOPAY_SECRET_KEY=...
     IREMBOPAY_WEBHOOK_SECRET=...
     IREMBOPAY_SANDBOX_URL=https://sandbox.irembopay.com  # Confirm
     IREMBOPAY_BASE_URL=https://api.irembopay.com  # Prod
     ```

### 3. **Frontend: Checkout Payment Initiation (~2 hours)**
   - [ ] In `app/checkout/page.js` (step 2):
     - After validateStep1(), call `/api/checkout` → get `order.reference`.
     - Then POST to new `/api/payments/initiate` (create below).
     - On success → redirect to IremboPay URL (with phone/amount/ref).
     - Hide manual 'Pay' button, show loader + redirect.
   - [ ] Update step 3 (confirmation): Poll `/api/orders/[ref]/status` every 5s for payment_status.

### 4. **New API: `/api/payments/initiate/route.js` (Server) (~1 hour)**
   ```js
   // POST { reference, amount, phone, method }
   // Calls IremboPay /initiate → returns redirect_url
   // Log transaction_id if provided
   ```

### 5. **Fix Webhook `/api/webhooks/irembopay/route.js` (~2 hours)**
   - [ ] Replace TODOs with confirmed values (fields/statuses/sig).
   - [ ] Add SMS notifications (e.g., via Twilio/Africa's Talking or Supabase Edge).
   - [ ] Test sig verification with sandbox payloads.
   - [ ] Handle stock deduction (move from checkout if redirect happens first?).
   - [ ] Idempotency: Check `transaction_id` in `orders` too.

### 6. **Testing (Sandbox, 2-3 hours)**
   - [ ] Local: `npm run dev`, manual checkout → redirect → simulate webhook (Postman).
   - [ ] Sandbox payments: Test MTN/Airtel success/fail/cancel.
   - [ ] Edge: Stock conflict mid-payment, duplicate webhook, invalid sig.
   - [ ] DB: Verify orders `payment_status: 'paid'`, stock deducted.

### 7. **Prod Rollout (~1 hour)**
   - [ ] Switch `IREMBOPAY_BASE_URL`.
   - [ ] Update webhook URL in IremboPay dashboard: `https://starlordgroup.rw/api/webhooks/irembopay`.
   - [ ] Test live payment (small amount).
   - [ ] Monitor Vercel logs first week.

### 8. **Polish (Optional)**
   - [ ] Payment status polling UI in confirmation/track.
   - [ ] Admin: View `transaction_id`, refund button?
   - [ ] Analytics: Payment success rate.

## 🚨 Risks/Blockers
- IremboPay docs/API access delay.
- Phone prefix mapping (078/079=MTN, 072/073=Airtel).
- Sandbox webhook simulation.

## Progress Tracker
- [ ] Research complete
- [ ] Sandbox account
- [ ] Frontend integration
- [ ] Webhook fixed
- [ ] Local testing
- [ ] Deployed ✅

**Time Est**: 8-10 hours. Start with sandbox signup/docs.


