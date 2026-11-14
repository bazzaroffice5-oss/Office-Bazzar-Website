'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Package,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Plus,
  Edit3,
  ExternalLink,
  LogOut,
  UploadCloud,
  X,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Product } from '@/types';

interface ProductAdminDashboardClientProps {
  initialProducts: Product[];
  adminEmail: string;
}

const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'office-stationery', name: 'Office Stationery' },
  { id: 'housekeeping-hygiene', name: 'Housekeeping & Hygiene' },
  { id: 'packaging-supplies', name: 'Packaging Supplies' },
  { id: 'printers-technology', name: 'Printers & Technology' },
];

export default function ProductAdminDashboardClient({
  initialProducts,
  adminEmail,
}: ProductAdminDashboardClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('office-stationery');
  const [formCategoryName, setFormCategoryName] = useState('Office Stationery');
  const [formSubcategoryName, setFormSubcategoryName] = useState('');
  const [formBrand, setFormBrand] = useState('OfficeBazzar');
  const [formPackSize, setFormPackSize] = useState('1 Unit');
  const [formDescription, setFormDescription] = useState('');
  const [formCataloguePage, setFormCataloguePage] = useState('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive !== false).length;
    return {
      total,
      active,
      recentlyAdded: Math.min(10, total),
      recentlyUpdated: Math.min(10, total),
    };
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brandName?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'all') {
      result = result.filter(
        (p) =>
          p.categoryId?.toLowerCase() === selectedCategory ||
          p.categoryName?.toLowerCase() === selectedCategory
      );
    }
    return result;
  }, [products, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const handleLogout = async () => {
    await fetch('/api/product-admin/logout', { method: 'POST' });
    window.location.reload();
  };

  const refreshProducts = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/product-admin/products?limit=2000');
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        showToast('success', 'Product catalog refreshed from Zoho CRM.');
      }
    } catch {
      showToast('error', 'Failed to refresh product list.');
    } finally {
      setRefreshing(false);
    }
  };

  const openAddModal = () => {
    setFormName('');
    setFormSku('');
    setFormCategoryId('office-stationery');
    setFormCategoryName('Office Stationery');
    setFormSubcategoryName('');
    setFormBrand('OfficeBazzar');
    setFormPackSize('1 Unit');
    setFormDescription('');
    setFormCataloguePage('');
    setFormPrice('');
    setFormImageFile(null);
    setFormImagePreview(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategoryId(p.categoryId || 'office-stationery');
    setFormCategoryName(p.categoryName || 'Office Stationery');
    setFormSubcategoryName(p.subcategoryName || '');
    setFormBrand(p.brandName || 'OfficeBazzar');
    setFormPackSize(p.packSize || '1 Unit');
    setFormDescription(p.description || '');
    setFormCataloguePage((p.specifications as any)?.cataloguePage || '');
    setFormPrice(p.price ? String(p.price) : '');
    setFormImageFile(null);
    setFormImagePreview(p.images && p.images[0] ? p.images[0] : null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormImagePreview(previewUrl);
    }
  };

  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) {
      showToast('error', 'Product Name and Product Code (SKU) are mandatory.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', formName);
      formData.append('sku', formSku);
      formData.append('categoryId', formCategoryId);
      formData.append('categoryName', formCategoryName);
      formData.append('subcategoryId', formSubcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      formData.append('subcategoryName', formSubcategoryName);
      formData.append('brandName', formBrand);
      formData.append('packSize', formPackSize);
      formData.append('description', formDescription);
      formData.append('cataloguePage', formCataloguePage);
      if (formPrice) formData.append('price', formPrice);
      if (formImageFile) formData.append('imageFile', formImageFile);

      const res = await fetch('/api/product-admin/products', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast('error', data.error || 'Failed to save product to Zoho CRM.');
        setSaving(false);
        return;
      }

      setProducts((prev) => [data.product, ...prev]);
      setIsAddModalOpen(false);
      showToast(
        'success',
        `Product "${formName}" created in Zoho CRM and synced live to OfficeBazzar!`
      );
    } catch {
      showToast('error', 'Network error creating product in Zoho CRM.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', formName);
      formData.append('sku', formSku);
      formData.append('categoryId', formCategoryId);
      formData.append('categoryName', formCategoryName);
      formData.append('subcategoryId', formSubcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      formData.append('subcategoryName', formSubcategoryName);
      formData.append('brandName', formBrand);
      formData.append('packSize', formPackSize);
      formData.append('description', formDescription);
      formData.append('cataloguePage', formCataloguePage);
      if (formPrice) formData.append('price', formPrice);
      if (formImageFile) formData.append('imageFile', formImageFile);

      const res = await fetch(`/api/product-admin/products/${editingProduct.id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast('error', data.error || 'Failed to update product in Zoho CRM.');
        setSaving(false);
        return;
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? data.product : p))
      );
      setEditingProduct(null);
      showToast(
        'success',
        `Product "${formName}" updated in Zoho CRM and synchronized live!`
      );
    } catch {
      showToast('error', 'Network error updating product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">OfficeBazzar</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                Product Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Zoho CRM Direct Integration</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={refreshProducts}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Refresh from Zoho CRM"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <a
            href="/products"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 transition-colors"
          >
            <span>Live Catalog</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 hidden md:inline truncate max-w-[180px]">
              {adminEmail}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/50'
                : 'bg-red-950/90 text-red-200 border-red-500/30 shadow-red-950/50'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </div>
        )}

        {/* 1. Overview Section Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Products</span>
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {metrics.total.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">Direct Zoho CRM Catalog</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Products</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {metrics.active.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-400/80 mt-1">Live on Website</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Recently Added</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {metrics.recentlyAdded}
            </div>
            <p className="text-xs text-slate-500 mt-1">Latest catalog entries</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Recently Updated</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {metrics.recentlyUpdated}
            </div>
            <p className="text-xs text-slate-500 mt-1">Synced to live store</p>
          </div>
        </section>

        {/* 2. Product Management Action Bar */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search products by Name or Product Code (SKU)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[200px]">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 pl-3.5 pr-8 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Product Button */}
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </section>

        {/* 3. Product Catalog Table */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Showing {filteredProducts.length} products</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">Preview</th>
                  <th className="py-3 px-4">Product Name &amp; Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Pack Size</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No products match your search or filter.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => {
                    const imgUrl = (p.images && p.images[0]) || '/assets/placeholder-product.svg';
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700/60 overflow-hidden relative flex items-center justify-center p-1">
                            <Image
                              src={imgUrl}
                              alt={p.name}
                              width={48}
                              height={48}
                              className="object-contain w-full h-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/placeholder-product.svg';
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white line-clamp-1">{p.name}</div>
                          <div className="text-xs font-mono text-blue-400 mt-0.5">{p.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <div>{p.categoryName || 'Office Supplies'}</div>
                          {p.subcategoryName && (
                            <div className="text-xs text-slate-500">{p.subcategoryName}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{p.brandName || 'OfficeBazzar'}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{p.packSize || '1 Unit'}</td>
                        <td className="py-3 px-4 text-center">
                          {p.isActive !== false ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEditModal(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                {editingProduct ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingProduct ? 'Edit Existing Product' : 'Add New Product to Zoho CRM'}
                </h2>
                <p className="text-xs text-slate-400">
                  {editingProduct
                    ? `Updating SKU: ${editingProduct.sku}`
                    : 'Direct synchronization with live catalogue and Zoho CRM Products module'}
                </p>
              </div>
            </div>

            <form
              onSubmit={editingProduct ? handleUpdateProduct : handleSaveNewProduct}
              className="space-y-4 text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Kangaro Heavy Duty Punch DP-800"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Product Code / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    placeholder="e.g. OB-STA-1050"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => {
                      setFormCategoryId(e.target.value);
                      const match = CATEGORIES.find((c) => c.id === e.target.value);
                      setFormCategoryName(match ? match.name : 'Office Supplies');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="office-stationery">Office Stationery</option>
                    <option value="housekeeping-hygiene">Housekeeping & Hygiene</option>
                    <option value="packaging-supplies">Packaging Supplies</option>
                    <option value="printers-technology">Printers & Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Subcategory (Optional)
                  </label>
                  <input
                    type="text"
                    value={formSubcategoryName}
                    onChange={(e) => setFormSubcategoryName(e.target.value)}
                    placeholder="e.g. Files & Folders, Cleaning Equipment"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. Kangaro, JK, Diversey"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Unit in Business (Pack Size)
                  </label>
                  <input
                    type="text"
                    value={formPackSize}
                    onChange={(e) => setFormPackSize(e.target.value)}
                    placeholder="e.g. 1 Unit, Box of 10, Ream of 500"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Catalogue Reference Page
                  </label>
                  <input
                    type="text"
                    value={formCataloguePage}
                    onChange={(e) => setFormCataloguePage(e.target.value)}
                    placeholder="e.g. Page 14"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Comprehensive institutional specifications, usage details, and procurement terms..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Image Upload Area with Live Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Product Image (Upload from Computer)
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 transition-colors bg-slate-800/40">
                  {formImagePreview ? (
                    <div className="w-24 h-24 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden relative shrink-0 p-1 flex items-center justify-center">
                      <Image
                        src={formImagePreview}
                        alt="Preview"
                        width={96}
                        height={96}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left">
                    <input
                      type="file"
                      id="productImageInput"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="productImageInput"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-600 cursor-pointer transition-colors"
                    >
                      <UploadCloud className="w-4 h-4 text-blue-400" />
                      <span>{formImagePreview ? 'Replace Image' : 'Select Product Image'}</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Accepts WebP, PNG, JPEG. Automatically saved to persistent catalogue storage.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Zoho CRM...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Save Changes' : 'Save Product'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
