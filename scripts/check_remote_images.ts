import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

async function checkRemoteImages() {
  const remoteProducts = INITIAL_PRODUCTS.filter((p) => p.images?.[0]?.startsWith('http'));
  console.log(`Testing ${remoteProducts.length} Remote WordPress CDN Images...`);

  let successCount = 0;
  let failCount = 0;
  const failures: any[] = [];

  for (const p of remoteProducts) {
    const url = p.images[0];
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        successCount++;
      } else {
        failCount++;
        failures.push({ sku: p.sku, url, status: res.status });
      }
    } catch (e: any) {
      failCount++;
      failures.push({ sku: p.sku, url, error: e.message });
    }
  }

  console.log(`Remote Image Results: ${successCount} OK, ${failCount} Failed.`);
  if (failures.length > 0) {
    console.log('Failures:', failures);
  }
}

checkRemoteImages();

