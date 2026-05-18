'use client';

import { useState, useEffect } from 'react';

export default function SaleCountdown({ endsAt, style = {} }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt) - Date.now();
      if (diff <= 0) { setLabel('Ended'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      if (h >= 48) {
        setLabel(`${Math.floor(h / 24)}d ${h % 24}h left`);
      } else {
        setLabel(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s left`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return <span style={style}>{label}</span>;
}