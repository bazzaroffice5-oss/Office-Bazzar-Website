import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsAdminSession } from '@/lib/analytics/auth';
import { getAnalyticsData } from '@/lib/analytics/store';
import { DateRangePreset } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(req: NextRequest) {
  try {
    const session = await getAnalyticsAdminSession();
    if (!session.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(req.url);
    const rangeParam = (searchParams.get('range') || 'all').toLowerCase();
    const range: DateRangePreset = ['today', '7d', '30d', 'all'].includes(rangeParam)
      ? (rangeParam as DateRangePreset)
      : 'all';

    const data = await getAnalyticsData(range);

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retrieve analytics data.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
