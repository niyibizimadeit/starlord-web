import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Payment notifications are the source of truth for mobile money and card
// payments. Docs: HMAC-SHA256(secret, `${timestamp}#${rawBody}`) sent in
// `irembopay-signature: t=<ms>,s=<hex>`, with a 5-minute replay window.
const TERMINAL_FAILURE_STATUSES = new Set(['FAILED', 'CANCELLED', 'EXPIRED']);

function normalizePaymentMethod(method, fallback) {
  if (!method) return fallback;
  const m = String(method).toLowerCase();
  if (m.includes('airtel')) return 'airtel';
  if (m.includes('mtn')) return 'mtn';
  // MOMO_PUSH is the generic push label IremboPay sends for either
  // network; keep whatever the customer picked at checkout.
  if (m.includes('momo')) return fallback;
  if (m.includes('card')) return 'card';
  return fallback;
}

async function restoreStock(supabase, orderId) {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (error) {
    console.error('[Webhook] Could not load items for stock restore:', JSON.stringify(error));
    return;
  }

  for (const item of items || []) {
    const { error: rpcError } = await supabase.rpc('restore_stock', {
      p_product_id: item.product_id,
      p_quantity:   item.quantity,
    });
    if (rpcError) {
      console.error('[Webhook] restore_stock failed:', JSON.stringify(rpcError));
    }
  }
}

// Used only when a FAILED notification was followed by a real PAID for the
// same invoice: the failure path restored stock, so a late success has to
// put it back. Best-effort — fulfilment can reconcile if stock has since
// sold out.
async function reDeductStock(supabase, orderId) {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (error) {
    console.error('[Webhook] Could not load items for stock re-deduct:', JSON.stringify(error));
    return;
  }

  for (const item of items || []) {
    const { error: rpcError } = await supabase.rpc('deduct_stock', {
      p_product_id: item.product_id,
      p_quantity:   item.quantity,
    });
    if (rpcError) {
      console.error(
        '[Webhook] deduct_stock failed after late PAID — check inventory:',
        JSON.stringify(rpcError),
      );
    }
  }
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('irembopay-signature');
    const secretKey = process.env.IREMBOPAY_SECRET_KEY;

    if (!secretKey) {
      console.error('[IremboPay] IREMBOPAY_SECRET_KEY not set — rejecting all webhooks');
      return new Response('Server configuration error', { status: 500 });
    }

    if (!signatureHeader) {
      console.error('[IremboPay] Missing irembopay-signature header');
      return new Response('Unauthorized', { status: 401 });
    }

    const parts = signatureHeader.split(',').reduce((acc, part) => {
      const [key, val] = part.trim().split('=');
      acc[key.trim()] = val.trim();
      return acc;
    }, {});

    const timestamp = parts['t'];
    const receivedSig = parts['s'];

    if (!timestamp || !receivedSig) {
      console.error('[Webhook] Missing timestamp or signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const timestampMs = parseInt(timestamp, 10);
    if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
      console.error('[IremboPay] Webhook timestamp too old or malformed');
      return new Response('Unauthorized', { status: 401 });
    }

    const signedPayload = `${timestamp}#${rawBody}`;
    const expectedSig = crypto
      .createHmac('sha256', secretKey)
      .update(signedPayload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSig, 'hex');
    const receivedBuf = Buffer.from(receivedSig, 'hex');

    // timingSafeEqual throws if the buffers differ in length, which used to
    // fall through to the catch-all and return 200. Check the length first
    // so a malformed signature is a clean 401.
    const signaturesMatch =
      receivedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!signaturesMatch) {
      console.error('[IremboPay] Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('[IremboPay] Webhook body is not valid JSON');
      return new Response('Bad Request', { status: 400 });
    }

    const data = payload?.data;
    if (!data?.invoiceNumber) {
      return new Response('Bad Request', { status: 400 });
    }

    const invoiceNumber  = data.invoiceNumber;
    const paymentStatus  = String(data.paymentStatus || '').toUpperCase();
    const transactionId  = data.transactionId;
    const paymentMethod  = data.paymentMethod;

    const supabase = createServiceClient();

    // IremboPay should echo the merchant transactionId we sent (our order
    // reference), but the webhook's transactionId can be a payment-level id
    // in some flows. Fall back to the invoice number we stored when the
    // invoice was created — that is always present.
    let order = null;
    let lookupError = null;

    if (transactionId) {
      const { data: byRef, error } = await supabase
        .from('orders')
        .select('*')
        .eq('reference', transactionId)
        .maybeSingle();
      order = byRef;
      lookupError = error;
    }

    if (!order && !lookupError) {
      const { data: byInvoice, error } = await supabase
        .from('orders')
        .select('*')
        .eq('irembopay_transaction_id', invoiceNumber)
        .maybeSingle();
      order = byInvoice;
      lookupError = error;
    }

    if (lookupError) {
      // Transient DB failure — return 5xx so IremboPay can retry rather than
      // acknowledging a notification we never applied.
      console.error('[Webhook] Order lookup error:', JSON.stringify(lookupError));
      return new Response('Internal Server Error', { status: 500 });
    }

    if (!order) {
      console.error('[IremboPay] Order not found for invoice:', invoiceNumber);
      return new Response('OK', { status: 200 });
    }

    // Defence in depth: the invoice was created server-side from order.total.
    // A mismatch means this notification is not for the order we think it is.
    if (data.amount != null && Number(data.amount) !== Number(order.total)) {
      console.error(
        '[Webhook] Amount mismatch — invoice:', invoiceNumber,
        'payload:', data.amount, 'order:', order.total,
      );
      return new Response('Bad Request', { status: 400 });
    }

    if (paymentStatus === 'PAID') {
      // Never downgrade a paid order.
      if (order.payment_status === 'paid') {
        console.warn('[Webhook] Order', order.id, 'already paid — ignoring duplicate PAID');
        return new Response('OK', { status: 200 });
      }

      const wasFailed = order.payment_status === 'failed';

      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({
          status:                   'confirmed',
          payment_status:           'paid',
          payment_method:           normalizePaymentMethod(paymentMethod, order.payment_method),
          irembopay_transaction_id: invoiceNumber,
        })
        .eq('id', order.id)
        .in('payment_status', ['pending', 'failed'])
        .select('id');

      if (updateError) {
        console.error('[Webhook] Order update FAILED:', JSON.stringify(updateError));
        return new Response('Internal Server Error', { status: 500 });
      }

      // A late success after we already restored stock needs the stock back.
      if (updated?.length && wasFailed) {
        console.warn('[Webhook] Late PAID for previously failed order', order.id, '— re-deducting stock');
        await reDeductStock(supabase, order.id);
      }
    } else if (TERMINAL_FAILURE_STATUSES.has(paymentStatus)) {
      if (order.payment_status === 'paid') {
        console.warn('[Webhook] Order', order.id, 'already paid — ignoring late failure');
        return new Response('OK', { status: 200 });
      }

      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({
          status:         'payment_failed',
          payment_status: 'failed',
        })
        .eq('id', order.id)
        .eq('payment_status', 'pending')
        .select('id');

      if (updateError) {
        console.error('[Webhook] Order update FAILED:', JSON.stringify(updateError));
        return new Response('Internal Server Error', { status: 500 });
      }

      // Only the call that actually moved the order out of pending restores
      // stock. A replay (or the expiry path having got there first) must not
      // restore it a second time.
      if (updated?.length) {
        await restoreStock(supabase, order.id);
      }
    } else {
      // NEW or any non-terminal status: leave the order pending and wait for
      // a definitive PAID/FAILED notification. This must not be treated as a
      // failure, or a live payment could be cancelled by an intermediate event.
      console.log('[Webhook] Ignoring non-terminal status', paymentStatus, 'for invoice', invoiceNumber);
    }

    // Audit log. `transaction_id` is UNIQUE, so retries and later status
    // changes for the same invoice collapse into the first row — the order
    // state above is what matters, this table is for debugging.
    const { error: insertError } = await supabase
      .from('processed_webhooks')
      .insert({ transaction_id: invoiceNumber, order_id: order.id, payload });

    if (insertError && insertError.code !== '23505') {
      console.error('[Webhook] Failed to record processed_webhook:', JSON.stringify(insertError));
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    // Return 5xx rather than 200 — acknowledging a crash guarantees the
    // notification is lost, while a non-2xx leaves room for a retry.
    console.error('[IremboPay] Webhook CRASH:', err.message, err.stack);
    return new Response('Internal Server Error', { status: 500 });
  }
}
