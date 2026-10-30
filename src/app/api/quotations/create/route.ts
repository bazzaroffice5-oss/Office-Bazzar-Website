import { NextResponse } from 'next/server';
import { createQuotation, getProductById, getProducts, createNotificationLog } from '@/lib/db/store';
import { QuotationItem } from '@/types';
import { dispatchQuotationNotifications, NotificationResult } from '@/lib/notifications/service';
import { syncQuotationToZoho, ZohoSyncResult } from '@/lib/zoho/crm';

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

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Company or business enterprise name is required.' },
        { status: 400 }
      );
    }

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
    const phoneValid = cleanPhone.length === 10 || (cleanPhone.length > 10 && cleanPhone.endsWith(cleanPhone.slice(-10)));
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

    // Optional delivery location (not mandatory)
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
          { error: 'Provided GSTIN does not match standard 15-character Indian GST format (e.g., 33AABCO1234F1Z5).' },
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

    // 3. Server-side authoritative product verification & pricing
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

      let prod = await getProductById(rawItem.productId);
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

      // Authoritative pricing from catalog
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

    // 4. Save Quotation Persistently (Does NOT decrement stock as per RFQ requirements)
    const savedQuotation = await createQuotation({
      idempotencyKey: idempotencyKey || undefined,
      customerId: customerId || undefined,
      customerName: customerName.trim(),
      companyName: companyName.trim(),
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
    });

    // 5. Synchronous Zoho CRM Registration (Primary Business Database)
    // Business rule: Do not confirm quotation unless successfully saved in Zoho CRM Quotes
    let zohoSyncResult: ZohoSyncResult | undefined;
    try {
      zohoSyncResult = await syncQuotationToZoho(savedQuotation);
    } catch (zohoErr) {
      console.error('[Quotation API] Unexpected error during Zoho CRM synchronization:', zohoErr);
    }

    if (!zohoSyncResult || !zohoSyncResult.success) {
      const crmErrMsg = zohoSyncResult?.error || 'Unable to register formal quotation in Zoho CRM.';
      console.error('[Quotation API] Submission rejected because Zoho CRM sync failed:', crmErrMsg);
      return NextResponse.json(
        {
          success: false,
          error: `Quotation could not be saved to Zoho CRM: ${crmErrMsg}`,
          zohoStatus: 'failed',
          details: zohoSyncResult?.details,
        },
        { status: 502 }
      );
    }

    // 6. Trigger transactional email notifications to both Customer and Sales/Marketing Desk
    let notificationResults: NotificationResult[] = [];
    try {
      notificationResults = await dispatchQuotationNotifications(savedQuotation);
    } catch (notifyErr) {
      console.error('[Quotation API] Notification dispatch error:', notifyErr);
    }

    const customerEmailRes = notificationResults.find((r) => r.recipient === savedQuotation.email);
    const adminEmailRes = notificationResults.find((r) => r.channel === 'email_quote' && r.recipient !== savedQuotation.email);

    const isCustomerEmailSent = customerEmailRes ? customerEmailRes.status === 'sent' : false;
    const isAdminEmailSent = adminEmailRes ? adminEmailRes.status === 'sent' : false;

    // 7. Return safe customer response (Internal notes and staff details excluded)
    const safeQuotation = {
      id: savedQuotation.id,
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
      createdAt: savedQuotation.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        quotationNumber: savedQuotation.quotationNumber,
        quotationId: savedQuotation.id,
        zohoQuoteId: zohoSyncResult.quoteId,
        zohoStatus: 'synced',
        customerEmailStatus: isCustomerEmailSent ? 'accepted' : 'failed',
        customerEmailError: customerEmailRes?.errorMessage,
        adminEmailStatus: isAdminEmailSent ? 'accepted' : 'failed',
        adminEmailError: adminEmailRes?.errorMessage,
        notificationStatus: isCustomerEmailSent && isAdminEmailSent ? 'sent' : 'partial_or_pending',
        quotation: safeQuotation,
        message: 'Request for Quotation confirmed and registered in Zoho CRM.',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('[Quotation API Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit quotation. Please check your connection and try again.' },
      { status: 500 }
    );
  }
}
