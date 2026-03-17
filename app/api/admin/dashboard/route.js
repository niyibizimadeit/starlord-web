import { createServiceClient } from '@/lib/supabase/server';

function unauthorized() { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
function checkSecret(s)  { return s === process.env.ADMIN_SECRET; }
async function log(supabase, action, entity_type, entity_id, entity_ref, details = {}) {
  await supabase.from('admin_logs').insert([{ action, entity_type, entity_id, entity_ref, details }]);
}
function periodStart(period) {
  const now = new Date();
  if (period === 'today')   return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  if (period === 'week')    return new Date(now.getTime() - 7 * 864e5).toISOString();
  if (period === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString();
  if (period === 'year')    return new Date(now.getFullYear(), 0, 1).toISOString();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (!checkSecret(searchParams.get('secret'))) return unauthorized();
  const supabase = createServiceClient();
  const type     = searchParams.get('type') || 'orders';

  if (type === 'orders') {
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    let query = supabase.from('orders').select('id, reference, customer_name, customer_phone, delivery_address, subtotal, delivery_fee, total, status, payment_status, payment_method, created_at').order('created_at', { ascending: false }).limit(200);
    if (status !== 'all') query = query.eq('status', status);
    if (search) query = query.or(`reference.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  if (type === 'order_detail') {
    const id = searchParams.get('id');
    const { data, error } = await supabase.from('orders').select(`*, order_items(id, quantity, price_at_time, products(id, name, image_url, category))`).eq('id', id).single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const { data: logs } = await supabase.from('admin_logs').select('*').eq('entity_id', id).order('created_at', { ascending: true });
    return Response.json({ data: { ...data, logs: logs || [] } });
  }

  if (type === 'products') {
    const { data, error } = await supabase.from('products').select(`*, product_images(id, url, sort_order)`).order('created_at', { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const sorted = data?.map(p => ({ ...p, product_images: (p.product_images || []).sort((a, b) => a.sort_order - b.sort_order) }));
    return Response.json({ data: sorted });
  }

  if (type === 'product_images') {
    const { data, error } = await supabase.from('product_images').select('*').eq('product_id', searchParams.get('productId')).order('sort_order', { ascending: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  if (type === 'categories') {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  if (type === 'settings') {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const map = Object.fromEntries((data || []).map(r => [r.key, r.value]));
    return Response.json({ data: map });
  }

  if (type === 'users') {
    const search = searchParams.get('search') || '';
    let query = supabase.from('users').select(`id, phone, full_name, email, role, created_at, orders(id, total, status)`).order('created_at', { ascending: false }).limit(200);
    if (search) query = query.or(`phone.ilike.%${search}%,full_name.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const enriched = data?.map(u => ({ ...u, order_count: (u.orders || []).filter(o => o.status !== 'cancelled').length, total_spent: (u.orders || []).filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0) }));
    return Response.json({ data: enriched });
  }

  if (type === 'user_detail') {
    const { data, error } = await supabase.from('users').select(`id, phone, full_name, email, role, created_at, orders(id, reference, total, status, payment_status, created_at)`).eq('id', searchParams.get('id')).single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const active = (data.orders || []).filter(o => o.status !== 'cancelled');
    return Response.json({ data: { ...data, orders: (data.orders || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), order_count: active.length, total_spent: active.reduce((s, o) => s + (o.total || 0), 0) } });
  }

  if (type === 'segments') {
    const { data: users, error } = await supabase.from('users').select(`id, phone, full_name, email, created_at, orders(id, total, status, created_at)`);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5);
    const enriched = users?.map(u => {
      const active = (u.orders || []).filter(o => o.status !== 'cancelled');
      const sorted = (u.orders || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { ...u, total_spent: active.reduce((s, o) => s + (o.total || 0), 0), order_count: active.length, last_order_date: sorted[0]?.created_at || null };
    });
    return Response.json({ data: {
      high_value: enriched?.filter(u => u.total_spent >= 50000).sort((a, b) => b.total_spent - a.total_spent) || [],
      frequent:   enriched?.filter(u => u.order_count >= 3).sort((a, b) => b.order_count - a.order_count) || [],
      inactive:   enriched?.filter(u => u.order_count > 0 && u.last_order_date && new Date(u.last_order_date) < thirtyDaysAgo) || [],
    }});
  }

  if (type === 'analytics') {
    const period = searchParams.get('period') || 'month';
    const from   = periodStart(period);
    const now    = new Date();
    const { data: orders } = await supabase.from('orders').select('id, total, status, payment_status, created_at').gte('created_at', from);
    const { data: items }  = await supabase.from('order_items').select('quantity, price_at_time, products(id, name, category)').gte('created_at', from);
    const active  = orders?.filter(o => o.status !== 'cancelled' && o.status !== 'stock_conflict') || [];
    const paid    = orders?.filter(o => o.payment_status === 'paid') || [];
    const revenue = paid.reduce((s, o) => s + o.total, 0);
    const avg     = paid.length > 0 ? Math.round(revenue / paid.length) : 0;
    const statusCounts = active.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
    const productMap = {};
    items?.forEach(item => {
      if (!item.products) return;
      const pid = item.products.id;
      if (!productMap[pid]) productMap[pid] = { name: item.products.name, category: item.products.category, qty: 0, revenue: 0 };
      productMap[pid].qty += item.quantity; productMap[pid].revenue += item.quantity * item.price_at_time;
    });
    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const { data: allOrders } = await supabase.from('orders').select('total, payment_status, created_at').gte('created_at', new Date(now.getTime() - 13 * 864e5).toISOString()).eq('payment_status', 'paid');
    const dailyMap = {};
    for (let i = 13; i >= 0; i--) { const d = new Date(now.getTime() - i * 864e5); dailyMap[d.toISOString().slice(0, 10)] = 0; }
    allOrders?.forEach(o => { const k = o.created_at.slice(0, 10); if (dailyMap[k] !== undefined) dailyMap[k] += o.total; });
    return Response.json({ data: { revenue, totalOrders: active.length, paidOrders: paid.length, avg, delivered: statusCounts.delivered || 0, pending: statusCounts.pending || 0, dispatched: statusCounts.dispatched || 0, cancelled: orders?.filter(o => o.status === 'cancelled').length || 0, statusCounts, topProducts, dailyRevenue: Object.entries(dailyMap).map(([date, total]) => ({ date, total })) } });
  }

  if (type === 'logs') {
    const { data, error } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  if (type === 'stock_alerts') {
    const { data, error } = await supabase.from('products').select('id, name, stock, category').lte('stock', 5).eq('is_active', true).order('stock', { ascending: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  if (type === 'export_orders') {
    const { data, error } = await supabase.from('orders').select('reference, created_at, customer_name, customer_phone, delivery_address, subtotal, delivery_fee, total, status, payment_status, payment_method').order('created_at', { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  if (type === 'export_products') {
    const { data, error } = await supabase.from('products').select('id, name, category, price, old_price, stock, badge, is_active, created_at').order('created_at', { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  if (type === 'export_users') {
    const { data, error } = await supabase.from('users').select(`phone, full_name, email, created_at, orders(total, status)`).order('created_at', { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const enriched = data?.map(u => ({ phone: u.phone, full_name: u.full_name, email: u.email, created_at: u.created_at, order_count: (u.orders || []).filter(o => o.status !== 'cancelled').length, total_spent: (u.orders || []).filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0) }));
    return Response.json({ data: enriched });
  }

  if (type === 'sync_images') {
    const { data: products, error: pErr } = await supabase.from('products').select('id, name');
    if (pErr) return Response.json({ error: pErr.message }, { status: 500 });
    let created = 0; let skipped = 0;
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products`;
    for (const product of products || []) {
      const { data: files } = await supabase.storage.from('products').list(product.id, { limit: 100 });
      if (!files?.length) continue;
      const { data: existing } = await supabase.from('product_images').select('url').eq('product_id', product.id);
      const existingUrls = new Set((existing || []).map(r => r.url));
      let sortOrder = (existing || []).length;
      for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue;
        const url = `${base}/${product.id}/${file.name}`;
        if (existingUrls.has(url)) { skipped++; continue; }
        await supabase.from('product_images').insert([{ product_id: product.id, url, sort_order: sortOrder++ }]);
        created++;
      }
    }
    return Response.json({ data: { created, skipped, message: `Sync complete — ${created} images linked, ${skipped} already existed.` } });
  }

  if (type === 'reviews') {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, is_visible, created_at, product_id, products(name), users(full_name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  }

  return Response.json({ error: 'Invalid type' }, { status: 400 });
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  if (!checkSecret(searchParams.get('secret'))) return unauthorized();
  const body = await request.json();
  const supabase = createServiceClient();
  if (body.type === 'category') {
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data, error } = await supabase.from('categories').insert([{ name: body.name, slug, description: body.description || '', image_url: body.image_url || null, is_active: body.is_active ?? true, sort_order: body.sort_order ? parseInt(body.sort_order) : 0 }]).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await log(supabase, 'CATEGORY_CREATED', 'category', data.id, data.name, { slug: data.slug });
    return Response.json({ data });
  }
  const { data, error } = await supabase.from('products').insert([{ name: body.name, description: body.description || '', category: body.category, price: parseInt(body.price), old_price: body.old_price ? parseInt(body.old_price) : null, stock: parseInt(body.stock), image_url: null, badge: body.badge || null, is_active: true }]).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  await log(supabase, 'PRODUCT_CREATED', 'product', data.id, data.name, { price: data.price, stock: data.stock, category: data.category });
  return Response.json({ data });
}

export async function PATCH(request) {
  const { searchParams } = new URL(request.url);
  if (!checkSecret(searchParams.get('secret'))) return unauthorized();
  const body = await request.json();
  const supabase = createServiceClient();
  if (body.type === 'order_status') {
    const { data: ex } = await supabase.from('orders').select('status, reference').eq('id', body.id).single();
    const { error } = await supabase.from('orders').update({ status: body.status }).eq('id', body.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await log(supabase, 'ORDER_STATUS_CHANGED', 'order', body.id, ex?.reference, { from: ex?.status, to: body.status });
    return Response.json({ success: true });
  }
  if (body.type === 'product') {
    const { data: ex } = await supabase.from('products').select('name, price, stock, is_active').eq('id', body.id).single();
    const updates = { price: parseInt(body.price), stock: parseInt(body.stock), is_active: body.is_active };
    if (body.name        !== undefined) updates.name        = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category    !== undefined) updates.category    = body.category;
    if (body.badge       !== undefined) updates.badge       = body.badge;
    if (body.old_price   !== undefined) updates.old_price   = body.old_price ? parseInt(body.old_price) : null;
    const { error } = await supabase.from('products').update(updates).eq('id', body.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const changes = {};
    if (ex?.price    !== parseInt(body.price)) changes.price    = { from: ex?.price,    to: parseInt(body.price) };
    if (ex?.stock    !== parseInt(body.stock)) changes.stock    = { from: ex?.stock,    to: parseInt(body.stock) };
    if (ex?.is_active !== body.is_active)      changes.is_active = { from: ex?.is_active, to: body.is_active };
    await log(supabase, 'PRODUCT_UPDATED', 'product', body.id, ex?.name, changes);
    return Response.json({ success: true });
  }
  if (body.type === 'stock_adjust') {
    const { data: ex } = await supabase.from('products').select('name, stock').eq('id', body.id).single();
    const newStock = Math.max(0, (ex?.stock || 0) + body.adjustment);
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', body.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await log(supabase, 'STOCK_ADJUSTED', 'product', body.id, ex?.name, { from: ex?.stock, to: newStock, adjustment: body.adjustment, reason: body.reason || '' });
    return Response.json({ success: true });
  }
  if (body.type === 'category') {
    const { data: ex } = await supabase.from('categories').select('name').eq('id', body.id).single();
    const updates = {};
    ['name','slug','description','image_url','is_active'].forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
    if (body.sort_order !== undefined) updates.sort_order = parseInt(body.sort_order);
    const { error } = await supabase.from('categories').update(updates).eq('id', body.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await log(supabase, 'CATEGORY_UPDATED', 'category', body.id, ex?.name, updates);
    return Response.json({ success: true });
  }
  if (body.type === 'settings') {
    for (const [key, value] of Object.entries(body.values || {})) {
      const { error } = await supabase.from('settings').upsert({ key, value: String(value) }, { onConflict: 'key' });
      if (error) return Response.json({ error: error.message }, { status: 500 });
    }
    await log(supabase, 'SETTINGS_UPDATED', 'settings', 'global', 'settings', body.values);
    return Response.json({ success: true });
  }
  return Response.json({ error: 'Invalid type' }, { status: 400 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  if (!checkSecret(searchParams.get('secret'))) return unauthorized();
  const body = await request.json();
  const supabase = createServiceClient();
  if (body.type === 'category') {
    const { data: ex } = await supabase.from('categories').select('name, slug').eq('id', body.id).single();
    const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category', ex?.slug);
    if (count > 0) return Response.json({ error: `Cannot delete — ${count} product(s) still use this category.` }, { status: 400 });
    const { error } = await supabase.from('categories').delete().eq('id', body.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await log(supabase, 'CATEGORY_DELETED', 'category', body.id, ex?.name, {});
    return Response.json({ success: true });
  }
  const { data: ex }     = await supabase.from('products').select('name').eq('id', body.id).single();
  const { data: images } = await supabase.from('product_images').select('url').eq('product_id', body.id);
  if (images?.length > 0) {
    const paths = images.map(img => img.url.split('/storage/v1/object/public/products/')[1]).filter(Boolean);
    if (paths.length > 0) await supabase.storage.from('products').remove(paths);
  }
  const { error } = await supabase.from('products').delete().eq('id', body.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  await log(supabase, 'PRODUCT_DELETED', 'product', body.id, ex?.name, {});
  return Response.json({ success: true });
}