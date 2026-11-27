'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * PublicLayoutShell handles strict layout isolation between the public website
 * and the standalone Admin Panels at /blog-admin-panel and /product-admin-panel.
 *
 * When accessing /blog-admin-panel or /product-admin-panel, public header, navigation, and footer
 * are completely omitted, rendering only the standalone management applications.
 */
export default function PublicLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin =
    pathname?.startsWith('/blog-admin-panel') ||
    pathname?.startsWith('/product-admin-panel') ||
    pathname?.startsWith('/analytics-admin-panel') ||
    pathname?.startsWith('/admin');

  if (isAdmin) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}

