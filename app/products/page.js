import { createServiceClient } from '@/lib/supabase/server';
import ProductGrid from '@/components/ProductGrid';

export const metadata = {
  title: 'All Products — STARLORD GROUP',
  description: 'Browse all premium accessories. Phone cases, fashion and more. Pay with MTN MoMo or Airtel Money.',
};

export const revalidate = 60;

async function getProducts() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('products')
    .select('*, product_images(url, sort_order)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (data || []).map(product => {
    if (!product.image_url && product.product_images?.length > 0) {
      const sorted = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
      product.image_url = sorted[0].url;
    }
    return product;
  });
}

async function getCategories() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('categories')
    .select('name, slug')
    .order('name', { ascending: true });
  return data?.map(c => ({ name: c.name, slug: c.slug })) || [];
}

export default async function ProductsPage({ searchParams }) {
  const params   = await searchParams;
  const category = params?.category || 'All';
  const search   = params?.search   || '';
  const badge    = params?.badge    || '';

  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <main>
      <ProductGrid
        initialProducts={products}
        initialCategory={category}
        initialSearch={search}
        initialBadge={badge}
        categories={categories}
        showHeader={true}
        pageTitle={category === 'All' ? 'All Products' : undefined}
      />
    </main>
  );
}