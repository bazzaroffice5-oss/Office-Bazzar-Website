const fs = require('fs');

const pendingContent = fs.readFileSync('scripts/skus_requiring_manual_replacement.txt', 'utf8');
const verifiedMap = JSON.parse(fs.readFileSync('verified_sku_image_map.json', 'utf8'));

const lines = pendingContent.split('\n');
const pendingSkus = [];

lines.forEach(l => {
  const match = l.match(/\[PENDING\]\s+(OB-[A-Z0-9-]+)\s*\|\s*([^|]+)/);
  if (match) {
    pendingSkus.push(match[1].trim());
  }
});

console.log(`Checking ${pendingSkus.length} pending SKUs...`);

let resolvedCount = 0;
const unresolved = [];

pendingSkus.forEach(sku => {
  const item = verifiedMap[sku];
  if (item && item.hasPackageMatch) {
    resolvedCount++;
  } else {
    unresolved.push({
      sku,
      name: item ? item.name : 'Unknown'
    });
  }
});

console.log(`Resolved from 2,369 package: ${resolvedCount}/${pendingSkus.length}`);
console.log(`Remaining pending SKUs (${unresolved.length}):`);
unresolved.forEach(u => console.log(`[${u.sku}] ${u.name}`));

