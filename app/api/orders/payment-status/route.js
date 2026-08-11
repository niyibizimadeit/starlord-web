import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('ref');
  // Strip spaces to match how the checkout API stores phones
  const phone = (searchParams.get('phone') || '').replace(/\s/g, '');

  if (!reference || !phone) {
    return Response.json({ error: 'Missing ref or phone' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, payment_status, status, payment_expires_at, created_at')
    .eq('reference', reference)
    .eq('customer_phone', phone)
    .single();

  if (error || !order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  // ── Auto-fail stale pending orders ────────────────────────────────
  // If the order is still pending and was created more than 2 minutes
  // ago with no webhook arriving, the sandbox isn't going to respond.
  // Mark it as failed and restore stock so the DB stays consistent.
  const STALE_THRESHOLD_MS = 120_000; // 2 minutes
  if (
    order.status === 'pending' &&
    order.payment_status === 'pending' &&
    order.created_at &&
    Date.now() - new Date(order.created_at).getTime() > STALE_THRESHOLD_MS
  ) {
    try {
      await supabase
        .from('orders')
        .update({ status: 'payment_failed', payment_status: 'failed' })
        .eq('id', order.id)
        .eq('status', 'pending')
        .eq('payment_status', 'pending');

      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id);

      if (items?.length) {
        for (const item of items) {
          await supabase.rpc('restore_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          });
        }
      }

      console.log('[payment-status] Auto-failed stale order:', order.id);
      return Response.json({
        paymentStatus: 'failed',
        orderStatus: 'payment_failed',
        expired: false,
      });
    } catch (err) {
      console.error('[payment-status] Auto-fail error:', err);
      // Fall through to return the current DB state if the update fails
    }
  }

  return Response.json({
    paymentStatus: order.payment_status,
    orderStatus:   order.status,
    expired:       order.payment_expires_at
                     ? new Date() > new Date(order.payment_expires_at)
                     : false,
  });
}
