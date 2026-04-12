import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function getAdminUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Unauthorized', status: 401 };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return { error: 'Not found', status: 404 };

  return { user };
}

export async function GET(request, { params }) {
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
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Category GET error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
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
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { name, slug, description, image_url, is_active, sort_order } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Check slug unique (exclude current)
    const { data: existing } = await serviceClient
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    const updates = {
      name: name.slice(0, 100),
      slug: slug.slice(0, 50).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
      description: description !== undefined ? description?.slice(0, 500) || null : undefined,
      image_url: image_url !== undefined ? image_url || null : undefined,
      is_active,
      sort_order: sort_order !== undefined ? parseInt(sort_order) || 0 : undefined,
    };

    const { data, error } = await serviceClient
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update category error:', error);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (err) {
    console.error('Category PUT error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // Check if category has products
    const serviceClient = createServiceClient();
    const { data: category } = await serviceClient
      .from('categories')
      .select('slug')
      .eq('id', id)
      .single();

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const { count: productCount } = await serviceClient
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.slug);

    if (productCount > 0) {
      return NextResponse.json({ error: 'Cannot delete category with products' }, { status: 400 });
    }

    const { error } = await serviceClient
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete category error:', error);
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Category DELETE error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
