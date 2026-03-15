'use client';

import React from 'react';

export const TabButton = React.memo(function TabButton({ tab, label, icon, onClick, activeTab, ...props }) {
  return (
    <button
      onClick={onClick}
      {...props}
      style={{
        flex: 1, padding: '12px 8px',
        border: 'none',
        background: activeTab === tab ? 'var(--surface-2)' : 'transparent',
        color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: activeTab === tab ? 600 : 400,
        display: 'flex', flexDirection: 'column', gap: 6,
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 12, letterSpacing: 0.5 }}>{label}</span>
    </button>
  );
});

TabButton.displayName = 'TabButton';

