import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceClient();
  const base = 'https://starlordgroup.rw';

  const staticRoutes = [
    { url: base,                priority: 1.0, changefreq: 'daily' },
    { url: `${base}/products`,  priority: 0.9, changefreq: 'daily' },
    { url: `${base}/about`,     priority: 0.8 },
    { url: `${base}/contact`,   priority: 0.6 },
    { url: `${base}/cart`,      priority: 0.7 },
    { url: `${base}/checkout`,  priority: 0.6 },
    { url: `${base}/account`,   priority: 0.6 },
  ];

  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .eq('is_active', true)
    .order('sort_order');

  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(500);

  const categoryRoutes = (categories || []).map(cat => ({
    url: `${base}/category/${cat.slug}`,
    priority: 0.85,
    changefreq: 'weekly',
  }));

  const productRoutes = (products || []).map(p => ({
    url: `${base}/products/${p.id}`,
    lastmod: p.updated_at,
    priority: 0.8,
    changefreq: 'weekly',
  }));

  const routes = [...staticRoutes, ...categoryRoutes, ...productRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${r.url}</loc>
    ${r.lastmod    ? `<lastmod>${new Date(r.lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}
    ${r.priority   ? `<priority>${r.priority}</priority>` : ''}
    ${r.changefreq ? `<changefreq>${r.changefreq}</changefreq>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, s-maxage=3600',
    },
  });
}