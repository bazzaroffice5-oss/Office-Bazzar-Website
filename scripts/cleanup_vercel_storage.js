#!/usr/bin/env node
/**
 * Standalone DevOps Storage & Cache Cleanup Script
 *
 * Scans Upstash Redis / Vercel KV for bloated keys that cause 100% storage limit exhaustion:
 * 1. Scans for large legacy `prod_img_data:*` keys (which held multi-megabyte uncompressed base64 images).
 * 2. Trims `outbox:zoho_orders` queue to the most recent 50 entries.
 * 3. Deletes stale `idempotency:*` markers and old `lock:*` keys.
 * 4. Reports total keys scanned, deleted, and estimated storage/bytes freed.
 *
 * Usage:
 *   node scripts/cleanup_vercel_storage.js [--dry-run] [--all-images]
 *
 * Environment variables:
 *   KV_REST_API_URL / UPSTASH_REDIS_REST_URL
 *   KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN
 *   (Automatically loaded from .env or .env.local if present)
 */

const fs = require('fs');
const path = require('path');

// Load .env or .env.local if available
function loadEnvFile(filename) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const isDryRun = process.argv.includes('--dry-run');
const deleteAllImages = process.argv.includes('--all-images');

const candidatePairs = [
  ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
  ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  ['STORAGE_KV_REST_API_URL', 'STORAGE_KV_REST_API_TOKEN'],
  ['STORAGE_UPSTASH_REDIS_REST_URL', 'STORAGE_UPSTASH_REDIS_REST_TOKEN'],
  ['REDIS_REST_URL', 'REDIS_REST_TOKEN'],
];

let kvUrl = null;
let kvToken = null;
let matchedPair = null;

for (const [uKey, tKey] of candidatePairs) {
  if (process.env[uKey] && process.env[tKey]) {
    kvUrl = process.env[uKey].trim().replace(/\/+$/, '');
    if (!kvUrl.startsWith('http://') && !kvUrl.startsWith('https://')) {
      kvUrl = `https://${kvUrl}`;
    }
    kvToken = process.env[tKey].trim();
    matchedPair = `${uKey} / ${tKey}`;
    break;
  }
}

if (!kvUrl || !kvToken) {
  console.error('\x1b[31m[ERROR] Cloud KV credentials not found in environment or .env files.\x1b[0m');
  console.error('Please ensure KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN) are set.');
  process.exit(1);
}

async function callKV(command) {
  const url = `${kvUrl}/${command.map((c) => encodeURIComponent(String(c))).join('/')}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${kvToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`KV API returned ${res.status}: ${errText}`);
  }

  const json = await res.json();
  return json.result;
}

async function scanKeys(pattern) {
  const keys = [];
  let cursor = '0';
  do {
    const res = await callKV(['SCAN', cursor, 'MATCH', pattern, 'COUNT', '100']);
    if (!res || !Array.isArray(res) || res.length < 2) break;
    cursor = String(res[0]);
    const found = res[1] || [];
    keys.push(...found);
  } while (cursor !== '0');
  return keys;
}

async function runCleanup() {
  console.log('\x1b[36m========================================================\x1b[0m');
  console.log('\x1b[36m   OFFICE BAZZAR - VERCEL STORAGE & CACHE CLEANUP TOOL   \x1b[0m');
  console.log('\x1b[36m========================================================\x1b[0m');
  console.log(`Connected via: ${matchedPair}`);
  console.log(`Endpoint:     ${kvUrl}`);
  console.log(`Mode:         ${isDryRun ? '\x1b[33mDRY RUN (no keys will be deleted)\x1b[0m' : '\x1b[32mACTIVE EXECUTION\x1b[0m'}\n`);

  let totalDeletedKeys = 0;
  let totalBytesFreed = 0;

  // 1. Scan image data keys (the primary culprit for 100% capacity hit)
  console.log('\x1b[34m[1/3] Scanning for bloated image data keys (`prod_img_data:*`)...\x1b[0m');
  try {
    const imgKeys = await scanKeys('prod_img_data:*');
    console.log(`Found ${imgKeys.length} image keys.`);

    for (const key of imgKeys) {
      try {
        const strLen = await callKV(['STRLEN', key]);
        const bytes = typeof strLen === 'number' ? strLen : 0;
        const kb = (bytes / 1024).toFixed(1);

        // Bloated legacy entries are typically > 100KB base64 payloads
        const isBloated = bytes > 100 * 1024;
        if (deleteAllImages || isBloated) {
          console.log(`  - Key: ${key} (${kb} KB) ${isBloated ? '[\x1b[31mBLOATED\x1b[0m]' : ''}`);
          if (!isDryRun) {
            await callKV(['DEL', key]);
          }
          totalDeletedKeys++;
          totalBytesFreed += bytes;
        } else {
          console.log(`  - Key: ${key} (${kb} KB) [OK - Compressed]`);
        }
      } catch (err) {
        console.warn(`    Warning checking key ${key}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`Failed during image key scan: ${err.message}`);
  }

  // 2. Outbox Queue Trim
  console.log('\n\x1b[34m[2/3] Inspecting outbox queue (`outbox:zoho_orders`)...\x1b[0m');
  try {
    const qLen = await callKV(['LLEN', 'outbox:zoho_orders']);
    console.log(`Current outbox length: ${qLen || 0}`);
    if (qLen && qLen > 50) {
      console.log(`Trimming outbox to latest 50 items (removing ${qLen - 50} old entries)...`);
      if (!isDryRun) {
        await callKV(['LTRIM', 'outbox:zoho_orders', '0', '49']);
      }
      console.log('Outbox trimmed successfully.');
    }
  } catch (err) {
    console.warn(`Failed during outbox trim: ${err.message}`);
  }

  // 3. Stale Idempotency & Distributed Lock Keys
  console.log('\n\x1b[34m[3/3] Scanning for expired idempotency & lock keys...\x1b[0m');
  try {
    const staleKeys = [
      ...(await scanKeys('lock:*')),
      ...(await scanKeys('idempotency:*')),
    ];
    console.log(`Found ${staleKeys.length} lock/idempotency keys.`);

    for (const key of staleKeys) {
      try {
        const ttl = await callKV(['TTL', key]);
        // If key has no TTL (-1) or is expired
        if (ttl === -1 || ttl <= 0) {
          console.log(`  - Stale key without TTL: ${key}`);
          if (!isDryRun) {
            await callKV(['DEL', key]);
          }
          totalDeletedKeys++;
        }
      } catch (err) {
        console.warn(`    Warning checking key ${key}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`Failed during lock/idempotency key scan: ${err.message}`);
  }

  console.log('\n\x1b[32m========================================================\x1b[0m');
  console.log('\x1b[32m                    CLEANUP COMPLETE                    \x1b[0m');
  console.log('\x1b[32m========================================================\x1b[0m');
  console.log(`Total Keys Cleared:      ${totalDeletedKeys}`);
  console.log(`Estimated Storage Freed: ${(totalBytesFreed / 1024 / 1024).toFixed(2)} MB (${totalBytesFreed} bytes)`);
  if (isDryRun) {
    console.log('\x1b[33mNOTE: This was a dry run. Run without `--dry-run` to execute deletions.\x1b[0m');
  }
}

runCleanup().catch((err) => {
  console.error('\x1b[31mFatal execution error:\x1b[0m', err);
  process.exit(1);
});
