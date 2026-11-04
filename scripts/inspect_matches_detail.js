const fs = require('fs');
const inv = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = content.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

console.log('--- Inspecting board matches ---');
inv.filter(i => i.originalFilename.toLowerCase().includes('board')).forEach(i => {
  console.log(`[${i.originalFolder}] ${i.originalFilename}`);
});

console.log('\n--- Checking products for scissors, trap, rat, mouse ---');
products.filter(p => {
  const n = p.name.toLowerCase();
  return n.includes('scissor') || n.includes('trap') || n.includes('rat') || n.includes('mouse') || n.includes('pest');
}).forEach(p => console.log(`${p.sku} | ${p.name}`));

