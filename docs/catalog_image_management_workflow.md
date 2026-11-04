# Office Bazzar – Catalogue Product Image Management & Maintenance Workflow

This document establishes the Standard Operating Procedure (SOP), architectural guidelines, and validation rules for managing product photographs across the Office Bazzar website (`https://officebazzar.com`) and its Zoho CRM backend synchronization.

---

## 1. Architectural Overview & Storage Structure

The catalogue contains **1,948 active products** and **2,935 product image assets** stored across the filesystem, web application, and backups.

```
Office Bazzar Architecture
├── public/assets/products/                     <-- Live web production assets
│   ├── catalog_2026/                           <-- Modern standardized WebP assets (e.g. OB-COM-1036.webp)
│   ├── stationery/                             <-- Office stationery category images
│   ├── housekeeping/                           <-- Housekeeping & hygiene category images
│   ├── printers-technology/                   <-- Technology & printers category images
│   └── packaging-supplies/                     <-- Industrial packaging & safety images
├── src/lib/data/catalog.ts                     <-- Storefront catalogue definition (RAW_PRODUCTS / INITIAL_PRODUCTS)
├── src/lib/data/zoho_product_mapping.json       <-- 1,948 SKU-to-Zoho CRM product ID mappings
├── scripts/
│   ├── complete_product_image_mapping_master.json <-- SKU-to-image master registry
│   ├── complete_1948_product_image_audit.csv      <-- Audited catalogue spreadsheet
│   ├── validate_catalog_images.js              <-- Quality gate validation script (`npm run validate:images`)
│   ├── monitor_image_health.js                 <-- Image URL health check (`npm run monitor:images`)
│   ├── safe_zoho_image_update.js               <-- Safe Zoho CRM update payload generator
│   └── create_permanent_image_backup.js        <-- Automated backup with SHA-256 integrity verification
├── backup/master_image_records/                <-- In-repository versioned audit records
└── D:/office_bazzar_master_images_backup_2026/  <-- Permanent off-repo disk backup (3.064 GB, 2,935 assets)
```

---

## 2. Image Standards & Technical Specifications

Every product image deployed to Office Bazzar must strictly meet the following standards:

| Attribute | Specification | Rule / Rationale |
| :--- | :--- | :--- |
| **Format** | **WebP** (`.webp`) | Provides superior compression with near-lossless clarity and ultra-fast page loads. |
| **Dimensions** | **1200 × 1200 px** | Standard square aspect ratio. Minimum acceptable for small stationery items: **800 × 800 px**. |
| **Color Space** | **sRGB** | Consistent color rendering across OLED, retina, and standard displays. |
| **Background** | **Pure White (`#FFFFFF`) or Transparent** | Seamless integration with storefront product cards and detail galleries. |
| **Framing** | **Centered, 80–90% canvas fill** | Minimum 10% breathing room around product edges. |
| **File Size** | **< 250 KB** (ideal: 40–120 KB) | Files < 2 KB are flagged as corrupted; files > 500 KB must be compressed. |
| **Naming Convention** | `${SKU}.webp` | Primary: `OB-COM-1036.webp`. Alternate gallery angles: `OB-COM-1036-alt1.webp`, `OB-COM-1036-alt2.webp`. |

---

## 3. Step-by-Step SOP: Adding or Updating Product Images

### Step 1: Sourcing Genuine Manufacturer Imagery
- Source high-resolution product photography directly from authorized manufacturers or packaging.
- **Strict Rule**: NEVER use generic placeholder graphics (`placeholder-product.svg`, "SUPPLIER PHOTOGRAPHY PENDING") and NEVER use an unrelated product's photograph.

### Step 2: Optimization & Formatting
1. Crop to 1:1 square ratio with centered alignment and pure white/transparent background.
2. Export as WebP (quality 85–90%).
3. Name the file strictly according to the product SKU: `[SKU].webp`.

### Step 3: Deployment to Project Assets
Copy the optimized WebP file(s) into:
```
public/assets/products/catalog_2026/[SKU].webp
```
For alternate gallery angles:
```
public/assets/products/catalog_2026/[SKU]-alt1.webp
public/assets/products/catalog_2026/[SKU]-alt2.webp
```

### Step 4: Catalog Configuration (`src/lib/data/catalog.ts`)
Update the product definition in `src/lib/data/catalog.ts`:
```typescript
{
  id: "ob-com-1036",
  sku: "OB-COM-1036",
  name: "Kent KS 12 Lamination Machine",
  images: [
    "/assets/products/catalog_2026/OB-COM-1036.webp",
    "/assets/products/catalog_2026/OB-COM-1036-alt1.webp" // if gallery exists
  ],
  requiresManualReview: false,
  ...
}
```

### Step 5: Update the Master Mapping Index
Update `scripts/complete_product_image_mapping_master.json` to register the new asset path and timestamp.

### Step 6: Execute the Quality Gate Validation
Before committing or publishing changes, run:
```bash
npm run validate:images
```
This script audits all 1,948 catalogue items. If any product is missing an image, references a nonexistent file, or contains placeholder strings, the build will safely abort with a non-zero exit code.

### Step 7: Run the Permanent Backup Script
Whenever new images are added or modified, update the permanent backup repository:
```bash
node scripts/create_permanent_image_backup.js
```
This updates `D:/office_bazzar_master_images_backup_2026/` and re-computes SHA-256 verification hashes in `backup_manifest.json`.

### Step 8: Safe Zoho CRM Synchronization (If applicable)
If updating Zoho CRM with product image URLs:
- Use `scripts/safe_zoho_image_update.js`.
- **CRITICAL**: The API payload MUST only contain `{ id: zohoRecordId, Image_URL: imageUrl }`.
- NEVER include `Unit_Price`, `Product_Name`, `Qty_in_Stock`, `Description`, `Tax`, or `Vendor_Name` in image update calls.
- Verify against `src/lib/data/zoho_product_mapping.json` so the existing 1,948 CRM ID mappings remain intact.

### Step 9: Production Health Monitoring
After deploying to production:
```bash
npm run monitor:images
```
This performs live HTTP verification against `https://officebazzar.com` to confirm that all image assets return `HTTP 200 OK` with valid `Content-Type: image/webp` and response times under 500ms.

---

## 4. Quality Rules & Disallowed Practices

1. **Zero Placeholder Policy**: No product in the active catalogue may point to `/assets/placeholder-product.svg` or contain placeholder strings (`pending`, `dummy`, `no-image`).
2. **Preserve Legacy Assets**: Never delete source supplier images from `public/assets/products/` or legacy backup drives.
3. **No Unrelated CRM Writes**: Product image updates must never alter pricing, stock, names, or quotes in Zoho CRM.
4. **Mandatory SKU Naming**: All new images must follow the SKU-based naming standard (`${SKU}.webp`).

