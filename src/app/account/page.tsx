'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  User as UserIcon,
  MapPin,
  Heart,
  LogOut,
  Trash2,
  Plus,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { Quotation, Address } from '@/types';

function CustomerAccountDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading, logout, savedAddresses, addAddress, removeAddress } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();

  const tabParam = searchParams.get('tab') || 'rfqs';
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  const [rfqs, setRfqs] = useState<Quotation[]>([]);
  const [rfqsLoading, setRfqsLoading] = useState(true);

  // Address form modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const city = 'Chennai';
  const state = 'Tamil Nadu';
  const [pincode, setPincode] = useState('600014');

  // Sync tab with URL param
  useEffect(() => {
    if (tabParam && ['rfqs', 'profile', 'addresses', 'wishlist'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Auth gate: redirect to login if session is unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/account');
    }
  }, [isLoading, isAuthenticated, router]);

  // Pre-fill address form with authenticated user details
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Fetch real RFQs from Zoho CRM for current authenticated customer
  useEffect(() => {
    async function loadCustomerRfqs() {
      if (!user?.email && !user?.id) {
        setRfqsLoading(false);
        return;
      }

      setRfqsLoading(true);
      try {
        const query = user?.id ? `customerId=${encodeURIComponent(user.id)}` : `email=${encodeURIComponent(user?.email || '')}`;
        const res = await fetch(`/api/quotations/customer?${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quotations && Array.isArray(data.quotations)) {
            setRfqs(data.quotations);
          }
        }
      } catch (e) {
        console.error('[Account] Error fetching customer quotations from Zoho CRM:', e);
      } finally {
        setRfqsLoading(false);
      }
    }

    if (isAuthenticated && user) {
      loadCustomerRfqs();
    }
  }, [user, isAuthenticated]);

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

  if (isLoading || (!isAuthenticated && !user)) {
    return (
      <main className="min-h-[60vh] bg-slate-50/70 py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#004b87] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Verifying customer credentials...</p>
        </div>
      </main>
    );
  }

  const displayName = user?.name || user?.email?.split('@')[0] || 'Customer';
  const displayEmail = user?.email || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'OB';

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

        {/* Top Header Card: Authenticated Customer Details */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#004b87] text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug truncate">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {displayEmail}
                </span>
                {user?.companyName && (
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {user.companyName}
                  </span>
                )}
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/request-quote"
              className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              + New RFQ
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid: Left Sidebar + Right Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sidebar Menu */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('rfqs')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'rfqs'
                  ? 'bg-blue-50 text-[#004b87] font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>My Quotation Requests</span>
              </div>
              {rfqs.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 font-bold">
                  {rfqs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-[#004b87] font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Business Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-blue-50 text-[#004b87] font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>Delivery Locations</span>
              </div>
              {savedAddresses.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 font-bold">
                  {savedAddresses.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-blue-50 text-[#004b87] font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4" />
                <span>Saved Items</span>
              </div>
              {wishlist.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1. My RFQs View */}
            {activeTab === 'rfqs' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">My Quotation Requests (RFQs)</h2>
                    <p className="text-xs text-slate-400">Formal bulk proposals registered in Zoho CRM</p>
                  </div>
                  <Link
                    href="/request-quote"
                    className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    + Request Quote
                  </Link>
                </div>

                {rfqsLoading ? (
                  <div className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-[#004b87] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Retrieving quotation records from Zoho CRM...</p>
                  </div>
                ) : rfqs.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">No Quotations Found</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        You have not submitted any quotation requests yet.
                      </p>
                    </div>
                    <div className="pt-2">
                      <Link
                        href="/products"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                      >
                        <Package className="w-4 h-4" />
                        <span>Browse Products &amp; Request Quote</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rfqs.map((rfq) => (
                      <div
                        key={rfq.id}
                        className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 font-mono text-sm">
                              {rfq.quotationNumber}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rfq.status === 'quotation_prepared' || rfq.status === 'sent_to_customer'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rfq.status === 'accepted'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : rfq.status === 'rejected' || rfq.status === 'closed'
                                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                  : 'bg-blue-50 text-[#004b87] border border-blue-200'
                              }`}
                            >
                              {rfq.status === 'sent_to_customer' || rfq.status === 'quotation_prepared'
                                ? 'Quote Prepared'
                                : rfq.status === 'accepted'
                                ? 'Accepted'
                                : rfq.status === 'closed'
                                ? 'Closed'
                                : 'Under Sales Review'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Submitted on{' '}
                            {typeof rfq.createdAt === 'string' && rfq.createdAt.includes('T')
                              ? new Date(rfq.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : rfq.createdAt}{' '}
                            &bull; {rfq.items?.length || 1} Products Requested
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 uppercase">
                              {rfq.quotedAmount ? 'Confirmed Total' : 'Indicative Total'}
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                              ₹{(rfq.quotedAmount || rfq.indicativeTotal).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <Link
                            href="/account/quotations"
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Details &rarr;
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. Business Profile View */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">Profile &amp; Business Information</h2>
                  <p className="text-xs text-slate-400">Authenticated contact credentials retrieved from Zoho CRM</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      {user?.name || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Registered Business Email</label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      {user?.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Company / Organization</label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      {user?.companyName || 'Not specified'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Corporate GSTIN</label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      {user?.gstin || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Contact Phone</label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      {user?.phone || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Account Role</label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      {user?.role === 'admin' ? 'Administrative Staff' : 'Corporate Buyer'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. My Addresses View */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Saved Delivery Locations</h2>
                    <p className="text-xs text-slate-400">Warehouse and office facilities synchronized with Zoho CRM</p>
                  </div>
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
                    savedAddresses.map((addr: Address, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 space-y-2 relative bg-white"
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

            {/* 4. Wishlist View */}
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
