'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Package,
  Camera,
  UploadCloud,
  X,
  Plus,
  Minus,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { getVersionedImageUrl, resolveProductImageUrl } from '@/lib/utils/image';

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

export default function RequestQuoteClient() {
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { location } = useLocation();

  // Multi-step wizard state: 1 = Products, 2 = Business Details, 3 = Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form states (preserved in component memory across step navigation)
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [gstin, setGstin] = useState(user?.gstin || '');
  const [contactPerson, setContactPerson] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pincode, setPincode] = useState(location.pincode || '600014');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Per-field validation error messages
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Photo Upload States
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStatusText, setSubmittingStatusText] = useState('Submitting Quotation...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedQuotation, setSubmittedQuotation] = useState<{
    id: string;
    quotationNumber: string;
  } | null>(null);

  // Idempotency key to protect from duplicate submissions
  const [idempotencyKey] = useState(
    () => `OB-RFQ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  );

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [photos]);

  // Pricing calculations
  const { subtotal, gstAmount, grandTotal, totalItemsCount } = useMemo(() => {
    const sub = items.reduce((acc, it) => acc + (it.product.price || 0) * it.quantity, 0);
    const gst = Math.round(sub * 0.18 * 100) / 100;
    const grand = Math.round((sub + gst) * 100) / 100;
    const count = items.reduce((acc, it) => acc + it.quantity, 0);
    return { subtotal: sub, gstAmount: gst, grandTotal: grand, totalItemsCount: count };
  }, [items]);

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

  // Step 2 Validation: pure client-side verification with ZERO network requests
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!companyName.trim() || companyName.trim().length < 2) {
      errors.companyName = 'Company / business enterprise name is required (minimum 2 characters).';
    }

    if (!contactPerson.trim() || contactPerson.trim().length < 2) {
      errors.contactPerson = 'Contact person name is required (minimum 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'A valid business email address is required.';
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const phoneValid = cleanPhone.length === 10 || (cleanPhone.length > 10 && cleanPhone.endsWith(cleanPhone.slice(-10)));
    if (!phone.trim() || !phoneValid) {
      errors.phone = 'A valid 10-digit Indian mobile contact number is required.';
    }

    const cleanPincode = pincode.trim();
    if (!cleanPincode || !/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      errors.pincode = 'A valid 6-digit Indian delivery PIN code is required.';
    }

    const cleanGstin = gstin.trim().toUpperCase();
    if (cleanGstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(cleanGstin)) {
        errors.gstin = 'GSTIN format is invalid (standard 15-character Indian format required, e.g., 33AABCO1234F1Z5).';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (validateStep2()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 3: Final Submission (Executed ONLY after explicit customer confirmation)
  const handleFinalSubmit = async () => {
    setErrorMsg(null);

    if (items.length === 0) {
      setErrorMsg('Your quotation cart has no products. Please add items to request a quote.');
      setCurrentStep(1);
      return;
    }

    if (!validateStep2()) {
      setCurrentStep(2);
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

      setSubmittingStatusText('Registering Quotation in Zoho CRM...');

      // 2. Submit authoritative RFQ to server -> Zoho CRM
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
          phone: phone.replace(/[^0-9]/g, '').slice(-10),
          gstin: gstin.trim().toUpperCase() || undefined,
          deliveryLocation: deliveryLocation.trim() || undefined,
          pincode: pincode.trim(),
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
            productImage: resolveProductImageUrl(it.product.images?.[0]),
            packSize: it.product.packSize || 'Standard Pack',
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Failed to register quotation in Zoho CRM. Please try again.');
      }

      setSubmittedQuotation({
        id: data.quotation?.id || data.quotationId || data.id,
        quotationNumber: data.quotation?.quotationNumber || data.quotationNumber,
      });
      clearCart();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'An unexpected error occurred while saving to Zoho CRM. Please check your connection and retry.'
      );
    } finally {
      setIsSubmitting(false);
      setSubmittingStatusText('Submitting Quotation...');
    }
  };

  // Success Confirmation View
  if (submittedQuotation) {
    return (
      <main className="min-h-[70vh] bg-slate-50/60 py-16 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center shadow-md space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#16a34a] flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#16a34a]">
              Zoho CRM Confirmed
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Quotation Request Confirmed
            </h2>
            <p className="text-sm text-slate-600">
              Your official quotation reference number is:
            </p>
            <div className="inline-block bg-slate-100 border border-slate-300 px-4 py-2 rounded-xl text-lg sm:text-xl font-mono font-bold text-[#004b87]">
              {submittedQuotation.quotationNumber}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 text-left space-y-2.5 border border-slate-200/80">
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
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="font-semibold text-slate-900">{phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery PIN:</span>
              <span className="font-semibold text-slate-900">{pincode}</span>
            </div>
            {photos.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Photos Attached:</span>
                <span className="font-semibold text-[#004b87]">{photos.length} photo(s) submitted</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Turnaround SLA:</span>
              <span className="font-semibold text-emerald-700">Official quote dispatched within 2 business hours</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/products"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#004b87] hover:bg-[#003866] text-white text-xs font-semibold rounded-xl transition-colors text-center"
            >
              Browse More Products
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
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Your Quotation List is Empty</h2>
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

        {/* 3-Step Interactive Wizard Header */}
        <div className="mb-6 sm:mb-8 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            {/* Step 1: Products */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 cursor-pointer group focus:outline-none"
            >
              <div
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  currentStep === 1
                    ? 'bg-[#16a34a] text-white ring-4 ring-emerald-100'
                    : currentStep > 1
                    ? 'bg-[#16a34a] text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span
                className={`text-xs font-semibold ${
                  currentStep === 1 ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'
                }`}
              >
                Products
              </span>
            </button>

            <div
              className={`flex-1 h-0.5 mx-2.5 transition-colors ${
                currentStep > 1 ? 'bg-[#16a34a]' : 'bg-slate-200'
              }`}
            />

            {/* Step 2: Business Details */}
            <button
              type="button"
              onClick={() => {
                if (currentStep === 3) setCurrentStep(2);
                if (currentStep === 1 && items.length > 0) setCurrentStep(2);
              }}
              className="flex items-center gap-2 cursor-pointer group focus:outline-none"
            >
              <div
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  currentStep === 2
                    ? 'bg-[#16a34a] text-white ring-4 ring-emerald-100'
                    : currentStep > 2
                    ? 'bg-[#16a34a] text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span
                className={`text-xs font-semibold ${
                  currentStep === 2 ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'
                }`}
              >
                Business Details
              </span>
            </button>

            <div
              className={`flex-1 h-0.5 mx-2.5 transition-colors ${
                currentStep === 3 ? 'bg-[#16a34a]' : 'bg-slate-200'
              }`}
            />

            {/* Step 3: Review & Submit */}
            <button
              type="button"
              onClick={() => {
                if (validateStep2()) setCurrentStep(3);
              }}
              className="flex items-center gap-2 cursor-pointer group focus:outline-none"
            >
              <div
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  currentStep === 3
                    ? 'bg-[#004b87] text-white ring-4 ring-blue-100'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                3
              </div>
              <span
                className={`text-xs font-semibold ${
                  currentStep === 3 ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                Review &amp; Submit
              </span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-5 max-w-3xl mx-auto p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block mb-0.5">Submission Error:</strong>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: PRODUCTS IN QUOTATION                                             */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Step 1: Review Products in Quotation List
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm your required quantities before entering business delivery details.
                </p>
              </div>
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {items.length} line item(s) | {totalItemsCount} total units
              </span>
            </div>

            {/* Product List */}
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                return (
                  <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        <Image
                          src={getVersionedImageUrl(
                            item.product.images?.[0] || '/assets/placeholder-product.svg'
                          )}
                          alt={item.product.name}
                          fill
                          className="object-contain"
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.product.name}
                        </h2>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>SKU: {item.product.sku}</span>
                          <span>•</span>
                          <span>Pack: {item.product.packSize || 'Standard Pack'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.product.name}`}
                          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                            item.quantity <= 1
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-white active:bg-slate-200'
                          }`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="w-10 text-center font-bold text-xs text-slate-900">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.product.name}`}
                          className="w-7 h-7 rounded flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-white active:bg-slate-200 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <Link
                href="/products"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Browsing</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(2);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Business Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: BUSINESS & DELIVERY INFORMATION (No server save happens here)     */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <form onSubmit={handleProceedToReview} className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Step 2: Enter Business &amp; Delivery Details
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your company and procurement contact details for accurate quotation assignment and delivery estimation.
                </p>
              </div>

              {/* Business Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="rfq-company-name" className="block text-xs font-semibold text-slate-800 mb-1">
                    Company / Enterprise Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="rfq-company-name"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        if (fieldErrors.companyName) setFieldErrors((prev) => ({ ...prev, companyName: '' }));
                      }}
                      placeholder="e.g. Apollo Hospitals Ltd or Sundaram Fasteners Pvt Ltd"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white transition-all ${
                        fieldErrors.companyName ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#004b87]'
                      }`}
                    />
                  </div>
                  {fieldErrors.companyName && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.companyName}</p>
                  )}
                </div>

                {/* Contact Person */}
                <div>
                  <label htmlFor="rfq-contact-person" className="block text-xs font-semibold text-slate-800 mb-1">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="rfq-contact-person"
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => {
                        setContactPerson(e.target.value);
                        if (fieldErrors.contactPerson) setFieldErrors((prev) => ({ ...prev, contactPerson: '' }));
                      }}
                      placeholder="e.g. Ramesh Kumar"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white transition-all ${
                        fieldErrors.contactPerson ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#004b87]'
                      }`}
                    />
                  </div>
                  {fieldErrors.contactPerson && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.contactPerson}</p>
                  )}
                </div>

                {/* Business Email */}
                <div>
                  <label htmlFor="rfq-email" className="block text-xs font-semibold text-slate-800 mb-1">
                    Business Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="rfq-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="purchase@yourcompany.com"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white transition-all ${
                        fieldErrors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#004b87]'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Mobile Phone */}
                <div>
                  <label htmlFor="rfq-phone" className="block text-xs font-semibold text-slate-800 mb-1">
                    Mobile Phone (10 digits) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="rfq-phone"
                      type="tel"
                      required
                      maxLength={14}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder="9840123456"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white transition-all ${
                        fieldErrors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#004b87]'
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Delivery PIN Code */}
                <div>
                  <label htmlFor="rfq-pincode" className="block text-xs font-semibold text-slate-800 mb-1">
                    Delivery PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="rfq-pincode"
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        setPincode(e.target.value);
                        if (fieldErrors.pincode) setFieldErrors((prev) => ({ ...prev, pincode: '' }));
                      }}
                      placeholder="600001"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white transition-all ${
                        fieldErrors.pincode ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#004b87]'
                      }`}
                    />
                  </div>
                  {fieldErrors.pincode && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.pincode}</p>
                  )}
                </div>

                {/* GSTIN (Optional) */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="rfq-gstin" className="block text-xs font-semibold text-slate-800">
                      GSTIN (Optional — for B2B Input Tax Credit)
                    </label>
                    <span className="text-[11px] text-slate-400">15-digit alphanumeric</span>
                  </div>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="rfq-gstin"
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => {
                        setGstin(e.target.value.toUpperCase());
                        if (fieldErrors.gstin) setFieldErrors((prev) => ({ ...prev, gstin: '' }));
                      }}
                      placeholder="e.g. 33AABCO1234F1Z5"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs sm:text-sm text-slate-900 uppercase focus:outline-none focus:bg-white transition-all ${
                        fieldErrors.gstin ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#004b87]'
                      }`}
                    />
                  </div>
                  {fieldErrors.gstin && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.gstin}</p>
                  )}
                </div>

                {/* Delivery Street / Landmark (Optional) */}
                <div className="sm:col-span-2">
                  <label htmlFor="rfq-delivery-address" className="block text-xs font-semibold text-slate-800 mb-1">
                    Delivery Address / Landmark (Optional)
                  </label>
                  <input
                    id="rfq-delivery-address"
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="Floor, building, tech park, or warehouse address"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#004b87]" />
                      <span>Attach Sample Photos or Requirement Lists (Optional)</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Upload photos of existing products, specification sheets, or handwritten item lists.
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    JPG, PNG, WEBP (Max 5MB each, up to {MAX_PHOTOS})
                  </span>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-[#004b87] bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700">
                    Click to select files <span className="font-normal text-slate-500">or drag and drop here</span>
                  </p>
                </div>

                {photoError && (
                  <p className="text-[11px] text-rose-600 font-medium">{photoError}</p>
                )}

                {/* Previews Grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        className="relative bg-white border border-slate-200 rounded-lg overflow-hidden group shadow-2xs"
                      >
                        <div className="relative aspect-video w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.previewUrl} alt={p.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleRemovePhoto(p.id);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="p-1.5 text-[10px] text-slate-600 truncate">{p.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Requirements */}
              <div className="pt-4 border-t border-slate-100">
                <label htmlFor="rfq-additional-notes" className="block text-xs font-semibold text-slate-800 mb-1">
                  Additional Notes / Specific ARC Requirements (Optional)
                </label>
                <textarea
                  id="rfq-additional-notes"
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Monthly delivery schedules, sample requests, brand preferences, or custom branding requirements..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all resize-y"
                />
              </div>

              {/* Step 2 Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Products</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Review &amp; Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: REVIEW & FINAL SUBMIT (Authoritative Zoho CRM save triggers here)  */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Step 3: Review &amp; Confirm Quotation Request
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify your procurement list and business details before final submission to Zoho CRM.
                </p>
              </div>

              {/* Section A: Business Summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#004b87]" />
                    <span>Business &amp; Contact Information</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-semibold text-[#004b87] hover:underline"
                  >
                    Edit Details
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Company / Organization:</span>
                    <span className="font-semibold text-slate-900">{companyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Person:</span>
                    <span className="font-semibold text-slate-900">{contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Business Email:</span>
                    <span className="font-semibold text-slate-900">{email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Phone:</span>
                    <span className="font-semibold text-slate-900">{phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Delivery PIN Code:</span>
                    <span className="font-semibold text-slate-900">{pincode}</span>
                  </div>
                  {gstin && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">GSTIN:</span>
                      <span className="font-semibold text-slate-900 font-mono">{gstin}</span>
                    </div>
                  )}
                  {deliveryLocation && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">Delivery Address:</span>
                      <span className="font-semibold text-slate-900">{deliveryLocation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section B: Line Items Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#004b87]" />
                    <span>Requested Product Items ({items.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-semibold text-[#004b87] hover:underline"
                  >
                    Modify Items
                  </button>
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 rounded bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                          <Image
                            src={getVersionedImageUrl(
                              item.product.images?.[0] || '/assets/placeholder-product.svg'
                            )}
                            alt={item.product.name}
                            fill
                            className="object-contain"
                            sizes="40px"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{item.product.name}</div>
                          <div className="text-[10px] text-slate-400">
                            SKU: {item.product.sku} • Qty: {item.quantity} {item.product.packSize || 'Units'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercial Procurement Note */}
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                <span className="font-semibold text-slate-800 shrink-0">Commercial Note:</span>
                <span>Official volume-tier pricing and formal GST tax invoice breakdown will be provided by our procurement sales desk upon quotation review.</span>
              </div>

              {/* Section D: Attached Photos & Notes */}
              {(photos.length > 0 || additionalNotes) && (
                <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/60 space-y-2 text-xs">
                  {photos.length > 0 && (
                    <div>
                      <span className="text-slate-500 font-semibold block text-[11px] mb-1">
                        Attached Photos ({photos.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {photos.map((p) => (
                          <span
                            key={p.id}
                            className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-700"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {additionalNotes && (
                    <div className="pt-1">
                      <span className="text-slate-500 font-semibold block text-[11px]">Special Instructions:</span>
                      <p className="text-slate-700 text-xs italic mt-0.5">{additionalNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Submission SLA Assurance */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg text-emerald-800 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Official B2B quotation with volume discounts will be registered directly in Zoho CRM and assigned to your dedicated account manager.
                </span>
              </div>

              {/* Step 3 Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit Business Details</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-[#057a3b] hover:bg-[#046330] disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-md active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{submittingStatusText}</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm &amp; Submit RFQ</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
