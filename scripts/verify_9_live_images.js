const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const items = [
  {
    name: 'Best Print 12A Compatible Toner Cartridge',
    sku: 'OB-PRI-1075',
    slug: 'best-print-12a-compatible-toner-cartridge',
    expectedHash: '181e8758032b6f16'
  },
  {
    name: 'Canon 308 Toner Cartridge',
    sku: 'OB-PRI-1077',
    slug: 'canon-308-toner-cartridge',
    expectedHash: 'a58c36a1f39c7c34'
  },
  {
    name: 'Label Cartridges',
    sku: 'OB-PRI-1078',
    slug: 'label-cartridges',
    expectedHash: 'a63a9dd0e6f41453'
  },
  {
    name: 'Canon Refilling Cartridge',
    sku: 'OB-PRI-1079',
    slug: 'canon-refilling-cartridge',
    expectedHash: 'ebec0a949118558a'
  },
  {
    name: 'HP 126A Laser Jet Toner Cartridge',
    sku: 'OB-PRI-1082',
    slug: 'hp-126a-laser-jet-toner-cartridge',
    expectedHash: 'f8dc63824bf9adfd'
  },
  {
    name: 'Compatible Toner Cartridge',
    sku: 'OB-PRI-1080',
    slug: 'compatible-toner-cartridge',
    expectedHash: 'ce043fd553a3dc8f'
  },
  {
    name: 'Canon Npg 51 Toner Cartridge',
    sku: 'OB-PRI-1083',
    slug: 'canon-npg-51-toner-cartridge',
    expectedHash: '5144f2c029b96ddc'
  },
  {
    name: 'Best Print 88A Compatible Toner Cartridge',
    sku: 'OB-PRI-1084',
    slug: 'best-print-88a-compatible-toner-cartridge',
    expectedHash: 'd69dfc5b0b76ced0'
  },
  {
    name: 'HP 802 Small Black Ink Cartridge - CH561ZZ',
    sku: 'OB-PRI-1085',
    slug: 'hp-802-small-black-ink-cartridge-ch561zz',
    expectedHash: '169841fe07208502'
  }
];

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ statusCode: res.statusCode, buffer: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}

async function verifyLive() {
  console.log('--- Verifying 9 live product pages & images on https://officebazzar.com ---');
  let allLive = true;

  for (const item of items) {
    const pdpUrl = `https://officebazzar.com/product/${item.slug}?_t=${Date.now()}`;
    const pdpRes = await fetchBuffer(pdpUrl);
    const pdpHtml = pdpRes.buffer.toString('utf8');
    const hasV29 = pdpHtml.includes('20261113_v29_batch_9_toner_cartridges');

    const imgUrl = `https://officebazzar.com/assets/products/catalog_2026/${item.sku}.webp?_t=${Date.now()}`;
    const imgRes = await fetchBuffer(imgUrl);
    const liveHash = crypto.createHash('sha256').update(imgRes.buffer).digest('hex').substring(0, 16);
    const match = liveHash === item.expectedHash;

    if (!match || !hasV29) {
      allLive = false;
    }

    console.log(`[${item.sku}] ${item.name}`);
    console.log(`   PDP Status: ${pdpRes.statusCode} | Has v29: ${hasV29}`);
    console.log(`   Image Status: ${imgRes.statusCode} | Hash Match: ${match} (${liveHash} vs ${item.expectedHash})`);
  }

  return allLive;
}

verifyLive().then(allLive => {
  console.log('\nAll 9 images fully live and verified?', allLive);
  process.exit(allLive ? 0 : 1);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

