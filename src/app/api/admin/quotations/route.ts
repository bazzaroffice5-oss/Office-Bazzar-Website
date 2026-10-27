import { NextResponse } from 'next/server';
import { getAllQuotations, getNotificationLogs } from '@/lib/db/store';
import { QuotationStatus } from '@/types';

export async function GET(req: Request) {
  try {
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
