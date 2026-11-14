const fs = require('fs');
const path = require('path');

function checkFile(p) {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    const canonical = content.match(/<link rel="canonical" href="[^"]+"/);
    const ogUrl = content.match(/<meta property="og:url" content="[^"]+"/);
    console.log(p);
    console.log('  Canonical:', canonical ? canonical[0] : 'N/A');
    console.log('  og:url:   ', ogUrl ? ogUrl[0] : 'N/A');
  }
}

checkFile('.next/server/app/index.html');
checkFile('.next/server/app/products.html');
checkFile('.next/server/app/robots.txt.body');
checkFile('.next/server/app/sitemap.xml.body');

