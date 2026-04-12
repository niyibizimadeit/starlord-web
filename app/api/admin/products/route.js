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

export async function POST(request) {
  try {
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

    const { name, description, price, category, stock, imageUrl, badge } = await request.json();

    // Validate required fields
    if (!name || !price || !category) {
      return Response.json(
        { error: 'Name, price, and category are required' },
        { status: 400 }
      );
    }

    // Category validation removed - now uses DB categories

    // Validate badge if provided
    if (badge && !['HOT', 'NEW', 'SALE'].includes(badge)) {
      return Response.json(
        { error: 'Invalid badge. Valid values: HOT, NEW, SALE' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();
    const { data: categoryExists } = await serviceClient
      .from('categories')
      .select('id')
      .eq('slug', category)
      .eq('is_active', true)
      .single();

    if (!categoryExists) {
      return Response.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Create product
    const { data, error } = await serviceClient
      .from('products')
      .insert({
        id: crypto.randomUUID(),
        name: name.slice(0, 200),
        description: description?.slice(0, 2000) || null,
        price: Math.max(0, Math.floor(price)),
        old_price: null,
        stock: Math.max(0, Math.floor(stock || 0)),
        category,
        image_url: imageUrl || null,
        badge: badge || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Create product error:', error);
      return Response.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return Response.json({ success: true, product: data });
  } catch (err) {
    console.error('Create product error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

