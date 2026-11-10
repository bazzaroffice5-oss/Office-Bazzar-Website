import { NextResponse } from 'next/server';
import { isZohoConfigured, getZohoConfigDiagnostics } from '@/lib/zoho/client';
import { getProducts } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'healthy' | 'degraded' | 'unconfigured'; latencyMs?: number; details?: unknown }> = {};

  // 1. Zoho CRM Connectivity Check
  try {
    const zohoStart = Date.now();
    const isConfigured = await isZohoConfigured();
    const zohoDiagnostics = await getZohoConfigDiagnostics();
    const zohoLatency = Date.now() - zohoStart;

    checks.zohoCrm = {
      status: isConfigured ? 'healthy' : 'unconfigured',
      latencyMs: zohoLatency,
      details: {
        configured: isConfigured,
        accountsUrl: zohoDiagnostics.accountsUrl,
        apiDomain: zohoDiagnostics.apiDomain,
        hasClientId: zohoDiagnostics.hasClientId,
        hasClientSecret: zohoDiagnostics.hasClientSecret,
        hasRefreshToken: zohoDiagnostics.hasRefreshToken,
      },
    };
  } catch (err: unknown) {
    checks.zohoCrm = {
      status: 'degraded',
      details: err instanceof Error ? err.message : 'Unknown Zoho error',
    };
  }

  // 2. Product Catalog Store Check
  try {
    const catalogStart = Date.now();
    const { total } = await getProducts();
    const catalogLatency = Date.now() - catalogStart;

    checks.catalogStore = {
      status: total >= 1900 ? 'healthy' : 'degraded',
      latencyMs: catalogLatency,
      details: {
        activeProducts: total,
      },
    };
  } catch (err: unknown) {
    checks.catalogStore = {
      status: 'degraded',
      details: err instanceof Error ? err.message : 'Catalog store lookup error',
    };
  }

  const overallHealthy =
    checks.zohoCrm?.status === 'healthy' &&
    checks.catalogStore?.status === 'healthy';

  const totalDuration = Date.now() - startTime;

  return NextResponse.json(
    {
      status: overallHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      executionTimeMs: totalDuration,
      environment: process.env.NODE_ENV || 'production',
      checks,
    },
    {
      status: overallHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
