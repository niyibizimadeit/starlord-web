---
name: payment-audit-findings
description: Critical vulnerabilities found in IremboPay payment integration audit
metadata:
  type: reference
---

IremboPay payment integration audit performed 2026-07-30 — findings documented in [[fixes-md]].

**Critical (3):**
- Price manipulation: `/api/payments/initiate` takes `amount` from client without verifying against order total
- Webhook handler not atomic: order update + `processed_webhooks` insert not wrapped in transaction — replay can corrupt state
- Production `sk_live_*` keys sent to sandbox API endpoint — key mismatch

**High (5):**
- Auto-fail race: payment-status route unconditionally overwrites order, races with webhook
- Weak admin password (`starlord2023admin`) doubles as JWT signing key
- No server-side phone validation in payments/initiate
- Webhook silently skips signature verification when secret key env var is missing
- No `payment_expires_at` check before initiating payment

See the full breakdown in `fixes.md` at the project root.
