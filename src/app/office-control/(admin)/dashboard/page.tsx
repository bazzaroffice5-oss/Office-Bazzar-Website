import React from 'react';
import { getAdminProducts, getCategories, getBrands } from '@/lib/db/store';
import AdminDashboardManageClient from '@/components/admin/AdminDashboardManageClient';

export const dynamic = 'force-dynamic';

export default async function OfficeControlDashboardPage() {
  const [products, categories, brands] = await Promise.all([
    getAdminProducts(),
    getCategories(),
    getBrands(),
  ]);

  return (
    <AdminDashboardManageClient
      initialProducts={products}
      categories={categories}
      brands={brands}
    />
  );
}
