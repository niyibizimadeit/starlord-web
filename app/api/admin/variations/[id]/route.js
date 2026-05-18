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

export async function PATCH(req, { params }) {
  if (!await checkAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServiceClient();
  const { id } = await params;
  const { option_images } = await req.json();
  const { data, error } = await supabase
    .from('product_variations')
    .update({ option_images })
    .eq('id', id)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}