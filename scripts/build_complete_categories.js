const fs = require('fs');

// Read existing catalog
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const startIdx = content.indexOf('const RAW_PRODUCTS: Product[] = [');
const endIdx = content.indexOf('export const INITIAL_PRODUCTS: Product[]');
const rawSlice = content.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim();
const products = eval(rawSlice.replace(/;\s*$/, ''));

console.log('Total products to map:', products.length);

// Subcategories definition
const ALL_SUBCATEGORIES = [
  // ============================================================
  // 1. HOUSEKEEPING & HYGIENE (8 Subcategories)
  // ============================================================
  {
    id: 'cleaning-chemicals',
    name: 'Cleaning Chemicals & Detergents',
    slug: 'cleaning-chemicals',
    categoryId: 'housekeeping-hygiene',
    description: 'Commercial Diversey Taski concentrates (R1-R9), Colin, Lizol, Harpic, dishwash liquids, phenyl, and floor cleaners.',
    imageUrl: '/images/subcategories/cleaning-chemicals.webp',
  },
  {
    id: 'washroom-dispensers',
    name: 'Washroom Hygiene & Dispensers',
    slug: 'washroom-dispensers',
    categoryId: 'housekeeping-hygiene',
    description: 'Stainless steel and ABS soap dispensers, jet hand dryers, paper cup dispensers, shoe cover dispensers, and shoe polish machines.',
    imageUrl: '/images/categories/housekeeping-facility.jpg',
  },
  {
    id: 'tissue-papers-rolls',
    name: 'Tissue Papers & Rolls',
    slug: 'tissue-papers-rolls',
    categoryId: 'housekeeping-hygiene',
    description: 'Commercial C-fold towels, M-fold tissues, HRT rolls, jumbo toilet rolls, paper napkins, and Kimberly-Clark Kimsoft products.',
    imageUrl: '/images/subcategories/tissue-paper.webp',
  },
  {
    id: 'dustbins-waste-handling',
    name: 'Dustbins & Waste Handling',
    slug: 'dustbins-waste-handling',
    categoryId: 'housekeeping-hygiene',
    description: 'Stainless steel pedal dustbins, perforated bins, lobby ashtray bins, mobile wheeled garbage bins (60L-240L), and biodegradable garbage bags.',
    imageUrl: '/images/subcategories/industrial-dustbins.jpg',
  },
  {
    id: 'mops-floor-wipers',
    name: 'Mops & Floor Wipers',
    slug: 'mops-floor-wipers',
    categoryId: 'housekeeping-hygiene',
    description: 'Cotton floor mops, clip mop heads, Kentucky mops, glass combi wipers, kitchen counter wipers, and floor wipers with long handles.',
    imageUrl: '/images/subcategories/housekeeping-tools.jpg',
  },
  {
    id: 'cloths-scrubbers-brushes',
    name: 'Cleaning Cloths, Scrubbers & Brushes',
    slug: 'cloths-scrubbers-brushes',
    categoryId: 'housekeeping-hygiene',
    description: 'Microfiber duster cloths, checked cloths, white banian waste cloths, sponge scrub pads, steel scrubbers, and toilet cleaning brushes.',
    imageUrl: '/images/subcategories/housekeeping-accessories.webp',
  },
  {
    id: 'cleaning-equipment-trolleys',
    name: 'Cleaning Equipment & Trolleys',
    slug: 'cleaning-equipment-trolleys',
    categoryId: 'housekeeping-hygiene',
    description: 'Commercial wet & dry vacuum cleaners, single and double bucket wringer trolleys, janitor service trolleys, and caddy baskets.',
    imageUrl: '/images/categories/housekeeping-facility.jpg',
  },
  {
    id: 'air-fresheners-care',
    name: 'Air Fresheners & Washroom Care',
    slug: 'air-fresheners-care',
    categoryId: 'housekeeping-hygiene',
    description: 'Automatic LED/LCD air freshener dispensers, aerosol fragrance refills, room freshener sprays, urinal screens, and naphthalene balls.',
    imageUrl: '/images/categories/pantry-hygiene.jpg',
  },

  // ============================================================
  // 2. OFFICE STATIONERY (7 Subcategories - Existing Verified Names)
  // ============================================================
  {
    id: 'writing-instruments',
    name: 'Writing Instruments',
    slug: 'writing-instruments',
    categoryId: 'office-stationery',
    description: 'Corporate writing instruments including ballpoint pens, gel pens, permanent markers, whiteboard markers, highlighters, and pencils.',
    imageUrl: '/images/hero-collage/colored-pens.jpg',
  },
  {
    id: 'paper-notebooks',
    name: 'Paper & Notebooks',
    slug: 'paper-notebooks',
    categoryId: 'office-stationery',
    description: 'High-brightness A4/A3 copier paper reams (JK Copier, TNPL, Bond), executive notebooks, attendance registers, and sticky notes.',
    imageUrl: '/images/banners/jk-copier.jpg',
  },
  {
    id: 'files-office-organization',
    name: 'Files & Office Organization',
    slug: 'files-office-organization',
    categoryId: 'office-stationery',
    description: 'Box files 3025, lever arch folders, paper tag files, expanding files, report files, stick files, ring binders, and index separators.',
    imageUrl: '/images/banners/stationery-files-workspace.jpg',
  },
  {
    id: 'desk-accessories-tools',
    name: 'Desk Organization & Tools',
    slug: 'desk-accessories-tools',
    categoryId: 'office-stationery',
    description: 'Kangaro heavy duty staplers, paper punches DP-600, binder clips, gem clips, paper pins, stamp pads, scissors, and paper trays.',
    imageUrl: '/images/subcategories/desk-stationery.jpg',
  },
  {
    id: 'boards-visual-display',
    name: 'Boards & Visual Display',
    slug: 'boards-visual-display',
    categoryId: 'office-stationery',
    description: 'Magnetic whiteboards, pin-up notice boards, sliding boards, pegboards, white board dusters, magazine stands, and display stands.',
    imageUrl: '/images/categories/boards-displays.jpg',
  },
  {
    id: 'office-pantry-essentials',
    name: 'Office Pantry Essentials',
    slug: 'office-pantry-essentials',
    categoryId: 'office-stationery',
    description: 'Corporate pantry consumables including paper cups, napkins, copper water bottles, and cafeteria refreshments.',
    imageUrl: '/images/categories/pantry-hygiene.jpg',
  },
  {
    id: 'safety-maintenance',
    name: 'Safety & Facility Maintenance',
    slug: 'safety-maintenance',
    categoryId: 'office-stationery',
    description: 'Workplace traffic safety cones, convex security mirrors, speed breakers, PPE safety kits, N95 masks, sanitizers, and caution boards.',
    imageUrl: '/images/categories/safety-ppe-equipment.jpg',
  },

  // ============================================================
  // 3. PRINTERS & TECHNOLOGY (5 Subcategories)
  // ============================================================
  {
    id: 'laser-toner-cartridges',
    name: 'Laser Toner Cartridges',
    slug: 'laser-toner-cartridges',
    categoryId: 'printers-technology',
    description: 'Laser toner cartridges for HP, Canon, Samsung, and Best Print compatible toners with crisp output and high page yields.',
    imageUrl: '/images/subcategories/laser-toners.webp',
  },
  {
    id: 'ink-cartridges-supplies',
    name: 'Ink Cartridges & Print Supplies',
    slug: 'ink-cartridges-supplies',
    categoryId: 'printers-technology',
    description: 'Original and compatible ink cartridges, tri-color inks, Dymo label cartridges, True Picture media, and printer refilling supplies.',
    imageUrl: '/images/categories/printer-supplies-toner.jpg',
  },
  {
    id: 'paper-shredders',
    name: 'Paper Shredding Machines',
    slug: 'paper-shredders',
    categoryId: 'printers-technology',
    description: 'Commercial heavy-duty cross-cut and strip-cut paper shredders for confidential office document security and destruction.',
    imageUrl: '/images/subcategories/paper-shredders.webp',
  },
  {
    id: 'currency-counting-machines',
    name: 'Currency Counting Machines',
    slug: 'currency-counting-machines',
    categoryId: 'printers-technology',
    description: 'Intelligent high-speed currency counting machines with counterfeit detection (UV/MG/IR) for finance and retail operations.',
    imageUrl: '/images/categories/office-machines-tools.jpg',
  },
  {
    id: 'it-peripherals-machines',
    name: 'IT Peripherals & Office Machines',
    slug: 'it-peripherals-machines',
    categoryId: 'printers-technology',
    description: 'Barcode printers, Epson ink tank printers, Kent KS-12 lamination machines, spiral binding machines, hard disks, pen drives, and projectors.',
    imageUrl: '/images/subcategories/computer-consumables.jpg',
  },

  // ============================================================
  // 4. PACKAGING SUPPLIES (5 Subcategories)
  // ============================================================
  {
    id: 'bopp-packaging-tapes',
    name: 'BOPP Packaging Tapes',
    slug: 'bopp-packaging-tapes',
    categoryId: 'packaging-supplies',
    description: 'High-strength BOPP brown cello packing tapes, transparent sealing tapes, Wonder 555 clear tapes, and double-sided foam tapes.',
    imageUrl: '/images/subcategories/packaging-tapes.webp',
  },
  {
    id: 'protective-packaging-cushioning',
    name: 'Protective Packaging & Cushioning',
    slug: 'protective-packaging-cushioning',
    categoryId: 'packaging-supplies',
    description: 'Shock-absorbing air bubble wrap rolls, bubble sheets, and protective foam thermocol sheets for fragile dispatch items.',
    imageUrl: '/images/subcategories/protective-packaging.jpg',
  },
  {
    id: 'box-strapping-banding',
    name: 'Box Strapping & Banding Rolls',
    slug: 'box-strapping-banding',
    categoryId: 'packaging-supplies',
    description: 'Heavy-duty plastic packing patti rolls, manual strapping bands, and box strapping rolls for secure carton bundling.',
    imageUrl: '/images/categories/packaging-materials.jpg',
  },
  {
    id: 'floor-marking-safety-tapes',
    name: 'Floor Marking & Safety Tapes',
    slug: 'floor-marking-safety-tapes',
    categoryId: 'packaging-supplies',
    description: 'Durable yellow & black zebra floor marking caution tapes, safety hazard tapes, and anti-slip traction tapes.',
    imageUrl: '/images/categories/safety-ppe-equipment.jpg',
  },
  {
    id: 'adhesives-packaging-tools',
    name: 'Adhesives & Packaging Tools',
    slug: 'adhesives-packaging-tools',
    categoryId: 'packaging-supplies',
    description: 'Heavy duty tape dispensers (1-inch & 2-inch), Camel gum liquid adhesive paste, and carton cutters.',
    imageUrl: '/images/categories/packaging-materials.jpg',
  },
];

console.log('Defined', ALL_SUBCATEGORIES.length, 'subcategories.');

// Helper to assign subcategory to any product
function assignSubcategory(p) {
  const name = (p.name || '').toLowerCase();
  const sku = (p.sku || '').toUpperCase();
  const desc = (p.description || '').toLowerCase();
  const specs = p.specifications || {};
  const code = (specs.catalogueCode || sku).toUpperCase();

  // 1. PRINTERS & TECHNOLOGY
  if (
    sku.startsWith('OB-PRI') ||
    sku.startsWith('OB-SHR') ||
    sku.startsWith('OB-COM') ||
    code.startsWith('OB-EQP-86') ||
    code.startsWith('OB-EQP-87') ||
    code.startsWith('OB-EQP-88') ||
    code.startsWith('OB-NOT-73') ||
    name.includes('toner') ||
    name.includes('shredder') ||
    name.includes('currency counting') ||
    name.includes('lamination machine') ||
    name.includes('binding machine') ||
    name.includes('printer') ||
    name.includes('cartridge') ||
    name.includes('projector')
  ) {
    if (name.includes('toner') || name.includes('laser jet') || name.includes('12a') || name.includes('88a') || name.includes('ep 303') || name.includes('308') || name.includes('npg 51') || name.includes('mlt-d116s')) {
      return { catId: 'printers-technology', catName: 'Printers & Technology', subId: 'laser-toner-cartridges', subName: 'Laser Toner Cartridges' };
    }
    if (name.includes('ink cartridge') || name.includes('label cartridge') || name.includes('refilling cartridge') || name.includes('802') || name.includes('678') || name.includes('true picture')) {
      return { catId: 'printers-technology', catName: 'Printers & Technology', subId: 'ink-cartridges-supplies', subName: 'Ink Cartridges & Print Supplies' };
    }
    if (name.includes('shredder') || name.includes('shredding')) {
      return { catId: 'printers-technology', catName: 'Printers & Technology', subId: 'paper-shredders', subName: 'Paper Shredding Machines' };
    }
    if (name.includes('currency counting')) {
      return { catId: 'printers-technology', catName: 'Printers & Technology', subId: 'currency-counting-machines', subName: 'Currency Counting Machines' };
    }
    return { catId: 'printers-technology', catName: 'Printers & Technology', subId: 'it-peripherals-machines', subName: 'IT Peripherals & Office Machines' };
  }

  // 2. PACKAGING SUPPLIES
  if (
    sku.startsWith('OB-PAC') ||
    code.startsWith('OB-DES-49') ||
    code.startsWith('OB-DES-50') ||
    code.startsWith('OB-DES-52') ||
    code.startsWith('OB-DES-53') ||
    code.startsWith('OB-DES-54') ||
    code.startsWith('OB-DES-55') ||
    code.startsWith('OB-DES-57') ||
    code.startsWith('OB-DES-58') ||
    code.startsWith('OB-COV-29') ||
    code.startsWith('OB-RDS-24') ||
    code.startsWith('OB-RDS-38') ||
    name.includes('bopp') ||
    name.includes('cello tape') ||
    name.includes('cello brown') ||
    name.includes('bubble wrap') ||
    name.includes('bubble sheet') ||
    name.includes('foam thermocol') ||
    name.includes('strapping') ||
    name.includes('packing patti')
  ) {
    if (name.includes('caution tape') || name.includes('floor marking') || name.includes('traction') || name.includes('warning tape') || name.includes('anti-slip')) {
      return { catId: 'packaging-supplies', catName: 'Packaging Supplies', subId: 'floor-marking-safety-tapes', subName: 'Floor Marking & Safety Tapes' };
    }
    if (name.includes('bubble') || name.includes('thermocol')) {
      return { catId: 'packaging-supplies', catName: 'Packaging Supplies', subId: 'protective-packaging-cushioning', subName: 'Protective Packaging & Cushioning' };
    }
    if (name.includes('strapping') || name.includes('patti')) {
      return { catId: 'packaging-supplies', catName: 'Packaging Supplies', subId: 'box-strapping-banding', subName: 'Box Strapping & Banding Rolls' };
    }
    if (name.includes('dispenser') || name.includes('gum') || name.includes('cutter')) {
      return { catId: 'packaging-supplies', catName: 'Packaging Supplies', subId: 'adhesives-packaging-tools', subName: 'Adhesives & Packaging Tools' };
    }
    return { catId: 'packaging-supplies', catName: 'Packaging Supplies', subId: 'bopp-packaging-tapes', subName: 'BOPP Packaging Tapes' };
  }

  // 3. HOUSEKEEPING & HYGIENE
  // Codes OB-001 to OB-162 and OB-HOU, OB-CLE, OB-GAR, OB-TIS
  const numCode = parseInt(code.replace(/^OB-0*/, ''), 10);
  const isHousekeepingCode = (code.startsWith('OB-') && !isNaN(numCode) && numCode >= 1 && numCode <= 162);
  if (
    isHousekeepingCode ||
    sku.startsWith('OB-HOU') ||
    sku.startsWith('OB-CLE') ||
    sku.startsWith('OB-GAR') ||
    sku.startsWith('OB-TIS') ||
    name.includes('taski') ||
    name.includes('cleaner') ||
    name.includes('detergent') ||
    name.includes('dispenser') ||
    name.includes('dustbin') ||
    name.includes('wiper') ||
    name.includes('mop') ||
    name.includes('tissue') ||
    name.includes('napkin') ||
    name.includes('scrubber') ||
    name.includes('duster cloth')
  ) {
    // Sub-branches of Housekeeping
    if (
      name.includes('taski') ||
      name.includes('phenyl') ||
      name.includes('acid') ||
      name.includes('dish wash') ||
      name.includes('dishwash') ||
      name.includes('colin') ||
      name.includes('lizol') ||
      name.includes('harpic') ||
      name.includes('chemical') ||
      name.includes('floor cleaner') ||
      name.includes('soap oil') ||
      (numCode >= 145 && numCode <= 162)
    ) {
      return { catId: 'housekeeping-hygiene', catName: 'Housekeeping & Hygiene', subId: 'cleaning-chemicals', subName: 'Cleaning Chemicals & Detergents' };
    }

    if (
      name.includes('soap dispenser') ||
      name.includes('hand dryer') ||
      name.includes('shoe cover dispenser') ||
      name.includes('paper cup dispenser') ||
      name.includes('shoe polish machine') ||
      (numCode >= 1 && numCode <= 5) ||
      (numCode >= 7 && numCode <= 7) ||
      (numCode >= 10 && numCode <= 27 && name.includes('dispenser'))
    ) {
      return { catId: 'housekeeping-hygiene', catName: 'Housekeeping & Hygiene', subId: 'washroom-dispensers', subName: 'Washroom Hygiene & Dispensers' };
    }

    if (
      name.includes('tissue') ||
      name.includes('napkin') ||
      name.includes('toilet roll') ||
      name.includes('kitchen roll') ||
      name.includes('c fold') ||
      name.includes('m fold') ||
      name.includes('hrt roll') ||
      name.includes('kimsoft') ||
      (numCode >= 28 && numCode <= 36)
    ) {
      return { catId: 'housekeeping-hygiene', catName: 'Housekeeping & Hygiene', subId: 'tissue-papers-rolls', subName: 'Tissue Papers & Rolls' };
    }

    if (
      name.includes('dustbin') ||
      name.includes('dust bin') ||
      name.includes('garbage bag') ||
      name.includes('ashtray') ||
      name.includes('push can') ||
      (numCode >= 64 && numCode <= 72) ||
      numCode === 79 ||
      numCode === 82 ||
      (numCode >= 85 && numCode <= 90)
    ) {
      return { catId: 'housekeeping-hygiene', catName: 'Housekeeping & Hygiene', subId: 'dustbins-waste-handling', subName: 'Dustbins & Waste Handling' };
    }

    if (
      name.includes('mop') ||
      name.includes('wiper') ||
      (numCode >= 73 && numCode <= 78) ||
      numCode === 80 ||
      numCode === 83 ||
      numCode === 84 ||
      (numCode >= 91 && numCode <= 117)
    ) {
      return { catId: 'housekeeping-hygiene', catName: 'Housekeeping & Hygiene', subId: 'mops-floor-wipers', subName: 'Mops & Floor Wipers' };
    }

    if (
      name.includes('trolley') ||
      name.includes('caddy') ||
      name.includes('vacuum cleaner') ||
      name.includes('queue manager') ||
      numCode === 6 ||
      numCode === 9 ||
      numCode === 118 ||
      (numCode >= 136 && numCode <= 144)
    ) {
      return { catId: 'housekeeping-hygiene', catName: 'Housekeeping & Hygiene', subId: 'cleaning-equipment-trolleys', subName: 'Cleaning Equipment & Trolleys' };
    }

    if (
      name.includes('air freshener') ||
      name.includes('freshener') ||
      name.includes('odonil') ||
      name.includes('urinal') ||
      name.includes('naphthalene') ||
      (numCode >= 119 && numCode <= 135)
    ) {
      return { catId: 'housekeeping-hygiene', catName: 'Housekeeping & Hygiene', subId: 'air-fresheners-care', subName: 'Air Fresheners & Washroom Care' };
    }

    // Default housekeeping
    return { catId: 'housekeeping-hygiene', catName: 'Housekeeping & Hygiene', subId: 'cloths-scrubbers-brushes', subName: 'Cleaning Cloths, Scrubbers & Brushes' };
  }

  // 4. OFFICE STATIONERY (Remaining items)
  if (
    sku.startsWith('OB-STA') ||
    sku.startsWith('OB-BOA') ||
    sku.startsWith('OB-DIS') ||
    code.startsWith('OB-PAP') ||
    code.startsWith('OB-FIL') ||
    code.startsWith('OB-PEN') ||
    code.startsWith('OB-NOT') ||
    code.startsWith('OB-EQP') ||
    code.startsWith('OB-COV') ||
    code.startsWith('OB-RDS')
  ) {
    if (code.startsWith('OB-COV') || code.startsWith('OB-RDS') || name.includes('traffic') || name.includes('mask') || name.includes('gloves') || name.includes('barrier') || name.includes('speed breaker') || name.includes('mirror') || name.includes('sanitizer') || name.includes('thermometer') || name.includes('caution board') || name.includes('rumble strip') || name.includes('bollard') || name.includes('spring post') || name.includes('wheel chock') || name.includes('wheel stopper') || name.includes('corner guard')) {
      return { catId: 'office-stationery', catName: 'Office Stationery', subId: 'safety-maintenance', subName: 'Safety & Facility Maintenance' };
    }

    if (code.startsWith('OB-PEN') || name.includes('pen') || name.includes('pencil') || name.includes('marker') || name.includes('highlighter') || name.includes('eraser') || name.includes('sharpener')) {
      return { catId: 'office-stationery', catName: 'Office Stationery', subId: 'writing-instruments', subName: 'Writing Instruments' };
    }

    if (code.startsWith('OB-PAP') || name.includes('copier paper') || name.includes('bond paper') || name.includes('photo paper') || name.includes('notebook') || name.includes('register') || name.includes('notepad') || name.includes('scribbling pad') || name.includes('diary')) {
      return { catId: 'office-stationery', catName: 'Office Stationery', subId: 'paper-notebooks', subName: 'Paper & Notebooks' };
    }

    if (code.startsWith('OB-FIL') || name.includes('box file') || name.includes('folder') || name.includes('report file') || name.includes('stick file') || name.includes('binder') || name.includes('tag file') || name.includes('separator')) {
      return { catId: 'office-stationery', catName: 'Office Stationery', subId: 'files-office-organization', subName: 'Files & Office Organization' };
    }

    if (sku.startsWith('OB-BOA') || sku.startsWith('OB-DIS') || name.includes('board') || name.includes('stand') || name.includes('magazine rack') || name.includes('name plate')) {
      return { catId: 'office-stationery', catName: 'Office Stationery', subId: 'boards-visual-display', subName: 'Boards & Visual Display' };
    }

    if (name.includes('water bottle') || name.includes('pantry') || name.includes('cup') || name.includes('napkin')) {
      return { catId: 'office-stationery', catName: 'Office Stationery', subId: 'office-pantry-essentials', subName: 'Office Pantry Essentials' };
    }

    return { catId: 'office-stationery', catName: 'Office Stationery', subId: 'desk-accessories-tools', subName: 'Desk Organization & Tools' };
  }

  // Fallback
  return { catId: 'office-stationery', catName: 'Office Stationery', subId: 'desk-accessories-tools', subName: 'Desk Organization & Tools' };
}

// Test mapping on all 383 products
const catCounts = {};
const subCounts = {};

const updatedProducts = products.map((p) => {
  const mapping = assignSubcategory(p);
  catCounts[mapping.catId] = (catCounts[mapping.catId] || 0) + 1;
  subCounts[mapping.subId] = (subCounts[mapping.subId] || 0) + 1;
  return {
    ...p,
    categoryId: mapping.catId,
    categoryName: mapping.catName,
    subcategoryId: mapping.subId,
    subcategoryName: mapping.subName,
  };
});

console.log('\n--- MAIN CATEGORY COUNTS ---');
console.log(catCounts);

console.log('\n--- SUBCATEGORY COUNTS ---');
ALL_SUBCATEGORIES.forEach(sub => {
  console.log(`${sub.categoryId.padEnd(22)} | ${sub.id.padEnd(32)} | ${(subCounts[sub.id] || 0)} products | ${sub.name}`);
});

let unassignedSub = 0;
ALL_SUBCATEGORIES.forEach(sub => {
  if (!subCounts[sub.id]) {
    console.error(`EMPTY SUBCATEGORY: ${sub.id}`);
    unassignedSub++;
  }
});
console.log(`\nEmpty subcategories: ${unassignedSub}`);

