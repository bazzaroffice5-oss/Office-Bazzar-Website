import React from 'react';
import { Metadata } from 'next';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';
import {
  getAdminProducts,
  getAllOrders,
  getBulkRFQs,
  getCategories,
  getBrands,
  getAllQuotations,
  getNotificationLogs,
} from '@/lib/db/store';

export const metadata: Metadata = {
  title: 'Admin & Sales Management Console | OfficeBazzar',
  description: 'Manage products, inventory, orders, customer shipments, and Request for Quotations (RFQs).',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [products, orders, rfqs, categories, brands, quotations, notificationLogs] = await Promise.all([
    getAdminProducts(),
    getAllOrders(),
    getBulkRFQs(),
    getCategories(),
    getBrands(),
    getAllQuotations(),
    getNotificationLogs(),
  ]);

  return (
    <div className="bg-slate-100 min-h-screen">
      <AdminDashboardClient
        initialProducts={products}
        initialOrders={orders}
        initialRFQs={rfqs}
        categories={categories}
        brands={brands}
        initialQuotations={quotations}
        initialNotificationLogs={notificationLogs}
      />
    </div>
  );
}
