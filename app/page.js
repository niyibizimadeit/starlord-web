import { createServiceClient } from '@/lib/supabase/server';
import BannerSlider from '@/components/BannerSlider';
import ProductGrid from '@/components/ProductGrid';
/* import CategoryStrip from '@/components/CategoryStrip'; */
import TrustBar from '@/components/TrustBar';

export const revalidate = 60;

async function getNavCategories() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('is_active', true)
    .eq('show_in_nav', true)
    .order('sort_order', { ascending: true })
    .limit(4);
  return data || [];
}

async function getProducts() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('products')
    .select('*, product_images(url, sort_order)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (data || []).map(product => {
    // If no image_url, use the first image from product_images as thumbnail
    if (!product.image_url && product.product_images?.length > 0) {
      const sorted = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
      product.image_url = sorted[0].url;
    }
    return product;
  });
}

export default async function HomePage({ searchParams }) {
  const params   = await searchParams;
  const [products, navCategories] = await Promise.all([
    getProducts(),
    getNavCategories(),
  ]);
  const category = params?.category || 'All';
  const search   = params?.search   || '';
  const badge    = params?.badge    || '';

  return (
    <main className="home-sections">
      <BannerSlider />
      <ProductGrid
        initialProducts={products}
        initialCategory={category}
        initialSearch={search}
        initialBadge={badge}
        hideDesktopFilters
        categories={navCategories}
      />
      <TrustBar className="mobile-trustbar-below-products mobile-only-trustbar" />
    </main>
  );


}
