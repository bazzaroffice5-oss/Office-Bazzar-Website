import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession, isAuthorizedAdminEmail } from '@/lib/auth/adminSession';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session.isAuthenticated || !session.email || !isAuthorizedAdminEmail(session.email)) {
    console.log(`[AdminLayout] Access blocked: Session unauthenticated or unauthorized. Email: "${session.email || 'none'}". Redirecting to /office-control/login.`);
    redirect('/office-control/login');
  }

  return (
    <AdminLayoutClient adminEmail={session.email}>
      {children}
    </AdminLayoutClient>
  );
}
