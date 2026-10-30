/**
 * Server-Side Zoho CRM Quotes Service
 *
 * Implements Zoho CRM as the primary database for Quotations (RFQs):
 * 1. Creates formal Quote records in Zoho CRM Quotes module.
 * 2. Links each Quote to the correct Zoho Contact ID and Account ID.
 * 3. Maps line items to Zoho Product IDs using the 101-catalog mapping.
 * 4. Saves product names, quantities, unit prices, tax, and totals accurately.
 * 5. Prevents duplicate Quotes using unique Subject reference checking.
 * 6. Reads customer quotation history directly from Zoho CRM Quotes.
 */

import { Quotation, QuotationItem, QuotationStatus } from '@/types';
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

/**
 * Map Website QuotationStatus to Zoho CRM Quote_Stage
 */
function mapStatusToZohoStage(status: QuotationStatus): string {
  switch (status) {
    case 'new':
      return 'Draft';
    case 'under_review':
      return 'Negotiation';
    case 'quotation_prepared':
    case 'sent_to_customer':
      return 'Delivered';
    case 'accepted':
      return 'Confirmed';
    case 'rejected':
    case 'closed':
      return 'Closed Lost';
    default:
      return 'Draft';
  }
}

/**
 * Map Zoho CRM Quote_Stage to Website QuotationStatus
 */
function mapZohoStageToStatus(stage?: string): QuotationStatus {
  switch (stage) {
    case 'Draft':
      return 'new';
    case 'Negotiation':
    case 'On Hold':
      return 'under_review';
    case 'Delivered':
      return 'sent_to_customer';
    case 'Confirmed':
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
  // 1. Direct match by website product ID
  if (typedProductMapping[productId]?.zohoId) {
    return typedProductMapping[productId].zohoId;
  }

  // 2. Match by SKU
  if (sku && typedProductMapping[sku]?.zohoId) {
    return typedProductMapping[sku].zohoId;
  }

  // 3. Search entries by SKU
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
 * Format description for the Zoho Quote record
 */
function buildZohoQuoteDescription(quotation: Quotation): string {
  const parts: string[] = [
    `=== WEBSITE REQUEST FOR QUOTATION (RFQ) ===`,
    `Website Quotation Reference: ${quotation.quotationNumber}`,
    `Submitted At: ${quotation.createdAt || new Date().toISOString()}`,
    `Customer Name: ${quotation.customerName}`,
    `Company: ${quotation.companyName || 'Not Specified'}`,
    `Email: ${quotation.email}`,
    `Phone: ${quotation.phone}`,
    quotation.gstin ? `GSTIN: ${quotation.gstin}` : '',
    quotation.deliveryLocation ? `Delivery Address: ${quotation.deliveryLocation}` : '',
    quotation.pincode ? `Delivery PIN Code: ${quotation.pincode}` : '',
    quotation.preferredContactMethod ? `Preferred Contact Method: ${quotation.preferredContactMethod}` : '',
    quotation.additionalRequirements ? `\nSpecial Requirements / Instructions:\n${quotation.additionalRequirements}` : '',
    quotation.photoUrls && quotation.photoUrls.length > 0 ? `\nAttached Photo URLs:\n${quotation.photoUrls.join('\n')}` : '',
    `===========================================`,
  ];

  return parts.filter(Boolean).join('\n');
}

/**
 * Check if a Quote with this reference already exists in Zoho CRM (Duplicate Prevention)
 */
export async function findExistingQuoteByReference(
  quotationNumber: string
): Promise<{ id: string; quoteNumber?: string; subject: string } | null> {
  const cleanRef = quotationNumber.trim();
  if (!cleanRef) return null;

  // 1. Check recent records directly from database (instant, zero search-index lag)
  try {
    const recentRes = await zohoFetch<any>(
      '/Quotes?fields=id,Subject,Quote_Number,Created_Time&per_page=50'
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
        };
      }
    }
  } catch {
    // Continue to criteria search
  }

  // 2. Search by criteria across all historical records
  try {
    const res = await zohoFetch<any>(
      `/Quotes/search?criteria=(Subject:starts_with:${encodeURIComponent(cleanRef)})&fields=id,Subject,Quote_Number,Created_Time`
    );
    const existing = res?.data?.[0];
    if (existing?.id) {
      return {
        id: existing.id,
        quoteNumber: existing.Quote_Number,
        subject: existing.Subject,
      };
    }
  } catch (err: any) {
    // 204 or empty search returns null
  }

  return null;
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

    for (const item of quotation.items) {
      const zohoProdId = resolveZohoProductId(item.productId, item.sku);

      const defaultZohoProdId = Object.values(typedProductMapping).find((e) => e.zohoId)?.zohoId;
      const effectiveZohoProdId = zohoProdId || defaultZohoProdId;

      if (!zohoProdId) {
        console.warn(`[ZohoQuotes] Product [${item.productName}] (SKU: ${item.sku}) could not be resolved directly. Using catalog fallback ID: ${defaultZohoProdId}`);
      }

      const lineTax = (item.indicativeTotalPrice * (item.gstPercent || 18)) / 100;

      quotedItems.push({
        Product_Name: effectiveZohoProdId ? { id: effectiveZohoProdId } : undefined,
        Quantity: Number(item.quantity) || 1,
        List_Price: Number(item.indicativeUnitPrice) || 0,
        Discount: 0,
        Tax: lineTax,
        Description: `${item.productName}${item.sku ? ` (${item.sku})` : ''}${item.packSize ? ` [${item.packSize}]` : ''}`,
      });
    }

    if (quotedItems.length === 0) {
      return {
        success: false,
        action: 'failed',
        error: 'Quotation has no valid line items to submit to Zoho CRM.',
      };
    }

    // 4. Construct Quote payload
    const subject = `${cleanRef} - ${quotation.companyName || quotation.customerName}`;
    const validTill = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const description = buildZohoQuoteDescription(quotation);

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
          Description: description,
          Terms_and_Conditions: '18% GST Applicable as shown. Delivery within 24-48 business hours across Chennai. Payment terms as agreed upon quotation acceptance.',
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
 * Map raw Zoho Quote record to website Quotation model
 */
function mapZohoQuoteToQuotation(quoteRecord: any, defaultEmail?: string): Quotation {
  const subject = quoteRecord.Subject || '';
  const refMatch = subject.match(/^(OB-[A-Z0-9-]+)/);
  const quotationNumber = refMatch ? refMatch[1] : (quoteRecord.Quote_Number || `OB-QUOTE-${quoteRecord.id}`);

  // Extract company from subject or Account_Name
  const companyName = quoteRecord.Account_Name?.name || subject.split(' - ')[1] || 'Corporate Customer';
  const customerName = quoteRecord.Contact_Name?.name || 'Customer';

  // Map Quoted_Items subform
  const items: QuotationItem[] = [];
  if (Array.isArray(quoteRecord.Quoted_Items)) {
    for (const [idx, qi] of quoteRecord.Quoted_Items.entries()) {
      const prodName = qi.Product_Name?.name || qi.Description || `Item ${idx + 1}`;
      const qty = Number(qi.Quantity) || 1;
      const unitPrice = Number(qi.List_Price) || 0;
      const totalPrice = Number(qi.Net_Total) || Number(qi.Total) || unitPrice * qty;
      const taxAmount = Number(qi.Tax) || 0;
      const gstPercent = totalPrice > 0 && taxAmount > 0 ? Math.round((taxAmount / totalPrice) * 100) : 18;

      items.push({
        id: qi.id || `zoho-item-${idx}`,
        productId: qi.Product_Name?.id || `zoho-prod-${idx}`,
        productName: prodName,
        sku: qi.Product_Name?.Product_Code || `OB-SKU-${idx + 1}`,
        indicativeUnitPrice: unitPrice,
        gstPercent,
        quantity: qty,
        indicativeTotalPrice: totalPrice,
      });
    }
  }

  const subtotal = Number(quoteRecord.Sub_Total) || items.reduce((acc, it) => acc + it.indicativeTotalPrice, 0);
  const gstAmount = Number(quoteRecord.Tax) || 0;
  const total = Number(quoteRecord.Grand_Total) || subtotal + gstAmount;

  return {
    id: quoteRecord.id,
    quotationNumber,
    customerName,
    companyName,
    email: defaultEmail || '',
    phone: '',
    preferredContactMethod: 'email',
    deliveryLocation: quoteRecord.Shipping_Street || quoteRecord.Billing_Street || undefined,
    pincode: quoteRecord.Shipping_Code || quoteRecord.Billing_Code || undefined,
    items,
    indicativeSubtotal: subtotal,
    indicativeGstAmount: gstAmount,
    indicativeTotal: total,
    status: mapZohoStageToStatus(quoteRecord.Quote_Stage),
    createdAt: quoteRecord.Created_Time || new Date().toISOString(),
    updatedAt: quoteRecord.Modified_Time,
  };
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
    // 1. Find customer Contact in Zoho CRM to obtain contact ID
    let contactId: string | undefined = undefined;
    if (cleanParam.includes('@')) {
      const profile = await getCustomerProfileFromZoho(cleanParam);
      contactId = profile?.contact?.id;
    } else {
      contactId = cleanParam;
    }

    const quotes: any[] = [];

    // 2. Query Quotes by Contact ID if available
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

    // 3. Fallback: Search Quotes by email or search word
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

    // 4. Also check recent database records to guarantee immediate visibility with zero search-index lag
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

    // 5. Fetch full record with Quoted_Items for each Quote
    const fullQuotations: Quotation[] = [];
    // Deduplicate quote IDs
    const seenIds = new Set<string>();

    for (const q of quotes) {
      if (seenIds.has(q.id)) continue;
      seenIds.add(q.id);

      try {
        // Expand full Quote record to retrieve subform Quoted_Items
        const singleRes = await zohoFetch<any>(`/Quotes/${q.id}`);
        const fullRecord = singleRes?.data?.[0] || q;
        fullQuotations.push(mapZohoQuoteToQuotation(fullRecord, cleanParam.includes('@') ? cleanParam : undefined));
      } catch {
        // Fallback to header record
        fullQuotations.push(mapZohoQuoteToQuotation(q, cleanParam.includes('@') ? cleanParam : undefined));
      }
    }

    // Sort descending by creation date
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

    // 1. Try search by Subject starts_with
    try {
      const searchRes = await zohoFetch<any>(
        `/Quotes/search?criteria=(Subject:starts_with:${encodeURIComponent(cleanParam)})&fields=id,Subject,Quote_Number`
      );
      if (searchRes?.data?.[0]?.id) {
        // Fetch full record to get Quoted_Items
        const fullRes = await zohoFetch<any>(`/Quotes/${searchRes.data[0].id}`);
        quoteRecord = fullRes?.data?.[0] || searchRes.data[0];
      }
    } catch {
      // Ignore search error and try direct ID lookup
    }

    // 2. Try direct ID lookup if not found
    if (!quoteRecord && /^\d+$/.test(cleanParam)) {
      try {
        const directRes = await zohoFetch<any>(`/Quotes/${cleanParam}`);
        quoteRecord = directRes?.data?.[0];
      } catch {
        // Not found
      }
    }

    // 3. Fallback: Check recent records directly from database
    if (!quoteRecord) {
      try {
        const recentRes = await zohoFetch<any>(
          '/Quotes?fields=id,Subject,Quote_Number,Created_Time&per_page=50'
        );
        if (Array.isArray(recentRes?.data)) {
          const match = recentRes.data.find(
            (q: any) => q.Subject && q.Subject.startsWith(cleanParam)
          );
          if (match?.id) {
            const fullRes = await zohoFetch<any>(`/Quotes/${match.id}`);
            quoteRecord = fullRes?.data?.[0] || match;
          }
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
