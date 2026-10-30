import { Resend } from 'resend';
import { Quotation, NotificationLog } from '@/types';
import { BUSINESS_CONFIG } from '@/lib/config/business';
import {
  createNotificationLog,
  updateNotificationLog,
  getNotificationLogs,
  getQuotationById,
} from '@/lib/db/store';

export interface NotificationResult {
  channel: NotificationLog['channel'];
  recipient: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
}

export interface QuoteEmailNotificationResult {
  success: boolean;
  messageId?: string;
  provider: 'resend' | 'simulated' | 'unconfigured';
  isDuplicate?: boolean;
  to: string;
  cc: string;
  error?: string;
}

export interface ContactUsSubmission {
  id?: string;
  referenceNumber: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  message: string;
  submittedAt: string;
}

export interface ContactEmailNotificationResult {
  success: boolean;
  messageId?: string;
  provider: 'resend' | 'simulated' | 'unconfigured';
  to: string;
  cc: string;
  error?: string;
}

let resendClient: Resend | null = null;
let cachedApiKey: string | null = null;

/**
 * Get or initialize the official Resend SDK client
 */
export function getResendClient(): Resend | null {
  const apiKey = (process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || '').trim();
  if (!apiKey) return null;
  if (!resendClient || cachedApiKey !== apiKey) {
    resendClient = new Resend(apiKey);
    cachedApiKey = apiKey;
  }
  return resendClient;
}

/**
 * Resolve verified sender address for transactional & administrative alerts
 */
export function getEmailFromAddress(): string {
  const configuredFrom = (process.env.EMAIL_FROM_ADDRESS || '').replace(/[\r\n]/g, '').trim();
  if (configuredFrom) {
    return configuredFrom;
  }
  return 'Office Bazzar <quotes@officebazzar.com>';
}

/**
 * Resolve authorized recipient mailboxes for internal company alerts
 */
export function getNotificationRecipients(): { salesEmail: string; marketingEmail: string } {
  const salesEmail = (
    process.env.QUOTE_SALES_EMAIL ||
    BUSINESS_CONFIG.contact.salesEmail ||
    'sales4@officebazzar.com'
  ).replace(/[\r\n]/g, '').trim();

  const marketingEmail = (
    process.env.QUOTE_MARKETING_EMAIL ||
    BUSINESS_CONFIG.contact.marketingEmail ||
    'marketing@officebazzar.com'
  ).replace(/[\r\n]/g, '').trim();

  return { salesEmail, marketingEmail };
}

// In-memory set of quotation identifiers that have successfully dispatched emails
// Prevents duplicate emails if users double-click submit or network retries occur
const sentQuoteEmailKeys = new Set<string>();

/**
 * Clear the duplicate-suppression cache (useful for automated testing)
 */
export function clearSentQuoteEmailKeys(): void {
  sentQuoteEmailKeys.clear();
}

/**
 * Format safe error diagnostics from Resend API responses without exposing secrets
 */
function formatResendError(error: { message: string; name?: string; statusCode?: number | null }): string {
  const status = error.statusCode;
  if (status === 401 || (error.name === 'validation_error' && /api key/i.test(error.message))) {
    return `Resend authentication failed (401 Invalid API Key): ${error.message}`;
  }
  if (status === 403 || /domain.*not verified/i.test(error.message)) {
    return `Resend domain verification error (403): ${error.message}`;
  }
  return `Resend error${status ? ` (${status})` : ''}: ${error.message}`;
}

/**
 * Format plain-text email message for administrative, sales, and marketing staff
 */
export function buildQuotationEmailText(
  quotation: Quotation,
  salesEmail: string = 'sales4@officebazzar.com',
  marketingEmail: string = 'marketing@officebazzar.com'
): string {
  const siteUrl = BUSINESS_CONFIG.websiteUrl;
  const adminUrl = `${siteUrl}/admin?tab=quotations&quote=${encodeURIComponent(quotation.quotationNumber)}`;

  const itemsText = quotation.items
    .map((item, idx) => {
      const productUrl = `${siteUrl}/product/${item.productId || item.sku}`;
      return `${idx + 1}. [${item.sku}] ${item.productName}
   Product Link: ${productUrl}
   Quantity: ${item.quantity} ${item.packSize || 'Units'} | Indicative Unit: ₹${item.indicativeUnitPrice.toLocaleString('en-IN')} | Indicative Total: ₹${item.indicativeTotalPrice.toLocaleString('en-IN')}`;
    })
    .join('\n\n');

  const photoText =
    quotation.photoUrls && quotation.photoUrls.length > 0
      ? quotation.photoUrls.map((url, i) => `   Attachment ${i + 1}: ${url}`).join('\n')
      : '   None';

  return `OFFICEBAZZAR REQUEST FOR QUOTATION (RFQ)
==================================================
Reference Number : ${quotation.quotationNumber}
Submission Time  : ${new Date(quotation.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST (${quotation.createdAt})
Notification To  : TO: ${salesEmail} | CC: ${marketingEmail}
Status           : NEW (Awaiting Sales & Marketing Review)

CUSTOMER & BUSINESS DETAILS:
--------------------------------------------------
Customer Name    : ${quotation.customerName}
Company Name     : ${quotation.companyName || 'Not Provided'}
Business Email   : ${quotation.email}
Phone Number     : ${quotation.phone}
GSTIN            : ${quotation.gstin || 'Not Provided'}
Delivery Location: ${quotation.deliveryLocation ? `${quotation.deliveryLocation} - ` : ''}PIN ${quotation.pincode}
Preferred Contact: ${quotation.preferredContactMethod.toUpperCase()}

CUSTOMER REQUIREMENTS / MESSAGE:
--------------------------------------------------
${quotation.additionalRequirements || 'None specified'}

REQUESTED PRODUCTS (${quotation.items.length} Line Items):
--------------------------------------------------
${itemsText}

INDICATIVE ESTIMATE:
--------------------------------------------------
Subtotal (Excl. Tax) : ₹${quotation.indicativeSubtotal.toLocaleString('en-IN')}
Estimated GST (18%)  : ₹${quotation.indicativeGstAmount.toLocaleString('en-IN')}
Estimated Total      : ₹${quotation.indicativeTotal.toLocaleString('en-IN')}

ATTACHMENTS:
--------------------------------------------------
${photoText}

ADMIN REVIEW INTERFACE:
--------------------------------------------------
Authorized staff can review and action this quote request at:
${adminUrl}

==================================================
NOTE: This is an internal quotation notification.
Both Sales (${salesEmail}) and Marketing (${marketingEmail}) have received this enquiry.
Stock has NOT been decremented and no payment has been collected.
`;
}

/**
 * Format HTML email message for administrative, sales, and marketing staff
 */
export function buildQuotationEmailHtml(
  quotation: Quotation,
  salesEmail: string = 'sales4@officebazzar.com',
  marketingEmail: string = 'marketing@officebazzar.com'
): string {
  const siteUrl = BUSINESS_CONFIG.websiteUrl;
  const adminUrl = `${siteUrl}/admin?tab=quotations&quote=${encodeURIComponent(quotation.quotationNumber)}`;

  const itemsRows = quotation.items
    .map((item) => {
      const productUrl = `${siteUrl}/product/${item.productId || item.sku}`;
      return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 10px; font-size: 13px; color: #111827;">
          <a href="${productUrl}" target="_blank" style="color: #1d4ed8; text-decoration: none; font-weight: 700; font-size: 13px;">${item.productName}</a><br />
          <span style="color: #6b7280; font-size: 12px;">SKU: ${item.sku} | Pack: ${item.packSize || 'Standard'}</span><br />
          <a href="${productUrl}" target="_blank" style="color: #2563eb; font-size: 11px; text-decoration: underline; margin-top: 4px; display: inline-block;">View Product Page &rarr;</a>
        </td>
        <td style="padding: 12px 10px; font-size: 13px; text-align: center; color: #111827; font-weight: 600;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 10px; font-size: 13px; text-align: right; color: #4b5563;">
          ₹${item.indicativeUnitPrice.toLocaleString('en-IN')}
        </td>
        <td style="padding: 12px 10px; font-size: 13px; text-align: right; color: #111827; font-weight: 600;">
          ₹${item.indicativeTotalPrice.toLocaleString('en-IN')}
        </td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Quote Request — Office Bazzar</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
    
    <!-- Header -->
    <div style="background-color: #d9232d; padding: 20px 24px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">OfficeBazzar &bull; Quotation Alert</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">New Request for Quotation Received</p>
    </div>

    <!-- Recipients Notice Banner -->
    <div style="background-color: #eff6ff; border-bottom: 1px solid #dbeafe; padding: 10px 24px; font-size: 12px; color: #1e40af;">
      <strong>Notification Recipients:</strong>
      &nbsp;TO: <a href="mailto:${salesEmail}" style="color: #1d4ed8; font-weight: 600; text-decoration: none;">${salesEmail}</a>
      &nbsp;&bull;&nbsp;CC: <a href="mailto:${marketingEmail}" style="color: #1d4ed8; font-weight: 600; text-decoration: none;">${marketingEmail}</a>
    </div>

    <!-- Reference Banner -->
    <div style="background-color: #fef2f2; border-bottom: 1px solid #fee2e2; padding: 14px 24px; display: flex; justify-content: space-between;">
      <div>
        <span style="font-size: 12px; color: #991b1b; text-transform: uppercase; font-weight: 700;">Quotation Reference</span>
        <div style="font-size: 18px; font-weight: 800; color: #d9232d;">${quotation.quotationNumber}</div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 12px; color: #6b7280;">Submission Time</span>
        <div style="font-size: 13px; color: #111827; font-weight: 600;">
          ${new Date(quotation.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
        </div>
      </div>
    </div>

    <div style="padding: 24px;">
      <!-- Customer Details -->
      <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #374151; letter-spacing: 0.5px; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">
        Business &amp; Contact Information
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #6b7280; width: 35%;">Customer Name:</td>
          <td style="padding: 6px 0; color: #111827; font-weight: 600;">${quotation.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Company Name:</td>
          <td style="padding: 6px 0; color: #111827; font-weight: 600;">${quotation.companyName || '<em>Not Provided</em>'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Business Email:</td>
          <td style="padding: 6px 0; color: #111827;"><a href="mailto:${quotation.email}" style="color: #d9232d;">${quotation.email}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Phone Number:</td>
          <td style="padding: 6px 0; color: #111827;"><a href="tel:${quotation.phone}" style="color: #d9232d;">${quotation.phone}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">GSTIN:</td>
          <td style="padding: 6px 0; color: #111827; font-weight: 600;">${quotation.gstin || '<em style="color:#9ca3af">Not Provided</em>'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Delivery PIN / Location:</td>
          <td style="padding: 6px 0; color: #111827;">${quotation.deliveryLocation ? `${quotation.deliveryLocation} - ` : ''}<strong>PIN: ${quotation.pincode}</strong></td>
        </tr>
        ${
          quotation.photoUrls && quotation.photoUrls.length > 0
            ? `<tr>
          <td style="padding: 6px 0; color: #6b7280;">Uploaded Photos:</td>
          <td style="padding: 6px 0; color: #111827;">
            <strong>${quotation.photoUrls.length} file(s)</strong> attached:
            <ul style="margin: 4px 0 0 16px; padding: 0;">
              ${quotation.photoUrls.map((url, i) => `<li><a href="${url}" target="_blank" style="color: #2563eb;">View Photo ${i + 1}</a></li>`).join('')}
            </ul>
          </td>
        </tr>`
            : ''
        }
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Preferred Contact:</td>
          <td style="padding: 6px 0; color: #111827; text-transform: uppercase; font-weight: 600;">${quotation.preferredContactMethod}</td>
        </tr>
      </table>

      <!-- Customer Requirements / Message -->
      ${
        quotation.additionalRequirements
          ? `
        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
          <div style="font-size: 12px; color: #1e40af; font-weight: 700; text-transform: uppercase;">Requirements / Message:</div>
          <div style="font-size: 13px; color: #1e293b; margin-top: 4px; white-space: pre-wrap;">${quotation.additionalRequirements}</div>
        </div>
      `
          : ''
      }

      <!-- Requested Products -->
      <h3 style="font-size: 14px; text-transform: uppercase; color: #374151; letter-spacing: 0.5px; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px; margin-top: 24px;">
        Requested Products (${quotation.items.length} Items)
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 8px 10px; text-align: left; font-size: 12px; color: #6b7280;">Product</th>
            <th style="padding: 8px 10px; text-align: center; font-size: 12px; color: #6b7280;">Qty</th>
            <th style="padding: 8px 10px; text-align: right; font-size: 12px; color: #6b7280;">Unit (₹)</th>
            <th style="padding: 8px 10px; text-align: right; font-size: 12px; color: #6b7280;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 8px 10px; text-align: right; font-size: 13px; color: #4b5563;">Indicative Subtotal:</td>
            <td style="padding: 8px 10px; text-align: right; font-size: 13px; color: #111827; font-weight: 600;">₹${quotation.indicativeSubtotal.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 4px 10px; text-align: right; font-size: 13px; color: #4b5563;">Indicative GST (18%):</td>
            <td style="padding: 4px 10px; text-align: right; font-size: 13px; color: #111827; font-weight: 600;">₹${quotation.indicativeGstAmount.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td colspan="3" style="padding: 10px; text-align: right; font-size: 14px; color: #111827; font-weight: 700;">Indicative Total:</td>
            <td style="padding: 10px; text-align: right; font-size: 15px; color: #d9232d; font-weight: 800;">₹${quotation.indicativeTotal.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="${adminUrl}" style="background-color: #d9232d; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
          Open Quotation in Admin Dashboard &rarr;
        </a>
      </div>

      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 12px;">
        Note: This is an internal notification for OfficeBazzar Sales and Marketing teams. This request does not alter live product inventory until an official sales order is confirmed.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Format plain-text confirmation email message for the requesting customer
 */
export function buildCustomerQuotationEmailText(quotation: Quotation): string {
  const siteUrl = BUSINESS_CONFIG.websiteUrl;
  const itemsText = quotation.items
    .map((item, idx) => {
      return `${idx + 1}. [${item.sku}] ${item.productName}
   Quantity: ${item.quantity} ${item.packSize || 'Units'} | Indicative Unit: ₹${item.indicativeUnitPrice.toLocaleString('en-IN')} | Indicative Total: ₹${item.indicativeTotalPrice.toLocaleString('en-IN')}`;
    })
    .join('\n\n');

  return `OFFICEBAZZAR — QUOTATION REQUEST CONFIRMATION
==================================================
Dear ${quotation.customerName},

Thank you for choosing Office Bazzar. We have received your Request for Quotation (RFQ).
Our commercial desk is reviewing your requirements to provide customized wholesale and volume-tier pricing.

Quotation Reference : ${quotation.quotationNumber}
Submission Time     : ${new Date(quotation.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
Company Name        : ${quotation.companyName || 'Not Specified'}
Delivery Location   : ${quotation.deliveryLocation ? `${quotation.deliveryLocation} - ` : ''}PIN ${quotation.pincode}

REQUESTED PRODUCTS:
--------------------------------------------------
${itemsText}

INDICATIVE PRICING ESTIMATE:
--------------------------------------------------
Subtotal (Excl. Tax) : ₹${quotation.indicativeSubtotal.toLocaleString('en-IN')}
Estimated 18% GST    : ₹${quotation.indicativeGstAmount.toLocaleString('en-IN')}
Indicative Total     : ₹${quotation.indicativeTotal.toLocaleString('en-IN')}

NEXT STEPS:
Our B2B sales team is preparing your official tax quotation with applicable volume discounts. A dedicated sales manager will contact you within 2 business hours.

Need urgent assistance?
Phone: +91 7200800040 / +91 7825886622
Email: sales4@officebazzar.com
Officebazzar E-Store Private Limited, Royapettah, Chennai - 600014
Website: ${siteUrl}`;
}

/**
 * Format rich HTML confirmation email message for the requesting customer
 */
export function buildCustomerQuotationEmailHtml(quotation: Quotation): string {
  const itemsRows = quotation.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 10px; font-size: 13px; color: #111827;">
        <strong>${item.productName}</strong>
        <div style="font-size: 11px; color: #6b7280; font-family: monospace;">SKU: ${item.sku} &bull; Pack: ${item.packSize || 'Standard Pack'}</div>
      </td>
      <td style="padding: 10px; text-align: center; font-size: 13px; color: #111827; font-weight: 600;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right; font-size: 13px; color: #4b5563;">₹${item.indicativeUnitPrice.toLocaleString('en-IN')}</td>
      <td style="padding: 10px; text-align: right; font-size: 13px; color: #111827; font-weight: 600;">₹${item.indicativeTotalPrice.toLocaleString('en-IN')}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation Request Confirmed — ${quotation.quotationNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background-color: #004b87; padding: 24px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Office Bazzar</h1>
      <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">B2B Corporate Wholesale &bull; Request for Quotation</p>
    </div>

    <!-- Confirmation Banner -->
    <div style="background-color: #f0fdf4; border-bottom: 1px solid #dcfce7; padding: 18px 24px;">
      <div>
        <span style="font-size: 12px; color: #166534; font-weight: 700; text-transform: uppercase;">Quotation Request Confirmed</span>
        <div style="font-size: 20px; font-weight: 800; color: #15803d; font-family: monospace; margin-top: 2px;">
          ${quotation.quotationNumber}
        </div>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #374151;">
          Dear <strong>${quotation.customerName}</strong>, thank you for your enquiry. We have received your quotation request and assigned it to our commercial sales desk.
        </p>
      </div>
    </div>

    <div style="padding: 24px;">
      <!-- Details Table -->
      <h3 style="margin-top: 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
        Submission Summary
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 35%;">Company Name:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${quotation.companyName || 'Not Specified'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Registered Email:</td>
          <td style="padding: 6px 0; color: #0f172a;">${quotation.email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Contact Phone:</td>
          <td style="padding: 6px 0; color: #0f172a;">${quotation.phone}</td>
        </tr>
        ${quotation.gstin ? `<tr>
          <td style="padding: 6px 0; color: #64748b;">GSTIN:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${quotation.gstin}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Delivery Location:</td>
          <td style="padding: 6px 0; color: #0f172a;">${quotation.deliveryLocation ? `${quotation.deliveryLocation} - ` : ''}PIN: ${quotation.pincode}</td>
        </tr>
      </table>

      <!-- Line Items -->
      <h3 style="font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px;">
        Requested Products (${quotation.items.length} Items)
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <th style="padding: 8px 10px; text-align: left; font-size: 12px; color: #64748b;">Product</th>
            <th style="padding: 8px 10px; text-align: center; font-size: 12px; color: #64748b;">Qty</th>
            <th style="padding: 8px 10px; text-align: right; font-size: 12px; color: #64748b;">Unit (₹)</th>
            <th style="padding: 8px 10px; text-align: right; font-size: 12px; color: #64748b;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 8px 10px; text-align: right; font-size: 13px; color: #64748b;">Indicative Subtotal:</td>
            <td style="padding: 8px 10px; text-align: right; font-size: 13px; color: #0f172a; font-weight: 600;">₹${quotation.indicativeSubtotal.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 4px 10px; text-align: right; font-size: 13px; color: #64748b;">Estimated 18% GST:</td>
            <td style="padding: 4px 10px; text-align: right; font-size: 13px; color: #0f172a; font-weight: 600;">₹${quotation.indicativeGstAmount.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="border-top: 1px solid #e2e8f0;">
            <td colspan="3" style="padding: 10px; text-align: right; font-size: 14px; color: #0f172a; font-weight: 700;">Indicative Total:</td>
            <td style="padding: 10px; text-align: right; font-size: 15px; color: #004b87; font-weight: 800;">₹${quotation.indicativeTotal.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Next Steps Callout -->
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #0f172a; font-weight: 700;">What happens next?</h4>
        <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
          Our dedicated institutional sales desk is reviewing your items for wholesale tier pricing. We will contact you with an official tax quotation and dispatch timeline within 2 business hours.
        </p>
      </div>

      <!-- Support Footer -->
      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.6;">
        Officebazzar E-Store Private Limited &bull; Royapettah, Chennai - 600014<br />
        Sales Desk: <a href="mailto:sales4@officebazzar.com" style="color: #004b87;">sales4@officebazzar.com</a> &bull; Phone: +91 7200800040 / +91 7825886622<br />
        Website: <a href="https://officebazzar.com" style="color: #004b87;">https://officebazzar.com</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send quotation acknowledgement email to the requesting customer
 */
export async function sendCustomerQuotationEmail(
  quotation: Quotation
): Promise<QuoteEmailNotificationResult> {
  const customerEmail = quotation.email.trim().toLowerCase();
  const dedupKey = `cust_${quotation.idempotencyKey || quotation.id || quotation.quotationNumber}`;

  if (sentQuoteEmailKeys.has(dedupKey)) {
    console.log(`[NotificationService:CustomerEmail] Skipping duplicate send for customer ${customerEmail}`);
    return {
      success: true,
      isDuplicate: true,
      provider: 'simulated',
      to: customerEmail,
      cc: '',
    };
  }

  const subject = `Quotation Request Confirmed — ${quotation.quotationNumber} | Office Bazzar`;
  const html = buildCustomerQuotationEmailHtml(quotation);
  const text = buildCustomerQuotationEmailText(quotation);

  const resend = getResendClient();
  const fromAddress = getEmailFromAddress();

  if (!resend) {
    if (process.env.EMAIL_SIMULATION_MODE === 'true') {
      console.log(`[NotificationService:CustomerEmail:Simulated] Simulated send to ${customerEmail}`);
      sentQuoteEmailKeys.add(dedupKey);
      return {
        success: true,
        messageId: `sim_cust_${Date.now()}`,
        provider: 'simulated',
        to: customerEmail,
        cc: '',
      };
    }

    const unconfiguredErr = 'Email service unconfigured: RESEND_API_KEY is not set in server environment.';
    console.warn(`[NotificationService:CustomerEmail] ${unconfiguredErr}`);
    return {
      success: false,
      error: unconfiguredErr,
      provider: 'unconfigured',
      to: customerEmail,
      cc: '',
    };
  }

  try {
    const { data, error } = await resend.emails.send(
      {
        from: fromAddress,
        to: [customerEmail],
        replyTo: 'sales4@officebazzar.com',
        subject,
        html,
        text,
      },
      { idempotencyKey: `ob-cust-${dedupKey}` }
    );

    if (error) {
      const formattedErr = formatResendError(error);
      console.error(`[NotificationService:CustomerEmail] Resend rejected email to ${customerEmail}:`, formattedErr);
      return {
        success: false,
        error: formattedErr,
        provider: 'resend',
        to: customerEmail,
        cc: '',
      };
    }

    if (data?.id) {
      sentQuoteEmailKeys.add(dedupKey);
      console.log(`[NotificationService:CustomerEmail] Email accepted by Resend (ID: ${data.id}) for ${customerEmail}`);
      return {
        success: true,
        messageId: data.id,
        provider: 'resend',
        to: customerEmail,
        cc: '',
      };
    }

    return {
      success: false,
      error: 'Resend did not return a message ID',
      provider: 'resend',
      to: customerEmail,
      cc: '',
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[NotificationService:CustomerEmail] SDK exception:`, errorMsg);
    return {
      success: false,
      error: errorMsg,
      provider: 'resend',
      to: customerEmail,
      cc: '',
    };
  }
}

/**
 * Send official quote notification to BOTH Sales (TO) and Marketing (CC)
 */
export async function sendQuoteEmailNotification(
  quotation: Quotation
): Promise<QuoteEmailNotificationResult> {
  const { salesEmail: quoteSalesEmail, marketingEmail: quoteMarketingEmail } = getNotificationRecipients();

  const dedupKey = quotation.idempotencyKey || quotation.id || quotation.quotationNumber;

  // Duplicate-submission check: prevent duplicate emails from accidental repeated submissions
  if (
    sentQuoteEmailKeys.has(dedupKey) ||
    sentQuoteEmailKeys.has(quotation.quotationNumber) ||
    (quotation.id && sentQuoteEmailKeys.has(quotation.id))
  ) {
    console.log(
      `[NotificationService:QuoteEmail] Duplicate quote submission detected for ${quotation.quotationNumber}. Notification already delivered to ${quoteSalesEmail} and ${quoteMarketingEmail}. Skipping duplicate send.`
    );
    return {
      success: true,
      isDuplicate: true,
      provider: 'simulated',
      to: quoteSalesEmail,
      cc: quoteMarketingEmail,
    };
  }

  // Exact Subject requested: New Quote Request — Office Bazzar
  const subject = 'New Quote Request — Office Bazzar';
  const html = buildQuotationEmailHtml(quotation, quoteSalesEmail, quoteMarketingEmail);
  const text = buildQuotationEmailText(quotation, quoteSalesEmail, quoteMarketingEmail);

  const resend = getResendClient();
  const fromAddress = getEmailFromAddress();

  // If no email API key is configured
  if (!resend) {
    if (process.env.EMAIL_SIMULATION_MODE === 'true') {
      console.log(
        `[NotificationService:QuoteEmail:Simulated] Simulation mode active. Email accepted for ${quotation.quotationNumber}`
      );
      sentQuoteEmailKeys.add(dedupKey);
      sentQuoteEmailKeys.add(quotation.quotationNumber);
      if (quotation.id) sentQuoteEmailKeys.add(quotation.id);

      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        provider: 'simulated',
        to: quoteSalesEmail,
        cc: quoteMarketingEmail,
      };
    }

    const unconfiguredErr = 'Email service unconfigured: RESEND_API_KEY is not set in server environment.';
    console.warn(`[NotificationService:QuoteEmail] ${unconfiguredErr}`);
    return {
      success: false,
      error: unconfiguredErr,
      provider: 'unconfigured',
      to: quoteSalesEmail,
      cc: quoteMarketingEmail,
    };
  }

  // Live Resend API Integration when API key is provided
  try {
    // 1. Try sending one unified notification with TO: sales and CC: marketing
    const { data, error } = await resend.emails.send(
      {
        from: fromAddress,
        to: [quoteSalesEmail],
        cc: [quoteMarketingEmail],
        replyTo: quotation.email,
        subject,
        html,
        text,
      },
      { idempotencyKey: `ob-admin-${dedupKey}` }
    );

    if (data?.id) {
      sentQuoteEmailKeys.add(dedupKey);
      sentQuoteEmailKeys.add(quotation.quotationNumber);
      if (quotation.id) sentQuoteEmailKeys.add(quotation.id);

      return {
        success: true,
        messageId: data.id,
        provider: 'resend',
        to: quoteSalesEmail,
        cc: quoteMarketingEmail,
      };
    }

    if (error) {
      const formattedPrimaryErr = formatResendError(error);
      // Do not retry with separate messages if API key is invalid (401) or sender domain is unverified (403)
      if (
        error.statusCode === 401 ||
        error.statusCode === 403 ||
        /domain.*not verified/i.test(error.message) ||
        /api key/i.test(error.message)
      ) {
        console.error(`[NotificationService:QuoteEmail] ${formattedPrimaryErr}`);
        return {
          success: false,
          error: formattedPrimaryErr,
          provider: 'resend',
          to: quoteSalesEmail,
          cc: quoteMarketingEmail,
        };
      }

      console.warn(
        `[NotificationService:QuoteEmail] Unified TO/CC send failed (${formattedPrimaryErr}). Retrying with separate messages...`
      );

      const [salesRes, marketingRes] = await Promise.all([
        resend.emails.send(
          {
            from: fromAddress,
            to: [quoteSalesEmail],
            replyTo: quotation.email,
            subject,
            html,
            text,
          },
          { idempotencyKey: `ob-sales-${dedupKey}` }
        ),
        resend.emails.send(
          {
            from: fromAddress,
            to: [quoteMarketingEmail],
            replyTo: quotation.email,
            subject,
            html,
            text,
          },
          { idempotencyKey: `ob-mktg-${dedupKey}` }
        ),
      ]);

      if (salesRes.data?.id && marketingRes.data?.id) {
        sentQuoteEmailKeys.add(dedupKey);
        sentQuoteEmailKeys.add(quotation.quotationNumber);
        if (quotation.id) sentQuoteEmailKeys.add(quotation.id);

        return {
          success: true,
          messageId: salesRes.data.id,
          provider: 'resend',
          to: quoteSalesEmail,
          cc: quoteMarketingEmail,
        };
      }

      const errors = [
        salesRes.error ? formatResendError(salesRes.error) : null,
        marketingRes.error ? formatResendError(marketingRes.error) : null,
      ]
        .filter(Boolean)
        .join('; ');
      return {
        success: false,
        error: errors || formattedPrimaryErr,
        provider: 'resend',
        to: quoteSalesEmail,
        cc: quoteMarketingEmail,
      };
    }

    return {
      success: false,
      error: 'Resend did not return a message ID',
      provider: 'resend',
      to: quoteSalesEmail,
      cc: quoteMarketingEmail,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errorMsg,
      provider: 'resend',
      to: quoteSalesEmail,
      cc: quoteMarketingEmail,
    };
  }
}

/**
 * Send an email notification via server-side dispatch (legacy helper for role-specific alerts)
 */
async function sendEmailNotification(
  toEmail: string,
  quotation: Quotation,
  roleLabel: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();
    const fromAddress = getEmailFromAddress();

    if (resend && process.env.EMAIL_SIMULATION_MODE !== 'true') {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [toEmail],
        replyTo: quotation.email,
        subject: `[RFQ Alert] ${quotation.quotationNumber} - ${quotation.companyName} (${roleLabel})`,
        html: buildQuotationEmailHtml(quotation),
        text: buildQuotationEmailText(quotation),
      });

      if (error) {
        return { success: false, error: `Resend error: ${error.message}` };
      }
      return { success: true };
    }

    console.log(
      `[NotificationService:Email] Dispatched RFQ alert for ${quotation.quotationNumber} to ${toEmail} (${roleLabel})`
    );
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[NotificationService:Email Error] Failed sending to ${toEmail}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Send official WhatsApp Business API notification
 */
async function sendWhatsAppNotification(
  toPhone: string,
  quotation: Quotation
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // Normalize phone number (strip whitespace, ensure country code)
    const normalizedPhone = toPhone.replace(/[^0-9]/g, '');

    if (!token || !phoneId) {
      console.log(
        `[NotificationService:WhatsApp] Official WhatsApp API credentials not configured in env. Logged alert for ${quotation.quotationNumber} to ${toPhone}`
      );
      return {
        success: true,
        error: 'WhatsApp simulated (Provide WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID in env for live dispatch)',
      };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedPhone,
      type: 'text',
      text: {
        body: `*OfficeBazzar Quotation Alert*\nReference: ${quotation.quotationNumber}\nCompany: ${quotation.companyName} (${quotation.customerName})\nPhone: ${quotation.phone}\nItems: ${quotation.items.length} products\nEstimated Total: ₹${quotation.indicativeTotal.toLocaleString('en-IN')}\n\nPlease check Admin Dashboard to review and respond.`,
      },
    };

    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `WhatsApp API Error (${res.status}): ${errText}` };
    }

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Dispatch notifications to BOTH Sales and Marketing recipients across configured channels.
 * Runs and returns the results so caller can ensure email delivery acceptance.
 */
export async function dispatchQuotationNotifications(
  quotation: Quotation
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  // 1. Dispatch Customer Confirmation Email
  const customerEmailResult = await sendCustomerQuotationEmail(quotation);
  await createNotificationLog({
    quotationId: quotation.id,
    quotationNumber: quotation.quotationNumber,
    channel: 'email_quote',
    recipient: customerEmailResult.to,
    status: customerEmailResult.success ? 'sent' : 'failed',
    errorMessage: customerEmailResult.error,
    metadata: {
      type: 'customer_confirmation',
      provider: customerEmailResult.provider,
      isDuplicate: customerEmailResult.isDuplicate,
      messageId: customerEmailResult.messageId,
    },
  });
  results.push({
    channel: 'email_quote',
    recipient: customerEmailResult.to,
    status: customerEmailResult.success ? 'sent' : 'failed',
    errorMessage: customerEmailResult.error,
  });

  // 2. Dispatch Admin Notification Email to Sales & Marketing Desk
  const quoteEmailResult = await sendQuoteEmailNotification(quotation);
  await createNotificationLog({
    quotationId: quotation.id,
    quotationNumber: quotation.quotationNumber,
    channel: 'email_quote',
    recipient: `${quoteEmailResult.to}; cc: ${quoteEmailResult.cc}`,
    status: quoteEmailResult.success ? 'sent' : 'failed',
    errorMessage: quoteEmailResult.error,
    metadata: {
      to: quoteEmailResult.to,
      cc: quoteEmailResult.cc,
      provider: quoteEmailResult.provider,
      isDuplicate: quoteEmailResult.isDuplicate,
      messageId: quoteEmailResult.messageId,
    },
  });
  results.push({
    channel: 'email_quote',
    recipient: `${quoteEmailResult.to}; cc: ${quoteEmailResult.cc}`,
    status: quoteEmailResult.success ? 'sent' : 'failed',
    errorMessage: quoteEmailResult.error,
  });

  // 2. Optional WhatsApp Notification to Admin
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE || BUSINESS_CONFIG.contact.whatsappNumber;
  const salesPhone = process.env.WHATSAPP_SALES_PHONE;

  if (adminPhone) {
    const waResult = await sendWhatsAppNotification(adminPhone, quotation);
    await createNotificationLog({
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
      channel: 'whatsapp_admin',
      recipient: adminPhone,
      status: waResult.success ? 'sent' : 'failed',
      errorMessage: waResult.error,
      metadata: { role: 'admin', type: 'whatsapp' },
    });
    results.push({
      channel: 'whatsapp_admin',
      recipient: adminPhone,
      status: waResult.success ? 'sent' : 'failed',
      errorMessage: waResult.error,
    });
  }

  // 3. Optional WhatsApp Notification to Sales Manager
  if (salesPhone) {
    const waResult = await sendWhatsAppNotification(salesPhone, quotation);
    await createNotificationLog({
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
      channel: 'whatsapp_sales',
      recipient: salesPhone,
      status: waResult.success ? 'sent' : 'failed',
      errorMessage: waResult.error,
      metadata: { role: 'sales_manager', type: 'whatsapp' },
    });
    results.push({
      channel: 'whatsapp_sales',
      recipient: salesPhone,
      status: waResult.success ? 'sent' : 'failed',
      errorMessage: waResult.error,
    });
  }

  return results;
}

/**
 * Retry a previously logged notification
 */
export async function retryNotification(logId: string): Promise<{ success: boolean; message: string }> {
  const logs = await getNotificationLogs();
  const log = logs.find((l) => l.id === logId);

  if (!log) {
    return { success: false, message: 'Notification log entry not found' };
  }

  const quotation = await getQuotationById(log.quotationId);
  if (!quotation) {
    return { success: false, message: 'Associated quotation could not be found' };
  }

  let attemptResult: { success: boolean; error?: string };

  if (log.channel === 'email_quote') {
    // Clear duplicate tracking for explicit manual retry
    sentQuoteEmailKeys.delete(quotation.id);
    sentQuoteEmailKeys.delete(quotation.quotationNumber);
    if (quotation.idempotencyKey) sentQuoteEmailKeys.delete(quotation.idempotencyKey);

    const quoteResult = await sendQuoteEmailNotification(quotation);
    attemptResult = { success: quoteResult.success, error: quoteResult.error };
  } else if (log.channel.startsWith('email')) {
    const roleLabel = log.channel === 'email_admin' ? 'Admin' : 'Sales Manager';
    attemptResult = await sendEmailNotification(log.recipient, quotation, roleLabel);
  } else {
    attemptResult = await sendWhatsAppNotification(log.recipient, quotation);
  }

  await updateNotificationLog(log.id, {
    status: attemptResult.success ? 'sent' : 'failed',
    attempts: (log.attempts || 1) + 1,
    lastAttemptAt: new Date().toISOString(),
    errorMessage: attemptResult.error || undefined,
  });

  return {
    success: attemptResult.success,
    message: attemptResult.success
      ? 'Notification delivered successfully'
      : `Retry failed: ${attemptResult.error || 'Unknown error'}`,
  };
}

/**
 * Format plain-text email message for Contact Us customer enquiry
 */
export function buildContactUsEmailText(
  submission: ContactUsSubmission,
  salesEmail: string = 'sales4@officebazzar.com',
  marketingEmail: string = 'marketing@officebazzar.com'
): string {
  return `OFFICEBAZZAR CUSTOMER CONTACT ENQUIRY
==================================================
Reference Number : ${submission.referenceNumber}
Submission Time  : ${submission.submittedAt}
Notification To  : TO: ${salesEmail} | CC: ${marketingEmail}

CUSTOMER & BUSINESS DETAILS:
--------------------------------------------------
Customer Name    : ${submission.name}
Company Name     : ${submission.companyName || 'Not Provided'}
Customer Email   : ${submission.email}
Phone Number     : ${submission.phone}

CUSTOMER MESSAGE:
--------------------------------------------------
${submission.message}

==================================================
Direct reply to this email will respond to: ${submission.email}
`;
}

/**
 * Format rich HTML email message for Contact Us customer enquiry
 */
export function buildContactUsEmailHtml(
  submission: ContactUsSubmission,
  salesEmail: string = 'sales4@officebazzar.com',
  marketingEmail: string = 'marketing@officebazzar.com'
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Customer Contact Message</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
    <div style="background-color: #004b87; padding: 20px 24px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700;">OfficeBazzar &bull; Contact Us Message</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">New Customer Inquiry from officebazzar.com</p>
    </div>

    <div style="background-color: #eff6ff; border-bottom: 1px solid #dbeafe; padding: 10px 24px; font-size: 12px; color: #1e40af;">
      <strong>Notification Recipients:</strong>
      &nbsp;TO: <a href="mailto:${salesEmail}" style="color: #1d4ed8; font-weight: 600; text-decoration: none;">${salesEmail}</a>
      &nbsp;&bull;&nbsp;CC: <a href="mailto:${marketingEmail}" style="color: #1d4ed8; font-weight: 600; text-decoration: none;">${marketingEmail}</a>
    </div>

    <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 24px; display: flex; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Reference</span>
        <div style="font-size: 16px; font-weight: 700; color: #004b87;">${submission.referenceNumber}</div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 11px; color: #64748b;">Received</span>
        <div style="font-size: 13px; color: #0f172a; font-weight: 600;">${submission.submittedAt}</div>
      </div>
    </div>

    <div style="padding: 24px;">
      <h3 style="margin-top: 0; font-size: 13px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">
        Sender Information
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 35%;">Customer Name:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${submission.name}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Company Name:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${submission.companyName || '<em style="color:#94a3b8">Not Provided</em>'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Email Address:</td>
          <td style="padding: 6px 0; color: #0f172a;"><a href="mailto:${submission.email}" style="color: #004b87; font-weight: 600;">${submission.email}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Phone Number:</td>
          <td style="padding: 6px 0; color: #0f172a;"><a href="tel:${submission.phone}" style="color: #004b87; font-weight: 600;">${submission.phone}</a></td>
        </tr>
      </table>

      <h3 style="font-size: 13px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 20px;">
        Customer Message
      </h3>
      <div style="background-color: #f8fafc; border-left: 4px solid #004b87; padding: 14px 18px; border-radius: 0 6px 6px 0; font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">
${submission.message}
      </div>

      <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b; text-align: center;">
        Direct reply to this notification will automatically address <strong>${submission.email}</strong>.
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Dispatch official Contact Us email alert to Sales (TO) and Marketing (CC)
 */
export async function sendContactUsEmailNotification(
  submission: ContactUsSubmission
): Promise<ContactEmailNotificationResult> {
  const { salesEmail, marketingEmail } = getNotificationRecipients();
  const fromAddress = getEmailFromAddress();
  const resend = getResendClient();

  const subject = `New Contact Enquiry — Office Bazzar [Ref: ${submission.referenceNumber}]`;
  const html = buildContactUsEmailHtml(submission, salesEmail, marketingEmail);
  const text = buildContactUsEmailText(submission, salesEmail, marketingEmail);

  // If no email provider key is configured
  if (!resend) {
    if (process.env.EMAIL_SIMULATION_MODE === 'true') {
      console.log(
        `[NotificationService:ContactEmail:Simulated] Contact enquiry simulated for ${submission.referenceNumber} to ${salesEmail} / ${marketingEmail}`
      );
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        provider: 'simulated',
        to: salesEmail,
        cc: marketingEmail,
      };
    }

    const unconfiguredErr = 'Email service unconfigured: RESEND_API_KEY is not set in server environment.';
    console.warn(`[NotificationService:ContactEmail] ${unconfiguredErr}`);
    return {
      success: false,
      error: unconfiguredErr,
      provider: 'unconfigured',
      to: salesEmail,
      cc: marketingEmail,
    };
  }

  // Live Resend API Integration
  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [salesEmail],
      cc: [marketingEmail],
      replyTo: submission.email,
      subject,
      html,
      text,
    });

    if (data?.id) {
      return {
        success: true,
        messageId: data.id,
        provider: 'resend',
        to: salesEmail,
        cc: marketingEmail,
      };
    }

    if (error) {
      console.warn(
        `[NotificationService:ContactEmail] Unified TO/CC send failed (${error.message}). Retrying with separate messages...`
      );

      const [salesRes, marketingRes] = await Promise.all([
        resend.emails.send({
          from: fromAddress,
          to: [salesEmail],
          replyTo: submission.email,
          subject,
          html,
          text,
        }),
        resend.emails.send({
          from: fromAddress,
          to: [marketingEmail],
          replyTo: submission.email,
          subject,
          html,
          text,
        }),
      ]);

      if (salesRes.data?.id && marketingRes.data?.id) {
        return {
          success: true,
          messageId: salesRes.data.id,
          provider: 'resend',
          to: salesEmail,
          cc: marketingEmail,
        };
      }

      const combinedErr = [salesRes.error?.message, marketingRes.error?.message].filter(Boolean).join('; ');
      return {
        success: false,
        error: `Resend API error: ${combinedErr || error.message}`,
        provider: 'resend',
        to: salesEmail,
        cc: marketingEmail,
      };
    }

    return {
      success: false,
      error: 'Resend did not return a message ID',
      provider: 'resend',
      to: salesEmail,
      cc: marketingEmail,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Network error contacting email provider: ${errorMsg}`,
      provider: 'resend',
      to: salesEmail,
      cc: marketingEmail,
    };
  }
}
