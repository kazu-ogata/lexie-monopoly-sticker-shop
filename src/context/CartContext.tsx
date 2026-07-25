'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  const [userId, setUserId] = useState<string>('guest');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);

  // 1. Monitor user session changes to switch cart keys
  useEffect(() => {
    async function resolveUser() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const currentUid = session?.user?.id || 'guest';
      setUserId(currentUid);

      // Load saved cart for current account
      const cartKey = `lexie_cart_${currentUid}`;
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch {
          setCart([]);
        }
      } else {
        setCart([]);
      }
    }

    resolveUser();
  }, []);

  // 2. Sync cart changes to user-specific localStorage key
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cartKey = `lexie_cart_${userId}`;
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, userId]);

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

  const clearCart = () => setCart([]);

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