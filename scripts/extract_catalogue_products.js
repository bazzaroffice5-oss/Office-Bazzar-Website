const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const { createCanvas } = require('@napi-rs/canvas');

const PDF_PATH = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1793451033088_4cd3125b.pdf';

// Ensure all target directories exist
const DIRS = [
  'public/assets/products/housekeeping',
  'public/assets/products/stationery',
  'public/assets/products/copier-papers',
  'public/assets/products/covid-products',
  'public/assets/products/road-safety',
  'public/assets/products/packaging-supplies',
  'public/assets/products/printers-technology',
];
DIRS.forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// All 328 products specification
const PRODUCTS_DATA = [
  // ==========================================
  // PAGE 3: HOUSEKEEPING PRODUCTS (OB-1 to OB-9)
  // ==========================================
  { page: 3, r: 0, c: 0, code: 'OB-001', name: 'SS Hand Dryer Machine', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 3, r: 0, c: 1, code: 'OB-002', name: 'ABS Hand Dryer Machine', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 3, r: 0, c: 2, code: 'OB-003', name: 'Shoe Cover Dispenser', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 3, r: 1, c: 0, code: 'OB-004', name: 'Paper Cup Dispenser', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 3, r: 1, c: 1, code: 'OB-005', name: 'Jet Hand Dryer', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 3, r: 1, c: 2, code: 'OB-006', name: 'Commercial Vacuum Cleaner', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 3, r: 2, c: 0, code: 'OB-007', name: 'Shoe Polish Machine', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 3, r: 2, c: 1, code: 'OB-008', name: 'Feather Duster', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 3, r: 2, c: 2, code: 'OB-009', name: 'Queue Manager', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 4: SOAP DISPENSER (OB-10 to OB-18)
  // ==========================================
  { page: 4, r: 0, c: 0, code: 'OB-010', name: 'SS Soap Dispenser (500ml/800ml/1000ml)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 4, r: 0, c: 1, code: 'OB-011', name: 'ABS Soap Dispenser 500ml', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 4, r: 0, c: 2, code: 'OB-012', name: 'ABS Soap Dispenser Curved', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 4, r: 1, c: 0, code: 'OB-013', name: 'ABS Soap Dispenser Single Clear', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 4, r: 1, c: 1, code: 'OB-014', name: 'ABS Soap Dispenser 250ml', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 4, r: 1, c: 2, code: 'OB-015', name: 'ABS Double Soap Dispenser Clear', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 4, r: 2, c: 0, code: 'OB-016', name: 'Double Soap Dispenser White', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 4, r: 2, c: 1, code: 'OB-017', name: 'Automatic Soap Dispenser', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 4, r: 2, c: 2, code: 'OB-018', name: 'Touch Free Soap Dispenser', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 5: TISSUE DISPENSER (OB-19 to OB-27)
  // ==========================================
  { page: 5, r: 0, c: 0, code: 'OB-019', name: 'SS C/M Fold Tissue Dispenser', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 5, r: 0, c: 1, code: 'OB-020', name: 'ABS Tissue Dispenser M-Fold', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 5, r: 0, c: 2, code: 'OB-021', name: 'SS Jumbo Roll Tissue Dispenser', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 5, r: 1, c: 0, code: 'OB-022', name: 'ABS Toilet Roll Dispenser', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 5, r: 1, c: 1, code: 'OB-023', name: 'SS Toilet Roll Dispenser', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 5, r: 1, c: 2, code: 'OB-024', name: 'Mini Toilet Roll Dispenser', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 5, r: 2, c: 0, code: 'OB-025', name: 'HRT Roll Dispenser Automatic', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 5, r: 2, c: 1, code: 'OB-026', name: 'HRT Roll Dispenser Autocut', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 5, r: 2, c: 2, code: 'OB-027', name: 'Kitchen Roll Dispenser', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 6: TISSUE PAPER PRODUCTS (OB-28 to OB-36)
  // ==========================================
  { page: 6, r: 0, c: 0, code: 'OB-028', name: 'Hi-Soft Tissue Roll', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Soft' },
  { page: 6, r: 0, c: 1, code: 'OB-029', name: 'Hi-Soft Tissue Napkin', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Soft' },
  { page: 6, r: 0, c: 2, code: 'OB-030', name: 'Premier Face Tissue', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Premier' },
  { page: 6, r: 1, c: 0, code: 'OB-031', name: 'C Fold Tissue', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 6, r: 1, c: 1, code: 'OB-032', name: 'M Fold Tissue', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 6, r: 1, c: 2, code: 'OB-033', name: 'HRT Tissue Roll', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 6, r: 2, c: 0, code: 'OB-034', name: 'Jumbo Tissue Roll', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 6, r: 2, c: 1, code: 'OB-035', name: 'Kitchen Tissue Roll', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 6, r: 2, c: 2, code: 'OB-036', name: 'Greenlime Tissue', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Greenlime' },

  // ==========================================
  // PAGE 7: DUSTER CLOTH PRODUCTS (OB-37 to OB-45)
  // ==========================================
  { page: 7, r: 0, c: 0, code: 'OB-037', name: 'Checked Cloth (Small / Big)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 7, r: 0, c: 1, code: 'OB-038', name: 'Glass Cloth', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 7, r: 0, c: 2, code: 'OB-039', name: 'Gada Cloth', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 7, r: 1, c: 0, code: 'OB-040', name: 'Yellow Cloth (Small / Big)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 7, r: 1, c: 1, code: 'OB-041', name: 'Micro Fiber Cloth (All Size)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 7, r: 1, c: 2, code: 'OB-042', name: 'Banian Cloth', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 7, r: 2, c: 0, code: 'OB-043', name: 'Banian Cloth White', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 7, r: 2, c: 1, code: 'OB-044', name: 'Blue Duster Cloth', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 7, r: 2, c: 2, code: 'OB-045', name: 'Cotton Towel (Small / Big)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 8: SCRUBBER PRODUCTS (OB-46 to OB-54)
  // ==========================================
  { page: 8, r: 0, c: 0, code: 'OB-046', name: 'Scrub Pad Green', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 8, r: 0, c: 1, code: 'OB-047', name: 'Scrub Pad with Sponge', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 8, r: 0, c: 2, code: 'OB-048', name: 'Nylon Scrubber', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 8, r: 1, c: 0, code: 'OB-049', name: 'Steel Scrubber', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 8, r: 1, c: 1, code: 'OB-050', name: 'Exo Round Bar', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Exo' },
  { page: 8, r: 1, c: 2, code: 'OB-051', name: 'Pril Dishwash Liquid', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Pril' },
  { page: 8, r: 2, c: 0, code: 'OB-052', name: 'Vim Dishwash Gel (250ml / 500ml / 1.8 Ltr)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Vim' },
  { page: 8, r: 2, c: 1, code: 'OB-053', name: 'Hi-Clean Dishwash Liquid', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },
  { page: 8, r: 2, c: 2, code: 'OB-054', name: 'Vim & Pril Dishwash Soap', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Vim' },

  // ==========================================
  // PAGE 9: CLEANING BRUSH PRODUCTS (OB-55 to OB-63)
  // ==========================================
  { page: 9, r: 0, c: 0, code: 'OB-055', name: 'Toilet Brush Double Hockey', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 9, r: 0, c: 1, code: 'OB-056', name: 'Toilet Brush Single Hockey', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 9, r: 0, c: 2, code: 'OB-057', name: 'Toilet Brush Round', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 9, r: 1, c: 0, code: 'OB-058', name: 'Carpet Brush (Hard / Soft)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 9, r: 1, c: 1, code: 'OB-059', name: 'Road Cleaning Brush', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 9, r: 1, c: 2, code: 'OB-060', name: 'Cloth Washing Brush', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 9, r: 2, c: 0, code: 'OB-061', name: 'Washbasin Brush', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 9, r: 2, c: 1, code: 'OB-062', name: 'Cobweb Stick Sunflower', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 9, r: 2, c: 2, code: 'OB-063', name: 'Dust Pan with Brush Set', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 10: DUSTBIN PRODUCTS (OB-64 to OB-72)
  // ==========================================
  { page: 10, r: 0, c: 0, code: 'OB-064', name: 'Plastic Dustbin Regular', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 10, r: 0, c: 1, code: 'OB-065', name: 'Pedal Plastic Dustbin', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 10, r: 0, c: 2, code: 'OB-066', name: 'Swing Plastic Dustbin', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 10, r: 1, c: 0, code: 'OB-067', name: 'Single Mop Wringer Bucket', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 10, r: 1, c: 1, code: 'OB-068', name: 'Metal Wire Mesh Dustbin', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 10, r: 1, c: 2, code: 'OB-069', name: 'Stainless Steel Pedal Dustbin', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 10, r: 2, c: 0, code: 'OB-070', name: 'SS Perforated Dustbin', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 10, r: 2, c: 1, code: 'OB-071', name: 'SS Push Can Dustbin', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 10, r: 2, c: 2, code: 'OB-072', name: 'SS Swing Dustbin', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 11: FLOOR MOPS & WIPERS (OB-73 to OB-81)
  // ==========================================
  { page: 11, r: 0, c: 0, code: 'OB-073', name: 'Commercial Glass Wiper', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 11, r: 0, c: 1, code: 'OB-074', name: 'Glass Combi Wiper with Sponge', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 11, r: 0, c: 2, code: 'OB-075', name: 'Kitchen Counter Wiper', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 11, r: 1, c: 0, code: 'OB-076', name: 'Versa Wiper', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 11, r: 1, c: 1, code: 'OB-077', name: 'Floor Wiper with Long Stick', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 11, r: 1, c: 2, code: 'OB-078', name: 'Table Top Wiper', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 11, r: 2, c: 0, code: 'OB-079', name: 'Toilet Sink Plunger', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 11, r: 2, c: 1, code: 'OB-080', name: 'Clip Mop Head Colour Coded', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 11, r: 2, c: 2, code: 'OB-081', name: 'Cob Web Brush Curved', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 12: MOP PRODUCTS (OB-82 to OB-90)
  // ==========================================
  { page: 12, r: 0, c: 0, code: 'OB-082', name: 'Dry Mop Set with Refill', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 12, r: 0, c: 1, code: 'OB-083', name: 'Heavy Duty Mop Stick Handle', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 12, r: 0, c: 2, code: 'OB-084', name: 'Twist Floor Mop', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 12, r: 1, c: 0, code: 'OB-085', name: 'Clip & Fit Wet Mop Refill', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 12, r: 1, c: 1, code: 'OB-086', name: 'Rubber Welcome Mat', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 12, r: 1, c: 2, code: 'OB-087', name: 'Cotton Door Mat', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 12, r: 2, c: 0, code: 'OB-088', name: 'Plastic Bucket and Mug Set', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 12, r: 2, c: 1, code: 'OB-089', name: 'Plastic Handheld Dustpan', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 12, r: 2, c: 2, code: 'OB-090', name: 'Round Cotton Floor Mop', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 13: AIR FRESHENER (OB-91 to OB-99)
  // ==========================================
  { page: 13, r: 0, c: 0, code: 'OB-091', name: 'Magiccode Room Freshener Spray', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Magiccode' },
  { page: 13, r: 0, c: 1, code: 'OB-092', name: 'Godrej aer Room Freshener Spray', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Godrej aer' },
  { page: 13, r: 0, c: 2, code: 'OB-093', name: 'Premium Room Freshener Aerosol', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 13, r: 1, c: 0, code: 'OB-094', name: 'Odonil Room Air Freshener Spray', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Odonil' },
  { page: 13, r: 1, c: 1, code: 'OB-095', name: 'Airwick Room Freshener Spray', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Airwick' },
  { page: 13, r: 1, c: 2, code: 'OB-096', name: 'Ambi Pur Air Freshener Spray', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Ambi Pur' },
  { page: 13, r: 2, c: 0, code: 'OB-097', name: 'Automatic Air Freshener Dispenser Refill', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 13, r: 2, c: 1, code: 'OB-098', name: 'Hi-Clean Air Freshener Liquid (5 Litre)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },
  { page: 13, r: 2, c: 2, code: 'OB-099', name: 'Godrej aer Pocket Bathroom Freshener', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Godrej aer' },

  // ==========================================
  // PAGE 14: HOUSEKEEPING PRODUCTS (OB-100 to OB-108)
  // ==========================================
  { page: 14, r: 0, c: 0, code: 'OB-100', name: 'Telescopic Aluminum Extension Pole', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 14, r: 0, c: 1, code: 'OB-101', name: 'Caution Wet Floor Sign Board', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 14, r: 0, c: 2, code: 'OB-102', name: 'Cleaning Caddy Basket Organizer', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 14, r: 1, c: 0, code: 'OB-103', name: 'Professional Glass Cleaning Kit Box', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 14, r: 1, c: 1, code: 'OB-104', name: 'Commercial Insect Killer Fly Catcher Machine', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 14, r: 1, c: 2, code: 'OB-105', name: 'ABS Wall Mounted Broom Mop Holder', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 14, r: 2, c: 0, code: 'OB-106', name: 'Upright Lobby Dustpan with Broom', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 14, r: 2, c: 1, code: 'OB-107', name: 'Floor and Glass Scraper Tool', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 14, r: 2, c: 2, code: 'OB-108', name: 'Chemical Trigger Spray Bottle', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 15: HOUSEKEEPING PRODUCTS (OB-109 to OB-117)
  // ==========================================
  { page: 15, r: 0, c: 0, code: 'OB-109', name: 'Goodknight Mosquito Repellent Machine Set', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Goodknight' },
  { page: 15, r: 0, c: 1, code: 'OB-110', name: 'HIT Cockroach Insect Spray', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'HIT' },
  { page: 15, r: 0, c: 2, code: 'OB-111', name: 'Caustic Soda Flakes', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 15, r: 1, c: 0, code: 'OB-112', name: 'PVC Hard Broom', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 15, r: 1, c: 1, code: 'OB-113', name: 'Hard Broom Stick (Big / Small)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 15, r: 1, c: 2, code: 'OB-114', name: 'All Out Mosquito Repellent Machine Set', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'All Out' },
  { page: 15, r: 2, c: 0, code: 'OB-115', name: 'Grass Soft Broom (Big / Small)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 15, r: 2, c: 1, code: 'OB-116', name: 'Steel Handle Broom', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 15, r: 2, c: 2, code: 'OB-117', name: 'Gala No Dust Broom', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Gala' },

  // ==========================================
  // PAGE 16: HICLEAN HYGENIC PRODUCTS (OB-118 to OB-126)
  // ==========================================
  { page: 16, r: 0, c: 0, code: 'OB-118', name: 'Hi-Clean Floor Cleaner (500ml / 5L)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },
  { page: 16, r: 0, c: 1, code: 'OB-119', name: 'Hi-Clean Liquid Soap (1L / 5L)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },
  { page: 16, r: 0, c: 2, code: 'OB-120', name: 'Hi-Clean Toilet Cleaner (500ml / 5L)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },
  { page: 16, r: 1, c: 0, code: 'OB-121', name: 'Hi-Clean Perfumed Phenyl (Multicolor)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },
  { page: 16, r: 1, c: 1, code: 'OB-122', name: 'Hi-Clean Glass Cleaner (500ml / 5L)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },
  { page: 16, r: 1, c: 2, code: 'OB-123', name: 'Hi-Clean Black Disinfectant Concentrate Phenyl', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },
  { page: 16, r: 2, c: 0, code: 'OB-124', name: 'Hi-Clean Hand Wash (250ml / 500ml / 5L)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },
  { page: 16, r: 2, c: 1, code: 'OB-125', name: 'Hi-Clean Bathroom Cleaner (500ml)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },
  { page: 16, r: 2, c: 2, code: 'OB-126', name: 'Sodium Hypochlorite Disinfectant Solution (5L)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },

  // ==========================================
  // PAGE 17: HOUSEKEEPING PRODUCTS (OB-127 to OB-135)
  // ==========================================
  { page: 17, r: 0, c: 0, code: 'OB-127', name: 'Dettol Antiseptic Disinfectant Liquid', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Dettol' },
  { page: 17, r: 0, c: 1, code: 'OB-128', name: 'Lifebuoy Antibacterial Handwash', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Lifebuoy' },
  { page: 17, r: 0, c: 2, code: 'OB-129', name: 'Cleaning Thinner NC Thinner', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 17, r: 1, c: 0, code: 'OB-130', name: 'Urinal Screen Anti-Splash Mats', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 17, r: 1, c: 1, code: 'OB-131', name: 'Disposable Heavy Garbage Bags (All Sizes)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 17, r: 1, c: 2, code: 'OB-132', name: 'Industrial Rubber Anti-Fatigue Mat Roll', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 17, r: 2, c: 0, code: 'OB-133', name: 'Heavy Duty Rubber Cleaning Hand Gloves', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 17, r: 2, c: 1, code: 'OB-134', name: 'Cotton Knitted Safety Hand Gloves', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 17, r: 2, c: 2, code: 'OB-135', name: 'Pure White Naphthalene Balls', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 18: TROLLEYS & BUCKETS (OB-136 to OB-144)
  // ==========================================
  { page: 18, r: 0, c: 0, code: 'OB-136', name: 'Wringer Trolley Single Bucket', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 18, r: 0, c: 1, code: 'OB-137', name: 'Wringer Trolley Double Bucket', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 18, r: 0, c: 2, code: 'OB-138', name: 'Wringer Trolley Triple Bucket', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 18, r: 1, c: 0, code: 'OB-139', name: 'Handheld Shopping Basket Trolley', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 18, r: 1, c: 1, code: 'OB-140', name: 'Metal Supermarket Shopping Cart Trolley', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 18, r: 1, c: 2, code: 'OB-141', name: 'Industrial Heavy Duty Platform Trolley', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'Yogo' },
  { page: 18, r: 2, c: 0, code: 'OB-142', name: 'Janitor Cleaning Service Trolley Cart', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 18, r: 2, c: 1, code: 'OB-143', name: 'Multipurpose Wringer Janitor Trolley', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 18, r: 2, c: 2, code: 'OB-144', name: 'Double Bucket Wringer Trolley Black', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 19: DUSTBINS (OB-145 to OB-153)
  // ==========================================
  { page: 19, r: 0, c: 0, code: 'OB-145', name: 'Bio Medical Waste Segregation Dustbins Set', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 19, r: 0, c: 1, code: 'OB-146', name: 'Duo Wet & Dry Plastic Dustbin', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Kleend' },
  { page: 19, r: 0, c: 2, code: 'OB-147', name: 'SS Duo Waste Recycling Dustbin', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Clean-In' },
  { page: 19, r: 1, c: 0, code: 'OB-148', name: 'SS Trio Waste Recycling Dustbin', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Clean-In' },
  { page: 19, r: 1, c: 1, code: 'OB-149', name: 'FRP Duo Outdoor Waste Bins', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 19, r: 1, c: 2, code: 'OB-150', name: 'FRP Trio Segregation Waste Bins', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 19, r: 2, c: 0, code: 'OB-151', name: 'Wheeled Dustbin 120 Litre Green', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Aristo' },
  { page: 19, r: 2, c: 1, code: 'OB-152', name: 'Heavy Duty Wheeled Dustbin 660 Litre', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Aristo' },
  { page: 19, r: 2, c: 2, code: 'OB-153', name: 'Industrial Plastic Storage Drum Barrel (All Sizes)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 20: TASKI DIVERSEY CHEMICALS (OB-154 to OB-162)
  // ==========================================
  { page: 20, r: 0, c: 0, code: 'OB-154', name: 'Diversey Taski R1 Super (Bathroom Cleaner)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Diversey Taski' },
  { page: 20, r: 0, c: 1, code: 'OB-155', name: 'Diversey Taski R2 (Hygienic Hard Surface Cleaner)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Diversey Taski' },
  { page: 20, r: 0, c: 2, code: 'OB-203', name: 'Diversey Taski R3 (Glass Cleaner Concentrate)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Diversey Taski' },
  { page: 20, r: 1, c: 0, code: 'OB-157', name: 'Diversey Taski R4 (Wood Furniture Polish)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Diversey Taski' },
  { page: 20, r: 1, c: 1, code: 'OB-158', name: 'Diversey Taski R5 (Air Freshener Concentrate)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Diversey Taski' },
  { page: 20, r: 1, c: 2, code: 'OB-159', name: 'Diversey Taski R6 (Toilet Bowl Cleaner)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Diversey Taski' },
  { page: 20, r: 2, c: 0, code: 'OB-160', name: 'Diversey Taski R7 (Floor Cleaner Concentrate)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Diversey Taski' },
  { page: 20, r: 2, c: 1, code: 'OB-161', name: 'Diversey Taski R9 (Hard Water Limescale Cleaner)', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Diversey Taski' },
  { page: 20, r: 2, c: 2, code: 'OB-162', name: 'Diversey Suma Inox D7.1 Stainless Steel Polish', dir: 'housekeeping', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Diversey' },

  // ==========================================
  // PAGE 22: COPIER PAPERS (OB-PAP-01 to OB-PAP-16)
  // ==========================================
  { page: 22, r: 0, c: 0, code: 'OB-PAP-01', name: 'JK Max Copier Paper 67 GSM A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'JK Paper' },
  { page: 22, r: 0, c: 1, code: 'OB-PAP-02', name: 'JK CMax Copier Paper 72 GSM A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'JK Paper' },
  { page: 22, r: 0, c: 2, code: 'OB-PAP-03', name: 'JK Easy Copier Paper 70 GSM A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'JK Paper' },
  { page: 22, r: 0, c: 3, code: 'OB-PAP-04', name: 'JK Copier Paper 75 GSM A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'JK Paper' },
  { page: 22, r: 1, c: 0, code: 'OB-PAP-05', name: 'JK Excel Bond Paper (70/80/90/100 GSM) A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'JK Paper' },
  { page: 22, r: 1, c: 1, code: 'OB-PAP-06', name: 'JK Cedar Copier Paper (80/100 GSM) A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'JK Paper' },
  { page: 22, r: 1, c: 2, code: 'OB-PAP-07', name: 'JK Sparkle Multipurpose Paper (70/75/80 GSM) A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'JK Paper' },
  { page: 22, r: 1, c: 3, code: 'OB-PAP-08', name: 'JK Eco Rise Copier Paper 70 GSM A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'JK Paper' },
  { page: 22, r: 2, c: 0, code: 'OB-PAP-09', name: 'TNPL Copier Paper 70 GSM A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'TNPL' },
  { page: 22, r: 2, c: 1, code: 'OB-PAP-10', name: 'TNPL Platinum Copier Paper 75 GSM A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'TNPL' },
  { page: 22, r: 2, c: 2, code: 'OB-PAP-11', name: 'TNPL Copier Paper 80 GSM A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'TNPL' },
  { page: 22, r: 2, c: 3, code: 'OB-PAP-12', name: 'JK Max Copier Paper 67 GSM A4 (Ekent Pack)', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'JK Paper' },
  { page: 22, r: 3, c: 0, code: 'OB-PAP-13', name: 'Koopee Premium Glossy Photo Paper A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'Koopee' },
  { page: 22, r: 3, c: 1, code: 'OB-PAP-14', name: 'Royal Executive Bond Paper A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'Royal' },
  { page: 22, r: 3, c: 2, code: 'OB-PAP-15', name: 'Compu Color A4 Color Paper 200 GSM', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'Compu' },
  { page: 22, r: 3, c: 3, code: 'OB-PAP-16', name: 'NovaJet Inkjet True Picture Paper A4', dir: 'copier-papers', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'NovaJet' },

  // ==========================================
  // PAGE 23: FILES AND FOLDERS (OB-FIL-17 to OB-FIL-32)
  // ==========================================
  { page: 23, r: 0, c: 0, code: 'OB-FIL-17', name: 'A4 Transparent Report File', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 0, c: 1, code: 'OB-FIL-18', name: 'F/S Expanding File Folder Case', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 0, c: 2, code: 'OB-FIL-19', name: 'A4 Sheet Protector Clear Sheet', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 0, c: 3, code: 'OB-FIL-20', name: 'A4 Plastic Stick File', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 1, c: 0, code: 'OB-FIL-21', name: 'A4 Button Folder Document Bag', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 1, c: 1, code: 'OB-FIL-22', name: 'LM Plastic Folder Assorted Colours', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 1, c: 2, code: 'OB-FIL-23', name: 'Office Document Tag File', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 1, c: 3, code: 'OB-FIL-24', name: 'Spring File Plastic Body', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 2, c: 0, code: 'OB-FIL-25', name: 'Classic Cardboard Spring File', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 2, c: 1, code: 'OB-FIL-26', name: 'OfficeBazzar Box File', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 2, c: 2, code: 'OB-FIL-27', name: 'OfficeBazzar Accounts Voucher File', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 2, c: 3, code: 'OB-FIL-28', name: 'Ordinary Urgent Document File', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 3, c: 0, code: 'OB-FIL-29', name: '1 to 10 Index File Separator', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 3, c: 1, code: 'OB-FIL-30', name: 'A to Z Alphabetical File Separator', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 3, c: 2, code: 'OB-FIL-31', name: '2-D Ring Binder File 1501', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 23, r: 3, c: 3, code: 'OB-FIL-32', name: 'Diamond Ring Binder File 2302', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'Diamond' },

  // ==========================================
  // PAGE 24: PENS AND MARKERS (OB-PEN-33 to OB-PEN-48)
  // ==========================================
  { page: 24, r: 0, c: 0, code: 'OB-PEN-33', name: 'Bitco Ballpoint Pen Pack', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Bitco' },
  { page: 24, r: 0, c: 1, code: 'OB-PEN-34', name: 'Cello Finegrip Ballpoint Pen', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Cello' },
  { page: 24, r: 0, c: 2, code: 'OB-PEN-35', name: 'Montex Ballpoint Pen', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Montex' },
  { page: 24, r: 0, c: 3, code: 'OB-PEN-36', name: 'Add Gel Achiever Pen', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Add Gel' },
  { page: 24, r: 1, c: 0, code: 'OB-PEN-37', name: 'Pilot V5/V7 Liquid Ink Rollerball Pen', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Pilot' },
  { page: 24, r: 1, c: 1, code: 'OB-PEN-38', name: 'Rorito 045 Classic Ballpoint Pen Pack', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Rorito' },
  { page: 24, r: 1, c: 2, code: 'OB-PEN-39', name: 'Rorito Flymax Gel Pen', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Rorito' },
  { page: 24, r: 1, c: 3, code: 'OB-PEN-40', name: 'Natraj Spark Ball Pen Set', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Natraj' },
  { page: 24, r: 2, c: 0, code: 'OB-PEN-41', name: 'OHP CD/DVD Permanent Marker', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'OfficeBazzar' },
  { page: 24, r: 2, c: 1, code: 'OB-PEN-42', name: 'Fluorescent Highlighter Marker Pack', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Cello' },
  { page: 24, r: 2, c: 2, code: 'OB-PEN-43', name: 'Chisel Tip Permanent Marker', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'OfficeBazzar' },
  { page: 24, r: 2, c: 3, code: 'OB-PEN-44', name: 'Dry Erase Whiteboard Marker', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'OfficeBazzar' },
  { page: 24, r: 3, c: 0, code: 'OB-PEN-45', name: 'Luxor Color Sketch Pen Pack', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Luxor' },
  { page: 24, r: 3, c: 1, code: 'OB-PEN-46', name: 'Nataraj HB Wooden Pencils Pack', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Nataraj' },
  { page: 24, r: 3, c: 2, code: 'OB-PEN-47', name: 'Apsara Dust Free / Nataraj Plasto Eraser Pack', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Apsara' },
  { page: 24, r: 3, c: 3, code: 'OB-PEN-48', name: 'Desk Pencil Sharpener Pack', dir: 'stationery', cat: 'office-stationery', sub: 'writing-instruments', brand: 'Nataraj' },

  // ==========================================
  // PAGE 25: STATIONERY & ADHESIVES (OB-DES-49 to OB-DES-64)
  // ==========================================
  { page: 25, r: 0, c: 0, code: 'OB-DES-49', name: 'Fevistik Glue Stick Big', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'Pidilite Fevikwik' },
  { page: 25, r: 0, c: 1, code: 'OB-DES-50', name: 'Office Paper Gum Paste Bottle', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 25, r: 0, c: 2, code: 'OB-DES-51', name: 'Fevicol MR Adhesive Tube', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'Fevicol' },
  { page: 25, r: 0, c: 3, code: 'OB-DES-52', name: 'Double Sided Foam Tape 1 inch', dir: 'packaging-supplies', cat: 'packaging-supplies', sub: 'packaging-dispatch', brand: 'OfficeBazzar' },
  { page: 25, r: 1, c: 0, code: 'OB-DES-53', name: 'Double Sided Transparent Tissue Tape', dir: 'packaging-supplies', cat: 'packaging-supplies', sub: 'packaging-dispatch', brand: 'OfficeBazzar' },
  { page: 25, r: 1, c: 1, code: 'OB-DES-54', name: 'BOPP Packaging Tape Brown/Cello (1/2/3 inch)', dir: 'packaging-supplies', cat: 'packaging-supplies', sub: 'packaging-dispatch', brand: 'OfficeBazzar' },
  { page: 25, r: 1, c: 2, code: 'OB-DES-55', name: 'Heavy Duty Tape Dispenser (1 inch / 2 inch)', dir: 'packaging-supplies', cat: 'packaging-supplies', sub: 'packaging-dispatch', brand: 'OfficeBazzar' },
  { page: 25, r: 1, c: 3, code: 'OB-DES-56', name: 'Retractable Paper Cutter Medium', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 25, r: 2, c: 0, code: 'OB-DES-57', name: 'Box Packaging Strapping Roll', dir: 'packaging-supplies', cat: 'packaging-supplies', sub: 'packaging-dispatch', brand: 'OfficeBazzar' },
  { page: 25, r: 2, c: 1, code: 'OB-DES-58', name: 'Protective Bubble Wrap Roll', dir: 'packaging-supplies', cat: 'packaging-supplies', sub: 'packaging-dispatch', brand: 'OfficeBazzar' },
  { page: 25, r: 2, c: 2, code: 'OB-DES-59', name: 'Desk Stapler Machine (No. 10 / 24/6)', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'Kangaro' },
  { page: 25, r: 2, c: 3, code: 'OB-DES-60', name: 'Stapler Pins Pack (No. 10 / 24/6)', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'Kangaro' },
  { page: 25, r: 3, c: 0, code: 'OB-DES-61', name: 'Two Hole Paper Punching Machine', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'Kangaro' },
  { page: 25, r: 3, c: 1, code: 'OB-DES-62', name: 'Faber-Castell Office Stamp Pad', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'Faber-Castell' },
  { page: 25, r: 3, c: 2, code: 'OB-DES-63', name: 'Stamp Pad Ink Bottle', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 25, r: 3, c: 3, code: 'OB-DES-64', name: 'Stainless Steel Office Scissors (All Sizes)', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 26: CLIPS, ENVELOPES & NOTE BOOKS (OB-NOT-65 to OB-NOT-80)
  // ==========================================
  { page: 26, r: 0, c: 0, code: 'OB-NOT-65', name: 'Color Plastic Paper Clips Pack', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 26, r: 0, c: 1, code: 'OB-NOT-66', name: 'Metal Binder Clips (All Sizes)', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 26, r: 0, c: 2, code: 'OB-NOT-67', name: 'Metal Notice Board Push Pins', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 26, r: 0, c: 3, code: 'OB-NOT-68', name: 'Steel Wire Gem Clips Pack', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 26, r: 1, c: 0, code: 'OB-NOT-69', name: 'Kores Sapphire Carbon Paper Pack', dir: 'stationery', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'Kores' },
  { page: 26, r: 1, c: 1, code: 'OB-NOT-70', name: 'Nylon Rubber Bands Pack', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 26, r: 1, c: 2, code: 'OB-NOT-71', name: 'Post-it Self Adhesive Sticky Notes Pad', dir: 'stationery', cat: 'office-stationery', sub: 'paper-notebooks', brand: '3M Post-it' },
  { page: 26, r: 1, c: 3, code: 'OB-NOT-72', name: 'Office Steel Paper Pins Box', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 26, r: 2, c: 0, code: 'OB-NOT-73', name: 'Casio Electronic Desk Calculator', dir: 'printers-technology', cat: 'printers-technology', sub: 'printing-it-supplies', brand: 'Casio' },
  { page: 26, r: 2, c: 1, code: 'OB-NOT-74', name: 'Document Paper Tray Tier Set (2/3/4 Tier)', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 26, r: 2, c: 2, code: 'OB-NOT-75', name: 'Stainless Steel Measuring Scale Ruler', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 26, r: 2, c: 3, code: 'OB-NOT-76', name: 'Office Hardbound Note Book', dir: 'stationery', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'OfficeBazzar' },
  { page: 26, r: 3, c: 0, code: 'OB-NOT-77', name: 'ITC Classmate Corporate Notebooks', dir: 'stationery', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'ITC Classmate' },
  { page: 26, r: 3, c: 1, code: 'OB-NOT-78', name: 'White Mailing Envelopes Pack', dir: 'stationery', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'OfficeBazzar' },
  { page: 26, r: 3, c: 2, code: 'OB-NOT-79', name: 'Brown Kraft Paper Envelopes Pack', dir: 'stationery', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'OfficeBazzar' },
  { page: 26, r: 3, c: 3, code: 'OB-NOT-80', name: 'Cloth Lined Courier Security Envelope', dir: 'stationery', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 27: REGISTERS & OFFICE TECH (OB-EQP-81 to OB-EQP-89)
  // ==========================================
  { page: 27, r: 0, c: 0, code: 'OB-EQP-81', name: 'Marshal Quality Scribbling Writing Pad', dir: 'stationery', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'Marshal' },
  { page: 27, r: 0, c: 1, code: 'OB-EQP-82', name: 'Scholar Wirebound Spiral Notepad', dir: 'stationery', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'Scholar' },
  { page: 27, r: 0, c: 2, code: 'OB-EQP-83', name: 'Corporate Accounts Entry Register', dir: 'stationery', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'OfficeBazzar' },
  { page: 27, r: 1, c: 0, code: 'OB-EQP-84', name: 'Desk Visiting Card Holder Book', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 27, r: 1, c: 1, code: 'OB-EQP-85', name: 'Executive Hardbound Daily Diary', dir: 'stationery', cat: 'office-stationery', sub: 'paper-notebooks', brand: 'OfficeBazzar' },
  { page: 27, r: 1, c: 2, code: 'OB-EQP-86', name: 'Heavy Duty Cross Cut Paper Shredder', dir: 'printers-technology', cat: 'printers-technology', sub: 'printing-it-supplies', brand: 'OfficeBazzar' },
  { page: 27, r: 2, c: 0, code: 'OB-EQP-87', name: 'High Definition Conference Projector', dir: 'printers-technology', cat: 'printers-technology', sub: 'printing-it-supplies', brand: 'OfficeBazzar' },
  { page: 27, r: 2, c: 1, code: 'OB-EQP-88', name: 'Magnetic Notice Display Folder Frame', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },
  { page: 27, r: 2, c: 2, code: 'OB-EQP-89', name: 'Acrylic ID Card Badge Holder with Lanyard', dir: 'stationery', cat: 'office-stationery', sub: 'files-office-organization', brand: 'OfficeBazzar' },

  // ==========================================
  // PAGE 28: COVID 19 PRODUCTS (OB-COV-01 to OB-COV-16)
  // ==========================================
  { page: 28, r: 0, c: 0, code: 'OB-COV-01', name: '3-Ply Surgical Disposable Face Mask', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 28, r: 0, c: 1, code: 'OB-COV-02', name: 'Venus V4400 N95 Protective Respirator Mask', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Venus' },
  { page: 28, r: 0, c: 2, code: 'OB-COV-03', name: 'Reusable Washable Cotton Face Mask', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 28, r: 0, c: 3, code: 'OB-COV-04', name: 'Medi Dispo N95 Protective Face Mask', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Medi Dispo' },
  { page: 28, r: 1, c: 0, code: 'OB-COV-05', name: 'Yellow Disposable Protective Mask', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 28, r: 1, c: 1, code: 'OB-COV-06', name: 'Cotton Knitted Safety Gloves Pack', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 28, r: 1, c: 2, code: 'OB-COV-07', name: 'Rubber Industrial Safety Gloves', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 28, r: 1, c: 3, code: 'OB-COV-08', name: 'Hi-Safe Powder Free Latex Gloves Box', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'Hi-Safe' },
  { page: 28, r: 2, c: 0, code: 'OB-COV-09', name: 'Hi-Safe Medical Grade Nitrile Gloves Box', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'Hi-Safe' },
  { page: 28, r: 2, c: 1, code: 'OB-COV-10', name: 'Full Body Coverall PPE Safety Kit', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 28, r: 2, c: 2, code: 'OB-COV-11', name: 'Pristin Instant Hand Sanitizer (Pump / 5L)', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Pristin' },
  { page: 28, r: 2, c: 3, code: 'OB-COV-12', name: 'Digital Fingertip Pulse Oximeter', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'Jziki' },
  { page: 28, r: 3, c: 0, code: 'OB-COV-13', name: 'Lifebuoy Alcohol Based Hand Sanitizer (500ml / 5L)', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Lifebuoy' },
  { page: 28, r: 3, c: 1, code: 'OB-COV-14', name: 'Lifebuoy Germ Protection Liquid Hand Wash', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Lifebuoy' },
  { page: 28, r: 3, c: 2, code: 'OB-COV-15', name: 'Viroff Alcohol Hand Sanitizer (5L)', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Viroff' },
  { page: 28, r: 3, c: 3, code: 'OB-COV-16', name: 'Hi-Clean Antibacterial Hand Wash (5L)', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },

  // ==========================================
  // PAGE 29: COVID 19 PRODUCTS (OB-COV-17 to OB-COV-32)
  // ==========================================
  { page: 29, r: 0, c: 0, code: 'OB-COV-17', name: 'Strerill G Hand Sanitizer (500ml / 5L)', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Sterill G' },
  { page: 29, r: 0, c: 1, code: 'OB-COV-18', name: 'Hi-Clean Hand Cleansing Liquid Soap (5L)', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Hi-Clean' },
  { page: 29, r: 0, c: 2, code: 'OB-COV-19', name: 'Medical Oxygen Concentrator Machine', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 29, r: 0, c: 3, code: 'OB-COV-20', name: 'Automatic Touchless Soap Sanitizer Dispenser', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'OfficeBazzar' },
  { page: 29, r: 1, c: 0, code: 'OB-COV-21', name: 'Foot Pedal Operated Sanitizer Stand', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 29, r: 1, c: 1, code: 'OB-COV-22', name: 'Disposable Non-Woven Bouffant Head Caps Pack', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 29, r: 1, c: 2, code: 'OB-COV-23', name: 'Disposable Non-Woven Shoe Covers Pack', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 29, r: 1, c: 3, code: 'OB-COV-24', name: 'Automatic Shoe Cover Dispenser Machine', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 29, r: 2, c: 0, code: 'OB-COV-25', name: 'Contactless Infrared Forehead Thermometer', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 29, r: 2, c: 1, code: 'OB-COV-26', name: 'Social Distancing Queue Barrier Stanchion', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 29, r: 2, c: 2, code: 'OB-COV-27', name: 'Reflective Safety Traffic Cone', dir: 'covid-products', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 29, r: 2, c: 3, code: 'OB-COV-28', name: 'Wet Floor Caution Warning Board', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 29, r: 3, c: 0, code: 'OB-COV-29', name: 'Yellow & Black Floor Marking Caution Tape', dir: 'packaging-supplies', cat: 'packaging-supplies', sub: 'packaging-dispatch', brand: 'OfficeBazzar' },
  { page: 29, r: 3, c: 1, code: 'OB-COV-30', name: 'Manual Pressure Sanitizer Sprayer 2 Litre', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'KisanKraft' },
  { page: 29, r: 3, c: 2, code: 'OB-COV-31', name: 'Garden Sanitizer Pressure Sprayer 5 Litre', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'KisanKraft' },
  { page: 29, r: 3, c: 3, code: 'OB-COV-32', name: 'Backpack Knapsack Sanitizer Sprayer 18 Litre', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'KisanKraft' },

  // ==========================================
  // PAGE 30: COVID 19 PRODUCTS (OB-COV-33 to OB-COV-34)
  // ==========================================
  { page: 30, r: 0, c: 0, code: 'OB-COV-33', name: 'Full Protective Face Shield Mask', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'safety-maintenance', brand: 'OfficeBazzar' },
  { page: 30, r: 0, c: 1, code: 'OB-COV-34', name: 'Dettol Original Antiseptic Liquid (5 Litre)', dir: 'covid-products', cat: 'housekeeping-hygiene', sub: 'cleaning-hygiene-essentials', brand: 'Dettol' },

  // ==========================================
  // PAGE 32: ROAD SAFETY PRODUCTS (OB-RDS-01 to OB-RDS-12)
  // ==========================================
  { page: 32, r: 0, c: 0, code: 'OB-RDS-01', name: 'Flexible Traffic Cone 750mm', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Height: 750mm, Weight: 3kg' },
  { page: 32, r: 0, c: 1, code: 'OB-RDS-02', name: 'Hexagonal Traffic Cone (750mm / 1000mm)', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Height: 1000mm / 750mm' },
  { page: 32, r: 0, c: 2, code: 'OB-RDS-03', name: 'Traffic Cone with Rubberized Plastic Base', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Inbuilt rubber, Height: 750mm, Weight: 4.7kg' },
  { page: 32, r: 1, c: 0, code: 'OB-RDS-04', name: 'Economical Traffic Cone and Chain Set', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'H: 1000mm / 750mm' },
  { page: 32, r: 1, c: 1, code: 'OB-RDS-05', name: 'Collapsible Pop-Up Traffic Cone 650mm', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Height: 650mm' },
  { page: 32, r: 1, c: 2, code: 'OB-RDS-06', name: 'Retractable Cone Q-Manager Ribbon', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Belt Length: 3m' },
  { page: 32, r: 2, c: 0, code: 'OB-RDS-07', name: 'Telescopic Cone Connecting Rod (1.3m to 2.1m)', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Extends to 2.1m, Retracts to 1.3m' },
  { page: 32, r: 2, c: 1, code: 'OB-RDS-08', name: 'LED Traffic Baton Light Rechargeable', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Battery operated / Rechargeable, Stop/Go LED' },
  { page: 32, r: 2, c: 2, code: 'OB-RDS-09', name: 'Outdoor Convex Security Mirror (18/24/32/40 inch)', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Size: 18\" / 24\" / 32\" / 40\"' },
  { page: 32, r: 3, c: 0, code: 'OB-RDS-10', name: 'Acrylic Dome Safety Mirror (Full / Half / Quarter)', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Size: 18\" / 24\" / 32\" / 40\"' },
  { page: 32, r: 3, c: 1, code: 'OB-RDS-11', name: 'Warning Bollard Delineator Post', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Height: 1000mm / 1100mm' },
  { page: 32, r: 3, c: 2, code: 'OB-RDS-12', name: 'Flexible Polyurethane Spring Post 750mm', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Height: 750mm, Polyurethane/PVC' },

  // ==========================================
  // PAGE 33: ROAD SAFETY PRODUCTS (OB-RDS-13 to OB-RDS-24)
  // ==========================================
  { page: 33, r: 0, c: 0, code: 'OB-RDS-13', name: 'Floor Stand Warning Sign 600mm', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Height: 600mm, Plain/Printed' },
  { page: 33, r: 0, c: 1, code: 'OB-RDS-14', name: 'Heavy Duty Road Rumble Strips', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Size: 100 W x 500 L x 25 H mm' },
  { page: 33, r: 0, c: 2, code: 'OB-RDS-15', name: 'Heavy Duty Rubber Wheel Chock', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Size: 115x260x180mm / 200x325x230mm' },
  { page: 33, r: 1, c: 0, code: 'OB-RDS-16', name: 'Rubber Cable Protector Ramp (2/3/4/5 Channel)', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: '2 / 3 / 4 / 5 Channels' },
  { page: 33, r: 1, c: 1, code: 'OB-RDS-17', name: 'High Visibility Reflective Safety Jacket', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Fluorescent Yellow/Green, High Reflector' },
  { page: 33, r: 1, c: 2, code: 'OB-RDS-18', name: 'Aluminum Road Stud and Solar LED Stud', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Solar Powered / Reflector Cats Eye' },
  { page: 33, r: 2, c: 0, code: 'OB-RDS-19', name: 'Handheld Security Metal Detector Scanner', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Battery Operated Scanner' },
  { page: 33, r: 2, c: 1, code: 'OB-RDS-20', name: 'Stainless Steel Retractable Belt Stanchion (3m)', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Belt: 3m Red/Blue, Post: 1000mm SS' },
  { page: 33, r: 2, c: 2, code: 'OB-RDS-21', name: 'Q-Manager A4 Sign Board Display Frame', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'A4 landscape, Silver/SS finish' },
  { page: 33, r: 3, c: 0, code: 'OB-RDS-22', name: 'Classic Velvet Rope Stanchion Post (Gold / SS)', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Height: 1000mm, 1.5m Velvet Rope' },
  { page: 33, r: 3, c: 1, code: 'OB-RDS-23', name: 'Plastic Chain Q-Manager Barrier Post 1000mm', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Height: 1000mm, Water/Sand Filled Base' },
  { page: 33, r: 3, c: 2, code: 'OB-RDS-24', name: 'Microprismatic Reflective Warning Tape (50mm x 50m)', dir: 'road-safety', cat: 'packaging-supplies', sub: 'packaging-dispatch', brand: 'OfficeBazzar', specs: 'Width: 50mm, Length: 50m' },

  // ==========================================
  // PAGE 34: ROAD SAFETY PRODUCTS (OB-RDS-25 to OB-RDS-31)
  // ==========================================
  { page: 34, r: 0, c: 0, code: 'OB-RDS-25', name: 'Heavy Duty Rubber Speed Breakers', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: '350x500x50mm / 400x500x75mm / 300x1000x60mm' },
  { page: 34, r: 0, c: 1, code: 'OB-RDS-26', name: 'Plastic Modular Speed Breakers', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: '350x250x50mm / 750x250x75mm' },
  { page: 34, r: 1, c: 0, code: 'OB-RDS-27', name: 'Rubber Corner Guards Square Edge', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: '100x100x8mm (Height 800/1000/1200mm)' },
  { page: 34, r: 1, c: 1, code: 'OB-RDS-28', name: 'Rubber Corner Guards Curved Edge', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: '90x90x25mm (Height 800/1000/1200mm)' },
  { page: 34, r: 2, c: 0, code: 'OB-RDS-29', name: 'Rubber Car Wheel Stopper 600mm', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Size: 120 W x 600 L x 100 H mm' },
  { page: 34, r: 2, c: 1, code: 'OB-RDS-30', name: 'Rubber Car Wheel Stopper 500mm', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Size: 100 W x 500 L x 100 H mm' },
  { page: 34, r: 3, c: 0, code: 'OB-RDS-31', name: 'Rubber Car Wheel Stopper Commercial 1650mm', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Size: 140 W x 1650 L x 100 H mm' },

  // ==========================================
  // PAGE 35: ROAD SAFETY PRODUCTS (OB-RDS-32 to OB-RDS-43)
  // ==========================================
  { page: 35, r: 0, c: 0, code: 'OB-RDS-32', name: 'Solar Warning Blinker Light', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Solar Powered LED Blinker' },
  { page: 35, r: 0, c: 1, code: 'OB-RDS-33', name: 'Solar Traffic Flasher Light', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Solar Panel Traffic Flasher' },
  { page: 35, r: 0, c: 2, code: 'OB-RDS-34', name: 'Solar Chevron Directional Warning Board', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Solar LED Chevron Array' },
  { page: 35, r: 1, c: 0, code: 'OB-RDS-35', name: 'Under Vehicle Search Inspection Mirror (UVSM)', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Convex Inspection Mirror with Castor Wheels' },
  { page: 35, r: 1, c: 1, code: 'OB-RDS-36', name: 'Heavy Duty Anti-Theft Car Wheel Lock Clamp', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Heavy Gauge Steel Wheel Clamp' },
  { page: 35, r: 1, c: 2, code: 'OB-RDS-37', name: 'LED Emergency Magnetic Beacon Flare Light', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Multi-Pattern Flashing Magnetic Flare' },
  { page: 35, r: 2, c: 0, code: 'OB-RDS-38', name: 'Heavy Duty Anti-Slip Traction Safety Tapes', dir: 'road-safety', cat: 'packaging-supplies', sub: 'packaging-dispatch', brand: 'OfficeBazzar', specs: 'Grit Surface Anti-Slip Tape' },
  { page: 35, r: 2, c: 1, code: 'OB-RDS-39', name: 'Interlocking Plastic Water Filled Road Barrier', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Heavy Duty Polyethylene Barrier' },
  { page: 35, r: 2, c: 2, code: 'OB-RDS-40', name: 'Galvanized Steel Crowd Control Barricade Barrier', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Galvanized Steel Tubular Frame' },
  { page: 35, r: 3, c: 0, code: 'OB-RDS-41', name: 'Portable Expandable Scissor Road Barrier (Max 2m)', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Extendable Lattice Barrier Max Length: 2m' },
  { page: 35, r: 3, c: 1, code: 'OB-RDS-42', name: 'Rechargeable Search Light & Megaphone Siren', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Long Range Search Light + Megaphone' },
  { page: 35, r: 3, c: 2, code: 'OB-RDS-43', name: 'Metal Signage Post Stands (Parking / Directional)', dir: 'road-safety', cat: 'office-stationery', sub: 'safety-maintenance', brand: 'OfficeBazzar', specs: 'Stainless Steel / Powder Coated Post' },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function extractAll() {
  console.log(`Starting extraction for ${PRODUCTS_DATA.length} products across all 35 pages...`);
  const data = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data }).promise;

  // Cache rendered page canvases
  const pageCanvases = new Map();

  async function getPageCanvas(pageNum) {
    if (pageCanvases.has(pageNum)) return pageCanvases.get(pageNum);
    const page = await doc.getPage(pageNum);
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    pageCanvases.set(pageNum, canvas);
    return canvas;
  }

  const manifest = [];
  let successCount = 0;

  for (let i = 0; i < PRODUCTS_DATA.length; i++) {
    const item = PRODUCTS_DATA[i];
    const canvas = await getPageCanvas(item.page);

    // Compute bounding box based on page type
    let cropX, cropY, cropW, cropH;

    // 1. 3x3 Grid (Pages 3 to 20, 27)
    if (item.page >= 3 && item.page <= 20) {
      const cols = [{ x: 75, w: 290 }, { x: 450, w: 290 }, { x: 825, w: 290 }];
      const rows = [{ y: 365, h: 250 }, { y: 765, h: 250 }, { y: 1165, h: 250 }];
      cropX = cols[item.c].x;
      cropY = rows[item.r].y;
      cropW = cols[item.c].w;
      cropH = rows[item.r].h;
    }
    // 2. 4x4 Grid (Pages 22 to 26, Pages 28 to 29)
    else if ((item.page >= 22 && item.page <= 26) || (item.page >= 28 && item.page <= 29)) {
      const cols = [{ x: 55, w: 220 }, { x: 345, w: 220 }, { x: 635, w: 220 }, { x: 925, w: 220 }];
      const rows = [{ y: 260, h: 180 }, { y: 580, h: 180 }, { y: 900, h: 180 }, { y: 1220, h: 180 }];
      cropX = cols[item.c].x;
      cropY = rows[item.r].y;
      cropW = cols[item.c].w;
      cropH = rows[item.r].h;
    }
    // 3. Page 27 (3x3 Grid with different header offset)
    else if (item.page === 27) {
      const cols = [{ x: 75, w: 290 }, { x: 450, w: 290 }, { x: 825, w: 290 }];
      const rows = [{ y: 240, h: 250 }, { y: 640, h: 250 }, { y: 1040, h: 250 }];
      cropX = cols[item.c].x;
      cropY = rows[item.r].y;
      cropW = cols[item.c].w;
      cropH = rows[item.r].h;
    }
    // 4. Page 30 (2 items in Row 0)
    else if (item.page === 30) {
      const cols = [{ x: 60, w: 240 }, { x: 320, w: 240 }];
      cropX = cols[item.c].x;
      cropY = 220;
      cropW = cols[item.c].w;
      cropH = 220;
    }
    // 5. Page 32 (Road Safety 4 rows x 3 cols)
    else if (item.page === 32) {
      const cols = [{ x: 50, w: 340 }, { x: 420, w: 340 }, { x: 790, w: 340 }];
      const rows = [{ y: 180, h: 220 }, { y: 530, h: 220 }, { y: 880, h: 220 }, { y: 1230, h: 220 }];
      cropX = cols[item.c].x;
      cropY = rows[item.r].y;
      cropW = cols[item.c].w;
      cropH = rows[item.r].h;
    }
    // 6. Page 33 (Road Safety 4 rows x 3 cols)
    else if (item.page === 33) {
      const cols = [{ x: 50, w: 340 }, { x: 420, w: 340 }, { x: 790, w: 340 }];
      const rows = [{ y: 180, h: 220 }, { y: 530, h: 220 }, { y: 880, h: 220 }, { y: 1230, h: 220 }];
      cropX = cols[item.c].x;
      cropY = rows[item.r].y;
      cropW = cols[item.c].w;
      cropH = rows[item.r].h;
    }
    // 7. Page 34 (Road Safety Speed breakers & stoppers)
    else if (item.page === 34) {
      if (item.r === 0) {
        // Speed breakers
        cropX = item.c === 0 ? 50 : 700;
        cropY = 220;
        cropW = item.c === 0 ? 600 : 450;
        cropH = 240;
      } else if (item.r === 1) {
        // Corner guards
        cropX = item.c === 0 ? 70 : 620;
        cropY = 660;
        cropW = 460;
        cropH = 260;
      } else if (item.r === 2) {
        // Car wheel stoppers
        cropX = item.c === 0 ? 60 : 580;
        cropY = 1120;
        cropW = 480;
        cropH = 160;
      } else {
        // Long stopper
        cropX = 80;
        cropY = 1440;
        cropW = 1000;
        cropH = 150;
      }
    }
    // 8. Page 35 (Road Safety 4 rows x 3 cols)
    else if (item.page === 35) {
      const cols = [{ x: 50, w: 340 }, { x: 420, w: 340 }, { x: 790, w: 340 }];
      const rows = [{ y: 180, h: 220 }, { y: 530, h: 220 }, { y: 880, h: 220 }, { y: 1230, h: 220 }];
      cropX = cols[item.c].x;
      cropY = rows[item.r].y;
      cropW = cols[item.c].w;
      cropH = rows[item.r].h;
    }

    const cleanSlug = slugify(item.name);
    const filename = `${item.code.toLowerCase()}-${cleanSlug}.webp`;
    const relativePath = `/assets/products/${item.dir}/${filename}`;
    const absolutePath = path.join(process.cwd(), 'public', 'assets', 'products', item.dir, filename);

    try {
      const cropCanvas = createCanvas(cropW, cropH);
      const cropCtx = cropCanvas.getContext('2d');
      cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      const buffer = cropCanvas.toBuffer('image/webp');
      const dirPath = path.dirname(absolutePath);
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(absolutePath, buffer);
      successCount++;

      manifest.push({
        id: `prod-${item.code.toLowerCase()}-${cleanSlug}`,
        code: item.code,
        name: item.name,
        slug: `${item.code.toLowerCase()}-${cleanSlug}`,
        page: item.page,
        category: item.cat,
        subcategory: item.sub,
        brand: item.brand,
        specs: item.specs || null,
        imagePath: relativePath,
        status: 'SUCCESS',
      });
    } catch (err) {
      manifest.push({
        code: item.code,
        name: item.name,
        page: item.page,
        status: 'FAILED',
        error: err.message,
      });
    }

    if ((i + 1) % 20 === 0 || i === PRODUCTS_DATA.length - 1) {
      console.log(`Processed ${i + 1}/${PRODUCTS_DATA.length} products (${successCount} successful)...`);
    }
  }

  fs.writeFileSync('public/assets/products/extraction_manifest.json', JSON.stringify(manifest, null, 2));
  console.log(`\n======================================================`);
  console.log(`Extraction Complete: ${successCount}/${PRODUCTS_DATA.length} images created successfully.`);
  console.log(`Manifest saved to public/assets/products/extraction_manifest.json`);
  console.log(`======================================================\n`);
  module.exports = { PRODUCTS_DATA };
  if (require.main === module) {
    extractAll().catch(console.error);
  }
}

module.exports = { PRODUCTS_DATA };
