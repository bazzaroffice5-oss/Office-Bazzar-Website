import React from 'react';
import { Metadata } from 'next';
import { getAdminSession } from '@/lib/blog-admin/auth';
import { listAllAdminPosts } from '@/lib/blog-admin/storage';
import BlogAdminDashboardClient from './BlogAdminDashboardClient';
import AdminLoginForm from './AdminLoginForm';
import AdminSetupNotice from './AdminSetupNotice';

export const metadata: Metadata = {
  title: 'Private Blog Admin Panel | OfficeBazzar',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function BlogAdminPanelPage() {
  const session = await getAdminSession();

  // If server-side admin credentials are not configured in Vercel
  if (!session.configured) {
    return <AdminSetupNotice missingConfig={session.missingConfig || []} />;
  }

  // If not authenticated, render login form
  if (!session.authenticated) {
    return <AdminLoginForm />;
  }

  // Authenticated: load posts for dashboard
  const posts = await listAllAdminPosts();

  return (
    <BlogAdminDashboardClient
      initialPosts={posts}
      username={session.username || 'Admin'}
    />
  );
}

