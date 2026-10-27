import { NextResponse } from 'next/server';
import { retryNotification } from '@/lib/notifications/service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json({ error: 'Notification Log ID is required' }, { status: 400 });
    }

    const result = await retryNotification(logId);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retry notification dispatch' },
      { status: 500 }
    );
  }
}
