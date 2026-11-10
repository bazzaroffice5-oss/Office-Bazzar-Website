import { NextRequest, NextResponse } from 'next/server';
import { getAllQuotations, getNotificationLogs } from '@/lib/db/store';
import { QuotationStatus } from '@/types';
import { getSessionFromRequest } from '@/lib/auth/service';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = getSessionFromRequest(req);
    if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'staff')) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrative session required.' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') as QuotationStatus | null;
    const includeLogs = searchParams.get('includeLogs') === 'true';

    const quotations = await getAllQuotations(statusParam || undefined);
    let notificationLogs = undefined;

    if (includeLogs) {
      notificationLogs = await getNotificationLogs();
    }

    return NextResponse.json({
      quotations,
      notificationLogs,
      count: quotations.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}
