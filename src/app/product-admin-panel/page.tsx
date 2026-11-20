import React from 'react';
import { Metadata } from 'next';
import { getProductAdminSession } from '@/lib/product-admin/auth';
import { getProductsFromZoho } from '@/lib/zoho/products';
import ProductAdminDashboardClient from './ProductAdminDashboardClient';
import AdminLoginForm from './AdminLoginForm';

export const metadata: Metadata = {
  title: 'OfficeBazzar Product Admin | Standalone Management Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductAdminPanelPage() {
  const session = await getProductAdminSession();

  // If not authenticated, render standalone login form
  if (!session.authenticated) {
    return <AdminLoginForm />;
  }

  // Load products directly from Zoho CRM / store
  const products = await getProductsFromZoho(true);

  return (
    <ProductAdminDashboardClient
      initialProducts={products}
      adminEmail={session.email || 'admin@officebazzar.com'}
    />
  );
}
