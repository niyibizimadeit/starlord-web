import { createServiceClient } from '@/lib/supabase/server';

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

function checkSecret(secret) {
  return secret === process.env.ADMIN_SECRET;
}

async function log(supabase, action, entity_type, entity_id, entity_ref, details = {}) {
  await supabase.from('admin_logs').insert([{ action, entity_type, entity_id, entity_ref, details }]);
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (!checkSecret(searchParams.get('secret'))) return unauthorized();

  const supabase = createServiceClient();
  const type     = searchParams.get('type') || 'orders';

  // ── orders ──
  if (type === 'orders') {
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    let query = supabase
      .from('orders')
      .select('id, reference, customer_name, customer_phone, delivery_address, subtotal, delivery_fee, total, status, payment_status, payment_method, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (status !== 'all') query = query.eq('status', status);
    if (search) {
      query = query.or(
        `reference.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  // ── order detail ──
  if (type === 'order_detail') {
    const id = searchParams.get('id');
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items(id, quantity, price_at_time, products(id, name, image_url, category))`)
      .eq('id', id)
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const { data: logs } = await supabase
      .from('admin_logs')
      .select('*')
      .eq('entity_id', id)
      .order('created_at', { ascending: true });

    return Response.json({ data: { ...data, logs: logs || [] } });
  }

  // ── products ──
  if (type === 'products') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  // ── analytics ──
  if (type === 'analytics') {
    const period = searchParams.get('period') || 'month';
    const now    = new Date();
    let from;
    if (period === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (period === 'week') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, status, payment_status, created_at')
      .gte('created_at', from);

    const { data: items } = await supabase
      .from('order_items')
      .select('quantity, price_at_time, products(id, name, category)')
      .gte('created_at', from);

    const active  = orders?.filter(o => o.status !== 'cancelled' && o.status !== 'stock_conflict') || [];
    const paid    = orders?.filter(o => o.payment_status === 'paid') || [];
    const revenue = paid.reduce((s, o) => s + o.total, 0);
    const avg     = paid.length > 0 ? Math.round(revenue / paid.length) : 0;

    // status breakdown
    const statusCounts = active.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // top products by revenue
    const productMap = {};
    items?.forEach(item => {
      if (!item.products) return;
      const pid = item.products.id;
      if (!productMap[pid]) productMap[pid] = { name: item.products.name, category: item.products.category, qty: 0, revenue: 0 };
      productMap[pid].qty     += item.quantity;
      productMap[pid].revenue += item.quantity * item.price_at_time;
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // daily revenue for chart (last 14 days)
    const { data: allOrders } = await supabase
      .from('orders')
      .select('total, payment_status, created_at')
      .gte('created_at', new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString())
      .eq('payment_status', 'paid');

    const dailyMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = 0;
    }
    allOrders?.forEach(o => {
      const key = o.created_at.slice(0, 10);
      if (dailyMap[key] !== undefined) dailyMap[key] += o.total;
    });
    const dailyRevenue = Object.entries(dailyMap).map(([date, total]) => ({ date, total }));

    return Response.json({
      data: {
        revenue,
        totalOrders: active.length,
        paidOrders:  paid.length,
        avg,
        delivered:   statusCounts.delivered || 0,
        pending:     statusCounts.pending    || 0,
        dispatched:  statusCounts.dispatched || 0,
        cancelled:   orders?.filter(o => o.status === 'cancelled').length || 0,
        statusCounts,
        topProducts,
        dailyRevenue,
      },
    });
  }

  // ── logs ──
  if (type === 'logs') {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  // ── stock alerts ──
  if (type === 'stock_alerts') {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock, category')
      .lte('stock', 5)
      .eq('is_active', true)
      .order('stock', { ascending: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  return Response.json({ error: 'Invalid type' }, { status: 400 });
}

// ─── POST (create product) ────────────────────────────────────────────────────
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  if (!checkSecret(searchParams.get('secret'))) return unauthorized();

  const body     = await request.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('products')
    .insert([{
      name:        body.name,
      description: body.description || '',
      category:    body.category,
      price:       parseInt(body.price),
      old_price:   body.old_price ? parseInt(body.old_price) : null,
      stock:       parseInt(body.stock),
      image_url:   body.image_url  || null,
      badge:       body.badge      || null,
      is_active:   true,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await log(supabase, 'PRODUCT_CREATED', 'product', data.id, data.name, {
    price: data.price, stock: data.stock, category: data.category,
  });

  return Response.json({ data });
}

// ─── PATCH (update order status or product) ───────────────────────────────────
export async function PATCH(request) {
  const { searchParams } = new URL(request.url);
  if (!checkSecret(searchParams.get('secret'))) return unauthorized();

  const body     = await request.json();
  const supabase = createServiceClient();

  if (body.type === 'order_status') {
    const { data: existing } = await supabase
      .from('orders')
      .select('status, reference')
      .eq('id', body.id)
      .single();

    const { error } = await supabase
      .from('orders')
      .update({ status: body.status })
      .eq('id', body.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    await log(supabase, 'ORDER_STATUS_CHANGED', 'order', body.id, existing?.reference, {
      from: existing?.status, to: body.status,
    });

    return Response.json({ success: true });
  }

  if (body.type === 'product') {
    const { data: existing } = await supabase
      .from('products')
      .select('name, price, stock, is_active')
      .eq('id', body.id)
      .single();

    const updates = {
      price:     parseInt(body.price),
      stock:     parseInt(body.stock),
      is_active: body.is_active,
    };
    if (body.name)        updates.name        = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category)    updates.category    = body.category;
    if (body.image_url !== undefined)   updates.image_url   = body.image_url;
    if (body.badge !== undefined)       updates.badge       = body.badge;
    if (body.old_price !== undefined)   updates.old_price   = body.old_price ? parseInt(body.old_price) : null;

    const { error } = await supabase.from('products').update(updates).eq('id', body.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const changes = {};
    if (existing?.price    !== parseInt(body.price))    changes.price    = { from: existing?.price,    to: parseInt(body.price) };
    if (existing?.stock    !== parseInt(body.stock))    changes.stock    = { from: existing?.stock,    to: parseInt(body.stock) };
    if (existing?.is_active !== body.is_active)         changes.is_active= { from: existing?.is_active, to: body.is_active };

    await log(supabase, 'PRODUCT_UPDATED', 'product', body.id, existing?.name, changes);

    return Response.json({ success: true });
  }

  if (body.type === 'stock_adjust') {
    const { data: existing } = await supabase
      .from('products')
      .select('name, stock')
      .eq('id', body.id)
      .single();

    const newStock = Math.max(0, (existing?.stock || 0) + body.adjustment);
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', body.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    await log(supabase, 'STOCK_ADJUSTED', 'product', body.id, existing?.name, {
      from: existing?.stock, to: newStock, adjustment: body.adjustment, reason: body.reason || '',
    });

    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid type' }, { status: 400 });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  if (!checkSecret(searchParams.get('secret'))) return unauthorized();

  const { id }   = await request.json();
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('products')
    .select('name')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await log(supabase, 'PRODUCT_DELETED', 'product', id, existing?.name, {});

  return Response.json({ success: true });
}