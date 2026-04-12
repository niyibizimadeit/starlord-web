import { jwtVerify } from 'jose';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.ADMIN_SECRET)
    );
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function POST(request) {
  if (!(await checkAdminAuth())) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Only JPG, PNG and WEBP images are allowed' }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return Response.json({ error: 'File too large. Maximum size is 4MB' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const ext      = file.name.split('.').pop().toLowerCase();
  const filename = `banner-${crypto.randomUUID()}.${ext}`; // crypto instead of Date.now()
  const buffer   = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from('products')
    .upload(`banners/${filename}`, buffer, { contentType: file.type, upsert: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/banners/${filename}`;
  return Response.json({ url });
}