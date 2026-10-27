'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerUser, Address } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/db/supabase';

interface AuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthConfigured: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: Partial<CustomerUser>, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  savedAddresses: Address[];
  addAddress: (address: Address) => Promise<void>;
  removeAddress: (index: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and listen to active Supabase authentication session
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (!isSupabaseConfigured || !supabase) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user && mounted) {
          await loadUserProfile(session.user.id, session.user.email || '');
        }
      } catch (err) {
        console.warn('Error fetching Supabase auth session:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Setup real-time auth state listener
    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        if (session?.user) {
          await loadUserProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setSavedAddresses([]);
        }
        if (mounted) {
          setIsLoading(false);
        }
      });
      subscription = data?.subscription || null;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch verified profile and role from PostgreSQL profiles table
  async function loadUserProfile(userId: string, email: string) {
    if (!supabase) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const customerUser: CustomerUser = {
        id: userId,
        name: profile?.full_name || email.split('@')[0],
        email: email,
        phone: profile?.phone,
        companyName: profile?.company_name,
        gstin: profile?.gstin,
        role: profile?.role === 'admin' ? 'admin' : 'customer',
      };

      setUser(customerUser);

      // Load saved addresses
      const { data: addresses } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('profile_id', userId)
        .order('is_default', { ascending: false });

      if (addresses && addresses.length > 0) {
        setSavedAddresses(
          addresses.map((a) => ({
            fullName: a.contact_name,
            phone: a.contact_phone,
            companyName: a.company_name,
            gstin: a.gstin,
            addressLine1: a.address_line1,
            addressLine2: a.address_line2,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            isDefault: a.is_default,
          }))
        );
      }
    } catch (err) {
      console.warn('Error fetching user profile:', err);
    }
  }

  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Database authentication is not connected. Please provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in environment configuration.',
      };
    }

    if (!password) {
      return { success: false, message: 'Password is required to sign in.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user.id, data.user.email || email);
      }

      return { success: true, message: 'Signed in successfully.' };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : 'Authentication error.' };
    }
  };

  const register = async (
    userData: Partial<CustomerUser>,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Database authentication is not connected. Please provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in environment configuration.',
      };
    }

    if (!userData.email || !userData.name || !password) {
      return { success: false, message: 'Full name, email, and password are required.' };
    }

    try {
      const cleanEmail = userData.email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: userData.name,
            phone: userData.phone,
            company_name: userData.companyName,
            gstin: userData.gstin,
          },
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      // Upsert profile in PostgreSQL profiles table
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: userData.name,
          phone: userData.phone,
          company_name: userData.companyName,
          gstin: userData.gstin,
          role: 'customer',
        });

        await loadUserProfile(data.user.id, cleanEmail);
      }

      return {
        success: true,
        message: data.session
          ? 'Account registered successfully.'
          : 'Registration successful! Please check your email to verify your account.',
      };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : 'Registration error.' };
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSavedAddresses([]);
  };

  const addAddress = async (address: Address) => {
    setSavedAddresses((prev) => [address, ...prev]);

    if (isSupabaseConfigured && supabase && user) {
      try {
        await supabase.from('customer_addresses').insert({
          profile_id: user.id,
          contact_name: address.fullName,
          contact_phone: address.phone,
          company_name: address.companyName,
          gstin: address.gstin,
          address_line1: address.addressLine1,
          address_line2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          is_default: Boolean(address.isDefault),
        });
      } catch (err) {
        console.warn('Could not persist address to database:', err);
      }
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
        isAuthConfigured: isSupabaseConfigured,
        login,
        register,
        logout,
        savedAddresses,
        addAddress,
        removeAddress,
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
