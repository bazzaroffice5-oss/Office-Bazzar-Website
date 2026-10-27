'use client';

import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { LocationProvider } from '@/context/LocationContext';
import { AuthProvider } from '@/context/AuthContext';
import { RFQProvider } from '@/context/RFQContext';
import CartDrawer from '@/components/cart/CartDrawer';
import PincodeModal from '@/components/modals/PincodeModal';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <WishlistProvider>
            <RFQProvider>
              {children}
              <CartDrawer />
              <PincodeModal />
            </RFQProvider>
          </WishlistProvider>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
