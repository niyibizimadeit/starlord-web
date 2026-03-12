import { createServiceClient } from '@/lib/supabase/server';

// Public endpoint: current status + payment_status for polling
export async function GET(_request, { params }) {
  const { id } = params;

  if (!id) {
    return Response.json({ error: 'Order id is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, payment_status, reference')
    .eq('id', id)
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

