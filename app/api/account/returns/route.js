import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId, note, returnSlot } = await request.json();
    if (!orderId) return Response.json({ error: 'Order ID required' }, { status: 400 });
    if (!note?.trim()) return Response.json({ error: 'Please provide a reason for the return' }, { status: 400 });

    const serviceClient = createServiceClient();

    const { data: order } = await serviceClient
      .from('orders')
      .select('id, status, updated_at, created_at')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.status !== 'delivered') {
      return Response.json({ error: 'Only delivered orders can be returned' }, { status: 400 });
    }

    // ── 6-hour window check ───────────────────────────────────────
    const deliveredAt = new Date(order.updated_at || order.created_at);
    const hoursElapsed = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed > 6) {
      return Response.json({ error: 'Return window has expired (6 hours from delivery)' }, { status: 400 });
    }

    // Log return request
    await serviceClient.from('admin_logs').insert({
      action:    'return_request',
      entity:    'order',
      entity_id: orderId,
      details:   {
        user_id:     user.id,
        note:        note.trim(),
        return_slot: returnSlot || null,
        terms_agreed: true,
      },
    });

    // Update order status
    const { error: updateError } = await serviceClient
      .from('orders')
      .update({ status: 'return_requested' })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Returns] Update failed:', updateError.message);
      return Response.json({ error: 'Failed to submit return request' }, { status: 500 });
    }

    return Response.json({ success: true });
    

  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}