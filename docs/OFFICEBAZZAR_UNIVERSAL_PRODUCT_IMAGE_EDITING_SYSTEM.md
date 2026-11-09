# OfficeBazzar – Universal Product Image Editing System (UPIES)

## System Overview
The **Universal Product Image Editing System (UPIES)** defines the mandatory standard for creating premium, consistent, and professional product imagery across all OfficeBazzar catalog categories.

By anchoring all product photography to an identical, approved 3D pastel-blue architectural podium environment, the OfficeBazzar catalog achieves visual coherence, premium brand recognition, and marketplace trust while preserving 100% of the authentic supplier product details.

---

## 1. Fixed Master Template Reference

- **Master Asset Location:** `public/assets/branding/officebazzar_master_podium_background.jpg`
- **Asset Dimensions:** 1024 × 1024 px (Square 1:1) / Scaled to 1080 × 1350 px (4:5 Commercial)
- **Key Visual Elements (Strictly Immutable):**
  1. **Background:** Studio pastel-blue gradient (`#b6c5cc` top to `#c6d3db` bottom).
  2. **Rear Central Arch:** Large symmetrical light-blue semicircle arch.
  3. **Left Front Arch:** Medium white rounded vertical pillar arch.
  4. **Right Front Arch:** Medium light-blue rounded vertical pillar arch.
  5. **Upper Center Stage Podium:** Cylindrical white satin platform with top elliptical surface angled toward the camera.
  6. **Lower Base Stage:** Cylindrical pastel-blue platform supporting the center podium.
  7. **Studio Lighting:** Directional soft top-left diffused fill lighting casting natural soft contact shadows forward and right.

> [!CAUTION]
> **Zero Modification Rule:** The reference background must **never** be redesigned, regenerated via AI, recolored, replaced, or modified. No secondary podiums, floating props, or artificial geometric shapes may be introduced.

---

## 2. Universal Product Compatibility & Placement Architecture

### Stage Positioning Geometry (Based on 1024 × 1024 reference)
- **White Podium Center:** $X \approx 512\text{ px}$, $Y \approx 785\text{ px}$
- **Podium Top Ellipse Bounding Box:** Width $\approx 390\text{ px}$, Height $\approx 75\text{ px}$
- **Primary Product Contact Zone:** $Y \in [750\text{ px}, 795\text{ px}]$

### Product Sizing & Category Placement Matrix
| Category | Scale Ratio relative to Stage | Vertical Anchor | Shadow Profile |
| :--- | :---: | :---: | :--- |
| **Small Stationery** (Pens, Erasers, Markers, Tapes) | 35% – 45% width | Grounded on white podium surface | Soft contact shadow + subtle ambient occlusion |
| **Medium Hardware / Tools** (Dispensers, Batons, Flashers) | 50% – 65% height | Centered on podium top | Directional contact shadow extending slightly right-forward |
| **Tall Industrial** (Cones, Bollards, Spring Posts, Barriers) | 70% – 85% height | Bottom base firmly seated on podium center | Strong base contact shadow grounded on podium surface |
| **Elongated Road Safety** (Speed Breakers, Wheel Stoppers) | 70% – 82% width | Horizon aligned over podium ellipse | Continuous linear contact shadow across podium edge |
| **Bulk / Multi-Pack Sets** (Reams, Paper Bundles, PPE Boxes) | 55% – 70% width | Stepped or angled perspective | Layered contact shadows preventing floating appearance |

---

## 3. Product Integrity Preservation Principles

1. **Authenticity:** The supplier photograph or verified product image is the single source of truth.
2. **Feature Preservation:** All brand logos, model numbers, regulatory markings (CE, ISO, ISI), textured grips, switches, cables, labels, and colorways must remain completely intact.
3. **No AI Hallucination:** Generative AI must **never** redraw, stylize, or invent product components. Products are extracted cleanly with high-precision alpha mattes and composited onto the master stage.
4. **Distortion Prevention:** Aspect ratios must be locked ($1:1$ lock on product scale). No stretching, non-uniform scaling, or perspective warping that misrepresents actual physical dimensions.

---

## 4. Lighting & Realism Standards

- **Edge Treatment:** Feathered alpha edges ($0.5\text{ px} - 1.0\text{ px}$) to eliminate jagged clipping paths and fringing.
- **Contact Shadow Generation:** Dual-layer shadow:
  - *Layer 1 (Ambient Occlusion):* Dark, sharp, localized shadow directly beneath the physical contact points ($40\% - 60\%$ opacity, Gaussian blur $3 - 5\text{ px}$).
  - *Layer 2 (Directional Fill Shadow):* Soft, diffuse shadow cast slightly downward-forward ($20\% - 35\%$ opacity, Gaussian blur $15 - 25\text{ px}$).
- **Color Grading:** Color temperature balanced to clean neutral daylight ($5500\text{K} - 6000\text{K}$), matching the cool pastel studio atmosphere without altering the product's actual finish.

---

## 5. Output Specifications

- **Standard Catalog Output:** 1024 × 1024 pixels (Square 1:1), WebP format, Quality 90.
- **Commercial Display Output:** 1080 × 1350 pixels (4:5 aspect ratio), WebP/JPEG, Quality 92.
- **Canvas Extension:** When generating 4:5 commercial formats, expand canvas vertically using seamless continuous studio background tone without scaling or stretching the podium geometry.

---

## 6. Pre-Flight Quality Control Checklist

Before deploying any product image produced under this system, verify:
- [ ] Is the background identical to the master reference asset?
- [ ] Are all three architectural arches present and unmodified?
- [ ] Is the white cylindrical podium preserved in its original position?
- [ ] Is the product physically grounded with a realistic contact shadow (no floating)?
- [ ] Are all product labels, barcodes, dimensions, and colors 100% faithful to the original?
- [ ] Is the product cleanly masked with zero background halo or fringing?
- [ ] Is the final asset encoded in high-efficiency WebP format at Quality 90+?

