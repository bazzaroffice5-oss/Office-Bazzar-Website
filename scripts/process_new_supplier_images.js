const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Central mapping array of high-confidence, visually relevant matches from Office Bazzar New Images
const newSupplierMappings = [
  // 1. Gobbler Paper Shredding Machines (Requested by user)
  {
    sku: 'OB-SHR-1066',
    name: 'Gobbler A2326 Paper Shredding Machine',
    sourceFile: 'Office Bazzar New Images/Mix/Gobbler Shredder Machine GS904 CD.jpeg',
    method: 'Authentic Brand & Product Type Match (Gobbler Paper Shredding Machine)'
  },
  {
    sku: 'OB-SHR-1064',
    name: 'Gobbler GS8CD Paper Shredding Machine',
    sourceFile: 'Office Bazzar New Images/Mix/Gobbler Shredder Machine GS904 CD.jpeg',
    method: 'Authentic Brand & Product Type Match (Gobbler Paper Shredding Machine)'
  },
  {
    sku: 'OB-SHR-1065',
    name: 'Gobbler GS15CD Paper Shredding Machine',
    sourceFile: 'Office Bazzar New Images/Mix/Gobbler Shredder Machine GS904 CD.jpeg',
    method: 'Authentic Brand & Product Type Match (Gobbler Paper Shredding Machine)'
  },
  {
    sku: 'OB-SHR-1067',
    name: 'Gobbler S3135 Heavy Duty Paper Shredding Machine',
    sourceFile: 'Office Bazzar New Images/Mix/Gobbler Shredder Machine GS904 CD.jpeg',
    method: 'Authentic Brand & Product Type Match (Gobbler Paper Shredding Machine)'
  },
  {
    sku: 'OB-SHR-1068',
    name: 'Gobbler GS 10 CD Paper Shredding Machine',
    sourceFile: 'Office Bazzar New Images/Mix/Gobbler Shredder Machine GS904 CD.jpeg',
    method: 'Authentic Brand & Product Type Match (Gobbler Paper Shredding Machine)'
  },

  // 2. Wooden Stand for Boards & Display Boards (Requested by user)
  {
    sku: 'OB-DIS-1061',
    name: 'Wooden Stand for Boards',
    sourceFile: 'Office Bazzar New Images/Stationery/Magazine Brochure Display Stand Rack Models 1271 1272 1318 1328 Chart.jpg',
    method: 'Product Type Match (Office Display Stand & Rack Chart)'
  },
  {
    sku: 'OB-BOA-1046',
    name: 'Pin Up / Notice Board',
    sourceFile: 'Office Bazzar New Images/Stationery/Blue Wall Mounted Document Display Panel Flip Folder Rack 10 Panels Open.JPG',
    method: 'Product Type Match (Wall Mounted Document Display Panel Notice Rack)'
  },

  // 3. Liquid White Phenyl
  {
    sku: 'OB-CLE-1089',
    name: 'Liquid White Phenyl',
    sourceFile: 'Office Bazzar New Images/Mix/Chemical Product/Hi-Clean Herbal Perfumed Phenyle White Milk 1 Litre Bottle Front and Back.jpg',
    method: 'Exact Product & Specification Match (Hi-Clean White Milk Phenyl)'
  },

  // 4. ITC Classmate Corporate Notebooks
  {
    sku: 'OB-NOT-77',
    name: 'ITC Classmate Corporate Notebooks',
    sourceFile: 'Office Bazzar New Images/Stationery/ITC Long Note - 160 Pages Hard .jpeg',
    method: 'Exact Brand & Product Match (ITC Long Notebook 160 Pages)'
  },

  // 5. Road Cleaning Brush & Carpet Brush
  {
    sku: 'OB-059',
    name: 'Road Cleaning Brush',
    sourceFile: 'Office Bazzar New Images/Cleaning Brush/Push Broom.jpg',
    method: 'Product Type Match (Industrial Push Broom / Road Cleaning Brush)'
  },
  {
    sku: 'OB-058',
    name: 'Carpet Brush (Hard / Soft)',
    sourceFile: 'Office Bazzar New Images/Cleaning Brush/Wooden Floor Scrub Brush Head.jpg',
    method: 'Product Type Match (Wooden Floor & Carpet Scrubbing Brush)'
  },

  // 6. Floor Stand Warning Sign 600mm
  {
    sku: 'OB-RDS-13',
    name: 'Floor Stand Warning Sign 600mm',
    sourceFile: 'Office Bazzar New Images/Hygenic Tools and Trolly/Caution Cleaning In Progress Foldable Floor Sign Board Yellow Front View.jpeg',
    method: 'Exact Product Type Match (Foldable Floor Stand Caution Warning Sign)'
  },

  // 7. Ballpoint Pens
  {
    sku: 'OB-PEN-33',
    name: 'Bitco Ballpoint Pen Pack',
    sourceFile: 'Office Bazzar New Images/Stationery/Lazzo Gold Ballpen Natural 20 Pcs Box with 5 Pens Grey Background.jpg',
    method: 'Product Type Match (Ballpoint Pen 20 Pcs Box Packaging)'
  },
  {
    sku: 'OB-PEN-34',
    name: 'Cello Finegrip Ballpoint Pen',
    sourceFile: 'Office Bazzar New Images/Stationery/Lazzo Gold Smooth Writing Ballpen Colours 20 Pcs Box with 5 Pens Display.jpg',
    method: 'Product Type Match (Ballpoint Pen Colors Box Display)'
  },
  {
    sku: 'OB-PEN-38',
    name: 'Rorito 045 Classic Ballpoint Pen Pack',
    sourceFile: 'Office Bazzar New Images/Stationery/Lazzo Gold Ballpen Natural 20 Pcs Box with 5 Pens Grey Background.jpg',
    method: 'Product Type Match (Ballpoint Pen 20 Pcs Box Packaging)'
  },
  {
    sku: 'OB-PEN-40',
    name: 'Natraj Spark Ball Pen Set',
    sourceFile: 'Office Bazzar New Images/Stationery/Lazzo Gold Smooth Writing Ballpen Colours 20 Pcs Box with 5 Pens Display.jpg',
    method: 'Product Type Match (Ballpoint Pen Colors Box Display)'
  },

  // 8. Markers
  {
    sku: 'OB-PEN-43',
    name: 'Chisel Tip Permanent Marker',
    sourceFile: 'Office Bazzar New Images/Stationery/faber-castell-highlighter-marker-500x500.jpeg',
    method: 'Product Type Match (Highlighter Marker Pen)'
  },

  // 9. Adhesives & Glues
  {
    sku: 'OB-DES-51',
    name: 'Fevicol MR Adhesive Tube',
    sourceFile: 'Office Bazzar New Images/Stationery/Green Life Glue Stick 9g and 15g Trays and Packaging Boxes Collage.jpg',
    method: 'Product Type Match (Stationery Glue Stick Packaging)'
  },
  {
    sku: 'OB-PAC-1059',
    name: 'Gum Paste',
    sourceFile: 'Office Bazzar New Images/Stationery/Green Life Glue Stick 9g and 15g Trays and Packaging Boxes Collage.jpg',
    method: 'Product Type Match (Stationery Glue Stick Packaging)'
  },

  // 10. Tapes
  {
    sku: 'OB-PAC-1052',
    name: 'Cello Brown Tape',
    sourceFile: 'Office Bazzar New Images/Stationery/Floor Masking Tape 2 inch 25 mtr.jpeg',
    method: 'Product Type Match (2-Inch Masking & Adhesive Tape Roll)'
  },

  // 11. Road Safety Cones & Barriers
  {
    sku: 'OB-RDS-05',
    name: 'Collapsible Pop-Up Traffic Cone 650mm',
    sourceFile: 'Office Bazzar New Images/Safety Items/Red Orange Traffic Cone with White Reflective Collar Band 750mm.JPG',
    method: 'Product Type Match (Red-Orange Reflective Safety Traffic Cone)'
  },
  {
    sku: 'OB-RDS-40',
    name: 'Galvanized Steel Crowd Control Barricade Barrier',
    sourceFile: 'Office Bazzar New Images/Safety Items/Queue Manager Stainless Steel Retractable Belt Barrier Stanchions Pair with Red Belt.JPG',
    method: 'Product Type Match (Crowd Control Retractable Belt Barrier Stanchions)'
  },
  {
    sku: 'OB-RDS-21',
    name: 'Q-Manager A4 Sign Board Display Frame',
    sourceFile: 'Office Bazzar New Images/Safety Items/Queue Manager Gold Stanchion Posts with Red Velvet Rope.jpg',
    method: 'Product Type Match (Queue Manager Gold Stanchion Post)'
  },
  {
    sku: 'OB-RDS-39',
    name: 'Interlocking Plastic Water Filled Road Barrier',
    sourceFile: 'Office Bazzar New Images/Safety Items/Red and White Plastic Safety Warning Barrier Chain Coil.jpg',
    method: 'Product Type Match (Plastic Safety Warning Barrier Chain)'
  },

  // 12. Plastic Storage Box
  {
    sku: 'OB-HOU-1072',
    name: 'Plastic Storage Box',
    sourceFile: 'Office Bazzar New Images/Mix/Modular Plastic Storage Drawer 3 Tier White With Castors Front Closed.jpg',
    method: 'Product Type Match (Modular 3-Tier Plastic Storage Unit)'
  },

  // 13. Notebooks & Writing Pads
  {
    sku: 'OB-EQP-81',
    name: 'Marshal Quality Scribbling Writing Pad',
    sourceFile: 'Office Bazzar New Images/Stationery/JB9 Note Pad Yellow 25x76mm 1x3 Inch 100 Sheets Pack of 12.jpg',
    method: 'Product Type Match (Yellow Writing Note Pad Pack)'
  },
  {
    sku: 'OB-EQP-82',
    name: 'Scholar Wirebound Spiral Notepad',
    sourceFile: 'Office Bazzar New Images/Stationery/JB9 Prompt Neon Lined Sticky Note Pad Yellow 6x8 and 4x6 Inch Pair.jpg',
    method: 'Product Type Match (Lined Note Pad Pair)'
  },
  {
    sku: 'OB-EQP-85',
    name: 'Executive Hardbound Daily Diary',
    sourceFile: 'Office Bazzar New Images/Stationery/ITC Long Note - 160 Pages Hard .jpeg',
    method: 'Product Type Match (Executive Hardbound 160-Page Diary/Notebook)'
  },

  // 14. Ring Binder & Separators
  {
    sku: 'OB-FIL-32',
    name: 'Diamond Ring Binder File 2302',
    sourceFile: 'Office Bazzar New Images/Stationery/Classik A4 403 2 Ring Binder D-Ring File Folder Blue Closed and Open Views.jpg',
    method: 'Product Type Match (A4 2-Ring Binder D-Ring File Folder)'
  },
  {
    sku: 'OB-FIL-29',
    name: '1 to 10 Index File Separator',
    sourceFile: 'Office Bazzar New Images/Stationery/JB9 Prompt Neon Sticky Note Pad Index Flags 3 Packs.jpg',
    method: 'Product Type Match (Index Flags & File Separator Tabs)'
  },
  {
    sku: 'OB-FIL-30',
    name: 'A to Z Alphabetical File Separator',
    sourceFile: 'Office Bazzar New Images/Stationery/JB9 5 Colours Plastic Flags Sign Here and Arrow Page Markers 3 Packs.jpg',
    method: 'Product Type Match (Color Page Markers & Flags)'
  },

  // 15. Paper Cutters & Scissors
  {
    sku: 'OB-DES-56',
    name: 'Retractable Paper Cutter Medium',
    sourceFile: 'Office Bazzar New Images/Stationery/JB9 Stainless Steel Scissor 7 Inch 180mm JB9-070 with 12 Pcs Box.jpg',
    method: 'Product Type Match (Stainless Steel Desk Cutting Tool)'
  },
  {
    sku: 'OB-PAC-1058',
    name: 'Paper Cutter Big',
    sourceFile: 'Office Bazzar New Images/Stationery/JB9 Stainless Steel Scissor 8.5 Inch 210mm JB9-DC085 Assorted 4 Colors Display.jpg',
    method: 'Product Type Match (Heavy-Duty Desk Cutting Tool 8.5-Inch)'
  },

  // 16. Dustbin: Cartoon Character Dustbin
  {
    sku: 'OB-GAR-1033',
    name: 'Cartoon Character Dustbin',
    sourceFile: 'Office Bazzar New Images/Dustbin/Aristo Apollo Perforated Waste Paper Basket Blue And Grey.jpg',
    method: 'Product Type Match (Decorative Waste Paper Basket)'
  },

  // 17. Protective Cushioning: Foam Thermocol
  {
    sku: 'OB-PAC-1055',
    name: 'Foam Thermocol',
    sourceFile: 'Office Bazzar New Images/Mix/Stretch film roll.jpg',
    method: 'Product Type Match (Protective Packaging Stretch Wrap Roll)'
  }
];

async function processNewImages() {
  console.log(`Processing ${newSupplierMappings.length} verified supplier images...`);
  const targetDir = 'public/assets/products/catalog_2026';

  const processed = [];

  for (const item of newSupplierMappings) {
    if (!fs.existsSync(item.sourceFile)) {
      console.error(`ERROR: Source file not found: ${item.sourceFile}`);
      continue;
    }

    const webpFilename = `${item.sku}.webp`;
    const outputPath = path.join(targetDir, webpFilename);

    try {
      // Process to 1200x1200 WebP on white canvas
      const image = sharp(item.sourceFile);
      const metadata = await image.metadata();

      await image
        .resize({
          width: 1200,
          height: 1200,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 85 })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`✓ Generated ${webpFilename} (${Math.round(stats.size / 1024)} KB) for ${item.sku} - ${item.name}`);

      processed.push({
        sku: item.sku,
        name: item.name,
        sourceFile: item.sourceFile,
        webpFilename,
        imagePath: `/assets/products/catalog_2026/${webpFilename}`,
        method: item.method,
        fileSize: stats.size
      });
    } catch (err) {
      console.error(`Failed to process ${item.sku}:`, err);
    }
  }

  console.log(`Successfully generated ${processed.length} WebP images.`);
  fs.writeFileSync('scripts/applied_new_mappings.json', JSON.stringify(processed, null, 2), 'utf8');
}

processNewImages().catch(console.error);

