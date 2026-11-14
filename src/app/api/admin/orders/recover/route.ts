import { NextResponse } from 'next/server';
import { drainZohoDowntimeOutbox, readOutboxRecords } from '@/lib/zoho/downtime-recovery';

function isAuthorized(req: Request): boolean {
  if (req.headers.get('x-vercel-cron')) return true;

  const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_PASSWORD || '';
  const authHeader = req.headers.get('authorization') || '';
  const customHeader = req.headers.get('x-admin-secret') || '';

  if (adminSecret) {
    if (customHeader === adminSecret) return true;
    if (authHeader.startsWith('Bearer ') && authHeader.slice(7) === adminSecret) return true;
  }

  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret');
  if (adminSecret && querySecret === adminSecret) return true;

  const cookieHeader = req.headers.get('cookie') || '';
  if (cookieHeader.includes('ob_admin_session=') || cookieHeader.includes('admin_session=')) return true;

  return false;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin credentials or cron authorization required.' },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('drain') === 'true';

    let drainResult = null;
    if (force) {
      drainResult = await drainZohoDowntimeOutbox(true);
    }

    const records = readOutboxRecords();

    return NextResponse.json({
      success: true,
      pendingCount: records.filter((r) => r.syncState !== 'synced').length,
      totalCount: records.length,
      records,
      drainResult,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to inspect downtime outbox.';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin credentials or cron authorization required.' },
      { status: 401 }
    );
  }

  try {
    const drainResult = await drainZohoDowntimeOutbox(true);
    return NextResponse.json({
      success: true,
      message: 'Zoho CRM downtime outbox drain executed.',
      drainResult,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to drain downtime outbox.';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

