import { createServiceClient } from '@/lib/supabase/server';

const BASE_URL = process.env.IREMBOPAY_BASE_URL;
const INVOICE_LOOKUP_TIMEOUT_MS = 8_000;

function normalizePaymentMethod(method, fallback) {
  if (!method) return fallback;
  const m = String(method).toLowerCase();
  if (m.includes('airtel')) return 'airtel';
  if (m.includes('mtn')) return 'mtn';
  if (m.includes('momo')) return fallback;
  if (m.includes('card')) return 'card';
  return fallback;
}

// Ask IremboPay directly what the invoice's status is. Used when the payment
// window has closed and the webhook never arrived — a dropped notification
// must not turn a successful payment into a failure.
async function fetchInvoice(reference) {
  if (!BASE_URL || !reference) return null;

  try {
    const res = await fetch(
      `${BASE_URL}/payments/invoices/${encodeURIComponent(reference)}`,
      {
        headers: {
          'irembopay-secretkey': process.env.IREMBOPAY_SECRET_KEY,
          'X-API-Version': '2',
          accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(INVOICE_LOOKUP_TIMEOUT_MS),
      },
    );

    if (!res.ok) {
      console.error('[payment-status] Invoice lookup failed:', res.status);
      return null;
    }

    const json = await res.json();
    return json?.data || null;
  } catch (err) {
    console.error('[payment-status] Invoice lookup error:', err.message);
    return null;
  }
}

async function restoreStock(supabase, orderId) {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (error) {
    console.error('[payment-status] Could not load items for stock restore:', JSON.stringify(error));
    return;
  }

  for (const item of items || []) {
    const { error: rpcError } = await supabase.rpc('restore_stock', {
      p_product_id: item.product_id,
      p_quantity:   item.quantity,
    });
    if (rpcError) {
      console.error('[payment-status] restore_stock failed:', JSON.stringify(rpcError));
    }
  }
}

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
    .select(`
      id, payment_status, status, payment_expires_at, created_at,
      irembopay_transaction_id, payment_method
    `)
    .eq('reference', reference)
    .eq('customer_phone', phone)
    .single();

  if (error || !order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  const expired = order.payment_expires_at
    ? new Date() > new Date(order.payment_expires_at)
    : false;

  if (order.payment_status !== 'pending') {
    return Response.json({
      paymentStatus: order.payment_status,
      orderStatus:   order.status,
      expired,
    });
  }

  // The webhook is the fast path, but it must not be the only one. When the
  // browser asks us to verify (roughly every 12s), ask IremboPay directly —
  // this covers a delayed or dropped notification, and environments where
  // the callback URL isn't reachable (e.g. local dev without a tunnel).
  // Don't call before the customer has had a chance to approve, and never
  // fail an order outside the expiry path. The `verify` flag only ever
  // triggers a read; it cannot change the order outside the expiry path.
  const verifyRequested = searchParams.get('verify') === '1';
  const orderAgeMs = order.created_at
    ? Date.now() - new Date(order.created_at).getTime()
    : 0;
  const shouldVerify = expired || (verifyRequested && orderAgeMs > 10_000);

  if (!shouldVerify) {
    return Response.json({
      paymentStatus: order.payment_status,
      orderStatus:   order.status,
      expired,
    });
  }

  const invoice = await fetchInvoice(
    order.irembopay_transaction_id || order.reference,
  );

  if (invoice?.paymentStatus === 'PAID') {
    const { error: confirmError } = await supabase
      .from('orders')
      .update({
        status:                   'confirmed',
        payment_status:           'paid',
        payment_method:           normalizePaymentMethod(invoice.paymentMethod, order.payment_method),
        irembopay_transaction_id: invoice.invoiceNumber || order.irembopay_transaction_id,
      })
      .eq('id', order.id)
      .eq('payment_status', 'pending');

    if (confirmError) {
      console.error('[payment-status] Confirm failed:', JSON.stringify(confirmError));
      return Response.json({
        paymentStatus: order.payment_status,
        orderStatus:   order.status,
        expired,
      });
    }

    return Response.json({
      paymentStatus: 'paid',
      orderStatus:   'confirmed',
      expired:       false,
    });
  }

  // Still pending and not expired — the customer may still approve.
  if (!expired) {
    return Response.json({
      paymentStatus: 'pending',
      orderStatus:   order.status,
      expired:       false,
    });
  }

  // Genuinely unpaid. Move it out of pending, and restore the reserved
  // stock only in the request that won that transition — two concurrent
  // polls must not restore it twice.
  const { data: updated, error: updateError } = await supabase
    .from('orders')
    // The DB's orders_status_check does not allow 'payment_failed'; use the
    // cancelled state so the update actually applies and stock is restored.
    .update({ status: 'cancelled', payment_status: 'failed' })
    .eq('id', order.id)
    .eq('status', 'pending')
    .eq('payment_status', 'pending')
    .select('id');

  if (updateError) {
    console.error('[payment-status] Expiry update failed:', JSON.stringify(updateError));
    return Response.json({
      paymentStatus: order.payment_status,
      orderStatus:   order.status,
      expired:       true,
    });
  }

  if (updated?.length) {
    await restoreStock(supabase, order.id);
  }

  return Response.json({
    paymentStatus: 'failed',
    orderStatus:   'cancelled',
    expired:       true,
  });
}
