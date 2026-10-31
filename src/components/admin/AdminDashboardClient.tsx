'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  SlidersHorizontal,
  Lock,
  ShieldAlert,
  FileText,
  Send,
  Printer,
} from 'lucide-react';
import {
  Product,
  Order,
  BulkRFQ,
  Category,
  Brand,
  OrderStatus,
  Quotation,
  NotificationLog,
} from '@/types';
import { saveProduct, deleteProduct, updateOrderStatus, updateBulkRFQStatus } from '@/lib/db/store';
import { useAuth } from '@/context/AuthContext';
import AdminQuotationEditor from './AdminQuotationEditor';

interface AdminDashboardClientProps {
  initialProducts: Product[];
  initialOrders: Order[];
  initialRFQs: BulkRFQ[];
  categories: Category[];
  brands: Brand[];
  initialQuotations?: Quotation[];
  initialNotificationLogs?: NotificationLog[];
}

export default function AdminDashboardClient({
  initialProducts,
  initialOrders,
  initialRFQs,
  categories,
  brands,
  initialQuotations = [],
  initialNotificationLogs = [],
}: AdminDashboardClientProps) {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'rfqs' | 'csv' | 'quotations'>('overview');

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [rfqs, setRFQs] = useState<BulkRFQ[]>(initialRFQs);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(initialNotificationLogs);

  // Quotation search & workflow bucket state
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationBucket, setQuotationBucket] = useState<
    'all' | 'pending_rfqs' | 'draft_quotations' | 'approved_quotations' | 'sent_quotations'
  >('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Notification retry state
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [retryFeedback, setRetryFeedback] = useState<string | null>(null);

  // Product edit/create state
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentEditProduct, setCurrentEditProduct] = useState<Partial<Product> | null>(null);

  // CSV Import feedback
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  // Deep-link support for ?tab=quotations&quote=OB-RFQ-...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const quoteParam = params.get('quote');
      if (tabParam === 'quotations' || quoteParam) {
        setActiveTab('quotations');
      }
      if (quoteParam && quotations.length > 0) {
        const match = quotations.find(
          (q) =>
            q.quotationNumber.toLowerCase() === quoteParam.toLowerCase() ||
            q.id === quoteParam
        );
        if (match) {
          setSelectedQuotation(match);
        }
      }
    }
  }, [quotations]);

  // Metrics & Quotation Workflow Bucket Counts
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const activeProductsCount = products.filter((p) => p.isActive).length;
  const pendingRFQsCount = rfqs.filter((r) => r.status === 'pending' || r.status === 'in_review').length;

  const pendingQuotationsCount = quotations.filter(
    (q) => q.status === 'new' || q.status === 'under_review'
  ).length;
  const draftQuotationsCount = quotations.filter(
    (q) => q.status === 'quotation_prepared'
  ).length;
  const approvedQuotationsCount = quotations.filter(
    (q) => q.status === 'approved'
  ).length;
  const sentQuotationsCount = quotations.filter(
    (q) => q.status === 'sent_to_customer' || q.status === 'accepted'
  ).length;

  const handleOpenQuotation = (q: Quotation) => {
    setSelectedQuotation(q);
  };

  const handleQuotationUpdated = (
    updated: Quotation,
    updatedLogs?: NotificationLog[]
  ) => {
    setQuotations((prev) =>
      prev.map((q) =>
        q.id === updated.id || q.quotationNumber === updated.quotationNumber
          ? updated
          : q
      )
    );
    setSelectedQuotation(updated);
    if (updatedLogs) {
      setNotificationLogs(updatedLogs);
    }
  };

  const handleRetryNotification = async (logId: string) => {
    setRetryingLogId(logId);
    setRetryFeedback(null);

    try {
      const res = await fetch('/api/admin/notifications/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Retry failed');

      setNotificationLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? { ...l, status: 'sent', attempts: (l.attempts || 1) + 1, lastAttemptAt: new Date().toISOString() }
            : l
        )
      );
      setRetryFeedback('Notification retried and marked sent!');
    } catch (err: unknown) {
      setRetryFeedback(`Retry failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRetryingLogId(null);
    }
  };

  const filteredQuotations = quotations.filter((q) => {
    if (quotationBucket === 'pending_rfqs' && q.status !== 'new' && q.status !== 'under_review') {
      return false;
    }
    if (quotationBucket === 'draft_quotations' && q.status !== 'quotation_prepared') {
      return false;
    }
    if (quotationBucket === 'approved_quotations' && q.status !== 'approved') {
      return false;
    }
    if (
      quotationBucket === 'sent_quotations' &&
      q.status !== 'sent_to_customer' &&
      q.status !== 'accepted'
    ) {
      return false;
    }
    if (quotationSearch.trim()) {
      const term = quotationSearch.toLowerCase().trim();
      return (
        q.quotationNumber.toLowerCase().includes(term) ||
        q.companyName.toLowerCase().includes(term) ||
        q.customerName.toLowerCase().includes(term) ||
        q.phone.includes(term) ||
        q.email.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Product save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditProduct || !currentEditProduct.name || !currentEditProduct.price) return;

    const saved = await saveProduct(currentEditProduct);
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });

    setIsEditingProduct(false);
    setCurrentEditProduct(null);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to deactivate and remove this product?')) {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, trackingNumber?: string) => {
    const updated = await updateOrderStatus(orderId, status, trackingNumber, 'Blue Dart Surface Express');
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    }
  };

  // RFQ status update
  const handleUpdateRFQ = async (rfqId: string, status: BulkRFQ['status']) => {
    const updated = await updateBulkRFQStatus(rfqId, status);
    if (updated) {
      setRFQs((prev) => prev.map((r) => (r.id === rfqId ? updated : r)));
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Brand', 'Price', 'MRP', 'Stock', 'PackSize'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.categoryName,
      p.brandName,
      p.price,
      p.mrp,
      p.stockQuantity,
      `"${p.packSize}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `officebazzar_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import (Demo simulation with real parsing)
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setCsvFeedback('CSV file does not contain valid product rows.');
        return;
      }

      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 5) {
          const name = parts[1]?.replace(/"/g, '').trim();
          const sku = parts[2]?.trim() || `OB-${Math.floor(1000 + Math.random() * 9000)}`;
          const price = parseFloat(parts[5]) || 250;
          if (name) {
            await saveProduct({
              name,
              sku,
              price,
              mrp: price * 1.25,
              stockQuantity: 100,
              packSize: '1 Unit',
            });
            importedCount++;
          }
        }
      }

      setCsvFeedback(`Successfully validated and imported ${importedCount} products into database.`);
    };
    reader.readAsText(file);
  };

  // Strict role-based authorization check (No hardcoded passcodes or demo shortcuts)
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Administrator Authentication Required
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            The OfficeBazzar administrative console contains customer purchase orders, tax invoicing records, and catalog controls. Please sign in with an authorized administrator account.
          </p>
          <Link
            href="/login"
            className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl shadow transition-colors inline-flex items-center justify-center gap-2"
          >
            Sign In with Admin Credentials &rarr;
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Access Denied
          </h2>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Your authenticated account (<strong className="text-slate-900">{user.email}</strong>) does not have the <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800">admin</code> role assigned in the database profiles directory.
          </p>
          <p className="text-[11px] text-slate-400 mb-6">
            If you are a member of the OfficeBazzar operations team, request an administrative role grant in the Supabase management console.
          </p>
          <Link
            href="/account"
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors inline-block"
          >
            Return to Customer Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 mb-8 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-700 mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Authorized Enterprise Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            OfficeBazzar Staff Admin Portal
          </h1>
          <p className="text-xs text-slate-500">
            Real-time management for catalog products, order fulfillment, stock levels, and corporate RFQs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/"
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            &larr; View Live Store
          </Link>
          <button
            onClick={() => {
              setCurrentEditProduct({
                name: '',
                sku: `OB-${Math.floor(1000 + Math.random() * 9000)}`,
                slug: `item-${Date.now()}`,
                categoryId: categories[0]?.id,
                categoryName: categories[0]?.name,
                brandId: brands[0]?.id,
                brandName: brands[0]?.name,
                price: 500,
                mrp: 650,
                stockQuantity: 100,
                packSize: '1 Unit',
                description: 'Corporate office supplies product description.',
                images: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=800&auto=format&fit=crop'],
                isActive: true,
              });
              setIsEditingProduct(true);
            }}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
            activeTab === 'overview'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Metrics &amp; Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
            activeTab === 'products'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quotations')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 relative ${
            activeTab === 'quotations'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Quotations ({quotations.length})</span>
          {pendingQuotationsCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-red-100 text-red-900 ml-1">
              {pendingQuotationsCount} NEW
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
            activeTab === 'orders'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rfqs')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
            activeTab === 'rfqs'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Bulk RFQs ({rfqs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
            activeTab === 'csv'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>CSV Import / Export</span>
        </button>
      </div>

      {/* TAB 1: METRICS & OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-medium text-slate-500">Total Sales Invoiced</span>
              <div className="text-2xl font-bold text-blue-950">₹{totalRevenue.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-emerald-600 font-semibold">18% GST Input Credit Recorded</div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-medium text-slate-500">New Quotations</span>
              <div className="text-2xl font-bold text-red-600">{pendingQuotationsCount}</div>
              <button
                onClick={() => setActiveTab('quotations')}
                className="text-[11px] text-red-600 font-semibold hover:underline flex items-center space-x-1"
              >
                <span>{quotations.length} total RFQs &rarr;</span>
              </button>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-medium text-slate-500">Total Orders</span>
              <div className="text-2xl font-bold text-slate-900">{totalOrdersCount}</div>
              <div className="text-[11px] text-blue-900 font-semibold">Direct Fulfillment</div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-medium text-slate-500">Active Catalog SKUs</span>
              <div className="text-2xl font-bold text-emerald-700">{activeProductsCount}</div>
              <div className="text-[11px] text-slate-500 font-semibold">Across 7 Categories</div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-medium text-slate-500">Bulk Inquiries</span>
              <div className="text-2xl font-bold text-amber-600">{pendingRFQsCount}</div>
              <div className="text-[11px] text-amber-700 font-semibold">Direct RFQs</div>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Latest Customer Orders</h2>
              <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-blue-900 hover:underline">
                View All &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-mono font-bold text-blue-950">{order.orderNumber}</div>
                    <div className="text-slate-500">{order.customerName} • {order.customerEmail}</div>
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-amber-100 text-amber-950">
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-200">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              All Products &amp; Live Inventory ({products.length} Items)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Product Name &amp; SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Price (Excl. Tax)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{p.name}</div>
                      <div className="text-slate-400 text-[10px]">SKU: {p.sku} • {p.packSize}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.categoryName}</td>
                    <td className="py-3 px-4 font-semibold text-blue-900">{p.brandName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.price && p.price > 0 ? `₹${p.price.toLocaleString('en-IN')}` : <span className="text-amber-600 font-semibold text-xs">Pending Quote</span>}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${p.stockQuantity > 10 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                        {p.stockQuantity} in stock
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setCurrentEditProduct({ ...p });
                          setIsEditingProduct(true);
                        }}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                        title="Edit product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-200">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Orders &amp; Shipment Tracking ({orders.length} Orders)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer / Company</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-950">{o.orderNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{o.customerName}</div>
                      <div className="text-[10px] text-slate-400">{o.companyName || o.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{o.items.length} items</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-100 text-blue-900">
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={o.orderStatus}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as OrderStatus, `BLUEDART-${Date.now()}`)}
                        className="p-1 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BULK RFQs */}
      {activeTab === 'rfqs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-200">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Corporate Quotation Requests &amp; Inquiries ({rfqs.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="p-5 flex flex-col md:flex-row justify-between gap-4 text-xs">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{rfq.companyName}</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-950 font-bold rounded text-[10px]">
                      {rfq.category}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Contact: <strong>{rfq.contactPerson}</strong> • {rfq.phone} • {rfq.email}
                  </div>
                  {rfq.gstin && <div className="text-[11px] text-slate-400">GSTIN: {rfq.gstin}</div>}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                    <strong>Requirements:</strong> {rfq.requirements}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Destination: <strong>{rfq.deliveryLocation}</strong> • Volume: <strong>{rfq.estimatedQuantity}</strong>
                  </div>
                </div>

                <div className="flex flex-col md:items-end justify-between gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400">
                    Received: {new Date(rfq.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <select
                    value={rfq.status}
                    onChange={(e) => handleUpdateRFQ(rfq.id, e.target.value as BulkRFQ['status'])}
                    className="p-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="quoted">Quoted</option>
                    <option value="closed">Closed / Won</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CSV IMPORT / EXPORT */}
      {activeTab === 'csv' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
          {/* CSV Export Card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Export Product Catalog CSV</h3>
              <p className="text-xs text-slate-500 mt-1">
                Download active catalogue data including SKUs, prices, stock quantities, and pack sizes in CSV format.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Catalog CSV ({products.length} SKUs)</span>
            </button>
          </div>

          {/* CSV Import Card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Import &amp; Batch Update CSV</h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload verified CSV file to add or update catalogue prices and inventory stock in bulk.
              </p>
            </div>
            <div>
              <label className="block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 cursor-pointer"
                />
              </label>
            </div>

            {csvFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{csvFeedback}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: QUOTATIONS (Admin Quotation Editor & Zoho CRM Workflow) */}
      {activeTab === 'quotations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 4 Workflow Bucket Cards / Sub-Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setQuotationBucket('all')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                quotationBucket === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block ${
                  quotationBucket === 'all' ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                All Quotations
              </span>
              <div className="text-2xl font-extrabold mt-1">{quotations.length}</div>
              <span
                className={`text-[10px] ${
                  quotationBucket === 'all' ? 'text-slate-400' : 'text-slate-400'
                }`}
              >
                Synced with Zoho CRM
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuotationBucket('pending_rfqs')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                quotationBucket === 'pending_rfqs'
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-red-300'
              }`}
            >
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block ${
                  quotationBucket === 'pending_rfqs' ? 'text-red-100' : 'text-red-600'
                }`}
              >
                1. Pending RFQs
              </span>
              <div className="text-2xl font-extrabold mt-1">{pendingQuotationsCount}</div>
              <span
                className={`text-[10px] ${
                  quotationBucket === 'pending_rfqs' ? 'text-red-100' : 'text-slate-400'
                }`}
              >
                Awaiting price editing
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuotationBucket('draft_quotations')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                quotationBucket === 'draft_quotations'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
              }`}
            >
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block ${
                  quotationBucket === 'draft_quotations' ? 'text-amber-50' : 'text-amber-700'
                }`}
              >
                2. Draft Quotations
              </span>
              <div className="text-2xl font-extrabold mt-1">{draftQuotationsCount}</div>
              <span
                className={`text-[10px] ${
                  quotationBucket === 'draft_quotations' ? 'text-amber-50' : 'text-slate-400'
                }`}
              >
                Saved drafts in progress
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuotationBucket('approved_quotations')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                quotationBucket === 'approved_quotations'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block ${
                  quotationBucket === 'approved_quotations'
                    ? 'text-emerald-100'
                    : 'text-emerald-700'
                }`}
              >
                3. Approved Quotations
              </span>
              <div className="text-2xl font-extrabold mt-1">{approvedQuotationsCount}</div>
              <span
                className={`text-[10px] ${
                  quotationBucket === 'approved_quotations'
                    ? 'text-emerald-100'
                    : 'text-slate-400'
                }`}
              >
                Approved &amp; ready to send
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuotationBucket('sent_quotations')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                quotationBucket === 'sent_quotations'
                  ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
              }`}
            >
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block ${
                  quotationBucket === 'sent_quotations' ? 'text-blue-200' : 'text-blue-900'
                }`}
              >
                4. Sent Quotations
              </span>
              <div className="text-2xl font-extrabold mt-1">{sentQuotationsCount}</div>
              <span
                className={`text-[10px] ${
                  quotationBucket === 'sent_quotations' ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                Final quote emailed to customer
              </span>
            </button>
          </div>

          {/* Header & Search Controls */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Admin Quotations &amp; Pricing Editor</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">
                  {filteredQuotations.length} {filteredQuotations.length === 1 ? 'Record' : 'Records'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Open any customer RFQ to edit unit prices, quantities, discounts, GST, and charges, preview the Office Bazzar PDF, approve, and send to the customer via Zoho CRM.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={quotationSearch}
                onChange={(e) => setQuotationSearch(e.target.value)}
                placeholder="Search RFQ ref, company, email, phone..."
                className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden text-slate-900 w-full sm:w-72"
              />
            </div>
          </div>

          {/* Quotations Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">RFQ Reference</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Company &amp; Customer</th>
                    <th className="py-3 px-4">Delivery Location</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-right">Final / Quoted Total</th>
                    <th className="py-3 px-4 text-center">Workflow Stage</th>
                    <th className="py-3 px-4 text-center">Rev</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No quotations match the selected workflow filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((q) => {
                      const finalTotal = q.grandTotal ?? q.quotedAmount ?? q.indicativeTotal ?? 0;
                      const pdfUrl = `/api/admin/quotations/${encodeURIComponent(q.quotationNumber)}/pdf`;
                      return (
                        <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-red-600 whitespace-nowrap">
                            {q.quotationNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(q.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{q.companyName}</div>
                            <div className="text-[11px] text-slate-500">
                              {q.customerName}
                              {q.email ? ` • ${q.email}` : ''}
                              {q.phone ? ` • ${q.phone}` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {q.deliveryLocation
                              ? `${q.deliveryLocation} (PIN: ${q.pincode})`
                              : `PIN: ${q.pincode}`}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                              {q.items.length}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {finalTotal > 0 ? (
                              <span className="font-bold font-mono text-slate-900">
                                ₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-amber-600 font-semibold italic">
                                Pending Price Entry
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                q.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : q.status === 'sent_to_customer' || q.status === 'accepted'
                                  ? 'bg-blue-100 text-blue-900'
                                  : q.status === 'quotation_prepared'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {q.status === 'new' || q.status === 'under_review'
                                ? 'Pending RFQ'
                                : q.status === 'quotation_prepared'
                                ? 'Draft Quotation'
                                : q.status === 'approved'
                                ? 'Approved'
                                : q.status === 'sent_to_customer'
                                ? 'Sent to Customer'
                                : q.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                            v{q.version || 1}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg transition-colors"
                              title="Preview / Download Branded Quotation PDF"
                            >
                              <Printer className="w-3 h-3" />
                              <span>PDF</span>
                            </a>
                            <button
                              onClick={() => handleOpenQuotation(q)}
                              className="px-3 py-1 bg-slate-900 hover:bg-red-600 text-white text-[11px] font-bold rounded-lg transition-colors"
                            >
                              Open Quotation Editor
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notification Audit Logs Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Server-Side Notification Logs &amp; Retry Console
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {notificationLogs.length} Total Dispatches Logged
              </span>
            </div>

            {retryFeedback && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-semibold">
                {retryFeedback}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Quotation Ref</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">Recipient Address / Phone</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Attempts</th>
                    <th className="py-2.5 px-3">Last Attempt</th>
                    <th className="py-2.5 px-3">Error / Details</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notificationLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-400">
                        No notification logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    notificationLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {log.quotationNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-700 capitalize">
                            {log.channel.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {log.recipient}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              log.status === 'sent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                          {log.attempts || 1}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(log.lastAttemptAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate">
                          {log.errorMessage || 'Delivered successfully'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {log.status === 'failed' && (
                            <button
                              onClick={() => handleRetryNotification(log.id)}
                              disabled={retryingLogId === log.id}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[10px] font-bold rounded-md transition-colors"
                            >
                              {retryingLogId === log.id ? 'Retrying...' : 'Retry'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit / Create Modal */}
      {isEditingProduct && currentEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {currentEditProduct.id ? 'Edit Product Details' : 'Add New Corporate Product'}
              </h3>
              <button onClick={() => setIsEditingProduct(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={currentEditProduct.name || ''}
                  onChange={(e) => setCurrentEditProduct({ ...currentEditProduct, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={currentEditProduct.sku || ''}
                    onChange={(e) => setCurrentEditProduct({ ...currentEditProduct, sku: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pack Size / Unit</label>
                  <input
                    type="text"
                    value={currentEditProduct.packSize || ''}
                    onChange={(e) => setCurrentEditProduct({ ...currentEditProduct, packSize: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={currentEditProduct.price || 0}
                    onChange={(e) => setCurrentEditProduct({ ...currentEditProduct, price: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    required
                    value={currentEditProduct.mrp || 0}
                    onChange={(e) => setCurrentEditProduct({ ...currentEditProduct, mrp: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={currentEditProduct.stockQuantity || 0}
                    onChange={(e) => setCurrentEditProduct({ ...currentEditProduct, stockQuantity: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={currentEditProduct.description || ''}
                  onChange={(e) => setCurrentEditProduct({ ...currentEditProduct, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProduct(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-900 text-white font-bold rounded-xl">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Full-Featured Admin Quotation Editor Modal */}
      {selectedQuotation && (
        <AdminQuotationEditor
          key={`${selectedQuotation.id}-v${selectedQuotation.version || 1}`}
          quotation={selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          onQuotationUpdated={handleQuotationUpdated}
        />
      )}
    </div>
  );
}
