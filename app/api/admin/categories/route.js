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

export async function GET(request) {
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
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const serviceClient = createServiceClient();
    const { data: categories, error } = await serviceClient
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch categories error:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json({ data: categories || [] });
  } catch (err) {
    console.error('Categories GET error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
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
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { name, slug, description, image_url } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Check slug unique
    const { data: existing } = await serviceClient
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    const { data, error } = await serviceClient
      .from('categories')
      .insert({
        name: name.slice(0, 100),
        slug: slug.slice(0, 50).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
        description: description?.slice(0, 500) || null,
        image_url: image_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Create category error:', error);
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (err) {
    console.error('Categories POST error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
