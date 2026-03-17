import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) return Response.json({ error: 'productId required' }, { status: 400 });

    const supabase = createServiceClient();
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, users(full_name)')
      .eq('product_id', productId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    return Response.json({ reviews: reviews || [] });
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'You must be logged in to review' }, { status: 401 });

    const { productId, orderId, rating, comment } = await request.json();

    if (!productId || !orderId || !rating || !comment?.trim()) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return Response.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Verify the user actually ordered this product
    const { data: orderItem } = await serviceClient
      .from('order_items')
      .select('id, orders(user_id, status)')
      .eq('product_id', productId)
      .eq('order_id', orderId)
      .single();

    if (!orderItem) {
      return Response.json({ error: 'You can only review products you have ordered' }, { status: 403 });
    }
    if (orderItem.orders?.user_id !== user.id) {
      return Response.json({ error: 'This order does not belong to you' }, { status: 403 });
    }
    if (orderItem.orders?.status !== 'delivered') {
      return Response.json({ error: 'You can only review delivered orders' }, { status: 403 });
    }

    // Check if already reviewed
    const { data: existing } = await serviceClient
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .eq('order_id', orderId)
      .single();

    if (existing) {
      return Response.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }

    const { data: review, error } = await serviceClient
      .from('reviews')
      .insert({
        product_id: productId,
        user_id:    user.id,
        order_id:   orderId,
        rating:     Number(rating),
        comment:    comment.trim().slice(0, 1000),
        is_visible: true,
      })
      .select('id, rating, comment, created_at, users(full_name)')
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true, review });
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}