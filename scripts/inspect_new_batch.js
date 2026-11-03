const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const files = [
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
  'Collage/Executive Push Dustbin With Handle.jpg'
];

async function check() {
  for (const f of files) {
    const fullPath = path.join('Office Bazzar New Images', f);
    if (!fs.existsSync(fullPath)) {
      console.log(`MISSING: ${fullPath}`);
      continue;
    }
    const meta = await sharp(fullPath).metadata();
    console.log(`OK: ${f} | ${meta.width}x${meta.height} | format: ${meta.format} | channels: ${meta.channels}`);
  }
}

check();
