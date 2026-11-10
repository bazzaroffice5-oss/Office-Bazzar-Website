/**
 * Zoho CRM High-Level Synchronization Service
 *
 * Handles creation and mapping of Leads, Inquiries, Contacts, Accounts, and Quotations
 * into Zoho CRM standard modules with full data integrity.
 */

import { Quotation } from '@/types';
import { isZohoConfigured, zohoFetch } from './client';
import { syncQuotationToZohoQuote } from './quotes';

export interface ZohoSyncResult {
  success: boolean;
  leadId?: string;
  quoteId?: string;
  quoteNumber?: string;
  contactId?: string;
  accountId?: string;
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
 * Zoho CRM strictly requires `Last_Name` on the Leads and Contacts modules.
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
 * Synchronize a general contact form or bulk inquiry submission into Zoho CRM Leads
 */
/**
 * Append an immutable Audit Note to a Zoho CRM Lead (non-blocking)
 */
async function appendZohoLeadAuditNote(
  leadId: string,
  title: string,
  content: string
): Promise<void> {
  try {
    await zohoFetch(`/Leads/${leadId}/Notes`, {
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
    console.warn(`[ZohoCRM] Non-blocking warning: Failed to append Note to Lead ${leadId}:`, err?.message);
  }
}

/**
 * Synchronize a general contact form enquiry to Zoho CRM Leads.
 * Preserves historical enquiry records across repeated enquiries from the same email.
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
    const cleanEmail = enquiry.email.trim().toLowerCase();

    // Check if a Lead already exists for this email to preserve prior enquiry history
    let existingLeadDescription = '';
    try {
      const searchRes = await zohoFetch<any>(
        `/Leads/search?criteria=(Email:equals:${encodeURIComponent(cleanEmail)})&fields=id,Description`
      );
      if (Array.isArray(searchRes?.data) && searchRes.data.length > 0) {
        existingLeadDescription = searchRes.data[0]?.Description || '';
      } else {
        // Fallback for rapid repeat submissions before search indexing lag
        const recentRes = await zohoFetch<any>(
          `/Leads?fields=id,Email,Description&sort_by=Created_Time&sort_order=desc&per_page=20`
        );
        const match = recentRes?.data?.find((l: any) => l.Email?.toLowerCase() === cleanEmail);
        if (match?.Description) {
          existingLeadDescription = match.Description;
        }
      }
    } catch {
      // If search fails or returns 204, proceed with fresh description
    }

    // Preserve enquiry history in Description if lead already exists
    const combinedDescription = existingLeadDescription
      ? `${existingLeadDescription.trim()}\n\n--- Subsequent Contact Enquiry [Ref: ${enquiry.referenceNumber}] (${new Date().toISOString()}) ---\n${description}`.slice(0, 31000)
      : description;

    const leadPayload = {
      data: [
        {
          First_Name: firstName || undefined,
          Last_Name: lastName,
          Company: enquiry.companyName?.trim() || 'Individual Customer',
          Email: cleanEmail,
          Phone: enquiry.phone.trim(),
          Lead_Source: 'Website Contact Form',
          Description: combinedDescription,
        },
      ],
      duplicate_check_fields: ['Email'],
      trigger: ['approval', 'workflow', 'blueprint'],
    };

    const result = await zohoFetch<ZohoModuleResponse>('/Leads/upsert', {
      method: 'POST',
      body: JSON.stringify(leadPayload),
    });

    const firstItem = result.data?.[0];
    if (firstItem && (firstItem.code === 'SUCCESS' || firstItem.status === 'success')) {
      const leadId = firstItem.details?.id;
      const actionType = (firstItem as any)?.action === 'update' ? 'updated' : 'created';
      console.log(`[ZohoCRM] Successfully synced Contact Enquiry [${enquiry.referenceNumber}] to Zoho Lead ID: ${leadId} (${actionType})`);

      // Attach a dedicated, permanent Zoho Note for this specific enquiry event
      if (leadId) {
        await appendZohoLeadAuditNote(
          leadId,
          `Website Contact Enquiry [Ref: ${enquiry.referenceNumber}]`,
          `Reference: ${enquiry.referenceNumber}\nDate: ${new Date().toISOString()}\nSubject: ${(enquiry as any)?.subject || 'General Enquiry'}\n\n${description}`
        );
      }

      return {
        success: true,
        action: actionType,
        leadId,
      };
    }

    const errDetail = firstItem?.message || JSON.stringify(result);
    console.warn(`[ZohoCRM] Failed to create/update lead for ${enquiry.referenceNumber}:`, errDetail);
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
 * Synchronize an authoritative Request for Quotation (RFQ) into Zoho CRM Quotes module.
 * Creates/updates Contact (by Email) and Account (by Company Name), links them,
 * and creates the Quote with all Quoted_Items mapped to Zoho Products.
 */
export async function syncQuotationToZoho(
  quotation: Quotation,
  _zohoProductMapping?: Record<string, string>
): Promise<ZohoSyncResult> {
  const quoteRes = await syncQuotationToZohoQuote(quotation);
  return {
    success: quoteRes.success,
    action: quoteRes.action,
    quoteId: quoteRes.quoteId,
    quoteNumber: quoteRes.quoteNumber,
    contactId: quoteRes.contactId,
    accountId: quoteRes.accountId,
    error: quoteRes.error,
    reason: quoteRes.error,
    details: quoteRes.details,
  };
}

export interface BulkRfqLeadPayload {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  category?: string;
  requirements: string;
  estimatedQuantity?: string;
  deliveryLocation?: string;
  gstin?: string;
}

/**
 * Synchronize a Bulk / Institutional RFQ directly into Zoho CRM Leads module
 */
export async function syncBulkRfqToZohoLead(rfq: BulkRfqLeadPayload): Promise<ZohoSyncResult> {
  if (!(await isZohoConfigured())) {
    return {
      success: true,
      action: 'skipped',
    };
  }

  try {
    const { firstName, lastName } = parseCustomerName(rfq.contactPerson);
    const description = [
      `=== WEBSITE INSTITUTIONAL BULK RFQ ===`,
      `Company: ${rfq.companyName}`,
      `Contact Person: ${rfq.contactPerson}`,
      `Email: ${rfq.email}`,
      `Phone: ${rfq.phone}`,
      rfq.gstin ? `GSTIN: ${rfq.gstin}` : '',
      rfq.category ? `Category: ${rfq.category}` : '',
      rfq.estimatedQuantity ? `Estimated Spend / Quantity: ${rfq.estimatedQuantity}` : '',
      rfq.deliveryLocation ? `Delivery Location: ${rfq.deliveryLocation}` : '',
      ``,
      `--- Detailed Requirements ---`,
      rfq.requirements,
      `======================================`,
    ].filter(Boolean).join('\n');

    const cleanEmail = rfq.email.trim().toLowerCase();

    // Check if a Lead already exists for this email to preserve prior enquiry history
    let existingLeadDescription = '';
    try {
      const searchRes = await zohoFetch<any>(
        `/Leads/search?criteria=(Email:equals:${encodeURIComponent(cleanEmail)})&fields=id,Description`
      );
      if (Array.isArray(searchRes?.data) && searchRes.data.length > 0) {
        existingLeadDescription = searchRes.data[0]?.Description || '';
      } else {
        // Fallback for rapid repeat submissions before search indexing lag
        const recentRes = await zohoFetch<any>(
          `/Leads?fields=id,Email,Description&sort_by=Created_Time&sort_order=desc&per_page=20`
        );
        const match = recentRes?.data?.find((l: any) => l.Email?.toLowerCase() === cleanEmail);
        if (match?.Description) {
          existingLeadDescription = match.Description;
        }
      }
    } catch {
      // If search fails or returns 204, proceed with fresh description
    }

    const combinedDescription = existingLeadDescription
      ? `${existingLeadDescription.trim()}\n\n--- Subsequent Institutional RFQ (${new Date().toISOString()}) ---\n${description}`.slice(0, 31000)
      : description;

    const leadPayload = {
      data: [
        {
          First_Name: firstName || undefined,
          Last_Name: lastName,
          Company: rfq.companyName.trim() || 'Institutional Customer',
          Email: cleanEmail,
          Phone: rfq.phone.trim(),
          Lead_Source: 'Website Institutional RFQ',
          Description: combinedDescription,
          City: rfq.deliveryLocation || undefined,
        },
      ],
      duplicate_check_fields: ['Email'],
      trigger: ['approval', 'workflow', 'blueprint'],
    };

    const result = await zohoFetch<ZohoModuleResponse>('/Leads/upsert', {
      method: 'POST',
      body: JSON.stringify(leadPayload),
    });

    const firstItem = result.data?.[0];
    if (firstItem && (firstItem.code === 'SUCCESS' || firstItem.status === 'success')) {
      const leadId = firstItem.details?.id;
      const actionType = (firstItem as any)?.action === 'update' ? 'updated' : 'created';
      console.log(`[ZohoCRM] Successfully synced Bulk RFQ to Zoho Lead ID: ${leadId} (${actionType})`);

      // Attach a dedicated, permanent Zoho Note for this specific RFQ event
      if (leadId) {
        await appendZohoLeadAuditNote(
          leadId,
          `Website Institutional RFQ [${rfq.companyName || 'Corporate Customer'}]`,
          `Date: ${new Date().toISOString()}\nCompany: ${rfq.companyName}\nRequirements:\n${description}`
        );
      }

      return {
        success: true,
        action: actionType,
        leadId,
      };
    }

    return {
      success: false,
      action: 'failed',
      error: firstItem?.message || 'Failed to create Lead in Zoho CRM',
    };
  } catch (err) {
    return {
      success: false,
      action: 'failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
