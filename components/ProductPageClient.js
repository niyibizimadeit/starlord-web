'use client';

import { useState } from 'react';
import ImageGallery from './ImageGallery';
import VariationSelector from './VariationSelector';

function formatRWF(n) { return `${Number(n).toLocaleString()} RWF`; }

export default function ProductPageClient({ product, images, variations }) {
  const [variationOverrideUrl, setVariationOverrideUrl] = useState(null);

  const handleOptionSelect = (variationId, option, optionImages) => {
    const imageUrl = optionImages?.[option];
    if (imageUrl) {
      setVariationOverrideUrl(imageUrl);
    }
    // No image assigned to this option — leaves the current override untouched
  };

  const handleImageInteract = () => {
    setVariationOverrideUrl(null);
  };

  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null;

  return (
    <>
      {/* Gallery */}
      <div style={{ position: 'relative', padding: '16px 16px 0' }}>
        <ImageGallery
          images={images}
          productName={product.name}
          overrideUrl={variationOverrideUrl}
          onImageInteract={handleImageInteract}
        />
        {product.badge && (
          <span style={{
            position: 'absolute', top: 28, left: 28, zIndex: 10,
            padding: '4px 12px', borderRadius: 20,
            fontSize: 10, fontWeight: 800, letterSpacing: 1.2,
            textTransform: 'uppercase',
            background: product.badge === 'SALE' ? 'var(--gold)'
                      : product.badge === 'NEW'  ? 'var(--green)' : 'var(--red)',
            color: product.badge === 'SALE' ? '#000' : '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}>
            {product.badge}
          </span>
        )}
      </div>

      {/* Product info */}
      <div style={{ padding: '24px 20px' }}>
        <div style={{
          fontSize: 10, color: 'var(--text-faint)',
          textTransform: 'uppercase', letterSpacing: 1.8,
          fontWeight: 700, marginBottom: 8,
        }}>
          {product.category}
        </div>

        <h1 style={{
          fontSize: 26, fontWeight: 800, color: 'var(--text)',
          marginBottom: 14, fontFamily: 'var(--font-playfair, serif)', lineHeight: 1.25,
        }}>
          {product.name}
        </h1>

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
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
              background: 'var(--badge-sale-bg)', color: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              -{discount}%
            </span>
          )}
        </div>

        {product.description && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.75, marginBottom: 32 }}>
            {product.description}
          </p>
        )}

        <VariationSelector
          product={product}
          variations={variations}
          onOptionSelect={handleOptionSelect}
        />
      </div>
    </>
  );
}