'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Save,
  Eye,
  Printer,
  Edit3,
  CheckCircle2,
  Send,
  Lock,
  Unlock,
  Clock,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Calculator,
  History,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Quotation, NotificationLog } from '@/types';
import {
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_TERMS_AND_CONDITIONS,
} from '@/lib/zoho/quotes';

interface EditableLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  hsnCode?: string;
  packSize?: string;
  originalQuantity: number;
  originalUnitPrice: number;
  quantity: number;
  unitPrice: number;
  gstPercent: number;
}

interface AdminQuotationEditorProps {
  quotation: Quotation;
  onClose: () => void;
  onQuotationUpdated: (updated: Quotation, updatedLogs?: NotificationLog[]) => void;
}

function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export default function AdminQuotationEditor({
  quotation,
  onClose,
  onQuotationUpdated,
}: AdminQuotationEditorProps) {
  // Determine whether the form is locked (when already approved or sent) until Admin clicks "Edit Quotation"
  const isInitiallyLocked =
    quotation.status === 'approved' ||
    quotation.status === 'sent_to_customer' ||
    quotation.status === 'accepted';

  const [isEditMode, setIsEditMode] = useState<boolean>(!isInitiallyLocked);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState<boolean>(false);

  // Map original immutable RFQ items
  const immutableOriginalItems = useMemo(() => {
    if (quotation.originalItems && quotation.originalItems.length > 0) {
      return quotation.originalItems;
    }
    return quotation.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.productName,
      sku: it.sku,
      hsnCode: it.hsnCode,
      packSize: it.packSize,
      originalQuantity: Number(it.originalQuantity ?? it.quantity) || 1,
      indicativeUnitPrice: Number(it.originalUnitPrice ?? it.indicativeUnitPrice) || 0,
      gstPercent: Number(it.gstPercent) || 18,
      indicativeTotalPrice: Number(it.indicativeTotalPrice) || 0,
    }));
  }, [quotation]);

  // Initialize editable line items
  const [lineItems, setLineItems] = useState<EditableLineItem[]>(() =>
    quotation.items.map((it, idx) => {
      const orig =
        immutableOriginalItems.find((o) => o.sku === it.sku || o.productId === it.productId) ||
        immutableOriginalItems[idx];
      return {
        id: it.id || `item-${idx}`,
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        hsnCode: it.hsnCode,
        packSize: it.packSize || 'Standard Pack',
        originalQuantity: orig ? orig.originalQuantity : Number(it.originalQuantity ?? it.quantity) || 1,
        originalUnitPrice: orig ? orig.indicativeUnitPrice : Number(it.originalUnitPrice ?? it.indicativeUnitPrice) || 0,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.indicativeUnitPrice) || 0,
        gstPercent: Number(it.gstPercent) || 18,
      };
    })
  );

  // Commercial form fields
  const [discountPercent, setDiscountPercent] = useState<number>(quotation.discountPercent ?? 0);
  const [discountMode, setDiscountMode] = useState<'percent' | 'amount'>('percent');
  const [discountAmountInput, setDiscountAmountInput] = useState<number>(
    quotation.discountAmount ?? 0
  );
  const [gstPercent, setGstPercent] = useState<number>(quotation.gstPercent ?? 18);
  const [deliveryCharges, setDeliveryCharges] = useState<number>(
    quotation.deliveryCharges ?? 0
  );
  const [additionalCharges, setAdditionalCharges] = useState<number>(
    quotation.additionalCharges ?? 0
  );
  const [validUntil, setValidUntil] = useState<string>(
    quotation.validUntil ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    quotation.paymentTerms || DEFAULT_PAYMENT_TERMS
  );
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    quotation.termsAndConditions || DEFAULT_TERMS_AND_CONDITIONS
  );
  const [assignedTo, setAssignedTo] = useState<string>(quotation.assignedTo || '');
  const [internalNotes, setInternalNotes] = useState<string>(quotation.internalNotes || '');

  // Action feedback states
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Automatic Real-Time Calculations
  const calculations = useMemo(() => {
    const computedItems = lineItems.map((it) => {
      const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
      const price = Math.max(0, round2(Number(it.unitPrice) || 0));
      const itemTotal = round2(qty * price);
      return {
        ...it,
        quantity: qty,
        unitPrice: price,
        itemTotal,
      };
    });

    const subtotal = round2(computedItems.reduce((sum, it) => sum + it.itemTotal, 0));

    let effectiveDiscountAmount = 0;
    let effectiveDiscountPercent = 0;

    if (discountMode === 'percent') {
      effectiveDiscountPercent = Math.max(0, Math.min(100, Number(discountPercent) || 0));
      effectiveDiscountAmount = round2((subtotal * effectiveDiscountPercent) / 100);
    } else {
      effectiveDiscountAmount = Math.max(0, Math.min(subtotal, round2(Number(discountAmountInput) || 0)));
      effectiveDiscountPercent = subtotal > 0 ? round2((effectiveDiscountAmount / subtotal) * 100) : 0;
    }

    const taxableAmount = round2(Math.max(0, subtotal - effectiveDiscountAmount));
    const effectiveGstPercent = Math.max(0, Math.min(100, Number(gstPercent) || 0));
    const gstAmount = round2((taxableAmount * effectiveGstPercent) / 100);
    const effectiveDelivery = Math.max(0, round2(Number(deliveryCharges) || 0));
    const effectiveAdditional = Math.max(0, round2(Number(additionalCharges) || 0));
    const totalAdditionalCharges = round2(effectiveDelivery + effectiveAdditional);
    const grandTotal = round2(taxableAmount + gstAmount + totalAdditionalCharges);

    return {
      computedItems,
      subtotal,
      effectiveDiscountPercent,
      effectiveDiscountAmount,
      taxableAmount,
      effectiveGstPercent,
      gstAmount,
      effectiveDelivery,
      effectiveAdditional,
      totalAdditionalCharges,
      grandTotal,
    };
  }, [
    lineItems,
    discountMode,
    discountPercent,
    discountAmountInput,
    gstPercent,
    deliveryCharges,
    additionalCharges,
  ]);

  const handleItemChange = (
    idx: number,
    field: 'quantity' | 'unitPrice',
    value: string
  ) => {
    const num = Number(value);
    setLineItems((prev) => {
      const next = [...prev];
      if (field === 'quantity') {
        next[idx] = { ...next[idx], quantity: isNaN(num) ? 1 : Math.max(1, Math.floor(num)) };
      } else {
        next[idx] = { ...next[idx], unitPrice: isNaN(num) ? 0 : Math.max(0, num) };
      }
      return next;
    });
  };

  const executeQuotationAction = async (
    action: 'save_draft' | 'edit_quotation' | 'approve' | 'send_to_customer'
  ) => {
    setActiveAction(action);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/quotations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: quotation.id,
          action,
          items: calculations.computedItems.map((it) => ({
            id: it.id,
            productId: it.productId,
            productName: it.productName,
            sku: it.sku,
            hsnCode: it.hsnCode,
            packSize: it.packSize,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            gstPercent: calculations.effectiveGstPercent,
          })),
          discountPercent: calculations.effectiveDiscountPercent,
          discountAmount: calculations.effectiveDiscountAmount,
          gstPercent: calculations.effectiveGstPercent,
          deliveryCharges: calculations.effectiveDelivery,
          additionalCharges: calculations.effectiveAdditional,
          validUntil,
          paymentTerms,
          termsAndConditions,
          assignedTo,
          internalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update quotation in Zoho CRM.');
      }

      onQuotationUpdated(data.quotation, data.notificationLogs);

      if (action === 'approve' || action === 'send_to_customer') {
        setIsEditMode(false);
      } else if (action === 'edit_quotation' || action === 'save_draft') {
        setIsEditMode(true);
      }

      setFeedback({
        type: 'success',
        message: data.message || 'Quotation saved in Zoho CRM.',
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handleUnlockForEdit = () => {
    setIsEditMode(true);
    setFeedback({
      type: 'info',
      message:
        'Editor unlocked! Make your price or quantity revisions and click "Save Draft" or "Approve Quotation" to record a new version in Zoho CRM.',
    });
  };

  const isApproved = quotation.status === 'approved';
  const isSent = quotation.status === 'sent_to_customer' || quotation.status === 'accepted';
  const canSendToCustomer = (isApproved || isSent) && !isEditMode;

  const pdfPreviewUrl = `/api/admin/quotations/${encodeURIComponent(quotation.quotationNumber)}/pdf`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base font-bold tracking-tight">
                  Admin Quotation Editor:{' '}
                  <span className="font-mono text-red-400">{quotation.quotationNumber}</span>
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    quotation.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : quotation.status === 'sent_to_customer'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : quotation.status === 'quotation_prepared'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {quotation.status === 'new' || quotation.status === 'under_review'
                    ? 'Pending RFQ'
                    : quotation.status === 'quotation_prepared'
                    ? 'Draft Quotation'
                    : quotation.status === 'approved'
                    ? 'Approved Quotation'
                    : quotation.status === 'sent_to_customer'
                    ? 'Sent to Customer'
                    : quotation.status.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                  Rev v{quotation.version || 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Zoho CRM Quote ID: <span className="font-mono text-slate-300">{quotation.zohoQuoteId || quotation.id}</span> &bull; Submitted{' '}
                {new Date(quotation.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPdfPreviewModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-700"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Preview PDF</span>
            </button>
            <a
              href={`${pdfPreviewUrl}?print=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print / Download PDF</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-bold"
              title="Close Editor"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1 bg-slate-50/50">
          {/* Status / Action Feedback Banner */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                feedback.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : feedback.type === 'info'
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="font-semibold leading-relaxed">{feedback.message}</div>
            </div>
          )}

          {/* SECTION 1: CUSTOMER & ORIGINAL RFQ DETAILS (IMMUTABLE SNAPSHOT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Customer & Company Details Card */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-900" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Customer &amp; Company Information
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Original RFQ: {quotation.quotationNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex items-start space-x-2.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Company Name
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {quotation.companyName}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Contact Person
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {quotation.customerName}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Customer Email (Quotation Recipient)
                    </span>
                    <a
                      href={`mailto:${quotation.email}`}
                      className="font-semibold text-blue-900 hover:underline break-all"
                    >
                      {quotation.email || 'Not Provided'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Phone &amp; Preferred Contact
                    </span>
                    <span className="font-semibold text-slate-900">
                      {quotation.phone || 'N/A'}{' '}
                      <span className="text-[10px] uppercase px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 ml-1">
                        {quotation.preferredContactMethod}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Customer GSTIN
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {quotation.gstin || 'Not Provided'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Delivery Location &amp; PIN
                    </span>
                    <span className="text-slate-800 font-medium">
                      {quotation.deliveryLocation ? `${quotation.deliveryLocation}, ` : ''}
                      <strong>PIN: {quotation.pincode}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {quotation.additionalRequirements && (
                <div className="mt-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Customer Submitted Message / Special Instructions:
                  </span>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap">
                    {quotation.additionalRequirements}
                  </div>
                </div>
              )}
            </div>

            {/* Original Customer RFQ Snapshot (Read-Only Immutable Record) */}
            <div className="lg:col-span-5 bg-amber-50/50 rounded-2xl p-5 border border-amber-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-amber-200/70 pb-2.5 mb-3">
                  <div className="flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Original Customer RFQ (Preserved)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                    Read-Only
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mb-3">
                  These are the exact products and quantities originally requested by the customer. Editing the quotation below will never overwrite this original RFQ record.
                </p>

                <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-amber-100/60 text-amber-950 font-bold uppercase text-[9.5px]">
                      <tr>
                        <th className="py-2 px-2.5">Product &amp; SKU</th>
                        <th className="py-2 px-2.5 text-center">Pack</th>
                        <th className="py-2 px-2.5 text-right">Orig Req Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {immutableOriginalItems.map((orig, i) => (
                        <tr key={orig.id || i}>
                          <td className="py-2 px-2.5">
                            <div className="font-bold text-slate-900">{orig.productName}</div>
                            <div className="font-mono text-[10px] text-slate-500">{orig.sku}</div>
                          </td>
                          <td className="py-2 px-2.5 text-center text-slate-600">
                            {orig.packSize || 'Standard'}
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-amber-900 font-mono">
                            {orig.originalQuantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-900">
                <span>Original RFQ Reference:</span>
                <span className="font-mono font-bold">{quotation.quotationNumber}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: EDITABLE QUOTATION LINE ITEMS TABLE */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Editable Quotation Line Items &amp; Pricing ({lineItems.length} Products)
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                {!isEditMode ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                    <Lock className="w-3 h-3" />
                    <span>Locked ({quotation.status.replace(/_/g, ' ').toUpperCase()})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold">
                    <Unlock className="w-3 h-3" />
                    <span>Editing Active</span>
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3">Product Description &amp; SKU</th>
                    <th className="py-3 px-3 text-center">Pack Size</th>
                    <th className="py-3 px-3 text-center bg-amber-950/50">
                      Customer Orig Qty
                    </th>
                    <th className="py-3 px-3 text-center w-32">Editable Quantity</th>
                    <th className="py-3 px-3 text-right w-40">Editable Unit Price (₹)</th>
                    <th className="py-3 px-3 text-right w-36">Item Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {calculations.computedItems.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-xs">{it.productName}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          SKU: {it.sku}
                          {it.hsnCode ? ` • HSN: ${it.hsnCode}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {it.packSize || 'Standard'}
                      </td>
                      <td className="py-3 px-3 text-center bg-amber-50/60 font-mono font-bold text-amber-900">
                        {it.originalQuantity}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          disabled={!isEditMode}
                          value={lineItems[idx]?.quantity ?? it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-24 px-2.5 py-1.5 text-center font-bold text-slate-900 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="relative inline-flex items-center">
                          <span className="absolute left-2.5 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            disabled={!isEditMode}
                            value={lineItems[idx]?.unitPrice ?? it.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            className="w-32 pl-6 pr-2.5 py-1.5 text-right font-bold text-slate-900 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono text-sm">
                        ₹
                        {it.itemTotal.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Commercial Adjustments, Taxes, Charges & Terms Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3">
              {/* Left 7 Cols: Validity Date, Payment Terms, Terms & Conditions, Assignee, Internal Notes */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Quotation Validity Date *
                    </label>
                    <input
                      type="date"
                      disabled={!isEditMode}
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Assigned Sales Manager / Rep
                    </label>
                    <input
                      type="text"
                      disabled={!isEditMode}
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      placeholder="e.g. Office Bazzar Corporate Sales"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Payment Terms *
                  </label>
                  <input
                    type="text"
                    disabled={!isEditMode}
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. 100% Advance against Proforma Invoice / Net 15 Days"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 font-medium disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Terms and Conditions (Printed on Customer PDF)
                  </label>
                  <textarea
                    rows={4}
                    disabled={!isEditMode}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 leading-relaxed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <label className="block font-bold text-slate-700">
                      Internal Admin Notes{' '}
                      <span className="text-[10px] text-amber-700 font-semibold">
                        (Saved in Zoho CRM • Hidden from Customer PDF)
                      </span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    disabled={!isEditMode}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Internal pricing margin notes, supplier stock confirmation, or dispatch remarks..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-amber-50/40 text-slate-900 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Right 5 Cols: Automatic Calculation & Commercial Adjustments Box */}
              <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Quotation Pricing Breakdown
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Auto-Calculated (INR)
                    </span>
                  </div>

                  {/* Subtotal */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Subtotal ({lineItems.length} Items):</span>
                    <span className="font-mono font-bold text-sm text-white">
                      ₹
                      {calculations.subtotal.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Discount Input */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-300">Discount:</span>
                      <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                        <button
                          type="button"
                          disabled={!isEditMode}
                          onClick={() => setDiscountMode('percent')}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            discountMode === 'percent'
                              ? 'bg-red-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          disabled={!isEditMode}
                          onClick={() => setDiscountMode('amount')}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            discountMode === 'amount'
                              ? 'bg-red-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          ₹
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {discountMode === 'percent' ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          disabled={!isEditMode}
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-right font-bold bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-60"
                        />
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step="1"
                          disabled={!isEditMode}
                          value={discountAmountInput}
                          onChange={(e) => setDiscountAmountInput(Number(e.target.value))}
                          className="w-24 px-2 py-1 text-right font-bold bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-60"
                        />
                      )}
                      <span className="font-mono font-bold text-emerald-400 w-24 text-right">
                        -₹
                        {calculations.effectiveDiscountAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Taxable Subtotal */}
                  <div className="flex items-center justify-between text-xs border-t border-slate-800 pt-2">
                    <span className="text-slate-400">Taxable Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      ₹
                      {calculations.taxableAmount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* GST Percentage */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-300">GST Percentage (%):</span>
                    <div className="flex items-center space-x-2">
                      <select
                        disabled={!isEditMode}
                        value={gstPercent}
                        onChange={(e) => setGstPercent(Number(e.target.value))}
                        className="w-20 px-2 py-1 font-bold bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-60"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                      <span className="font-mono font-bold text-white w-24 text-right">
                        +₹
                        {calculations.gstAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Delivery & Transport Charges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-300">Delivery &amp; Transport (₹):</span>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      disabled={!isEditMode}
                      value={deliveryCharges}
                      onChange={(e) => setDeliveryCharges(Number(e.target.value))}
                      className="w-28 px-2.5 py-1 text-right font-bold bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-60"
                    />
                  </div>

                  {/* Additional Charges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-300">Additional Charges (₹):</span>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      disabled={!isEditMode}
                      value={additionalCharges}
                      onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                      className="w-28 px-2.5 py-1 text-right font-bold bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Grand Total Footer */}
                <div className="pt-4 border-t-2 border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400 block">
                      Final Grand Total
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Incl. {calculations.effectiveGstPercent}% GST &amp; Charges
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-white">
                    ₹
                    {calculations.grandTotal.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: VERSION & PRICE CHANGE AUDIT HISTORY */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Zoho CRM Quotation Version &amp; Price Audit History (
                  {quotation.auditHistory?.length || 1} Versions)
                </h3>
              </div>
              {quotation.approvedAt && (
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Approved by {quotation.approvedBy || 'Admin'} on{' '}
                  {new Date(quotation.approvedAt).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(quotation.auditHistory && quotation.auditHistory.length > 0
                ? [...quotation.auditHistory].reverse()
                : [
                    {
                      version: 1,
                      timestamp: quotation.createdAt,
                      action: 'rfq_submitted' as const,
                      actor: `${quotation.customerName} (${quotation.email})`,
                      summary: 'Initial Customer RFQ submitted and saved in Zoho CRM.',
                      grandTotal: quotation.indicativeTotal,
                    },
                  ]
              ).map((entry, i) => (
                <div
                  key={`${entry.version}-${i}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[10px]">
                        v{entry.version}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[9.5px] ${
                          entry.action === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : entry.action === 'sent_to_customer'
                            ? 'bg-blue-100 text-blue-800'
                            : entry.action === 'rfq_submitted'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {entry.action.replace(/_/g, ' ')}
                      </span>
                      <span className="font-semibold text-slate-700">{entry.actor}</span>
                    </div>
                    <p className="text-slate-600">{entry.summary}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-900">
                      ₹{Number(entry.grandTotal || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-end space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(entry.timestamp).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <a
              href={`/quotation-success/${encodeURIComponent(quotation.quotationNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-blue-900"
            >
              <span>Customer RFQ Receipt</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Save Draft */}
            <button
              type="button"
              disabled={!isEditMode || activeAction !== null}
              onClick={() => executeQuotationAction('save_draft')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-900 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-300"
            >
              <Save className="w-4 h-4 text-slate-700" />
              <span>{activeAction === 'save_draft' ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>

            {/* 2. Preview PDF */}
            <button
              type="button"
              onClick={() => setShowPdfPreviewModal(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-300"
            >
              <Eye className="w-4 h-4 text-blue-700" />
              <span>Preview PDF</span>
            </button>

            {/* 3. Edit Quotation (unlocks when Approved/Sent, or saves revision when editing) */}
            {!isEditMode ? (
              <button
                type="button"
                disabled={activeAction !== null}
                onClick={handleUnlockForEdit}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Quotation</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={activeAction !== null}
                onClick={() => executeQuotationAction('edit_quotation')}
                className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors border border-blue-200"
              >
                <Edit3 className="w-4 h-4 text-blue-700" />
                <span>
                  {activeAction === 'edit_quotation' ? 'Updating...' : 'Edit Quotation (Save Revision)'}
                </span>
              </button>
            )}

            {/* 4. Approve Quotation */}
            <button
              type="button"
              disabled={activeAction !== null || (isApproved && !isEditMode)}
              onClick={() => executeQuotationAction('approve')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {activeAction === 'approve'
                  ? 'Approving...'
                  : isApproved && !isEditMode
                  ? 'Approved ✓'
                  : 'Approve Quotation'}
              </span>
            </button>

            {/* 5. Send Final Quotation to Customer (Only enabled after Admin approves) */}
            <button
              type="button"
              disabled={!canSendToCustomer || activeAction !== null}
              onClick={() => executeQuotationAction('send_to_customer')}
              title={
                !canSendToCustomer
                  ? 'Approve the quotation first to enable sending to customer'
                  : `Send Final Quotation PDF & Email to ${quotation.email}`
              }
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>
                {activeAction === 'send_to_customer'
                  ? 'Sending via Zoho CRM...'
                  : isSent && !isEditMode
                  ? 'Resend Final Quotation to Customer'
                  : 'Send Final Quotation to Customer'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded PDF Preview Modal */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold">
                  Office Bazzar Branded PDF Preview — {quotation.quotationNumber} (v{quotation.version || 1})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={`${pdfPreviewUrl}?print=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Open &amp; Download PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Close Preview ✕
                </button>
              </div>
            </div>
            <iframe
              src={pdfPreviewUrl}
              title={`Quotation PDF Preview ${quotation.quotationNumber}`}
              className="w-full flex-1 border-0 bg-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}

