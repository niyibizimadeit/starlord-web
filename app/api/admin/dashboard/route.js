import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Simple secret check — change this to something only you know
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const type = searchParams.get('type') || 'orders';

  if (type === 'orders') {
    const { data } = await supabase
      .from('orders')
      .select(`*, order_items(quantity, price_at_time, products(name, image_url))`)
      .order('created_at', { ascending: false })
      .limit(100);
    return Response.json({ data });
  }

  if (type === 'products') {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    return Response.json({ data });
  }

  if (type === 'analytics') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: orders } = await supabase
      .from('orders')
      .select('total, status, payment_status, created_at')
      .gte('created_at', startOfMonth);

    const revenue     = orders?.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0) || 0;
    const totalOrders = orders?.length || 0;
    const delivered   = orders?.filter(o => o.status === 'delivered').length || 0;
    const pending     = orders?.filter(o => o.status === 'pending').length || 0;

    return Response.json({ data: { revenue, totalOrders, delivered, pending } });
  }

  return Response.json({ error: 'Invalid type' }, { status: 400 });
}

export async function PATCH(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createServiceClient();

  if (body.type === 'order_status') {
    const { error } = await supabase
      .from('orders')
      .update({ status: body.status })
      .eq('id', body.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  if (body.type === 'product') {
    const { error } = await supabase
      .from('products')
      .update({ price: body.price, stock: body.stock, is_active: body.is_active })
      .eq('id', body.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid type' }, { status: 400 });
}