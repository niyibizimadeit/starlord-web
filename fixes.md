# Starlord Web — Code Audit & Fixes

> **Audit date:** 2026-06-03  
> **Fix date:** 2026-06-03  
> **Status:** 18 issues fixed, 4 deferred, 9 noted for future work

---

## ✅ Fixed Issues

### Critical

| # | Issue | File(s) | Fix Applied |
|---|-------|---------|-------------|
| C1 | **`VALID_TRANSITIONS` undefined — production crash** | `app/api/admin/orders/[id]/status/route.js` | Added complete transitions map including `pending`, `confirmed`, `preparing`, `dispatched`, `delivered`, `cancelled`, `stock_conflict`, `return_requested`, `return_approved`, `return_rejected` |
| C2 | **`X-XSS-Protection` header — deprecated, dangerous** | `next.config.ts`, `app/middleware.js` | Removed from both files. Replaced with `Content-Security-Policy` header in `next.config.ts` |
| C3 | **`x-pathname` header leaks internal routing** | `app/middleware.js` | Removed the non-standard header |
| C4 | **Webhook crashes if `IREMBOPAY_WEBHOOK_SECRET` missing** | `app/api/webhooks/irembopay/route.js` | Added early-return guard before signature verification |
| C5 | **Checkout drops payment-initiation failures silently** | `app/checkout/page.js` | Added `paymentRes.ok` check — shows error with order reference if payment init fails |

### Medium

| # | Issue | File(s) | Fix Applied |
|---|-------|---------|-------------|
| M1 | **`createServiceClient` no runtime browser guard** | `lib/supabase/server.js` | Added `typeof window !== 'undefined'` check that throws |
| M2 | **Order status endpoint has no access control** | `app/api/orders/[id]/status/route.js` | Added phone parameter requirement — verifies `customer_phone` matches before returning order data |
| M3 | **OTP verify hardcodes `+250` prefix** | `app/api/auth/verify-otp/route.js` | Now checks for existing `+` prefix (matching `request-otp` behaviour) before defaulting to `+250` |
| M4 | **`set-password` uses anon key for users table write** | `app/api/auth/set-password/route.js` | Switched to `createServiceClient()` for the `users` table update; also removed unused `NextResponse` import |
| M5 | **Unused import + orphaned comment in register route** | `app/api/auth/register/route.js` | Removed dead `createServiceClient` import; replaced orphaned comment with clear documentation |
| M6 | **Duplicate `<Analytics />` component** | `app/layout.js` | Removed duplicate `Analytics` import and JSX (kept in `ConditionalLayout.js`); also added missing `<SpeedInsights />` render |
| M7 | **`forgot-password` leaks Supabase error messages** | `app/api/auth/forgot-password/route.js` | Changed to log error internally, always return generic success message |

### Low / Code Quality

| # | Issue | File(s) | Fix Applied |
|---|-------|---------|-------------|
| L1 | **No cart persistence — lost on refresh** | `components/CartContext.js` | Added `localStorage` persistence: cart loads from `localStorage` on mount and saves on every change |
| L2 | **`Cache-Control: no-store` with dead cacheSeconds code** | `app/api/admin/analytics/route.js` | Now applies calculated `cacheSeconds` values: 5min for today, 30min for week, 1hr for month; uses `stale-while-revalidate` |
| L3 | **`/api/` path exposed in robots.txt** | `app/robots.js` | Removed `/api/` from disallow list (crawlers won't find API routes; avoids drawing attention) |
| L4 | **Admin layout uses fragile relative CSS import** | `app/admin/layout.js` | Changed `../../app/globals.css` to `@/app/globals.css` |
| L5 | **`page.js` trailing blank lines** | `app/page.js` | Cleaned up formatting |
| L6 | **`Content-Security-Policy` header missing** | `next.config.ts` | Added starter CSP: `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://images.starlordgroup.rw data:; connect-src 'self' https://zphpfahgyerabtpvtwol.supabase.co; frame-ancestors 'none'` |

---

## ⏸️ Deferred (Intentionally Not Fixed)

| # | Issue | Reason |
|---|-------|--------|
| D1 | **Weak `ADMIN_SECRET`** (`starlord2023admin`) | **Per your instructions** — do not change yet. When ready, generate with `openssl rand -base64 48` and update `.env.local` |
| D2 | **In-memory rate limiting** (won't scale across serverless instances) | Requires infrastructure change (Vercel KV / Upstash Redis). Current in-memory Map works for single-instance deployments. Plan for future. |
| D3 | **No CSRF protection on mutation endpoints** | Adding origin checking could break legitimate mobile/API clients. Needs careful testing with real usage patterns. |
| D4 | **Stock deduction after order creation** (inconsistency risk on failure) | Would require restructuring the checkout transaction. Current `stock_conflict` handling catches failures, but true atomicity needs a DB transaction or `BEFORE INSERT` trigger. |

---

## 📝 Noted for Future Work

These are design/code-quality items that aren't bugs but should be addressed as the codebase matures:

1. **Consolidate admin auth guards** — 3 different patterns across admin routes (`checkAdminAuth`, `getAdminUser`, `isAuthorized`). Extract to a shared `lib/admin-auth.js`.

2. **Standardize response helpers** — Mix of `Response.json()`, `NextResponse.json()`, `new NextResponse(JSON.stringify(...))`. Standardize on `Response.json()`.

3. **Split checkout page** — `app/checkout/page.js` is ~770 lines managing auth, addresses, delivery slots, payment, and polling in one component. Break into smaller hooks and components.

4. **Add tests** — Zero test coverage. Priority: checkout flow, auth routes, admin auth guards, phone number normalization.

5. **Extract hardcoded values to env vars** — WhatsApp number, default country code (`+250`), payment expiry (15 min), return window (6 hrs) should all be configurable.

6. **Remove unused `CategoryStrip` component** if it's dead code (verify it's rendered somewhere).

7. **`DELIVERY_FEE` mismatch risk** — Client fetches fee independently from server. Use the server-returned value or pass validated client value.

8. **`NEXT_STATUS` missing return workflow statuses** — `AdminHelpers.js` line 33 doesn't include `return_requested`, `return_approved`, `return_rejected`. Not a bug (they don't need forward-transition buttons) but worth documenting.

9. **Payment integration (IremboPay)** — `app/api/payments/initiate/route.js` and `app/api/webhooks/irembopay/route.js` still have TODO placeholders. Validate payload shapes against the actual IremboPay API contract before going live with real payments.

---

## Files Changed (17 files)

```
app/api/admin/orders/[id]/status/route.js   — Added VALID_TRANSITIONS map
app/api/orders/[id]/status/route.js          — Added phone-based access control
next.config.ts                                — Removed X-XSS-Protection, added CSP
app/middleware.js                             — Removed X-XSS-Protection + x-pathname
app/api/webhooks/irembopay/route.js           — Guard against missing webhook secret
app/checkout/page.js                          — Handle payment-initiation failure
lib/supabase/server.js                        — Runtime browser guard for service client
app/api/auth/verify-otp/route.js              — Consistent phone prefix logic
app/api/auth/set-password/route.js            — Use service client for DB write
app/api/auth/register/route.js                — Remove dead import, fix comment
app/api/auth/forgot-password/route.js         — Don't leak error details
app/layout.js                                 — Remove duplicate Analytics, add SpeedInsights
components/CartContext.js                     — localStorage cart persistence
app/api/admin/analytics/route.js              — Apply cache durations
app/robots.js                                 — Remove /api/ from robots.txt
app/admin/layout.js                           — Use @/ alias for CSS import
app/page.js                                   — Clean up trailing whitespace
```
