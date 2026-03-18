import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('product_variations')
    .select('id, name, options, is_required, sort_order')
    .eq('product_id', id)
    .order('sort_order', { ascending: true });
  if (error) return Response.json({ variations: [] });
  return Response.json({ variations: data || [] });
}