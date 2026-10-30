/**
 * Zoho CRM High-Level Synchronization Service
 *
 * Handles creation and mapping of Leads, Inquiries, and Quotations
 * into Zoho CRM standard modules with full data integrity.
 */

import { Quotation } from '@/types';
import { isZohoConfigured, zohoFetch } from './client';

export interface ZohoSyncResult {
  success: boolean;
  leadId?: string;
  quoteId?: string;
  action?: 'created' | 'updated' | 'skipped' | 'failed';
  error?: string;
  reason?: string;
  details?: unknown;
}

export interface ContactEnquiryPayload {
  referenceNumber: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  message: string;
  submittedAt?: string;
  deliveryLocation?: string;
}

interface ZohoApiResponseItem {
  code: string;
  details?: {
    id?: string;
    [key: string]: unknown;
  };
  message: string;
  status: string;
}

interface ZohoModuleResponse {
  data?: ZohoApiResponseItem[];
  info?: unknown;
}

/**
 * Split a full name into First_Name and Last_Name.
 * Zoho CRM strictly requires `Last_Name` on the Leads module.
 */
export function parseCustomerName(fullName: string = ''): { firstName: string; lastName: string } {
  const clean = fullName.trim().replace(/\s+/g, ' ');
  if (!clean) {
    return { firstName: '', lastName: 'Valued Customer' };
  }

  const parts = clean.split(' ');
  if (parts.length === 1) {
    return { firstName: '', lastName: parts[0] };
  }

  const firstName = parts.slice(0, -1).join(' ');
  const lastName = parts[parts.length - 1];
  return { firstName, lastName };
}

/**
 * Format a multi-line formatted inquiry description preserving all submission details
 */
function buildContactDescription(enquiry: ContactEnquiryPayload): string {
  const lines: string[] = [
    `=== WEBSITE CONTACT INQUIRY ===`,
    `Reference Number: ${enquiry.referenceNumber}`,
    `Submitted At: ${enquiry.submittedAt || new Date().toISOString()}`,
    `Contact Name: ${enquiry.name}`,
    `Company: ${enquiry.companyName || 'Not Specified'}`,
    `Email: ${enquiry.email}`,
    `Phone: ${enquiry.phone}`,
    enquiry.deliveryLocation ? `Location/Source: ${enquiry.deliveryLocation}` : '',
    ``,
    `--- Customer Message ---`,
    enquiry.message,
    `================================`,
  ];

  return lines.filter(Boolean).join('\n');
}

/**
 * Format a comprehensive RFQ product manifest description
 */
function buildQuotationDescription(quotation: Quotation): string {
  const lines: string[] = [
    `=== WEBSITE REQUEST FOR QUOTATION (RFQ) ===`,
    `RFQ Number: ${quotation.quotationNumber}`,
    `Submitted At: ${quotation.createdAt || new Date().toISOString()}`,
    `Customer: ${quotation.customerName}`,
    `Company: ${quotation.companyName || 'Not Specified'}`,
    `Email: ${quotation.email}`,
    `Phone: ${quotation.phone}`,
    quotation.gstin ? `GSTIN: ${quotation.gstin}` : '',
    quotation.pincode ? `Delivery PIN Code: ${quotation.pincode}` : '',
    quotation.deliveryLocation ? `Delivery Address: ${quotation.deliveryLocation}` : '',
    quotation.preferredContactMethod ? `Preferred Contact: ${quotation.preferredContactMethod}` : '',
    quotation.additionalRequirements ? `\n--- Special Requirements ---\n${quotation.additionalRequirements}` : '',
    ``,
    `--- Requested Products & Quantities (${quotation.items.length} items) ---`,
  ];

  quotation.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. [${item.sku || 'SKU-N/A'}] ${item.productName} | Qty: ${item.quantity} ${item.packSize || 'Units'} | Indicative Unit: ₹${item.indicativeUnitPrice} (+${item.gstPercent}% GST) | Total: ₹${item.indicativeTotalPrice}`
    );
  });

  lines.push(``);
  lines.push(`Subtotal: ₹${quotation.indicativeSubtotal.toFixed(2)}`);
  lines.push(`GST Amount: ₹${quotation.indicativeGstAmount.toFixed(2)}`);
  lines.push(`Indicative Total: ₹${quotation.indicativeTotal.toFixed(2)}`);
  lines.push(`===========================================`);

  return lines.filter(Boolean).join('\n');
}

/**
 * Synchronize a general contact form or bulk inquiry submission into Zoho CRM Leads
 */
export async function syncContactEnquiryToZoho(
  enquiry: ContactEnquiryPayload
): Promise<ZohoSyncResult> {
  if (!(await isZohoConfigured())) {
    console.log('[ZohoCRM] Service unconfigured. Skipping CRM sync for contact enquiry:', enquiry.referenceNumber);
    return {
      success: false,
      action: 'skipped',
      reason: 'Zoho CRM credentials (ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN) not set in environment.',
    };
  }

  try {
    const { firstName, lastName } = parseCustomerName(enquiry.name);
    const description = buildContactDescription(enquiry);

    const leadPayload = {
      data: [
        {
          First_Name: firstName || undefined,
          Last_Name: lastName,
          Company: enquiry.companyName?.trim() || 'Individual Customer',
          Email: enquiry.email.trim().toLowerCase(),
          Phone: enquiry.phone.trim(),
          Lead_Source: 'Website Contact Form',
          Description: description,
        },
      ],
      trigger: ['approval', 'workflow', 'blueprint'],
    };

    const result = await zohoFetch<ZohoModuleResponse>('/Leads', {
      method: 'POST',
      body: JSON.stringify(leadPayload),
    });

    const firstItem = result.data?.[0];
    if (firstItem && (firstItem.code === 'SUCCESS' || firstItem.status === 'success')) {
      const leadId = firstItem.details?.id;
      console.log(`[ZohoCRM] Successfully synced Contact Enquiry [${enquiry.referenceNumber}] to Zoho Lead ID: ${leadId}`);
      return {
        success: true,
        action: 'created',
        leadId,
      };
    }

    const errDetail = firstItem?.message || JSON.stringify(result);
    console.warn(`[ZohoCRM] Failed to create lead for ${enquiry.referenceNumber}:`, errDetail);
    return {
      success: false,
      action: 'failed',
      error: `Zoho CRM responded: ${errDetail}`,
      details: result,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ZohoCRM] Exception during contact sync [${enquiry.referenceNumber}]:`, err);
    return {
      success: false,
      action: 'failed',
      error: errMsg,
    };
  }
}

/**
 * Synchronize an authoritative Request for Quotation (RFQ) into Zoho CRM.
 *
 * 1. Creates/Upserts a Lead in Zoho CRM with full customer and order details.
 * 2. ONLY creates a formal Quotes module record if valid Zoho Product catalog IDs
 *    are supplied and all line-item requirements are satisfied.
 */
export async function syncQuotationToZoho(
  quotation: Quotation,
  zohoProductMapping?: Record<string, string>
): Promise<ZohoSyncResult> {
  if (!(await isZohoConfigured())) {
    console.log('[ZohoCRM] Service unconfigured. Skipping CRM sync for quotation:', quotation.quotationNumber);
    return {
      success: false,
      action: 'skipped',
      reason: 'Zoho CRM credentials (ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN) not set in environment.',
    };
  }

  try {
    const { firstName, lastName } = parseCustomerName(quotation.customerName);
    const description = buildQuotationDescription(quotation);

    // 1. Create Lead in Zoho CRM
    const leadPayload = {
      data: [
        {
          First_Name: firstName || undefined,
          Last_Name: lastName,
          Company: quotation.companyName?.trim() || 'Corporate RFQ Customer',
          Email: quotation.email.trim().toLowerCase(),
          Phone: quotation.phone.trim(),
          Lead_Source: 'Website RFQ',
          Zip_Code: quotation.pincode?.trim() || undefined,
          Street: quotation.deliveryLocation?.trim() || undefined,
          Description: description,
        },
      ],
      trigger: ['approval', 'workflow', 'blueprint'],
    };

    const leadResponse = await zohoFetch<ZohoModuleResponse>('/Leads', {
      method: 'POST',
      body: JSON.stringify(leadPayload),
    });

    const leadItem = leadResponse.data?.[0];
    const leadId = leadItem?.details?.id;

    if (!leadItem || (leadItem.code !== 'SUCCESS' && leadItem.status !== 'success')) {
      const errDetail = leadItem?.message || JSON.stringify(leadResponse);
      console.warn(`[ZohoCRM] Failed to create lead for quotation ${quotation.quotationNumber}:`, errDetail);
      return {
        success: false,
        action: 'failed',
        error: `Zoho CRM Lead creation failed: ${errDetail}`,
        details: leadResponse,
      };
    }

    console.log(`[ZohoCRM] Created Lead [${leadId}] for RFQ ${quotation.quotationNumber}`);

    // 2. Formal Zoho Quotes Module evaluation
    // STRICT REQUIREMENT: "Do not create formal Zoho Quotes unless valid Zoho Product
    // mappings and required line-item information exist."
    const hasProductMapping = Boolean(
      zohoProductMapping && Object.keys(zohoProductMapping).length > 0
    );

    let canCreateFormalQuote = false;
    if (hasProductMapping && quotation.items.length > 0) {
      // Check if every line item has a mapped Zoho Product ID
      canCreateFormalQuote = quotation.items.every(
        (it) => zohoProductMapping![it.productId] || (it.sku && zohoProductMapping![it.sku])
      );
    }

    if (!canCreateFormalQuote) {
      console.log(
        `[ZohoCRM] RFQ ${quotation.quotationNumber} preserved in Zoho Leads. Skipping formal Quotes record creation because direct Zoho Product catalog IDs are not mapped.`
      );
      return {
        success: true,
        action: 'created',
        leadId,
        reason: 'Quotation details and full product list preserved in Zoho Lead Description. Formal Quote creation deferred until Zoho Product catalog mappings are configured.',
      };
    }

    // 3. If products are mapped, create formal Quote in Zoho CRM
    try {
      const quotedItems = quotation.items.map((it) => {
        const zohoProdId =
          zohoProductMapping![it.productId] || (it.sku ? zohoProductMapping![it.sku] : undefined);
        return {
          Product_Name: { id: zohoProdId },
          Quantity: it.quantity,
          List_Price: it.indicativeUnitPrice,
          Net_Total: it.indicativeTotalPrice,
          Tax: it.indicativeTotalPrice * (it.gstPercent / 100),
        };
      });

      const quotePayload = {
        data: [
          {
            Subject: `RFQ ${quotation.quotationNumber} - ${quotation.companyName}`,
            Quote_Stage: 'Draft',
            Valid_Till: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            Contact_Name: leadId ? { id: leadId } : undefined,
            Quoted_Items: quotedItems,
            Sub_Total: quotation.indicativeSubtotal,
            Tax: quotation.indicativeGstAmount,
            Grand_Total: quotation.indicativeTotal,
            Description: description,
          },
        ],
        trigger: ['approval', 'workflow'],
      };

      const quoteResponse = await zohoFetch<ZohoModuleResponse>('/Quotes', {
        method: 'POST',
        body: JSON.stringify(quotePayload),
      });

      const quoteItem = quoteResponse.data?.[0];
      const quoteId = quoteItem?.details?.id;

      if (quoteItem && (quoteItem.code === 'SUCCESS' || quoteItem.status === 'success')) {
        console.log(`[ZohoCRM] Created formal Quote [${quoteId}] for RFQ ${quotation.quotationNumber}`);
        return {
          success: true,
          action: 'created',
          leadId,
          quoteId,
        };
      }

      console.warn(`[ZohoCRM] Formal Quote creation rejected, Lead [${leadId}] retained:`, quoteItem?.message);
      return {
        success: true,
        action: 'created',
        leadId,
        reason: `Lead created, but formal Quote could not be created: ${quoteItem?.message}`,
      };
    } catch (quoteErr) {
      console.warn(`[ZohoCRM] Error generating formal Quote, Lead [${leadId}] retained:`, quoteErr);
      return {
        success: true,
        action: 'created',
        leadId,
        reason: 'Lead created successfully. Formal Quote creation failed gracefully.',
      };
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ZohoCRM] Exception during quotation sync [${quotation.quotationNumber}]:`, err);
    return {
      success: false,
      action: 'failed',
      error: errMsg,
    };
  }
}

