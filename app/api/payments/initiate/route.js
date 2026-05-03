import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { orderId, reference, amount, phone, method } = await request.json();

    if (!orderId || !reference || !amount || !phone || !method) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify order is still pending
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('id', orderId)
      .eq('reference', reference)
      .single();

    if (orderError || !order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.payment_status !== 'pending') {
      return Response.json({ error: 'Order already processed' }, { status: 409 });
    }

    // TODO: Confirm endpoint, auth format, and payload shape with IremboPay sandbox docs
    const response = await fetch(`${process.env.IREMBOPAY_BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.IREMBOPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount,
        phone,
        reference,
        payment_method: method,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/irembopay`,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('IremboPay initiate error:', result);
      return Response.json({ error: 'Payment initiation failed' }, { status: 502 });
    }

    // TODO: Confirm transaction ID field name in IremboPay's response
    const transactionId = result.transaction_id || result.transactionId || result.id;

    if (transactionId) {
      await supabase
        .from('orders')
        .update({ irembopay_transaction_id: transactionId })
        .eq('id', orderId);
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('Payment initiate error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}