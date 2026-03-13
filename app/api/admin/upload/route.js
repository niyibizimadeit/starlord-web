import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request) {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData  = await request.formData();
    const file      = formData.get('file');
    const productId = formData.get('productId');

    if (!file || !productId) {
      return Response.json({ error: 'Missing file or productId' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'Only JPG, PNG, WEBP and GIF images are allowed' }, { status: 400 });
    }

    // Validate file size — max 2MB
    if (file.size > 2 * 1024 * 1024) {
      return Response.json({ error: 'File too large. Maximum size is 2MB' }, { status: 400 });
    }

    const supabase  = createServiceClient();
    const ext       = file.name.split('.').pop().toLowerCase();
    const fileName  = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer    = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, buffer, {
        contentType:  file.type,
        cacheControl: '3600',
        upsert:       false,
      });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    // Get current max sort_order for this product
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
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { imageId, url } = await request.json();
    const supabase = createServiceClient();

    // Extract file path from URL to delete from storage
    const urlParts  = url.split('/storage/v1/object/public/products/');
    if (urlParts.length === 2) {
      await supabase.storage.from('products').remove([urlParts[1]]);
    }

    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Delete failed' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Reorder images: body = { images: [{id, sort_order}] }
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