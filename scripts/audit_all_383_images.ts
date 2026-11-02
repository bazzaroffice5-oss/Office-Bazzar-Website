import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { INITIAL_PRODUCTS, CATEGORIES } from '../src/lib/data/catalog';

interface ImageAuditResult {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  imagePath: string;
  isRemote: boolean;
  exists: boolean;
  width?: number;
  height?: number;
  sizeBytes?: number;
  format?: string;
  isWatermarked: boolean;
  isBlurryOrLowRes: boolean;
  isBlankOrCorrupted: boolean;
  isVerifiedReplacement: boolean;
  isPendingClientMaster: boolean;
  defectType: string[];
  actionRequired: string;
  brand?: string;
}

async function main() {
  console.log('Auditing all 383 product images in catalog...');

  const manifestPath = path.join(process.cwd(), 'scripts', 'visual_gate_manifest.json');
  let oldManifest: any[] = [];
  if (fs.existsSync(manifestPath)) {
    oldManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  const oldManifestMap = new Map<string, any>(oldManifest.map((m: any) => [m.sku, m]));

  const verifiedReplacements = new Set([
    'OB-159', 'OB-203', 'OB-158', 'OB-160', 'OB-161',
    'OB-052', 'OB-051', 'OB-050', 'OB-095', 'OB-096',
    'OB-114', 'OB-030', 'OB-PAP-03', 'OB-PAP-07', 'OB-PAP-09',
    'OB-DES-51', 'OB-NOT-71', 'OB-NOT-73', 'OB-PEN-38'
  ]);

  const results: ImageAuditResult[] = [];
  const imageUsageMap = new Map<string, string[]>();

  for (const p of INITIAL_PRODUCTS) {
    const img = p.images[0] || '';
    if (img) {
      const list = imageUsageMap.get(img) || [];
      list.push(p.sku);
      imageUsageMap.set(img, list);
    }
  }

  for (const p of INITIAL_PRODUCTS) {
    const img = p.images[0] || '';
    const isRemote = img.startsWith('http');
    const defectType: string[] = [];
    let exists = false;
    let width: number | undefined;
    let height: number | undefined;
    let sizeBytes: number | undefined;
    let format: string | undefined;
    let isWatermarked = false;
    let isBlurryOrLowRes = false;
    let isBlankOrCorrupted = false;
    let isVerifiedReplacement = verifiedReplacements.has(p.sku);
    let isPendingClientMaster = false;
    let actionRequired = 'None (Standard Quality)';

    if (!img) {
      defectType.push('Missing Image Path');
      actionRequired = 'Assign Valid Image';
    } else if (isRemote) {
      exists = true; // remote
      if (p.sku === 'OB-COM-1039' || img.includes('whatsapp-image')) {
        defectType.push('WhatsApp Snapshot with Purple Handwritten Ink');
        isPendingClientMaster = true;
        actionRequired = 'Awaiting Client Manufacturer Studio Photo';
      }
    } else {
      const fullPath = path.join(process.cwd(), 'public', img.replace(/^\//, ''));
      if (!fs.existsSync(fullPath)) {
        defectType.push('Missing Local File (404)');
        actionRequired = 'Re-extract or Source Image';
      } else {
        exists = true;
        const stat = fs.statSync(fullPath);
        sizeBytes = stat.size;

        try {
          const meta = await sharp(fullPath).metadata();
          width = meta.width;
          height = meta.height;
          format = meta.format;

          if (stat.size < 1500) {
            // Check if blank
            const stats = await sharp(fullPath).stats();
            const isAllWhite = stats.channels.every(c => c.mean > 250 && c.stdev < 3);
            if (isAllWhite) {
              isBlankOrCorrupted = true;
              defectType.push('Blank White Canvas');
              actionRequired = 'Re-extract from PDF at high resolution';
            }
          }

          if ((width && width < 300) || (height && height < 300)) {
            isBlurryOrLowRes = true;
            defectType.push('Low Resolution (<300px)');
            actionRequired = 'Replace with High Resolution Asset';
          }
        } catch (err: any) {
          defectType.push(`Corrupted Image File: ${err.message}`);
          isBlankOrCorrupted = true;
          actionRequired = 'Replace Corrupted File';
        }

        const oldInfo = oldManifestMap.get(p.sku);
        if (oldInfo && oldInfo.hasWatermark && !isVerifiedReplacement) {
          isWatermarked = true;
          isPendingClientMaster = true;
          defectType.push('Supplier "A - Z Office Supplier" Diagonal Watermark');
          actionRequired = 'Replace with Clean Manufacturer/Distributor Master';
        }
      }
    }

    // Check duplicate mapping
    if (img && imageUsageMap.get(img) && (imageUsageMap.get(img)?.length || 0) > 1) {
      // Check if duplicate is unexpected
      // (some packaging sizes or color packs might legitimately share, note it)
    }

    if (isVerifiedReplacement) {
      actionRequired = 'Verified Clean Brand Master (Replaced)';
    }

    results.push({
      sku: p.sku,
      name: p.name,
      category: p.categoryName,
      subcategory: p.subcategoryName || 'Unassigned',
      imagePath: img,
      isRemote,
      exists,
      width,
      height,
      sizeBytes,
      format,
      isWatermarked,
      isBlurryOrLowRes,
      isBlankOrCorrupted,
      isVerifiedReplacement,
      isPendingClientMaster,
      defectType,
      actionRequired
    });
  }

  // Summary counts
  const total = results.length;
  const missingFiles = results.filter(r => !r.exists);
  const blankFiles = results.filter(r => r.isBlankOrCorrupted);
  const lowRes = results.filter(r => r.isBlurryOrLowRes);
  const watermarked = results.filter(r => r.isWatermarked);
  const replaced = results.filter(r => r.isVerifiedReplacement);
  const pendingMaster = results.filter(r => r.isPendingClientMaster);

  console.log('=== 383 PRODUCT AUDIT SUMMARY ===');
  console.log(`Total Products: ${total}`);
  console.log(`Missing Local/Remote Files: ${missingFiles.length}`);
  console.log(`Blank/Corrupted Images: ${blankFiles.length}`);
  console.log(`Low Resolution (<300px): ${lowRes.length}`);
  console.log(`Watermarked Images Remaining: ${watermarked.length}`);
  console.log(`Verified Brand Replacements: ${replaced.length}`);
  console.log(`Total Awaiting Client/Distributor Master: ${pendingMaster.length}`);

  // Duplicate image analysis
  const duplicateMappings = Array.from(imageUsageMap.entries()).filter(([img, skus]) => skus.length > 1);
  console.log(`Images shared by multiple SKUs: ${duplicateMappings.length}`);
  for (const [img, skus] of duplicateMappings) {
    console.log(`  Shared: ${img} -> SKUs: ${skus.join(', ')}`);
  }

  fs.writeFileSync('scripts/audit_383_results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved scripts/audit_383_results.json');
}

main().catch(console.error);
