import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search   = searchParams.get('search');

  const supabase = createServiceClient();

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (search) {
    // Escape special LIKE characters to prevent overly broad matches
    const safeSearch = search.replace(/[%_\\]/g, '\\$&').slice(0, 100);
    query = query.ilike('name', `%${safeSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ products: data });
}