import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
import ImageGallery from '@/components/ImageGallery';
import Link from 'next/link';
import Image from 'next/image';
import ProductReviews from '@/components/ProductReviews';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import VariationSelector from '@/components/VariationSelector';

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

function formatRWF(amount) {
  return `${Number(amount).toLocaleString()} RWF`;
}

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

  const { data: variations } = await supabase
    .from('product_variations')
    .select('id, name, options, is_required, sort_order')
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
    productImages && productImages.length > 0
      ? productImages
      : product.image_url
      ? [{ id: 'main', url: product.image_url }]
      : [];

  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null;

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 120 }}>

      {/* ── Gallery ──────────────────────────────────────────── */}
      <div style={{ position: 'relative', padding: '16px 16px 0' }}>
        <ImageGallery images={images} productName={product.name} />

        {product.badge && (
          <span style={{
            position: 'absolute', top: 28, left: 28, zIndex: 10,
            padding: '4px 12px', borderRadius: 20,
            fontSize: 10, fontWeight: 800, letterSpacing: 1.2,
            textTransform: 'uppercase',
            background: product.badge === 'SALE' ? 'var(--gold)' :
                        product.badge === 'NEW'  ? 'var(--green)' : 'var(--red)',
            color: product.badge === 'SALE' ? '#000' : '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}>
            {product.badge}
          </span>
        )}
      </div>

      {/* ── Product info ─────────────────────────────────────── */}
      <div style={{ padding: '24px 20px' }}>
        <div style={{
          fontSize: 10, color: 'var(--text-faint)',
          textTransform: 'uppercase', letterSpacing: 1.8,
          fontWeight: 700, marginBottom: 8,
        }}>
          {product.category}
        </div>

        <h1 style={{
          fontSize: 26, fontWeight: 800,
          color: 'var(--text)', marginBottom: 14,
          fontFamily: 'var(--font-playfair, serif)',
          lineHeight: 1.25,
        }}>
          {product.name}
        </h1>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--price-color)', fontFamily: 'Lato, sans-serif' }}>
            {formatRWF(product.price)}
          </span>
          {product.old_price && (
            <span style={{ fontSize: 16, color: 'var(--text-faint)', textDecoration: 'line-through' }}>
              {formatRWF(product.old_price)}
            </span>
          )}
          {discount && (
            <span style={{
              padding: '4px 10px', borderRadius: 20,
              fontSize: 11, fontWeight: 800,
              background: 'var(--badge-sale-bg)', color: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              -{discount}%
            </span>
          )}
        </div>

        {/* Stock badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 20, marginBottom: 20,
          background: product.stock === 0
            ? 'var(--red-bg)'
            : product.stock <= 5
            ? 'rgba(177,39,4,0.08)'
            : 'var(--green-bg)',
          border: `1px solid ${product.stock === 0 ? 'var(--red)' : product.stock <= 5 ? 'var(--red)' : 'var(--green)'}`,
          opacity: 0.9,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: product.stock === 0 ? 'var(--red)' : product.stock <= 5 ? 'var(--red)' : 'var(--green)',
          }} />
          <span style={{
            color: product.stock === 0 ? 'var(--red)' : product.stock <= 5 ? 'var(--red)' : 'var(--green)',
            fontSize: 12, fontWeight: 700,
          }}>
            {product.stock === 0
              ? 'Out of stock'
              : product.stock <= 5
              ? `Only ${product.stock} left`
              : `In stock (${product.stock} available)`}
          </span>
        </div>

        {product.description && (
          <p style={{
            color: 'var(--text-muted)',
            fontSize: 14, lineHeight: 1.75, marginBottom: 32,
          }}>
            {product.description}
          </p>
        )}

        <VariationSelector
          product={product}
          variations={variations || []}
        />
      </div>

      {/* ── Related Products ─────────────────────────────────── */}
      {related.length > 0 && (
        <div style={{ padding: '0 16px', marginTop: 16 }}>

          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 20, background: 'var(--gold)', borderRadius: 2 }} />
              <h2 style={{
                fontSize: 12, fontWeight: 800,
                color: 'var(--text)', letterSpacing: 1.5,
                textTransform: 'uppercase', margin: 0,
              }}>
                More in {product.category}
              </h2>
            </div>
            <Link href={`/products?category=${product.category}`} style={{
              fontSize: 12, color: 'var(--gold)', fontWeight: 700,
            }}>
              View all →
            </Link>
          </div>

          {/* 2-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {related.slice(0, 2).map(p => {
              const relDiscount = p.old_price
                ? Math.round((1 - p.price / p.old_price) * 100)
                : null;
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Image with chip overlays */}
                  <div style={{ position: 'relative', paddingTop: '90%', background: 'var(--surface-2)', overflow: 'hidden' }}>
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6,
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, color: 'var(--text-faint)' }}>
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>
                          No image
                        </span>
                      </div>
                    )}

                    {/* Category chip — glass pill */}
                    <span style={{
                      position: 'absolute', top: 8, left: 8, zIndex: 2,
                      padding: '3px 9px', borderRadius: 20,
                      fontSize: 9, fontWeight: 700, letterSpacing: 1,
                      textTransform: 'uppercase', color: '#333',
                      background: 'rgba(255,255,255,0.72)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.5)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85), 0 2px 6px rgba(0,0,0,0.08)',
                    }}>
                      {p.category}
                    </span>

                    {/* Discount — top-right */}
                    {relDiscount && (
                      <span style={{
                        position: 'absolute', top: 8, right: 8, zIndex: 2,
                        padding: '3px 8px', borderRadius: 20,
                        fontSize: 9, fontWeight: 800, color: '#fff',
                        background: 'var(--badge-sale-bg)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                      }}>
                        -{relDiscount}%
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '11px 11px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: 'var(--text)',
                      fontFamily: 'var(--font-playfair, serif)',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {p.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 'auto', paddingTop: 4 }}>
                      <span style={{
                        fontSize: 14, fontWeight: 800,
                        color: 'var(--price-color)',
                        fontFamily: 'Lato, sans-serif',
                      }}>
                        {formatRWF(p.price)}
                      </span>
                      {p.old_price && (
                        <span style={{ fontSize: 10, color: 'var(--text-faint)', textDecoration: 'line-through' }}>
                          {formatRWF(p.old_price)}
                        </span>
                      )}
                    </div>
                    <AddToCartButton product={p} compact />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Reviews ──────────────────────────────────────────── */}
      <ProductReviews
        productId={product.id}
        deliveredOrders={deliveredOrders}
      />
    </div>
  );
}