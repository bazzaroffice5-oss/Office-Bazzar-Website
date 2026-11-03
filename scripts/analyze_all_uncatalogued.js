const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);
const manifest = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));

// Also check the batches we just mapped in batch 16 and batch safety
const mappedSupplierSources = new Set();

for (const entry of manifest) {
  if (entry.primarySource) {
    mappedSupplierSources.add(entry.primarySource.replace(/\\/g, '/').toLowerCase());
  }
  if (entry.supplierSource) {
    mappedSupplierSources.add(entry.supplierSource.replace(/\\/g, '/').toLowerCase());
  }
  if (Array.isArray(entry.altSources)) {
    entry.altSources.forEach(s => mappedSupplierSources.add(s.replace(/\\/g, '/').toLowerCase()));
  }
}

// Add batch 16 & safety sources
const batch16 = [
  'Scotch Bright and Scrubber/Green Nylon Scrub Pad Unpackaged Flat View.jpg',
  'Collage/Scrub Pad.jpg',
  'Cloth/Kitchen Check Towel Stack.jpg',
  'Cloth/Floor Cleaning Cloth 20x20.jpg',
  'Mix/Chemical Product/Diversey Taski R2 Hygienic Hard Surface Cleaner Concentrate 5 Litre Can Front and Back.jpg',
  'Mix/Chemical Product/Cif Pro All Purpose Kitchen Cleaner 5 Litre Can Front and Back.jpg',
  'Stainless Water Bottle.jpeg',
  'water bottle .jpeg',
  'Dustbin/Stainless Steel Ash Can Dustbin With Side Opening Pair.jpg',
  'Stationery/Button Bag FS.jpeg',
  'Stationery/Button Bag FS 1.jpeg',
  'Stationery/Blue Wall Mounted Document Display Panel Flip Folder Rack 10 Panels Open.JPG',
  'Stationery/Document Display Panels Blue Green Red Yellow Black Collaged Frames.JPG',
  'Stationery/Key Board.jpeg',
  'Cloth/Color Hand Towel 14x21.jpg',
  'Cloth/Color Bath Towel 24x48.jpg',
  'Collage/Pril Dishwash Liquid And Exo Dish Wash Bar.jpg',
  'Collage/Vim Dishwash Liquid 5L And Bottles.jpg',
  'Cleaning Brush/Cobweb Brush.jpg',
  'Cleaning Brush/Cobweb Brush (2).jpg',
  'Collage/Stainless Steel Push Dustbin.jpg',
  'Collage/Executive Push Dustbin With Handle.jpg',
  'Collage/Nova Floor Wiper.jpg',
  'Collage/Sumo Floor Wiper 21 Inch.jpg',
  'Brooms And Sticks/Kharata Broom Stick Plastic.jpg',
  'Brooms And Sticks/Kharata Broom Stick Plastic 1.jpg',
  'Safety Items/Red Orange Traffic Cone with White Reflective Collar Band 750mm.JPG',
  'Safety Items/Rubber Base Traffic Cone RBTC 750mm Height 2kg Red Standing View.jpeg',
  'Safety Items/Red and White Plastic Safety Warning Barrier Chain Coil.jpg',
  'Safety Items/Queue Manager Stainless Steel Retractable Belt Barrier Stanchions Pair with Red Belt.JPG',
  'Stationery/Light Blue Paper Envelopes Bundle with Brown Paper Band.jpg',
  'Room Spray/Godrej aer matic Automatic Spray Dispensers Cool Surf Blue Violet Bloom Petal Crush Pink with Boxes Trio.jpg',
  'Room Spray/Godrej aer matic Violet Valley Bloom Automatic Dispenser Refill Can and Box Set.jpg'
];

batch16.forEach(s => mappedSupplierSources.add(s.toLowerCase()));

const uncatalogued = validImages.filter(img => {
  const norm = img.rel.replace(/\\/g, '/').toLowerCase();
  return !mappedSupplierSources.has(norm);
});

console.log('Total valid images in archive:', validImages.length);
console.log('Total unique mapped supplier sources:', mappedSupplierSources.size);
console.log('Uncatalogued supplier images count:', uncatalogued.length);

const folderCounts = {};
uncatalogued.forEach(img => {
  const topFolder = img.rel.split(/[\\/]/)[0];
  folderCounts[topFolder] = (folderCounts[topFolder] || 0) + 1;
});

console.log('\nUncatalogued images by folder:');
console.table(folderCounts);

fs.writeFileSync('scripts/uncatalogued_images.json', JSON.stringify(uncatalogued, null, 2));
