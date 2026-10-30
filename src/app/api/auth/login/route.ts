import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminCredentials,
  setSessionCookie,
  createAndSendOtp,
  verifyOtpTicket,
  setOtpTicketCookie,
  SessionUser,
} from '@/lib/auth/service';
import { getCustomerProfileFromZoho, syncCustomerToZohoContact } from '@/lib/zoho/contacts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email?.trim()?.toLowerCase();
    const password = body?.password;
    const otp = body?.otp?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const adminEmails = (
      process.env.ADMIN_ALLOWED_EMAILS ||
      'sales4@officebazzar.com,marketing@officebazzar.com'
    )
      .split(',')
      .map((e) => e.trim().toLowerCase());
    const isAdminEmail = adminEmails.includes(email);

    // Flow 1: Admin Password Sign-In
    if (isAdminEmail && password) {
      const adminAuth = verifyAdminCredentials(email, password);
      if (!adminAuth.success || !adminAuth.user) {
        return NextResponse.json(
          { success: false, error: adminAuth.error || 'Invalid admin credentials.' },
          { status: 401 }
        );
      }

      const res = NextResponse.json({
        success: true,
        user: adminAuth.user,
        message: 'Admin signed in successfully.',
      });
      setSessionCookie(res, adminAuth.user);
      return res;
    }

    // Flow 2: Customer OTP Verification Submission
    if (otp) {
      const ticketFromCookie = req.cookies.get('ob_auth_ticket')?.value;
      const ticket = ticketFromCookie || body?.ticket;

      if (!ticket) {
        return NextResponse.json(
          { success: false, error: 'Verification session expired. Please request a new code.' },
          { status: 400 }
        );
      }

      const verification = verifyOtpTicket(ticket, otp);
      if (!verification.success) {
        return NextResponse.json(
          { success: false, error: verification.error || 'Invalid verification code.' },
          { status: 400 }
        );
      }

      // Load or sync customer in Zoho CRM
      const profile = await getCustomerProfileFromZoho(email);
      const contact = profile?.contact;

      const sessionUser: SessionUser = {
        id: contact?.id || `cust_${Buffer.from(email).toString('hex').slice(0, 16)}`,
        email,
        name: contact?.Full_Name || `${contact?.First_Name || ''} ${contact?.Last_Name || ''}`.trim() || verification.name || email.split('@')[0],
        companyName: contact?.Account_Name?.name,
        role: 'customer',
        zohoContactId: contact?.id,
      };

      const res = NextResponse.json({
        success: true,
        user: sessionUser,
        message: 'Signed in successfully.',
      });
      setSessionCookie(res, sessionUser);
      return res;
    }

    // Flow 3: Customer Login via OTP Initiation
    // Send OTP verification code to customer email
    const otpResult = await createAndSendOtp(email);
    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, error: otpResult.error || 'Failed to dispatch verification code.' },
        { status: 500 }
      );
    }

    const res = NextResponse.json({
      success: true,
      requiresOtp: true,
      message: 'A 6-digit verification code has been sent to your email.',
      cooldown: otpResult.cooldown,
    });
    setOtpTicketCookie(res, otpResult.ticket);
    return res;
  } catch (err: any) {
    console.error('[Login API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}

