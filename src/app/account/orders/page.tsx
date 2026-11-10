import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cookies } from 'next/headers';
import { getOrdersByCustomer, getAllOrders } from '@/lib/db/store';
import { verifySessionToken } from '@/lib/auth/service';
import CustomerOrdersClient from '@/components/account/CustomerOrdersClient';
import { Order } from '@/types';

export const metadata = {
  title: 'Order History & Tax Invoices | OfficeBazzar',
  description: 'View previous enterprise orders, track delivery milestones, and access GST invoices.',
};

export const dynamic = 'force-dynamic';

export default async function AccountOrdersPage() {
  // Enforce server-side customer isolation:
  // Strictly resolve active session from HttpOnly cookie and query ONLY the customer's orders
  let isolatedOrders: Order[] = [];
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('ob_session')?.value;
    if (sessionToken) {
      const { valid, user } = verifySessionToken(sessionToken);
      if (valid && user) {
        if (user.role === 'admin') {
          isolatedOrders = await getAllOrders();
        } else if (user.email) {
          isolatedOrders = await getOrdersByCustomer(user.email);
        }
      }
    }
  } catch (err) {
    console.warn('[AccountOrdersPage] Session read error:', err);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 mb-8 gap-4">
        <div>
          <nav className="flex items-center space-x-2 text-xs text-slate-500 mb-2 font-medium">
            <Link href="/" className="hover:text-blue-900">Home</Link>
            <span>/</span>
            <Link href="/account" className="hover:text-blue-900">Account</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Orders</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Order History &amp; Tax Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track current shipments, view order line items, and print GST tax invoices.
          </p>
        </div>

        <Link
          href="/products"
          className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <span>Reorder Supplies</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <CustomerOrdersClient initialOrders={isolatedOrders} />
    </div>
  );
}
