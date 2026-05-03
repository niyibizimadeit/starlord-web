import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('ref');
  const phone     = searchParams.get('phone');

  if (!reference || !phone) {
    return Response.json({ error: 'Missing ref or phone' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('payment_status, status, payment_expires_at')
    .eq('reference', reference)
    .eq('customer_phone', phone)
    .single();

  if (error || !order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  return Response.json({
    paymentStatus: order.payment_status,
    orderStatus:   order.status,
    expired:       order.payment_expires_at
                     ? new Date() > new Date(order.payment_expires_at)
                     : false,
  });
}