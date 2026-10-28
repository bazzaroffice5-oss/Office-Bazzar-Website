'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Product, Category, Brand } from '@/types';

interface ProductFormClientProps {
  initialProduct?: Product;
  categories: Category[];
  brands: Brand[];
  mode: 'create' | 'edit';
}

const COMMON_UNITS = [
  'Standard Pack',
  '1 Piece',
  'Box of 10',
  'Box of 50',
  'Box of 100',
  '500 Sheets Ream',
  'Case of 5 Reams',
  '5 Litres Can',
  '1 Set',
];

export default function ProductFormClient({
  initialProduct,
  categories: initialCategories,
  brands: initialBrands,
  mode,
}: ProductFormClientProps) {
  const router = useRouter();

  // Form State
  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [packSize, setPackSize] = useState(initialProduct?.packSize || 'Standard Pack');
  const [categoryId, setCategoryId] = useState(
    initialProduct?.categoryId || (initialCategories[0]?.id ?? 'office-supplies-stationery')
  );
  const [brandId, setBrandId] = useState(
    initialProduct?.brandId || (initialBrands[0]?.id ?? 'officebazzar')
  );
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [isActive, setIsActive] = useState<boolean>(initialProduct ? initialProduct.isActive : true);

  // Images state
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Dynamic Category / Brand creation state
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [showNewBrandModal, setShowNewBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

  // Submit & Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdProductSlug, setCreatedProductSlug] = useState<string | null>(null);

  // Generate SKU Helper
  const handleGenerateSku = () => {
    const prefix = 'OB';
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    setSku(`${prefix}-${randomDigits}`);
  };

  // Image Upload handler (uses /api/office-control/upload)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isPrimary = true) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMessage(null);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File "${file.name}" exceeds the 5MB limit.`);
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploadProgress(Math.round(10 + (80 * (i + 0.5)) / files.length));

        const res = await fetch('/api/office-control/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to upload "${file.name}".`);
        }

        uploadedUrls.push(data.url);
      }

      setUploadProgress(100);

      if (isPrimary) {
        // If uploading primary, replace or prepend first image
        setImages((prev) => [uploadedUrls[0], ...uploadedUrls.slice(1), ...prev.slice(1)]);
      } else {
        // Additional images
        setImages((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error uploading image.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  // Remove Image
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // Inline Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    try {
      const res = await fetch('/api/office-control/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create category');
      }

      setCategories((prev) => [...prev, data.category]);
      setCategoryId(data.category.id);
      setNewCategoryName('');
      setShowNewCategoryModal(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error creating category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Inline Brand Creation
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    setIsCreatingBrand(true);
    try {
      const res = await fetch('/api/office-control/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create brand');
      }

      setBrands((prev) => [...prev, data.brand]);
      setBrandId(data.brand.id);
      setNewBrandName('');
      setShowNewBrandModal(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error creating brand');
    } finally {
      setIsCreatingBrand(false);
    }
  };

  // Form Submission
  const handleSubmit = async (targetActiveStatus: boolean) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validations
    if (!name.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }

    if (!sku.trim()) {
      setErrorMessage('Product code / SKU is required.');
      return;
    }

    if (images.length === 0) {
      setErrorMessage('A primary product image is required. Please upload an image.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      images,
      packSize: packSize.trim() || 'Standard Pack',
      categoryId,
      brandId,
      description: description.trim(),
      isActive: targetActiveStatus,
    };

    try {
      const url =
        mode === 'create'
          ? '/api/office-control/products'
          : `/api/office-control/products/${initialProduct?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save product.');
      }

      const savedProduct: Product = data.product;
      setCreatedProductSlug(savedProduct.slug);
      setIsActive(savedProduct.isActive);

      setSuccessMessage(
        savedProduct.isActive
          ? `Product "${savedProduct.name}" is PUBLISHED and live on the public website!`
          : `Product "${savedProduct.name}" saved as a PRIVATE DRAFT.`
      );

      if (mode === 'create') {
        setTimeout(() => {
          router.push('/office-control/products');
          router.refresh();
        }, 1800);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/office-control/products"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            title="Back to products list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {mode === 'create' ? 'Add New Product' : `Edit: ${initialProduct?.name}`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'create'
                ? 'Create a new B2B catalogue product with images, pack size, and specifications.'
                : 'Modify product information, images, or toggle draft/published status.'}
            </p>
          </div>
        </div>

        {createdProductSlug && isActive && (
          <Link
            href={`/product/${createdProductSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View on Public Store</span>
          </Link>
        )}
      </div>

      {/* Error / Success Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1">
            <p className="font-semibold">{successMessage}</p>
            {createdProductSlug && isActive && (
              <p className="text-xs mt-1 text-emerald-700">
                Live URL:{' '}
                <Link
                  href={`/product/${createdProductSlug}`}
                  target="_blank"
                  className="underline hover:text-emerald-900 font-medium"
                >
                  /product/{createdProductSlug}
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 sm:p-8 space-y-8">
        {/* Section 1: Basic Identity */}
        <div className="space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 border-b border-slate-100 pb-2">
            1. Product Identification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Product Name <span className="text-orange-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. JK Copier Paper A4 75 GSM (Ream of 500 Sheets)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>

            {/* Product Code / SKU */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Product Code / SKU <span className="text-orange-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Code</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. OB-JK-A4-75"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:bg-white transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Unique identifier used across quotations and RFQ cart.
              </p>
            </div>

            {/* Unit in Business */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Unit in Business <span className="text-orange-600">*</span>
              </label>
              <input
                type="text"
                required
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                placeholder="e.g. Standard Pack, Box of 100, 5 Litres"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:bg-white transition-all"
              />
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_UNITS.slice(0, 5).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setPackSize(unit)}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Product Images */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 border-b border-slate-100 pb-2">
            2. Product Images <span className="text-orange-600">*</span>
          </h2>

          {/* Primary Image Upload Box */}
          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Primary Product Image (Required)
            </span>

            {images.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="relative w-28 h-28 rounded-xl bg-white border border-slate-200 p-2 shrink-0 overflow-hidden shadow-xs">
                  <Image
                    src={images[0]}
                    alt="Primary preview"
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Primary Display Image
                    </span>
                    <span className="text-xs text-slate-500 truncate">{images[0]}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    This image appears on catalog pages, cards, and quote requests.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer underline">
                      <span>Change Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, true)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(0)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-50/60 border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50/20 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  Click or drag image to upload
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Supports JPG, PNG, WebP up to 5MB. Stored securely in Supabase Storage.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  required={images.length === 0}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, true)}
                />
              </label>
            )}

            {isUploading && (
              <div className="mt-3 p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center gap-3 text-xs text-orange-800 font-medium">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-orange-600" />
                <span>Uploading image to Supabase Storage ({uploadProgress}%)...</span>
              </div>
            )}
          </div>

          {/* Additional Images Strip */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Additional Images (Optional)
              </span>
              <label className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer inline-flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, false)}
                />
              </label>
            </div>

            {images.length > 1 ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {images.slice(1).map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-xl bg-slate-50 border border-slate-200 p-1 overflow-hidden shadow-xs"
                  >
                    <Image
                      src={imgUrl}
                      alt={`Additional ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx + 1)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No additional product images uploaded yet.
              </p>
            )}
          </div>
        </div>

        {/* Section 3: Categorization & Brand */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 border-b border-slate-100 pb-2">
            3. Category & Brand Classification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Category Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Category <span className="text-orange-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(true)}
                  className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Category</span>
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:bg-white cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Brand <span className="text-orange-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewBrandModal(true)}
                  className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Brand</span>
                </button>
              </div>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:bg-white cursor-pointer"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Description */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 border-b border-slate-100 pb-2">
            4. Product Description & Specifications
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Detailed Description
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product details, specifications, packaging dimensions, industrial applications, etc."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Section 5: Publish Status Selection */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 border-b border-slate-100 pb-2">
            5. Publication Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setIsActive(true)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isActive
                  ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isActive ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                  }`}
                >
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
                <div>
                  <span className="font-bold text-sm block text-slate-900">Published (Live)</span>
                  <span className="text-xs text-slate-500">
                    Immediately visible to public visitors in catalog and searches.
                  </span>
                </div>
              </div>
            </div>

            <div
              onClick={() => setIsActive(false)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                !isActive
                  ? 'bg-amber-50/80 border-amber-500 text-amber-950 shadow-xs ring-1 ring-amber-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    !isActive ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                  }`}
                >
                  {!isActive && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
                <div>
                  <span className="font-bold text-sm block text-slate-900">Save as Draft</span>
                  <span className="text-xs text-slate-500">
                    Hidden from public customers. Only visible inside control dashboard.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Action Buttons */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/office-control/products"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-semibold text-center transition-colors shadow-xs"
          >
            Cancel
          </Link>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
            {mode === 'create' ? (
              <>
                <button
                  type="button"
                  disabled={isSubmitting || isUploading}
                  onClick={() => handleSubmit(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && !isActive ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Draft...</span>
                    </span>
                  ) : (
                    <span>Save as Draft</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || isUploading}
                  onClick={() => handleSubmit(true)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && isActive ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>Publish Product</span>
                    </span>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || isUploading}
                onClick={() => handleSubmit(isActive)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </span>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add New Category */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create New Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Ergonomic Office Seating"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isCreatingCategory ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Brand */}
      {showNewBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create New Brand</h3>
            <form onSubmit={handleCreateBrand} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Kangaroo Staplers"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBrandModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBrand || !newBrandName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isCreatingBrand ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
