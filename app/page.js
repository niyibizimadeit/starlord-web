import { createServiceClient } from '@/lib/supabase/server';
import { getBanners } from '@/lib/banners';
import BannerSlider from '@/components/BannerSlider';
import ProductGrid from '@/components/ProductGrid';
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

  return (data || [])
    .map(product => {
      if (!product.image_url && product.product_images?.length > 0) {
        const sorted = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
        product.image_url = sorted[0].url;
      }
      return product;
    })
    .sort((a, b) => {
      const aNew = a.category === 'new-arrivals' ? 0 : 1;
      const bNew = b.category === 'new-arrivals' ? 0 : 1;
      return aNew - bNew;
    });
}

export default async function HomePage() {
  const [products, navCategories, banners] = await Promise.all([
    getProducts(),
    getNavCategories(),
    getBanners(),
  ]);

  return (
    <main className="home-sections">
      <BannerSlider initialBanners={banners} />
      <ProductGrid
        initialProducts={products}
        hideDesktopFilters
        categories={navCategories}
      />
      <TrustBar className="mobile-trustbar-below-products mobile-only-trustbar" />
    </main>
  );
}
