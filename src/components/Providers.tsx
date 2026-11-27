'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { LocationProvider } from '@/context/LocationContext';
import { AuthProvider } from '@/context/AuthContext';
import { RFQProvider } from '@/context/RFQContext';
import CartDrawer from '@/components/cart/CartDrawer';
import PincodeModal from '@/components/modals/PincodeModal';

const BazzarAIChatbot = dynamic(() => import('@/components/chatbot/BazzarAIChatbot'), {
  ssr: false,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAdminHost, setIsAdminHost] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('admin.officebazzar.com')) {
      setIsAdminHost(true);
    }
  }, []);

  const isAdmin =
    pathname?.startsWith('/blog-admin-panel') ||
    pathname?.startsWith('/product-admin-panel') ||
    pathname?.startsWith('/analytics-admin-panel') ||
    pathname === '/admin' ||
    pathname?.startsWith('/admin/') ||
    isAdminHost;

  // Complete isolation for standalone admin dashboards (blog, product catalog, analytics, orders):
  // Do not load public e-commerce providers, floating cart drawer, pincode modal, or customer AI chatbot
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <WishlistProvider>
            <RFQProvider>
              {children}
              <CartDrawer />
              <PincodeModal />
              <BazzarAIChatbot />
            </RFQProvider>
          </WishlistProvider>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
