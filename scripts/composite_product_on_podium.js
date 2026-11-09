/**
 * OfficeBazzar Universal Product Image Editing System (UPIES)
 * Automated Sharp Compositing Pipeline
 * 
 * Usage:
 *   node scripts/composite_product_on_podium.js <input_product_path> <output_path> [options]
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MASTER_BACKGROUND = path.join(process.cwd(), 'public', 'assets', 'branding', 'officebazzar_master_podium_background.jpg');

// Podium Surface Metrics on 1024x1024 Canvas:
// Podium Top Ellipse Center: X = 512, Y = 785
// Usable Podium Top Width: ~400px
// Maximum Product Bounding Box: 650w x 600h
const STAGE = {
  podiumCenterX: 512,
  podiumCenterY: 785,
  maxProductWidth: 620,
  maxProductHeight: 580
};

/**
 * Composite a product image onto the immutable master podium template.
 * 
 * @param {string|Buffer} productInput - File path or buffer of product
 * @param {string} outputPath - Output destination (.webp / .jpg)
 * @param {object} options - Sizing, anchor, shadow, and aspect ratio options
 */
async function compositeProductOnPodium(productInput, outputPath, options = {}) {
  const {
    aspectRatio = '1:1', // '1:1' (1024x1024) or '4:5' (1080x1350)
    maxScale = 0.65,      // Scale relative to canvas
    verticalOffset = 0,   // Manual Y adjustment
    shadowOpacity = 0.45,
    quality = 90
  } = options;

  if (!fs.existsSync(MASTER_BACKGROUND)) {
    throw new Error(`Master background not found at ${MASTER_BACKGROUND}`);
  }

  // 1. Load and prepare product
  let product = sharp(productInput);
  const pMeta = await product.metadata();

  // Calculate target bounding size
  const maxW = Math.round(1024 * maxScale);
  const maxH = Math.round(STAGE.maxProductHeight);

  // Resize product preserving exact aspect ratio
  const resizedProductBuf = await product
    .resize({
      width: maxW,
      height: maxH,
      fit: 'inside',
      withoutEnlargement: false
    })
    .toBuffer();

  const resizedMeta = await sharp(resizedProductBuf).metadata();

  // Position product so its bottom sits precisely on the podium ellipse
  const left = Math.round(STAGE.podiumCenterX - (resizedMeta.width / 2));
  // The base of the product aligns with the podium top center, with slight perspective offset
  const top = Math.round((STAGE.podiumCenterY - resizedMeta.height + 15) + verticalOffset);

  // 2. Generate contact shadow on the podium surface
  const shadowWidth = Math.round(resizedMeta.width * 0.85);
  const shadowHeight = Math.max(16, Math.round(shadowWidth * 0.16));
  const shadowLeft = Math.round(STAGE.podiumCenterX - (shadowWidth / 2));
  const shadowTop = top + resizedMeta.height - Math.round(shadowHeight * 0.65);

  const shadowSvg = Buffer.from(`
    <svg width="${shadowWidth}" height="${shadowHeight}">
      <defs>
        <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="black" stop-opacity="${shadowOpacity}"/>
          <stop offset="70%" stop-color="black" stop-opacity="${shadowOpacity * 0.4}"/>
          <stop offset="100%" stop-color="black" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="${shadowWidth / 2}" cy="${shadowHeight / 2}" rx="${shadowWidth / 2}" ry="${shadowHeight / 2}" fill="url(#shadowGrad)"/>
    </svg>
  `);

  const blurredShadowBuf = await sharp(shadowSvg)
    .blur(3)
    .toBuffer();

  // 3. Composite shadow and product onto master background
  let compositePipeline = sharp(MASTER_BACKGROUND).composite([
    {
      input: blurredShadowBuf,
      left: Math.max(0, shadowLeft),
      top: Math.max(0, shadowTop)
    },
    {
      input: resizedProductBuf,
      left: Math.max(0, left),
      top: Math.max(0, top)
    }
  ]);

  // 4. Format Output (1:1 or 4:5)
  if (aspectRatio === '4:5') {
    // 1080 x 1350: scale 1024 stage to 1080x1080 and extend top/bottom canvas seamlessly
    const stage1080 = await compositePipeline
      .resize(1080, 1080, { fit: 'fill' })
      .toBuffer();

    const topPad = 135;
    const botPad = 135;

    await sharp(stage1080)
      .extend({
        top: topPad,
        bottom: botPad,
        background: '#b6c5cc' // Harmonized studio pastel blue
      })
      .webp({ quality })
      .toFile(outputPath);
  } else {
    // Standard 1024x1024 WebP
    await compositePipeline
      .webp({ quality })
      .toFile(outputPath);
  }

  console.log(`Successfully generated podium composite: ${outputPath}`);
}

module.exports = { compositeProductOnPodium };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node scripts/composite_product_on_podium.js <input> <output>');
    process.exit(0);
  }
  compositeProductOnPodium(args[0], args[1])
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
