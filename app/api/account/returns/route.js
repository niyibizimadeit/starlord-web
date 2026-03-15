import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId, note } = await request.json();
    if (!orderId) return Response.json({ error: 'Order ID required' }, { status: 400 });

    const serviceClient = createServiceClient();

    // Verify order belongs to this user
    const { data: order } = await serviceClient
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.status !== 'delivered') {
      return Response.json({ error: 'Only delivered orders can be returned' }, { status: 400 });
    }

    // Log return request in admin_logs
    await serviceClient.from('admin_logs').insert({
      action:    'return_request',
      entity:    'order',
      entity_id: orderId,
      details:   { user_id: user.id, note: note || 'No reason provided' },
    });

    // Update order status to return_requested
    await serviceClient
      .from('orders')
      .update({ status: 'return_requested' })
      .eq('id', orderId);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}