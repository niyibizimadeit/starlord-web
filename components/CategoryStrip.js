'use client';

import Link from 'next/link';
import { useState } from 'react';

const CATS = [
  { label: 'All Products', href: '/',                  desc: 'Browse everything'      },
  { label: 'Tech',         href: '/?category=Tech',    desc: 'Cases and accessories'  },
  { label: 'Fashion',      href: '/?category=Fashion', desc: 'Belts and eyewear'      },
  { label: 'On Sale',      href: '/?badge=SALE',       desc: 'Limited time offers'    },
];

function CategoryCard({ cat, index, total }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={cat.href}
      style={{
        padding: '20px 24px',
        borderRight: index < total - 1 ? '1px solid var(--border)' : 'none',
        display: 'block',
        background: hovered ? 'var(--surface-2)' : 'transparent',
        transition: 'background 0.2s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        fontSize: 13, fontWeight: 700,
        color: hovered ? 'var(--gold)' : 'var(--text)',
        marginBottom: 3,
        fontFamily: 'Playfair Display, serif',
        transition: 'color 0.2s',
      }}>
        {cat.label}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
        {cat.desc}
      </div>
    </Link>
  );
}

export default function CategoryStrip() {
  return (
    <section style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      }}>
        {CATS.map((cat, i) => (
          <CategoryCard key={cat.label} cat={cat} index={i} total={CATS.length} />
        ))}
      </div>
    </section>
  );
}