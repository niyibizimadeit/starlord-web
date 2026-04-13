import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) return Response.json({ error: 'Token required' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, reference, customer_name, status,
      order_items(
        product_id, quantity,
        products(id, name, image_url)
      )
    `)
    .eq('review_token', token)
    .single();

  if (!order) return Response.json({ error: 'Invalid or expired link' }, { status: 404 });
  if (order.status !== 'delivered') {
    return Response.json({ error: 'Reviews are only available after delivery' }, { status: 400 });
  }

  return Response.json({ order });
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) return Response.json({ error: 'Token required' }, { status: 400 });

  const { productId, rating, comment } = await request.json();

  if (!productId || !rating || !comment?.trim()) {
    return Response.json({ error: 'All fields required' }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return Response.json({ error: 'Rating must be 1-5' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify token and order
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, customer_name')
    .eq('review_token', token)
    .single();

  if (!order) return Response.json({ error: 'Invalid link' }, { status: 404 });
  if (order.status !== 'delivered') {
    return Response.json({ error: 'Order not yet delivered' }, { status: 400 });
  }

  // Verify product belongs to this order
  const { data: orderItem } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', order.id)
    .eq('product_id', productId)
    .single();

  if (!orderItem) {
    return Response.json({ error: 'Product not in this order' }, { status: 403 });
  }

  // Check not already reviewed via this token
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', order.id)
    .eq('product_id', productId)
    .single();

  if (existing) {
    return Response.json({ error: 'You already reviewed this product' }, { status: 400 });
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      product_id:    productId,
      order_id:      order.id,
      user_id:       null, // guest review
      reviewer_name: order.customer_name,
      rating:        Number(rating),
      comment:       comment.trim().slice(0, 1000),
      is_visible:    true,
    })
    .select('id, rating, comment, created_at, reviewer_name')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, review });
}