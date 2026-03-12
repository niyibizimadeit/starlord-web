import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('ref');
  const phone = searchParams.get('phone');

  // Both parameters required together (privacy guard)
  if (!ref || !phone) {
    return Response.json(
      { error: 'Both order reference and phone number are required' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Get order with customer phone validation
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_id,
        quantity,
        price_at_time,
        products:product_id (
          name,
          image_url
        )
      )
    `)
    .eq('reference', ref.toUpperCase())
    .eq('customer_phone', phone)
    .single();

  if (error || !order) {
    return Response.json(
      { error: 'Order not found. Please check your reference and phone number.' },
      { status: 404 }
    );
  }

  // Mask sensitive data for display
  const maskedPhone = phone.slice(0, 4) + 'xxx' + phone.slice(-3);
  const firstName = order.customer_name.split(' ')[0];

  return Response.json({
    order: {
      id: order.id,
      reference: order.reference,
      customerName: firstName,
      customerPhone: maskedPhone,
      deliveryAddress: order.delivery_address.split(',')[0], // Show only area
      subtotal: order.subtotal,
      deliveryFee: order.delivery_fee,
      total: order.total,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
      items: order.order_items.map(item => ({
        id: item.id,
        productId: item.product_id,
        name: item.products?.name || 'Product',
        imageUrl: item.products?.image_url || null,
        quantity: item.quantity,
        priceAtTime: item.price_at_time,
      })),
    }
  });
}

