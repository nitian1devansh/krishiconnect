'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/lib/api';
import { useAuth } from './AuthContext';

export interface WishlistProduct {
  id: string;
  title: string;
  titleHi?: string | null;
  slug: string;
  rating?: number | string;
  reviewCount?: number;
  status?: string;
  organicCertified?: boolean;
  images?: { id?: string; url: string; isPrimary?: boolean }[];
  variants?: {
    id: string;
    title: string;
    sku?: string;
    price: number | string;
    mrp: number | string;
    inventory?: { stockQuantity: number; reservedQuantity: number } | null;
  }[];
  category?: { id: string; name: string; nameHi?: string | null; slug: string } | null;
  vendor?: {
    id: string;
    businessName: string;
    storeSlug: string;
    city?: string | null;
    state?: string | null;
  } | null;
}

export interface WishlistEntry {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
}

interface WishlistContextType {
  wishlist: WishlistEntry[];
  loading: boolean;
  error: string | null;
  isWishlisted: (productId: string | number) => boolean;
  refreshWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<{ added: boolean }>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWishlist = useCallback(async () => {
    if (!user || !token || user.role === 'VENDOR') {
      setWishlist([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.get('/users/wishlist');
      if (res.success && Array.isArray(res.data)) {
        setWishlist(res.data);
      } else {
        setWishlist([]);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        setWishlist([]);
        setError(null);
        return;
      }
      setError(err.message || 'Unable to load saved wishlist from database.');
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isWishlisted = useCallback(
    (productId: string | number) => wishlist.some((item) => item.productId === String(productId)),
    [wishlist]
  );

  const addToWishlist = async (productId: string) => {
    if (user?.role === 'VENDOR') {
      throw new Error('Shop owner accounts can only sell products.');
    }
    await ApiClient.post(`/users/wishlist/${productId}`);
    await refreshWishlist();
  };

  const removeFromWishlist = async (productId: string) => {
    if (user?.role === 'VENDOR') {
      throw new Error('Shop owner accounts can only sell products.');
    }
    await ApiClient.delete(`/users/wishlist/${productId}`);
    setWishlist((prev) => prev.filter((item) => item.productId !== productId));
  };

  const toggleWishlist = async (productId: string): Promise<{ added: boolean }> => {
    if (isWishlisted(productId)) {
      await removeFromWishlist(productId);
      return { added: false };
    } else {
      await addToWishlist(productId);
      return { added: true };
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        error,
        isWishlisted,
        refreshWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

