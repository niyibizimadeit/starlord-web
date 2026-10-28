import { createServiceClient } from '@/lib/supabase/server';

export async function getBanners() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('banners')
    .select('id, title, subtitle, button_text, button_link, image_url, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) return [];
  return data || [];
}
