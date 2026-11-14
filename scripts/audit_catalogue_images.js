const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function audit() {
  const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
  
  // Find all image URLs in catalog.ts
  const regex = /["'](\/assets\/[^"']+)["']/g;
  let m;
  const allUrls = [];
  while ((m = regex.exec(content)) !== null) {
    allUrls.push(m[1]);
  }
  
  const uniqueUrls = Array.from(new Set(allUrls));
  console.log(`Total image URL references: ${allUrls.length}`);
  console.log(`Unique image URLs: ${uniqueUrls.length}`);
  
  let existingCount = 0;
  const missing = [];
  const lowRes = [];
  const highRes = [];
  const whiteMarginCandidates = [];
  
  const buckets = {
    '1200+ px': 0,
    '800-1199 px': 0,
    '400-799 px': 0,
    '200-399 px': 0,
    '<200 px': 0
  };
  
  const formats = {};
  
  for (const u of uniqueUrls) {
    const diskPath = path.join('public', u);
    if (!fs.existsSync(diskPath)) continue;
    try {
      const meta = await sharp(diskPath).metadata();
      const maxDim = Math.max(meta.width || 0, meta.height || 0);
      if (maxDim >= 1200) buckets['1200+ px']++;
      else if (maxDim >= 800) buckets['800-1199 px']++;
      else if (maxDim >= 400) buckets['400-799 px']++;
      else if (maxDim >= 200) buckets['200-399 px']++;
      else buckets['<200 px']++;
      
      formats[meta.format] = (formats[meta.format] || 0) + 1;
    } catch (e) {}
  }
  
  console.log('Resolution Distribution:', buckets);
  console.log('Format Distribution:', formats);
}

audit().catch(console.error);
