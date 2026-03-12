import { createServiceClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Valid status transitions
const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'];

// Helper to check admin role
async function getAdminUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Not found', status: 404 };
  }

  return { user };
}

// Send SMS notification (placeholder - integrate with Africa's Talking)
async function sendStatusSMS(phone, reference, status) {
  const messages = {
    confirmed: `Order ${reference} confirmed. RWF received. We will contact you shortly.`,
    preparing: `Your order ${reference} is being prepared and will be collected by our courier shortly.`,
    dispatched: `Your order ${reference} is on its way. Our courier will contact you on arrival.`,
    delivered: `Your order ${reference} has been delivered. Thank you for shopping with STARLORD GROUP!`,
    cancelled: `Your order ${reference} has been cancelled. Contact us if you have questions.`,
  };
  
  const message = messages[status];
  if (message) {
    // TODO: Integrate with Africa's Talking
    console.log(`SMS to ${phone}: ${message}`);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const auth = await getAdminUser(supabase);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { status } = await request.json();

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return Response.json(
        { error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Get current order to check status
    const { data: order, error: fetchError } = await serviceClient
      .from('orders')
      .select('status, customer_phone, reference')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prevent cancelling already dispatched orders
    if (order.status === 'dispatched' && status === 'cancelled') {
      return Response.json({ error: 'Cannot cancel a dispatched order' }, { status: 400 });
    }

    // Update status
    const { error: updateError } = await serviceClient
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      console.error('Update status error:', updateError);
      return Response.json({ error: 'Failed to update status' }, { status: 500 });
    }

    // Send SMS notification
    await sendStatusSMS(order.customer_phone, order.reference, status);

    return Response.json({ success: true, status });
  } catch (err) {
    console.error('Update status error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

