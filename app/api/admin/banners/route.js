import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'authenticated';
}

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function POST(request) {
  if (!(await checkAdminAuth())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('banners').select('sort_order').order('sort_order', { ascending: false }).limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase.from('banners').insert({
    title:       body.title || '',
    subtitle:    body.subtitle || '',
    button_text: body.button_text || 'Shop Now',
    button_link: body.button_link || '/',
    image_url:   body.image_url || null,
    sort_order:  nextOrder,
    is_active:   true,
  }).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function PATCH(request) {
  if (!(await checkAdminAuth())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const supabase = createServiceClient();

  const updates = {};
  if (body.title       !== undefined) updates.title       = body.title;
  if (body.subtitle    !== undefined) updates.subtitle    = body.subtitle;
  if (body.button_text !== undefined) updates.button_text = body.button_text;
  if (body.button_link !== undefined) updates.button_link = body.button_link;
  if (body.image_url   !== undefined) updates.image_url   = body.image_url;
  if (body.is_active   !== undefined) updates.is_active   = body.is_active;
  if (body.sort_order  !== undefined) updates.sort_order  = body.sort_order;

  const { error } = await supabase.from('banners').update(updates).eq('id', body.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}

export async function DELETE(request) {
  if (!(await checkAdminAuth())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await request.json();
  const supabase = createServiceClient();
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}