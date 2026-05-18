import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';
import SaleCountdown from '@/components/SaleCountdown';

export const metadata = {
  title: 'On Sale — STARLORD GROUP',
  description: 'Limited-time deals on selected products.',
};

function formatRWF(n) { return `${Number(n).toLocaleString()} RWF`; }

export default async function OnSalePage() {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Fetch active promotions
  const { data: activePromos } = await supabase
    .from('promotions')
    .select('id, name, discount_type, discount_value, ends_at')
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now);

  if (!activePromos?.length) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏷️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>No active deals</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Check back soon for limited-time offers.</p>
        <Link href="/products" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>Browse all products →</Link>
      </div>
    );
  }

  // Fetch product IDs in these promotions
  const { data: promoLinks } = await supabase
    .from('promotion_products')
    .select('promotion_id, product_id')
    .in('promotion_id', activePromos.map(p => p.id));

  if (!promoLinks?.length) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏷️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Coming soon</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>A sale is being set up. Check back shortly.</p>
        <Link href="/products" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>Browse all products →</Link>
      </div>
    );
  }

  // Fetch products
  const uniqueProductIds = [...new Set(promoLinks.map(l => l.product_id))];
  const { data: rawProducts } = await supabase
    .from('products')
    .select('*, product_images(url, sort_order)')
    .in('id', uniqueProductIds)
    .eq('is_active', true);

  // Build productId → best promo map (highest effective discount wins)
  const productPromoMap = {};
  promoLinks.forEach(({ promotion_id, product_id }) => {
    const promo = activePromos.find(p => p.id === promotion_id);
    if (!promo) return;
    if (!productPromoMap[product_id]) {
      productPromoMap[product_id] = [promo];
    } else {
      productPromoMap[product_id].push(promo);
    }
  });

  const saleProducts = (rawProducts || []).map(product => {
    const promos = productPromoMap[product.id] || [];
    let bestDiscount = 0;
    let bestPromo = promos[0];
    promos.forEach(promo => {
      const discount = promo.discount_type === 'percent'
        ? product.price * promo.discount_value / 100
        : promo.discount_value;
      if (discount > bestDiscount) { bestDiscount = discount; bestPromo = promo; }
    });
    const salePrice = Math.max(0, Math.round(product.price - bestDiscount));
    const discountPct = Math.round((1 - salePrice / product.price) * 100);
    const sorted = [...(product.product_images || [])].sort((a, b) => a.sort_order - b.sort_order);
    const thumb = sorted[0]?.url || null;
    return { ...product, image_url: thumb || product.image_url, salePrice, discountPct, bestPromo };
  });

  // Soonest ending promo for the page-level countdown
  const soonestEnd = activePromos.reduce((min, p) =>
    new Date(p.ends_at) < new Date(min.ends_at) ? p : min
  );

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 120 }}>

      {/* Page header */}
      <div style={{ padding: '28px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 3, height: 22, background: 'var(--gold)', borderRadius: 2 }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, fontFamily: 'var(--font-playfair, serif)' }}>
            On Sale
          </h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            {saleProducts.length} item{saleProducts.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>
            ⏱ <SaleCountdown endsAt={soonestEnd.ends_at} />
          </span>
        </div>
      </div>

      {/* Active promotions strip */}
      <div style={{ padding: '8px 20px 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {activePromos.map(promo => (
          <div key={promo.id} style={{
            flexShrink: 0, background: 'var(--surface)',
            border: '1px solid var(--border-subtle)', borderRadius: 10,
            padding: '6px 12px', fontSize: 11, fontWeight: 700,
            color: 'var(--gold)',
          }}>
            {promo.name} —{' '}
            {promo.discount_type === 'percent'
              ? `${promo.discount_value}% off`
              : `RWF ${Number(promo.discount_value).toLocaleString()} off`
            }
          </div>
        ))}
      </div>

      {/* Product grid */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {saleProducts.map(p => (
          <article key={p.id} style={{
            background: 'var(--surface)', borderRadius: 20,
            overflow: 'hidden', border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
          }}>
            <Link href={`/products/${p.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
              {/* Image */}
              <div style={{ position: 'relative', paddingTop: '95%', background: 'var(--surface-2)', overflow: 'hidden' }}>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%', objectFit: 'cover',
                  }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: 2 }}>NO IMAGE</span>
                  </div>
                )}

                {/* Discount badge */}
                <span style={{
                  position: 'absolute', top: 8, right: 8, zIndex: 2,
                  padding: '3px 7px', borderRadius: 20,
                  fontSize: 9, fontWeight: 800, color: '#fff',
                  background: 'var(--badge-sale-bg)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                }}>
                  -{p.discountPct}%
                </span>

                {/* Sold out overlay */}
                {p.stock === 0 && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'var(--overlay)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
                  }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff', fontSize: 10, fontWeight: 800,
                      padding: '7px 16px', borderRadius: 8, letterSpacing: 2,
                    }}>Sold Out</span>
                  </div>
                )}
              </div>

              {/* Name */}
              <div style={{ padding: '10px 10px 4px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-playfair, serif)',
                  fontSize: 12, fontWeight: 700,
                  color: 'var(--text)', lineHeight: 1.35, margin: 0,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{p.name}</h3>
              </div>
            </Link>

            {/* Price row + cart */}
            <div style={{ padding: '4px 10px 12px', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#e05555', fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap' }}>
                  {formatRWF(p.salePrice)}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-faint)', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
                  {formatRWF(p.price)}
                </span>
              </div>
              <AddToCartButton product={{ ...p, price: p.salePrice }} compact />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}