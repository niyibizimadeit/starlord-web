import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.ADMIN_SECRET)
    );
    return payload.role === 'admin';
  } catch { return false; }
}

export async function GET() {
  if (!await checkAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('promotions')
    .select('*, promotion_products(product_id)')
    .order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function POST(req) {
  if (!await checkAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServiceClient();
  const body = await req.json();
  const { name, discount_type, discount_value, starts_at, ends_at, is_active = true, product_ids = [] } = body;
  if (!name || !discount_type || !discount_value || !starts_at || !ends_at)
    return Response.json({ error: 'Required fields missing' }, { status: 400 });

  const { data: promo, error } = await supabase
    .from('promotions')
    .insert({ name, discount_type, discount_value: parseFloat(discount_value), starts_at, ends_at, is_active })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (product_ids.length > 0) {
    await supabase.from('promotion_products').insert(
      product_ids.map(id => ({ promotion_id: promo.id, product_id: id }))
    );
  }
  return Response.json({ data: promo });
}

export async function PATCH(req) {
  if (!await checkAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServiceClient();
  const body = await req.json();
  const { id, product_ids, ...fields } = body;
  if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

  const allowed = ['name', 'discount_type', 'discount_value', 'starts_at', 'ends_at', 'is_active'];
  const updateFields = {};
  allowed.forEach(k => { if (fields[k] !== undefined) updateFields[k] = fields[k]; });

  if (Object.keys(updateFields).length > 0) {
    const { error } = await supabase.from('promotions').update(updateFields).eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  if (product_ids !== undefined) {
    await supabase.from('promotion_products').delete().eq('promotion_id', id);
    if (product_ids.length > 0) {
      await supabase.from('promotion_products').insert(
        product_ids.map(pid => ({ promotion_id: id, product_id: pid }))
      );
    }
  }
  return Response.json({ success: true });
}

export async function DELETE(req) {
  if (!await checkAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServiceClient();
  const { id } = await req.json();
  if (!id) return Response.json({ error: 'ID required' }, { status: 400 });
  const { error } = await supabase.from('promotions').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}