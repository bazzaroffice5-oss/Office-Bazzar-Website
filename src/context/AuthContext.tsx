'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CustomerUser, Address } from '@/types';

interface AuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthConfigured: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; requiresOtp?: boolean; message?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  sendOtp: (email: string, name?: string) => Promise<{ success: boolean; message?: string; cooldown?: number }>;
  register: (userData: Partial<CustomerUser>, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  savedAddresses: Address[];
  addAddress: (address: Address) => Promise<void>;
  removeAddress: (index: number) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from server-side HttpOnly cookie and Zoho CRM Contacts
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setSavedAddresses(data.addresses || []);
          return;
        }
      }
      setUser(null);
      setSavedAddresses([]);
    } catch (err) {
      console.warn('[AuthContext] Session fetch error:', err);
      setUser(null);
      setSavedAddresses([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      await refreshSession();
      if (mounted) {
        setIsLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [refreshSession]);

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; requiresOtp?: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Email address is required.' };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.error || data.message || 'Login failed. Please verify your credentials.',
        };
      }

      if (data.requiresOtp) {
        return {
          success: false,
          requiresOtp: true,
          message: data.message || 'Verification code sent to your email.',
        };
      }

      if (data.user) {
        setUser(data.user);
        await refreshSession();
      }

      return { success: true, message: data.message || 'Signed in successfully.' };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Authentication network error.',
      };
    }
  };

  const sendOtp = async (
    email: string,
    name?: string
  ): Promise<{ success: boolean; message?: string; cooldown?: number }> => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'Failed to dispatch verification code.' };
      }
      return { success: true, message: data.message, cooldown: data.cooldown };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Error sending code.',
      };
    }
  };

  const verifyOtp = async (
    email: string,
    otp: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'Invalid verification code.' };
      }
      if (data.user) {
        setUser(data.user);
        await refreshSession();
      }
      return { success: true, message: data.message || 'Verification successful.' };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Verification network error.',
      };
    }
  };

  const register = async (
    userData: Partial<CustomerUser>,
    _password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!userData.email || !userData.name) {
      return { success: false, message: 'Full name and business email are required.' };
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          companyName: userData.companyName,
          gstin: userData.gstin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'Registration failed.' };
      }

      if (data.user) {
        setUser(data.user);
        await refreshSession();
      }

      return {
        success: true,
        message: data.message || 'Account registered successfully.',
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Registration network error.',
      };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('[AuthContext] Logout fetch warning:', err);
    }
    setUser(null);
    setSavedAddresses([]);
  };

  const addAddress = async (address: Address) => {
    // Optimistic UI update
    setSavedAddresses((prev) => [address, ...prev]);

    try {
      const res = await fetch('/api/auth/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.addresses) {
          setSavedAddresses(data.addresses);
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Could not persist address to Zoho CRM:', err);
    }
  };

  const removeAddress = async (index: number) => {
    setSavedAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        isLoading,
        isAuthConfigured: true,
        login,
        sendOtp,
        verifyOtp,
        register,
        logout,
        savedAddresses,
        addAddress,
        removeAddress,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
