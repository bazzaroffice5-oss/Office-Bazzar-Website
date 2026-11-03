const fs = require('fs');
const path = require('path');

const catalog = JSON.parse(fs.readFileSync('catalog_products_dump.json', 'utf8'));
const inv = JSON.parse(fs.readFileSync('audit_2369_inventory.json', 'utf8')).filter(i => i.isImage && !i.isCorrupted);

console.log(`Building verified mapping for ${catalog.length} catalogue products from ${inv.length} package images...`);

// Helper to find best matching file in package by search terms
function findInPackage(terms, filterFolder = null, excludeTerms = []) {
  const normTerms = terms.map(t => t.toLowerCase());
  const normExcludes = excludeTerms.map(e => e.toLowerCase());

  const candidates = inv.filter(img => {
    const full = (img.relPath + ' ' + img.fileName).toLowerCase();
    if (filterFolder && !img.relPath.toLowerCase().includes(filterFolder.toLowerCase())) return false;
    for (const ex of normExcludes) {
      if (full.includes(ex)) return false;
    }
    for (const tm of normTerms) {
      if (!full.includes(tm)) return false;
    }
    return true;
  });

  // Sort candidates: prefer Front View or Front and Back, prefer higher resolution, avoid (2) duplicates
  candidates.sort((a, b) => {
    const aFront = a.fileName.toLowerCase().includes('front view') || a.fileName.toLowerCase().includes('front and back');
    const bFront = b.fileName.toLowerCase().includes('front view') || b.fileName.toLowerCase().includes('front and back');
    if (aFront && !bFront) return -1;
    if (!aFront && bFront) return 1;

    const aRes = (a.width || 0) * (a.height || 0);
    const bRes = (b.width || 0) * (b.height || 0);
    return bRes - aRes;
  });

  return candidates;
}

// Build mapping dictionary for every SKU
const mapping = {};

catalog.forEach(p => {
  const sku = p.sku;
  const name = p.name;
  const brand = p.brandName || '';
  const cat = p.categoryName || '';
  const oldImg = p.images && p.images[0] ? p.images[0] : '';

  let matchedFiles = [];
  let sourceNote = '';

  // 1. Specific SKU / Product Name Custom Matchers for 2,369 Package
  switch (sku) {
    // Section A: Stationery & Office Organization
    case 'OB-STA-1001':
      matchedFiles = findInPackage(['tag file image']);
      sourceNote = 'Package: Stationery/Tag File image.jpeg';
      break;
    case 'OB-STA-1002':
      matchedFiles = findInPackage(['a - z box file 3025']);
      sourceNote = 'Package: Stationery/A - Z Box File 3025 .jpeg';
      break;
    case 'OB-STA-1003':
      matchedFiles = findInPackage(['button bag fs']);
      sourceNote = 'Package: Stationery/Button Bag FS.jpeg';
      break;
    case 'OB-STA-1004':
      matchedFiles = findInPackage(['classik a4 403 2 ring binder']);
      sourceNote = 'Package: Stationery/Classik A4 403 2 Ring Binder...';
      break;
    case 'OB-STA-1005':
      matchedFiles = findInPackage(['expanding button folder']);
      sourceNote = 'Package: Folders/EXPANDING BUTTON FOLDER.jpeg';
      break;
    case 'OB-STA-1006':
      matchedFiles = findInPackage(['blue wall mounted document display panel']);
      sourceNote = 'Package: Stationery/Blue Wall Mounted Document Display...';
      break;
    case 'OB-STA-1007':
      matchedFiles = findInPackage(['button bag fs 1']);
      sourceNote = 'Package: Stationery/Button Bag FS 1.jpeg';
      break;
    case 'OB-STA-1008':
      // Punching machine Kangaroo
      matchedFiles = findInPackage(['punch'], 'Stationery');
      break;
    case 'OB-STA-1009':
    case 'OB-HOU-1018':
      // Kangaro Stapler
      matchedFiles = findInPackage(['stapler'], 'Stationery');
      break;
    case 'OB-HOU-1010':
      // White Banian cloth
      matchedFiles = findInPackage(['cloth'], 'Cloth', ['blue', 'towel', 'microfiber']);
      break;
    case 'OB-HOU-1011':
      // Scrubbing pad
      matchedFiles = findInPackage(['sponge scourer pad']);
      break;
    case 'OB-HOU-1013':
    case 'OB-TIS-1096':
      // Tissue Paper Napkin
      matchedFiles = findInPackage(['apple soft tissue paper napkins pack']);
      break;
    case 'OB-HOU-1014':
      // Table wiper
      matchedFiles = findInPackage(['kitchen and table mini squeegee wiper']);
      break;
    case 'OB-HOU-1015':
      // Toilet cleaning brush
      matchedFiles = findInPackage(['toilet cleaning brushes assortment']);
      break;
    case 'OB-HOU-1016':
      // Checked cloth
      matchedFiles = findInPackage(['floor cleaning cloth']);
      break;
    case 'OB-HOU-1017':
      // Rubber gloves
      matchedFiles = findInPackage(['household rubber gloves yellow blue orange']);
      break;
    case 'OB-HOU-1019':
      // Glass wiper
      matchedFiles = findInPackage(['window glass wiper with sponge squeegee']);
      break;
    case 'OB-HOU-1020':
      // Caddy basket
      matchedFiles = findInPackage(['plastic cleaning caddy basket blue']);
      break;
    case 'OB-HOU-1021':
      // Wringer trolley
      matchedFiles = findInPackage(['triple bucket mop wringer trolley cart']);
      break;
    case 'OB-HOU-1022':
      // Stainless steel hand soap dispenser
      matchedFiles = findInPackage(['soap dispenser', 'stainless'], 'Dispenser');
      break;
    case 'OB-HOU-1023':
      // ABS hand dryer machine
      matchedFiles = findInPackage(['automatic hand dryer', 'white'], 'Hygenic Tools and Trolly');
      break;
    case 'OB-HOU-1024':
      // Stainless steel hand dryer machine
      matchedFiles = findInPackage(['automatic hand dryer stainless steel'], 'Hygenic Tools and Trolly');
      break;
    case 'OB-HOU-1025':
      // Air freshener dispenser LED
      matchedFiles = findInPackage(['aerosol dispenser automatic white box']);
      break;
    case 'OB-HOU-1026':
      // Copper water bottle / stainless water bottle
      matchedFiles = findInPackage(['stainless water bottle']);
      break;
    case 'OB-HOU-1027':
      // Toilet roll dispenser
      matchedFiles = findInPackage(['cute star design jumbo toilet roll dispenser']);
      break;
    case 'OB-GAR-1028':
      // Stainless steel dustbin
      matchedFiles = findInPackage(['perforated stainless steel dustbin 8x12']);
      break;
    case 'OB-GAR-1029':
      // Aristo Wheeled Dust Bin 120 Litre With Pedal
      matchedFiles = findInPackage(['aristo', '120 ltr', 'wheel', 'pedal']);
      break;
    case 'OB-GAR-1030':
      // Cartoon character dustbin
      matchedFiles = findInPackage(['cartoon'], 'Dustbin');
      break;
    case 'OB-GAR-1031':
      // Garbage Bag - Small
      matchedFiles = findInPackage(['clean india garbage bags', 'small']);
      break;
    case 'OB-GAR-1032':
      // Green Biodegradable Garbage Bag
      matchedFiles = findInPackage(['lazzo biodegradable', 'green']);
      break;
    case 'OB-GAR-1033':
      // Silver Stainless Steel SS Lobby Ashtray Bin
      matchedFiles = findInPackage(['ashtray'], 'Dustbin');
      break;
    case 'OB-PAC-1052':
      // Cello brown tape
      matchedFiles = findInPackage(['tape'], 'Packing Product');
      break;
    case 'OB-PAC-1053':
      // Floor marking tapes
      matchedFiles = findInPackage(['floor masking tape 2 inch 25 mtr']);
      break;
    case 'OB-PAC-1054':
      // Cello tape / packing patti
      matchedFiles = findInPackage(['blue box strapping band roll']);
      break;
    case 'OB-DIS-1060':
      // Tripod stand / board stand
      matchedFiles = findInPackage(['stand'], 'Stationery');
      break;
    case 'OB-DIS-1061':
      // Wooden stand for boards
      matchedFiles = findInPackage(['stand'], 'Stationery');
      break;
    case 'OB-DIS-1062':
      // Double sided newspaper stand / magazine stand
      matchedFiles = findInPackage(['magazine brochure display stand rack']);
      break;
    case 'OB-SHR-1064':
    case 'OB-SHR-1065':
    case 'OB-SHR-1066':
    case 'OB-SHR-1067':
    case 'OB-SHR-1068':
      // Gobbler shredders
      matchedFiles = findInPackage(['gobbler shredder machine']);
      break;
    case 'OB-CLE-1070':
      // Colin glass cleaner 500 ml
      matchedFiles = findInPackage(['colin glass and multisurface cleaner sparkling shine 500ml']);
      break;
    case 'OB-CLE-1073':
      // Dettol disinfectant spray
      matchedFiles = findInPackage(['dettol disinfectant spray original pine 225 ml']);
      break;
    case 'OB-CLE-1087':
      // Lizol liquid cleaner
      matchedFiles = findInPackage(['lizol']);
      break;
    case 'OB-CLE-1088':
      // Harpic toilet cleaner
      matchedFiles = findInPackage(['harpic']);
      break;
    case 'OB-CLE-1089':
      // Liquid white phenyl
      matchedFiles = findInPackage(['hi-clean herbal perfumed phenyle white milk 1 litre']);
      break;
    case 'OB-CLE-1091':
      // Vim liquid dish wash
      matchedFiles = findInPackage(['vim']);
      break;
    case 'OB-CLE-1092':
      // Taski R6 toilet cleaner
      matchedFiles = findInPackage(['diversey taski r6 toilet bowl cleaner 5 litre can front view']);
      break;
    case 'OB-CLE-1093':
      // Taski R4 furniture maintainer
      matchedFiles = findInPackage(['diversey taski r4 shine up furniture maintainer 5 litre can front view']);
      break;
    case 'OB-CLE-1094':
      // Hi Clean floor cleaner 5 Ltr
      matchedFiles = findInPackage(['hi-clean hc r-1 cleaning and sanitising of bathroom and floor']);
      break;
    case 'OB-CLE-1095':
      // Hi Clean liquid soap oil
      matchedFiles = findInPackage(['hi-clean hc-h1 liquid hand wash pink 5 litre']);
      break;
    case 'OB-TIS-1097':
      // Royal napkins
      matchedFiles = findInPackage(['royal napkins']);
      break;
    case 'OB-TIS-1098':
      // C fold tissue
      matchedFiles = findInPackage(['c-fold paper hand towel white pack and stack']);
      break;
    case 'OB-TIS-1099':
      // M fold tissue
      matchedFiles = findInPackage(['m-fold']);
      break;
    case 'OB-TIS-1100':
      // Kimsoft tissue
      matchedFiles = findInPackage(['kimsoft']);
      break;
    case 'OB-TIS-1101':
      // Toilet roll big
      matchedFiles = findInPackage(['apple toilet roll paper single roll']);
      break;
  }

  // 2. Generic Product Matching for OB-001 through OB-200 and others
  if (matchedFiles.length === 0) {
    // Check specific name terms
    const cleanName = name.toLowerCase();

    if (cleanName.includes('shoe cover dispenser')) {
      matchedFiles = findInPackage(['shoe cover dispenser']);
    } else if (cleanName.includes('paper cup dispenser')) {
      matchedFiles = findInPackage(['paper cup dispenser']);
    } else if (cleanName.includes('jet hand dryer')) {
      matchedFiles = findInPackage(['jet hand dryer']);
    } else if (cleanName.includes('vacuum cleaner')) {
      matchedFiles = findInPackage(['crv 15-c ltr stainless steel wet and dry vacuum cleaner']);
    } else if (cleanName.includes('shoe polish machine')) {
      matchedFiles = findInPackage(['automatic shoe shining machine']);
    } else if (cleanName.includes('feather duster')) {
      matchedFiles = findInPackage(['feather duster']);
    } else if (cleanName.includes('abs soap dispenser')) {
      matchedFiles = findInPackage(['soap dispenser', 'abs'], 'Dispenser');
    } else if (cleanName.includes('automatic soap dispenser')) {
      matchedFiles = findInPackage(['automatic hand sanitizer soap dispenser']);
    } else if (cleanName.includes('jumbo roll tissue dispenser')) {
      matchedFiles = findInPackage(['jumbo toilet roll dispenser']);
    } else if (cleanName.includes('toilet roll dispenser')) {
      matchedFiles = findInPackage(['toilet roll dispenser'], 'Dispenser');
    } else if (cleanName.includes('hrt roll dispenser')) {
      matchedFiles = findInPackage(['hrt roll towel dispenser']);
    } else if (cleanName.includes('hrt tissue roll')) {
      matchedFiles = findInPackage(['greenlime hrt white hand roll towel']);
    } else if (cleanName.includes('kitchen tissue roll')) {
      matchedFiles = findInPackage(['kitchen tissue roll']);
    } else if (cleanName.includes('micro fiber cloth') || cleanName.includes('microfiber cloth')) {
      matchedFiles = findInPackage(['microfiber cloth'], 'Cloth');
    } else if (cleanName.includes('banian cloth')) {
      matchedFiles = findInPackage(['floor cleaning cloth'], 'Cloth');
    } else if (cleanName.includes('blue duster cloth')) {
      matchedFiles = findInPackage(['blue microfiber cloth']);
    } else if (cleanName.includes('nylon scrubber')) {
      matchedFiles = findInPackage(['sponge scourer pad']);
    } else if (cleanName.includes('exo round bar')) {
      matchedFiles = findInPackage(['exo anti-bacterial dish wash bar']);
    } else if (cleanName.includes('toilet brush')) {
      matchedFiles = findInPackage(['toilet cleaning brushes']);
    } else if (cleanName.includes('pedal dustbin')) {
      matchedFiles = findInPackage(['aristo lazzo bio hazard pedal dustbin']);
    } else if (cleanName.includes('perforated dustbin')) {
      matchedFiles = findInPackage(['perforated stainless steel dustbin']);
    } else if (cleanName.includes('swing plastic dustbin') || cleanName.includes('swing dustbin')) {
      matchedFiles = findInPackage(['aristo lazzo swing bin']);
    } else if (cleanName.includes('kitchen counter wiper') || cleanName.includes('table top wiper')) {
      matchedFiles = findInPackage(['kitchen and table mini squeegee wiper']);
    } else if (cleanName.includes('floor wiper')) {
      matchedFiles = findInPackage(['floor wiper with long']);
    } else if (cleanName.includes('clip mop')) {
      matchedFiles = findInPackage(['clip mop']);
    } else if (cleanName.includes('twist floor mop') || cleanName.includes('floor mop')) {
      matchedFiles = findInPackage(['mop with handle']);
    } else if (cleanName.includes('welcome mat') || cleanName.includes('door mat')) {
      matchedFiles = findInPackage(['comfort pvc cushion coil welcome door mat']);
    } else if (cleanName.includes('airwick room freshener')) {
      matchedFiles = findInPackage(['air wick air freshener spray cans']);
    } else if (cleanName.includes('caddy basket')) {
      matchedFiles = findInPackage(['plastic cleaning caddy basket']);
    } else if (cleanName.includes('caustic soda')) {
      matchedFiles = findInPackage(['caustic soda']);
    } else if (cleanName.includes('taski r1')) {
      matchedFiles = findInPackage(['diversey taski r1 super bathroom cleaner concentrate 5 litre can front view']);
    } else if (cleanName.includes('taski r20')) {
      matchedFiles = findInPackage(['diversey taski r20 strip floor stripper 5 litre can front view']);
    } else if (cleanName.includes('taski r2')) {
      matchedFiles = findInPackage(['diversey taski r2 hygienic hard surface cleaner concentrate 5 litre can front view']);
    } else if (cleanName.includes('taski r3')) {
      matchedFiles = findInPackage(['diversey taski r3 glass cleaner concentrate 5 litre can front view']);
    } else if (cleanName.includes('taski r4')) {
      matchedFiles = findInPackage(['diversey taski r4 shine up furniture maintainer 5 litre can front view']);
    } else if (cleanName.includes('taski r5')) {
      matchedFiles = findInPackage(['diversey taski r5 air freshener 5 litre can front view']);
    } else if (cleanName.includes('taski r6')) {
      matchedFiles = findInPackage(['diversey taski r6 toilet bowl cleaner 5 litre can front view']);
    } else if (cleanName.includes('taski r7')) {
      matchedFiles = findInPackage(['diversey taski r7 floor cleaner concentrate 5 litre can front view']);
    } else if (cleanName.includes('taski r9')) {
      matchedFiles = findInPackage(['diversey taski r9 bathroom cleaner concentrate 5 litre can front view']);
    } else if (cleanName.includes('taski spiral')) {
      matchedFiles = findInPackage(['diversey taski spiral hd']);
    } else if (cleanName.includes('telescopic aluminum extension pole')) {
      matchedFiles = findInPackage(['aluminium telescopic extension poles 3.6m 6m 8m set of 3']);
    } else if (cleanName.includes('wringer trolley triple bucket')) {
      matchedFiles = findInPackage(['triple bucket mop wringer trolley cart']);
    } else if (cleanName.includes('platform trolley')) {
      matchedFiles = findInPackage(['platform trolley']);
    } else if (cleanName.includes('janitor cleaning service trolley')) {
      matchedFiles = findInPackage(['janitor']);
    }
  }

  // Record mapping result
  const hasPackageMatch = matchedFiles.length > 0;
  mapping[sku] = {
    sku,
    name,
    brand,
    category: cat,
    oldImage: oldImg,
    hasPackageMatch,
    matchedFile: hasPackageMatch ? matchedFiles[0].relPath : null,
    alternativeFiles: hasPackageMatch ? matchedFiles.slice(1, 4).map(m => m.relPath) : [],
    sourceNote: hasPackageMatch ? (sourceNote || `Package: ${matchedFiles[0].relPath}`) : 'Preserved Verified Master'
  };
});

fs.writeFileSync('verified_sku_image_map.json', JSON.stringify(mapping, null, 2), 'utf8');

const packageMatches = Object.values(mapping).filter(m => m.hasPackageMatch);
console.log(`\nVerified Package Matches: ${packageMatches.length}/${catalog.length}`);
console.log(`Preserved Verified Masters: ${catalog.length - packageMatches.length}/${catalog.length}`);

