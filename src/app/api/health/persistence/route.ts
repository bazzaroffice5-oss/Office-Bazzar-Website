import { NextResponse } from 'next/server';
import { getPersistenceDiagnostics } from '@/lib/durable-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * GET /api/health/persistence
 *
 * Lightweight read-only diagnostic endpoint that verifies:
 * - Cloudinary Admin API direct connectivity & latency
 * - Upstash KV ping & latency
 * - Concurrency controls (distributed locks & atomic round-robin)
 * - Authoritative record counts for products, blogs, and quotations
 *
 * Sanitized output: Never leaks sensitive API keys, secrets, or internal tokens.
 */
export async function GET() {
  try {
    const report = await getPersistenceDiagnostics();
    const httpStatus = report.status === 'HEALTHY' ? 200 : 503;

    return NextResponse.json(report, {
      status: httpStatus,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'DEGRADED',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown diagnostic error',
      },
      {
        status: 503,
        headers: NO_CACHE_HEADERS,
      }
    );
  }
}
