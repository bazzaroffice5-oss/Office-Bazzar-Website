import * as fs from 'fs';
import * as path from 'path';
import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

async function main() {
  const remoteProducts = INITIAL_PRODUCTS.filter(p => p.images[0]?.startsWith('http'));
  console.log(`Found ${remoteProducts.length} products with remote images.`);

  const exportDir = path.join(process.cwd(), 'scripts', 'export_package', 'images', 'remote-downloads');
  fs.mkdirSync(exportDir, { recursive: true });

  const results: any[] = [];

  for (const p of remoteProducts) {
    const url = p.images[0];
    const urlObj = new URL(url);
    const filename = `${p.sku}_${path.basename(urlObj.pathname)}`;
    const dest = path.join(exportDir, filename);

    console.log(`Downloading [${p.sku}] from ${url}...`);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) {
        console.error(`Failed ${p.sku}: HTTP ${res.status}`);
        results.push({ sku: p.sku, url, success: false, status: res.status });
      } else {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buf);
        results.push({ sku: p.sku, url, success: true, sizeBytes: buf.length, filename });
      }
    } catch (err: any) {
      console.error(`Error ${p.sku}:`, err.message);
      results.push({ sku: p.sku, url, success: false, error: err.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`Downloaded ${successCount} / ${remoteProducts.length} remote images successfully.`);
  fs.writeFileSync('scripts/remote_download_results.json', JSON.stringify(results, null, 2), 'utf8');
}

main().catch(console.error);

