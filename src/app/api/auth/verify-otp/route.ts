import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpTicket, setSessionCookie, SessionUser } from '@/lib/auth/service';
import { syncCustomerToZohoContact, getCustomerProfileFromZoho } from '@/lib/zoho/contacts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const otp = body?.otp?.trim();
    const submittedEmail = body?.email?.trim()?.toLowerCase();
    const name = body?.name?.trim();
    const companyName = body?.companyName?.trim();
    const phone = body?.phone?.trim();
    const gstin = body?.gstin?.trim();

    // Read signed ticket from cookie or request body
    const ticketFromCookie = req.cookies.get('ob_auth_ticket')?.value;
    const ticket = ticketFromCookie || body?.ticket;

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Verification session expired. Please request a new code.' },
        { status: 400 }
      );
    }

    if (!otp) {
      return NextResponse.json(
        { success: false, error: 'Please enter the 6-digit verification code.' },
        { status: 400 }
      );
    }

    // 1. Cryptographically verify the OTP ticket
    const verification = verifyOtpTicket(ticket, otp);
    if (!verification.success || !verification.email) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Invalid verification code.' },
        { status: 400 }
      );
    }

    const email = verification.email;

    // 2. Sync / Upsert Customer in Zoho CRM Contacts (and Accounts)
    let contactId: string | undefined = undefined;
    let accountId: string | undefined = undefined;

    try {
      const syncRes = await syncCustomerToZohoContact({
        name: name || verification.name || email.split('@')[0],
        email,
        phone,
        companyName,
        gstin,
        websiteCustomerId: `ob_cust_${Buffer.from(email).toString('hex').slice(0, 12)}`,
      });
      if (syncRes.success) {
        contactId = syncRes.contactId;
        accountId = syncRes.accountId;
      }
    } catch (crmErr) {
      console.warn('[Verify OTP] Non-blocking Zoho CRM sync error:', crmErr);
    }

    // 3. Check for admin authorization
    const adminEmails = (process.env.ADMIN_ALLOWED_EMAILS || 'sales4@officebazzar.com,marketing@officebazzar.com')
      .split(',')
      .map((e) => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(email);

    const sessionUser: SessionUser = {
      id: contactId || `cust_${Buffer.from(email).toString('hex').slice(0, 16)}`,
      email,
      name: name || verification.name || email.split('@')[0],
      companyName,
      role: isAdmin ? 'admin' : 'customer',
      zohoContactId: contactId,
      zohoAccountId: accountId,
    };

    const res = NextResponse.json({
      success: true,
      user: sessionUser,
      message: 'Authentication successful.',
    });

    // 4. Attach secure HttpOnly session cookie
    setSessionCookie(res, sessionUser);
    return res;
  } catch (err: any) {
    console.error('[Verify OTP API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}

