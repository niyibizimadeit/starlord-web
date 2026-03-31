 suld be SVGFEDisplacementMapElement.jshoimport { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { 
          httpOnly?: boolean; 
          secure?: boolean; 
          sameSite?: 'lax' | 'strict' | 'none' | false;
  );
          maxAge?: number;
          expires?: Date;
        }) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: {
          httpOnly?: boolean;
          secure?: boolean;
          sameSite?: 'lax' | 'strict' | 'none' | false;
          path?: string;
        }) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }

  // Static routes
  const staticRoutes = [
    { url: 'http://localhost:3000', priority: 1.0, changefreq: 'daily' as const },
    { url: 'http://localhost:3000/about', priority: 0.8 },
    { url: 'http://localhost:3000/products', priority: 0.9, changefreq: 'daily' as const },
    { url: 'http://localhost:3000/cart', priority: 0.7 },
    { url: 'http://localhost:3000/checkout', priority: 0.6 },
    { url: 'http://localhost:3000/account', priority: 0.6 },
  ];

  // Dynamic categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .eq('is_active', true)
    .order('sort_order');

  const categoryRoutes = (categories || []).map(cat => ({
    url: `http://localhost:3000/category/${cat.slug}`,
    priority: 0.85,
    changefreq: 'weekly' as const,
  }));

  // Dynamic products (limit 1000 for performance)
  const { data: products } = await supabase
    .from('products')
    .select('id, is_active, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1000);

  const productRoutes = (products || []).map(product => ({
    url: `http://localhost:3000/products/${product.id}`,
    lastmod: product.updated_at,
    priority: 0.8,
    changefreq: 'weekly' as const,
  }));

  const body = Array.from(
    new Set([
      ...staticRoutes,
      ...categoryRoutes, 
      ...productRoutes,
    ])
  );

  return new Response(
    new XMLSerializer().serializeToString(
      (() => {
        const doc = document.implementation.createDocument('http://www.w3.org/2000/xmlns/', 'urlset');
        body.forEach(item => {
          const url = doc.createElement('url');
          Object.entries(item).forEach(([key, value]) => {
            const prop = doc.createElement(key);
            prop.textContent = value as string;
            url.appendChild(prop);
          });
          doc.documentElement.appendChild(url);
        });
        return doc;
      })()
    ),
    {
      headers: { 'Content-Type': 'text/xml' },
    }
  );
}

