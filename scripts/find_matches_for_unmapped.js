const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);
const unmapped = JSON.parse(fs.readFileSync('scripts/current_unmapped_164.json', 'utf8'));

// Keywords for each candidate product
const candidates = [
  // 1. Scrubbing Pad
  {
    sku: 'OB-HOU-1011',
    name: 'Scrubbing Pad',
    keywords: ['Green Nylon Scrub Pad Unpackaged Flat View', 'Scrub Pad.jpg']
  },
  // 2. Checked Cloth
  {
    sku: 'OB-HOU-1016',
    name: 'Checked Cloth',
    keywords: ['Kitchen Check Towel Stack.jpg']
  },
  // 3. White Banian Cloth
  {
    sku: 'OB-HOU-1010',
    name: 'White Banian Cloth',
    keywords: ['Floor Cleaning Cloth 20x20.jpg']
  },
  // 4. Housekeeping Cleaning Chemicals
  {
    sku: 'OB-HOU-1012',
    name: 'Housekeeping Cleaning Chemicals',
    keywords: ['Taski R2 Hygienic Hard Surface Cleaner Concentrate 5 Litre Can Front and Back.jpg', 'Cif Pro All Purpose Kitchen Cleaner 5 Litre Can Front and Back.jpg']
  },
  // 5. Copper Water Bottle
  {
    sku: 'OB-HOU-1026',
    name: 'Copper Water Bottle',
    keywords: ['Stainless Water Bottle.jpeg', 'water bottle .jpeg']
  },
  // 6. Silver Stainless Steel SS Lobby Ashtray Bin
  {
    sku: 'OB-GAR-1032',
    name: 'Silver Stainless Steel SS Lobby Ashtray Bin',
    keywords: ['Stainless Steel Ash Can Dustbin With Side Opening Pair.jpg']
  },
  // 7. Cartoon Character Dustbin
  {
    sku: 'OB-GAR-1033',
    name: 'Cartoon Character Dustbin',
    keywords: ['Penguin Dustbin', 'Cartoon Dustbin', 'Animal Dustbin', 'Dolphin Dustbin']
  },
  // 8. A/4 Punch Folder
  {
    sku: 'OB-STA-1003',
    name: 'A/4 Punch Folder',
    keywords: ['Button Bag FS.jpeg']
  },
  // 9. A/4 Report File
  {
    sku: 'OB-STA-1004',
    name: 'A/4 Report File',
    keywords: ['Button Bag FS 1.jpeg']
  },
  // 10. A/4 Stick File
  {
    sku: 'OB-STA-1005',
    name: 'A/4 Stick File',
    keywords: ['Stick File', 'Report File']
  },
  // 11. Visiting Card Folder
  {
    sku: 'OB-STA-1006',
    name: 'Visiting Card Folder',
    keywords: ['Blue Wall Mounted Document Display Panel Flip Folder Rack 10 Panels Open.JPG', 'Document Display Panels']
  },
  // 12. Desk Visiting Card Holder Book
  {
    sku: 'OB-EQP-84',
    name: 'Desk Visiting Card Holder Book',
    keywords: ['Visiting Card', 'Card Holder']
  },
  // 13. Acrylic ID Card Badge Holder with Lanyard
  {
    sku: 'OB-EQP-89',
    name: 'Acrylic ID Card Badge Holder with Lanyard',
    keywords: ['ID Card', 'Badge Holder', 'Lanyard']
  },
  // 14. Keyboard Tray Metal
  {
    sku: 'OB-COM-1037',
    name: 'Keyboard Tray Metal',
    keywords: ['Key Board.jpeg']
  },
  // 15. Cello Brown Tape
  {
    sku: 'OB-PAC-1052',
    name: 'Cello Brown Tape',
    keywords: ['Brown Tape', 'BOPP Brown', 'Cello Brown', 'Tape Brown', 'Brown Cello']
  },
  // 16. Magic Tape With Dispenser
  {
    sku: 'OB-PAC-1057',
    name: 'Magic Tape With Dispenser',
    keywords: ['Magic Tape', 'Dispenser Tape', 'Tape Dispenser']
  },
  // 17. Paper Cutter Big
  {
    sku: 'OB-PAC-1058',
    name: 'Paper Cutter Big',
    keywords: ['Paper Cutter', 'Cutter']
  },
  // 18. Gum Paste
  {
    sku: 'OB-PAC-1059',
    name: 'Gum Paste',
    keywords: ['Gum', 'Paste', 'Glue']
  },
  // 19. Kitchen Roll Dispenser
  {
    sku: 'OB-027',
    name: 'Kitchen Roll Dispenser',
    keywords: ['Kitchen Roll Dispenser', 'Roll Dispenser']
  },
  // 20. Cotton Towel
  {
    sku: 'OB-045',
    name: 'Cotton Towel',
    keywords: ['Towel', 'Kitchen Check Towel']
  },
  // 21. Vim & Pril Dishwash Soap
  {
    sku: 'OB-054',
    name: 'Vim & Pril Dishwash Soap',
    keywords: ['Vim', 'Pril', 'Dishwash']
  },
  // 22. Carpet Brush
  {
    sku: 'OB-058',
    name: 'Carpet Brush',
    keywords: ['Carpet Brush']
  },
  // 23. Road Cleaning Brush
  {
    sku: 'OB-059',
    name: 'Road Cleaning Brush',
    keywords: ['Road Cleaning Brush', 'Broom']
  },
  // 24. Cobweb Stick Sunflower
  {
    sku: 'OB-062',
    name: 'Cobweb Stick Sunflower',
    keywords: ['Cobweb', 'Sunflower']
  },
  // 25. SS Push Can Dustbin
  {
    sku: 'OB-071',
    name: 'SS Push Can Dustbin',
    keywords: ['Push Can', 'Push Dustbin', 'SS Push']
  },
  // 26. Versa Wiper
  {
    sku: 'OB-076',
    name: 'Versa Wiper',
    keywords: ['Versa Wiper', 'Floor Wiper', 'Wiper']
  },
  // 27. Table Top Wiper
  {
    sku: 'OB-078',
    name: 'Table Top Wiper',
    keywords: ['Table Top Wiper', 'Glass Wiper', 'Kitchen Wiper']
  },
  // 28. Airwick Room Freshener Spray
  {
    sku: 'OB-095',
    name: 'Airwick Room Freshener Spray',
    keywords: ['Airwick', 'Freshener', 'Spray', 'Room Spray']
  },
  // 29. Cleaning Caddy Basket Organizer
  {
    sku: 'OB-102',
    name: 'Cleaning Caddy Basket Organizer',
    keywords: ['Caddy', 'Basket']
  },
  // 30. PVC Hard Broom
  {
    sku: 'OB-112',
    name: 'PVC Hard Broom',
    keywords: ['Hard Broom', 'Broom PVC', 'Plastic Broom']
  },
  // 31. Fevicol MR Adhesive Tube
  {
    sku: 'OB-DES-51',
    name: 'Fevicol MR Adhesive Tube',
    keywords: ['Fevicol']
  },
  // 32. Double Sided Foam Tape 1 inch
  {
    sku: 'OB-DES-52',
    name: 'Double Sided Foam Tape 1 inch',
    keywords: ['Foam Tape', 'Double Sided Tape']
  },
  // 33. Double Sided Transparent Tissue Tape
  {
    sku: 'OB-DES-53',
    name: 'Double Sided Transparent Tissue Tape',
    keywords: ['Tissue Tape', 'Transparent Tape']
  },
  // 34. Retractable Paper Cutter Medium
  {
    sku: 'OB-DES-56',
    name: 'Retractable Paper Cutter Medium',
    keywords: ['Cutter', 'Paper Cutter']
  },
  // 35. Stapler Pins Pack
  {
    sku: 'OB-DES-60',
    name: 'Stapler Pins Pack',
    keywords: ['Stapler Pin', 'Staple Pin', 'Pins']
  },
  // 36. Faber-Castell Office Stamp Pad
  {
    sku: 'OB-DES-62',
    name: 'Faber-Castell Office Stamp Pad',
    keywords: ['Stamp Pad']
  },
  // 37. Stamp Pad Ink Bottle
  {
    sku: 'OB-DES-63',
    name: 'Stamp Pad Ink Bottle',
    keywords: ['Stamp Pad Ink', 'Ink Bottle']
  },
  // 38. Stainless Steel Measuring Scale Ruler
  {
    sku: 'OB-NOT-75',
    name: 'Stainless Steel Measuring Scale Ruler',
    keywords: ['Scale', 'Ruler']
  },
  // 39. Yellow Disposable Protective Mask
  {
    sku: 'OB-COV-05',
    name: 'Yellow Disposable Protective Mask',
    keywords: ['Mask Yellow', 'Yellow Mask', 'Protective Mask']
  }
];

console.log('Searching for candidate images across 2,365 archive images...\n');

for (const c of candidates) {
  const matches = validImages.filter(img => {
    const rel = img.rel.toLowerCase();
    return c.keywords.some(k => rel.includes(k.toLowerCase()));
  });

  if (matches.length > 0) {
    console.log(`[${c.sku}] ${c.name} -> Found ${matches.length} matches:`);
    matches.slice(0, 3).forEach(m => console.log(`   - ${m.rel}`));
  } else {
    console.log(`[${c.sku}] ${c.name} -> NO direct keyword matches`);
  }
}
