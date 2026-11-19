'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  LogOut,
  UploadCloud,
  X,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  FolderTree,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import { Product } from '@/types';
import { resolveProductImageUrl, FALLBACK_PRODUCT_IMAGE } from '@/lib/utils/image';

export interface AdminProduct extends Product {
  isDeleted?: boolean;
  zohoProductId?: string;
}

interface ProductAdminDashboardClientProps {
  initialProducts: AdminProduct[];
  adminEmail: string;
}

const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'office-stationery', name: 'Office Stationery' },
  { id: 'housekeeping-hygiene', name: 'Housekeeping & Hygiene' },
  { id: 'packaging-supplies', name: 'Packaging Supplies' },
  { id: 'printers-technology', name: 'Printers & Technology' },
];

const SUBCATEGORIES_BY_CATEGORY: Record<string, { id: string; name: string }[]> = {
  'office-stationery': [
    { id: 'writing-instruments', name: 'Writing Instruments' },
    { id: 'paper-notebooks', name: 'Paper & Notebooks' },
    { id: 'files-office-organization', name: 'Files & Office Organization' },
    { id: 'desk-accessories-tools', name: 'Desk Organization & Tools' },
    { id: 'boards-visual-display', name: 'Boards & Visual Display' },
    { id: 'office-pantry-essentials', name: 'Office Pantry Essentials' },
    { id: 'safety-maintenance', name: 'Safety & Facility Maintenance' },
  ],
  'housekeeping-hygiene': [
    { id: 'cleaning-chemicals', name: 'Cleaning Chemicals & Detergents' },
    { id: 'washroom-dispensers', name: 'Washroom Hygiene & Dispensers' },
    { id: 'tissue-papers-rolls', name: 'Tissue Papers & Rolls' },
    { id: 'dustbins-waste-handling', name: 'Dustbins & Waste Handling' },
    { id: 'mops-floor-wipers', name: 'Mops & Floor Wipers' },
    { id: 'cloths-scrubbers-brushes', name: 'Cleaning Cloths, Scrubbers & Brushes' },
    { id: 'cleaning-equipment-trolleys', name: 'Cleaning Equipment & Trolleys' },
    { id: 'air-fresheners-care', name: 'Air Fresheners & Washroom Care' },
  ],
  'printers-technology': [
    { id: 'laser-toner-cartridges', name: 'Laser Toner Cartridges' },
    { id: 'ink-cartridges-supplies', name: 'Ink Cartridges & Print Supplies' },
    { id: 'paper-shredders', name: 'Paper Shredding Machines' },
    { id: 'currency-counting-machines', name: 'Currency Counting Machines' },
    { id: 'it-peripherals-machines', name: 'IT Peripherals & Office Machines' },
  ],
  'packaging-supplies': [
    { id: 'bopp-packaging-tapes', name: 'BOPP Packaging Tapes' },
    { id: 'protective-packaging-cushioning', name: 'Protective Packaging & Cushioning' },
    { id: 'box-strapping-banding', name: 'Box Strapping & Banding Rolls' },
    { id: 'floor-marking-safety-tapes', name: 'Floor Marking & Safety Tapes' },
    { id: 'adhesives-packaging-tools', name: 'Adhesives & Packaging Tools' },
  ],
};

function resolveAdminCategory(slugOrId?: string): { id: string; name: string } {
  if (!slugOrId) return { id: 'office-stationery', name: 'Office Stationery' };
  const s = slugOrId.toLowerCase().trim();
  if (
    s.includes('housekeep') ||
    s.includes('hygiene') ||
    s.includes('clean') ||
    s.includes('taski') ||
    s.includes('bin') ||
    s.includes('tissue') ||
    s.includes('mop') ||
    s.includes('wiper') ||
    s.includes('cloth') ||
    s.includes('dispenser')
  ) {
    return { id: 'housekeeping-hygiene', name: 'Housekeeping & Hygiene' };
  }
  if (
    s.includes('printer') ||
    s.includes('tech') ||
    s.includes('toner') ||
    s.includes('cartridge') ||
    s.includes('consumable') ||
    s.includes('shredder') ||
    s.includes('currency') ||
    s.includes('ink')
  ) {
    return { id: 'printers-technology', name: 'Printers & Technology' };
  }
  if (
    s.includes('packag') ||
    s.includes('dispatch') ||
    s.includes('tape') ||
    s.includes('bubble') ||
    s.includes('strapping') ||
    s.includes('box')
  ) {
    return { id: 'packaging-supplies', name: 'Packaging Supplies' };
  }
  return { id: 'office-stationery', name: 'Office Stationery' };
}

export default function ProductAdminDashboardClient({
  initialProducts,
  adminEmail,
}: ProductAdminDashboardClientProps) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft' | 'unpublished'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [viewingProduct, setViewingProduct] = useState<AdminProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('office-stationery');
  const [formCategoryName, setFormCategoryName] = useState('Office Stationery');
  const [formSubcategoryName, setFormSubcategoryName] = useState('');
  const [formBrand, setFormBrand] = useState('OfficeBazzar');
  const [formPackSize, setFormPackSize] = useState('1 Unit');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formPublishStatus, setFormPublishStatus] = useState<'published' | 'draft' | 'unpublished'>('published');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);

  // Operational states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [zohoApiError, setZohoApiError] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const [currentTime] = useState(() => Date.now());

  // Real Dynamic Metrics (sourced directly from actual Zoho CRM catalog records & fields)
  const metrics = useMemo(() => {
    const total = products.length;
    const published = products.filter(
      (p) => p.isActive === true && p.publishStatus !== 'draft' && p.publishStatus !== 'unpublished'
    ).length;
    const draft = products.filter((p) => p.publishStatus === 'draft').length;
    const unpublished = products.filter(
      (p) => p.publishStatus === 'unpublished' || (p.isActive === false && p.publishStatus !== 'draft')
    ).length;

    const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
    const recentlyAdded = products.filter((p) => {
      const t = p.createdAt || (p as any).createdTime;
      return t ? new Date(t).getTime() > thirtyDaysAgo : false;
    }).length;
    const recentlyUpdated = products.filter((p) => {
      const t = p.updatedAt || (p as any).modifiedTime;
      return t ? new Date(t).getTime() > thirtyDaysAgo : false;
    }).length;

    return {
      total,
      published,
      draft,
      unpublished,
      recentlyAdded,
      recentlyUpdated,
      // Alias for backwards compatibility
      active: published,
    };
  }, [products, currentTime]);

  // Derived subcategory selection for modal dropdown
  const selectedSubcategoryValue = useMemo(() => {
    if (!formSubcategoryName.trim()) return '';
    const available = SUBCATEGORIES_BY_CATEGORY[formCategoryId] || [];
    const query = formSubcategoryName.trim().toLowerCase();
    const matched = available.find(
      (sub) => sub.name.toLowerCase() === query || sub.id.toLowerCase() === query
    );
    if (matched) {
      return matched.name;
    }
    return '__custom__';
  }, [formCategoryId, formSubcategoryName]);

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
          p.categoryName?.toLowerCase().includes(q) ||
          p.subcategoryName?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(
        (p) =>
          p.categoryId?.toLowerCase() === selectedCategory ||
          p.categoryName?.toLowerCase() === selectedCategory
      );
    }

    if (selectedStatus !== 'all') {
      if (selectedStatus === 'published') {
        result = result.filter((p) => p.isActive !== false);
      } else {
        result = result.filter((p) => p.isActive === false);
      }
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedStatus]);

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
    setZohoApiError(null);
    try {
      const res = await fetch('/api/product-admin/products?limit=2000&refresh=true');
      const data = await res.json();
      if (res.ok && data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        showToast('success', `Product catalogue refreshed from Zoho CRM (${data.products.length} records).`);
      } else {
        const errMsg = data.error || data.details || 'Unable to refresh product records from Zoho CRM.';
        setZohoApiError(errMsg);
        showToast('error', errMsg);
      }
    } catch {
      const netErr = 'Network error connecting to Zoho CRM.';
      setZohoApiError(netErr);
      showToast('error', netErr);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTogglePublish = async (p: AdminProduct, targetStatus: 'published' | 'unpublished') => {
    try {
      const formData = new FormData();
      formData.append('name', p.name);
      formData.append('sku', p.sku);
      formData.append('publishStatus', targetStatus);

      const res = await fetch(`/api/product-admin/products/${p.id}`, {
        method: 'PUT',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast('error', data.error || `Failed to update status in Zoho CRM.`);
        return;
      }

      setProducts((prev) =>
        prev.map((item) =>
          item.id === p.id || item.sku === p.sku
            ? { ...item, isActive: targetStatus === 'published', publishStatus: targetStatus }
            : item
        )
      );

      showToast(
        'success',
        targetStatus === 'published'
          ? `Product "${p.name}" published live to storefront and Zoho CRM!`
          : `Product "${p.name}" unpublished and hidden from live storefront.`
      );
    } catch {
      showToast('error', 'Network error updating product status in Zoho CRM.');
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
    setFormPrice('');
    setFormPublishStatus('published');
    setFormImageFile(null);
    setFormImageUrl('');
    setFormImagePreview(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name || '');
    setFormSku(p.sku || '');
    const resolved = resolveAdminCategory(p.categoryId || p.categoryName);
    setFormCategoryId(resolved.id);
    setFormCategoryName(resolved.name);
    setFormSubcategoryName(p.subcategoryName || '');
    setFormBrand(p.brandName || 'OfficeBazzar');
    setFormPackSize(p.packSize || '1 Unit');
    setFormDescription(p.description || '');
    setFormPrice(p.price !== undefined && p.price !== null ? String(p.price) : '');
    setFormPublishStatus(p.isActive !== false ? 'published' : 'unpublished');
    setFormImageFile(null);
    const existingImg = p.images && p.images[0] ? p.images[0] : '';
    setFormImageUrl(existingImg);
    setFormImagePreview(existingImg || null);
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
      formData.append('name', formName.trim());
      formData.append('sku', formSku.trim().toUpperCase());
      formData.append('categoryId', formCategoryId);
      formData.append('categoryName', formCategoryName);
      if (formSubcategoryName.trim()) {
        formData.append('subcategoryId', formSubcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        formData.append('subcategoryName', formSubcategoryName.trim());
      }
      formData.append('brandName', formBrand.trim());
      formData.append('packSize', formPackSize.trim());
      formData.append('description', formDescription.trim());
      formData.append('publishStatus', formPublishStatus);
      if (formPrice.trim()) formData.append('price', formPrice.trim());
      if (formImageFile) formData.append('imageFile', formImageFile);
      if (formImageUrl.trim()) formData.append('imageUrl', formImageUrl.trim());

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
        `Product "${formName}" published to Zoho CRM and synchronized live!`
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
      formData.append('name', formName.trim());
      formData.append('sku', formSku.trim().toUpperCase());
      formData.append('categoryId', formCategoryId);
      formData.append('categoryName', formCategoryName);
      if (formSubcategoryName.trim()) {
        formData.append('subcategoryId', formSubcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        formData.append('subcategoryName', formSubcategoryName.trim());
      }
      formData.append('brandName', formBrand.trim());
      formData.append('packSize', formPackSize.trim());
      formData.append('description', formDescription.trim());
      formData.append('publishStatus', formPublishStatus);
      if (formPrice.trim()) formData.append('price', formPrice.trim());
      if (formImageFile) formData.append('imageFile', formImageFile);
      if (formImageUrl.trim()) formData.append('imageUrl', formImageUrl.trim());

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
        `Product "${formName}" updated in Zoho CRM and synchronized live across OfficeBazzar!`
      );
    } catch {
      showToast('error', 'Network error updating product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/product-admin/products/${deletingProduct.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast('error', data.error || 'Failed to delete product.');
        setDeleting(false);
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id && p.sku !== deletingProduct.sku));
      showToast(
        'success',
        `Product "${deletingProduct.name}" (${deletingProduct.sku}) deleted and synchronized with Zoho CRM.`
      );
      setDeletingProduct(null);
    } catch {
      showToast('error', 'Network error while attempting to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#ea580c] selection:text-white">
      {/* 1. Official OfficeBazzar Top Navigation Bar */}
      <header className="h-[72px] border-b border-slate-200 bg-white sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center shrink-0" title="Back to Storefront">
            <Image
              src="/images/officebazzar-logo-transparent.webp"
              alt="OfficeBazzar Logo"
              width={160}
              height={45}
              className="w-[120px] sm:w-[136px] h-auto object-contain"
              priority
            />
          </Link>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              Product Admin Dashboard
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#057a3b] border border-emerald-200">
              Zoho CRM Live Sync
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={refreshProducts}
            disabled={refreshing}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-200"
            title="Force refresh products from Zoho CRM"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#ea580c]' : 'text-slate-600'}`} />
            <span className="hidden md:inline">Sync Zoho CRM</span>
          </button>

          <a
            href="/products"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#ea580c] bg-white px-3 py-2 rounded-xl border border-slate-200 hover:border-[#ea580c]/40 transition-colors shadow-2xs"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-slate-600 hidden lg:inline max-w-[200px] truncate font-medium">
              {adminEmail}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              title="Sign Out of Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Toast Notification (Top Right - clean & visible) */}
        {toastMessage && (
          <div
            className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 border backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 max-w-md ${toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#057a3b] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-auto text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Zoho CRM API Error Banner */}
        {zohoApiError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-900 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-950 uppercase tracking-wider">Zoho CRM Real-Time API Notice</p>
                <p className="text-xs text-rose-800 mt-0.5">{zohoApiError}</p>
              </div>
            </div>
            <button
              onClick={refreshProducts}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-100/50 text-rose-800 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Retry Sync
            </button>
          </div>
        )}

        {/* 1. Dynamic Overview Section Metrics - 6 Real Zoho CRM Metric Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total Products */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Total Products</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.total.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Zoho CRM Catalog</p>
          </div>

          {/* Published Products */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Published</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#057a3b] flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#057a3b] tracking-tight">
              {metrics.published.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">Live on Storefront</p>
          </div>

          {/* Draft Products */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Drafts</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight">
              {metrics.draft.toLocaleString()}
            </div>
            <p className="text-[11px] text-amber-700/80 mt-1 font-medium">In Review / Unlisted</p>
          </div>

          {/* Unpublished Products */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Unpublished</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <EyeOff className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 tracking-tight">
              {metrics.unpublished.toLocaleString()}
            </div>
            <p className="text-[11px] text-rose-700/80 mt-1 font-medium">Hidden from Public</p>
          </div>

          {/* Recently Added */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Recently Added</span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#ea580c] flex items-center justify-center">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.recentlyAdded.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Last 30 days</p>
          </div>

          {/* Recently Updated */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Recently Updated</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.recentlyUpdated.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Last 30 days</p>
          </div>
        </section>

        {/* 2. Product Management Action Bar */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
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
                placeholder="Search by Product Name or Code (SKU)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white focus:ring-2 focus:ring-[#ea580c]/15 transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[180px]">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 pl-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-[#ea580c] focus:bg-white cursor-pointer transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[150px]">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as 'all' | 'published' | 'draft' | 'unpublished');
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 pl-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-[#ea580c] focus:bg-white cursor-pointer transition-colors"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </div>
          </div>

          {/* Add Product Button (Brand Orange) */}
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] active:bg-[#9a3412] text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </section>

        {/* 3. Product Catalog Table */}
        <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
              <SlidersHorizontal className="w-4 h-4 text-[#ea580c]" />
              <span>Showing {filteredProducts.length} matching products</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">Preview</th>
                  <th className="py-3 px-4">Product Name &amp; Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Pack Size</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-500">
                      <FolderTree className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="font-semibold text-slate-700">No products match your search or filter.</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting the search query or category filter above.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => {
                    const imgUrl = resolveProductImageUrl(p.images?.[0]);
                    const isPublished = p.isActive !== false;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center p-1">
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
                          <div className="font-semibold text-slate-900 line-clamp-1">{p.name}</div>
                          <div className="text-xs font-mono text-[#ea580c] mt-0.5 font-bold">{p.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div className="font-medium">{p.categoryName || 'Office Supplies'}</div>
                          {p.subcategoryName && (
                            <div className="text-xs text-slate-500">{p.subcategoryName}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{p.brandName || 'OfficeBazzar'}</td>
                        <td className="py-3 px-4 text-slate-500 text-xs font-medium">{p.packSize || '1 Unit'}</td>
                        <td className="py-3 px-4 text-center">
                          {isPublished ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#057a3b] border border-emerald-200">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Unpublished
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/product/${p.slug || p.sku.toLowerCase()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#057a3b] border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                              title="View on live website"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Live</span>
                            </a>

                            <button
                              onClick={() => setViewingProduct(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#004b87] border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                              title="View complete product details"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#004b87]" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => openEditModal(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                              title="Edit product details"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                              <span>Edit</span>
                            </button>

                            {/* Live Publish / Unpublish Toggle */}
                            {isPublished ? (
                              <button
                                onClick={() => handleTogglePublish(p, 'unpublished')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                                title="Unpublish from live website"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Unpublish</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTogglePublish(p, 'published')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#057a3b] border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                                title="Publish live to website"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Publish</span>
                              </button>
                            )}

                            <button
                              onClick={() => setDeletingProduct(p)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Delete</span>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-600 font-medium">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} products
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shadow-2xs">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 4. Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Delete Product Confirmation</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to delete this product? This will remove it from the active OfficeBazzar catalogue and synchronize the deactivation with Zoho CRM.
            </p>

            <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-semibold text-slate-900">{deletingProduct.name}</div>
              <div className="font-mono text-[#ea580c] font-bold">SKU: {deletingProduct.sku}</div>
              <div className="text-slate-500">Category: {deletingProduct.categoryName || 'Office Supplies'}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea580c]">
                  {editingProduct ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingProduct ? 'Edit Existing Product' : 'Add New Product to Zoho CRM'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingProduct
                      ? `Updating SKU: ${editingProduct.sku}`
                      : 'Direct synchronization with live catalogue and Zoho CRM Products module'}
                  </p>
                </div>
              </div>

              {editingProduct && (
                <a
                  href={`/product/${editingProduct.slug || editingProduct.sku.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#057a3b] border border-emerald-200 text-xs font-bold transition-all mr-8"
                  title="View this product live on OfficeBazzar storefront"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View on Website</span>
                </a>
              )}
            </div>

            <form
              onSubmit={editingProduct ? handleUpdateProduct : handleSaveNewProduct}
              className="space-y-4 text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Kangaro Heavy Duty Punch DP-800"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white focus:ring-2 focus:ring-[#ea580c]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product Code / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    placeholder="e.g. OB-STA-1050"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white focus:ring-2 focus:ring-[#ea580c]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      setFormCategoryId(newCatId);
                      const match = CATEGORIES.find((c) => c.id === newCatId);
                      setFormCategoryName(match ? match.name : 'Office Supplies');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#ea580c] focus:bg-white cursor-pointer"
                  >
                    <option value="office-stationery">Office Stationery</option>
                    <option value="housekeeping-hygiene">Housekeeping & Hygiene</option>
                    <option value="packaging-supplies">Packaging Supplies</option>
                    <option value="printers-technology">Printers & Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subcategory
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={selectedSubcategoryValue}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          // Keep existing custom string
                        } else {
                          setFormSubcategoryName(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#ea580c] focus:bg-white cursor-pointer"
                    >
                      <option value="">-- Select Standard Subcategory --</option>
                      {SUBCATEGORIES_BY_CATEGORY[formCategoryId]?.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                      <option value="__custom__">Custom / Enter Manually Below...</option>
                    </select>
                    <input
                      type="text"
                      value={formSubcategoryName}
                      onChange={(e) => setFormSubcategoryName(e.target.value)}
                      placeholder="e.g. Files & Folders, Writing Instruments..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white focus:ring-2 focus:ring-[#ea580c]/15"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. Kangaro, JK, Diversey"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white focus:ring-2 focus:ring-[#ea580c]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit in Business (Pack Size)
                  </label>
                  <input
                    type="text"
                    value={formPackSize}
                    onChange={(e) => setFormPackSize(e.target.value)}
                    placeholder="e.g. 1 Unit, Box of 10, Ream of 500"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white focus:ring-2 focus:ring-[#ea580c]/15"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Publishing Status *
                  </label>
                  <select
                    value={formPublishStatus}
                    onChange={(e) => setFormPublishStatus(e.target.value as 'published' | 'draft' | 'unpublished')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#ea580c] focus:bg-white cursor-pointer"
                  >
                    <option value="published">Published (Visible in Storefront &amp; Zoho)</option>
                    <option value="draft">Draft (Saved in Admin only)</option>
                    <option value="unpublished">Unpublished (Hidden from Storefront)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price (INR) — Optional
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="Leave 0 for Quote On Request (RFQ)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white focus:ring-2 focus:ring-[#ea580c]/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Institutional specifications, usage details, and procurement terms..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white focus:ring-2 focus:ring-[#ea580c]/15"
                />
              </div>

              {/* Image Input Area with File Upload and URL Option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Image
                </label>
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {formImagePreview ? (
                      <div className="w-24 h-24 rounded-xl bg-[#AFC5DC] border border-slate-200 overflow-hidden relative shrink-0 p-1 flex items-center justify-center shadow-2xs">
                        <Image
                          src={formImagePreview}
                          alt="Preview"
                          width={96}
                          height={96}
                          className="object-contain w-full h-full"
                          onError={() => setFormImagePreview('/assets/placeholder-product.svg')}
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                    )}

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div>
                        <input
                          type="file"
                          id="productImageInput"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="productImageInput"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 cursor-pointer transition-colors shadow-2xs"
                        >
                          <UploadCloud className="w-4 h-4 text-[#ea580c]" />
                          <span>{formImagePreview ? 'Upload New Image File' : 'Select Image File'}</span>
                        </label>
                      </div>

                      <div className="text-xs text-slate-500 font-medium">
                        Or enter an external/existing Image URL directly below:
                      </div>
                    </div>
                  </div>

                  {/* Direct Image URL input */}
                  <div>
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => {
                        setFormImageUrl(e.target.value);
                        if (e.target.value.trim()) {
                          setFormImagePreview(e.target.value.trim());
                        }
                      }}
                      placeholder="e.g. /assets/products/catalog_2026/OB-PROD.webp or https://..."
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] active:bg-[#9a3412] text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Zoho CRM...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Save Changes' : 'Publish Product'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Product View Modal (Separate View Mode) */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingProduct(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close View Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#004b87]">
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900">Product Specifications &amp; Overview</h2>
                  <span className="font-mono text-xs font-bold text-[#ea580c] bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200">
                    {viewingProduct.sku}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed institutional catalogue specifications &amp; live synchronization status
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Large Image & Quick Actions */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="w-full aspect-square max-w-[280px] rounded-2xl bg-[#AFC5DC] border border-slate-200/90 p-4 flex items-center justify-center relative shadow-inner overflow-hidden">
                  <Image
                    src={resolveProductImageUrl(viewingProduct.images?.[0])}
                    alt={viewingProduct.name}
                    width={260}
                    height={260}
                    className="object-contain max-h-[240px] w-auto drop-shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/placeholder-product.svg';
                    }}
                  />
                </div>

                <div className="w-full mt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <span className="text-slate-500 font-medium">Publishing Status:</span>
                    {viewingProduct.isActive !== false ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#057a3b] border border-emerald-200">
                        Published (Active)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Unpublished / Draft
                      </span>
                    )}
                  </div>

                  {viewingProduct.isActive !== false && (
                    <Link
                      href={`/product/${viewingProduct.slug}`}
                      target="_blank"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-200 shadow-2xs"
                    >
                      <span>View on Live Storefront</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#ea580c]" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Right Column: Key Details & Specifications */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {viewingProduct.name}
                  </h3>
                  <div className="text-xs font-mono text-[#ea580c] font-bold mt-1">
                    SKU: {viewingProduct.sku}
                  </div>
                </div>

                {/* 10-Field Specification Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div>
                    <span className="text-slate-500 font-medium block">Category</span>
                    <span className="font-semibold text-slate-800">
                      {viewingProduct.categoryName || 'Office Stationery'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">Subcategory</span>
                    <span className="font-semibold text-slate-800">
                      {viewingProduct.subcategoryName || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">Brand</span>
                    <span className="font-semibold text-slate-800">
                      {viewingProduct.brandName || 'OfficeBazzar'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">Pack Size / Unit</span>
                    <span className="font-semibold text-slate-800">
                      {viewingProduct.packSize || '1 Unit'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">Commercial Terms</span>
                    <span className="font-semibold text-slate-800">
                      {viewingProduct.price ? `₹${viewingProduct.price}` : 'Quote on Request (RFQ)'}
                    </span>
                  </div>

                  <div className="col-span-2 pt-2 border-t border-slate-200/80">
                    <span className="text-slate-500 font-medium block">Zoho CRM Record ID</span>
                    <span className="font-mono text-xs font-bold text-slate-700 break-all">
                      {viewingProduct.zohoProductId || `Zoho Synced (${viewingProduct.sku})`}
                    </span>
                  </div>
                </div>

                {/* Description Box */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">
                    Product Description
                  </span>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {viewingProduct.description || 'No description provided for this catalogue item.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Record ID: {viewingProduct.id}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prodToEdit = viewingProduct;
                    setViewingProduct(null);
                    openEditModal(prodToEdit);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit this Product</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
