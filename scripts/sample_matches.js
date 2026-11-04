const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('scripts/test_full_matching_engine.js', 'utf8');

const script = `
${content}

console.log('\\n--- 40 Sample Matched Supplier Images ---');
const entries = Array.from(mappedSupplierImages.entries());
// take 20 direct and 20 alternate
const directs = entries.filter(e => e[1].matchedVia.includes('Verified')).slice(0, 20);
const alts = entries.filter(e => e[1].role === 'GALLERY_IMAGE' && !e[1].matchedVia.includes('Verified')).slice(0, 20);

console.log('--- DIRECT SOURCE MAPPINGS ---');
directs.forEach(([wp, info], i) => {
  console.log(\`[\${i + 1}] \${info.sku} | \${info.productName} | \${info.originalFolder}/\${info.originalFilename}\`);
});

console.log('\\n--- ALTERNATE ANGLE / GALLERY MAPPINGS ---');
alts.forEach(([wp, info], i) => {
  console.log(\`[\${i + 1}] \${info.sku} | \${info.productName} | \${info.originalFolder}/\${info.originalFilename} (score: \${info.score?.toFixed(2)})\`);
});
`;

fs.writeFileSync('scripts/run_samples.js', script, 'utf8');
