'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FileText,
  User as UserIcon,
  MapPin,
  Heart,
  LogOut,
  Trash2,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { Quotation, Order } from '@/types';

interface AccountOrderSummary {
  id: string;
  orderNumber: string;
  createdAt: string;
  orderStatus: string;
  totalAmount: number;
}

interface AccountRfqSummary {
  id: string;
  quotationNumber: string;
  createdAt: string;
  status: string;
  items?: unknown[];
  itemsCount?: number;
}

function CustomerAccountDashboardContent() {
  const searchParams = useSearchParams();
  const { user, logout, savedAddresses, addAddress, removeAddress } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();

  const tabParam = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  const [rfqs, setRfqs] = useState<Quotation[]>([]);
  const [orders] = useState<Order[]>([]);

  // Address form modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const city = 'Chennai';
  const state = 'Tamil Nadu';
  const [pincode, setPincode] = useState('600014');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Fetch real RFQs for current customer
  useEffect(() => {
    async function loadCustomerData() {
      try {
        const query = user?.id ? `customerId=${user.id}` : `email=${encodeURIComponent(user?.email || 'sales@officebazzar.co.in')}`;
        const res = await fetch(`/api/quotations/customer?${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quotations) setRfqs(data.quotations);
        }
      } catch (e) {
        console.error('Error fetching customer quotations', e);
      }
    }

    loadCustomerData();
  }, [user]);

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !addressLine1 || !pincode) return;

    addAddress({
      fullName,
      phone,
      addressLine1,
      city,
      state,
      pincode,
      companyName: user?.companyName,
      gstin: user?.gstin,
    });
    setShowAddressModal(false);
    setAddressLine1('');
  };

  // Mock initial demo orders if empty to demonstrate real table layout
  const displayOrders = orders.length > 0 ? orders : [
    {
      id: 'ord-1',
      orderNumber: '#OB-2024-001',
      createdAt: '10 Mar 2026',
      orderStatus: 'delivered',
      totalAmount: 12320,
    },
    {
      id: 'ord-2',
      orderNumber: '#OB-2024-002',
      createdAt: '28 Feb 2026',
      orderStatus: 'processing',
      totalAmount: 8150,
    },
    {
      id: 'ord-3',
      orderNumber: '#OB-2024-003',
      createdAt: '14 Feb 2026',
      orderStatus: 'delivered',
      totalAmount: 15340,
    },
  ];

  // RFQ rows
  const displayRfqs = rfqs.length > 0 ? rfqs : [
    {
      id: 'rfq-1',
      quotationNumber: '#RFQ-2024-001',
      createdAt: '12 Mar 2026',
      status: 'under_review',
      itemsCount: 12,
    },
    {
      id: 'rfq-2',
      quotationNumber: '#RFQ-2024-002',
      createdAt: '05 Mar 2026',
      status: 'quoted',
      itemsCount: 8,
    },
    {
      id: 'rfq-3',
      quotationNumber: '#RFQ-2024-003',
      createdAt: '20 Feb 2026',
      status: 'closed',
      itemsCount: 5,
    },
  ];

  const displayName = user?.name || 'John Doe';
  const displayEmail = user?.email || 'john@company.com';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const totalOrdersCount = displayOrders.length;
  const totalRfqsCount = displayRfqs.length;
  const savedItemsCount = wishlist.length > 0 ? wishlist.length : 5;

  return (
    <main className="min-h-screen bg-slate-50/70 py-8 sm:py-10">
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-[#004b87] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">My Account</span>
        </nav>

        {/* Top Header Card matching Panel 6 of Reference */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* User Profile Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#004b87] text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug truncate">
                {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 truncate">{displayEmail}</p>
            </div>
          </div>

          {/* 3 Metric Summary Cards matching Reference */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
            {/* 1. Total Orders */}
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 sm:px-4 text-center min-w-[90px] sm:min-w-[110px]">
              <div className="text-lg sm:text-xl font-bold text-rose-600">{totalOrdersCount}</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5 whitespace-nowrap">
                Total Orders
              </div>
            </div>

            {/* 2. RFQ Requests */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 sm:px-4 text-center min-w-[90px] sm:min-w-[110px]">
              <div className="text-lg sm:text-xl font-bold text-[#004b87]">{totalRfqsCount}</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5 whitespace-nowrap">
                RFQ Requests
              </div>
            </div>

            {/* 3. Saved Items */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 sm:px-4 text-center min-w-[90px] sm:min-w-[110px]">
              <div className="text-lg sm:text-xl font-bold text-[#16a34a]">{savedItemsCount}</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5 whitespace-nowrap">
                Saved Items
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid: Left Sidebar + Right Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sidebar Menu (3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-50 text-[#16a34a] font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-emerald-50 text-[#16a34a] font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>My Orders</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rfqs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'rfqs'
                  ? 'bg-emerald-50 text-[#16a34a] font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My RFQs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 text-[#16a34a] font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>My Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-emerald-50 text-[#16a34a] font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>My Addresses</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-blue-50 text-[#004b87]'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Wishlist</span>
            </button>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Right Main Content Panel (9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1. Dashboard View (Recent Orders + Recent RFQs matching Reference) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Recent Orders Section */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
                      <p className="text-xs text-slate-400">Track and review your corporate purchases</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#004b87] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4 sm:px-6">Order #</th>
                          <th className="py-3 px-4 sm:px-6">Date</th>
                          <th className="py-3 px-4 sm:px-6">Status</th>
                          <th className="py-3 px-4 sm:px-6">Total</th>
                          <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayOrders.slice(0, 3).map((ord: AccountOrderSummary) => (
                          <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 font-mono">
                              {ord.orderNumber}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 text-slate-500">{ord.createdAt}</td>
                            <td className="py-3.5 px-4 sm:px-6">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  ord.orderStatus === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {ord.orderStatus === 'delivered' ? 'Delivered' : 'Processing'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                              ₹{ord.totalAmount?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              <button
                                type="button"
                                onClick={() => setActiveTab('orders')}
                                className="text-xs font-bold text-[#004b87] hover:underline cursor-pointer"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent RFQs Section */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Recent RFQs</h2>
                      <p className="text-xs text-slate-400">Custom quotations and volume pricing requests</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('rfqs')}
                      className="text-xs font-bold text-[#004b87] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4 sm:px-6">RFQ #</th>
                          <th className="py-3 px-4 sm:px-6">Date</th>
                          <th className="py-3 px-4 sm:px-6">Status</th>
                          <th className="py-3 px-4 sm:px-6">Items</th>
                          <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayRfqs.slice(0, 3).map((rfq: AccountRfqSummary) => (
                          <tr key={rfq.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 font-mono">
                              {rfq.quotationNumber}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                              {typeof rfq.createdAt === 'string' && rfq.createdAt.includes('T')
                                ? new Date(rfq.createdAt).toLocaleDateString('en-IN')
                                : rfq.createdAt}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  rfq.status === 'quoted'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : rfq.status === 'under_review' || rfq.status === 'new'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {rfq.status === 'quoted'
                                  ? 'Quoted'
                                  : rfq.status === 'under_review' || rfq.status === 'new'
                                  ? 'Under Review'
                                  : 'Closed'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 text-slate-600 font-medium">
                              {rfq.items?.length || rfq.itemsCount || 1} items
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              <button
                                type="button"
                                onClick={() => setActiveTab('rfqs')}
                                className="text-xs font-bold text-[#004b87] hover:underline cursor-pointer"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. My Orders View */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">My Orders &amp; Invoices</h2>
                  <span className="text-xs text-slate-500">{displayOrders.length} total orders</span>
                </div>

                <div className="space-y-3">
                  {displayOrders.map((ord: AccountOrderSummary) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 font-mono text-sm">{ord.orderNumber}</div>
                        <div className="text-xs text-slate-500">Ordered on {ord.createdAt} • GST Tax Invoice Available</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-base font-bold text-slate-900">
                          ₹{ord.totalAmount?.toLocaleString('en-IN')}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ord.orderStatus === 'delivered' ? 'Delivered' : 'Processing'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. My RFQs View */}
            {activeTab === 'rfqs' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">My Quotation Requests (RFQs)</h2>
                    <p className="text-xs text-slate-400">Formal bulk pricing proposals prepared by our desk</p>
                  </div>
                  <Link
                    href="/request-quote"
                    className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    + New RFQ
                  </Link>
                </div>

                <div className="space-y-3">
                  {displayRfqs.map((rfq: AccountRfqSummary) => (
                    <div
                      key={rfq.id}
                      className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 font-mono text-sm">{rfq.quotationNumber}</div>
                        <div className="text-xs text-slate-500">
                          Submitted on{' '}
                          {typeof rfq.createdAt === 'string' && rfq.createdAt.includes('T')
                            ? new Date(rfq.createdAt).toLocaleDateString('en-IN')
                            : rfq.createdAt}
                          {' '}• {rfq.items?.length || rfq.itemsCount || 1} Products Requested
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#004b87] border border-blue-200">
                          {rfq.status === 'quoted'
                            ? 'Quoted'
                            : rfq.status === 'under_review' || rfq.status === 'new'
                            ? 'Under Review'
                            : 'Closed'}
                        </span>
                        <Link
                          href={`/account/quotations`}
                          className="text-xs font-bold text-[#004b87] hover:underline"
                        >
                          Details &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. My Profile View */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">Profile &amp; Business Information</h2>
                  <p className="text-xs text-slate-400">Manage your business contact credentials</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      {displayName}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Email Address</label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      {displayEmail}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Company / Organization</label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      {user?.companyName || 'Corporate Enterprise Partner'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Corporate GSTIN</label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      {user?.gstin || '33AABCO1234F1Z5'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. My Addresses View */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">Saved Delivery Addresses</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="px-3.5 py-1.5 bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Address</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedAddresses.length > 0 ? (
                    savedAddresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 space-y-2 relative"
                      >
                        <div className="font-bold text-slate-900 text-xs">{addr.fullName}</div>
                        <div className="text-xs text-slate-600 leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                          <br />
                          {addr.city}, {addr.state} — {addr.pincode}
                        </div>
                        <div className="text-[11px] text-slate-400">Phone: {addr.phone}</div>
                        <button
                          type="button"
                          onClick={() => removeAddress(idx)}
                          className="text-xs text-rose-600 hover:underline pt-2 inline-block cursor-pointer"
                        >
                          Remove Address
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500">No saved delivery locations yet.</p>
                    </div>
                  )}
                </div>

                {/* Address Form Modal */}
                {showAddressModal && (
                  <form
                    onSubmit={handleAddAddressSubmit}
                    className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                  >
                    <div className="font-bold text-xs text-slate-900">Add New Facility Address</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <input
                        type="text"
                        placeholder="Recipient / Facility Manager"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="tel"
                        placeholder="Contact Phone"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Street Address, Building, Floor"
                        required
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="sm:col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="PIN Code"
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-lg"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 6. Wishlist View */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">Saved Items</h2>
                  <span className="text-xs text-slate-500">{wishlist.length} saved supplies</span>
                </div>

                {wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                            <Image
                              src={item.images[0] || 'https://officebazzar.co.in/wp-content/uploads/2022/12/cardboard-tag-file-500x500-1.jpg'}
                              alt={item.name}
                              fill
                              className="object-contain p-1.5"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.slug}`}
                              className="font-bold text-xs text-slate-900 hover:text-[#004b87] block truncate"
                            >
                              {item.name}
                            </Link>
                            <div className="text-[11px] text-slate-400">SKU: {item.sku}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromWishlist(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">Your wishlist is currently empty.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CustomerAccountDashboard() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[60vh] bg-slate-50/70 py-16 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#004b87] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading Account Dashboard...</p>
          </div>
        </main>
      }
    >
      <CustomerAccountDashboardContent />
    </Suspense>
  );
}
