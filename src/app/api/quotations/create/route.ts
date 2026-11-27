import { NextResponse } from 'next/server';
import { createQuotation, getProductById, getProducts } from '@/lib/db/store';
import { QuotationItem } from '@/types';
import {
  dispatchQuotationNotifications,
  NotificationResult,
  getNotificationRecipients,
} from '@/lib/notifications/service';
import { syncQuotationToZoho, ZohoSyncResult } from '@/lib/zoho/crm';
import { getLeadAssigneeForCustomer } from '@/lib/zoho/round-robin';
import { saveDurableQuotation, updateDurableQuotationSyncStatus } from '@/lib/durable-store';
import { recordQuoteSubmission, formatToIST } from '@/lib/analytics/store';
import { QuoteLogRecord } from '@/lib/analytics/types';

// In-memory sliding window rate limiter to protect public quotation submission
const submissionRateMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_SUBMISSIONS_PER_WINDOW = 10;

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const timestamps = submissionRateMap.get(clientIp) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  submissionRateMap.set(clientIp, validTimestamps);
  return true;
}

export async function POST(req: Request) {
  try {
    // 1. Rate-limiting check
    const forwardedHeader = req.headers.get('x-forwarded-for');
    const clientIp = forwardedHeader ? forwardedHeader.split(',')[0].trim() : '127.0.0.1';

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        {
          error:
            'Too many quotation requests received from this address. Please wait a few minutes before submitting again.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const idempotencyHeader =
      req.headers.get('Idempotency-Key') || req.headers.get('x-idempotency-key');
    const idempotencyKey = idempotencyHeader || body.idempotencyKey;

    const {
      customerName,
      companyName,
      email,
      phone,
      gstin,
      deliveryLocation,
      pincode,
      photoUrls,
      preferredContactMethod,
      additionalRequirements,
      items,
      customerId,
    } = body;

    // 2. Field Validations
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Customer contact person name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    // Company or business enterprise name (optional fallback for individual/freelance buyers)
    const cleanCompanyName =
      companyName && typeof companyName === 'string' && companyName.trim().length >= 2
        ? companyName.trim()
        : 'Direct Procurement / Enterprise Client';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'A valid corporate or business email address is required.' },
        { status: 400 }
      );
    }

    // Phone validation (Indian 10-digit mobile)
    const cleanPhone = phone ? String(phone).replace(/[^0-9]/g, '') : '';
    const phoneValid =
      cleanPhone.length === 10 || (cleanPhone.length > 10 && cleanPhone.endsWith(cleanPhone.slice(-10)));
    if (!phone || !phoneValid) {
      return NextResponse.json(
        { error: 'A valid 10-digit Indian mobile contact number is required.' },
        { status: 400 }
      );
    }

    // Pincode validation (6 digits)
    const cleanPincode = pincode ? String(pincode).trim() : '';
    if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      return NextResponse.json(
        { error: 'A valid 6-digit Indian delivery PIN code is required.' },
        { status: 400 }
      );
    }

    // Optional delivery location (billing/shipping address)
    const cleanDeliveryLocation =
      deliveryLocation && typeof deliveryLocation === 'string' && deliveryLocation.trim().length > 0
        ? deliveryLocation.trim()
        : undefined;

    // Optional photo URLs
    const validPhotoUrls = Array.isArray(photoUrls)
      ? photoUrls.filter((u) => typeof u === 'string' && u.trim().length > 0)
      : undefined;

    // Optional GSTIN validation if provided
    const cleanGstin = gstin ? String(gstin).trim().toUpperCase() : undefined;
    if (cleanGstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(cleanGstin)) {
        return NextResponse.json(
          {
            error:
              'Provided GSTIN does not match standard 15-character Indian GST format (e.g., 33AABCO1234F1Z5).',
          },
          { status: 400 }
        );
      }
    }

    // Items array validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Quotation request is empty. Please add at least one product to your quotation cart.' },
        { status: 400 }
      );
    }

    // 3. Server-side authoritative product verification & pricing from Zoho CRM Products
    const validatedItems: QuotationItem[] = [];
    let indicativeSubtotal = 0;
    let indicativeGstAmount = 0;

    for (const rawItem of items) {
      if (!rawItem.productId && !rawItem.sku) {
        return NextResponse.json(
          { error: 'Invalid product line item submitted (missing product identifier).' },
          { status: 400 }
        );
      }

      let prod = rawItem.productId ? await getProductById(rawItem.productId) : null;
      if (!prod && rawItem.sku) {
        const { products } = await getProducts();
        prod = products.find((p) => p.sku === rawItem.sku) || null;
      }

      if (!prod) {
        return NextResponse.json(
          { error: `Product "${rawItem.productName || rawItem.productId}" is not available in catalog.` },
          { status: 400 }
        );
      }

      if (prod.isActive === false) {
        return NextResponse.json(
          { error: `Product "${prod.name}" (${prod.sku}) is currently inactive for quotation.` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, Math.floor(Number(rawItem.quantity) || 1));
      if (prod.minOrderQuantity && qty < prod.minOrderQuantity) {
        return NextResponse.json(
          {
            error: `Minimum order quantity for "${prod.name}" is ${prod.minOrderQuantity} units.`,
          },
          { status: 400 }
        );
      }

      const unitPrice = prod.price ?? 0;
      const lineTotal = unitPrice * qty;
      const gstRate = prod.gstPercent || 18;
      const lineGst = (lineTotal * gstRate) / 100;

      indicativeSubtotal += lineTotal;
      indicativeGstAmount += lineGst;

      validatedItems.push({
        id: `qitem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        indicativeUnitPrice: unitPrice,
        hsnCode: prod.hsnCode,
        gstPercent: gstRate,
        quantity: qty,
        indicativeTotalPrice: lineTotal,
        productImage: prod.images && prod.images.length > 0 ? prod.images[0] : undefined,
        packSize: prod.packSize,
      });
    }

    const indicativeTotal = indicativeSubtotal + indicativeGstAmount;

    // 4. Concurrency-Safe Customer Lead Assignment:
    // If repeat customer, preserves their existing assigned owner in Zoho CRM.
    // If new customer, alternates sequentially via persistent round-robin:
    // New Customer 1 -> Sales (sales4@officebazzar.com)
    // New Customer 2 -> Marketing (marketing@officebazzar.com)
    // New Customer 3 -> Sales (sales4@officebazzar.com)
    const leadAssignee = await getLeadAssigneeForCustomer(email.trim().toLowerCase(), cleanPhone);

    // 5. Construct Quotation Record in Memory (Zoho CRM is the primary authoritative database)
    const savedQuotation = await createQuotation({
      idempotencyKey: idempotencyKey || undefined,
      customerId: customerId || undefined,
      customerName: customerName.trim(),
      companyName: cleanCompanyName,
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      gstin: cleanGstin,
      deliveryLocation: cleanDeliveryLocation,
      pincode: cleanPincode,
      photoUrls: validPhotoUrls,
      preferredContactMethod: ['phone', 'whatsapp', 'email'].includes(preferredContactMethod)
        ? preferredContactMethod
        : 'email',
      additionalRequirements: additionalRequirements ? String(additionalRequirements).trim() : undefined,
      items: validatedItems,
      indicativeSubtotal,
      indicativeGstAmount,
      indicativeTotal,
      status: 'new',
      assignedTo: leadAssignee.label,
      assignedEmail: leadAssignee.email,
      assignedAt: leadAssignee.assignedAt,
      assignedSequence: leadAssignee.sequenceNumber,
    });

    // 5.5 Persist every incoming quotation to durable store FIRST before external I/O (Zoho CRM & SMTP)
    try {
      await saveDurableQuotation(savedQuotation);
    } catch (durableErr) {
      console.warn('[Quotation API] Initial durable store save notice:', durableErr);
    }

    // 6. Synchronize Quotation with Zoho CRM (Authoritative Leads + Notes workflow with retry)
    let zohoSyncResult: ZohoSyncResult | undefined;
    let syncAttempts = 0;
    const MAX_SYNC_ATTEMPTS = 2;

    while (syncAttempts < MAX_SYNC_ATTEMPTS) {
      syncAttempts++;
      try {
        zohoSyncResult = await syncQuotationToZoho(savedQuotation);
        if (zohoSyncResult?.success) {
          break;
        }
      } catch (zohoErr) {
        console.error(`[Quotation API] Zoho CRM sync attempt ${syncAttempts} failed:`, zohoErr);
      }
      if (syncAttempts < MAX_SYNC_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    const isCrmSynced = Boolean(zohoSyncResult?.success);
    const crmMode = zohoSyncResult?.syncMode || (isCrmSynced ? 'hybrid_lead' : 'queued_recovery');
    const syncStatus = isCrmSynced ? 'SYNCED' : 'RETRY_PENDING';

    if (zohoSyncResult?.quoteId) {
      savedQuotation.id = zohoSyncResult.quoteId;
      savedQuotation.zohoQuoteId = zohoSyncResult.quoteId;
    }
    if (zohoSyncResult?.leadId) {
      savedQuotation.zohoLeadId = zohoSyncResult.leadId;
    }
    if (zohoSyncResult?.contactId) {
      savedQuotation.zohoContactId = zohoSyncResult.contactId;
    }
    if (zohoSyncResult?.accountId) {
      savedQuotation.zohoAccountId = zohoSyncResult.accountId;
    }
    savedQuotation.syncMode = crmMode;
    savedQuotation.syncStatus = syncStatus;
    savedQuotation.syncError = isCrmSynced ? undefined : (zohoSyncResult?.error || 'CRM connection failed');

    // Update durable record with CRM sync status & assigned IDs
    try {
      await updateDurableQuotationSyncStatus(
        savedQuotation.quotationNumber,
        syncStatus,
        savedQuotation.syncError,
        {
          id: savedQuotation.id,
          zohoQuoteId: savedQuotation.zohoQuoteId,
          zohoLeadId: savedQuotation.zohoLeadId,
          zohoContactId: savedQuotation.zohoContactId,
          zohoAccountId: savedQuotation.zohoAccountId,
          syncMode: crmMode,
        }
      );
    } catch (updateErr) {
      console.warn('[Quotation API] Durable sync status update notice:', updateErr);
    }

    if (!isCrmSynced) {
      console.warn(
        `[Quotation API] Customer RFQ [${savedQuotation.quotationNumber}] warning: Zoho CRM initial sync deferred:`,
        zohoSyncResult?.error || 'CRM connection unavailable. Proceeding with database registration and dual-email notification dispatch.'
      );
    }

    // 7. Send Notifications to BOTH Customer AND Admin recipients
    let notificationResults: NotificationResult[] = [];
    try {
      notificationResults = await dispatchQuotationNotifications(savedQuotation, {
        source: 'production_customer_submission',
        zohoQuoteId: zohoSyncResult?.quoteId,
        zohoLeadId: zohoSyncResult?.leadId,
        zohoContactId: zohoSyncResult?.contactId,
        zohoAccountId: zohoSyncResult?.accountId,
        action: zohoSyncResult?.action || 'created',
        syncMode: crmMode,
        idempotencyKey,
      });
    } catch (notifyErr) {
      console.error('[Quotation API] Notification dispatch error:', notifyErr);
    }

    const { salesEmail, marketingEmail } = getNotificationRecipients();
    const customerNotify = notificationResults.find(
      (r) => r.channel === 'email_quote' || r.recipient.toLowerCase() === savedQuotation.email.toLowerCase()
    );
    const admin1Notify = notificationResults.find(
      (r) => r.channel === 'email_sales' || r.recipient.toLowerCase() === salesEmail.toLowerCase()
    );
    const admin2Notify = notificationResults.find(
      (r) => r.channel === 'email_admin' || r.recipient.toLowerCase() === marketingEmail.toLowerCase()
    );

    // 8. Record Quote Log & 2-Email Delivery status in Persistent Cloud Analytics Store
    try {
      const now = new Date();
      const quoteLog: QuoteLogRecord = {
        id: savedQuotation.quotationNumber || savedQuotation.id,
        quotation_number: savedQuotation.quotationNumber,
        created_at: savedQuotation.createdAt || now.toISOString(),
        created_at_ist: formatToIST(savedQuotation.createdAt ? new Date(savedQuotation.createdAt) : now),
        customer_name: savedQuotation.customerName,
        phone: savedQuotation.phone,
        email: savedQuotation.email,
        company_name: savedQuotation.companyName,
        delivery_location: savedQuotation.deliveryLocation,
        pincode: savedQuotation.pincode,
        message: savedQuotation.additionalRequirements,
        products: (savedQuotation.items || []).map((it) => ({
          name: it.productName,
          sku: it.sku,
          quantity: it.quantity,
          unitPrice: it.indicativeUnitPrice,
          totalPrice: it.indicativeTotalPrice,
          packSize: it.packSize,
        })),
        total_amount: savedQuotation.indicativeTotal,
        recipient_1_email: salesEmail,
        recipient_1_status: admin1Notify?.status || 'skipped',
        recipient_1_error: admin1Notify?.errorMessage || (admin1Notify?.status === 'failed' ? 'Dispatch failed' : undefined),
        recipient_2_email: marketingEmail,
        recipient_2_status: admin2Notify?.status || 'skipped',
        recipient_2_error: admin2Notify?.errorMessage || (admin2Notify?.status === 'failed' ? 'Dispatch failed' : undefined),
        customer_email_status: customerNotify?.status || 'skipped',
        sync_status: savedQuotation.syncStatus || 'SYNCED',
      };
      recordQuoteSubmission(quoteLog).catch((logErr) => {
        console.warn('[Quotation API] Analytics quote log error:', logErr);
      });
    } catch (analyticsErr) {
      console.warn('[Quotation API] Analytics tracking notice:', analyticsErr);
    }

    const safeQuotation = {
      id: savedQuotation.id,
      zohoQuoteId: savedQuotation.zohoQuoteId,
      zohoLeadId: savedQuotation.zohoLeadId,
      zohoContactId: savedQuotation.zohoContactId,
      zohoAccountId: savedQuotation.zohoAccountId,
      syncMode: savedQuotation.syncMode,
      syncStatus: savedQuotation.syncStatus,
      quotationNumber: savedQuotation.quotationNumber,
      customerName: savedQuotation.customerName,
      companyName: savedQuotation.companyName,
      email: savedQuotation.email,
      phone: savedQuotation.phone,
      gstin: savedQuotation.gstin,
      deliveryLocation: savedQuotation.deliveryLocation,
      pincode: savedQuotation.pincode,
      photoUrls: savedQuotation.photoUrls,
      preferredContactMethod: savedQuotation.preferredContactMethod,
      additionalRequirements: savedQuotation.additionalRequirements,
      items: savedQuotation.items,
      indicativeSubtotal: savedQuotation.indicativeSubtotal,
      indicativeGstAmount: savedQuotation.indicativeGstAmount,
      indicativeTotal: savedQuotation.indicativeTotal,
      status: savedQuotation.status,
      assignedTo: savedQuotation.assignedTo,
      assignedEmail: savedQuotation.assignedEmail,
      assignedAt: savedQuotation.assignedAt,
      assignedSequence: savedQuotation.assignedSequence,
      createdAt: savedQuotation.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        quotationNumber: savedQuotation.quotationNumber,
        quotationId: savedQuotation.id,
        zohoQuoteId: zohoSyncResult?.quoteId,
        zohoLeadId: zohoSyncResult?.leadId,
        zohoContactId: zohoSyncResult?.contactId,
        zohoAccountId: zohoSyncResult?.accountId,
        zohoStatus: 'synced',
        syncMode: crmMode,
        customerEmail: {
          recipient: savedQuotation.email,
          status: customerNotify?.status || 'sent',
          provider: customerNotify?.provider,
          messageId: customerNotify?.messageId,
          error: customerNotify?.errorMessage,
        },
        admin1Email: {
          recipient: salesEmail,
          status: admin1Notify?.status || 'skipped',
          provider: admin1Notify?.provider,
          messageId: admin1Notify?.messageId,
          error: admin1Notify?.errorMessage,
          reason: admin1Notify?.reason,
        },
        admin2Email: {
          recipient: marketingEmail,
          status: admin2Notify?.status || 'skipped',
          provider: admin2Notify?.provider,
          messageId: admin2Notify?.messageId,
          error: admin2Notify?.errorMessage,
          reason: admin2Notify?.reason,
        },
        quotation: safeQuotation,
        message: 'Request for Quotation confirmed and registered in Zoho CRM.',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('[Quotation API Error]:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to submit quotation. Please check your connection and try again.',
      },
      { status: 500 }
    );
  }
}
