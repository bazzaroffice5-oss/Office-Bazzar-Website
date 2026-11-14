const http = require('http');
const { spawn } = require('child_process');

const urls = [
  '/products',
  '/products?page=2',
  '/category/office-stationery',
  '/category/office-stationery?sub=paper-notebooks',
  '/category/housekeeping-hygiene',
  '/category/packaging-supplies',
  '/category/printers-technology'
];

async function run() {
  console.log('Starting Next.js production server on 127.0.0.1:3099...');
  const server = spawn('cmd.exe', ['/c', 'npx', 'next', 'start', '-H', '127.0.0.1', '-p', '3099'], {
    stdio: 'inherit'
  });

  // Wait for server to start
  await new Promise(r => setTimeout(r, 4000));

  console.log('--- STARTING MEASUREMENTS ---');
  for (const u of urls) {
    try {
      const start = Date.now();
      const res = await new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:3099' + u, resolve);
        req.on('error', reject);
      });
      const ttfb = Date.now() - start;
      const chunks = [];
      for await (const chunk of res) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      const totalTime = Date.now() - start;
      const sizeKb = (buffer.length / 1024).toFixed(2);
      const html = buffer.toString('utf8');
      const productMatches = html.match(/\/product\/[a-z0-9_-]+/gi) || [];
      const uniqueProductMatches = new Set(productMatches);
      console.log(`${u.padEnd(46)} | Size: ${sizeKb.padStart(8)} KB | Status: ${res.statusCode} | TTFB: ${ttfb.toString().padStart(4)}ms | Total: ${totalTime.toString().padStart(4)}ms | Links: ${productMatches.length} (Unique: ${uniqueProductMatches.size})`);
    } catch (e) {
      console.error(u, 'FAILED:', e.message);
    }
  }

  console.log('Shutting down server...');
  try {
    const { execSync } = require('child_process');
    execSync('taskkill /F /T /PID ' + server.pid);
  } catch {}
  process.exit(0);
}

run();
