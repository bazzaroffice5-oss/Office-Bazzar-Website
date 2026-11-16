/**
 * Pure HTTP REST Client for Cloud KV (Upstash Redis / Vercel KV)
 *
 * Lightweight, zero-dependency client that runs in any JavaScript runtime
 * (Serverless Lambdas, Edge Runtime, and Node.js) with NO Node.js built-ins (fs, os)
 * so it never triggers Turbopack client-bundle resolution errors.
 */

export interface KVConfig {
  url: string;
  token: string;
  isCloud: boolean;
  sourceUrlKey: string;
  sourceTokenKey: string;
}

function normalizeRestUrl(rawUrl: string): string | null {
  try {
    let cleaned = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    if (!cleaned) return null;
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`;
    }
    const parsed = new URL(cleaned);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

export function getKVConfig(): KVConfig | null {
  if (typeof process === 'undefined' || !process.env) return null;

  // 1. Direct candidate pairs in order of preference:
  const candidatePairs: [string, string][] = [
    ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    ['STORAGE_KV_REST_API_URL', 'STORAGE_KV_REST_API_TOKEN'],
    ['STORAGE_UPSTASH_REDIS_REST_URL', 'STORAGE_UPSTASH_REDIS_REST_TOKEN'],
    ['STORAGE_REST_API_URL', 'STORAGE_REST_API_TOKEN'],
    ['REDIS_REST_URL', 'REDIS_REST_TOKEN'],
    ['STORAGE_REDIS_REST_URL', 'STORAGE_REDIS_REST_TOKEN'],
    ['STORAGE_URL', 'STORAGE_TOKEN'],
  ];

  for (const [urlKey, tokenKey] of candidatePairs) {
    const rawUrl = process.env[urlKey];
    const rawToken = process.env[tokenKey];
    if (rawUrl && rawToken) {
      const cleanUrl = normalizeRestUrl(rawUrl);
      const cleanToken = rawToken.trim().replace(/^["']|["']$/g, '');
      if (cleanUrl && cleanToken) {
        return {
          url: cleanUrl,
          token: cleanToken,
          isCloud: true,
          sourceUrlKey: urlKey,
          sourceTokenKey: tokenKey,
        };
      }
    }
  }

  // 2. Dynamic pattern matching across environment variables
  const envKeys = Object.keys(process.env);
  const urlKeys = envKeys.filter(
    (k) =>
      /(KV_REST_API_URL|UPSTASH_REDIS_REST_URL|REST_API_URL|REDIS_REST_URL)$/i.test(k) &&
      Boolean(process.env[k])
  );

  for (const urlKey of urlKeys) {
    const rawUrl = process.env[urlKey];
    if (!rawUrl) continue;
    const cleanUrl = normalizeRestUrl(rawUrl);
    if (!cleanUrl) continue;

    const basePrefix = urlKey.replace(
      /(KV_REST_API_URL|UPSTASH_REDIS_REST_URL|REST_API_URL|REDIS_REST_URL)$/i,
      ''
    );
    const candidateTokenKeys = [
      `${basePrefix}KV_REST_API_TOKEN`,
      `${basePrefix}UPSTASH_REDIS_REST_TOKEN`,
      `${basePrefix}REST_API_TOKEN`,
      `${basePrefix}REDIS_REST_TOKEN`,
      `${basePrefix}TOKEN`,
      'KV_REST_API_TOKEN',
      'UPSTASH_REDIS_REST_TOKEN',
    ];

    for (const tokenKey of candidateTokenKeys) {
      const rawToken = process.env[tokenKey];
      if (rawToken && rawToken.trim()) {
        return {
          url: cleanUrl,
          token: rawToken.trim().replace(/^["']|["']$/g, ''),
          isCloud: true,
          sourceUrlKey: urlKey,
          sourceTokenKey: tokenKey,
        };
      }
    }
  }

  return null;
}

export async function callKV<T = any>(command: (string | number)[]): Promise<T | null> {
  const config = getKVConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.result !== undefined ? data.result : data;
  } catch {
    return null;
  }
}
