import { NextRequest, NextResponse } from 'next/server';
import { isZohoConfigured, getZohoConfigDiagnostics } from '@/lib/zoho/client';
import { getProducts } from '@/lib/db/store';
import { getSessionFromRequest } from '@/lib/auth/service';
import { getDistributedDiagnostics, testDistributedKV } from '@/lib/distributed/coordinator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // 1. Zoho CRM Connectivity Check
  let zohoHealthy = false;
  let zohoLatency = 0;
  let zohoDiagnostics: any = null;
  try {
    const zohoStart = Date.now();
    zohoHealthy = await isZohoConfigured();
    zohoLatency = Date.now() - zohoStart;
    zohoDiagnostics = await getZohoConfigDiagnostics();
  } catch {
    zohoHealthy = false;
  }

  // 2. Product Catalog Store Check
  let catalogHealthy = false;
  let catalogCount = 0;
  let catalogLatency = 0;
  try {
    const catStart = Date.now();
    const { total } = await getProducts();
    catalogCount = total;
    catalogLatency = Date.now() - catStart;
    catalogHealthy = total >= 1900;
  } catch {
    catalogHealthy = false;
  }

  const overallHealthy = zohoHealthy && catalogHealthy;

  // 3. Distributed Coordinator Health & Diagnostics
  const coordDiag = getDistributedDiagnostics();
  let redisTestResult: any = null;
  if (coordDiag.isCloudKVConfigured) {
    try {
      redisTestResult = await testDistributedKV();
    } catch (err: any) {
      redisTestResult = { error: err?.message || 'Redis test failure' };
    }
  }

  // Check authorization for detailed diagnostics (Admin session or internal secret)
  const sessionUser = getSessionFromRequest(req);
  const isAdmin = sessionUser && (sessionUser.role === 'admin' || sessionUser.role === 'staff');
  const internalAuth = req.headers.get('x-health-auth-key');
  const isAuthorized = isAdmin || (Boolean(process.env.CRON_SECRET) && internalAuth === process.env.CRON_SECRET);

  // 1. Clean, unexposed public health response for anonymous callers / uptime monitors
  if (!isAuthorized) {
    return NextResponse.json(
      {
        status: overallHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          crm: zohoHealthy ? 'operational' : 'degraded',
          catalog: catalogHealthy ? 'operational' : 'degraded',
          coordinator: coordDiag.coordinatorType,
        },
        coordinatorDetails: {
          isCloudKVConfigured: coordDiag.isCloudKVConfigured,
          coordinatorType: coordDiag.coordinatorType,
          sourceUrlKey: coordDiag.sourceUrlKey,
          sourceTokenKey: coordDiag.sourceTokenKey,
          detectedEnvKeys: coordDiag.detectedEnvKeys,
          ...(redisTestResult
            ? {
                redisTest: {
                  ping: redisTestResult.ping,
                  writeRead: redisTestResult.writeReadTest,
                  latencyMs: redisTestResult.latencyMs,
                  error: redisTestResult.error,
                },
              }
            : {}),
        },
      },
      {
        status: overallHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  // 2. Protected detailed diagnostics for authenticated administrators
  return NextResponse.json(
    {
      status: overallHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      executionTimeMs: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'production',
      diagnostics: {
        zohoCrm: {
          status: zohoHealthy ? 'healthy' : 'degraded',
          latencyMs: zohoLatency,
          configured: zohoHealthy,
          accountsUrl: zohoDiagnostics?.accountsUrl,
          apiDomain: zohoDiagnostics?.apiDomain,
        },
        catalogStore: {
          status: catalogHealthy ? 'healthy' : 'degraded',
          activeProducts: catalogCount,
          latencyMs: catalogLatency,
        },
        coordinator: {
          ...coordDiag,
          test: redisTestResult,
        },
        memory: {
          rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
        },
      },
    },
    {
      status: overallHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
