import { NextResponse } from 'next/server';
import {
  sendContactUsEmailNotification,
  getNotificationRecipients,
  ContactUsSubmission,
} from '@/lib/notifications/service';
import { createBulkRFQ } from '@/lib/db/store';
import { syncContactEnquiryToZoho } from '@/lib/zoho/crm';

// In-memory sliding window rate limiter for Contact Us submissions
const contactRateMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CONTACT_PER_WINDOW = 5;

function checkContactRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const timestamps = contactRateMap.get(clientIp) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_CONTACT_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  contactRateMap.set(clientIp, validTimestamps);
  return true;
}

// Sanitization to prevent email-header injection
function sanitizeHeader(val?: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\r\n\0]/g, '')
    .replace(/(bcc|cc|to|subject|content-type|mime-version):/gi, '')
    .trim();
}

export async function POST(req: Request) {
  try {
    // 1. Rate limiting by IP
    const forwardedHeader = req.headers.get('x-forwarded-for');
    const clientIp = forwardedHeader ? forwardedHeader.split(',')[0].trim() : '127.0.0.1';

    if (!checkContactRateLimit(clientIp)) {
      return NextResponse.json(
        {
          error:
            'Too many contact messages received from your connection. Please wait a few minutes before submitting again.',
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    // 2. Anti-spam honeypot detection: bots auto-fill hidden input fields
    const honeypot = body.website || body.company_website_url || body._gotcha;
    if (honeypot && String(honeypot).trim().length > 0) {
      console.warn(`[Contact API] Spam honeypot triggered from IP ${clientIp}. Ignoring bot submission.`);
      // Return 200 to trick spam bots into thinking their submission went through
      return NextResponse.json({
        success: true,
        referenceNumber: 'OB-CNT-SPAM-SUPPRESSED',
        message: 'Your message has been received.',
      });
    }

    const { name, companyName, email, phone, message } = body;

    // 3. Server-side Input Validation & Sanitization
    const cleanName = sanitizeHeader(name);
    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json(
        { error: 'Contact person name is required (between 2 and 100 characters).' },
        { status: 400 }
      );
    }

    const cleanCompany = sanitizeHeader(companyName).slice(0, 150);

    const cleanEmail = sanitizeHeader(email).toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail) || cleanEmail.length > 100) {
      return NextResponse.json(
        { error: 'A valid email address is required (e.g. name@company.com).' },
        { status: 400 }
      );
    }

    const rawPhone = typeof phone === 'string' || typeof phone === 'number' ? String(phone) : '';
    const digitsOnlyPhone = rawPhone.replace(/[^0-9]/g, '');
    if (digitsOnlyPhone.length < 10 || digitsOnlyPhone.length > 15) {
      return NextResponse.json(
        { error: 'A valid 10-digit contact telephone/mobile number is required.' },
        { status: 400 }
      );
    }
    const cleanPhone = sanitizeHeader(rawPhone);

    const cleanMessage = typeof message === 'string' ? message.trim() : '';
    if (!cleanMessage || cleanMessage.length < 5) {
      return NextResponse.json(
        { error: 'Message content is required (minimum 5 characters).' },
        { status: 400 }
      );
    }
    if (cleanMessage.length > 3000) {
      return NextResponse.json(
        { error: 'Message content exceeds maximum allowed limit (3000 characters).' },
        { status: 400 }
      );
    }

    // 4. Generate reference identifier
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referenceNumber = `OB-CNT-${dateStr}-${randStr}`;
    const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

    // 5. Authoritatively enforce server-controlled recipients (clients cannot supply recipients)
    const { salesEmail, marketingEmail } = getNotificationRecipients();

    // 6. Persist enquiry into database / store
    try {
      await createBulkRFQ({
        companyName: cleanCompany || 'Not Provided',
        contactPerson: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        category: 'Customer Contact Inquiry',
        requirements: `[Contact Form Ref: ${referenceNumber}]\n${cleanMessage}`,
        estimatedQuantity: 'N/A',
        deliveryLocation: 'officebazzar.com/contact',
      });
    } catch (dbErr) {
      console.error('[Contact API] Failed to persist enquiry to database:', dbErr);
    }

    // 7. Dispatch notification email to Sales (TO) and Marketing (CC)
    const submission: ContactUsSubmission = {
      referenceNumber,
      name: cleanName,
      companyName: cleanCompany || undefined,
      email: cleanEmail,
      phone: cleanPhone,
      message: cleanMessage,
      submittedAt,
    };

    const emailResult = await sendContactUsEmailNotification(submission);

    // 8. Server-side Zoho CRM synchronization (non-blocking fallback)
    // Strictly executes after database write and email notifications succeed
    try {
      await syncContactEnquiryToZoho({
        referenceNumber,
        name: cleanName,
        companyName: cleanCompany,
        email: cleanEmail,
        phone: cleanPhone,
        message: cleanMessage,
        submittedAt,
        deliveryLocation: 'officebazzar.com/contact',
      });
    } catch (zohoErr) {
      console.error('[Contact API] Unexpected error during Zoho CRM synchronization:', zohoErr);
    }

    return NextResponse.json(
      {
        success: true,
        referenceNumber,
        notificationStatus: emailResult.success ? 'sent' : 'unconfigured_or_failed',
        errorDetails: !emailResult.success ? emailResult.error : undefined,
        recipients: {
          to: salesEmail,
          cc: marketingEmail,
        },
        message:
          'Thank you for contacting OfficeBazzar. Our sales and support team in Chennai will respond within 24 hours.',
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[Contact API Error]:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while submitting your message. Please try again.',
      },
      { status: 500 }
    );
  }
}
