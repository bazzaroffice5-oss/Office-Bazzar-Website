const fs = require('fs');

const targetSlugs = [
  'best-print-12a-compatible-toner-cartridge',
  'canon-308-toner-cartridge',
  'label-cartridges',
  'canon-refilling-cartridge',
  'hp-126a-laser-jet-toner-cartridge',
  'compatible-toner-cartridge',
  'canon-npg-51-toner-cartridge',
  'best-print-88a-compatible-toner-cartridge',
  'hp-802-small-black-ink-cartridge-ch561zz'
];

const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const results = [];

targetSlugs.forEach((slug, idx) => {
  const searchPattern = `"slug": "${slug}"`;
  const slugIndex = catalogContent.indexOf(searchPattern);
  if (slugIndex !== -1) {
    const startObj = catalogContent.lastIndexOf('{', slugIndex);
    let braceCount = 0;
    let endObj = -1;
    for (let i = startObj; i < catalogContent.length; i++) {
      if (catalogContent[i] === '{') braceCount++;
      else if (catalogContent[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endObj = i + 1;
          break;
        }
      }
    }
    const productStr = catalogContent.substring(startObj, endObj);
    try {
      const prod = JSON.parse(productStr);
      results.push({
        index: idx + 1,
        slug,
        name: prod.name,
        sku: prod.sku,
        id: prod.id,
        primaryImage: prod.images?.[0],
        allImages: prod.images
      });
    } catch (e) {
      console.error('JSON parse error for', slug, e.message);
    }
  } else {
    // Try searching partial slug or name
    console.warn(`Not found exactly: ${slug}`);
  }
});

console.log(JSON.stringify(results, null, 2));

