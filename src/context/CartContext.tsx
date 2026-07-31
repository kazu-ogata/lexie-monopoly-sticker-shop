'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  rarity: string;
  image_url?: string;
  quantity: number;
  ign: string;
  inviteLink: string;
}

interface CartContextType {
  cart: CartItem[];
  buyNowItem: CartItem | null;
  setBuyNowItem: (item: CartItem | null) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalCost: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // 1. Initialize synchronously from localStorage so data is NEVER lost on redirect
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('lexie_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [buyNowItem, setBuyNowItemState] = useState<CartItem | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('lexie_buynow');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Keep localStorage synced instantly whenever cart changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lexie_cart', JSON.stringify(cart));
    }
  }, [cart]);

  // 3. Keep localStorage synced instantly whenever buyNowItem changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (buyNowItem) {
        localStorage.setItem('lexie_buynow', JSON.stringify(buyNowItem));
      } else {
        localStorage.removeItem('lexie_buynow');
      }
    }
  }, [buyNowItem]);

  const setBuyNowItem = (item: CartItem | null) => {
    setBuyNowItemState(item);
  };

  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === newItem.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        if (newItem.ign) updated[existingIndex].ign = newItem.ign;
        if (newItem.inviteLink) updated[existingIndex].inviteLink = newItem.inviteLink;
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setBuyNowItemState(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lexie_cart');
      localStorage.removeItem('lexie_buynow');
    }
  };

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        buyNowItem,
        setBuyNowItem,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        totalCost,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}