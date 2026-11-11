'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { useAuth } from './AuthContext';

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    slug: string;
    images: { url: string }[];
    vendor: { id: string; businessName: string };
  };
  variant: {
    id: string;
    title: string;
    price: number;
    mrp: number;
    inventory?: { stockQuantity: number; reservedQuantity: number };
  };
}

interface CartContextType {
  cart: {
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    itemCount: number;
  } | null;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user || !token || user.role === 'VENDOR') {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const res = await ApiClient.get('/cart');
      if (res.success) {
        setCart(res.data);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        setCart(null);
        return;
      }
      console.error('Failed to load cart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user?.id, token]);

  const addToCart = async (productId: string, variantId: string, quantity = 1) => {
    if (user?.role === 'VENDOR') {
      throw new Error('Shop owner accounts can only sell products and cannot purchase orders.');
    }
    const res = await ApiClient.post('/cart/items', { productId, variantId, quantity });
    if (res.success) {
      setCart(res.data);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (user?.role === 'VENDOR') {
      throw new Error('Shop owner accounts can only sell products and cannot purchase orders.');
    }
    const res = await ApiClient.patch(`/cart/items/${cartItemId}`, { quantity });
    if (res.success) {
      setCart(res.data);
    }
  };

  const removeItem = async (cartItemId: string) => {
    if (user?.role === 'VENDOR') {
      throw new Error('Shop owner accounts can only sell products and cannot purchase orders.');
    }
    const res = await ApiClient.delete(`/cart/items/${cartItemId}`);
    if (res.success) {
      setCart(res.data);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        refreshCart: fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

