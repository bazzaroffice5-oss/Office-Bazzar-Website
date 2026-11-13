import React from 'react';
import { Metadata } from 'next';
import { getAdminSession } from '@/lib/blog-admin/auth';
import { listAllAdminPosts } from '@/lib/blog-admin/storage';
import BlogAdminDashboardClient from './BlogAdminDashboardClient';
import AdminLoginForm from './AdminLoginForm';

export const metadata: Metadata = {
  title: 'OfficeBazzar Blog Admin | Standalone CMS',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function BlogAdminPanelPage() {
  const session = await getAdminSession();

  // If not authenticated, render the dedicated standalone login form
  if (!session.authenticated) {
    return <AdminLoginForm />;
  }

  // Authenticated: load all posts (published and drafts) for the CMS dashboard
  const posts = await listAllAdminPosts();

  return (
    <BlogAdminDashboardClient
      initialPosts={posts}
      username={session.username || 'bazzaroffice5@gmail.com'}
    />
  );
}
