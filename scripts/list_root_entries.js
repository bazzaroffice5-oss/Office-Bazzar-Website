const fs = require('fs');
const files = fs.readdirSync(process.cwd());
files.forEach(f => {
  const st = fs.statSync(f);
  console.log(`${st.isDirectory() ? '[DIR] ' : '[FILE]'} ${f}`);
});
