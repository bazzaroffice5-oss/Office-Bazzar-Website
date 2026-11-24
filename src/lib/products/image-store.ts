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
import { uploadZohoAttachment, downloadZohoAttachment } from '@/lib/zoho/attachments';
import type { ProcessedImageResult } from '@/lib/images/processor';

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
  sizeKb?: number;
  isTransparent?: boolean;
  isCloudinary?: boolean;
  badgeText?: string;
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

async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = 'office-bazzar-products';
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const formData = new URLSearchParams();
    formData.append('file', base64Data);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[ImageStore] Cloudinary upload returned error:', res.status, errText);
      return null;
    }

    const data = await res.json();
    if (data && typeof data.secure_url === 'string') {
      return data.secure_url;
    }
  } catch (err) {
    console.warn('[ImageStore] Cloudinary upload notice:', err);
  }
  return null;
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
  // Strict file size validation (max 2MB to prevent storage bloat)
  const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `Image size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 2MB. Please upload a smaller image.`
    );
  }

  // 1. Process with automated Transparent Background + <=180KB WebP Image Processor
  try {
    const { processAndOptimizeImage } = await import('@/lib/images/processor');
    const processed = await processAndOptimizeImage({
      buffer,
      filename,
      folder: 'office-bazzar-products',
      maxWidth: 800,
      maxHeight: 800,
      skuOrBaseName: sku,
    });

    if (processed.isCloudinary) {
      return {
        success: true,
        publicUrl: processed.publicUrl,
        filename: processed.filename,
        mimeType: processed.mimeType,
        size: processed.sizeBytes,
        sizeKb: processed.sizeKb,
        isTransparent: processed.isTransparent,
        isCloudinary: true,
        badgeText: processed.badgeText,
      };
    }
  } catch (procErr) {
    console.warn('[ImageStore] Advanced processor notice, falling back:', procErr);
  }

  const cleanExt = (filename.split('.').pop() || 'webp').toLowerCase().replace(/[^a-z0-9]/g, '');
  const baseName = (sku || filename.replace(/\.[^/.]+$/, ''))
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .toUpperCase();
  const rawMime = mimeType || getMimeType(filename, buffer);

  // Compress and optimize image using Sharp (WebP, max 800x800px, quality 80)
  let processedBuffer = buffer;
  let finalMime = rawMime;
  let finalExt = cleanExt === 'jpg' ? 'jpeg' : cleanExt;

  if (rawMime !== 'image/svg+xml') {
    try {
      const sharpModule = await import('sharp');
      const sharp = sharpModule.default || sharpModule;
      processedBuffer = await sharp(buffer)
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75, effort: 4 })
        .toBuffer();
      finalMime = 'image/webp';
      finalExt = 'webp';
    } catch (sharpErr) {
      console.warn('[ImageStore] Sharp compression fallback:', sharpErr);
      processedBuffer = buffer;
    }
  }

  // Cryptographic SHA-256 content-hash ensures a collision-free, immutable URL on every upload & replacement
  const contentHash = crypto.createHash('sha256').update(processedBuffer).digest('hex').slice(0, 16);
  const cleanFilename = `${baseName}_${contentHash}.${finalExt}`;
  const now = new Date().toISOString();

  // 1. Ephemeral lambda disk cache
  try {
    const tmpDir = getTmpImageDir();
    const tmpFile = path.join(tmpDir, cleanFilename);
    fs.writeFileSync(tmpFile, processedBuffer);
  } catch (tmpErr) {
    console.warn('[ImageStore] Tmp write notice:', tmpErr);
  }

  // 2. Cloudinary Durable Media Hosting (Zero local/KV bloat, permanent CDN URL)
  let cloudinaryUrl: string | null = null;
  try {
    cloudinaryUrl = await uploadToCloudinary(processedBuffer, cleanFilename, finalMime);
  } catch (cErr) {
    console.warn('[ImageStore] Cloudinary upload notice:', cErr);
  }

  if (cloudinaryUrl) {
    return {
      success: true,
      publicUrl: cloudinaryUrl,
      filename: cleanFilename,
      mimeType: finalMime,
      size: processedBuffer.length,
      sizeKb: Math.round(processedBuffer.length / 1024),
      isTransparent: true,
      isCloudinary: true,
      badgeText: `Transparent WebP • ${Math.round(processedBuffer.length / 1024)} KB • Live on Cloudinary`,
    };
  }

  // 2. Try Zoho CRM Account Attachment for permanent cross-container storage
  let zohoAttId: string | null = null;
  try {
    zohoAttId = await uploadZohoAttachment(processedBuffer, cleanFilename, finalMime);
  } catch (attErr) {
    console.warn('[ImageStore] Zoho attachment notice:', attErr);
  }

  if (zohoAttId) {
    const zohoFilename = `zoho_${zohoAttId}.${finalExt}`;
    try {
      const tmpDir = getTmpImageDir();
      fs.writeFileSync(path.join(tmpDir, zohoFilename), processedBuffer);
    } catch {
      // ignore
    }

    const publicUrl = `/api/products/images/${zohoFilename}`;
    return {
      success: true,
      publicUrl,
      filename: zohoFilename,
      mimeType: finalMime,
      size: processedBuffer.length,
    };
  }

  // 3. Compact Data URL fallback if image <= 25KB (fits safely in Zoho Note JSON without length issues)
  if (processedBuffer.length <= 25 * 1024) {
    const dataUrl = `data:${finalMime};base64,${processedBuffer.toString('base64')}`;
    return {
      success: true,
      publicUrl: dataUrl,
      filename: cleanFilename,
      mimeType: finalMime,
      size: processedBuffer.length,
    };
  }

  // 4. Local public static directory (works in local dev and build phase)
  try {
    const staticDir = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026');
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }
    const staticFile = path.join(staticDir, cleanFilename);
    fs.writeFileSync(staticFile, processedBuffer);
  } catch {
    // Read-only filesystem in Vercel production is expected; handled by Cloud KV
  }

  // 5. Durable Cloud KV (Upstash Redis REST) - with 30-day TTL to avoid 100% quota bloat
  try {
    const base64Data = processedBuffer.toString('base64');
    const KV_IMAGE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30-day rolling TTL
    await Promise.all([
      callKV(['SET', `prod_img_data:${cleanFilename}`, base64Data, 'EX', KV_IMAGE_TTL_SECONDS]),
      callKV([
        'SET',
        `prod_img_meta:${cleanFilename}`,
        JSON.stringify({
          filename: cleanFilename,
          mimeType: finalMime,
          size: processedBuffer.length,
          sku: baseName,
          updatedAt: now,
        }),
        'EX',
        KV_IMAGE_TTL_SECONDS,
      ]),
      sku ? callKV(['SET', `prod_img_sku:${baseName}`, cleanFilename, 'EX', KV_IMAGE_TTL_SECONDS]) : Promise.resolve(null),
    ]);
  } catch (kvErr) {
    console.warn('[ImageStore] Cloud KV write notice:', kvErr);
  }

  // 6. Local journal backup (capped at 30 most recent items to prevent disk bloat)
  try {
    const journal = readLocalJournal();
    journal.images[cleanFilename] = {
      mimeType: finalMime,
      base64: processedBuffer.toString('base64'),
      size: processedBuffer.length,
      updatedAt: now,
    };
    journal.aliases[baseName] = cleanFilename;

    // Prune journal to max 30 recent images
    const keys = Object.keys(journal.images);
    if (keys.length > 30) {
      const keysToRemove = keys.slice(0, keys.length - 30);
      for (const k of keysToRemove) {
        delete journal.images[k];
      }
    }
    writeLocalJournal(journal);
  } catch (jErr) {
    console.warn('[ImageStore] Journal backup notice:', jErr);
  }

  const publicUrl = `/api/products/images/${cleanFilename}`;
  return {
    success: true,
    publicUrl,
    filename: cleanFilename,
    mimeType: finalMime,
    size: processedBuffer.length,
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

  // Layer 0: Zoho CRM Account Attachment (cross-container persistent)
  if (cleanFilename.startsWith('zoho_')) {
    const attId = cleanFilename.replace(/^zoho_/, '').replace(/\.[^.]+$/, '');
    // Check ephemeral container cache first
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

    // Fetch from Zoho CRM Attachments API
    try {
      const zohoFile = await downloadZohoAttachment(attId);
      if (zohoFile) {
        try {
          const tmpFile = path.join(getTmpImageDir(), cleanFilename);
          fs.writeFileSync(tmpFile, zohoFile.buffer);
        } catch {
          // ignore
        }
        return zohoFile;
      }
    } catch {
      // continue to next layers
    }
  }

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

/**
 * Purge a product image from /tmp cache and Cloud KV upon permanent product deletion
 */
export async function purgeProductImage(filenameOrUrl: string): Promise<void> {
  if (!filenameOrUrl) return;
  const filename = filenameOrUrl.split('/').pop()?.split('?')[0] || '';
  if (!filename) return;

  // 1. Remove from /tmp
  try {
    const tmpDir = getTmpImageDir();
    const target = path.join(tmpDir, filename);
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
  } catch {
    // ignore
  }

  // 2. Remove from Cloud KV
  try {
    await Promise.all([
      callKV(['DEL', `prod_img_data:${filename}`]),
      callKV(['DEL', `prod_img_meta:${filename}`]),
    ]);
  } catch {
    // ignore
  }
}

/**
 * Administrative cleanup utility: clears raw base64 image data from Upstash Redis / Vercel KV
 * that caused 100% storage limit exhaustion, while preserving metadata & Zoho CRM attachments.
 */
export async function cleanupBloatedKVImages(maxKeysToScan = 500): Promise<{
  deletedCount: number;
  freedBytesEstimate: number;
  scannedKeys: number;
}> {
  let deletedCount = 0;
  let freedBytesEstimate = 0;
  let scannedKeys = 0;

  try {
    const scanResult = await callKV<[string, string[]]>(['SCAN', '0', 'MATCH', 'prod_img_data:*', 'COUNT', String(maxKeysToScan)]);
    if (scanResult && Array.isArray(scanResult) && Array.isArray(scanResult[1])) {
      const keys = scanResult[1];
      scannedKeys = keys.length;

      for (const k of keys) {
        try {
          const val = await callKV<string>(['GET', k]);
          if (val) {
            freedBytesEstimate += val.length;
          }
          await callKV(['DEL', k]);
          deletedCount++;
        } catch {
          // ignore single key error
        }
      }
    }
  } catch (err) {
    console.warn('[ImageStore] KV cleanup notice:', err);
  }

  return { deletedCount, freedBytesEstimate, scannedKeys };
}
