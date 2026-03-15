import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
import ImageGallery from '@/components/ImageGallery';

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
  return `RWF ${Number(amount).toLocaleString()}`;
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

      <div style={{ position: 'relative', padding: '16px 16px 0' }}>
        <ImageGallery images={images} productName={product.name} />

        {product.badge && (
          <span style={{
            position: 'absolute', top: 28, left: 28,
            background: product.badge === 'SALE' ? 'var(--gold)' :
                        product.badge === 'NEW'  ? 'var(--green)' : 'var(--red)',
            color: product.badge === 'SALE' ? '#000' : '#fff',
            fontSize: 10, fontWeight: 800,
            padding: '3px 10px', borderRadius: 4,
            letterSpacing: 1, fontFamily: 'monospace',
            zIndex: 10,
          }}>
            {product.badge}
          </span>
        )}
      </div>

      <div style={{ padding: '24px 20px' }}>
        <div style={{
          fontSize: 11, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
        }}>
          {product.category}
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
          {product.name}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--gold)' }}>
            {formatRWF(product.price)}
          </span>
          {product.old_price && (
            <span style={{
              fontSize: 16, color: 'var(--text-faint)',
              textDecoration: 'line-through',
            }}>
              {formatRWF(product.old_price)}
            </span>
          )}
          {discount && (
            <span style={{
              background: 'var(--red)', color: '#fff',
              fontSize: 11, fontWeight: 800,
              padding: '3px 8px', borderRadius: 4,
              fontFamily: 'monospace',
            }}>
              -{discount}%
            </span>
          )}
        </div>

        <div style={{
          display: 'inline-block',
          background: product.stock <= 5 ? '#2e1a1a' : '#1a2e1a',
          borderRadius: 8, padding: '6px 14px', marginBottom: 20,
        }}>
          <span style={{
            color: product.stock <= 5 ? 'var(--red)' : 'var(--green)',
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
            fontSize: 14, lineHeight: 1.7, marginBottom: 32,
          }}>
            {product.description}
          </p>
        )}

        <AddToCartButton product={product} />
      </div>
    </div>
  );
}