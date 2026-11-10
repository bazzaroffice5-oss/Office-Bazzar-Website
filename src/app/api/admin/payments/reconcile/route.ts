import { NextResponse } from 'next/server';
import { reconcilePendingPayments } from '@/lib/payments/reconciliation';

function isAuthorized(req: Request): boolean {
  // 1. Check Vercel Cron header
  if (req.headers.get('x-vercel-cron')) {
    return true;
  }

  // 2. Check Admin Secret Key header or Bearer token
  const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_PASSWORD || '';
  const authHeader = req.headers.get('authorization') || '';
  const customHeader = req.headers.get('x-admin-secret') || '';

  if (adminSecret) {
    if (customHeader === adminSecret) return true;
    if (authHeader.startsWith('Bearer ') && authHeader.slice(7) === adminSecret) return true;
  }

  // 3. Check query param secret
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret');
  if (adminSecret && querySecret === adminSecret) {
    return true;
  }

  // 4. Check admin session cookie
  const cookieHeader = req.headers.get('cookie') || '';
  if (cookieHeader.includes('ob_admin_session=') || cookieHeader.includes('admin_session=')) {
    return true;
  }

  return false;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Valid admin credentials or cron authorization required.' },
      { status: 401 }
    );
  }

  try {
    const result = await reconcilePendingPayments();
    return NextResponse.json({
      success: true,
      message: 'Razorpay payment reconciliation completed.',
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Payment reconciliation failed.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}

