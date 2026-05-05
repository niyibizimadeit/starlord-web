import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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
  if (!(await checkAdminAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData  = await request.formData();
    const file      = formData.get('file');
    const productId = formData.get('productId');

    if (!file || !productId) {
      return Response.json({ error: 'Missing file or productId' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'Only JPG, PNG, WEBP and GIF images are allowed' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return Response.json({ error: 'File too large. Maximum size is 2MB' }, { status: 400 });
    }

    const ext      = file.name.split('.').pop().toLowerCase();
    const key      = `products/${productId}/${crypto.randomUUID()}.${ext}`;
    const buffer   = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    await r2Client.send(new PutObjectCommand({
      Bucket:      R2_BUCKET,
      Key:         key,
      Body:        buffer,
      ContentType: file.type,
    }));

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;

    // Save to DB — same as before
    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from('product_images')
      .select('sort_order')
      .eq('product_id', productId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = existing?.length > 0 ? (existing[0].sort_order + 1) : 0;

    const { data, error: dbError } = await supabase
      .from('product_images')
      .insert([{ product_id: productId, url: publicUrl, sort_order: nextOrder }])
      .select()
      .single();

    if (dbError) {
      return Response.json({ error: dbError.message }, { status: 500 });
    }

    return Response.json({ data });
  } catch (err) {
    console.error('R2 upload error:', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await checkAdminAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { imageId, url } = await request.json();

    // Extract R2 key from public URL
    // e.g. https://images.starlordgroup.rw/products/123/uuid.jpg → products/123/uuid.jpg
    const key = url.replace(`${R2_PUBLIC_URL}/`, '');

    await r2Client.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key:    key,
    }));

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  } catch (err) {
    console.error('R2 delete error:', err);
    return Response.json({ error: 'Delete failed' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!(await checkAdminAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { images } = await request.json();
    const supabase   = createServiceClient();

    await Promise.all(
      images.map(img =>
        supabase.from('product_images').update({ sort_order: img.sort_order }).eq('id', img.id)
      )
    );

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Reorder failed' }, { status: 500 });
  }
}