'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  X,
  Boxes,
} from 'lucide-react';
import { Product, Category, Brand } from '@/types';

interface AdminDashboardManageClientProps {
  initialProducts: Product[];
  categories: Category[];
  brands: Brand[];
}

const FALLBACK_IMAGE = 'https://officebazzar.co.in/wp-content/uploads/2022/12/cardboard-tag-file-500x500-1.jpg';

export default function AdminDashboardManageClient({
  initialProducts,
  categories,
  brands,
}: AdminDashboardManageClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Compute live metrics
  const totalCount = products.length;
  const publishedCount = useMemo(() => products.filter((p) => p.isActive).length, [products]);
  const draftCount = useMemo(() => products.filter((p) => !p.isActive).length, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q) ||
        p.brandName?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && p.isActive) ||
        (statusFilter === 'draft' && !p.isActive);

      const matchesCategory =
        !categoryFilter ||
        p.categoryId === categoryFilter ||
        p.categoryName.toLowerCase() === categoryFilter.toLowerCase();

      const matchesBrand =
        !brandFilter ||
        p.brandId === brandFilter ||
        p.brandName.toLowerCase() === brandFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory && matchesBrand;
    });
  }, [products, search, statusFilter, categoryFilter, brandFilter]);

  // Handle Toggle Publish / Unpublish
  const handleTogglePublish = async (product: Product) => {
    setActionLoadingId(product.id);
    setFeedback(null);
    const newStatus = !product.isActive;

    try {
      const res = await fetch(`/api/office-control/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update publish status.');
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: newStatus } : p))
      );

      setFeedback({
        type: 'success',
        message: newStatus
          ? `"${product.name}" is now PUBLISHED and live on the public website.`
          : `"${product.name}" is now saved as a PRIVATE DRAFT (hidden from public view).`,
      });

      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error updating status',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (product: Product) => {
    setActionLoadingId(product.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/office-control/products/${product.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete product.');
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setDeleteConfirmId(null);

      setFeedback({
        type: 'success',
        message: `Product "${product.name}" was permanently deleted.`,
      });

      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error deleting product',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Section: Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Catalogue Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time management for Office Bazzar B2B products, published status, and RFQ quotes.
          </p>
        </div>

        <Link
          href="/office-control/products/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* 2. Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Products
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {totalCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Complete inventory items
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#004b87]">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Published Products */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Live & Published
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
              {publishedCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Active in public catalogue
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Draft Products */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Private Drafts
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
              {draftCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Hidden from website visitors
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar & Search */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU, category, or brand..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start lg:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'published'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Published ({publishedCount})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'draft'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Drafts ({draftCount})
            </button>
          </div>
        </div>

        {/* Dropdown Filters (Category & Brand) */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-[#ea580c] cursor-pointer"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-[#ea580c] cursor-pointer"
          >
            <option value="">All Brands ({brands.length})</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {(search || statusFilter !== 'all' || categoryFilter || brandFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setCategoryFilter('');
                setBrandFilter('');
              }}
              className="text-xs text-[#ea580c] hover:underline font-semibold cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 5. Product Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Showing {filteredProducts.length} of {totalCount} Products
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4 hidden md:table-cell">Category</th>
                <th className="py-3 px-4 hidden lg:table-cell">Brand</th>
                <th className="py-3 px-4 hidden sm:table-cell">Unit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No matching products found</p>
                    <p className="text-xs mt-1">Try adjusting your search query or active filters.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const displayImage =
                    p.images && p.images.length > 0 && p.images[0].length > 0
                      ? p.images[0]
                      : FALLBACK_IMAGE;

                  const isUpdating = actionLoadingId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Product Thumbnail + Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="relative w-12 h-12 rounded-lg border border-slate-200 bg-white p-1 shrink-0 overflow-hidden">
                            <Image
                              src={displayImage}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-contain p-0.5"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate hover:text-[#ea580c] transition-colors">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {p.categoryName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {p.sku || p.id}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 hidden md:table-cell text-slate-600">
                        <span className="line-clamp-1">{p.categoryName}</span>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-4 hidden lg:table-cell text-slate-600">
                        <span className="line-clamp-1">{p.brandName}</span>
                      </td>

                      {/* Unit in Business */}
                      <td className="py-3 px-4 hidden sm:table-cell font-medium text-slate-700">
                        {p.packSize || 'Standard Pack'}
                      </td>

                      {/* Status + 1-Click Toggle */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(p)}
                          disabled={isUpdating}
                          title={
                            p.isActive
                              ? 'Click to Unpublish (make draft)'
                              : 'Click to Publish (make live)'
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : p.isActive ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{p.isActive ? 'Live' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Live preview if published */}
                          {p.isActive && (
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              title="View on Live Store"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Edit button */}
                          <Link
                            href={`/office-control/products/${p.id}/edit`}
                            title="Edit Product"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#ea580c] hover:bg-orange-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(p.id)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete this product? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = products.find((p) => p.id === deleteConfirmId);
                  if (target) handleDeleteProduct(target);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
