/**
 * Durable Product Image Storage & Retrieval Engine
 *
 * Provides resilient, multi-layer persistence for product images uploaded via the Product Admin Panel:
 * 1. Durable Cloud KV (Upstash Redis REST) - survives Vercel redeploys and cold starts across all serverless lambdas.
 * 2. High-speed Ephemeral Disk Cache (/tmp/officebazzar_product_images) - zero-latency serving within the active lambda container.
 * 3. Local Static Directory (public/assets/products/catalog_2026) - for local dev and git-backed builds.
 * 4. Local Journal Backup (src/lib/data/uploaded_product_images.json) - local/staging offline fallback.
 *
 * Generates permanent public URLs at /api/products/images/{filename} that can be saved in Zoho CRM
 * and consumed across all storefront components without external storage dependencies.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { callKV } from '@/lib/distributed/kv-client';

export interface StoredProductImage {
  filename: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
  sku?: string;
  updatedAt: string;
}

export interface SaveProductImageResult {
  success: boolean;
  publicUrl: string;
  filename: string;
  mimeType: string;
  size: number;
}

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

function getMimeType(filename: string, buffer?: Buffer): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (MIME_MAP[ext]) return MIME_MAP[ext];

  if (buffer && buffer.length >= 4) {
    // Magic byte sniffing
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer.length >= 12 &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'image/webp';
    }
  }

  return 'image/jpeg';
}

function getTmpImageDir(): string {
  const dir = path.join(os.tmpdir(), 'officebazzar_product_images');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // ignore
  }
  return dir;
}

function getLocalJournalPath(): string {
  try {
    const candidate = path.join(process.cwd(), 'src', 'lib', 'data', 'uploaded_product_images.json');
    if (fs.existsSync(candidate)) return candidate;
    fs.accessSync(path.dirname(candidate), fs.constants.W_OK);
    return candidate;
  } catch {
    return path.join(os.tmpdir(), 'officebazzar_uploaded_product_images.json');
  }
}

export interface ProductImageJournalData {
  images: Record<string, { mimeType: string; base64: string; size: number; updatedAt: string }>;
  aliases: Record<string, string>;
}

function readLocalJournal(): ProductImageJournalData {
  try {
    const p = getLocalJournalPath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          images: parsed.images && typeof parsed.images === 'object' ? parsed.images : {},
          aliases: parsed.aliases && typeof parsed.aliases === 'object' ? parsed.aliases : {},
        };
      }
    }
  } catch {
    // ignore
  }
  return { images: {}, aliases: {} };
}

function writeLocalJournal(data: ProductImageJournalData) {
  try {
    const p = getLocalJournalPath();
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

/**
 * Persists an uploaded product image across durable storage layers and returns its permanent public URL.
 */
export async function saveProductImage({
  filename,
  buffer,
  mimeType,
  sku,
}: {
  filename: string;
  buffer: Buffer;
  mimeType?: string;
  sku?: string;
}): Promise<SaveProductImageResult> {
  const cleanExt = (filename.split('.').pop() || 'webp').toLowerCase().replace(/[^a-z0-9]/g, '');
  const baseName = (sku || filename.replace(/\.[^/.]+$/, ''))
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .toUpperCase();
  // Cryptographic SHA-256 content-hash ensures a collision-free, immutable URL on every upload & replacement
  const contentHash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  const cleanFilename = `${baseName}_${contentHash}.${cleanExt === 'jpg' ? 'jpeg' : cleanExt}`;
  const determinedMime = mimeType || getMimeType(cleanFilename, buffer);
  const now = new Date().toISOString();

  // 1. Ephemeral lambda disk cache
  try {
    const tmpDir = getTmpImageDir();
    const tmpFile = path.join(tmpDir, cleanFilename);
    fs.writeFileSync(tmpFile, buffer);
  } catch (tmpErr) {
    console.warn('[ImageStore] Tmp write notice:', tmpErr);
  }

  // 2. Local public static directory (works in local dev and build phase)
  try {
    const staticDir = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026');
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }
    const staticFile = path.join(staticDir, cleanFilename);
    fs.writeFileSync(staticFile, buffer);
  } catch {
    // Read-only filesystem in Vercel production is expected; handled by Cloud KV
  }

  // 3. Durable Cloud KV (Upstash Redis REST)
  try {
    const base64Data = buffer.toString('base64');
    await callKV(['SET', `prod_img_data:${cleanFilename}`, base64Data]);
    await callKV([
      'SET',
      `prod_img_meta:${cleanFilename}`,
      JSON.stringify({
        filename: cleanFilename,
        mimeType: determinedMime,
        size: buffer.length,
        sku: baseName,
        updatedAt: now,
      }),
    ]);
    if (sku) {
      await callKV(['SET', `prod_img_sku:${baseName}`, cleanFilename]);
    }
  } catch (kvErr) {
    console.warn('[ImageStore] Cloud KV write notice:', kvErr);
  }

  // 4. Local journal backup
  try {
    const journal = readLocalJournal();
    journal.images[cleanFilename] = {
      mimeType: determinedMime,
      base64: buffer.toString('base64'),
      size: buffer.length,
      updatedAt: now,
    };
    journal.aliases[baseName] = cleanFilename;
    writeLocalJournal(journal);
  } catch (jErr) {
    console.warn('[ImageStore] Journal backup notice:', jErr);
  }

  const publicUrl = `/api/products/images/${cleanFilename}`;
  return {
    success: true,
    publicUrl,
    filename: cleanFilename,
    mimeType: determinedMime,
    size: buffer.length,
  };
}

/**
 * Retrieves a product image from the fastest available storage layer.
 */
export async function getProductImage(
  filename: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '');
  if (!cleanFilename) return null;

  // Layer 1: Ephemeral container disk cache (/tmp)
  try {
    const tmpFile = path.join(getTmpImageDir(), cleanFilename);
    if (fs.existsSync(tmpFile)) {
      const buffer = fs.readFileSync(tmpFile);
      const mimeType = getMimeType(cleanFilename, buffer);
      return { buffer, mimeType };
    }
  } catch {
    // continue
  }

  // Layer 2: Local static assets directory
  try {
    const staticFile = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026', cleanFilename);
    if (fs.existsSync(staticFile)) {
      const buffer = fs.readFileSync(staticFile);
      const mimeType = getMimeType(cleanFilename, buffer);
      return { buffer, mimeType };
    }
  } catch {
    // continue
  }

  // Layer 3: Durable Cloud KV (Upstash Redis)
  try {
    const base64Data = await callKV<string>(['GET', `prod_img_data:${cleanFilename}`]);
    if (base64Data && typeof base64Data === 'string' && base64Data.length > 0) {
      const buffer = Buffer.from(base64Data, 'base64');
      const mimeType = getMimeType(cleanFilename, buffer);

      // Hydrate ephemeral disk cache for zero-latency subsequent requests
      try {
        const tmpFile = path.join(getTmpImageDir(), cleanFilename);
        fs.writeFileSync(tmpFile, buffer);
      } catch {
        // ignore
      }

      return { buffer, mimeType };
    }
  } catch (kvErr) {
    console.warn('[ImageStore] Cloud KV read notice:', kvErr);
  }

  // Layer 4: Local journal backup
  try {
    const journal = readLocalJournal();
    const entry = journal.images[cleanFilename];
    if (entry && entry.base64) {
      const buffer = Buffer.from(entry.base64, 'base64');
      const mimeType = entry.mimeType || getMimeType(cleanFilename, buffer);
      return { buffer, mimeType };
    }
  } catch {
    // continue
  }

  // Layer 5: Backward compatibility alias lookup (resolves unhashed or legacy SKU requests)
  try {
    const baseWithoutExt = cleanFilename.replace(/\.[^/.]+$/, '').toUpperCase();
    const aliasInKv = await callKV<string>(['GET', `prod_img_sku:${baseWithoutExt}`]);
    if (aliasInKv && typeof aliasInKv === 'string' && aliasInKv !== cleanFilename) {
      return getProductImage(aliasInKv);
    }
    const journal = readLocalJournal();
    const aliasInJournal = journal.aliases[baseWithoutExt];
    if (aliasInJournal && typeof aliasInJournal === 'string' && aliasInJournal !== cleanFilename) {
      return getProductImage(aliasInJournal);
    }
  } catch {
    // continue
  }

  return null;
}
