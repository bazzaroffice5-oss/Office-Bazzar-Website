import { NextRequest, NextResponse } from 'next/server';
import { createAndSendOtp, setOtpTicketCookie } from '@/lib/auth/service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email?.trim();
    const name = body?.name?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const result = await createAndSendOtp(email, name);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate verification code.' },
        { status: 500 }
      );
    }

    const res = NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
      cooldown: result.cooldown,
    });

    setOtpTicketCookie(res, result.ticket);
    return res;
  } catch (err: any) {
    console.error('[Send OTP API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

