/**
 * Server-Side Zoho CRM Quotes Service
 *
 * Implements Zoho CRM as the primary database for Quotations (RFQs):
 * 1. Creates formal Quote records in Zoho CRM Quotes module.
 * 2. Links each Quote to the correct Zoho Contact ID and Account ID.
 * 3. Maps line items to Zoho Product IDs using the 101-catalog mapping.
 * 4. Preserves the customer's original RFQ details & requested quantities immutably.
 * 5. Stores Admin editable quotations (unit prices, quantities, discounts, GST,
 *    delivery/transport charges, additional charges, validity, payment terms, terms & conditions)
 *    and full version/audit history in Zoho CRM Quotes + Zoho Notes.
 * 6. Prevents duplicate Quotes using unique Subject reference checking.
 */

import {
  Quotation,
  QuotationItem,
  QuotationStatus,
  OriginalRFQItem,
  QuotationAuditEntry,
} from '@/types';
import { zohoFetch, isZohoConfigured } from './client';
import { syncCustomerToZohoContact, getCustomerProfileFromZoho } from './contacts';
import productMapping from '../data/zoho_product_mapping.json';

export interface ZohoQuoteSyncResult {
  success: boolean;
  action: 'created' | 'skipped' | 'updated' | 'failed';
  quoteId?: string;
  quoteNumber?: string;
  contactId?: string;
  accountId?: string;
  error?: string;
  details?: unknown;
}

interface ProductMappingEntry {
  zohoId: string;
  name: string;
  sku: string;
  price?: number | null;
}

const typedProductMapping = productMapping as Record<string, ProductMappingEntry>;

const META_START_TAG = '[OB_QUOTE_META_V1]';
const META_END_TAG = '[/OB_QUOTE_META_V1]';

export const DEFAULT_PAYMENT_TERMS =
  '100% Advance against Proforma Invoice or Within 15 Days for Approved Corporate Accounts';

export const DEFAULT_TERMS_AND_CONDITIONS = [
  '1. Prices quoted are in Indian Rupees (INR) and exclusive of GST unless specified in the tax breakdown.',
  '2. Standard delivery within 24–48 business hours across Chennai & Bangalore hubs from order confirmation.',
  '3. Quotation is valid until the specified Validity Date; prices are subject to revision thereafter.',
  '4. Official GST Tax Invoice with HSN codes will be issued upon dispatch for full B2B Input Tax Credit (ITC).',
  '5. Goods once delivered in accordance with approved specifications cannot be returned unless manufacturing defects are reported within 48 hours.',
].join('\n');

export interface ZohoQuoteStructuredMeta {
  schemaVersion: 1;
  quotationNumber: string;
  originalRfq: {
    customerName: string;
    companyName: string;
    email: string;
    phone: string;
    gstin?: string;
    deliveryLocation?: string;
    pincode: string;
    preferredContactMethod: 'phone' | 'whatsapp' | 'email';
    additionalRequirements?: string;
    photoUrls?: string[];
    submittedAt: string;
    indicativeSubtotal: number;
    indicativeGstAmount: number;
    indicativeTotal: number;
    items: OriginalRFQItem[];
  };
  editableQuote: {
    status: QuotationStatus;
    items: QuotationItem[];
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    gstPercent: number;
    gstAmount: number;
    deliveryCharges: number;
    additionalCharges: number;
    grandTotal: number;
    validUntil: string;
    paymentTerms: string;
    termsAndConditions: string;
    assignedTo?: string;
    internalNotes?: string;
    quotationDocumentUrl?: string;
    version: number;
    approvedAt?: string;
    approvedBy?: string;
    sentAt?: string;
    sentBy?: string;
    sentMessageId?: string;
  };
  auditHistory: QuotationAuditEntry[];
}

export interface AdminQuotationUpdateInput {
  action: 'save_draft' | 'edit_quotation' | 'approve' | 'send_to_customer';
  actor: string;
  items?: Array<{
    id?: string;
    productId: string;
    productName: string;
    sku: string;
    hsnCode?: string;
    packSize?: string;
    quantity: number;
    unitPrice: number;
    gstPercent?: number;
    discountPercent?: number;
  }>;
  discountPercent?: number;
  discountAmount?: number;
  gstPercent?: number;
  deliveryCharges?: number;
  additionalCharges?: number;
  validUntil?: string;
  paymentTerms?: string;
  termsAndConditions?: string;
  assignedTo?: string;
  internalNotes?: string;
  quotationDocumentUrl?: string;
  sentMessageId?: string;
}

function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Map Website QuotationStatus to Zoho CRM Quote_Stage
 * Zoho standard picklist: Draft, Negotiation, Delivered, On Hold, Confirmed, Closed Won, Closed Lost
 */
export function mapStatusToZohoStage(status: QuotationStatus): string {
  switch (status) {
    case 'new':
    case 'under_review':
      return 'Draft';
    case 'quotation_prepared':
      return 'Negotiation';
    case 'approved':
      return 'Confirmed';
    case 'sent_to_customer':
      return 'Delivered';
    case 'accepted':
      return 'Closed Won';
    case 'rejected':
    case 'closed':
      return 'Closed Lost';
    default:
      return 'Draft';
  }
}

/**
 * Map Zoho CRM Quote_Stage to Website QuotationStatus (when structured meta is absent)
 */
export function mapZohoStageToStatus(stage?: string): QuotationStatus {
  switch (stage) {
    case 'Draft':
      return 'new';
    case 'Negotiation':
    case 'On Hold':
      return 'quotation_prepared';
    case 'Confirmed':
      return 'approved';
    case 'Delivered':
      return 'sent_to_customer';
    case 'Closed Won':
      return 'accepted';
    case 'Closed Lost':
      return 'rejected';
    default:
      return 'new';
  }
}

/**
 * Find the Zoho CRM Product ID for a quotation line item
 */
function resolveZohoProductId(productId: string, sku?: string): string | null {
  if (typedProductMapping[productId]?.zohoId) {
    return typedProductMapping[productId].zohoId;
  }

  if (sku && typedProductMapping[sku]?.zohoId) {
    return typedProductMapping[sku].zohoId;
  }

  if (sku) {
    for (const entry of Object.values(typedProductMapping)) {
      if (entry.sku === sku && entry.zohoId) {
        return entry.zohoId;
      }
    }
  }

  return null;
}

/**
 * Extract structured metadata JSON from Zoho Quote Description if present
 */
export function extractStructuredMeta(description?: string | null): ZohoQuoteStructuredMeta | null {
  if (!description || typeof description !== 'string') return null;
  const startIdx = description.indexOf(META_START_TAG);
  const endIdx = description.indexOf(META_END_TAG);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;

  const rawJson = description.slice(startIdx + META_START_TAG.length, endIdx).trim();
  try {
    const parsed = JSON.parse(rawJson);
    if (parsed && parsed.schemaVersion === 1 && parsed.originalRfq && parsed.editableQuote) {
      return parsed as ZohoQuoteStructuredMeta;
    }
  } catch {
    // Ignore malformed metadata block
  }
  return null;
}

/**
 * Parse legacy plain-text Zoho Quote Description lines for customer contact details
 */
function parseLegacyDescriptionFields(description?: string | null): {
  quotationNumber?: string;
  submittedAt?: string;
  customerName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  deliveryLocation?: string;
  pincode?: string;
  preferredContactMethod?: 'phone' | 'whatsapp' | 'email';
  additionalRequirements?: string;
} {
  if (!description || typeof description !== 'string') return {};
  const cleanText = description.split(META_START_TAG)[0] || description;

  const getLineValue = (prefix: string): string | undefined => {
    const regex = new RegExp(`^${prefix}:\\s*(.+)$`, 'mi');
    const m = cleanText.match(regex);
    return m?.[1]?.trim();
  };

  const reqMatch = cleanText.match(
    /Special Requirements \/ Instructions:\r?\n([\s\S]*?)(?:\r?\n={10,}|$)/i
  );

  const prefRaw = getLineValue('Preferred Contact Method')?.toLowerCase();
  const preferredContactMethod: 'phone' | 'whatsapp' | 'email' | undefined =
    prefRaw === 'phone' || prefRaw === 'whatsapp' || prefRaw === 'email' ? prefRaw : undefined;

  const companyVal = getLineValue('Company');

  return {
    quotationNumber: getLineValue('Website Quotation Reference'),
    submittedAt: getLineValue('Submitted At'),
    customerName: getLineValue('Customer Name'),
    companyName: companyVal && companyVal !== 'Not Specified' ? companyVal : undefined,
    email: getLineValue('Email'),
    phone: getLineValue('Phone'),
    gstin: getLineValue('GSTIN'),
    deliveryLocation: getLineValue('Delivery Address'),
    pincode: getLineValue('Delivery PIN Code'),
    preferredContactMethod,
    additionalRequirements: reqMatch?.[1]?.trim() || undefined,
  };
}

/**
 * Format human-readable + structured metadata Description for the Zoho Quote record
 */
function buildZohoQuoteDescriptionWithMeta(meta: ZohoQuoteStructuredMeta): string {
  const orig = meta.originalRfq;
  const edit = meta.editableQuote;

  const origLines = orig.items.map(
    (it, idx) =>
      `  ${idx + 1}. [${it.sku}] ${it.productName} — Orig Requested Qty: ${it.originalQuantity} ${it.packSize || 'Units'} @ ₹${it.indicativeUnitPrice}`
  );

  const editLines = edit.items.map(
    (it, idx) =>
      `  ${idx + 1}. [${it.sku}] ${it.productName} — Quoted Qty: ${it.quantity} (Orig: ${it.originalQuantity ?? it.quantity}) @ ₹${it.indicativeUnitPrice} = ₹${(it.lineSubtotal ?? it.quantity * it.indicativeUnitPrice).toLocaleString('en-IN')}`
  );

  const humanReadable = [
    `=== WEBSITE REQUEST FOR QUOTATION (RFQ) ===`,
    `Website Quotation Reference: ${meta.quotationNumber}`,
    `Submitted At: ${orig.submittedAt}`,
    `Customer Name: ${orig.customerName}`,
    `Company: ${orig.companyName || 'Not Specified'}`,
    `Email: ${orig.email}`,
    `Phone: ${orig.phone}`,
    orig.gstin ? `GSTIN: ${orig.gstin}` : '',
    orig.deliveryLocation ? `Delivery Address: ${orig.deliveryLocation}` : '',
    orig.pincode ? `Delivery PIN Code: ${orig.pincode}` : '',
    `Preferred Contact Method: ${orig.preferredContactMethod}`,
    orig.additionalRequirements ? `\nSpecial Requirements / Instructions:\n${orig.additionalRequirements}` : '',
    `\n--- ORIGINAL CUSTOMER RFQ ITEMS (IMMUTABLE) ---`,
    ...origLines,
    `\n--- ADMIN QUOTATION SUMMARY (v${edit.version} | Status: ${edit.status.toUpperCase()}) ---`,
    ...editLines,
    `Subtotal: ₹${edit.subtotal.toLocaleString('en-IN')}`,
    `Discount (${edit.discountPercent}%): -₹${edit.discountAmount.toLocaleString('en-IN')}`,
    `GST (${edit.gstPercent}%): +₹${edit.gstAmount.toLocaleString('en-IN')}`,
    `Delivery & Transport Charges: +₹${edit.deliveryCharges.toLocaleString('en-IN')}`,
    `Additional Charges: +₹${edit.additionalCharges.toLocaleString('en-IN')}`,
    `Grand Total: ₹${edit.grandTotal.toLocaleString('en-IN')}`,
    `Valid Until: ${edit.validUntil}`,
    `Payment Terms: ${edit.paymentTerms}`,
    edit.approvedAt ? `Approved By: ${edit.approvedBy || 'Admin'} at ${edit.approvedAt}` : '',
    edit.sentAt ? `Sent To Customer At: ${edit.sentAt}` : '',
    `===========================================`,
    ``,
    META_START_TAG,
    JSON.stringify(meta),
    META_END_TAG,
  ]
    .filter((line) => line !== '')
    .join('\n');

  return humanReadable;
}

/**
 * Append an immutable Audit Note to the Zoho CRM Quote record (non-blocking)
 */
async function appendZohoQuoteAuditNote(
  quoteId: string,
  title: string,
  content: string
): Promise<void> {
  try {
    await zohoFetch(`/Quotes/${quoteId}/Notes`, {
      method: 'POST',
      body: JSON.stringify({
        data: [
          {
            Note_Title: title,
            Note_Content: content,
          },
        ],
      }),
    });
  } catch (err: any) {
    console.warn(`[ZohoQuotes] Non-blocking warning: Failed to append Note to Quote ${quoteId}:`, err?.message);
  }
}

/**
 * Check if a Quote with this reference already exists in Zoho CRM (Duplicate Prevention)
 */
export async function findExistingQuoteByReference(
  quotationNumber: string
): Promise<{ id: string; quoteNumber?: string; subject: string; contactId?: string; accountId?: string } | null> {
  const cleanRef = quotationNumber.trim();
  if (!cleanRef) return null;

  try {
    const recentRes = await zohoFetch<any>(
      '/Quotes?fields=id,Subject,Quote_Number,Contact_Name,Account_Name,Created_Time&per_page=50'
    );
    if (Array.isArray(recentRes?.data)) {
      const match = recentRes.data.find(
        (q: any) => q.Subject && q.Subject.startsWith(cleanRef)
      );
      if (match?.id) {
        return {
          id: match.id,
          quoteNumber: match.Quote_Number,
          subject: match.Subject,
          contactId: match.Contact_Name?.id,
          accountId: match.Account_Name?.id,
        };
      }
    }
  } catch {
    // Continue to criteria search
  }

  try {
    const res = await zohoFetch<any>(
      `/Quotes/search?criteria=(Subject:starts_with:${encodeURIComponent(cleanRef)})&fields=id,Subject,Quote_Number,Contact_Name,Account_Name,Created_Time`
    );
    const existing = res?.data?.[0];
    if (existing?.id) {
      return {
        id: existing.id,
        quoteNumber: existing.Quote_Number,
        subject: existing.Subject,
        contactId: existing.Contact_Name?.id,
        accountId: existing.Account_Name?.id,
      };
    }
  } catch {
    // 204 or empty search returns null
  }

  return null;
}

/**
 * Create initial structured metadata from a newly submitted customer Quotation
 */
function buildInitialStructuredMeta(quotation: Quotation, validTill: string): ZohoQuoteStructuredMeta {
  const originalItems: OriginalRFQItem[] = (quotation.originalItems && quotation.originalItems.length > 0)
    ? quotation.originalItems
    : quotation.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        hsnCode: it.hsnCode,
        packSize: it.packSize,
        originalQuantity: Number(it.originalQuantity ?? it.quantity) || 1,
        indicativeUnitPrice: Number(it.indicativeUnitPrice) || 0,
        gstPercent: Number(it.gstPercent) || 18,
        indicativeTotalPrice: Number(it.indicativeTotalPrice) || 0,
      }));

  const editableItems: QuotationItem[] = quotation.items.map((it) => {
    const qty = Number(it.quantity) || 1;
    const unitPrice = Number(it.indicativeUnitPrice) || 0;
    const gstPct = Number(it.gstPercent) || 18;
    const lineSub = round2(qty * unitPrice);
    const lineTax = round2((lineSub * gstPct) / 100);
    return {
      ...it,
      originalQuantity: Number(it.originalQuantity ?? it.quantity) || 1,
      originalUnitPrice: unitPrice,
      discountPercent: 0,
      discountAmount: 0,
      taxAmount: lineTax,
      lineSubtotal: lineSub,
      lineTaxableAmount: lineSub,
      lineGrandTotal: round2(lineSub + lineTax),
      indicativeTotalPrice: lineSub,
    };
  });

  const subtotal = round2(editableItems.reduce((sum, it) => sum + (it.lineSubtotal || 0), 0));
  const gstPercent = 18;
  const gstAmount = round2((subtotal * gstPercent) / 100);
  const grandTotal = round2(subtotal + gstAmount);

  const initialAudit: QuotationAuditEntry = {
    version: 1,
    timestamp: quotation.createdAt || new Date().toISOString(),
    action: 'rfq_submitted',
    actor: `${quotation.customerName} (${quotation.email})`,
    summary: `Customer RFQ submitted with ${originalItems.length} product line item(s).`,
    grandTotal,
    itemSnapshot: editableItems.map((it) => ({
      sku: it.sku,
      productName: it.productName,
      originalQuantity: it.originalQuantity || it.quantity,
      quotedQuantity: it.quantity,
      unitPrice: it.indicativeUnitPrice,
      discountPercent: 0,
      gstPercent: it.gstPercent || 18,
      lineTotal: it.lineSubtotal || 0,
    })),
  };

  return {
    schemaVersion: 1,
    quotationNumber: quotation.quotationNumber,
    originalRfq: {
      customerName: quotation.customerName,
      companyName: quotation.companyName,
      email: quotation.email,
      phone: quotation.phone,
      gstin: quotation.gstin,
      deliveryLocation: quotation.deliveryLocation,
      pincode: quotation.pincode,
      preferredContactMethod: quotation.preferredContactMethod || 'email',
      additionalRequirements: quotation.additionalRequirements,
      photoUrls: quotation.photoUrls,
      submittedAt: quotation.createdAt || new Date().toISOString(),
      indicativeSubtotal: quotation.indicativeSubtotal || subtotal,
      indicativeGstAmount: quotation.indicativeGstAmount || gstAmount,
      indicativeTotal: quotation.indicativeTotal || grandTotal,
      items: originalItems,
    },
    editableQuote: {
      status: quotation.status || 'new',
      items: editableItems,
      subtotal,
      discountPercent: 0,
      discountAmount: 0,
      gstPercent,
      gstAmount,
      deliveryCharges: 0,
      additionalCharges: 0,
      grandTotal,
      validUntil: validTill,
      paymentTerms: quotation.paymentTerms || DEFAULT_PAYMENT_TERMS,
      termsAndConditions: quotation.termsAndConditions || DEFAULT_TERMS_AND_CONDITIONS,
      assignedTo: quotation.assignedTo,
      internalNotes: quotation.internalNotes,
      quotationDocumentUrl: quotation.quotationDocumentUrl,
      version: 1,
    },
    auditHistory: [initialAudit],
  };
}

/**
 * Create or synchronize a formal Quotation in Zoho CRM Quotes module
 */
export async function syncQuotationToZohoQuote(
  quotation: Quotation
): Promise<ZohoQuoteSyncResult> {
  if (!(await isZohoConfigured())) {
    return {
      success: false,
      action: 'skipped',
      error: 'Zoho CRM credentials missing: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN is not configured.',
    };
  }

  const cleanRef = quotation.quotationNumber.trim();
  const cleanEmail = quotation.email.trim().toLowerCase();

  try {
    // 1. Duplicate Prevention: Check if Quote already exists
    const existingQuote = await findExistingQuoteByReference(cleanRef);
    if (existingQuote) {
      console.log(`[ZohoQuotes] Duplicate prevented: Quote with reference [${cleanRef}] already exists as Zoho ID ${existingQuote.id}`);
      return {
        success: true,
        action: 'skipped',
        quoteId: existingQuote.id,
        quoteNumber: existingQuote.quoteNumber,
        contactId: existingQuote.contactId,
        accountId: existingQuote.accountId,
      };
    }

    // 2. Synchronize Customer & Company to Zoho Contacts & Accounts
    const contactSync = await syncCustomerToZohoContact({
      name: quotation.customerName,
      email: cleanEmail,
      phone: quotation.phone,
      companyName: quotation.companyName,
      gstin: quotation.gstin,
      websiteCustomerId: quotation.customerId || `ob_cust_${Buffer.from(cleanEmail).toString('hex').slice(0, 12)}`,
      billingAddress: {
        fullName: quotation.customerName,
        phone: quotation.phone,
        companyName: quotation.companyName,
        gstin: quotation.gstin,
        addressLine1: quotation.deliveryLocation || 'Office / Factory',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: quotation.pincode || '600001',
      },
    });

    const contactId = contactSync.contactId;
    const accountId = contactSync.accountId;

    // 3. Map line items to Zoho Product catalog IDs
    const quotedItems: Record<string, any>[] = [];
    const defaultZohoProdId = Object.values(typedProductMapping).find((e) => e.zohoId)?.zohoId;

    for (const item of quotation.items) {
      const zohoProdId = resolveZohoProductId(item.productId, item.sku);
      const effectiveZohoProdId = zohoProdId || defaultZohoProdId;

      const lineTax = round2((item.indicativeTotalPrice * (item.gstPercent || 18)) / 100);

      quotedItems.push({
        Product_Name: effectiveZohoProdId ? { id: effectiveZohoProdId } : undefined,
        Quantity: Number(item.quantity) || 1,
        List_Price: Number(item.indicativeUnitPrice) || 0,
        Discount: 0,
        Tax: lineTax,
        Description: `${item.productName}${item.sku ? ` (${item.sku})` : ''}${item.packSize ? ` [${item.packSize}]` : ''} | Orig RFQ Qty: ${item.quantity}`,
      });
    }

    if (quotedItems.length === 0) {
      return {
        success: false,
        action: 'failed',
        error: 'Quotation has no valid line items to submit to Zoho CRM.',
      };
    }

    // 4. Construct Quote payload with immutable Original RFQ snapshot in structured metadata
    const subject = `${cleanRef} - ${quotation.companyName || quotation.customerName}`;
    const validTill = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const meta = buildInitialStructuredMeta(quotation, validTill);
    const description = buildZohoQuoteDescriptionWithMeta(meta);

    const quotePayload = {
      data: [
        {
          Subject: subject,
          Quote_Stage: mapStatusToZohoStage(quotation.status),
          Valid_Till: validTill,
          Contact_Name: contactId ? { id: contactId } : undefined,
          Account_Name: accountId ? { id: accountId } : undefined,
          Billing_Street: quotation.deliveryLocation || undefined,
          Billing_City: 'Chennai',
          Billing_State: 'Tamil Nadu',
          Billing_Code: quotation.pincode || undefined,
          Shipping_Street: quotation.deliveryLocation || undefined,
          Shipping_City: 'Chennai',
          Shipping_State: 'Tamil Nadu',
          Shipping_Code: quotation.pincode || undefined,
          Adjustment: meta.editableQuote.gstAmount,
          Description: description,
          Terms_and_Conditions: `Payment Terms: ${meta.editableQuote.paymentTerms}\n\n${meta.editableQuote.termsAndConditions}`,
          Quoted_Items: quotedItems,
        },
      ],
      trigger: ['approval', 'workflow'],
    };

    const res = await zohoFetch<any>('/Quotes', {
      method: 'POST',
      body: JSON.stringify(quotePayload),
    });

    const item = res?.data?.[0];
    const quoteId = item?.details?.id;

    if (quoteId && (item.code === 'SUCCESS' || item.status === 'success')) {
      console.log(`[ZohoQuotes] Successfully created formal Quote [${quoteId}] for RFQ ${cleanRef}`);

      // Also save Original Customer RFQ Snapshot as a separate immutable Zoho CRM Note
      await appendZohoQuoteAuditNote(
        quoteId,
        `${cleanRef} — Original Customer RFQ (Immutable Record)`,
        `Original Customer RFQ Reference: ${cleanRef}\nSubmitted At: ${meta.originalRfq.submittedAt}\nCustomer: ${meta.originalRfq.customerName} (${meta.originalRfq.companyName})\nEmail: ${meta.originalRfq.email} | Phone: ${meta.originalRfq.phone}\nGSTIN: ${meta.originalRfq.gstin || 'N/A'}\nDelivery Address: ${meta.originalRfq.deliveryLocation || ''} - PIN ${meta.originalRfq.pincode}\n\nOriginal Requested Products:\n` +
          meta.originalRfq.items
            .map(
              (it, i) =>
                `${i + 1}. [${it.sku}] ${it.productName} (${it.packSize || 'Standard'}) — Requested Qty: ${it.originalQuantity}`
            )
            .join('\n')
      );

      return {
        success: true,
        action: 'created',
        quoteId,
        contactId,
        accountId,
      };
    }

    const errorMsg = item?.message || JSON.stringify(res);
    console.error(`[ZohoQuotes] Quote creation failed for ${cleanRef}:`, errorMsg);
    return {
      success: false,
      action: 'failed',
      error: `Zoho CRM responded: ${errorMsg}`,
      details: res,
    };
  } catch (err: any) {
    const errorMsg = err?.details?.message || err?.message || String(err);
    console.error(`[ZohoQuotes] Unexpected error syncing Quote ${cleanRef}:`, errorMsg);
    return {
      success: false,
      action: 'failed',
      error: errorMsg,
    };
  }
}

/**
 * Map raw Zoho Quote record to website Quotation model, restoring both
 * original immutable RFQ items and editable Admin quotation state.
 */
export function mapZohoQuoteToQuotation(quoteRecord: any, defaultEmail?: string): Quotation {
  const subject = quoteRecord.Subject || '';
  const refMatch = subject.match(/^(OB-[A-Z0-9-]+)/);
  const structuredMeta = extractStructuredMeta(quoteRecord.Description);
  const legacyFields = parseLegacyDescriptionFields(quoteRecord.Description);

  const quotationNumber =
    structuredMeta?.quotationNumber ||
    legacyFields.quotationNumber ||
    (refMatch ? refMatch[1] : quoteRecord.Quote_Number || `OB-QUOTE-${quoteRecord.id}`);

  if (structuredMeta) {
    const orig = structuredMeta.originalRfq;
    const edit = structuredMeta.editableQuote;
    return {
      id: quoteRecord.id,
      zohoQuoteId: quoteRecord.id,
      zohoContactId: quoteRecord.Contact_Name?.id,
      zohoAccountId: quoteRecord.Account_Name?.id,
      quotationNumber,
      customerName: orig.customerName || quoteRecord.Contact_Name?.name || 'Customer',
      companyName: orig.companyName || quoteRecord.Account_Name?.name || subject.split(' - ')[1] || 'Corporate Customer',
      email: orig.email || defaultEmail || '',
      phone: orig.phone || '',
      gstin: orig.gstin,
      deliveryLocation: orig.deliveryLocation || quoteRecord.Shipping_Street || quoteRecord.Billing_Street || undefined,
      pincode: orig.pincode || quoteRecord.Shipping_Code || quoteRecord.Billing_Code || '600001',
      photoUrls: orig.photoUrls,
      preferredContactMethod: orig.preferredContactMethod || 'email',
      additionalRequirements: orig.additionalRequirements,
      items: edit.items,
      originalItems: orig.items,
      indicativeSubtotal: orig.indicativeSubtotal,
      indicativeGstAmount: orig.indicativeGstAmount,
      indicativeTotal: orig.indicativeTotal,
      subtotal: edit.subtotal,
      discountPercent: edit.discountPercent,
      discountAmount: edit.discountAmount,
      gstPercent: edit.gstPercent,
      gstAmount: edit.gstAmount,
      deliveryCharges: edit.deliveryCharges,
      additionalCharges: edit.additionalCharges,
      grandTotal: edit.grandTotal,
      validUntil: edit.validUntil || quoteRecord.Valid_Till,
      paymentTerms: edit.paymentTerms || DEFAULT_PAYMENT_TERMS,
      termsAndConditions: edit.termsAndConditions || DEFAULT_TERMS_AND_CONDITIONS,
      status: edit.status || mapZohoStageToStatus(quoteRecord.Quote_Stage),
      assignedTo: edit.assignedTo,
      internalNotes: edit.internalNotes,
      quotedAmount: edit.grandTotal,
      quotationDocumentUrl: edit.quotationDocumentUrl,
      version: edit.version || 1,
      approvedAt: edit.approvedAt,
      approvedBy: edit.approvedBy,
      sentAt: edit.sentAt,
      sentBy: edit.sentBy,
      sentMessageId: edit.sentMessageId,
      auditHistory: structuredMeta.auditHistory || [],
      createdAt: orig.submittedAt || quoteRecord.Created_Time || new Date().toISOString(),
      updatedAt: quoteRecord.Modified_Time,
    };
  }

  // Fallback mapping for legacy Zoho Quote records created before structured metadata
  const companyName =
    legacyFields.companyName ||
    quoteRecord.Account_Name?.name ||
    subject.split(' - ')[1] ||
    'Corporate Customer';
  const customerName =
    legacyFields.customerName ||
    quoteRecord.Contact_Name?.name ||
    'Customer';

  const items: QuotationItem[] = [];
  const originalItems: OriginalRFQItem[] = [];

  if (Array.isArray(quoteRecord.Quoted_Items)) {
    for (const [idx, qi] of quoteRecord.Quoted_Items.entries()) {
      const rawDesc = qi.Description || '';
      const packMatch = rawDesc.match(/\[([^\]]+)\]/);
      const skuFromDesc = rawDesc.match(/\(([A-Z0-9-]+)\)/)?.[1];
      const sku = qi.Product_Name?.Product_Code || skuFromDesc || `OB-SKU-${idx + 1}`;
      const prodName = qi.Product_Name?.name || rawDesc.split(' (')[0] || `Item ${idx + 1}`;
      const packSize = packMatch ? packMatch[1] : 'Standard Pack';
      const qty = Number(qi.Quantity) || 1;
      const unitPrice = Number(qi.List_Price) || 0;
      const lineSub = round2(unitPrice * qty);
      const gstPercent = 18;
      const taxAmount = round2((lineSub * gstPercent) / 100);

      // Lookup catalog product ID by SKU if possible
      let websiteProdId = qi.Product_Name?.id || `zoho-prod-${idx}`;
      for (const [key, entry] of Object.entries(typedProductMapping)) {
        if (entry.sku === sku && key.startsWith('prod-')) {
          websiteProdId = key;
          break;
        }
      }

      items.push({
        id: qi.id || `zoho-item-${idx}`,
        productId: websiteProdId,
        productName: prodName,
        sku,
        indicativeUnitPrice: unitPrice,
        originalUnitPrice: unitPrice,
        gstPercent,
        quantity: qty,
        originalQuantity: qty,
        discountPercent: 0,
        discountAmount: 0,
        taxAmount,
        lineSubtotal: lineSub,
        lineTaxableAmount: lineSub,
        lineGrandTotal: round2(lineSub + taxAmount),
        indicativeTotalPrice: lineSub,
        packSize,
      });

      originalItems.push({
        id: qi.id || `zoho-orig-${idx}`,
        productId: websiteProdId,
        productName: prodName,
        sku,
        packSize,
        originalQuantity: qty,
        indicativeUnitPrice: unitPrice,
        gstPercent,
        indicativeTotalPrice: lineSub,
      });
    }
  }

  const subtotal = round2(
    Number(quoteRecord.Sub_Total) || items.reduce((acc, it) => acc + it.indicativeTotalPrice, 0)
  );
  const discountAmount = round2(Number(quoteRecord.Discount) || 0);
  const taxable = Math.max(0, subtotal - discountAmount);
  const gstAmount = round2(Number(quoteRecord.Tax) || (taxable * 18) / 100);
  const total = round2(Number(quoteRecord.Grand_Total) || taxable + gstAmount);
  const validUntil =
    quoteRecord.Valid_Till ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return {
    id: quoteRecord.id,
    zohoQuoteId: quoteRecord.id,
    zohoContactId: quoteRecord.Contact_Name?.id,
    zohoAccountId: quoteRecord.Account_Name?.id,
    quotationNumber,
    customerName,
    companyName,
    email: legacyFields.email || defaultEmail || '',
    phone: legacyFields.phone || '',
    gstin: legacyFields.gstin,
    preferredContactMethod: legacyFields.preferredContactMethod || 'email',
    additionalRequirements: legacyFields.additionalRequirements,
    deliveryLocation:
      legacyFields.deliveryLocation ||
      quoteRecord.Shipping_Street ||
      quoteRecord.Billing_Street ||
      undefined,
    pincode:
      legacyFields.pincode ||
      quoteRecord.Shipping_Code ||
      quoteRecord.Billing_Code ||
      '600001',
    items,
    originalItems,
    indicativeSubtotal: subtotal,
    indicativeGstAmount: gstAmount,
    indicativeTotal: total,
    subtotal,
    discountPercent: 0,
    discountAmount,
    gstPercent: 18,
    gstAmount,
    deliveryCharges: 0,
    additionalCharges: 0,
    grandTotal: total,
    validUntil,
    paymentTerms: DEFAULT_PAYMENT_TERMS,
    termsAndConditions: quoteRecord.Terms_and_Conditions || DEFAULT_TERMS_AND_CONDITIONS,
    status: mapZohoStageToStatus(quoteRecord.Quote_Stage),
    quotedAmount: total > 0 ? total : undefined,
    version: 1,
    auditHistory: [
      {
        version: 1,
        timestamp: legacyFields.submittedAt || quoteRecord.Created_Time || new Date().toISOString(),
        action: 'rfq_submitted',
        actor: `${customerName}${legacyFields.email ? ` (${legacyFields.email})` : ''}`,
        summary: `Customer RFQ submitted with ${items.length} line item(s).`,
        grandTotal: total,
      },
    ],
    createdAt: legacyFields.submittedAt || quoteRecord.Created_Time || new Date().toISOString(),
    updatedAt: quoteRecord.Modified_Time,
  };
}

/**
 * Retrieve all quotations from Zoho CRM Quotes module for the Admin Dashboard
 */
export async function getAllQuotationsFromZoho(): Promise<Quotation[]> {
  if (!(await isZohoConfigured())) {
    return [];
  }

  try {
    const listRes = await zohoFetch<any>(
      '/Quotes?fields=id,Subject,Quote_Number,Quote_Stage,Valid_Till,Terms_and_Conditions,Description,Sub_Total,Discount,Tax,Adjustment,Grand_Total,Contact_Name,Account_Name,Billing_Street,Billing_Code,Shipping_Street,Shipping_Code,Created_Time,Modified_Time&per_page=50'
    );

    const rows: any[] = Array.isArray(listRes?.data) ? listRes.data : [];
    if (rows.length === 0) return [];

    // Deduplicate by Website Quotation Reference (keeping the latest or active record per reference)
    // while always including formal OB-RFQ-* records.
    const seenRefs = new Set<string>();
    const uniqueRows: any[] = [];

    for (const row of rows) {
      const subj = String(row.Subject || '');
      const refMatch = subj.match(/^(OB-[A-Z0-9-]+)/);
      const ref = refMatch ? refMatch[1] : row.id;
      if (seenRefs.has(ref)) continue;
      seenRefs.add(ref);
      uniqueRows.push(row);
    }

    // For records that already have [OB_QUOTE_META_V1] in Description, we already have full items!
    // For legacy records without [OB_QUOTE_META_V1] (up to 15), fetch /Quotes/{id} in parallel so Quoted_Items is populated.
    let legacyFetches = 0;
    const quotations = await Promise.all(
      uniqueRows.map(async (row) => {
        const hasMeta = Boolean(extractStructuredMeta(row.Description));
        if (!hasMeta && legacyFetches < 15) {
          legacyFetches++;
          try {
            const fullRes = await zohoFetch<any>(`/Quotes/${row.id}`);
            const fullRecord = fullRes?.data?.[0] || row;
            return mapZohoQuoteToQuotation(fullRecord);
          } catch {
            return mapZohoQuoteToQuotation(row);
          }
        }
        return mapZohoQuoteToQuotation(row);
      })
    );

    quotations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return quotations;
  } catch (err: any) {
    console.warn('[ZohoQuotes] Error fetching all quotations from Zoho CRM:', err?.message);
    return [];
  }
}

/**
 * Save Admin Quotation edits (Save Draft, Edit Quotation, Approve Quotation, or Send to Customer)
 * directly in Zoho CRM while strictly preserving the original customer RFQ data and audit history.
 */
export async function saveAdminQuotationInZoho(
  idOrReference: string,
  input: AdminQuotationUpdateInput
): Promise<{ success: boolean; quotation?: Quotation; error?: string }> {
  if (!(await isZohoConfigured())) {
    return { success: false, error: 'Zoho CRM is not configured.' };
  }

  try {
    // 1. Locate existing Quote in Zoho CRM
    const existingQuotation = await getQuoteByReferenceFromZoho(idOrReference);
    if (!existingQuotation) {
      return { success: false, error: `Quotation "${idOrReference}" not found in Zoho CRM.` };
    }

    const zohoQuoteId = existingQuotation.zohoQuoteId || existingQuotation.id;

    // 2. Lock immutable Original Customer RFQ snapshot (NEVER overwrite original quantities or details!)
    const immutableOriginalItems: OriginalRFQItem[] =
      existingQuotation.originalItems && existingQuotation.originalItems.length > 0
        ? existingQuotation.originalItems
        : existingQuotation.items.map((it) => ({
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

    const origBySku = new Map<string, OriginalRFQItem>();
    for (const origItem of immutableOriginalItems) {
      origBySku.set(origItem.sku, origItem);
      origBySku.set(origItem.productId, origItem);
    }

    // 3. Calculate updated line items & totals server-side
    const overallGstPercent =
      input.gstPercent !== undefined
        ? Math.max(0, Math.min(100, Number(input.gstPercent) || 0))
        : existingQuotation.gstPercent ?? 18;

    const rawItems = input.items && input.items.length > 0 ? input.items : existingQuotation.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.productName,
      sku: it.sku,
      hsnCode: it.hsnCode,
      packSize: it.packSize,
      quantity: it.quantity,
      unitPrice: it.indicativeUnitPrice,
      gstPercent: it.gstPercent,
      discountPercent: it.discountPercent,
    }));

    const updatedItems: QuotationItem[] = rawItems.map((item, idx) => {
      const matchedOrig = origBySku.get(item.sku) || origBySku.get(item.productId) || immutableOriginalItems[idx];
      const originalQty = matchedOrig ? matchedOrig.originalQuantity : Number(item.quantity) || 1;
      const originalPrice = matchedOrig ? matchedOrig.indicativeUnitPrice : Number(item.unitPrice) || 0;

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const unitPrice = Math.max(0, round2(Number(item.unitPrice) || 0));
      const itemGstPct =
        item.gstPercent !== undefined ? Math.max(0, Number(item.gstPercent)) : overallGstPercent;
      const lineSubtotal = round2(qty * unitPrice);
      const itemDiscPct = Math.max(0, Math.min(100, Number(item.discountPercent) || 0));
      const itemDiscAmt = round2((lineSubtotal * itemDiscPct) / 100);
      const lineTaxable = round2(Math.max(0, lineSubtotal - itemDiscAmt));
      const itemTaxAmt = round2((lineTaxable * itemGstPct) / 100);
      const lineGrandTotal = round2(lineTaxable + itemTaxAmt);

      return {
        id: item.id || matchedOrig?.id || `qitem-${idx + 1}`,
        productId: item.productId || matchedOrig?.productId || `prod-${idx + 1}`,
        productName: item.productName || matchedOrig?.productName || `Product ${idx + 1}`,
        sku: item.sku || matchedOrig?.sku || `SKU-${idx + 1}`,
        hsnCode: item.hsnCode || matchedOrig?.hsnCode,
        packSize: item.packSize || matchedOrig?.packSize || 'Standard Pack',
        quantity: qty,
        originalQuantity: originalQty,
        indicativeUnitPrice: unitPrice,
        originalUnitPrice: originalPrice,
        discountPercent: itemDiscPct,
        discountAmount: itemDiscAmt,
        gstPercent: itemGstPct,
        taxAmount: itemTaxAmt,
        lineSubtotal,
        lineTaxableAmount: lineTaxable,
        lineGrandTotal,
        indicativeTotalPrice: lineSubtotal,
      };
    });

    const subtotal = round2(updatedItems.reduce((sum, it) => sum + (it.lineSubtotal || 0), 0));

    // Calculate overall discount (supports either discountPercent or direct discountAmount)
    let discountPercent =
      input.discountPercent !== undefined
        ? Math.max(0, Math.min(100, Number(input.discountPercent) || 0))
        : existingQuotation.discountPercent ?? 0;

    let discountAmount = 0;
    if (input.discountPercent !== undefined && Number(input.discountPercent) > 0) {
      discountAmount = round2((subtotal * discountPercent) / 100);
    } else if (input.discountAmount !== undefined) {
      discountAmount = Math.min(subtotal, Math.max(0, round2(Number(input.discountAmount) || 0)));
      discountPercent = subtotal > 0 ? round2((discountAmount / subtotal) * 100) : 0;
    } else if (discountPercent > 0) {
      discountAmount = round2((subtotal * discountPercent) / 100);
    } else {
      discountAmount = round2(existingQuotation.discountAmount ?? 0);
    }

    const taxableSubtotal = round2(Math.max(0, subtotal - discountAmount));
    const gstAmount = round2((taxableSubtotal * overallGstPercent) / 100);

    const deliveryCharges =
      input.deliveryCharges !== undefined
        ? Math.max(0, round2(Number(input.deliveryCharges) || 0))
        : existingQuotation.deliveryCharges ?? 0;

    const additionalCharges =
      input.additionalCharges !== undefined
        ? Math.max(0, round2(Number(input.additionalCharges) || 0))
        : existingQuotation.additionalCharges ?? 0;

    const grandTotal = round2(taxableSubtotal + gstAmount + deliveryCharges + additionalCharges);

    // 4. Determine workflow status transition
    let nextStatus: QuotationStatus = existingQuotation.status;
    const nowIso = new Date().toISOString();
    let approvedAt = existingQuotation.approvedAt;
    let approvedBy = existingQuotation.approvedBy;
    let sentAt = existingQuotation.sentAt;
    let sentBy = existingQuotation.sentBy;
    let sentMessageId = existingQuotation.sentMessageId;

    let auditAction: QuotationAuditEntry['action'] = 'draft_saved';
    let auditSummary = '';

    if (input.action === 'save_draft') {
      nextStatus = 'quotation_prepared';
      auditAction = 'draft_saved';
      auditSummary = `Draft saved by ${input.actor}. Subtotal: ₹${subtotal.toLocaleString('en-IN')}, Discount: ₹${discountAmount.toLocaleString('en-IN')}, GST (${overallGstPercent}%): ₹${gstAmount.toLocaleString('en-IN')}, Delivery: ₹${deliveryCharges.toLocaleString('en-IN')}, Additional: ₹${additionalCharges.toLocaleString('en-IN')}, Grand Total: ₹${grandTotal.toLocaleString('en-IN')}.`;
    } else if (input.action === 'edit_quotation') {
      nextStatus = 'quotation_prepared';
      auditAction = 'quotation_edited';
      auditSummary = `Quotation unlocked for editing and updated by ${input.actor}. Revised Grand Total: ₹${grandTotal.toLocaleString('en-IN')}.`;
    } else if (input.action === 'approve') {
      nextStatus = 'approved';
      approvedAt = nowIso;
      approvedBy = input.actor;
      auditAction = 'approved';
      auditSummary = `Quotation explicitly APPROVED by ${input.actor} for Grand Total ₹${grandTotal.toLocaleString('en-IN')}. Ready to send to customer.`;
    } else if (input.action === 'send_to_customer') {
      nextStatus = 'sent_to_customer';
      sentAt = nowIso;
      sentBy = input.actor;
      if (input.sentMessageId) sentMessageId = input.sentMessageId;
      if (!approvedAt) {
        approvedAt = nowIso;
        approvedBy = input.actor;
      }
      auditAction = 'sent_to_customer';
      auditSummary = `Final Quotation sent to customer (${existingQuotation.email}) via Zoho CRM Send Mail API by ${input.actor}. Grand Total: ₹${grandTotal.toLocaleString('en-IN')}.`;
    }

    const nextVersion = (existingQuotation.version || 1) + 1;
    const newAuditEntry: QuotationAuditEntry = {
      version: nextVersion,
      timestamp: nowIso,
      action: auditAction,
      actor: input.actor,
      summary: auditSummary,
      grandTotal,
      itemSnapshot: updatedItems.map((it) => ({
        sku: it.sku,
        productName: it.productName,
        originalQuantity: it.originalQuantity ?? it.quantity,
        quotedQuantity: it.quantity,
        unitPrice: it.indicativeUnitPrice,
        discountPercent: it.discountPercent || 0,
        gstPercent: it.gstPercent || overallGstPercent,
        lineTotal: it.lineSubtotal || 0,
      })),
    };

    const existingAudit = Array.isArray(existingQuotation.auditHistory)
      ? existingQuotation.auditHistory
      : [];

    const validUntil =
      input.validUntil ||
      existingQuotation.validUntil ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const paymentTerms =
      input.paymentTerms !== undefined
        ? input.paymentTerms.trim() || DEFAULT_PAYMENT_TERMS
        : existingQuotation.paymentTerms || DEFAULT_PAYMENT_TERMS;

    const termsAndConditions =
      input.termsAndConditions !== undefined
        ? input.termsAndConditions.trim() || DEFAULT_TERMS_AND_CONDITIONS
        : existingQuotation.termsAndConditions || DEFAULT_TERMS_AND_CONDITIONS;

    const assignedTo =
      input.assignedTo !== undefined ? input.assignedTo.trim() : existingQuotation.assignedTo;

    const internalNotes =
      input.internalNotes !== undefined ? input.internalNotes.trim() : existingQuotation.internalNotes;

    const quotationDocumentUrl =
      input.quotationDocumentUrl !== undefined
        ? input.quotationDocumentUrl.trim()
        : existingQuotation.quotationDocumentUrl;

    const updatedMeta: ZohoQuoteStructuredMeta = {
      schemaVersion: 1,
      quotationNumber: existingQuotation.quotationNumber,
      originalRfq: {
        customerName: existingQuotation.customerName,
        companyName: existingQuotation.companyName,
        email: existingQuotation.email,
        phone: existingQuotation.phone,
        gstin: existingQuotation.gstin,
        deliveryLocation: existingQuotation.deliveryLocation,
        pincode: existingQuotation.pincode,
        preferredContactMethod: existingQuotation.preferredContactMethod || 'email',
        additionalRequirements: existingQuotation.additionalRequirements,
        photoUrls: existingQuotation.photoUrls,
        submittedAt: existingQuotation.createdAt,
        indicativeSubtotal: existingQuotation.indicativeSubtotal,
        indicativeGstAmount: existingQuotation.indicativeGstAmount,
        indicativeTotal: existingQuotation.indicativeTotal,
        items: immutableOriginalItems,
      },
      editableQuote: {
        status: nextStatus,
        items: updatedItems,
        subtotal,
        discountPercent,
        discountAmount,
        gstPercent: overallGstPercent,
        gstAmount,
        deliveryCharges,
        additionalCharges,
        grandTotal,
        validUntil,
        paymentTerms,
        termsAndConditions,
        assignedTo,
        internalNotes,
        quotationDocumentUrl,
        version: nextVersion,
        approvedAt,
        approvedBy,
        sentAt,
        sentBy,
        sentMessageId,
      },
      auditHistory: [...existingAudit, newAuditEntry],
    };

    // 5. Build Zoho Quoted_Items subform payload
    const defaultZohoProdId = Object.values(typedProductMapping).find((e) => e.zohoId)?.zohoId;
    const zohoQuotedItems = updatedItems.map((it) => {
      const zohoProdId = resolveZohoProductId(it.productId, it.sku) || defaultZohoProdId;
      return {
        Product_Name: zohoProdId ? { id: zohoProdId } : undefined,
        Quantity: it.quantity,
        List_Price: it.indicativeUnitPrice,
        Discount: 0,
        Tax: it.taxAmount || 0,
        Description: `${it.productName}${it.sku ? ` (${it.sku})` : ''}${it.packSize ? ` [${it.packSize}]` : ''} | Orig RFQ Qty: ${it.originalQuantity ?? it.quantity} | GST: ${it.gstPercent}%`,
      };
    });

    const newDescription = buildZohoQuoteDescriptionWithMeta(updatedMeta);
    const zohoAdjustment = round2(gstAmount + deliveryCharges + additionalCharges);

    const updatePayload = {
      data: [
        {
          id: zohoQuoteId,
          Quote_Stage: mapStatusToZohoStage(nextStatus),
          Valid_Till: validUntil,
          Discount: discountAmount,
          Adjustment: zohoAdjustment,
          Terms_and_Conditions: `Payment Terms: ${paymentTerms}\n\n${termsAndConditions}`,
          Description: newDescription,
          Quoted_Items: zohoQuotedItems,
        },
      ],
    };

    const putRes = await zohoFetch<any>(`/Quotes/${zohoQuoteId}`, {
      method: 'PUT',
      body: JSON.stringify(updatePayload),
    });

    const putItem = putRes?.data?.[0];
    if (!putItem || (putItem.code !== 'SUCCESS' && putItem.status !== 'success')) {
      return {
        success: false,
        error: `Zoho CRM update failed: ${putItem?.message || JSON.stringify(putRes)}`,
      };
    }

    // 6. Append version entry to Zoho CRM Notes for permanent CRM timeline visibility
    await appendZohoQuoteAuditNote(
      zohoQuoteId,
      `${existingQuotation.quotationNumber} — v${nextVersion} (${auditAction.toUpperCase()})`,
      `${auditSummary}\nTimestamp: ${nowIso}\nActor: ${input.actor}\n\nLine Items:\n` +
        updatedItems
          .map(
            (it, i) =>
              `${i + 1}. [${it.sku}] ${it.productName} | Orig Qty: ${it.originalQuantity} | Quoted Qty: ${it.quantity} | Unit Price: ₹${it.indicativeUnitPrice} | Line Subtotal: ₹${it.lineSubtotal}`
          )
          .join('\n')
    );

    // 7. Return updated Quotation object
    const refreshed = await getQuoteByReferenceFromZoho(zohoQuoteId);
    return {
      success: true,
      quotation:
        refreshed ||
        mapZohoQuoteToQuotation({
          id: zohoQuoteId,
          Subject: `${existingQuotation.quotationNumber} - ${existingQuotation.companyName}`,
          Quote_Stage: mapStatusToZohoStage(nextStatus),
          Valid_Till: validUntil,
          Description: newDescription,
          Modified_Time: nowIso,
        }),
    };
  } catch (err: any) {
    console.error(`[ZohoQuotes] Error updating quotation [${idOrReference}]:`, err?.message);
    return {
      success: false,
      error: err?.details?.message || err?.message || 'Failed to update quotation in Zoho CRM.',
    };
  }
}

/**
 * Retrieve customer quotation history directly from Zoho CRM Quotes
 */
export async function getCustomerQuotationsFromZoho(
  emailOrCustomerId: string
): Promise<Quotation[]> {
  const cleanParam = emailOrCustomerId.trim().toLowerCase();
  if (!cleanParam || !(await isZohoConfigured())) {
    return [];
  }

  try {
    let contactId: string | undefined = undefined;
    if (cleanParam.includes('@')) {
      const profile = await getCustomerProfileFromZoho(cleanParam);
      contactId = profile?.contact?.id;
    } else {
      contactId = cleanParam;
    }

    const quotes: any[] = [];

    if (contactId) {
      try {
        const res = await zohoFetch<any>(
          `/Quotes/search?criteria=(Contact_Name:equals:${contactId})&fields=id,Subject,Quote_Number,Quote_Stage,Grand_Total,Sub_Total,Tax,Contact_Name,Account_Name,Created_Time,Modified_Time`
        );
        if (Array.isArray(res?.data)) {
          quotes.push(...res.data);
        }
      } catch {
        // Continue to fallback search
      }
    }

    if (quotes.length === 0) {
      try {
        const wordSearchRes = await zohoFetch<any>(
          `/Quotes/search?word=${encodeURIComponent(cleanParam)}&fields=id,Subject,Quote_Number,Quote_Stage,Grand_Total,Sub_Total,Tax,Contact_Name,Account_Name,Created_Time,Modified_Time`
        );
        if (Array.isArray(wordSearchRes?.data)) {
          quotes.push(...wordSearchRes.data);
        }
      } catch {
        // No results
      }
    }

    try {
      const recentRes = await zohoFetch<any>(
        '/Quotes?fields=id,Subject,Quote_Number,Quote_Stage,Grand_Total,Sub_Total,Tax,Contact_Name,Account_Name,Created_Time,Modified_Time&per_page=50'
      );
      if (Array.isArray(recentRes?.data)) {
        for (const q of recentRes.data) {
          if (
            (contactId && q.Contact_Name?.id === contactId) ||
            (q.Subject && q.Subject.toLowerCase().includes(cleanParam))
          ) {
            quotes.push(q);
          }
        }
      }
    } catch {
      // No results
    }

    if (quotes.length === 0) {
      return [];
    }

    const fullQuotations: Quotation[] = [];
    const seenIds = new Set<string>();

    for (const q of quotes) {
      if (seenIds.has(q.id)) continue;
      seenIds.add(q.id);

      try {
        const singleRes = await zohoFetch<any>(`/Quotes/${q.id}`);
        const fullRecord = singleRes?.data?.[0] || q;
        fullQuotations.push(mapZohoQuoteToQuotation(fullRecord, cleanParam.includes('@') ? cleanParam : undefined));
      } catch {
        fullQuotations.push(mapZohoQuoteToQuotation(q, cleanParam.includes('@') ? cleanParam : undefined));
      }
    }

    fullQuotations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return fullQuotations;
  } catch (err: any) {
    console.warn(`[ZohoQuotes] Error reading quotations for [${cleanParam}]:`, err?.message);
    return [];
  }
}

/**
 * Retrieve a single quotation by Website Reference or Zoho Quote ID
 */
export async function getQuoteByReferenceFromZoho(
  referenceOrId: string
): Promise<Quotation | null> {
  const cleanParam = referenceOrId.trim();
  if (!cleanParam || !(await isZohoConfigured())) {
    return null;
  }

  try {
    let quoteRecord: any = null;

    // 1. Direct ID lookup if numeric Zoho ID
    if (/^\d+$/.test(cleanParam)) {
      try {
        const directRes = await zohoFetch<any>(`/Quotes/${cleanParam}`);
        quoteRecord = directRes?.data?.[0];
      } catch {
        // Not found by direct ID
      }
    }

    // 2. Check recent records directly from database (zero search-index lag)
    if (!quoteRecord) {
      try {
        const recentRes = await zohoFetch<any>(
          '/Quotes?fields=id,Subject,Quote_Number,Created_Time&per_page=50'
        );
        if (Array.isArray(recentRes?.data)) {
          const match = recentRes.data.find(
            (q: any) =>
              q.id === cleanParam ||
              (q.Subject && q.Subject.startsWith(cleanParam)) ||
              q.Quote_Number === cleanParam
          );
          if (match?.id) {
            const fullRes = await zohoFetch<any>(`/Quotes/${match.id}`);
            quoteRecord = fullRes?.data?.[0] || match;
          }
        }
      } catch {
        // Ignore and try criteria search
      }
    }

    // 3. Try search by Subject starts_with
    if (!quoteRecord) {
      try {
        const searchRes = await zohoFetch<any>(
          `/Quotes/search?criteria=(Subject:starts_with:${encodeURIComponent(cleanParam)})&fields=id,Subject,Quote_Number`
        );
        if (searchRes?.data?.[0]?.id) {
          const fullRes = await zohoFetch<any>(`/Quotes/${searchRes.data[0].id}`);
          quoteRecord = fullRes?.data?.[0] || searchRes.data[0];
        }
      } catch {
        // Not found
      }
    }

    if (!quoteRecord) {
      return null;
    }

    return mapZohoQuoteToQuotation(quoteRecord);
  } catch (err: any) {
    console.warn(`[ZohoQuotes] Error looking up quote [${cleanParam}]:`, err?.message);
    return null;
  }
}
