const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PAGES = [
  { name: 'Homepage', url: 'https://officebazzar.com/' },
  { name: 'Products Listing', url: 'https://officebazzar.com/products' },
  { name: 'Category (Packaging Supplies)', url: 'https://officebazzar.com/category/packaging-supplies' },
  { name: 'PDP (OB-RDS-24)', url: 'https://officebazzar.com/product/ob-rds-24-microprismatic-reflective-warning-tape-50mm-x-50m' },
  { name: 'Request Quote', url: 'https://officebazzar.com/request-quote' }
];

const results = [];

console.log('================================================================');
console.log('   OFFICEBAZZAR PRODUCTION CORE WEB VITALS & LIGHTHOUSE AUDIT');
console.log('================================================================\n');

for (const page of PAGES) {
  for (const preset of ['mobile', 'desktop']) {
    console.log(`Auditing ${page.name} [${preset.toUpperCase()}]...`);
    const jsonOut = path.join(process.cwd(), `lighthouse_${preset}_${page.name.replace(/[^a-z0-9]/gi, '_')}.json`);
    
    const cmd = preset === 'desktop'
      ? `npx lighthouse "${page.url}" --preset=desktop --only-categories=performance,seo,accessibility --output=json --output-path="${jsonOut}" --chrome-flags="--headless=new --disable-gpu"`
      : `npx lighthouse "${page.url}" --only-categories=performance,seo,accessibility --output=json --output-path="${jsonOut}" --chrome-flags="--headless=new --disable-gpu"`;

    try {
      execSync(cmd, { stdio: 'pipe', timeout: 90000 });
      const raw = JSON.parse(fs.readFileSync(jsonOut, 'utf-8'));
      
      const audits = raw.audits;
      const cats = raw.categories;

      const record = {
        page: page.name,
        url: page.url,
        preset,
        perfScore: Math.round(cats.performance.score * 100),
        seoScore: Math.round(cats.seo.score * 100),
        a11yScore: Math.round(cats.accessibility.score * 100),
        ttfbMs: Math.round(audits['server-response-time']?.numericValue || 0),
        fcpSec: (audits['first-contentful-paint']?.numericValue / 1000).toFixed(2),
        lcpSec: (audits['largest-contentful-paint']?.numericValue / 1000).toFixed(2),
        cls: (audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3),
        tbtMs: Math.round(audits['total-blocking-time']?.numericValue || 0),
        totalByteWeightKb: Math.round((audits['total-byte-weight']?.numericValue || 0) / 1024),
        unusedJsKb: Math.round((audits['unused-javascript']?.numericValue || 0) / 1024),
        renderBlockingMs: Math.round(audits['render-blocking-resources']?.numericValue || 0)
      };

      results.push(record);
      console.log(`  ✓ Score: Perf ${record.perfScore}/100, SEO ${record.seoScore}/100 | LCP: ${record.lcpSec}s, TTFB: ${record.ttfbMs}ms, CLS: ${record.cls}, TBT: ${record.tbtMs}ms`);

      // Clean up json output
      try { fs.unlinkSync(jsonOut); } catch {}
    } catch (err) {
      console.error(`  ✗ Failed to audit ${page.name} (${preset}):`, err.message);
    }
  }
}

fs.writeFileSync('scripts/live_lighthouse_audit_results.json', JSON.stringify(results, null, 2));
console.log('\n--- Complete Performance Audit Results ---');
console.table(results.map(r => ({
  Page: r.page,
  Mode: r.preset,
  Perf: r.perfScore,
  SEO: r.seoScore,
  LCP: `${r.lcpSec}s`,
  TTFB: `${r.ttfbMs}ms`,
  CLS: r.cls,
  TBT: `${r.tbtMs}ms`,
  Bytes: `${r.totalByteWeightKb}KB`
})));
