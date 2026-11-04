/**
 * Production & Staging Image URL Health Monitor
 *
 * Checks HTTP status, Content-Type, Content-Length, and response latency for product image URLs.
 *
 * Usage:
 *   node scripts/monitor_image_health.js [--sample=50] [--target=production|local] [--full]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const isFull = args.includes('--full');
let sampleSize = isFull ? null : 100;
const sampleArg = args.find(a => a.startsWith('--sample='));
if (sampleArg) {
  sampleSize = parseInt(sampleArg.split('=')[1], 10) || 100;
}

const targetArg = args.find(a => a.startsWith('--target='));
const baseUrl = (targetArg && targetArg.includes('local')) 
  ? 'http://localhost:3000' 
  : 'https://officebazzar.com';

console.log('====================================================');
console.log('📡 RUNNING OFFICE BAZZAR IMAGE URL HEALTH MONITOR');
console.log(`Target:      ${baseUrl}`);
console.log(`Scan Mode:   ${isFull ? 'FULL CATALOGUE (2,931 URLs)' : `SAMPLED HEALTH CHECK (${sampleSize} URLs)`}`);
console.log('====================================================');

// Extract all image URLs from catalog.ts
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

const allImages = new Set();
products.forEach(p => {
  if (Array.isArray(p.images)) {
    p.images.forEach(img => {
      if (img && typeof img === 'string') allImages.add(img);
    });
  }
});

let urlList = Array.from(allImages);

if (sampleSize && sampleSize < urlList.length) {
  // Always include key critical test images (97 restored products sample + regular products)
  const prioritySkus = ['OB-COM-1036', 'OB-STA-1011', 'OB-PAP-01', 'OB-NOT-73'];
  const priorityUrls = [];
  products.filter(p => prioritySkus.includes(p.sku)).forEach(p => {
    p.images.forEach(img => priorityUrls.push(img));
  });

  const remaining = urlList.filter(u => !priorityUrls.includes(u));
  // Shuffle remaining
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }
  urlList = [...priorityUrls, ...remaining.slice(0, sampleSize - priorityUrls.length)];
}

console.log(`Checking ${urlList.length} image URLs...`);

function checkUrl(relPath) {
  return new Promise((resolve) => {
    const fullUrl = `${baseUrl}${relPath}`;
    const parsed = new URL(fullUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const startTime = Date.now();

    const req = client.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname,
      method: 'HEAD',
      headers: {
        'User-Agent': 'OfficeBazzar-ImageHealthMonitor/1.0',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      timeout: 10000
    }, (res) => {
      const durationMs = Date.now() - startTime;
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'] || '';
      const contentLength = parseInt(res.headers['content-length'] || '0', 10);

      resolve({
        url: fullUrl,
        relPath,
        statusCode,
        contentType,
        contentLength,
        durationMs,
        healthy: statusCode === 200 && contentType.startsWith('image/')
      });
    });

    req.on('error', (err) => {
      resolve({
        url: fullUrl,
        relPath,
        statusCode: 0,
        contentType: 'error',
        contentLength: 0,
        durationMs: Date.now() - startTime,
        healthy: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url: fullUrl,
        relPath,
        statusCode: 408,
        contentType: 'timeout',
        contentLength: 0,
        durationMs: Date.now() - startTime,
        healthy: false,
        error: 'Request timeout (>10s)'
      });
    });

    req.end();
  });
}

async function runMonitor() {
  const BATCH_SIZE = 15;
  const results = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < urlList.length; i += BATCH_SIZE) {
    const batch = urlList.slice(i, i + BATCH_SIZE);
    const batchRes = await Promise.all(batch.map(checkUrl));
    results.push(...batchRes);

    batchRes.forEach(r => {
      if (r.healthy) passed++;
      else failed++;
    });

    process.stdout.write(`Progress: ${Math.min(i + BATCH_SIZE, urlList.length)} / ${urlList.length} (Passed: ${passed}, Failed: ${failed})\r`);
  }
  console.log('\n----------------------------------------------------');

  const report = {
    timestamp: new Date().toISOString(),
    targetHost: baseUrl,
    totalChecked: urlList.length,
    passed,
    failed,
    healthyRate: `${((passed / urlList.length) * 100).toFixed(2)}%`,
    failures: results.filter(r => !r.healthy)
  };

  const reportPath = path.resolve('scripts/image_health_status.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Scan Finished! Results:`);
  console.log(`  Healthy URLs: ${passed} / ${urlList.length} (${report.healthyRate})`);
  console.log(`  Failed URLs:  ${failed}`);
  console.log(`  Report:       ${reportPath}`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    console.error('⚠️  Unhealthy images found:');
    report.failures.slice(0, 10).forEach(f => {
      console.error(`  - [${f.statusCode}] ${f.relPath} (Error: ${f.error || f.contentType})`);
    });
    process.exit(1);
  } else {
    console.log('✅ ALL MONITORED IMAGE URLs ARE HEALTHY (200 OK, valid image headers)');
    process.exit(0);
  }
}

runMonitor();

