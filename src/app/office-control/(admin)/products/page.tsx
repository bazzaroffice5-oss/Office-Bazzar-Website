import React from 'react';
import { getAdminProducts, getCategories, getBrands } from '@/lib/db/store';
import AdminDashboardManageClient from '@/components/admin/AdminDashboardManageClient';

export const dynamic = 'force-dynamic';

export default async function OfficeControlProductsPage() {
  const [products, categories, brands] = await Promise.all([
    getAdminProducts(),
    getCategories(),
    getBrands(),
  ]);

  return (
    <div className="space-y-6">
      <AdminDashboardManageClient
        initialProducts={products}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
