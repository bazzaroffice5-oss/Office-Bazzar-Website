import React from 'react';
import { Metadata } from 'next';
import { getAnalyticsAdminSession } from '@/lib/analytics/auth';
import { getAnalyticsData } from '@/lib/analytics/store';
import AdminLoginForm from './AdminLoginForm';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';

export const metadata: Metadata = {
  title: 'Office Bazzar | Quote & Traffic Analytics Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AnalyticsAdminPanelPage() {
  const session = await getAnalyticsAdminSession();

  if (!session.authenticated) {
    return <AdminLoginForm />;
  }

  const initialData = await getAnalyticsData('all');

  return (
    <AnalyticsDashboardClient
      initialData={initialData}
      adminEmail={session.email || 'bazzaroffice5@gmail.com'}
    />
  );
}
