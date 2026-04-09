import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'authenticated';
}

export async function POST(request) {
  if (!(await checkAdminAuth())) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  const supabase = createServiceClient();
  const ext = file.name.split('.').pop().toLowerCase();
  const filename = `banner-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from('products')
    .upload(`banners/${filename}`, buffer, { contentType: file.type, upsert: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/banners/${filename}`;
  return Response.json({ url });
}