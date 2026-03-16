'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from './CartContext';
import styles from './ProductGrid.module.css';

const PAGE_SIZE = 8;

function formatRWF(n) {
  return `RWF ${Number(n).toLocaleString()}`;
}

function Badge({ text }) {
  if (!text) return null;
  
  const badgeStyles = {
    HOT: 'badge badgeHot',
    NEW: 'badge badgeNew', 
    SALE: 'badge badgeSale',
  };
  
  const className = badgeStyles[text] || 'badge badgeHot';
  
  return <span className={className}>{text}</span>;
}

function ProductCard({ product, onOpenModal }) {
  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null;

  const handleOpenModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenModal(product);
  };

  return (
    <Link href={`/products/${product.id}`} className={`${styles.productCard} ${styles.productCardArticle}`}>
      <div>
        <article>
          <div className={styles.productImageContainer}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className={styles.productImage}
            />
          ) : (
            <div className={styles.noImage}>No Image</div>
          )}

          <div className={styles.badgesContainer}>
            <Badge text={product.badge} />
            {discount && (
              <span className={styles.discountBadge}>-{discount}%</span>
            )}
          </div>

          {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
            <div className={styles.lowStock}>{product.stock} left</div>
          )}

          {product.stock === 0 && (
            <div className={styles.soldOutOverlay}>
              <span className={styles.soldOutLabel}>Sold Out</span>
            </div>
          )}
        </div>

        <div className={`${styles.productInfo}`}>
          <span className={styles.categoryLabel}>{product.category}</span>
          <h3 className={styles.productTitle}>{product.name}</h3>
          
          <div className={`${styles.priceRow}`}>
            <div className={styles.prices}>
              <div className={styles.currentPriceLine}>
                <span className={styles.currentPrice}>{formatRWF(product.price)}</span>
              </div>
              {product.old_price && (
                <div className={styles.oldPriceLine}>
                  <span className={styles.oldPrice}>{formatRWF(product.old_price)}</span>
                </div>
              )}
            </div>

            <button
              className={`${styles.addToCartBtn}`}
              disabled={product.stock === 0}
              onClick={handleOpenModal}
              aria-label={product.stock === 0 ? 'Out of stock' : 'Add to cart'}
              title={product.stock === 0 ? 'Out of stock' : 'Add to cart'}
            >
              <svg
                width="18" 
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2.01-1.84L22.34 2H1Z"/>
                <line x1="7" y1="7" x2="7" y2="7"/>
              </svg>
            </button>
            {product.stock !== 0 && (
              <button
                className={styles.mobileAddToCartBtn}
                onClick={handleOpenModal}
                aria-label="Add to cart"
              >
                Add to cart
              </button>
            )}
          </div>
        </div>
      </article>
      </div>
    </Link>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionHeaderTitleBar}>
        <div className={styles.sectionHeaderAccent} />
        <h2 className={styles.sectionHeaderTitle}>{title}</h2>
      </div>
      {subtitle && <p className={styles.sectionHeaderSubtitle}>{subtitle}</p>}
    </div>
  );
}

export default function ProductGrid({ 
  initialProducts, 
  initialCategory = 'All', 
  initialSearch = '', 
  initialBadge,
  categories = ['All', 'Tech', 'Fashion'],
  basePath = '/',
}) {
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [saleOnly, setSaleOnly] = useState(initialBadge === 'SALE');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [qtyModal, setQtyModal] = useState({ open: false, product: null });
  const [selectedQty, setSelectedQty] = useState(1);
  const { addToCart } = useCart();
  const sentinelRef = useRef(null);

  const products = initialProducts || [];

  const handleCategoryChange = useCallback((cat) => {
    setCategory(cat);
    setPage(1);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
  };

  const toggleSaleOnly = useCallback(() => {
    setSaleOnly(prev => !prev);
    setPage(1);
  }, []);

  const filtered = products.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchSale = !saleOnly || p.badge === 'SALE';
    return matchCat && matchSearch && matchSale;
  });

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true);
          setTimeout(() => {
            setPage(p => p + 1);
            setLoading(false);
          }, 400);
        }
      },
      { rootMargin: '200px' }
    );
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page]);

  const openQtyModal = (product) => {
    setQtyModal({ open: true, product });
    setSelectedQty(1);
  };

  const closeQtyModal = () => {
    setQtyModal({ open: false, product: null });
    setSelectedQty(1);
  };

  const addToCartHandler = () => {
    if (qtyModal.product) {
      addToCart(qtyModal.product, selectedQty);
      closeQtyModal();
    }
  };

  const title = saleOnly ? 'On Sale' : category === 'All' ? 'All Products' : category;

  return (
    <div className={styles.container}>
      <div className="container">
        <SectionHeader title={title} subtitle={`${filtered.length} items available`} />

        {/* Search Input - Hidden on mobile via CSS */}
        <div className={styles.searchInputContainer}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>

        {/* Filters */}
        <div className={styles.filtersRow}>
          <div className={styles.categoryPills}>
           {['All', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`${styles.categoryPill} ${category === cat ? styles.categoryPillActive : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleSaleOnly}
            className={`${styles.saleToggle} ${saleOnly ? styles.saleToggleActive : ''}`}
          >
            On Sale
          </button>
        </div>

        {/* Quick Add Modal - Moved outside conditional */}
        {qtyModal.open && qtyModal.product && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Add to Cart</h3>
                <button onClick={closeQtyModal} className={styles.modalClose} aria-label="Close">
                  ×
                </button>
              </div>

              <div className={styles.modalProductInfo}>
                <div className={styles.modalTotalPrice}>{formatRWF(qtyModal.product.price * selectedQty)}</div>
                <div className={styles.modalProductName}>{qtyModal.product.name}</div>
                <div className={styles.modalStock}>
                  Stock: {qtyModal.product?.stock !== undefined ? qtyModal.product.stock : 'Unlimited'}
                </div>
              </div>

              <div className={styles.qtyControls}>
                <button onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))} className={styles.qtyBtn}>
                  −
                </button>
                <span className={styles.qtyDisplay}>{selectedQty}</span>
                <button 
                  onClick={() => setSelectedQty(Math.min(selectedQty + 1, qtyModal.product?.stock ?? 99))} 
                  className={styles.qtyBtn}
                >
                  +
                </button>
              </div>

              <button
                onClick={addToCartHandler}
                disabled={qtyModal.product?.stock === 0 || selectedQty === 0}
                className={styles.addToCartModalBtn}
              >
                Add {selectedQty} to Cart
              </button>
            </div>
          </div>
        )}

        {/* Products or Empty */}
        {visible.length > 0 ? (
          <>
            <div className={styles.productGrid}>
              {visible.map(product => (
                <ProductCard key={product.id} product={product} onOpenModal={openQtyModal} />
              ))}
            </div>

            <div ref={sentinelRef} style={{ height: 1 }} />

            {loading && <div className={styles.loadingIndicator}>Loading more...</div>}

            {!hasMore && visible.length > PAGE_SIZE && (
              <div className={styles.endOfResults}>All products loaded</div>
            )}
          </>
        ) : (
          <div className={styles.noProducts}>
            <div className={styles.noProductsTitle}>No products found</div>
            <div className={styles.noProductsSubtitle}>Try a different search or category</div>
          </div>
        )}
      </div>
    </div>
  );
}
