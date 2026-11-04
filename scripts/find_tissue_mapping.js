const fs = require('fs');
const path = require('path');

const dir = 'scripts';
const files = fs.readdirSync(dir);
for (const f of files) {
  if (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.json')) {
    try {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      if (content.includes('OB-HOU-1013') || content.includes('OB-TIS-1096')) {
        console.log(`Found in ${f}:`);
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes('OB-HOU-1013') || l.includes('OB-TIS-1096')) {
            console.log(`  L${idx+1}: ${l.trim().slice(0, 150)}`);
          }
        });
      }
    } catch (e) {}
  }
}

