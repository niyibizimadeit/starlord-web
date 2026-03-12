import { createServiceClient } from '@/lib/supabase/server';
import BannerSlider from '@/components/BannerSlider';
import ProductGrid from '@/components/ProductGrid';
/* import CategoryStrip from '@/components/CategoryStrip'; */
import TrustBar from '@/components/TrustBar';

export const revalidate = 60;

async function getProducts() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function HomePage({ searchParams }) {
  const params   = await searchParams;
  const products = await getProducts();
  const category = params?.category || 'All';
  const search   = params?.search   || '';
  const badge    = params?.badge    || '';

  return (
    <main className="home-sections">
      <BannerSlider />
      <TrustBar className="desktop-trustbar" />
      <ProductGrid
        initialProducts={products}
        initialCategory={category}
        initialSearch={search}
        initialBadge={badge}
      />
    </main>
  );
}
