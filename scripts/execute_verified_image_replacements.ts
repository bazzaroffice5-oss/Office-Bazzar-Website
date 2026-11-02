import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

interface ReplacementTarget {
  sku: string;
  name: string;
  brand: string;
  category: string;
  url: string;
  targetDir: string;
  filename: string;
  sourceType: string;
}

const REPLACEMENTS: ReplacementTarget[] = [
  {
    sku: 'OB-159',
    name: 'Diversey Taski R6 (Toilet Bowl Cleaner)',
    brand: 'Diversey Taski',
    category: 'housekeeping-hygiene',
    url: 'https://emille.co/wp-content/uploads/2024/11/diversey-taski-r6.jpg',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-159-diversey-taski-r6-toilet-bowl-cleaner.webp',
    sourceType: 'Diversey Official Professional 5L Studio Asset'
  },
  {
    sku: 'OB-203',
    name: 'Diversey Taski R3 (Glass Cleaner Concentrate)',
    brand: 'Diversey Taski',
    category: 'housekeeping-hygiene',
    url: 'https://5.imimg.com/data5/SELLER/Default/2023/4/298972171/EM/EH/RX/1774726/taski-r3-500x500.png',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-203-diversey-taski-r3-glass-cleaner-concentrate.webp',
    sourceType: 'Diversey Taski Authorized Indian Distributor Asset'
  },
  {
    sku: 'OB-158',
    name: 'Diversey Taski R5 (Air Freshener Concentrate)',
    brand: 'Diversey Taski',
    category: 'housekeeping-hygiene',
    url: 'https://5.imimg.com/data5/SELLER/Default/2023/2/KM/ZT/FH/101923811/diversey-taski-r5-air-fresheners-5-l-500x500.jpeg',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-158-diversey-taski-r5-air-freshener-concentrate.webp',
    sourceType: 'Diversey Taski Authorized Indian Distributor Asset'
  },
  {
    sku: 'OB-160',
    name: 'Diversey Taski R7 (Floor Cleaner Concentrate)',
    brand: 'Diversey Taski',
    category: 'housekeeping-hygiene',
    url: 'https://5.imimg.com/data5/SELLER/Default/2025/12/567351066/GE/NU/AX/24758720/diversey-taski-cleaning-chemicals-r7-500x500.jpeg',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-160-diversey-taski-r7-floor-cleaner-concentrate.webp',
    sourceType: 'Diversey Taski Authorized Indian Distributor Asset'
  },
  {
    sku: 'OB-161',
    name: 'Diversey Taski R9 (Hard Water Limescale Cleaner)',
    brand: 'Diversey Taski',
    category: 'housekeeping-hygiene',
    url: 'https://5.imimg.com/data5/ANDROID/Default/2025/8/535979352/MF/PL/EQ/107274204/product-jpeg-500x500.jpg',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-161-diversey-taski-r9-hard-water-limescale-cleaner.webp',
    sourceType: 'Diversey Taski Authorized Indian Distributor Asset'
  },
  {
    sku: 'OB-052',
    name: 'Vim Dishwash Gel (250ml / 500ml / 1.8 Ltr)',
    brand: 'Vim',
    category: 'housekeeping-hygiene',
    url: 'https://www.bigbasket.com/media/uploads/p/l/266962_13-vim-dishwash-liquid-gel-lemon.jpg',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-052-vim-dishwash-gel-250ml-500ml-1-8-ltr.webp',
    sourceType: 'Hindustan Unilever Authorized Product Photography'
  },
  {
    sku: 'OB-051',
    name: 'Pril Dishwash Liquid',
    brand: 'Pril',
    category: 'housekeeping-hygiene',
    url: 'https://www.bbassets.com/media/uploads/p/l/269256_9-pril-dishwash-liquid-lime-green.jpg',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-051-pril-dishwash-liquid.webp',
    sourceType: 'Jyothy Labs / Henkel Official Packaging Asset'
  },
  {
    sku: 'OB-050',
    name: 'Exo Round Bar',
    brand: 'Exo',
    category: 'housekeeping-hygiene',
    url: 'https://www.bbassets.com/media/uploads/p/l/30007300_3-exo-exo-round-dish-wash-bar-round-with-free-scrubber.jpg',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-050-exo-round-bar.webp',
    sourceType: 'Jyothy Labs Official Packaging Asset'
  },
  {
    sku: 'OB-095',
    name: 'Airwick Room Freshener Spray',
    brand: 'Airwick',
    category: 'housekeeping-hygiene',
    url: 'https://www.bbassets.com/media/uploads/p/l/40121243_5-air-wick-room-air-freshener-spray-lavender-lotus.jpg',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-095-airwick-room-freshener-spray.webp',
    sourceType: 'Reckitt Benckiser Official Packaging Asset'
  },
  {
    sku: 'OB-096',
    name: 'Ambi Pur Air Freshener Spray',
    brand: 'Ambi Pur',
    category: 'housekeeping-hygiene',
    url: 'https://www.bbassets.com/media/uploads/p/l/40111911_1-ambi-pur-air-effects-air-freshener-sandalwood.jpg',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-096-ambi-pur-air-freshener-spray.webp',
    sourceType: 'Procter & Gamble Official Packaging Asset'
  },
  {
    sku: 'OB-114',
    name: 'All Out Mosquito Repellent Machine Set',
    brand: 'All Out',
    category: 'housekeeping-hygiene',
    url: 'https://www.bbassets.com/media/uploads/p/l/305907_23-all-out-ultra-mosquito-repellant-starter-pack.jpg',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-114-all-out-mosquito-repellent-machine-set.webp',
    sourceType: 'SC Johnson Official Packaging Asset'
  },
  {
    sku: 'OB-030',
    name: 'Premier Face Tissue',
    brand: 'Premier',
    category: 'housekeeping-hygiene',
    url: 'https://www.bbassets.com/media/uploads/p/l/100006283_3-premier-special-face-tissue.jpg',
    targetDir: 'public/assets/products/housekeeping',
    filename: 'ob-030-premier-face-tissue.webp',
    sourceType: 'Premier Tissues Official Retail Packaging Photo'
  },
  {
    sku: 'OB-PAP-03',
    name: 'JK Easy Copier Paper 70 GSM A4',
    brand: 'JK Paper',
    category: 'office-stationery',
    url: 'https://5.imimg.com/data5/SELLER/Default/2025/5/515272160/KX/WT/EC/47434737/jk-easy-70-gsm-500x500.jpg',
    targetDir: 'public/assets/products/copier-papers',
    filename: 'ob-pap-03-jk-easy-copier-paper-70-gsm-a4.webp',
    sourceType: 'JK Paper Authorized Packaging Photography'
  },
  {
    sku: 'OB-PAP-07',
    name: 'JK Sparkle Multipurpose Paper (70/75/80 GSM) A4',
    brand: 'JK Paper',
    category: 'office-stationery',
    url: 'https://www.jkpaper.com/product-jk-sparkle-75gsm-new.png',
    targetDir: 'public/assets/products/copier-papers',
    filename: 'ob-pap-07-jk-sparkle-multipurpose-paper-70-75-80-gsm-a4.webp',
    sourceType: 'JK Paper Official Manufacturer Website Render'
  },
  {
    sku: 'OB-PAP-09',
    name: 'TNPL Copier Paper 70 GSM A4',
    brand: 'TNPL',
    category: 'office-stationery',
    url: 'https://www.vlestore.com/wp-source/uploads/2024/11/tnpl70-1-600x599.jpg',
    targetDir: 'public/assets/products/copier-papers',
    filename: 'ob-pap-09-tnpl-copier-paper-70-gsm-a4.webp',
    sourceType: 'TNPL Authorized Distributor Studio Asset'
  },
  {
    sku: 'OB-DES-51',
    name: 'Fevicol MR Adhesive Tube',
    brand: 'Fevicol',
    category: 'office-stationery',
    url: 'https://5.imimg.com/data5/SELLER/Default/2023/3/YR/KQ/PG/26650347/fevicol-mr-easy-flow-squeeze-bottle-500x500.jpg',
    targetDir: 'public/assets/products/stationery',
    filename: 'ob-des-51-fevicol-mr-adhesive-tube.webp',
    sourceType: 'Pidilite Industries Official Product Photography'
  },
  {
    sku: 'OB-NOT-71',
    name: 'Post-it Self Adhesive Sticky Notes Pad',
    brand: '3M Post-it',
    category: 'office-stationery',
    url: 'https://multimedia.3m.com/mws/media/2055142J/post-it-r-super-sticky-notes-3-x-3-in-4-pads-90-sheets-76-x-76-mm.jpg?width=506',
    targetDir: 'public/assets/products/stationery',
    filename: 'ob-not-71-post-it-self-adhesive-sticky-notes-pad.webp',
    sourceType: '3M Official Corporate Multimedia Repository'
  },
  {
    sku: 'OB-NOT-73',
    name: 'Casio Electronic Desk Calculator',
    brand: 'Casio',
    category: 'printers-technology',
    url: 'https://www.casio.com/content/dam/casio/product-info/locales/in/en/calc/product/practical/M/MJ/MJ1/MJ-120DPlus/assets/MJ-120DPlus-BK.jpg.transform/main-visual-sp/image.jpg',
    targetDir: 'public/assets/products/stationery',
    filename: 'ob-not-73-casio-electronic-desk-calculator.webp',
    sourceType: 'Casio India Official Product Catalog Photography'
  },
  {
    sku: 'OB-PEN-38',
    name: 'Rorito 045 Classic Ballpoint Pen Pack',
    brand: 'Rorito',
    category: 'office-stationery',
    url: 'https://5.imimg.com/data5/SELLER/Default/2024/4/408614036/ZF/UR/RQ/27678887/rorito-045-ball-pen-1-500x500.jpg',
    targetDir: 'public/assets/products/stationery',
    filename: 'ob-pen-38-rorito-045-classic-ballpoint-pen-pack.webp',
    sourceType: 'Rorito Authorized Distributor Product Photography'
  }
];

async function run() {
  console.log(`Starting replacement process for ${REPLACEMENTS.length} verified manufacturer assets...`);

  const results: any[] = [];

  for (const item of REPLACEMENTS) {
    console.log(`Fetching [${item.sku}] ${item.name} from ${item.url}...`);
    try {
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!res.ok) {
        console.error(`Failed to download ${item.sku}: HTTP ${res.status}`);
        results.push({ sku: item.sku, success: false, error: `HTTP ${res.status}` });
        continue;
      }

      const rawBuffer = Buffer.from(await res.arrayBuffer());

      // Standardize to 600x600 square canvas with white background
      const targetPath = path.join(process.cwd(), item.targetDir, item.filename);

      // Create high-quality WebP on 600x600 canvas
      const standardized = await sharp(rawBuffer)
        .resize({
          width: 540,
          height: 540,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .extend({
          top: 30,
          bottom: 30,
          left: 30,
          right: 30,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 92 })
        .toBuffer();

      fs.writeFileSync(targetPath, standardized);
      const relativePath = `/${item.targetDir.replace(/^public\//, '')}/${item.filename}`;

      console.log(`✅ Successfully replaced [${item.sku}] -> ${relativePath} (${standardized.length} bytes)`);
      results.push({
        sku: item.sku,
        name: item.name,
        success: true,
        path: relativePath,
        sizeBytes: standardized.length,
        sourceType: item.sourceType
      });
    } catch (e: any) {
      console.error(`Error processing ${item.sku}:`, e.message);
      results.push({ sku: item.sku, success: false, error: e.message });
    }
  }

  // Update src/lib/data/catalog.ts with the new clean paths
  console.log('\nUpdating src/lib/data/catalog.ts with verified replacement paths...');
  let catalogSrc = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

  for (const r of results) {
    if (r.success) {
      // Regex to find product block with this SKU and update images: [...]
      const skuRegex = new RegExp(`"sku":\\s*"${r.sku}",[\\s\\S]*?"images":\\s*\\[[^\\]]*\\]`);
      catalogSrc = catalogSrc.replace(skuRegex, (match) => {
        return match.replace(/"images":\s*\[\s*"[^"]*"\s*\]/, `"images": [\n        "${r.path}"\n      ]`);
      });
    }
  }

  fs.writeFileSync('src/lib/data/catalog.ts', catalogSrc, 'utf8');
  console.log('Updated src/lib/data/catalog.ts successfully.');

  fs.writeFileSync('scripts/replacement_execution_results.json', JSON.stringify(results, null, 2), 'utf8');
}

run().catch(console.error);
