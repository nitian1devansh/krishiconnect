'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ApiClient,
  isValidJwtFormat,
  REFRESH_TOKEN_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from '@/lib/api';

export type VerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'MORE_INFORMATION_REQUIRED'
  | 'SUSPENDED';

export type VendorStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'MORE_INFORMATION_REQUIRED'
  | 'SUSPENDED';

export interface FarmerProfile {
  id: string;
  farmSize: number;
  farmSizeUnit: string;
  village?: string;
  city?: string;
  district: string;
  state: string;
  pincode?: string;
  status: VerificationStatus;
  rejectionReason?: string | null;
}

export interface VendorProfile {
  id: string;
  businessName: string;
  storeSlug: string;
  businessType?: string;
  categories?: string;
  establishedSince?: string;
  gstin?: string;
  businessAddress?: string;
  village?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountName?: string;
  bankName?: string;
  status: VendorStatus;
  verificationRemarks?: string | null;
  rejectionReason?: string | null;
  commissionRate?: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'FARMER' | 'VENDOR' | 'ADMIN';
  status?: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  preferredLanguage?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  farmerProfile?: FarmerProfile | null;
  vendorProfile?: VendorProfile | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshAuthToken: () => Promise<string | null>;
  updateFarmerProfileLocal: (profile: Partial<FarmerProfile>) => void;
  updateVendorProfileLocal: (profile: Partial<VendorProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearLocalAuth = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await ApiClient.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data));
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        clearLocalAuth();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onSessionExpired = () => {
      clearLocalAuth();
      setLoading(false);
    };

    const onTokenRefreshed = (e: Event) => {
      const custom = e as CustomEvent<{ token?: string }>;
      if (custom.detail?.token) {
        setToken(custom.detail.token);
      }
    };

    window.addEventListener('krishi:session-expired', onSessionExpired);
    window.addEventListener('krishi:token-refreshed', onTokenRefreshed);

    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (savedToken && isValidJwtFormat(savedToken)) {
      setToken(savedToken);
      if (savedRefreshToken && isValidJwtFormat(savedRefreshToken)) {
        setRefreshToken(savedRefreshToken);
      }
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore parse error
        }
      }
      fetchProfile();
    } else {
      if (savedToken || savedRefreshToken || savedUser) {
        clearLocalAuth();
      }
      setLoading(false);
    }

    return () => {
      window.removeEventListener('krishi:session-expired', onSessionExpired);
      window.removeEventListener('krishi:token-refreshed', onTokenRefreshed);
    };
  }, []);

  const login = (newToken: string, newUser: User, newRefreshToken?: string) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, newRefreshToken);
    } else {
      setRefreshToken(null);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  };

  const logout = async () => {
    try {
      if (token && isValidJwtFormat(token)) {
        await ApiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore network errors on logout
    }
    clearLocalAuth();
  };

  const refreshAuthToken = async (): Promise<string | null> => {
    const activeRefresh =
      refreshToken ||
      (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) : null);
    if (!activeRefresh || !isValidJwtFormat(activeRefresh)) return null;
    try {
      const res = await ApiClient.post('/auth/refresh-token', { refreshToken: activeRefresh });
      const nextToken = res?.data?.accessToken || res?.data?.token;
      if (res.success && nextToken && isValidJwtFormat(nextToken)) {
        setToken(nextToken);
        localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
        return nextToken;
      }
    } catch {
      clearLocalAuth();
    }
    return null;
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  const updateFarmerProfileLocal = (profile: Partial<FarmerProfile>) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      farmerProfile: {
        ...(user.farmerProfile || {
          id: 'fp-1',
          farmSize: 5,
          farmSizeUnit: 'acres',
          district: 'Nashik',
          state: 'Maharashtra',
          status: 'PENDING_VERIFICATION',
        }),
        ...profile,
      },
    };
    setUser(updatedUser);
    localStorage.setItem('krishi_user', JSON.stringify(updatedUser));
  };

  const updateVendorProfileLocal = (profile: Partial<VendorProfile>) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      vendorProfile: {
        ...(user.vendorProfile || {
          id: 'vp-1',
          businessName: 'My Agri Shop',
          storeSlug: 'my-agri-shop',
          status: 'PENDING',
        }),
        ...profile,
      },
    };
    setUser(updatedUser);
    localStorage.setItem('krishi_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        loading,
        login,
        logout,
        refreshUser,
        refreshAuthToken,
        updateFarmerProfileLocal,
        updateVendorProfileLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
