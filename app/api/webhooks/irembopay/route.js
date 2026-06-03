import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// ─── TODO: Confirm these with IremboPay sandbox docs next week ────────────────
// Expected env vars to add to Vercel:
//   IREMBOPAY_WEBHOOK_SECRET — used to verify HMAC signature
// Expected webhook payload shape (update once you have sandbox access):
//   { transaction_id, status, order_reference, payment_method, ... }
// Expected status values (update once confirmed):
//   SUCCESS / FAILED / CANCELLED
// Expected signature header name (update once confirmed):
//   x-irembopay-signature
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const rawBody = await request.text();

    // Guard: skip verification if webhook secret isn't configured yet (pre-launch)
    if (!process.env.IREMBOPAY_WEBHOOK_SECRET) {
      console.warn('[IremboPay] IREMBOPAY_WEBHOOK_SECRET not set — skipping signature verification');
      return new Response('OK', { status: 200 });
    }

    // TODO: Confirm signature header name with IremboPay docs
    const signature = request.headers.get('x-irembopay-signature');

    // TODO: Confirm HMAC algorithm with IremboPay docs (SHA256 assumed)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.IREMBOPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid IremboPay webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // TODO: Update these field names to match IremboPay's actual payload
    const transaction_id    = payload.transaction_id;   // IremboPay's unique ID
    const status            = payload.status;           // e.g. SUCCESS / FAILED
    const order_reference   = payload.order_reference;  // our order reference e.g. SL-XXXXXX
    const payment_method    = payload.payment_method;   // e.g. mtn_momo / airtel_money

    const supabase = createServiceClient();

    // Replay protection — prevent double-processing
    const { data: existingWebhook } = await supabase
      .from('processed_webhooks')
      .select('id')
      .eq('transaction_id', transaction_id)
      .single();

    if (existingWebhook) {
      return new Response('OK', { status: 200 });
    }

    // Find the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('reference', order_reference)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', order_reference);
      return new Response('Order not found', { status: 404 });
    }

    await supabase
      .from('processed_webhooks')
      .insert({ transaction_id, order_id: order.id, payload });

    // TODO: Replace 'SUCCESS' with IremboPay's actual success status string
    if (status === 'SUCCESS') {
      await supabase
        .from('orders')
        .update({
          status:          'confirmed',
          payment_status:  'paid',
          payment_method:  payment_method || order.payment_method,
          transaction_id,
        })
        .eq('id', order.id);

      // TODO: Fire SMS / push notifications on successful payment

    // TODO: Replace 'FAILED'/'CANCELLED' with IremboPay's actual failure statuses
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      await supabase
        .from('orders')
        .update({
          status:         'payment_failed',
          payment_status: 'failed',
        })
        .eq('id', order.id);

      // Restore reserved stock
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id);

      if (orderItems) {
        for (const item of orderItems) {
          await supabase.rpc('restore_stock', {
            p_product_id: item.product_id,
            p_quantity:   item.quantity,
          });
        }
      }

      // TODO: Send payment failed notification
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('IremboPay webhook error:', err);
    return new Response('OK', { status: 200 });
  }
}