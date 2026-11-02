const fs = require('fs');

let code = fs.readFileSync('src/components/home/TrendingCategoriesSection.tsx', 'utf8');

code = code.replace(
  /\{CATEGORIES\.find\(\(c\) => c\.id === cat\.id\)\?\.itemCount \? \(CATEGORIES\.find\(\(c\) => c\.id === cat\.id\)\.itemCount \+ ' Products'\) : cat\.itemCount\}/,
  "{CATEGORIES.find((c) => c.id === cat.id)?.itemCount ? `${CATEGORIES.find((c) => c.id === cat.id)?.itemCount} Products` : cat.itemCount}"
);

fs.writeFileSync('src/components/home/TrendingCategoriesSection.tsx', code, 'utf8');
console.log('Fixed optional chaining in TrendingCategoriesSection.tsx');
