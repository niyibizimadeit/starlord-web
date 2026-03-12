'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const PAGE_SIZE = 8;

function formatRWF(n) {
  return `RWF ${Number(n).toLocaleString()}`;
}

function Badge({ text }) {
  if (!text) return null;
  const styles = {
    HOT:  { bg: '#C0392B', color: '#fff' },
    NEW:  { bg: '#1E8449', color: '#fff' },
    SALE: { bg: 'var(--gold)', color: '#fff' },
  };
  const s = styles[text] || styles.HOT;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: 700,
      padding: '3px 10px', borderRadius: 4,
      letterSpacing: 1.2, fontFamily: 'Lato, sans-serif',
      textTransform: 'uppercase',
    }}>
      {text}
    </span>
  );
}

function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null;

  return (
    <Link
      href={`/products/${product.id}`}
      style={{ display: 'block', height: '100%' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <article style={{
        background: 'var(--surface)',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow)' : 'var(--shadow-sm)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      }}>

        {/* Image */}
        <div style={{
          position: 'relative',
          paddingTop: '75%',
          background: 'var(--surface-2)',
          overflow: 'hidden',
        }}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s ease',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-faint)',
              fontSize: 14, letterSpacing: 1,
              textTransform: 'uppercase',
              fontWeight: 700,
            }}>
              No Image
            </div>
          )}

          {/* Top badges */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <Badge text={product.badge} />
            {discount && (
              <span style={{
                background: '#C0392B', color: '#fff',
                fontSize: 10, fontWeight: 700,
                padding: '4px 10px', borderRadius: 4,
                letterSpacing: 1, fontFamily: 'Lato, sans-serif',
              }}>
                -{discount}%
              </span>
            )}
          </div>

          {/* Low stock */}
          {product.stock <= 5 && product.stock > 0 && (
            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              color: 'var(--gold)',
              fontSize: 11, fontWeight: 700,
              padding: '4px 12px', borderRadius: 20,
            }}>
              {product.stock} left
            </div>
          )}

          {product.stock === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'var(--overlay)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                background: 'var(--surface)',
                color: 'var(--text-muted)',
                fontSize: 13, fontWeight: 700,
                padding: '8px 20px', borderRadius: 6,
                letterSpacing: 1, textTransform: 'uppercase',
              }}>
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-grid-info" style={{
          padding: '24px 24px 28px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <span style={{
            fontSize: 11, color: 'var(--text-faint)',
            textTransform: 'uppercase', letterSpacing: 1.8,
            fontWeight: 700,
          }}>
            {product.category}
          </span>

          <h3 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.3,
            flex: 1,
          }}>
            {product.name}
          </h3>

          <div className="price-row" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
          }}>
            <div>
              <span style={{
                fontSize: 22, fontWeight: 800,
                color: 'var(--price-color)',
                fontFamily: 'Lato, sans-serif',
              }}>
                {formatRWF(product.price)}
              </span>
              {product.old_price && (
                <span style={{
                  fontSize: 14,
                  color: 'var(--text-faint)',
                  textDecoration: 'line-through',
                  marginLeft: 12,
                }}>
                  {formatRWF(product.old_price)}
                </span>
              )}
            </div>

            <div style={{
              width: 44, height: 44,
              borderRadius: '50%',
              background: hovered ? 'var(--gold)' : 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}>
              <svg
                width="18" height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={hovered ? '#000' : 'currentColor'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
        <div style={{ width: 4, height: 32, background: 'var(--gold)', borderRadius: 2 }} />
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(24px, 4vw, 32px)',
          fontWeight: 700,
          color: 'var(--text)',
        }}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p style={{
          fontSize: 14, color: 'var(--text-muted)',
          marginLeft: 24, letterSpacing: 0.5,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function ProductGrid({
  initialProducts,
  initialCategory,
  initialSearch,
  initialBadge,
}) {
  const [category, setCategory] = useState(initialCategory || 'All');
  const [search,   setSearch]   = useState(initialSearch   || '');
  const [saleOnly, setSaleOnly] = useState(initialBadge === 'SALE');
  const [page,     setPage     ] = useState(1);
  const [loading,   setLoading]  = useState(false);
  const products                 = initialProducts || [];
  const sentinelRef = useRef(null);

  const CATEGORIES = ['All', 'Tech', 'Fashion'];

  // Handler that resets page when category changes
  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  // Handler that resets page when search changes
  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const toggleSaleOnly = () => {
    setSaleOnly(prev => !prev);
    setPage(1);
  };

  // Filter client-side for snappy UX
  const filtered = products.filter(p => {
    const matchCat    = category === 'All' || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchSale   = !saleOnly || p.badge === 'SALE';
    return matchCat && matchSearch && matchSale;
  });

  const visible  = filtered.slice(0, page * PAGE_SIZE);
  const hasMore  = visible.length < filtered.length;

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setLoading(true);
        setTimeout(() => {
          setPage(p => p + 1);
          setLoading(false);
        }, 400);
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return (
    <div style={{ padding: '64px 0 96px' }}>
      <div className="container">

        {/* Section header */}
        <SectionHeader
          title={
            saleOnly
              ? 'On Sale'
              : category === 'All'
              ? 'All Products'
              : category
          }
          subtitle={`${filtered.length} items available`}
        />

        {/* Filters row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 40,
        }}>
          {/* Category pills */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  padding: '10px 22px',
                  borderRadius: 28,
                  border: `1px solid ${category === cat ? 'var(--gold)' : 'var(--border)'}`,
                  background: category === cat ? 'var(--gold)' : 'var(--surface)',
                  color: category === cat ? '#000' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 700,
                  letterSpacing: 0.5,
                  transition: 'all 0.2s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sale toggle */}
          <button
            type="button"
            onClick={toggleSaleOnly}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: `1px solid ${saleOnly ? 'var(--gold)' : 'var(--border)'}`,
              background: saleOnly ? 'var(--gold)' : 'var(--surface)',
              color: saleOnly ? '#000' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            On Sale
          </button>
        </div>

        {/* Product Grid */}
        {visible.length > 0 ? (
          <>
            <div className="product-grid">
              {visible.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} style={{ height: 1, marginTop: 60 }} />

            {/* Loading indicator */}
            {loading && (
              <div style={{
                textAlign: 'center', padding: '32px 0',
                color: 'var(--text-muted)', fontSize: 14,
                letterSpacing: 1.5, textTransform: 'uppercase',
                fontWeight: 700,
              }}>
                Loading more...
              </div>
            )}

            {/* End of results */}
            {!hasMore && visible.length > PAGE_SIZE && (
              <div style={{
                textAlign: 'center', padding: '48px 0',
                color: 'var(--text-faint)', fontSize: 13,
                letterSpacing: 2, textTransform: 'uppercase',
              }}>
                All products loaded
              </div>
            )}
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '120px 0',
            color: 'var(--text-muted)',
          }}>
            <div style={{
              fontSize: 16, letterSpacing: 2.5,
              textTransform: 'uppercase', fontWeight: 800,
              marginBottom: 12,
            }}>
              No products found
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-faint)' }}>
              Try a different search or category
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
