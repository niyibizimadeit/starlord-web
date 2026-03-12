import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// PawaPay webhook handler - CRITICAL SECURITY ROUTE
export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-pawapay-signature');

    // VULN-02: Verify HMAC-SHA256 signature before processing
    const expectedSignature = crypto
      .createHmac('sha256', process.env.PAWAPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { deposit_id, status, customer_reference } = payload;

    // VULN-08: Check for webhook replay
    const supabase = createServiceClient();

    const { data: existingWebhook } = await supabase
      .from('processed_webhooks')
      .select('pawapay_deposit_id')
      .eq('pawapay_deposit_id', deposit_id)
      .single();

    if (existingWebhook) {
      // Already processed - return 200 to avoid PawaPay retries
      return new Response('OK', { status: 200 });
    }

    // Insert webhook to prevent replay
    await supabase
      .from('processed_webhooks')
      .insert({ pawapay_deposit_id: deposit_id });

    // Find order by reference
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('reference', customer_reference)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', customer_reference);
      return new Response('Order not found', { status: 404 });
    }

    if (status === 'COMPLETED') {
      // Update order payment info
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: payload.network?.toLowerCase() || order.payment_method,
          pawapay_deposit_id: deposit_id,
        })
        .eq('id', order.id);

      // Deduct stock with a simple guard on current stock
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id);

      if (orderItems) {
        for (const item of orderItems) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (!product) continue;

          if (product.stock < item.quantity) {
            await supabase
              .from('orders')
              .update({ status: 'stock_conflict' })
              .eq('id', order.id);
            break;
          }

          await supabase
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.product_id);
        }
      }

      // TODO: Fire SMS + push notifications
    } else if (status === 'FAILED' || status === 'REJECTED') {
      await supabase
        .from('orders')
        .update({
          status: 'pending',
          payment_status: 'failed',
        })
        .eq('id', order.id);

      // TODO: Send payment failed SMS
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Always return 200 to PawaPay to avoid retries on unexpected errors
    return new Response('OK', { status: 200 });
  }
}
