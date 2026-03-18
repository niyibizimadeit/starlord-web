'use client';

import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

// Generate a unique cart key based on product id + selected variations
function cartKey(product) {
  const varKey = product.selectedVariations?.length
    ? JSON.stringify(product.selectedVariations.map(v => `${v.name}:${v.option}`).sort())
    : '';
  return `${product.id}__${varKey}`;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (product, quantity = 1) => {
    const key = cartKey(product);
    setCart(prev => {
      const existing = prev.find(i => i._cartKey === key);
      if (existing) {
        return prev.map(i =>
          i._cartKey === key
            ? { ...i, qty: i.qty + quantity }
            : i
        );
      }
      return [...prev, { ...product, qty: quantity, _cartKey: key }];
    });
  };

  const removeFromCart = (key) => {
    setCart(prev => prev.filter(i => i._cartKey !== key));
  };

  const updateQty = (key, delta) => {
    setCart(prev =>
      prev.map(i =>
        i._cartKey === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}