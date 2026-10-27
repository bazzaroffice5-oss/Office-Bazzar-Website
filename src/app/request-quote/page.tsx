'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Package,
  Camera,
  UploadCloud,
  X,
  Plus,
  Minus,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';

interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PHOTOS = 10;

export default function RequestQuotePage() {
  const { items, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const { location } = useLocation();

  // Form states
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [gstin, setGstin] = useState(user?.gstin || '');
  const [contactPerson, setContactPerson] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pincode, setPincode] = useState(location.pincode || '600014');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Photo Upload States
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [photos]);

  const processFiles = (fileList: FileList | File[]) => {
    setPhotoError(null);
    const incoming = Array.from(fileList);

    if (photos.length + incoming.length > MAX_PHOTOS) {
      setPhotoError(`You can upload a maximum of ${MAX_PHOTOS} photos in total.`);
      return;
    }

    const validItems: PhotoItem[] = [];

    for (const file of incoming) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType =
        ALLOWED_TYPES.includes(file.type.toLowerCase()) ||
        ALLOWED_EXTS.includes(ext);

      if (!isValidType) {
        setPhotoError(
          `"${file.name}" is not a supported format. Please upload JPG, PNG, or WEBP images only.`
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const mb = (file.size / (1024 * 1024)).toFixed(1);
        setPhotoError(
          `"${file.name}" is ${mb} MB, which exceeds the 5 MB limit. Please select a smaller photo.`
        );
        return;
      }

      validItems.push({
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      });
    }

    setPhotos((prev) => [...prev, ...validItems]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
    setPhotoError(null);
  };

  // Submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStatusText, setSubmittingStatusText] = useState('Submitting Quotation...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedQuotation, setSubmittedQuotation] = useState<{
    id: string;
    quotationNumber: string;
  } | null>(null);

  // Idempotency key to protect from duplicate clicks
  const [idempotencyKey] = useState(
    () => `OB-RFQ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  );

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!companyName.trim() || !contactPerson.trim()) {
      setErrorMsg('Please enter company name and contact person.');
      return;
    }
    if (!email.trim() || !phone.trim()) {
      setErrorMsg('Please enter valid business email and contact phone number.');
      return;
    }
    const cleanPincode = pincode.trim();
    if (!cleanPincode || !/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      setErrorMsg('Please enter a valid 6-digit Indian delivery PIN code.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Your quotation cart has no products. Please add items to request a quote.');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedPhotoUrls: string[] | undefined = undefined;

      // 1. If photos are attached, upload them first
      if (photos.length > 0) {
        setSubmittingStatusText(`Uploading ${photos.length} photo(s)...`);
        const formData = new FormData();
        photos.forEach((p) => {
          formData.append('photos', p.file);
        });

        const uploadRes = await fetch('/api/quotations/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload selected photos. Please try again.');
        }

        uploadedPhotoUrls = uploadData.urls;
      }

      setSubmittingStatusText('Submitting Quotation Request...');

      // 2. Submit quotation request
      const response = await fetch('/api/quotations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          customerName: contactPerson.trim(),
          companyName: companyName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          gstin: gstin.trim().toUpperCase() || undefined,
          pincode: cleanPincode,
          photoUrls: uploadedPhotoUrls,
          preferredContactMethod: 'email',
          additionalRequirements: additionalNotes.trim() || undefined,
          customerId: user?.id,
          idempotencyKey,
          items: items.map((it) => ({
            productId: it.product.id,
            productName: it.product.name,
            sku: it.product.sku,
            indicativeUnitPrice: it.product.price ?? 0,
            gstPercent: it.product.gstPercent || 18,
            quantity: it.quantity,
            indicativeTotalPrice: (it.product.price ?? 0) * it.quantity,
            productImage: it.product.images[0] || '',
            packSize: it.product.packSize || 'Standard Pack',
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quotation. Please try again.');
      }

      setSubmittedQuotation({
        id: data.quotation?.id || data.id,
        quotationNumber: data.quotation?.quotationNumber || data.quotationNumber || 'OB-RFQ-CONFIRMED',
      });
      clearCart();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
      setSubmittingStatusText('Submitting Quotation...');
    }
  };

  // Success Confirmation State
  if (submittedQuotation) {
    return (
      <main className="min-h-[70vh] bg-slate-50/60 py-16 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center shadow-md space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#16a34a] flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#16a34a]">
              RFQ Received Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Quotation Request Confirmed
            </h1>
            <p className="text-sm text-slate-600">
              Your quotation reference number is{' '}
              <strong className="text-slate-900 font-mono text-base font-semibold">
                {submittedQuotation.quotationNumber}
              </strong>
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 text-left space-y-2 border border-slate-200/80">
            <div className="flex justify-between">
              <span className="text-slate-500">Company:</span>
              <span className="font-semibold text-slate-900">{companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contact Person:</span>
              <span className="font-semibold text-slate-900">{contactPerson}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-semibold text-slate-900">{email}</span>
            </div>
            {photos.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Photos Attached:</span>
                <span className="font-semibold text-[#004b87]">{photos.length} photo(s) submitted</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Turnaround:</span>
              <span className="font-semibold text-emerald-700">Official quote sent within 2 business hours</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/account?tab=rfqs"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-semibold rounded-xl transition-colors text-center"
            >
              View in My RFQs
            </Link>
            <Link
              href="/products"
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors text-center"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // If cart is empty
  if (items.length === 0) {
    return (
      <main className="min-h-[70vh] bg-slate-50/60 flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Your Quotation List is Empty</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Please browse products and add items to your cart before requesting a quotation.
            </p>
          </div>
          <div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold rounded-xl text-xs transition-colors"
            >
              <span>Browse Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 py-5 sm:py-8">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center space-x-1.5 text-xs text-slate-500 mb-4 font-normal"
        >
          <Link href="/" className="hover:text-[#004b87] transition-colors">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold">Request a Quote</span>
        </nav>

        {/* 3-Step Indicator (Compact & Neatly Aligned) */}
        <div className="flex items-center justify-center mb-6 sm:mb-8 max-w-md mx-auto">
          {/* Step 1: Products */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#16a34a] text-white text-[11px] font-semibold flex items-center justify-center shadow-xs">
              ✓
            </div>
            <span className="text-xs font-semibold text-slate-900">Products</span>
          </div>

          <div className="w-8 sm:w-12 h-0.5 bg-[#16a34a] mx-1.5 sm:mx-2" />

          {/* Step 2: Business Details */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#16a34a] text-white text-[11px] font-semibold flex items-center justify-center shadow-xs">
              2
            </div>
            <span className="text-xs font-semibold text-slate-900">Business Details</span>
          </div>

          <div className="w-8 sm:w-12 h-0.5 bg-slate-200 mx-1.5 sm:mx-2" />

          {/* Step 3: Review & Submit */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-[11px] font-semibold flex items-center justify-center">
              3
            </div>
            <span className="text-xs font-medium text-slate-400">Review &amp; Submit</span>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 max-w-3xl mx-auto p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Two-Column Layout (Compact & Centered) */}
        <form onSubmit={handleSubmitQuote}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* Left Column: Products in Quote (5 cols, compact) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-4 sm:p-4.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                  Products in Quote
                </h2>
                <span className="text-[11px] font-semibold text-slate-400">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-10 h-10 rounded-md bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        <Image
                          src={
                            item.product.images[0] ||
                            'https://officebazzar.co.in/wp-content/uploads/2022/12/cardboard-tag-file-500x500-1.jpg'
                          }
                          alt={item.product.name}
                          fill
                          className="object-contain p-1"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          SKU: {item.product.sku}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Quantity Selector */}
                    <div className="flex items-center shrink-0">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50/90 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.product.name}`}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                            item.quantity <= 1
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-white active:bg-slate-200'
                          }`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span
                          className="min-w-6 px-1.5 text-center text-xs font-bold text-slate-900 select-none"
                          aria-live="polite"
                        >
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.product.name}`}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-white active:bg-slate-200 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <Link
                  href="/cart"
                  className="text-[#004b87] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Edit Quantities in Cart</span>
                </Link>
                <span>GST Tax Credit Eligible</span>
              </div>
            </div>

            {/* Right Column: Business Information Form (7 cols, compact) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="pb-2 border-b border-slate-100">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Business Information
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enter company and delivery credentials for customized wholesale pricing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {/* Company Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    className="w-full h-8 sm:h-9 px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
                  />
                </div>

                {/* GST Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="Enter GST number"
                    className="w-full h-8 sm:h-9 px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white uppercase transition-all"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Contact Person <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Enter contact person name"
                    className="w-full h-8 sm:h-9 px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full h-8 sm:h-9 px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit phone number"
                    className="w-full h-8 sm:h-9 px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
                  />
                </div>

                {/* Delivery PIN Code */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Delivery PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 600014"
                    className="w-full h-8 sm:h-9 px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Upload Photos Section (Compact Dropzone) */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Upload Photos <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    JPG, PNG, WEBP (Max 5MB each)
                  </span>
                </div>

                {/* Upload Area / Dropzone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative rounded-lg border-2 border-dashed p-3 sm:p-4 text-center transition-all ${
                    isDragging
                      ? 'border-[#004b87] bg-blue-50/70'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="quote-photo-upload"
                  />

                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-[#004b87]">
                      <Camera className="w-4 h-4 text-[#004b87]" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900">
                        Upload Product or Facility Photos
                      </div>
                      <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                        Upload photos to help us understand your product requirements.
                      </p>
                    </div>

                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-md border border-slate-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-[#004b87]" />
                        <span>Choose Photos</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validation Error Banner */}
                {photoError && (
                  <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>{photoError}</span>
                  </div>
                )}

                {/* Image Previews Responsive Grid (Compact) */}
                {photos.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Selected Photos ({photos.length} of {MAX_PHOTOS})</span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-[#004b87] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add More</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs flex flex-col"
                        >
                          <div className="relative aspect-square w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.previewUrl}
                              alt={photo.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(photo.id)}
                              aria-label={`Remove photo ${photo.name}`}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                              title="Remove photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                            <span className="truncate text-slate-700 font-medium" title={photo.name}>
                              {photo.name}
                            </span>
                            <span className="text-slate-400 shrink-0 text-[9px]">
                              {(photo.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any specific delivery instructions, monthly ARC schedule, or custom branding requirements..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all resize-y"
                />
              </div>

              {/* Submit / Back Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <Link
                  href="/cart"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#057a3b] hover:bg-[#046330] disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-sm active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>{submittingStatusText}</span>
                  ) : (
                    <>
                      <span>Submit Quote Request</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
