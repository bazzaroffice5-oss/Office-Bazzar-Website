import { Quotation, NotificationLog } from '@/types';
import { BUSINESS_CONFIG } from '@/lib/config/business';
import {
  createNotificationLog,
  updateNotificationLog,
  getNotificationLogs,
  getQuotationById,
} from '@/lib/db/store';
import { sendZohoEmail, ZohoEmailDispatchResult } from '@/lib/zoho/email';

export interface NotificationResult {
  channel: NotificationLog['channel'];
  recipient: string;
  status: 'sent' | 'failed';
  provider?: string;
  messageId?: string;
  errorMessage?: string;
  missingScopes?: string[];
}

export interface AdminRecipientStatus {
  recipient: string;
  role: 'ADMIN 1 (Sales)' | 'ADMIN 2 (Marketing)';
  success: boolean;
  status: 'sent' | 'failed';
  provider?: string;
  messageId?: string;
  error?: string;
  missingScopes?: string[];
}

export interface QuoteEmailNotificationResult {
  success: boolean;
  messageId?: string;
  provider: 'zoho_crm_send_mail' | 'zoho_mail_api' | 'zoho_unconfigured' | 'simulated' | 'unconfigured';
  isDuplicate?: boolean;
  admin1: AdminRecipientStatus;
  admin2: AdminRecipientStatus;
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
  provider: 'zoho_crm_send_mail' | 'zoho_mail_api' | 'zoho_unconfigured' | 'simulated' | 'unconfigured';
  to: string;
  cc: string;
  error?: string;
}

/**
 * Resolve verified Zoho sender address for administrative alerts
 */
export function getEmailFromAddress(): string {
  const configuredFrom = (process.env.EMAIL_FROM_ADDRESS || '').replace(/[\r\n]/g, '').trim();
  if (configuredFrom) {
    return configuredFrom;
  }
  return 'Office Bazzar <dm@officebazzar.com>';
}

/**
 * Resolve authorized recipient mailboxes for internal company alerts
 * ADMIN 1: sales4@officebazzar.com
 * ADMIN 2: marketing@officebazzar.com
 */
export function getNotificationRecipients(): { salesEmail: string; marketingEmail: string } {
  const salesEmail = (
    process.env.QUOTE_SALES_EMAIL ||
    BUSINESS_CONFIG.contact.salesEmail ||
    'sales4@officebazzar.com'
  )
    .replace(/[\r\n]/g, '')
    .trim();

  const marketingEmail = (
    process.env.QUOTE_MARKETING_EMAIL ||
    BUSINESS_CONFIG.contact.marketingEmail ||
    'marketing@officebazzar.com'
  )
    .replace(/[\r\n]/g, '')
    .trim();

  return { salesEmail, marketingEmail };
}

// Track sent keys per recipient so retrying only retries failed recipients without duplicating sent ones
const sentQuoteRecipientKeys = new Set<string>();

export function clearSentQuoteEmailKeys(): void {
  sentQuoteRecipientKeys.clear();
}

/**
 * Format plain-text email message for administrative, sales, and marketing staff
 */
export function buildQuotationEmailText(
  quotation: Quotation,
  recipientEmail: string = 'sales4@officebazzar.com',
  partnerEmail: string = 'marketing@officebazzar.com'
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

  return `OFFICEBAZZAR REQUEST FOR QUOTATION (RFQ)
==================================================
RFQ Reference    : ${quotation.quotationNumber}
Submission Date  : ${new Date(quotation.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST (${quotation.createdAt})
Admin Recipient  : ${recipientEmail} (Also notified: ${partnerEmail})
Zoho CRM Status  : Saved in Zoho CRM (Contacts, Accounts, Quotes & Quoted_Items)

CUSTOMER & BUSINESS DETAILS:
--------------------------------------------------
Customer Name    : ${quotation.customerName}
Company Name     : ${quotation.companyName || 'Not Provided'}
Email Address    : ${quotation.email}
Phone Number     : ${quotation.phone}
GSTIN            : ${quotation.gstin || 'Not Provided'}
Delivery Address : ${quotation.deliveryLocation ? `${quotation.deliveryLocation} - ` : ''}PIN ${quotation.pincode}
Preferred Contact: ${quotation.preferredContactMethod.toUpperCase()}

CUSTOMER MESSAGE / REQUIREMENTS:
--------------------------------------------------
${quotation.additionalRequirements || 'None specified'}

PRODUCTS REQUESTED (${quotation.items.length} Line Items):
--------------------------------------------------
${itemsText}

INDICATIVE ESTIMATE:
--------------------------------------------------
Subtotal (Excl. Tax) : ₹${quotation.indicativeSubtotal.toLocaleString('en-IN')}
Estimated GST (18%)  : ₹${quotation.indicativeGstAmount.toLocaleString('en-IN')}
Estimated Total      : ₹${quotation.indicativeTotal.toLocaleString('en-IN')}

ADMIN REVIEW:
--------------------------------------------------
${adminUrl}
`;
}

/**
 * Format HTML email message for administrative, sales, and marketing staff
 */
export function buildQuotationEmailHtml(
  quotation: Quotation,
  recipientEmail: string = 'sales4@officebazzar.com',
  partnerEmail: string = 'marketing@officebazzar.com'
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
          <span style="color: #6b7280; font-size: 12px;">SKU: ${item.sku} | Pack: ${item.packSize || 'Standard'}</span>
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
  <title>New Quote Request — ${quotation.quotationNumber} | Office Bazzar</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
    <div style="background-color: #d9232d; padding: 20px 24px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">OfficeBazzar &bull; Quotation Alert</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">New Request for Quotation Saved in Zoho CRM</p>
    </div>

    <div style="background-color: #eff6ff; border-bottom: 1px solid #dbeafe; padding: 10px 24px; font-size: 12px; color: #1e40af;">
      <strong>Admin Notification Recipient:</strong> ${recipientEmail} &nbsp;&bull;&nbsp; Also Notified: ${partnerEmail}
    </div>

    <div style="background-color: #fef2f2; border-bottom: 1px solid #fee2e2; padding: 14px 24px;">
      <div>
        <span style="font-size: 12px; color: #991b1b; text-transform: uppercase; font-weight: 700;">RFQ Reference</span>
        <div style="font-size: 18px; font-weight: 800; color: #d9232d;">${quotation.quotationNumber}</div>
      </div>
      <div style="margin-top: 6px; font-size: 12px; color: #374151;">
        <strong>Quotation Submission Date:</strong> ${new Date(quotation.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </div>
    </div>

    <div style="padding: 24px;">
      <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #374151; letter-spacing: 0.5px; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">
        Customer &amp; Company Information
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
          <td style="padding: 6px 0; color: #6b7280;">Email Address:</td>
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
          <td style="padding: 6px 0; color: #6b7280;">Delivery Address / PIN:</td>
          <td style="padding: 6px 0; color: #111827;">${quotation.deliveryLocation ? `${quotation.deliveryLocation} - ` : ''}<strong>PIN: ${quotation.pincode}</strong></td>
        </tr>
      </table>

      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <div style="font-size: 12px; color: #1e40af; font-weight: 700; text-transform: uppercase;">Customer Message:</div>
        <div style="font-size: 13px; color: #1e293b; margin-top: 4px; white-space: pre-wrap;">${quotation.additionalRequirements || 'None specified'}</div>
      </div>

      <h3 style="font-size: 14px; text-transform: uppercase; color: #374151; letter-spacing: 0.5px; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px; margin-top: 24px;">
        Products Requested (${quotation.items.length} Items)
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 8px 10px; text-align: left; font-size: 12px; color: #6b7280;">Product &amp; SKU</th>
            <th style="padding: 8px 10px; text-align: center; font-size: 12px; color: #6b7280;">Quantity</th>
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

      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="${adminUrl}" style="background-color: #d9232d; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
          View Quotation in Zoho CRM / Admin Dashboard &rarr;
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send official quote notification to a single Admin recipient via Zoho Mail / Zoho CRM Send Mail API
 */
export async function sendAdminQuotationEmail(
  quotation: Quotation,
  recipientEmail: string,
  partnerEmail: string,
  roleLabel: 'ADMIN 1 (Sales)' | 'ADMIN 2 (Marketing)',
  crmContext?: { zohoQuoteId?: string; zohoContactId?: string }
): Promise<AdminRecipientStatus> {
  const cleanRecipient = recipientEmail.trim().toLowerCase();
  const dedupKey = `${quotation.idempotencyKey || quotation.quotationNumber || quotation.id}:${cleanRecipient}`;

  if (sentQuoteRecipientKeys.has(dedupKey)) {
    return {
      recipient: cleanRecipient,
      role: roleLabel,
      success: true,
      status: 'sent',
      provider: 'zoho_crm_send_mail',
      messageId: 'already_sent_dedup',
    };
  }

  const subject = `New Quote Request — ${quotation.quotationNumber} (${quotation.companyName || quotation.customerName}) | Office Bazzar`;
  const html = buildQuotationEmailHtml(quotation, cleanRecipient, partnerEmail);
  const text = buildQuotationEmailText(quotation, cleanRecipient, partnerEmail);

  const zohoResult: ZohoEmailDispatchResult = await sendZohoEmail({
    toEmail: cleanRecipient,
    toName: roleLabel,
    replyTo: quotation.email,
    subject,
    html,
    text,
    quoteId: crmContext?.zohoQuoteId,
    contactId: crmContext?.zohoContactId,
  });

  if (zohoResult.success) {
    sentQuoteRecipientKeys.add(dedupKey);
    return {
      recipient: cleanRecipient,
      role: roleLabel,
      success: true,
      status: 'sent',
      provider: zohoResult.provider,
      messageId: zohoResult.messageId,
    };
  }

  return {
    recipient: cleanRecipient,
    role: roleLabel,
    success: false,
    status: 'failed',
    provider: zohoResult.provider,
    error: zohoResult.error,
    missingScopes: zohoResult.missingScopes,
  };
}

/**
 * Send TWO ADMIN EMAIL NOTIFICATIONS independently:
 * ADMIN 1: sales4@officebazzar.com
 * ADMIN 2: marketing@officebazzar.com
 */
export async function sendQuoteEmailNotification(
  quotation: Quotation,
  crmContext?: { zohoQuoteId?: string; zohoContactId?: string }
): Promise<QuoteEmailNotificationResult> {
  const { salesEmail, marketingEmail } = getNotificationRecipients();

  const [admin1Result, admin2Result] = await Promise.all([
    sendAdminQuotationEmail(quotation, salesEmail, marketingEmail, 'ADMIN 1 (Sales)', crmContext),
    sendAdminQuotationEmail(quotation, marketingEmail, salesEmail, 'ADMIN 2 (Marketing)', crmContext),
  ]);

  const bothSucceeded = admin1Result.success && admin2Result.success;
  const errors = [
    !admin1Result.success ? `Admin 1 (${salesEmail}): ${admin1Result.error}` : null,
    !admin2Result.success ? `Admin 2 (${marketingEmail}): ${admin2Result.error}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    success: bothSucceeded,
    provider: (admin1Result.provider as QuoteEmailNotificationResult['provider']) || 'zoho_crm_send_mail',
    admin1: admin1Result,
    admin2: admin2Result,
    to: salesEmail,
    cc: marketingEmail,
    error: errors || undefined,
  };
}

/**
 * Dispatch notifications ONLY to the two required Admin recipients after Zoho CRM saves the quotation:
 * - ADMIN 1: sales4@officebazzar.com
 * - ADMIN 2: marketing@officebazzar.com
 * Does NOT send a customer email notification.
 * Tracks each admin recipient independently and allows retry without duplicating the CRM quotation.
 */
export async function dispatchQuotationNotifications(
  quotation: Quotation,
  crmContext?: { zohoQuoteId?: string; zohoContactId?: string }
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];
  const { salesEmail, marketingEmail } = getNotificationRecipients();

  // 1. Dispatch ADMIN 1 Notification (sales4@officebazzar.com)
  const admin1Res = await sendAdminQuotationEmail(
    quotation,
    salesEmail,
    marketingEmail,
    'ADMIN 1 (Sales)',
    crmContext
  );

  await createNotificationLog({
    quotationId: quotation.id,
    quotationNumber: quotation.quotationNumber,
    channel: 'email_sales',
    recipient: admin1Res.recipient,
    status: admin1Res.status,
    errorMessage: admin1Res.error,
    metadata: {
      role: 'ADMIN_1_SALES',
      provider: admin1Res.provider,
      messageId: admin1Res.messageId,
      zohoQuoteId: crmContext?.zohoQuoteId,
      missingScopes: admin1Res.missingScopes,
    },
  });

  results.push({
    channel: 'email_sales',
    recipient: admin1Res.recipient,
    status: admin1Res.status,
    provider: admin1Res.provider,
    messageId: admin1Res.messageId,
    errorMessage: admin1Res.error,
    missingScopes: admin1Res.missingScopes,
  });

  // 2. Dispatch ADMIN 2 Notification (marketing@officebazzar.com)
  const admin2Res = await sendAdminQuotationEmail(
    quotation,
    marketingEmail,
    salesEmail,
    'ADMIN 2 (Marketing)',
    crmContext
  );

  await createNotificationLog({
    quotationId: quotation.id,
    quotationNumber: quotation.quotationNumber,
    channel: 'email_admin',
    recipient: admin2Res.recipient,
    status: admin2Res.status,
    errorMessage: admin2Res.error,
    metadata: {
      role: 'ADMIN_2_MARKETING',
      provider: admin2Res.provider,
      messageId: admin2Res.messageId,
      zohoQuoteId: crmContext?.zohoQuoteId,
      missingScopes: admin2Res.missingScopes,
    },
  });

  results.push({
    channel: 'email_admin',
    recipient: admin2Res.recipient,
    status: admin2Res.status,
    provider: admin2Res.provider,
    messageId: admin2Res.messageId,
    errorMessage: admin2Res.error,
    missingScopes: admin2Res.missingScopes,
  });

  return results;
}

/**
 * Retry a previously logged admin notification without recreating or duplicating the Zoho CRM quotation
 */
export async function retryNotification(logId: string): Promise<{ success: boolean; message: string }> {
  const logs = await getNotificationLogs();
  const log = logs.find((l) => l.id === logId);

  if (!log) {
    return { success: false, message: 'Notification log entry not found' };
  }

  const quotation = await getQuotationById(log.quotationId);
  if (!quotation) {
    return { success: false, message: 'Associated quotation could not be found in Zoho CRM' };
  }

  const { salesEmail, marketingEmail } = getNotificationRecipients();
  const targetRecipient = log.recipient.trim().toLowerCase();
  const partnerEmail = targetRecipient === salesEmail.toLowerCase() ? marketingEmail : salesEmail;
  const roleLabel =
    targetRecipient === salesEmail.toLowerCase() ? 'ADMIN 1 (Sales)' : 'ADMIN 2 (Marketing)';

  // Clear dedup key for this specific recipient so manual retry executes
  const dedupKey = `${quotation.idempotencyKey || quotation.quotationNumber || quotation.id}:${targetRecipient}`;
  sentQuoteRecipientKeys.delete(dedupKey);

  const zohoQuoteId =
    typeof log.metadata?.zohoQuoteId === 'string' ? log.metadata.zohoQuoteId : quotation.id;

  const retryRes = await sendAdminQuotationEmail(
    quotation,
    targetRecipient,
    partnerEmail,
    roleLabel,
    { zohoQuoteId }
  );

  await updateNotificationLog(log.id, {
    status: retryRes.status,
    attempts: (log.attempts || 1) + 1,
    lastAttemptAt: new Date().toISOString(),
    errorMessage: retryRes.error || undefined,
  });

  return {
    success: retryRes.success,
    message: retryRes.success
      ? `Notification delivered to ${targetRecipient} via ${retryRes.provider}`
      : `Retry failed for ${targetRecipient}: ${retryRes.error || 'Unknown error'}`,
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
Notification To  : ${salesEmail} & ${marketingEmail}

CUSTOMER & BUSINESS DETAILS:
--------------------------------------------------
Customer Name    : ${submission.name}
Company Name     : ${submission.companyName || 'Not Provided'}
Customer Email   : ${submission.email}
Phone Number     : ${submission.phone}

CUSTOMER MESSAGE:
--------------------------------------------------
${submission.message}
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
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
    <div style="background-color: #004b87; padding: 20px 24px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700;">OfficeBazzar &bull; Contact Us Message</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Reference: ${submission.referenceNumber} (${submission.submittedAt})</p>
    </div>
    <div style="padding: 24px; font-size: 13px; color: #0f172a;">
      <p><strong>Customer Name:</strong> ${submission.name}</p>
      <p><strong>Company Name:</strong> ${submission.companyName || 'Not Provided'}</p>
      <p><strong>Email:</strong> ${submission.email}</p>
      <p><strong>Phone:</strong> ${submission.phone}</p>
      <p><strong>Message:</strong><br/>${submission.message}</p>
      <p style="font-size: 11px; color: #64748b;">Recipients: ${salesEmail}, ${marketingEmail}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Dispatch official Contact Us email alert to Sales and Marketing via Zoho Email API
 */
export async function sendContactUsEmailNotification(
  submission: ContactUsSubmission
): Promise<ContactEmailNotificationResult> {
  const { salesEmail, marketingEmail } = getNotificationRecipients();
  const subject = `New Contact Enquiry — Office Bazzar [Ref: ${submission.referenceNumber}]`;
  const html = buildContactUsEmailHtml(submission, salesEmail, marketingEmail);
  const text = buildContactUsEmailText(submission, salesEmail, marketingEmail);

  const [admin1, admin2] = await Promise.all([
    sendZohoEmail({
      toEmail: salesEmail,
      toName: 'Sales Desk',
      replyTo: submission.email,
      subject,
      html,
      text,
    }),
    sendZohoEmail({
      toEmail: marketingEmail,
      toName: 'Marketing Desk',
      replyTo: submission.email,
      subject,
      html,
      text,
    }),
  ]);

  const success = admin1.success && admin2.success;
  const error = [admin1.error, admin2.error].filter(Boolean).join(' | ');

  return {
    success,
    messageId: admin1.messageId || admin2.messageId,
    provider: admin1.provider,
    to: salesEmail,
    cc: marketingEmail,
    error: error || undefined,
  };
}

/**
 * Build plain-text Final Quotation email for Customer (dispatched ONLY after Admin approval)
 */
export function buildCustomerFinalQuotationEmailText(quotation: Quotation): string {
  const siteUrl = BUSINESS_CONFIG.websiteUrl;
  const pdfUrl = `${siteUrl}/api/admin/quotations/${encodeURIComponent(quotation.quotationNumber)}/pdf`;

  const subtotal = quotation.subtotal ?? quotation.indicativeSubtotal ?? 0;
  const discountAmount = quotation.discountAmount ?? 0;
  const discountPercent = quotation.discountPercent ?? 0;
  const gstPercent = quotation.gstPercent ?? 18;
  const gstAmount = quotation.gstAmount ?? quotation.indicativeGstAmount ?? 0;
  const deliveryCharges = quotation.deliveryCharges ?? 0;
  const additionalCharges = quotation.additionalCharges ?? 0;
  const grandTotal = quotation.grandTotal ?? quotation.quotedAmount ?? quotation.indicativeTotal ?? 0;

  const itemsText = quotation.items
    .map((item, idx) => {
      const lineTotal = item.lineSubtotal ?? item.quantity * item.indicativeUnitPrice;
      return `${idx + 1}. ${item.productName} (SKU: ${item.sku}${item.packSize ? ` | ${item.packSize}` : ''})
   Quantity: ${item.quantity} | Unit Price: ₹${item.indicativeUnitPrice.toLocaleString('en-IN')} | Line Total: ₹${lineTotal.toLocaleString('en-IN')}`;
    })
    .join('\n\n');

  return `OFFICIAL COMMERCIAL QUOTATION — ${BUSINESS_CONFIG.legalEntityName.toUpperCase()}
======================================================================
Quotation Reference : ${quotation.quotationNumber} (Rev v${quotation.version || 1})
Quotation Date      : ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
Valid Until         : ${quotation.validUntil || '30 Days from Issue'}

PREPARED FOR:
----------------------------------------------------------------------
Customer Name       : ${quotation.customerName}
Company Name        : ${quotation.companyName}
Email               : ${quotation.email}
Phone               : ${quotation.phone}
Customer GSTIN      : ${quotation.gstin || 'Not Provided'}
Delivery Address    : ${quotation.deliveryLocation ? `${quotation.deliveryLocation} - ` : ''}PIN ${quotation.pincode}

QUOTED LINE ITEMS (${quotation.items.length} Items):
----------------------------------------------------------------------
${itemsText}

COMMERCIAL SUMMARY:
----------------------------------------------------------------------
Subtotal (Excl. Tax)          : ₹${subtotal.toLocaleString('en-IN')}
Discount (${discountPercent}%)              : -₹${discountAmount.toLocaleString('en-IN')}
Taxable Amount                : ₹${Math.max(0, subtotal - discountAmount).toLocaleString('en-IN')}
GST (${gstPercent}%)                    : +₹${gstAmount.toLocaleString('en-IN')}
Delivery & Transport Charges  : +₹${deliveryCharges.toLocaleString('en-IN')}
Additional Charges            : +₹${additionalCharges.toLocaleString('en-IN')}
----------------------------------------------------------------------
FINAL GRAND TOTAL (INR)       : ₹${grandTotal.toLocaleString('en-IN')}
======================================================================

PAYMENT TERMS:
${quotation.paymentTerms || '100% Advance against Proforma Invoice or as mutually agreed.'}

TERMS & CONDITIONS:
${quotation.termsAndConditions || 'Standard Office Bazzar B2B commercial terms apply.'}

PRINT / DOWNLOAD OFFICIAL QUOTATION PDF:
${pdfUrl}

For order confirmation or queries, contact:
${BUSINESS_CONFIG.legalEntityName}
${BUSINESS_CONFIG.headquarters.address}, ${BUSINESS_CONFIG.headquarters.city} - ${BUSINESS_CONFIG.headquarters.pincode}
Phone: ${BUSINESS_CONFIG.contact.salesPhone} | Email: ${BUSINESS_CONFIG.contact.salesEmail}
`;
}

/**
 * Build rich Office Bazzar Branded HTML Final Quotation email for Customer
 */
export function buildCustomerFinalQuotationEmailHtml(quotation: Quotation): string {
  const siteUrl = BUSINESS_CONFIG.websiteUrl;
  const pdfUrl = `${siteUrl}/api/admin/quotations/${encodeURIComponent(quotation.quotationNumber)}/pdf`;

  const subtotal = quotation.subtotal ?? quotation.indicativeSubtotal ?? 0;
  const discountAmount = quotation.discountAmount ?? 0;
  const discountPercent = quotation.discountPercent ?? 0;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const gstPercent = quotation.gstPercent ?? 18;
  const gstAmount = quotation.gstAmount ?? quotation.indicativeGstAmount ?? 0;
  const deliveryCharges = quotation.deliveryCharges ?? 0;
  const additionalCharges = quotation.additionalCharges ?? 0;
  const grandTotal = quotation.grandTotal ?? quotation.quotedAmount ?? quotation.indicativeTotal ?? 0;

  const itemsRows = quotation.items
    .map((item, idx) => {
      const lineSub = item.lineSubtotal ?? item.quantity * item.indicativeUnitPrice;
      return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-size: 12px; color: #64748b; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #0f172a;">
          <div style="font-weight: 700;">${item.productName}</div>
          <div style="font-size: 11px; color: #64748b;">SKU: ${item.sku} &bull; Pack: ${item.packSize || 'Standard'}${item.hsnCode ? ` &bull; HSN: ${item.hsnCode}` : ''}</div>
        </td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: center; color: #0f172a; font-weight: 700;">${item.quantity}</td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; color: #0f172a;">₹${item.indicativeUnitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; color: #0f172a; font-weight: 700;">₹${lineSub.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Final Quotation ${quotation.quotationNumber} | Office Bazzar</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
  <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(15,23,42,0.06);">
    <!-- Branded Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px 28px; color: #ffffff;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">OFFICE BAZZAR</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">${BUSINESS_CONFIG.legalEntityName}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
              ${BUSINESS_CONFIG.headquarters.address}, ${BUSINESS_CONFIG.headquarters.city} – ${BUSINESS_CONFIG.headquarters.pincode}
            </div>
          </td>
          <td style="text-align: right; vertical-align: top;">
            <span style="background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 800; padding: 5px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
              OFFICIAL QUOTATION
            </span>
            <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-top: 8px;">${quotation.quotationNumber}</div>
            <div style="font-size: 11px; color: #cbd5e1;">Valid Till: <strong>${quotation.validUntil || '30 Days'}</strong></div>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding: 28px;">
      <!-- Customer & Quotation Metadata -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <tr>
          <td style="padding: 16px; width: 55%; vertical-align: top; border-right: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Quotation Prepared For</div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${quotation.companyName}</div>
            <div style="font-size: 13px; color: #334155; margin-top: 2px;">Attn: <strong>${quotation.customerName}</strong></div>
            <div style="font-size: 12px; color: #475569; margin-top: 4px;">Email: ${quotation.email} &bull; Phone: ${quotation.phone}</div>
            ${quotation.gstin ? `<div style="font-size: 12px; color: #0f172a; margin-top: 4px;"><strong>Customer GSTIN:</strong> ${quotation.gstin}</div>` : ''}
            <div style="font-size: 12px; color: #475569; margin-top: 4px;">
              <strong>Delivery Address:</strong> ${quotation.deliveryLocation ? `${quotation.deliveryLocation}, ` : ''}PIN: ${quotation.pincode}
            </div>
          </td>
          <td style="padding: 16px; width: 45%; vertical-align: top; font-size: 12px; color: #334155;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Quotation Details</div>
            <div style="margin-bottom: 4px;"><strong>Original RFQ Ref:</strong> ${quotation.quotationNumber}</div>
            <div style="margin-bottom: 4px;"><strong>Revision:</strong> Version ${quotation.version || 1}</div>
            <div style="margin-bottom: 4px;"><strong>Issue Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div style="margin-bottom: 4px;"><strong>Valid Until:</strong> <span style="color: #dc2626; font-weight: 700;">${quotation.validUntil || '30 Days'}</span></div>
            <div><strong>Sales Desk:</strong> ${BUSINESS_CONFIG.contact.salesPhone}</div>
          </td>
        </tr>
      </table>

      <!-- Line Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; text-align: center; width: 40px;">#</th>
            <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; text-align: left;">Product Description &amp; SKU</th>
            <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; text-align: center; width: 70px;">Qty</th>
            <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; text-align: right; width: 110px;">Unit Price (₹)</th>
            <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; text-align: right; width: 120px;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Totals Breakdown -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 16px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; color: #334155;">
              <div style="font-weight: 700; color: #0f172a; text-transform: uppercase; font-size: 11px; margin-bottom: 4px;">Payment Terms</div>
              <div style="white-space: pre-wrap;">${quotation.paymentTerms || '100% Advance against Proforma Invoice or as mutually agreed.'}</div>
            </div>
          </td>
          <td style="width: 50%; vertical-align: top;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 5px 8px; text-align: right; color: #475569;">Subtotal:</td>
                <td style="padding: 5px 8px; text-align: right; font-weight: 600; color: #0f172a;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              ${
                discountAmount > 0
                  ? `<tr>
                <td style="padding: 5px 8px; text-align: right; color: #16a34a;">Discount (${discountPercent}%):</td>
                <td style="padding: 5px 8px; text-align: right; font-weight: 600; color: #16a34a;">-₹${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; text-align: right; color: #475569;">Taxable Subtotal:</td>
                <td style="padding: 5px 8px; text-align: right; font-weight: 600; color: #0f172a;">₹${taxableSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>`
                  : ''
              }
              <tr>
                <td style="padding: 5px 8px; text-align: right; color: #475569;">GST (${gstPercent}%):</td>
                <td style="padding: 5px 8px; text-align: right; font-weight: 600; color: #0f172a;">+₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              ${
                deliveryCharges > 0
                  ? `<tr>
                <td style="padding: 5px 8px; text-align: right; color: #475569;">Delivery &amp; Transport Charges:</td>
                <td style="padding: 5px 8px; text-align: right; font-weight: 600; color: #0f172a;">+₹${deliveryCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>`
                  : ''
              }
              ${
                additionalCharges > 0
                  ? `<tr>
                <td style="padding: 5px 8px; text-align: right; color: #475569;">Additional Charges:</td>
                <td style="padding: 5px 8px; text-align: right; font-weight: 600; color: #0f172a;">+₹${additionalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>`
                  : ''
              }
              <tr style="border-top: 2px solid #0f172a; background-color: #fef2f2;">
                <td style="padding: 10px 8px; text-align: right; font-size: 14px; font-weight: 800; color: #0f172a;">Grand Total (INR):</td>
                <td style="padding: 10px 8px; text-align: right; font-size: 16px; font-weight: 800; color: #dc2626;">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Terms & Conditions -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 11px; color: #475569; margin-bottom: 24px;">
        <div style="font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 6px;">Terms &amp; Conditions</div>
        <div style="white-space: pre-wrap; line-height: 1.5;">${quotation.termsAndConditions || 'Standard Office Bazzar commercial terms apply.'}</div>
      </div>

      <!-- View / Print PDF Button -->
      <div style="text-align: center; margin: 20px 0;">
        <a href="${pdfUrl}" target="_blank" style="background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 13px; font-weight: 700; border-radius: 6px; display: inline-block;">
          View &amp; Download Official Quotation PDF &rarr;
        </a>
      </div>
    </div>

    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 28px; text-align: center; font-size: 11px; color: #64748b;">
      ${BUSINESS_CONFIG.legalEntityName} &bull; ${BUSINESS_CONFIG.contact.salesEmail} &bull; ${BUSINESS_CONFIG.contact.salesPhone} &bull; <a href="${siteUrl}" style="color: #1e3a8a;">officebazzar.com</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send the approved Final Quotation to the Customer via Zoho CRM Send Mail API
 */
export async function sendFinalQuotationToCustomer(
  quotation: Quotation
): Promise<{
  success: boolean;
  recipient: string;
  provider: string;
  messageId?: string;
  error?: string;
}> {
  const customerEmail = (quotation.email || '').trim().toLowerCase();
  if (!customerEmail || !customerEmail.includes('@')) {
    return {
      success: false,
      recipient: customerEmail,
      provider: 'zoho_crm_send_mail',
      error: 'Customer email address is missing or invalid on this quotation.',
    };
  }

  const { salesEmail } = getNotificationRecipients();
  const subject = `Official Quotation ${quotation.quotationNumber} from Office Bazzar (${quotation.companyName || quotation.customerName})`;
  const html = buildCustomerFinalQuotationEmailHtml(quotation);
  const text = buildCustomerFinalQuotationEmailText(quotation);
  const zohoQuoteId = quotation.zohoQuoteId || (/^\d+$/.test(quotation.id) ? quotation.id : undefined);

  const zohoRes = await sendZohoEmail({
    toEmail: customerEmail,
    toName: quotation.customerName || quotation.companyName,
    replyTo: salesEmail,
    subject,
    html,
    text,
    quoteId: zohoQuoteId,
    contactId: quotation.zohoContactId,
  });

  await createNotificationLog({
    quotationId: quotation.id,
    quotationNumber: quotation.quotationNumber,
    channel: 'email_quote',
    recipient: customerEmail,
    status: zohoRes.success ? 'sent' : 'failed',
    errorMessage: zohoRes.error,
    metadata: {
      role: 'CUSTOMER_FINAL_QUOTATION',
      provider: zohoRes.provider,
      messageId: zohoRes.messageId,
      zohoQuoteId,
      version: quotation.version || 1,
      grandTotal: quotation.grandTotal ?? quotation.quotedAmount,
    },
  });

  return {
    success: zohoRes.success,
    recipient: customerEmail,
    provider: zohoRes.provider,
    messageId: zohoRes.messageId,
    error: zohoRes.error,
  };
}
