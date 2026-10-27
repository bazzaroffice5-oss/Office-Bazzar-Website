export interface MegaMenuLink {
  name: string;
  href?: string;
  badge?: string;
}

export interface MegaMenuColumn {
  title: string;
  href?: string;
  items: MegaMenuLink[];
}

export interface MegaMenuCategory {
  id: string;
  name: string;
  shortName: string;
  categorySlug: string;
  viewAllHref?: string;
  isInformationalOnly?: boolean;
  tagline: string;
  highlightCard: {
    title: string;
    description: string;
    badge?: string;
    ctaText?: string;
    ctaHref?: string;
    dispatchInfo?: string;
    brands?: string[];
  };
  columns: MegaMenuColumn[];
}

export const MEGA_MENU_DATA: Record<string, MegaMenuCategory> = {
  // 1. Office Supplies & Stationery
  'cat-stationery': {
    id: 'cat-stationery',
    name: 'Office Supplies & Stationery',
    shortName: 'Office Supplies & Stationery',
    categorySlug: 'office-supplies-stationery',
    viewAllHref: '/category/office-supplies-stationery',
    tagline: 'Comprehensive Everyday Desk Stationery, Filing & Paper Products for Enterprises',
    highlightCard: {
      title: 'Corporate Stationery Supply AMC',
      description: 'Streamline procurement across all office branches with centralized billing, GST input credit, and volume pricing.',
      badge: 'Enterprise Choice',
      ctaText: 'Request Stationery RFQ',
      ctaHref: '/bulk-orders?category=stationery',
      brands: ['JK Paper', 'Kangaro', 'Camlin', 'Nataraj', 'Faber-Castell', 'Kores'],
    },
    columns: [
      {
        title: 'Writing Supplies',
        href: '/category/office-supplies-stationery?sub=sub-writing',
        items: [
          { name: 'Ballpoint Pens & Bulk Refills', href: '/category/office-supplies-stationery?sub=sub-writing&query=Ball+Pen', badge: 'Popular' },
          { name: 'Gel & Smooth Rollerball Pens', href: '/category/office-supplies-stationery?sub=sub-writing&query=Gel+Pen' },
          { name: 'Whiteboard Marker Pens & Sets', href: '/category/office-supplies-stationery?sub=sub-writing&query=Whiteboard+Marker', badge: 'Bestseller' },
          { name: 'Permanent Markers & CD/OHP Pens', href: '/category/office-supplies-stationery?sub=sub-writing&query=Permanent+Marker' },
          { name: 'Fluorescent Text Highlighters', href: '/category/office-supplies-stationery?sub=sub-writing&query=Highlighter' },
          { name: 'Wooden Pencils & Mechanical Pencils', href: '/category/office-supplies-stationery?sub=sub-writing&query=Pencil' },
        ],
      },
      {
        title: 'Paper Products & Registers',
        href: '/category/office-supplies-stationery?sub=sub-paper',
        items: [
          { name: 'JK Copier A4 75 GSM (Cartons)', href: '/category/office-supplies-stationery?sub=sub-paper&query=JK+Copier', badge: 'Top Seller' },
          { name: 'A4 & A3 Multi-Purpose Printing Paper', href: '/category/office-supplies-stationery?sub=sub-paper&query=Printing+Paper' },
          { name: 'Executive Hardbound Spiral Notebooks', href: '/category/office-supplies-stationery?sub=sub-paper&query=Notebook' },
          { name: 'Accounts, Attendance & Visitor Registers', href: '/category/office-supplies-stationery?sub=sub-paper&query=Register' },
          { name: 'Removable Sticky Memo Notes & Flags', href: '/category/office-supplies-stationery?sub=sub-paper&query=Sticky+Notes' },
          { name: 'Conference Ruled & Plain Writing Pads', href: '/category/office-supplies-stationery?sub=sub-paper&query=Writing+Pad' },
        ],
      },
      {
        title: 'Files & Document Folders',
        href: '/category/office-supplies-stationery?sub=sub-filing',
        items: [
          { name: 'PVC Laminated Lever Arch Box Files', href: '/category/office-supplies-stationery?sub=sub-filing&query=Box+File', badge: 'Durable' },
          { name: 'Ring Binders & 2-D Ring Arch Folders', href: '/category/office-supplies-stationery?sub=sub-filing&query=Ring+Binder' },
          { name: 'Clear Book Presentation Display Files', href: '/category/office-supplies-stationery?sub=sub-filing&query=Display+File' },
          { name: 'Expanding Document Wallets & Cases', href: '/category/office-supplies-stationery?sub=sub-filing&query=Expanding+File' },
          { name: 'Spring Clip Files & Report Covers', href: '/category/office-supplies-stationery?sub=sub-filing&query=Clip+File' },
          { name: 'Transparent Sheet Protectors (Punched)', href: '/category/office-supplies-stationery?sub=sub-filing&query=Sheet+Protector' },
        ],
      },
      {
        title: 'Desk Accessories & Tools',
        href: '/category/office-supplies-stationery?sub=sub-desk-essentials',
        items: [
          { name: 'Kangaro Heavy Duty Staplers (140 Sheets)', href: '/category/office-supplies-stationery?sub=sub-desk-essentials&query=Stapler', badge: 'Heavy Duty' },
          { name: 'Staple Pins (No. 10, 24/6, 23/17)', href: '/category/office-supplies-stationery?sub=sub-desk-essentials&query=Staple+Pins' },
          { name: 'Heavy 2-Hole Document Punching Machines', href: '/category/office-supplies-stationery?sub=sub-desk-essentials&query=Punching+Machine' },
          { name: 'Steel Paper Clips & Black Binder Clips', href: '/category/office-supplies-stationery?sub=sub-desk-essentials&query=Binder+Clips' },
          { name: 'Retractable Paper Cutters & Stainless Scissors', href: '/category/office-supplies-stationery?sub=sub-desk-essentials&query=Cutter' },
          { name: 'Rotary Tape Dispensers & Desk Organizers', href: '/category/office-supplies-stationery?sub=sub-desk-essentials&query=Tape+Dispenser' },
        ],
      },
    ],
  },

  // 3. Housekeeping & Facility Supplies
  'cat-housekeeping': {
    id: 'cat-housekeeping',
    name: 'Housekeeping & Facility Supplies',
    shortName: 'Housekeeping & Facility',
    categorySlug: 'housekeeping-facility-supplies',
    viewAllHref: '/category/housekeeping-facility-supplies',
    tagline: 'Industrial Cleaning Concentrates, Taski Chemicals & Facility Infrastructure',
    highlightCard: {
      title: 'Facility Maintenance Chemicals',
      description: 'Authorized Diversey Taski concentrates in 5L jars for corporate campuses, hospitals, and manufacturing plants.',
      badge: 'Commercial Tiers',
      ctaText: 'Facility Supply Contract',
      ctaHref: '/bulk-orders?category=housekeeping',
      brands: ['Diversey Taski', 'Kimberly-Clark', 'OfficeBazzar Pro', 'Colin', 'Harpic'],
    },
    columns: [
      {
        title: 'Cleaning Chemicals & Taski',
        href: '/category/housekeeping-facility-supplies?sub=sub-chemicals',
        items: [
          { name: 'Taski R1 Daily Bathroom Cleaner Concentrate', href: '/category/housekeeping-facility-supplies?sub=sub-chemicals&query=Taski+R1' },
          { name: 'Taski R2 Hygienic Hard Surface Cleaner (5L)', href: '/category/housekeeping-facility-supplies?sub=sub-chemicals&query=Taski+R2', badge: 'Top Pick' },
          { name: 'Taski R3 Glass & Mirror Spray Concentrate', href: '/category/housekeeping-facility-supplies?sub=sub-chemicals&query=Taski+R3' },
          { name: 'Taski R6 Heavy Duty Descaling Toilet Bowl 5L', href: '/category/housekeeping-facility-supplies?sub=sub-chemicals&query=Taski+R6', badge: 'Bestseller' },
          { name: 'Taski R9 Restroom Scale & Grout Remover', href: '/category/housekeeping-facility-supplies?sub=sub-chemicals&query=Taski+R9' },
          { name: 'Pine & Citrus Disinfectant Floor Cleaners', href: '/category/housekeeping-facility-supplies?sub=sub-chemicals&query=Floor+Cleaner' },
        ],
      },
      {
        title: 'Industrial Bins & Disposal',
        href: '/category/housekeeping-facility-supplies?sub=sub-bins',
        items: [
          { name: '120L Heavy Duty Mobile Wheelie Dustbin', href: '/category/housekeeping-facility-supplies?sub=sub-bins&query=120L', badge: 'Heavy Duty' },
          { name: '240L Industrial Two-Wheel Garbage Bins', href: '/category/housekeeping-facility-supplies?sub=sub-bins&query=240L' },
          { name: 'Stainless Steel Foot-Operated Pedal Bins', href: '/category/housekeeping-facility-supplies?sub=sub-bins&query=Pedal+Bin' },
          { name: 'Under-Desk Waste Paper Mesh Baskets', href: '/category/housekeeping-facility-supplies?sub=sub-bins&query=Waste+Basket' },
          { name: 'Heavy Gauge Black Garbage Bags (Cartons)', href: '/category/housekeeping-facility-supplies?sub=sub-bins&query=Garbage+Bags' },
          { name: 'Wet & Dry Waste Segregation Bins', href: '/category/housekeeping-facility-supplies?sub=sub-bins&query=Segregation' },
        ],
      },
      {
        title: 'Mops, Wipers & Brushes',
        href: '/category/housekeeping-facility-supplies?sub=sub-mops',
        items: [
          { name: 'Industrial Kentucky Cotton Wet Mops', href: '/category/housekeeping-facility-supplies?sub=sub-mops&query=Wet+Mop' },
          { name: 'Microfiber Dry Dust Mops & Telescopic Rods', href: '/category/housekeeping-facility-supplies?sub=sub-mops&query=Microfiber+Mop' },
          { name: 'Heavy Duty Rubber Floor Squeegees', href: '/category/housekeeping-facility-supplies?sub=sub-mops&query=Wiper' },
          { name: 'Soft Grass & Hard Plastic Outdoor Brooms', href: '/category/housekeeping-facility-supplies?sub=sub-mops&query=Broom' },
          { name: 'Hard Bristle Floor Scrubbing Brushes', href: '/category/housekeeping-facility-supplies?sub=sub-mops&query=Scrubber' },
          { name: 'Industrial Rubber Cleaning Hand Gloves', href: '/category/housekeeping-facility-supplies?sub=sub-mops&query=Cleaning+Gloves' },
        ],
      },
      {
        title: 'Restroom Dispensers & Air Care',
        href: '/category/housekeeping-facility-supplies?sub=sub-dispensers',
        items: [
          { name: 'Wall Mount Liquid & Foam Soap Dispensers', href: '/category/housekeeping-facility-supplies?sub=sub-dispensers&query=Soap+Dispenser' },
          { name: 'Touchless Sensor Auto Hand Soap Units', href: '/category/housekeeping-facility-supplies?sub=sub-dispensers&query=Auto+Soap' },
          { name: 'M-Fold Paper Hand Towel Dispenser Cabinets', href: '/category/housekeeping-facility-supplies?sub=sub-dispensers&query=Towel+Dispenser' },
          { name: 'Jumbo Roll Toilet Paper Lockable Dispensers', href: '/category/housekeeping-facility-supplies?sub=sub-dispensers&query=Jumbo+Roll' },
          { name: 'Urinal Splash Screens & Deodorant Blocks', href: '/category/housekeeping-facility-supplies?sub=sub-dispensers&query=Urinal+Screen' },
          { name: 'Automatic Aerosol Room Freshener Units', href: '/category/housekeeping-facility-supplies?sub=sub-dispensers&query=Air+Freshener' },
        ],
      },
    ],
  },

  // 4. Packaging & Materials
  'cat-packaging': {
    id: 'cat-packaging',
    name: 'Packaging & Adhesive Materials',
    shortName: 'Packaging & Materials',
    categorySlug: 'packaging-adhesive-materials',
    viewAllHref: '/category/packaging-adhesive-materials',
    tagline: 'High Tensile BOPP Tapes, Corrugated Cartons, Bubble Wraps & Shipping Supplies',
    highlightCard: {
      title: 'Warehouse & Logistics Procurement',
      description: 'Factory-direct carton packaging tapes, custom printed company logo tapes, and multi-ply export boxes.',
      badge: 'Factory Direct',
      ctaText: 'Bulk Packaging Quote',
      ctaHref: '/bulk-orders?category=packaging',
      brands: ['OfficeBazzar Pack', '3M Scotch', 'Kores', 'Supreme Tapes'],
    },
    columns: [
      {
        title: 'BOPP Packaging Tapes',
        href: '/category/packaging-adhesive-materials?sub=sub-tapes',
        items: [
          { name: 'Clear Transparent BOPP Tape (Box of 72)', href: '/category/packaging-adhesive-materials?sub=sub-tapes&query=Clear+Tape', badge: 'Wholesale' },
          { name: 'Brown Kraft Sealing Tape (65m & 100m)', href: '/category/packaging-adhesive-materials?sub=sub-tapes&query=Brown+Tape' },
          { name: 'Custom Printed Company Logo Tapes', href: '/category/packaging-adhesive-materials?sub=sub-tapes&query=Printed+Tape', badge: 'Branding' },
          { name: 'Fragile Handle With Care Printed Tape', href: '/category/packaging-adhesive-materials?sub=sub-tapes&query=Fragile+Tape' },
          { name: 'Heavy Duty Cross Filament Reinforced Tape', href: '/category/packaging-adhesive-materials?sub=sub-tapes&query=Filament+Tape' },
          { name: 'Crepe Paper Painter Masking Tapes', href: '/category/packaging-adhesive-materials?sub=sub-tapes&query=Masking+Tape' },
        ],
      },
      {
        title: 'Corrugated Shipping Cartons',
        href: '/category/packaging-adhesive-materials?sub=sub-boxes',
        items: [
          { name: '3-Ply Lightweight Shipping Cartons', href: '/category/packaging-adhesive-materials?sub=sub-boxes&query=3-Ply' },
          { name: '5-Ply Heavy Duty Export Master Boxes', href: '/category/packaging-adhesive-materials?sub=sub-boxes&query=5-Ply', badge: 'Export Grade' },
          { name: '7-Ply Industrial Extra Heavy Duty Boxes', href: '/category/packaging-adhesive-materials?sub=sub-boxes&query=7-Ply' },
          { name: 'Die-Cut Self-Locking Mailing Boxes', href: '/category/packaging-adhesive-materials?sub=sub-boxes&query=Mailing+Box' },
          { name: 'Document Archive & Storage Cartons', href: '/category/packaging-adhesive-materials?sub=sub-boxes&query=Storage+Carton' },
        ],
      },
      {
        title: 'Protective Wrap & Cushioning',
        href: '/category/packaging-adhesive-materials?sub=sub-wrap',
        items: [
          { name: 'Air Bubble Wrap Rolls (100m x 1m)', href: '/category/packaging-adhesive-materials?sub=sub-wrap&query=Bubble+Wrap', badge: 'Protective' },
          { name: 'Manual Stretch Wrap Film (23 Micron)', href: '/category/packaging-adhesive-materials?sub=sub-wrap&query=Stretch+Film' },
          { name: 'Machine Grade Pallet Stretch Film Rolls', href: '/category/packaging-adhesive-materials?sub=sub-wrap&query=Pallet+Film' },
          { name: 'EPE Foam Sheets & Edge Corner Guards', href: '/category/packaging-adhesive-materials?sub=sub-wrap&query=EPE+Foam' },
          { name: 'Corrugated Flute Paper Rolls (Heavy)', href: '/category/packaging-adhesive-materials?sub=sub-wrap&query=Corrugated+Roll' },
        ],
      },
      {
        title: 'Strapping & Sealing Tools',
        href: '/category/packaging-adhesive-materials?sub=sub-strapping',
        items: [
          { name: 'Handheld Pistol-Grip Tape Dispenser Gun', href: '/category/packaging-adhesive-materials?sub=sub-strapping&query=Tape+Dispenser', badge: 'Essential' },
          { name: 'PP Box Strapping Rolls & Metal Clips', href: '/category/packaging-adhesive-materials?sub=sub-strapping&query=Strapping+Roll' },
          { name: 'Manual Tensioner & Sealer Strapping Tools', href: '/category/packaging-adhesive-materials?sub=sub-strapping&query=Tensioner' },
          { name: 'Polypropylene Bundling Twines & Cords', href: '/category/packaging-adhesive-materials?sub=sub-strapping&query=Twine' },
          { name: 'Thermal Impulse Hand Sealing Machines', href: '/category/packaging-adhesive-materials?sub=sub-strapping&query=Heat+Sealer' },
        ],
      },
    ],
  },

  // 5. Printer Supplies & Toner
  'cat-consumables': {
    id: 'cat-consumables',
    name: 'Computer Consumables & Printer Supplies',
    shortName: 'Printer Supplies & Toner',
    categorySlug: 'computer-consumables-printer-supplies',
    viewAllHref: '/category/computer-consumables-printer-supplies',
    tagline: 'OEM Laser Toners, Ink Bottles, Barcode Media & IT Peripherals',
    highlightCard: {
      title: 'Enterprise Printer Fleet AMC',
      description: 'Guaranteed genuine OEM toners with tamper-proof holographic seals and replacement warranty.',
      badge: '100% Genuine',
      ctaText: 'Get Fleet Toner Quote',
      ctaHref: '/bulk-orders?category=toner',
      brands: ['HP', 'Canon', 'Epson', 'Brother', 'Logitech', 'ProDot'],
    },
    columns: [
      {
        title: 'Laser Toner Cartridges',
        href: '/category/computer-consumables-printer-supplies?sub=sub-toner',
        items: [
          { name: 'HP 88A (CC388A) Original LaserJet Toner', href: '/category/computer-consumables-printer-supplies?sub=sub-toner&query=HP+88A', badge: 'Genuine' },
          { name: 'HP 12A (Q2612A) Black Laser Toner', href: '/category/computer-consumables-printer-supplies?sub=sub-toner&query=HP+12A' },
          { name: 'HP 78A / 85A / 05A High Yield Toners', href: '/category/computer-consumables-printer-supplies?sub=sub-toner&query=HP+Toner' },
          { name: 'Canon 057 / Cartridge 303 Laser Toners', href: '/category/computer-consumables-printer-supplies?sub=sub-toner&query=Canon' },
          { name: 'Brother TN-2365 / TN-1020 Cartridges', href: '/category/computer-consumables-printer-supplies?sub=sub-toner&query=Brother' },
          { name: 'Enterprise Premium Compatible Laser Toners', href: '/category/computer-consumables-printer-supplies?sub=sub-toner&query=Compatible+Toner' },
        ],
      },
      {
        title: 'Printer Inks & Ribbons',
        href: '/category/computer-consumables-printer-supplies?sub=sub-ink',
        items: [
          { name: 'HP GT51 / GT53 Original Black Ink Bottles', href: '/category/computer-consumables-printer-supplies?sub=sub-ink&query=HP+Ink', badge: 'OEM' },
          { name: 'HP GT52 Cyan, Magenta, Yellow Color Bottles', href: '/category/computer-consumables-printer-supplies?sub=sub-ink&query=GT52' },
          { name: 'Epson 003 EcoTank Four-Color Ink Sets', href: '/category/computer-consumables-printer-supplies?sub=sub-ink&query=Epson+003' },
          { name: 'Canon GI-790 Pixma Ink Refills', href: '/category/computer-consumables-printer-supplies?sub=sub-ink&query=Canon+Ink' },
          { name: 'Dot Matrix Printer Ribbon Cartridges (Epson)', href: '/category/computer-consumables-printer-supplies?sub=sub-ink&query=Ribbon' },
          { name: 'Thermal Transfer Barcode Ribbons (Wax/Resin)', href: '/category/computer-consumables-printer-supplies?sub=sub-ink&query=Barcode+Ribbon' },
        ],
      },
      {
        title: 'Computer Peripherals',
        href: '/category/computer-consumables-printer-supplies?sub=sub-peripherals',
        items: [
          { name: 'Wired USB Optical Mouse & Keyboards', href: '/category/computer-consumables-printer-supplies?sub=sub-peripherals&query=Mouse' },
          { name: 'Wireless Desktop Combos (Logitech / Dell)', href: '/category/computer-consumables-printer-supplies?sub=sub-peripherals&query=Wireless' },
          { name: 'HDMI, DisplayPort & VGA Display Cables', href: '/category/computer-consumables-printer-supplies?sub=sub-peripherals&query=HDMI' },
          { name: 'Multi-Plug Surge Protectors with Spike Guards', href: '/category/computer-consumables-printer-supplies?sub=sub-peripherals&query=Surge+Protector' },
          { name: 'USB Flash Drives & External Backup Disks', href: '/category/computer-consumables-printer-supplies?sub=sub-peripherals&query=USB' },
        ],
      },
      {
        title: 'Specialty Media & Rolls',
        href: '/category/computer-consumables-printer-supplies',
        items: [
          { name: 'Heavy Glossy Photo Paper (180/210 GSM)', href: '/category/computer-consumables-printer-supplies?query=Photo+Paper' },
          { name: 'Continuous Computer Stationery Forms (1-3 Ply)', href: '/category/computer-consumables-printer-supplies?query=Continuous' },
          { name: 'Direct Thermal Barcode Sticker Rolls', href: '/category/computer-consumables-printer-supplies?query=Barcode+Labels', badge: 'Logistics' },
          { name: 'Thermal Billing POS Rolls (80mm & 57mm)', href: '/category/computer-consumables-printer-supplies?query=Thermal+Roll' },
        ],
      },
    ],
  },

  // 6. Boards & Displays
  'cat-boards': {
    id: 'cat-boards',
    name: 'Boards & Display Accessories',
    shortName: 'Boards & Displays',
    categorySlug: 'boards-and-accessories',
    viewAllHref: '/category/boards-and-accessories',
    tagline: 'Ceramic Magnetic Whiteboards, Cork Pin Boards, Easels & Presentation Hardware',
    highlightCard: {
      title: 'Conference & Training Rooms',
      description: 'Scratch-resistant resin coated steel whiteboards with satin-finish aluminum frames and mounting kits.',
      badge: 'Turnkey Supply',
      ctaText: 'Conference Setup RFQ',
      ctaHref: '/bulk-orders?category=boards',
      brands: ['OfficeBazzar Boards', 'Alkosign', 'Camlin', 'Pragati Systems'],
    },
    columns: [
      {
        title: 'Magnetic Whiteboards',
        href: '/category/boards-and-accessories?sub=sub-whiteboards',
        items: [
          { name: 'Ceramic Magnetic Whiteboard 4x3 Ft', href: '/category/boards-and-accessories?sub=sub-whiteboards&query=4x3', badge: 'Popular' },
          { name: 'Executive Meeting Room Whiteboard 6x4 Ft', href: '/category/boards-and-accessories?sub=sub-whiteboards&query=6x4' },
          { name: 'Large Conference Wall Board 8x4 Ft', href: '/category/boards-and-accessories?sub=sub-whiteboards&query=8x4' },
          { name: 'Cabin Compact Whiteboards (3x2 & 2x1.5 Ft)', href: '/category/boards-and-accessories?sub=sub-whiteboards&query=3x2' },
          { name: 'Double-Sided Mobile Reversible Boards', href: '/category/boards-and-accessories?sub=sub-whiteboards&query=Reversible' },
          { name: 'Frameless Magnetic Glass Marker Boards', href: '/category/boards-and-accessories?sub=sub-whiteboards&query=Glass+Board', badge: 'Premium' },
        ],
      },
      {
        title: 'Notice & Pin Boards',
        href: '/category/boards-and-accessories?sub=sub-notice',
        items: [
          { name: 'Natural Granular Cork Pin Boards', href: '/category/boards-and-accessories?sub=sub-notice&query=Cork+Board' },
          { name: 'Felt Fabric Notice Boards (Royal Blue/Maroon)', href: '/category/boards-and-accessories?sub=sub-notice&query=Felt+Board' },
          { name: 'Lockable Sliding Glass Door Display Cases', href: '/category/boards-and-accessories?sub=sub-notice&query=Lockable', badge: 'Secure' },
          { name: 'Perforated Tool & Key Storage Cabinets', href: '/category/boards-and-accessories?sub=sub-notice&query=Key+Cabinet' },
          { name: 'Combination Board (Half White / Half Pin)', href: '/category/boards-and-accessories?sub=sub-notice&query=Combination' },
        ],
      },
      {
        title: 'Easels & Display Stands',
        href: '/category/boards-and-accessories?sub=sub-stands',
        items: [
          { name: 'Telescopic Tripod Flip Chart Easel Stands', href: '/category/boards-and-accessories?sub=sub-stands&query=Tripod' },
          { name: 'Heavy Duty Caster Wheeled Rolling Stands', href: '/category/boards-and-accessories?sub=sub-stands&query=Rolling+Stand' },
          { name: 'Retractable Floor Stand Roll-Up Banners', href: '/category/boards-and-accessories?sub=sub-stands&query=Roll-Up' },
          { name: 'Desktop Acrylic Brochure & Name Plate Stands', href: '/category/boards-and-accessories?sub=sub-stands&query=Acrylic' },
        ],
      },
      {
        title: 'Board Accessories',
        href: '/category/boards-and-accessories',
        items: [
          { name: 'Assorted Magnetic Dry Erase Markers', href: '/category/boards-and-accessories?query=Whiteboard+Marker', badge: 'Essential' },
          { name: 'Magnetic Felt Dusters & Surface Cleaners', href: '/category/boards-and-accessories?query=Duster' },
          { name: 'Strong Neodymium Push Pin Board Magnets', href: '/category/boards-and-accessories?query=Magnets' },
          { name: 'Flip Chart Paper Refill Pads (50 Sheets)', href: '/category/boards-and-accessories?query=Flip+Chart' },
        ],
      },
    ],
  },

  // 7. Office Machines & Tools
  'cat-machines': {
    id: 'cat-machines',
    name: 'Office Machines & Equipment',
    shortName: 'Office Machines & Tools',
    categorySlug: 'office-machines-equipment',
    viewAllHref: '/category/office-machines-equipment',
    tagline: 'Heavy Duty Shredders, Currency Counting Machines, Binding & Office Electronics',
    highlightCard: {
      title: 'P-4 Security & Office Automation',
      description: 'Equip accounts and confidential HR departments with certified confetti paper shredders and currency counters.',
      badge: 'Commercial Duty',
      ctaText: 'Machines Quote & Demo',
      ctaHref: '/bulk-orders?category=machines',
      brands: ['Bambalio', 'Casio', 'Fellowes', 'Gobbler', 'GBC'],
    },
    columns: [
      {
        title: 'Paper Shredders',
        href: '/category/office-machines-equipment?sub=sub-shredders',
        items: [
          { name: 'Bambalio 12CD Cross-Cut Shredder', href: '/category/office-machines-equipment?sub=sub-shredders&query=12CD', badge: 'Bestseller' },
          { name: 'P-4 High Security Confetti Paper Shredders', href: '/category/office-machines-equipment?sub=sub-shredders&query=P-4' },
          { name: 'Heavy Duty 25-Sheet Departmental Shredders', href: '/category/office-machines-equipment?sub=sub-shredders&query=Heavy+Duty' },
          { name: 'Micro-Cut High Security Shredders', href: '/category/office-machines-equipment?sub=sub-shredders&query=Micro-Cut' },
          { name: 'Shredder Maintenance Lubricating Oil Sheets', href: '/category/office-machines-equipment?sub=sub-shredders&query=Shredder+Oil' },
        ],
      },
      {
        title: 'Currency Counting Machines',
        href: '/category/office-machines-equipment?sub=sub-currency',
        items: [
          { name: 'UV/MG/IR Fake Note Detector Counters', href: '/category/office-machines-equipment?sub=sub-currency&query=Currency', badge: 'High Precision' },
          { name: 'High-Speed Desktop Cash Counting Units', href: '/category/office-machines-equipment?sub=sub-currency&query=Note+Counter' },
          { name: 'Multi-Currency Value Counter & Sorters', href: '/category/office-machines-equipment?sub=sub-currency&query=Value+Counter' },
          { name: 'External Customer Facing Display Units', href: '/category/office-machines-equipment?sub=sub-currency&query=Display' },
        ],
      },
      {
        title: 'Binding & Lamination',
        href: '/category/office-machines-equipment?sub=sub-lamination',
        items: [
          { name: 'A3 & A4 Thermal Hot Roll Laminators', href: '/category/office-machines-equipment?sub=sub-lamination&query=Laminator' },
          { name: 'Comb & Wire Manual Binding Machines', href: '/category/office-machines-equipment?sub=sub-lamination&query=Binding+Machine', badge: 'Popular' },
          { name: 'Thermal Lamination Pouches (125/250 Micron)', href: '/category/office-machines-equipment?sub=sub-lamination&query=Lamination+Pouches' },
          { name: 'Plastic Spiral & Comb Rings (6mm - 51mm)', href: '/category/office-machines-equipment?sub=sub-lamination&query=Comb+Rings' },
        ],
      },
      {
        title: 'Calculators & Trimmers',
        href: '/category/office-machines-equipment',
        items: [
          { name: 'Casio 12-Digit Commercial Desktop Calculators', href: '/category/office-machines-equipment?query=Casio', badge: 'OEM' },
          { name: 'Check & Correct Tax Calculators', href: '/category/office-machines-equipment?query=Tax+Calculator' },
          { name: 'Direct Thermal Barcode & Label Printers', href: '/category/office-machines-equipment?query=Label+Printer' },
          { name: 'Heavy Rotary Paper Trimmers with Steel Blade', href: '/category/office-machines-equipment?query=Trimmer' },
        ],
      },
    ],
  },

  // 8. Pantry & Hygiene
  'cat-hygiene': {
    id: 'cat-hygiene',
    name: 'Pantry, Hygiene & Tissue Napkins',
    shortName: 'Pantry & Hygiene',
    categorySlug: 'hygiene-and-tissue',
    viewAllHref: '/category/hygiene-and-tissue',
    tagline: 'Kimberly-Clark Tissues, Disinfectants, Handwash & Corporate Pantry Supplies',
    highlightCard: {
      title: 'Scheduled Monthly Pantry Supply',
      description: 'Set up recurring auto-dispatch for handwash, paper cups, coffee sachets, and commercial Scott hand towels.',
      badge: 'Auto-Replenish',
      ctaText: 'Pantry Supply Plan',
      ctaHref: '/bulk-orders?category=hygiene',
      brands: ['Kimberly-Clark', 'Dettol', 'Lifebuoy', 'Godrej aer', 'Nescafe'],
    },
    columns: [
      {
        title: 'Commercial Tissues & Towels',
        href: '/category/hygiene-and-tissue?sub=sub-tissue',
        items: [
          { name: 'Kimberly-Clark Scott M-Fold Towels (Carton 20)', href: '/category/hygiene-and-tissue?sub=sub-tissue&query=Scott+M-Fold', badge: 'Bestseller' },
          { name: 'Hard Roll Towels (HRT) for Auto Dispensers', href: '/category/hygiene-and-tissue?sub=sub-tissue&query=HRT' },
          { name: '2-Ply Virgin Toilet Tissue Rolls (Cartons)', href: '/category/hygiene-and-tissue?sub=sub-tissue&query=Toilet+Paper' },
          { name: 'Pop-Up Facial Tissue Boxes (100 Pulls)', href: '/category/hygiene-and-tissue?sub=sub-tissue&query=Facial+Tissue' },
          { name: 'Food Grade Table Napkins & Beverage Tissues', href: '/category/hygiene-and-tissue?sub=sub-tissue&query=Napkins' },
        ],
      },
      {
        title: 'Hand Hygiene & Sanitizers',
        href: '/category/hygiene-and-tissue?sub=sub-handwash',
        items: [
          { name: 'Antibacterial Foaming Handwash 5L Cans', href: '/category/hygiene-and-tissue?sub=sub-handwash&query=Handwash+5L', badge: 'Wholesale' },
          { name: '70% Alcohol Hand Sanitizer Pump Bottles (500ml)', href: '/category/hygiene-and-tissue?sub=sub-handwash&query=Sanitizer+500ml' },
          { name: 'Multi-Surface Sanitizer Sprays & Disinfectant Wipes', href: '/category/hygiene-and-tissue?sub=sub-handwash&query=Disinfectant' },
          { name: 'Liquid Hand Soap Dispenser Refill Pouches', href: '/category/hygiene-and-tissue?sub=sub-handwash&query=Soap+Refill' },
        ],
      },
      {
        title: 'Pantry & Beverage Essentials',
        href: '/category/hygiene-and-tissue?sub=sub-pantry',
        items: [
          { name: 'Ripple Wall Disposable Paper Coffee Cups (250ml)', href: '/category/hygiene-and-tissue?sub=sub-pantry&query=Paper+Cups', badge: 'Eco-Friendly' },
          { name: 'Individual Wooden Coffee Stirrers (Box of 1000)', href: '/category/hygiene-and-tissue?sub=sub-pantry&query=Stirrers' },
          { name: 'Nescafe Classic & Gold Coffee Sachets', href: '/category/hygiene-and-tissue?sub=sub-pantry&query=Coffee' },
          { name: 'Tea Bags (Twinings / Taj Mahal / Green Tea)', href: '/category/hygiene-and-tissue?sub=sub-pantry&query=Tea' },
          { name: 'Single-Serve Sugar Sachets & Milk Dairy Creamer', href: '/category/hygiene-and-tissue?sub=sub-pantry&query=Sugar' },
        ],
      },
      {
        title: 'Restroom Care & Air Fresheners',
        href: '/category/hygiene-and-tissue',
        items: [
          { name: 'Godrej aer Pocket Restroom Fragrance Blocks', href: '/category/hygiene-and-tissue?query=Aer' },
          { name: 'Automatic Aerosol Fragrance Dispenser Refills', href: '/category/hygiene-and-tissue?query=Aerosol' },
          { name: 'Naphthalene Balls & Camphor Restroom Cones', href: '/category/hygiene-and-tissue?query=Naphthalene' },
          { name: 'Heavy Duty Restroom Squeegees & Scrubbers', href: '/category/hygiene-and-tissue?query=Scrubber' },
        ],
      },
    ],
  },

  // 9. Safety & PPE Equipment
  'cat-safety': {
    id: 'cat-safety',
    name: 'Safety & PPE Equipment',
    shortName: 'Safety & PPE Equipment',
    categorySlug: 'safety-and-ppe-equipment',
    viewAllHref: '/category/safety-and-ppe-equipment',
    tagline: 'Certified Industrial PPE, 3M Respirators, Safety Shoes, Helmets & First Aid Kits',
    highlightCard: {
      title: 'Factories & Industrial Sites',
      description: 'EN & ISI certified personal protective equipment for corporate facilities, construction, and manufacturing floors.',
      badge: 'Certified PPE',
      ctaText: 'Bulk PPE RFQ',
      ctaHref: '/bulk-orders?category=safety',
      brands: ['3M Safety', 'Karam', 'Allen Cooper', 'Udyogi', 'Safari'],
    },
    columns: [
      {
        title: 'Head & Face Protection',
        href: '/category/safety-and-ppe-equipment?sub=sub-respirators',
        items: [
          { name: 'Certified Industrial Hard Hats with Ratchet', href: '/category/safety-and-ppe-equipment?sub=sub-respirators&query=Safety+Helmet', badge: 'ISI Marked' },
          { name: 'Full Face Transparent Polycarbonate Visors', href: '/category/safety-and-ppe-equipment?sub=sub-respirators&query=Face+Shield' },
          { name: '3M Aura 9332+ FFP3 Valved Respirator Masks', href: '/category/safety-and-ppe-equipment?sub=sub-respirators&query=3M+Aura', badge: 'FFP3 Valved' },
          { name: 'N95 Particulate Masks & 3-Ply Surgical Masks', href: '/category/safety-and-ppe-equipment?sub=sub-respirators&query=N95' },
        ],
      },
      {
        title: 'Eye, Ear & Respiratory',
        href: '/category/safety-and-ppe-equipment?sub=sub-gloves',
        items: [
          { name: 'Anti-Fog Impact-Resistant Safety Goggles', href: '/category/safety-and-ppe-equipment?sub=sub-gloves&query=Safety+Goggles', badge: 'Anti-Fog' },
          { name: '3M Reusable Half Facepiece Dual Cartridge Masks', href: '/category/safety-and-ppe-equipment?sub=sub-respirators&query=Half+Facepiece' },
          { name: 'Corded Foam Ear Plugs (SNR 37dB Rating)', href: '/category/safety-and-ppe-equipment?query=Ear+Plugs' },
          { name: 'Adjustable Industrial Ear Muff Defenders', href: '/category/safety-and-ppe-equipment?query=Ear+Muff' },
        ],
      },
      {
        title: 'Handwear & Protective Vests',
        href: '/category/safety-and-ppe-equipment?sub=sub-gloves',
        items: [
          { name: 'Heavy Duty Nitrile Coated Safety Gloves', href: '/category/safety-and-ppe-equipment?sub=sub-gloves&query=Nitrile+Gloves', badge: 'Popular' },
          { name: 'Level 5 Cut-Resistant Kevlar Hand Gloves', href: '/category/safety-and-ppe-equipment?sub=sub-gloves&query=Cut+Resistant' },
          { name: 'High-Visibility Neon Orange Reflective Jackets', href: '/category/safety-and-ppe-equipment?query=Reflective+Jacket' },
          { name: 'Steel Toe Cap Industrial Work Safety Shoes', href: '/category/safety-and-ppe-equipment?query=Safety+Shoes', badge: 'Steel Toe' },
        ],
      },
      {
        title: 'Workplace Emergency Safety',
        href: '/category/safety-and-ppe-equipment?sub=sub-firstaid',
        items: [
          { name: 'Industrial First Aid Kits (Factories Act Compliant)', href: '/category/safety-and-ppe-equipment?sub=sub-firstaid&query=First+Aid+Kit', badge: 'Compliant' },
          { name: 'ABC Dry Powder & CO2 Fire Extinguishers', href: '/category/safety-and-ppe-equipment?query=Fire+Extinguisher' },
          { name: 'Emergency Eye Wash Bottles & Wall Stations', href: '/category/safety-and-ppe-equipment?query=Eye+Wash' },
          { name: 'High-Visibility Floor Wet Caution Signs', href: '/category/safety-and-ppe-equipment?query=Caution+Sign' },
        ],
      },
    ],
  },

  // 10. Corporate Gifting
  'cat-gifting': {
    id: 'cat-gifting',
    name: 'Corporate Gifting & Printing',
    shortName: 'Corporate Gifting',
    categorySlug: 'corporate-gifting-printing',
    viewAllHref: '/category/corporate-gifting-printing',
    tagline: 'Executive Diary Gift Sets, Laser Engraved Pens, Drinkware & Welcome Kits',
    highlightCard: {
      title: 'Custom Brand Printing & Hampers',
      description: 'Order employee onboarding gift boxes and executive diaries customized with your company branding and metallic foils.',
      badge: 'Custom Logo',
      ctaText: 'Corporate Gifting RFQ',
      ctaHref: '/bulk-orders?category=gifting',
      brands: ['OfficeBazzar Executive', 'Parker', 'Pierre Cardin', 'Milton', 'Cello'],
    },
    columns: [
      {
        title: 'Executive Diaries & Notebooks',
        href: '/category/corporate-gifting-printing?sub=sub-diaries',
        items: [
          { name: 'Executive PU Leather Diary & Metal Pen Set', href: '/category/corporate-gifting-printing?sub=sub-diaries&query=Gift+Set', badge: 'Bestseller' },
          { name: 'Hardbound Magnetic Clasp A5 Notebooks', href: '/category/corporate-gifting-printing?sub=sub-diaries&query=Magnetic+Notebook' },
          { name: 'Custom Embossed Year Planners & Organizers', href: '/category/corporate-gifting-printing?sub=sub-diaries&query=Year+Planner' },
          { name: 'Eco-Friendly Recycled Kraft Paper Journals', href: '/category/corporate-gifting-printing?sub=sub-diaries&query=Recycled+Journal' },
        ],
      },
      {
        title: 'Luxury Pens & Writing Sets',
        href: '/category/corporate-gifting-printing?sub=sub-pens-gift',
        items: [
          { name: 'Weighted Brass Rollerball Pens in Gift Box', href: '/category/corporate-gifting-printing?sub=sub-pens-gift&query=Metal+Pen', badge: 'Executive' },
          { name: 'Laser Engraved Custom Name Metal Pens', href: '/category/corporate-gifting-printing?sub=sub-pens-gift&query=Engraved+Pen' },
          { name: 'Parker Vector & Jotter Presentation Sets', href: '/category/corporate-gifting-printing?sub=sub-pens-gift&query=Parker' },
          { name: 'Matte Black Pen & Keychain Velvet Combos', href: '/category/corporate-gifting-printing?sub=sub-pens-gift&query=Keychain+Combo' },
        ],
      },
      {
        title: 'Drinkware & Employee Hampers',
        href: '/category/corporate-gifting-printing',
        items: [
          { name: 'Stainless Steel Insulated Thermos Bottles (500ml)', href: '/category/corporate-gifting-printing?query=Thermos+Bottle', badge: 'Popular' },
          { name: 'Ceramic Coffee Mugs with Custom Corporate Logo', href: '/category/corporate-gifting-printing?query=Corporate+Mug' },
          { name: 'New Employee Joining Welcome Kit Hampers', href: '/category/corporate-gifting-printing?query=Welcome+Kit', badge: 'Turnkey' },
          { name: 'Corporate Tech Accessories & Power Bank Sets', href: '/category/corporate-gifting-printing?query=Power+Bank' },
        ],
      },
      {
        title: 'Printing, ID Cards & Lanyards',
        href: '/category/corporate-gifting-printing?sub=sub-lanyards',
        items: [
          { name: 'Multi-Color Sublimation Satin Lanyards (20mm)', href: '/category/corporate-gifting-printing?sub=sub-lanyards&query=Lanyard', badge: 'Custom Logo' },
          { name: 'Rigid PVC Employee ID Cards & Holders', href: '/category/corporate-gifting-printing?sub=sub-lanyards&query=ID+Card' },
          { name: 'Retractable Yo-Yo Badge Reels with Clip', href: '/category/corporate-gifting-printing?sub=sub-lanyards&query=Badge+Reel' },
          { name: 'Custom Printed Desktop Calendars & Mousepads', href: '/category/corporate-gifting-printing?query=Desk+Calendar' },
        ],
      },
    ],
  },
};

