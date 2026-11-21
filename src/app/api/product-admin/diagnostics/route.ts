import { NextRequest, NextResponse } from 'next/server';
import { getProductAdminSession } from '@/lib/product-admin/auth';
import { isZohoConfiguredSync } from '@/lib/zoho/client';
import { getKVConfig } from '@/lib/distributed/kv-client';
import { getProductsFromZoho, invalidateZohoProductCache } from '@/lib/zoho/products';

export const dynamic = 'force-dynamic';

/**
 * GET /api/product-admin/diagnostics
 *
 * Returns the exact persistence state for every storage layer so you can
 * diagnose exactly why product edits are or are not surviving across
 * Vercel serverless container boundaries.
 *
 * Access: Admin-only (requires active product-admin session cookie).
 */
export async function GET(request: NextRequest) {
  const session = await getProductAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku')?.toUpperCase().trim() || null;

  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    requestedSku: sku,
  };

  // ── Layer 1: Zoho CRM configuration ─────────────────────────────────────
  report.zoho = {
    configured: isZohoConfiguredSync(),
    hasClientId: Boolean(process.env.ZOHO_CLIENT_ID?.trim()),
    hasClientSecret: Boolean(process.env.ZOHO_CLIENT_SECRET?.trim()),
    hasRefreshToken: Boolean(process.env.ZOHO_REFRESH_TOKEN?.trim()),
    accountsUrl: process.env.ZOHO_ACCOUNTS_URL || '(not set)',
    apiDomain: process.env.ZOHO_API_DOMAIN || '(not set)',
  };

  // ── Layer 2: Cloud KV configuration ──────────────────────────────────────
  const kvConfig = getKVConfig();
  report.kv = {
    configured: Boolean(kvConfig),
    sourceUrlKey: kvConfig?.sourceUrlKey || null,
    sourceTokenKey: kvConfig?.sourceTokenKey || null,
    url: kvConfig ? `${kvConfig.url.substring(0, 30)}…` : null,
  };

  // ── Layer 3: Zoho CRM Notes live fetch ───────────────────────────────────
  let zohoNoteResult: unknown = '(skipped — Zoho not configured)';
  if (isZohoConfiguredSync()) {
    try {
      // Force-refresh and try to read all product notes
      invalidateZohoProductCache();
      const products = await getProductsFromZoho(true);
      const targetProduct = sku ? products.find(
        (p) => p.sku.toUpperCase() === sku || p.id.toLowerCase() === sku.toLowerCase()
      ) : null;

      zohoNoteResult = {
        totalProductsFetched: products.length,
        targetProduct: targetProduct
          ? {
              id: targetProduct.id,
              name: targetProduct.name,
              sku: targetProduct.sku,
              description: (targetProduct.description || '').substring(0, 80),
              images: targetProduct.images,
              isActive: targetProduct.isActive,
              updatedAt: (targetProduct as any).updatedAt || null,
            }
          : sku
          ? `NOT FOUND in catalog (SKU: ${sku})`
          : '(no SKU requested)',
      };
    } catch (err) {
      zohoNoteResult = {
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
  report.zohoNotes = zohoNoteResult;

  // ── Layer 4: Cloud KV product read (if configured) ───────────────────────
  let kvResult: unknown = '(skipped — KV not configured)';
  if (kvConfig && sku) {
    try {
      const { callKV } = await import('@/lib/distributed/kv-client');
      const raw = await callKV<string>(['GET', `custom_prod:${sku}`]);
      if (raw && typeof raw === 'string') {
        const parsed = JSON.parse(raw);
        kvResult = {
          found: true,
          name: parsed.name,
          sku: parsed.sku,
          description: (parsed.description || '').substring(0, 80),
          images: parsed.images,
          isActive: parsed.isActive,
          updatedAt: parsed.updatedAt,
        };
      } else {
        kvResult = { found: false, raw };
      }
    } catch (err) {
      kvResult = { error: err instanceof Error ? err.message : String(err) };
    }
  } else if (!kvConfig) {
    kvResult = {
      found: false,
      reason: 'No KV env vars found. Set KV_REST_API_URL + KV_REST_API_TOKEN (Upstash/Vercel KV) for cross-container persistence fallback.',
      checkedKeys: ['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'STORAGE_KV_REST_API_URL'],
    };
  }
  report.kvStore = kvResult;

  // ── Summary + recommendations ─────────────────────────────────────────────
  const zohoOk = Boolean((report.zoho as any).configured);
  const kvOk = Boolean(kvConfig);

  report.persistenceSummary = {
    zohoNotesLayerActive: zohoOk,
    kvLayerActive: kvOk,
    isFullyDurable: zohoOk,
    recommendation: !zohoOk
      ? 'CRITICAL: Zoho CRM not configured. Product edits CANNOT survive serverless container restarts. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN.'
      : !kvOk
      ? 'WARNING: No Cloud KV store. Zoho CRM Notes is the sole durable layer (this is fine as long as Zoho is working). Add KV_REST_API_URL + KV_REST_API_TOKEN for extra redundancy.'
      : 'OK: Both Zoho CRM Notes and Cloud KV are active. Product edits are fully durable.',
  };

  return NextResponse.json(report, { status: 200 });
}
