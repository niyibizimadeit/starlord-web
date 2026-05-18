import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
import Link from 'next/link';
import ProductReviews from '@/components/ProductReviews';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ProductPageClient from '@/components/ProductPageClient';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('products')
    .select('name, description')
    .eq('id', resolvedParams.id)
    .single();
  return {
    title: data ? `${data.name} — STARLORD GROUP` : 'Product',
    description: data?.description,
  };
}

function formatRWF(amount) { return `${Number(amount).toLocaleString()} RWF`; }

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const supabase = createServiceClient();

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('is_active', true)
    .single();
  if (error || !product) notFound();

  const { data: productImages } = await supabase
    .from('product_images')
    .select('id, url, sort_order')
    .eq('product_id', resolvedParams.id)
    .order('sort_order', { ascending: true });

  // option_images added to query
  const { data: variations } = await supabase
    .from('product_variations')
    .select('id, name, options, is_required, sort_order, option_images')
    .eq('product_id', resolvedParams.id)
    .order('sort_order', { ascending: true });

  const { data: relatedRaw } = await supabase
    .from('products')
    .select('*, product_images(url, sort_order)')
    .eq('category', product.category)
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(6);

  const related = (relatedRaw || []).map(p => {
    if (!p.image_url && p.product_images?.length > 0) {
      const sorted = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order);
      p.image_url = sorted[0].url;
    }
    return p;
  });

  let deliveredOrders = [];
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, reference, order_items!inner(product_id)')
        .eq('user_id', user.id)
        .eq('status', 'delivered')
        .eq('order_items.product_id', product.id);
      deliveredOrders = orders || [];
    }
  } catch {}

  const images =
    productImages?.length > 0
      ? productImages
      : product.image_url
      ? [{ id: 'main', url: product.image_url }]
      : [];

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 120 }}>

      {/* Gallery + product info + variations — client component for shared state */}
      <ProductPageClient
        product={product}
        images={images}
        variations={variations || []}
      />

      {/* Related products */}
      {related.length > 0 && (
        <div style={{ padding: '0 16px', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 20, background: 'var(--gold)', borderRadius: 2 }} />
              <h2 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', letterSpacing: 1.5, textTransform: 'uppercase', margin: 0 }}>
                More in {product.category}
              </h2>
            </div>
            <Link href={`/products?category=${product.category}`} style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>
              View all →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {related.slice(0, 2).map(p => {
              const relDiscount = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : null;
              return (
                <Link key={p.id} href={`/products/${p.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <article style={{ background: 'var(--surface)', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)' }}>
                    <div style={{ position: 'relative', paddingTop: '95%', background: 'var(--surface-2)', overflow: 'hidden' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-faint)', opacity: 0.5 }}>NO IMAGE</span>
                        </div>
                      )}
                      {p.category && (
                        <span style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#333', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(0,0,0,0.1)' }}>{p.category}</span>
                      )}
                      {relDiscount && (
                        <span style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, padding: '3px 7px', borderRadius: 20, fontSize: 9, fontWeight: 800, color: '#fff', background: 'var(--badge-sale-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>-{relDiscount}%</span>
                      )}
                      {p.stock !== undefined && p.stock <= 5 && p.stock > 0 && (
                        <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--gold)', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>{p.stock} left</div>
                      )}
                      {p.stock === 0 && (
                        <div style={{ position: 'absolute', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                          <span style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '7px 16px', borderRadius: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Sold Out</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--price-color)', fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap' }}>{formatRWF(p.price)}</span>
                          {p.old_price && <span style={{ fontSize: 10, color: 'var(--text-faint)', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>{formatRWF(p.old_price)}</span>}
                        </div>
                        <AddToCartButton product={p} compact />
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <ProductReviews productId={product.id} deliveredOrders={deliveredOrders} />
    </div>
  );
}