import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('irembopay-signature');
    const secretKey = process.env.IREMBOPAY_SECRET_KEY;

    if (!secretKey) {
      console.warn('[IremboPay] IREMBOPAY_SECRET_KEY not set — skipping signature verification');
    } else if (!signatureHeader) {
      console.error('[IremboPay] Missing irembopay-signature header');
      return new Response('Unauthorized', { status: 401 });
    } else {
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

      console.log('[Webhook] Timestamp:', timestamp, 'Current:', Date.now());
      console.log('[Webhook] Time diff ms:', Math.abs(Date.now() - parseInt(timestamp, 10)));

      if (Math.abs(Date.now() - parseInt(timestamp, 10)) > 5 * 60 * 1000) {
        console.error('[IremboPay] Webhook timestamp too old');
        return new Response('Unauthorized', { status: 401 });
      }

      const signedPayload = `${timestamp}#${rawBody}`;
      const expectedSig = crypto
        .createHmac('sha256', secretKey)
        .update(signedPayload)
        .digest('hex');

      const signaturesMatch = crypto.timingSafeEqual(
        Buffer.from(expectedSig, 'hex'),
        Buffer.from(receivedSig, 'hex')
      );

      if (!signaturesMatch) {
        console.error('[IremboPay] Invalid webhook signature');
        return new Response('Unauthorized', { status: 401 });
      }
    }

    console.log('[Webhook] Signature verified, proceeding...');

    const payload = JSON.parse(rawBody);
    const data = payload.data;

    console.log('[Webhook] Full payload:', JSON.stringify(payload, null, 2));
    console.log('[Webhook] transactionId:', data?.transactionId);
    console.log('[Webhook] paymentStatus:', data?.paymentStatus);

    if (!data) {
      return new Response('Bad Request', { status: 400 });
    }

    const invoiceNumber = data.invoiceNumber;
    const paymentStatus = data.paymentStatus;
    const transactionId = data.transactionId;
    const paymentMethod = data.paymentMethod;

    const supabase = createServiceClient();

    // Check for duplicate webhook
    const { data: existing, error: dupCheckError } = await supabase
      .from('processed_webhooks')
      .select('id')
      .eq('transaction_id', invoiceNumber)
      .maybeSingle();

    if (dupCheckError) {
      console.error('[Webhook] Duplicate check error:', JSON.stringify(dupCheckError));
      return new Response('OK', { status: 200 });
    }

    if (existing) {
      console.log('[Webhook] Already processed:', invoiceNumber);
      return new Response('OK', { status: 200 });
    }

    // Find the order by reference (IremboPay's transactionId = our order reference)
    console.log('[Webhook] Looking up order by reference:', transactionId);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('reference', transactionId)
      .single();

    if (orderError) {
      console.error('[Webhook] Order lookup error:', JSON.stringify(orderError));
      return new Response('OK', { status: 200 });
    }

    if (!order) {
      console.error('[IremboPay] Order not found for reference:', transactionId);
      return new Response('OK', { status: 200 });
    }

    console.log('[Webhook] Found order:', order.id, 'status:', order.status, 'payment_status:', order.payment_status);

    // Map IremboPay payment method to our internal values (CHECK constraint requires 'mtn' or 'airtel')
    function normalizePaymentMethod(method) {
      if (!method) return 'mtn';
      const m = method.toLowerCase();
      if (m.includes('mtn') || m.includes('momo')) return 'mtn';
      if (m.includes('airtel')) return 'airtel';
      return 'mtn'; // default
    }

    // Apply the payment result
    if (paymentStatus === 'PAID') {
      console.log('[Webhook] Updating order to confirmed/paid...');

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status:                   'confirmed',
          payment_status:           'paid',
          payment_method:           normalizePaymentMethod(paymentMethod) || order.payment_method,
          irembopay_transaction_id: invoiceNumber,
        })
        .eq('id', order.id)
        .select('id');

      if (updateError) {
        console.error('[Webhook] Order update FAILED:', JSON.stringify(updateError));
      } else {
        console.log('[Webhook] Order updated successfully to confirmed/paid');
      }
    } else {
      console.log('[Webhook] Payment not PAID — status:', paymentStatus);
      await supabase
        .from('orders')
        .update({
          status:         'payment_failed',
          payment_status: 'failed',
        })
        .eq('id', order.id);

      // Restore stock
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id);

      if (orderItems?.length) {
        for (const item of orderItems) {
          await supabase.rpc('restore_stock', {
            p_product_id: item.product_id,
            p_quantity:   item.quantity,
          });
        }
      }
    }

    // Record the webhook AFTER processing (so replay protection works)
    // If the table doesn't exist yet, log the error but don't crash
    const { error: insertError } = await supabase
      .from('processed_webhooks')
      .insert({ transaction_id: invoiceNumber, order_id: order.id, payload });

    if (insertError) {
      console.error('[Webhook] Failed to record processed_webhook:', JSON.stringify(insertError));
      console.error('[Webhook] Error code:', insertError.code, 'message:', insertError.message);
      // If table doesn't exist, that's a setup issue — log but don't block payment processing
    } else {
      console.log('[Webhook] Recorded in processed_webhooks');
    }

    console.log('[Webhook] Done processing:', invoiceNumber);
    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('[IremboPay] Webhook CRASH:', err.message, err.stack);
    return new Response('OK', { status: 200 });
  }
}