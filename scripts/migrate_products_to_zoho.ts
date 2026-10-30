import * as fs from 'fs';
import * as path from 'path';

// 1. Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  });
}

import { zohoFetch } from '../src/lib/zoho/client';
import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';
import { Product } from '../src/types';

interface ZohoProductPayload {
  Product_Name: string;
  Product_Code: string; // SKU
  Product_Active: boolean;
  Unit_Price: number;
  Qty_in_Stock: number;
  Description: string;
  Tag?: string;
}

function buildZohoProductPayload(p: Product, isDuplicateName: boolean): ZohoProductPayload {
  const descLines = [
    `[Website ID: ${p.id}]`,
    `Slug: ${p.slug}`,
    `Category: ${p.categoryName || p.categoryId}`,
    `Subcategory: ${p.subcategoryName || 'N/A'}`,
    `Brand: ${p.brandName || 'OfficeBazzar'}`,
    `GST Rate: ${p.gstPercent || 18}%`,
    `Pack Size: ${p.packSize || '1 Unit'}`,
    p.images && p.images.length > 0 ? `Primary Image: ${p.images[0]}` : '',
    '',
    p.description || '',
  ].filter(Boolean);

  const productName = isDuplicateName ? `${p.name.trim()} (${p.sku.trim()})` : p.name.trim();

  return {
    Product_Name: productName,
    Product_Code: p.sku.trim(),
    Product_Active: p.isActive !== false,
    Unit_Price: Number(p.price) || 0,
    Qty_in_Stock: Number(p.stockQuantity) || 0,
    Description: descLines.join('\n'),
    Tag: `${p.categoryId || 'General'}, ${p.brandName || 'OfficeBazzar'}`,
  };
}

async function migrateAllProducts() {
  console.log('================================================================');
  console.log('OFFICE BAZZAR — PHASE 1: MIGRATE 101 PRODUCTS TO ZOHO CRM');
  console.log('================================================================');
  console.log(`Total website catalog products to migrate: ${INITIAL_PRODUCTS.length}`);

  const zohoMapping: Record<string, {
    zohoId: string;
    sku: string;
    websiteId: string;
    name: string;
    price: number;
    action: string;
  }> = {};

  // Split into chunks of 100 (Zoho maximum per batch)
  const chunkSize = 100;
  for (let i = 0; i < INITIAL_PRODUCTS.length; i += chunkSize) {
    const chunk = INITIAL_PRODUCTS.slice(i, i + chunkSize);
    const batchNumber = Math.floor(i / chunkSize) + 1;
    console.log(`\nProcessing Batch ${batchNumber} (${chunk.length} products)...`);

    const duplicateNames = new Set([
      'prod-kangaro-staplers-hd-10d-1',
      'prod-tissue-paper-napkin-1',
    ]);
    const payload = {
      data: chunk.map((p) => buildZohoProductPayload(p, duplicateNames.has(p.id))),
      duplicate_check_fields: ['Product_Code'],
    };

    try {
      const response = await zohoFetch<any>('/Products/upsert', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const results = response?.data || [];
      console.log(`Batch ${batchNumber} response received. Total results: ${results.length}`);

      results.forEach((item: any, idx: number) => {
        const product = chunk[idx];
        const zohoId = item?.details?.id;
        const code = item?.code;
        const action = item?.action || (code === 'SUCCESS' ? 'success' : 'failed');

        if (zohoId && product) {
          zohoMapping[product.id] = {
            zohoId,
            sku: product.sku,
            websiteId: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            action,
          };
        } else {
          console.warn(`[Batch ${batchNumber}] Product [${product?.sku}] warning:`, item?.message || item);
        }
      });
    } catch (err: any) {
      console.error(`Batch ${batchNumber} FAILED:`, err?.details || err?.message || err);
      process.exit(1);
    }
  }

  const successCount = Object.keys(zohoMapping).length;
  console.log('\n================================================================');
  console.log(`MIGRATION COMPLETE: ${successCount} / ${INITIAL_PRODUCTS.length} products mapped to Zoho CRM!`);
  console.log('================================================================');

  // Save mapping to file
  const outPath = path.resolve(process.cwd(), 'src', 'lib', 'data', 'zoho_product_mapping.json');
  fs.writeFileSync(outPath, JSON.stringify(zohoMapping, null, 2), 'utf8');
  console.log(`Saved product ID mapping to: ${outPath}`);

  // Verification: Read back products from Zoho CRM
  console.log('\n--- VERIFYING RETRIEVAL FROM ZOHO CRM PRODUCTS MODULE ---');
  try {
    const sampleZoho = await zohoFetch<any>('/Products?fields=Product_Name,Product_Code,Unit_Price&per_page=5', {
      method: 'GET',
    });
    console.log(`Successfully retrieved sample products from Zoho CRM:`);
    sampleZoho?.data?.forEach((p: any, idx: number) => {
      console.log(` ${idx + 1}. [${p.Product_Code}] ${p.Product_Name} (₹${p.Unit_Price}) - Zoho ID: ${p.id}`);
    });
  } catch (readErr: any) {
    console.error('Failed to read sample products from Zoho CRM:', readErr?.details || readErr?.message);
  }
}

migrateAllProducts();
