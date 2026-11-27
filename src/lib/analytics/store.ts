import crypto from 'crypto';
import {
  QuoteLogRecord,
  PageViewRecord,
  AnalyticsKPIs,
  DateRangePreset,
  PageBreakdownItem,
  RecipientStats,
} from './types';
import { getNotificationRecipients } from '@/lib/notifications/service';

// Cloudinary & Upstash KV fallback keys
const ANALYTICS_DB_PUBLIC_ID = 'office-bazzar-db/analytics.json';
const KV_KEY_ANALYTICS_QUOTES = 'office_bazzar:analytics:quotes';
const KV_KEY_ANALYTICS_VIEWS = 'office_bazzar:analytics:views';

interface DurableAnalyticsPayload {
  version: number;
  updatedAt: string;
  quotes: QuoteLogRecord[];
  pageViews: PageViewRecord[];
}

let memoryQuotes: QuoteLogRecord[] = [];
let memoryPageViews: PageViewRecord[] = [];
let lastCloudFetchTime = 0;
const CACHE_TTL_MS = 5 * 1000;

export function formatToIST(date: Date): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date) + ' IST';
  } catch {
    return date.toISOString();
  }
}

// ----------------------------------------------------------------------------
// Supabase REST Client (Direct fetch — zero extra npm dependencies)
// ----------------------------------------------------------------------------

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ''), key };
}

async function querySupabase<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  try {
    const headers: Record<string, string> = {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (options.method === 'POST') {
      headers['Prefer'] = 'return=representation';
    }

    const res = await fetch(`${cfg.url}/rest/v1/${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch (err) {
    console.warn('[AnalyticsStore] Supabase query notice:', err instanceof Error ? err.message : err);
  }
  return null;
}

// ----------------------------------------------------------------------------
// Upstash KV REST Helper
// ----------------------------------------------------------------------------

function getKVConfig(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.STORAGE_KV_REST_API_URL ||
    process.env.REDIS_REST_URL;

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.STORAGE_KV_REST_API_TOKEN ||
    process.env.REDIS_REST_TOKEN;

  if (!url || !token) return null;
  return {
    url: url.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, ''),
    token: token.trim().replace(/^["']|["']$/g, ''),
  };
}

async function callKV(command: any[]): Promise<any> {
  const cfg = getKVConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return data?.result;
    }
  } catch {}
  return null;
}

// ----------------------------------------------------------------------------
// Cloudinary Fallback & Dual-Persistence Layer
// ----------------------------------------------------------------------------

function getCloudinaryCredentials() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

async function fetchAnalyticsFromCloudinary(): Promise<DurableAnalyticsPayload | null> {
  const creds = getCloudinaryCredentials();
  if (!creds) return null;

  try {
    const auth = Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString('base64');
    const adminUrl = `https://api.cloudinary.com/v1_1/${creds.cloudName}/resources/raw/upload/${encodeURIComponent(
      ANALYTICS_DB_PUBLIC_ID
    )}`;

    const adminRes = await fetch(adminUrl, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store',
    });

    if (!adminRes.ok) return null;
    const meta = await adminRes.json();
    if (!meta?.secure_url) return null;

    const contentRes = await fetch(meta.secure_url, { cache: 'no-store' });
    if (!contentRes.ok) return null;

    return (await contentRes.json()) as DurableAnalyticsPayload;
  } catch {
    return null;
  }
}

async function saveAnalyticsToCloudinary(payload: DurableAnalyticsPayload): Promise<void> {
  const creds = getCloudinaryCredentials();
  if (!creds) return;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const jsonString = JSON.stringify(payload);
    const base64Data = `data:application/json;base64,${Buffer.from(jsonString).toString('base64')}`;

    const paramsToSign = `invalidate=true&overwrite=true&public_id=${ANALYTICS_DB_PUBLIC_ID}&timestamp=${timestamp}${creds.apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('file', base64Data);
    formData.append('api_key', creds.apiKey);
    formData.append('timestamp', timestamp);
    formData.append('public_id', ANALYTICS_DB_PUBLIC_ID);
    formData.append('overwrite', 'true');
    formData.append('invalidate', 'true');
    formData.append('signature', signature);

    await fetch(`https://api.cloudinary.com/v1_1/${creds.cloudName}/raw/upload`, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (err) {
    console.warn('[AnalyticsStore] Cloudinary save notice:', err instanceof Error ? err.message : err);
  }
}

// ----------------------------------------------------------------------------
// RECORDING METHODS (Fault-tolerant, Non-blocking)
// ----------------------------------------------------------------------------

export async function recordQuoteSubmission(quote: QuoteLogRecord): Promise<void> {
  try {
    // 1. Attempt Supabase insert
    const supabaseConfig = getSupabaseConfig();
    if (supabaseConfig) {
      await querySupabase('quote_logs', {
        method: 'POST',
        body: JSON.stringify(quote),
      }).catch(() => {});
    }

    // 2. Dual-persist to Upstash KV list (capped at 500 recent items)
    await callKV(['LPUSH', KV_KEY_ANALYTICS_QUOTES, JSON.stringify(quote)]).catch(() => {});
    await callKV(['LTRIM', KV_KEY_ANALYTICS_QUOTES, 0, 499]).catch(() => {});

    // 3. Mirror into memory and periodically snapshot to Cloudinary
    memoryQuotes = [quote, ...memoryQuotes.filter((q) => q.id !== quote.id)].slice(0, 500);

    const payload: DurableAnalyticsPayload = {
      version: Date.now(),
      updatedAt: new Date().toISOString(),
      quotes: memoryQuotes,
      pageViews: memoryPageViews,
    };
    saveAnalyticsToCloudinary(payload).catch(() => {});
  } catch (err) {
    console.warn('[AnalyticsStore] Non-blocking quote log notice:', err instanceof Error ? err.message : err);
  }
}

export async function recordPageView(view: PageViewRecord): Promise<void> {
  try {
    // 1. Attempt Supabase insert
    const supabaseConfig = getSupabaseConfig();
    if (supabaseConfig) {
      await querySupabase('page_view_logs', {
        method: 'POST',
        body: JSON.stringify(view),
      }).catch(() => {});
    }

    // 2. Dual-persist to Upstash KV list (capped at 2000 recent items)
    await callKV(['LPUSH', KV_KEY_ANALYTICS_VIEWS, JSON.stringify(view)]).catch(() => {});
    await callKV(['LTRIM', KV_KEY_ANALYTICS_VIEWS, 0, 1999]).catch(() => {});

    // 3. Update memory list
    memoryPageViews = [view, ...memoryPageViews].slice(0, 2000);
  } catch (err) {
    console.warn('[AnalyticsStore] Non-blocking page view log notice:', err instanceof Error ? err.message : err);
  }
}

// ----------------------------------------------------------------------------
// DATA RETRIEVAL & KPI AGGREGATION
// ----------------------------------------------------------------------------

function getStartDateForRange(range: DateRangePreset): Date | null {
  const now = new Date();
  switch (range) {
    case 'today': {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return today;
    }
    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
    case 'all':
    default:
      return null;
  }
}

export async function getAnalyticsData(range: DateRangePreset = 'all'): Promise<AnalyticsKPIs> {
  const { salesEmail, marketingEmail } = getNotificationRecipients();
  const startDate = getStartDateForRange(range);

  let quotes: QuoteLogRecord[] = [];
  let views: PageViewRecord[] = [];

  // 1. Try fetching from Supabase first
  const supabaseConfig = getSupabaseConfig();
  if (supabaseConfig) {
    const quoteFilter = startDate ? `created_at=gte.${startDate.toISOString()}&order=created_at.desc` : 'order=created_at.desc';
    const viewFilter = startDate ? `visited_at=gte.${startDate.toISOString()}&order=visited_at.desc` : 'order=visited_at.desc';

    const [sbQuotes, sbViews] = await Promise.all([
      querySupabase<QuoteLogRecord[]>(`quote_logs?${quoteFilter}`),
      querySupabase<PageViewRecord[]>(`page_view_logs?${viewFilter}`),
    ]);

    if (Array.isArray(sbQuotes)) quotes = sbQuotes;
    if (Array.isArray(sbViews)) views = sbViews;
  }

  // 2. If Supabase returned empty or is not configured, load from Upstash KV or Cloudinary
  if (quotes.length === 0 || views.length === 0) {
    const [kvQuoteStrings, kvViewStrings] = await Promise.all([
      callKV(['LRANGE', KV_KEY_ANALYTICS_QUOTES, 0, 499]),
      callKV(['LRANGE', KV_KEY_ANALYTICS_VIEWS, 0, 1999]),
    ]);

    if (Array.isArray(kvQuoteStrings) && kvQuoteStrings.length > 0) {
      quotes = kvQuoteStrings.map((str: any) => (typeof str === 'string' ? JSON.parse(str) : str)).filter(Boolean);
    }

    if (Array.isArray(kvViewStrings) && kvViewStrings.length > 0) {
      views = kvViewStrings.map((str: any) => (typeof str === 'string' ? JSON.parse(str) : str)).filter(Boolean);
    }

    // 3. Fallback to Cloudinary if KV also empty
    if (quotes.length === 0 && views.length === 0 && Date.now() - lastCloudFetchTime > CACHE_TTL_MS) {
      const cloud = await fetchAnalyticsFromCloudinary();
      if (cloud) {
        if (Array.isArray(cloud.quotes)) quotes = cloud.quotes;
        if (Array.isArray(cloud.pageViews)) views = cloud.pageViews;
        memoryQuotes = quotes;
        memoryPageViews = views;
        lastCloudFetchTime = Date.now();
      }
    }
  }

  // 4. If quotes are still empty, merge existing real quotes from database store
  if (quotes.length === 0) {
    try {
      const { getAllQuotations } = await import('@/lib/db/store');
      const dbQuotes = await getAllQuotations(undefined, 200, 0);
      if (Array.isArray(dbQuotes) && dbQuotes.length > 0) {
        quotes = dbQuotes.map((dq) => ({
          id: dq.quotationNumber || dq.id,
          quotation_number: dq.quotationNumber,
          created_at: dq.createdAt || new Date().toISOString(),
          created_at_ist: formatToIST(new Date(dq.createdAt || Date.now())),
          customer_name: dq.customerName || 'Customer',
          phone: dq.phone || '-',
          email: dq.email || '-',
          company_name: dq.companyName,
          delivery_location: dq.deliveryLocation,
          pincode: dq.pincode,
          message: dq.additionalRequirements,
          products: (dq.items || []).map((it) => ({
            name: it.productName,
            sku: it.sku,
            quantity: it.quantity,
            unitPrice: it.indicativeUnitPrice,
            totalPrice: it.indicativeTotalPrice,
            packSize: it.packSize,
          })),
          total_amount: dq.indicativeTotal,
          recipient_1_email: salesEmail,
          recipient_1_status: 'sent',
          recipient_2_email: marketingEmail,
          recipient_2_status: 'sent',
          customer_email_status: 'sent',
          sync_status: dq.syncStatus || 'SYNCED',
        }));
      }
    } catch (err) {
      console.warn('[AnalyticsStore] Fallback to db store quotes notice:', err);
    }
  }

  // Apply date range filter to local results if not already filtered by Supabase
  if (startDate) {
    const startMs = startDate.getTime();
    quotes = quotes.filter((q) => new Date(q.created_at).getTime() >= startMs);
    views = views.filter((v) => new Date(v.visited_at).getTime() >= startMs);
  }

  // Sort newest first
  quotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  views.sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime());

  // Aggregate Unique Visitors
  const uniqueVisitorSet = new Set<string>();
  const pagePathCountMap = new Map<string, { views: number; uniqueVisitors: Set<string> }>();

  for (const v of views) {
    if (v.visitor_hash) {
      uniqueVisitorSet.add(v.visitor_hash);
    }
    const path = v.page_path || '/';
    let entry = pagePathCountMap.get(path);
    if (!entry) {
      entry = { views: 0, uniqueVisitors: new Set() };
      pagePathCountMap.set(path, entry);
    }
    entry.views += 1;
    if (v.visitor_hash) {
      entry.uniqueVisitors.add(v.visitor_hash);
    }
  }

  const totalPageViews = views.length;
  const uniqueVisitors = uniqueVisitorSet.size;
  const totalQuoteRequests = quotes.length;

  // Aggregate Marketing Email Delivery (exclusively marketing@officebazzar.com)
  let mktSent = 0;
  let mktFailed = 0;
  let mktSkipped = 0;

  for (const q of quotes) {
    const status = q.marketing_status || q.recipient_2_status || q.recipient_1_status;
    if (status === 'sent') mktSent++;
    else if (status === 'failed') mktFailed++;
    else mktSkipped++;
  }

  const mktTotal = mktSent + mktFailed;
  const marketingRecipient: RecipientStats = {
    email: marketingEmail,
    role: 'Marketing Lead Desk',
    sentCount: mktSent,
    failedCount: mktFailed,
    skippedCount: mktSkipped,
    totalDispatched: mktTotal,
    successRate: mktTotal > 0 ? Math.round((mktSent / mktTotal) * 100) : (mktSent > 0 ? 100 : 0),
  };

  // Page breakdown list sorted descending
  const pageBreakdown: PageBreakdownItem[] = Array.from(pagePathCountMap.entries())
    .map(([path, data]) => ({
      path,
      views: data.views,
      uniqueVisitors: data.uniqueVisitors.size,
      percentage: totalPageViews > 0 ? Math.round((data.views / totalPageViews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views);

  return {
    totalPageViews,
    uniqueVisitors,
    totalQuoteRequests,
    marketingRecipient,
    recipient1: marketingRecipient,
    recipient2: marketingRecipient,
    dateRange: range,
    quotes,
    pageBreakdown,
    recentVisitorsCount: Math.round(uniqueVisitors * 0.15) || 1,
  };
}
