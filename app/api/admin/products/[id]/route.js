import { createServiceClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to check admin role
async function getAdminUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Not found', status: 404 };
  }

  return { user };
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const auth = await getAdminUser(supabase);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { name, description, price, category, stock, imageUrl, badge, isActive } = await request.json();

    const serviceClient = createServiceClient();

    // Build update object
    const updates = {};
    
    if (name !== undefined) updates.name = name.slice(0, 200);
    if (description !== undefined) updates.description = description.slice(0, 2000);
    if (price !== undefined) updates.price = Math.max(0, Math.floor(price));
    if (stock !== undefined) updates.stock = Math.max(0, Math.floor(stock));
    if (category !== undefined) {
      const validCategories = ['Tech', 'Fashion'];
      if (!validCategories.includes(category)) {
        return Response.json(
          { error: `Invalid category. Valid values: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
      updates.category = category;
    }
    if (imageUrl !== undefined) updates.image_url = imageUrl;
    if (badge !== undefined) {
      if (badge && !['HOT', 'NEW', 'SALE'].includes(badge)) {
        return Response.json(
          { error: 'Invalid badge. Valid values: HOT, NEW, SALE' },
          { status: 400 }
        );
      }
      updates.badge = badge;
    }
    if (isActive !== undefined) updates.is_active = isActive;

    // Update product
    const { data, error } = await serviceClient
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update product error:', error);
      return Response.json({ error: 'Failed to update product' }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({ success: true, product: data });
  } catch (err) {
    console.error('Update product error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

