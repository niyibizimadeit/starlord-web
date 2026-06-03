import { createServiceClient } from '@/lib/supabase/server';

// Public endpoint: current status + payment_status for polling.
// Requires phone verification to prevent unauthorised access.
export async function GET(_request, { params }) {
  const { id } = params;
  const { searchParams } = new URL(_request.url);
  const phone = searchParams.get('phone');

  if (!id) {
    return Response.json({ error: 'Order id is required' }, { status: 400 });
  }

  if (!phone) {
    return Response.json({ error: 'Phone number is required to verify order ownership' }, { status: 400 });
  }

  const cleanPhone = phone.replace(/\s/g, '');

  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, payment_status, reference')
    .eq('id', id)
    .eq('customer_phone', cleanPhone)
    .single();

  if (error || !order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  return Response.json({
    id: order.id,
    reference: order.reference,
    status: order.status,
    paymentStatus: order.payment_status,
  });
}

