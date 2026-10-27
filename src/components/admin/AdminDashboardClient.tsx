'use client';

import React, { useState } from 'react';
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
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import {
  Product,
  Order,
  BulkRFQ,
  Category,
  Brand,
  OrderStatus,
  Quotation,
  QuotationStatus,
  NotificationLog,
} from '@/types';
import { saveProduct, deleteProduct, updateOrderStatus, updateBulkRFQStatus } from '@/lib/db/store';
import { useAuth } from '@/context/AuthContext';

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

  // Quotation search & filter state
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState<string>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Form states for selected quotation editing
  const [editQuoteStatus, setEditQuoteStatus] = useState<QuotationStatus>('new');
  const [editQuoteAssignee, setEditQuoteAssignee] = useState('');
  const [editQuoteNotes, setEditQuoteNotes] = useState('');
  const [editQuoteAmount, setEditQuoteAmount] = useState('');
  const [editQuoteDocUrl, setEditQuoteDocUrl] = useState('');
  const [isUpdatingQuote, setIsUpdatingQuote] = useState(false);
  const [quoteFeedback, setQuoteFeedback] = useState<string | null>(null);

  // Notification retry state
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [retryFeedback, setRetryFeedback] = useState<string | null>(null);

  // Product edit/create state
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentEditProduct, setCurrentEditProduct] = useState<Partial<Product> | null>(null);

  // CSV Import feedback
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  // Metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const activeProductsCount = products.filter((p) => p.isActive).length;
  const pendingRFQsCount = rfqs.filter((r) => r.status === 'pending' || r.status === 'in_review').length;
  const pendingQuotationsCount = quotations.filter((q) => q.status === 'new' || q.status === 'under_review').length;

  const handleOpenQuotation = (q: Quotation) => {
    setSelectedQuotation(q);
    setEditQuoteStatus(q.status);
    setEditQuoteAssignee(q.assignedTo || '');
    setEditQuoteNotes(q.internalNotes || '');
    setEditQuoteAmount(q.quotedAmount !== undefined ? String(q.quotedAmount) : '');
    setEditQuoteDocUrl(q.quotationDocumentUrl || '');
    setQuoteFeedback(null);
  };

  const handleSaveQuotationUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotation) return;

    setIsUpdatingQuote(true);
    setQuoteFeedback(null);

    try {
      const res = await fetch('/api/admin/quotations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedQuotation.id,
          status: editQuoteStatus,
          assignedTo: editQuoteAssignee,
          internalNotes: editQuoteNotes,
          quotedAmount: editQuoteAmount ? Number(editQuoteAmount) : undefined,
          quotationDocumentUrl: editQuoteDocUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update quotation');

      setQuotations((prev) =>
        prev.map((q) => (q.id === selectedQuotation.id ? data.quotation : q))
      );
      setSelectedQuotation(data.quotation);
      setQuoteFeedback('Quotation successfully updated and synchronized!');
    } catch (err: unknown) {
      setQuoteFeedback(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUpdatingQuote(false);
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
    if (quotationStatusFilter !== 'all' && q.status !== quotationStatusFilter) {
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

      {/* TAB: QUOTATIONS (Cart-to-Quotation System) */}
      {activeTab === 'quotations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header & Filter Controls */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Request for Quotations (RFQs)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">
                  {filteredQuotations.length} {filteredQuotations.length === 1 ? 'Quotation' : 'Quotations'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review incoming corporate requests, assign sales reps, prepare official quotes, and monitor notification delivery.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={quotationSearch}
                onChange={(e) => setQuotationSearch(e.target.value)}
                placeholder="Search reference, company, phone..."
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden text-slate-900 w-full sm:w-60"
              />

              <select
                value={quotationStatusFilter}
                onChange={(e) => setQuotationStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden text-slate-900 font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="under_review">Under Review</option>
                <option value="quotation_prepared">Quotation Prepared</option>
                <option value="sent_to_customer">Sent to Customer</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="closed">Closed</option>
              </select>
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
                    <th className="py-3 px-4">Company &amp; Contact</th>
                    <th className="py-3 px-4">Delivery Location</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-right">Indicative Total</th>
                    <th className="py-3 px-4 text-right">Quoted Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No quotations match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-red-600">
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
                          <div className="text-[11px] text-slate-500">{q.customerName} &bull; {q.phone}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {q.deliveryLocation ? `${q.deliveryLocation} (PIN: ${q.pincode})` : `PIN: ${q.pincode}`}
                          {q.photoUrls && q.photoUrls.length > 0 && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              📷 {q.photoUrls.length}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                            {q.items.length}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ₹{q.indicativeTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {q.quotedAmount ? (
                            <span className="font-bold text-emerald-700">
                              ₹{q.quotedAmount.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Pending quote</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                            {q.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {q.assignedTo ? (
                            <span className="font-semibold text-blue-900">{q.assignedTo}</span>
                          ) : (
                            <span className="text-amber-600 font-semibold italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenQuotation(q)}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors"
                          >
                            Review &amp; Edit
                          </button>
                        </td>
                      </tr>
                    ))
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
      {/* Quotation Review & Action Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Quotation Review: <span className="text-red-600 font-mono">{selectedQuotation.quotationNumber}</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Submitted on {new Date(selectedQuotation.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Feedback Alert */}
              {quoteFeedback && (
                <div className={`p-3 rounded-xl font-semibold ${quoteFeedback.startsWith('Error') ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                  {quoteFeedback}
                </div>
              )}

              {/* Customer Contact Details Grid */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Enterprise Client Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Company Name</span>
                    <span className="font-bold text-slate-900">{selectedQuotation.companyName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Contact Person</span>
                    <span className="font-bold text-slate-900">{selectedQuotation.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Phone</span>
                    <span className="font-semibold text-slate-900">{selectedQuotation.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Email</span>
                    <span className="font-semibold text-slate-900">{selectedQuotation.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">GSTIN</span>
                    <span className="font-mono font-bold text-slate-900">{selectedQuotation.gstin || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Preferred Contact</span>
                    <span className="uppercase font-bold text-red-600">{selectedQuotation.preferredContactMethod}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-[10px] text-slate-400 block">Delivery Destination</span>
                    <span className="text-slate-800">
                      {selectedQuotation.deliveryLocation ? `${selectedQuotation.deliveryLocation} - ` : ''}
                      PIN: <strong>{selectedQuotation.pincode}</strong>
                    </span>
                  </div>
                </div>

                {/* Uploaded Product or Facility Photos */}
                {selectedQuotation.photoUrls && selectedQuotation.photoUrls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider mb-2">
                      Customer Uploaded Photos ({selectedQuotation.photoUrls.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {selectedQuotation.photoUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500 transition-all flex items-center justify-center p-1"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Quotation photo ${i + 1}`}
                            className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-1 right-1 bg-slate-900/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                            View ↗
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuotation.additionalRequirements && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">Customer Notes:</span>
                    <p className="mt-0.5 italic">{selectedQuotation.additionalRequirements}</p>
                  </div>
                )}
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Requested Line Items ({selectedQuotation.items.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-3 text-center">SKU</th>
                        <th className="py-2 px-3 text-center">Pack</th>
                        <th className="py-2 px-3 text-center">Quantity</th>
                        <th className="py-2 px-3 text-right">Indicative Unit (₹)</th>
                        <th className="py-2 px-3 text-right">Indicative Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedQuotation.items.map((it) => (
                        <tr key={it.id || it.sku}>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{it.productName}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{it.sku}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{it.packSize || 'Standard'}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">₹{it.indicativeUnitPrice.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{it.indicativeTotalPrice.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <td colSpan={5} className="py-2 px-3 text-right">Indicative Total (Excl. Final Discounts):</td>
                        <td className="py-2 px-3 text-right text-red-600 font-bold">
                          ₹{selectedQuotation.indicativeTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Staff Action & Updates Form */}
              <form onSubmit={handleSaveQuotationUpdates} className="border-t border-slate-200 pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-blue-900" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Sales Desk Actions &amp; Quote Finalization
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Quotation Status *
                    </label>
                    <select
                      value={editQuoteStatus}
                      onChange={(e) => setEditQuoteStatus(e.target.value as QuotationStatus)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900"
                    >
                      <option value="new">New (Awaiting Review)</option>
                      <option value="under_review">Under Review</option>
                      <option value="quotation_prepared">Quotation Prepared</option>
                      <option value="sent_to_customer">Sent to Customer</option>
                      <option value="accepted">Accepted (PO Received)</option>
                      <option value="rejected">Rejected</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Assigned Sales Manager / Representative
                    </label>
                    <input
                      type="text"
                      value={editQuoteAssignee}
                      onChange={(e) => setEditQuoteAssignee(e.target.value)}
                      placeholder="e.g. Anand R. (Sales Manager)"
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Final Quoted Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={editQuoteAmount}
                      onChange={(e) => setEditQuoteAmount(e.target.value)}
                      placeholder="Official quoted price after discount"
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Quotation Document URL / PDF Link
                    </label>
                    <input
                      type="url"
                      value={editQuoteDocUrl}
                      onChange={(e) => setEditQuoteDocUrl(e.target.value)}
                      placeholder="https://.../quote.pdf"
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <label className="block font-bold text-slate-700">
                      Internal Notes <span className="text-[10px] text-amber-700 font-semibold">(Protected &bull; Hidden from Customer)</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={editQuoteNotes}
                    onChange={(e) => setEditQuoteNotes(e.target.value)}
                    placeholder="Enter internal pricing margin notes, supplier stock reservation, or delivery logistics remarks..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-amber-50/40 text-slate-900"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <a
                    href={`/quotation-success/${encodeURIComponent(selectedQuotation.quotationNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-slate-600 hover:text-red-600 font-bold"
                  >
                    <span>View Customer Receipt</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedQuotation(null)}
                      className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingQuote}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-xs"
                    >
                      {isUpdatingQuote ? 'Saving...' : 'Save Quotation Updates'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
