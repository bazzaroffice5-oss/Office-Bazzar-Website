# Office Bazzar — SEO & Performance Optimization Implementation Plan (November 2026)

**Audit Dataset:** Latest SEO Checker Crawl (115 CSV reports, 205 audited URLs, 174 crawl paths)  
**Baseline Git Commit:** `d0f94c85c51b8b02e68a38a7a0ea9e7a894a0000` (`main`)  
**Working Tree Status:** Clean  
**Date:** 03 November 2026  
**Target Platform:** Next.js 16.4.1 (App Router), TypeScript, Tailwind CSS, Vercel Serverless  
**Primary Business Database:** Zoho CRM (v6 API)  

---

## 1. Executive Baseline & Audit Score Summary

| Audit Category | Baseline Score | Target Score | Primary Opportunity Areas |
|---|:---:|:---:|---|
| **Overall** | **93%** | **97%+** | Resolve speed bottlenecks, security headers, image compression, and content hierarchy |
| **Speed** | **83%** | **95%+** | 35 TTFB failures (up to 2,924ms), 32 un-cached image assets, Google Maps iframe redirect |
| **Security** | **90%** | **100%** | Missing `X-Content-Type-Options: nosniff`, HSTS `preload`, CSP, Permissions-Policy, Frame protection, server banner |
| **SEO** | **98%** | **100%** | Missing H1 on `/track-order`, 524KB unoptimized avatar, oversized brand images, 45 query param canonicals |
| **Accessibility** | **100%** | **100%** | Preserve 100% while resolving sequential heading jumps (`h1 > h3`) and unlabeled search/filter inputs |
| **LLM Crawlability** | **100%** | **100%** | Enhance `/llms.txt` and robots.txt crawler clarity for search engines and AI agents |

---

## 2. Comparison with Previous Audit

| Check Metric | October 31 Audit | November 2 Audit | Progress / Current State |
|---|---|---|---|
| **Title Lengths** | 205/205 failed | 205 failed in legacy crawl | Legacy title template was stacked; verified fixed in code, needs fresh crawl recognition. |
| **Product TTFB** | Unchecked | 35 failed (up to 2.9s) | **New High Priority**: Cold start + unmemoized Zoho CRM API calls on product pages. |
| **Image Size Warning** | None reported | `/assets/bazzar-ai-avatar.png` (524 KB) | **New Action**: Heavy avatar asset needs WebP/compression optimization. |
| **Oversized Brand Logo** | None reported | `/assets/brands/roots.png` (3014×1924 px) | **New Action**: Needs responsive downsampling to standard logo dimensions. |
| **Missing H1 on Track Order** | Reported | Still reported on `/track-order` | SSR HTML lacks static H1 when component suspends on client side. |
| **Content Security Policy** | Not enforced | 205/205 failed | Missing in `next.config.ts` / headers. |
| **X-Content-Type-Options** | Missing on 109 | Missing on 265 resources | Next.js headers must apply to static files and dynamic responses. |

---

## 3. Comprehensive Breakdown of All 35 Failed Audit Checks

### Check 1: [ACCESSIBILITY] `use-sequential-headings`

- **Failure Count:** 70 / 205 URLs (`officebazzar.com-accessibility-use-sequential-headings.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags use-sequential-headings based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize use-sequential-headings in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (70 total):**
  - `https://officebazzar.com/request-quote`
  - `https://officebazzar.com/blogs/why-every-workplace-needs-high-quality-industrial-dustbins`
  - `https://officebazzar.com/blogs/top-7-office-hygiene-products-every-corporate-office-should-use`
  - `https://officebazzar.com/products`
  - `https://officebazzar.com/blogs/office-housekeeping-checklist-daily-weekly-monthly-cleaning-guide`
  - *... and 65 additional URLs documented in `officebazzar.com-accessibility-use-sequential-headings.csv`*

### Check 2: [ACCESSIBILITY] `label-form-inputs`

- **Failure Count:** 21 / 205 URLs (`officebazzar.com-accessibility-label-form-inputs.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags label-form-inputs based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize label-form-inputs in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (21 total):**
  - `https://officebazzar.com/products`
  - `https://officebazzar.com/bulk-orders`
  - `https://officebazzar.com/products?brand=officebazzar`
  - `https://officebazzar.com/products?brand=kangaro`
  - `https://officebazzar.com/products?brand=SanDisk`
  - *... and 16 additional URLs documented in `officebazzar.com-accessibility-label-form-inputs.csv`*

### Check 3: [LLM] `can-llms-crawl-website`

- **Failure Count:** 1 / 1 URLs (`officebazzar.com-llm-can-llms-crawl-website.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags can-llms-crawl-website based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize can-llms-crawl-website in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (1 total):**
  - `https://officebazzar.com/robots.txt`

### Check 4: [LLM] `is-llms-txt-present`

- **Failure Count:** 1 / 1 URLs (`officebazzar.com-llm-is-llms-txt-present.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags is-llms-txt-present based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize is-llms-txt-present in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (1 total):**
  - `https://officebazzar.com/`

### Check 5: [SECURITY] `disable-content-sniffing`

- **Failure Count:** 265 / 265 URLs (`officebazzar.com-security-disable-content-sniffing.csv`)
- **Severity:** Medium
- **Root Cause:** X-Content-Type-Options: nosniff header missing from some routes and static assets.
- **Recommended Fix:** Configure X-Content-Type-Options: nosniff globally in next.config.ts headers for all paths /:path*.
- **Files to Modify:** `next.config.ts`
- **Testing Method:** curl -I http://localhost:3000/ and verify header presence.
- **Sample Affected URLs (265 total):**
  - `https://officebazzar.com/`
  - `https://officebazzar.com/robots.txt`
  - `https://officebazzar.com/_next/static/immutable/chunks/0k46l0-jsw7tw.js`
  - `https://officebazzar.com/_next/static/immutable/chunks/38r805wtetg9k.js`
  - `https://officebazzar.com/_next/static/immutable/chunks/33li0wjy6xpgb.js`
  - *... and 260 additional URLs documented in `officebazzar.com-security-disable-content-sniffing.csv`*

### Check 6: [SECURITY] `allow-hsts-preload`

- **Failure Count:** 205 / 205 URLs (`officebazzar.com-security-allow-hsts-preload.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags allow-hsts-preload based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize allow-hsts-preload in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (205 total):**
  - `https://officebazzar.com/`
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/about`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - *... and 200 additional URLs documented in `officebazzar.com-security-allow-hsts-preload.csv`*

### Check 7: [SECURITY] `enable-xss-protection`

- **Failure Count:** 205 / 205 URLs (`officebazzar.com-security-enable-xss-protection.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags enable-xss-protection based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize enable-xss-protection in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (205 total):**
  - `https://officebazzar.com/`
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/about`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - *... and 200 additional URLs documented in `officebazzar.com-security-enable-xss-protection.csv`*

### Check 8: [SECURITY] `restrict-iframe-usage`

- **Failure Count:** 205 / 205 URLs (`officebazzar.com-security-restrict-iframe-usage.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags restrict-iframe-usage based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize restrict-iframe-usage in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (205 total):**
  - `https://officebazzar.com/`
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/about`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - *... and 200 additional URLs documented in `officebazzar.com-security-restrict-iframe-usage.csv`*

### Check 9: [SECURITY] `set-content-security-policy`

- **Failure Count:** 205 / 205 URLs (`officebazzar.com-security-set-content-security-policy.csv`)
- **Severity:** Medium
- **Root Cause:** Standard HTTP security headers (CSP, Permissions-Policy, Referrer-Policy, HSTS preload) not comprehensively declared in next.config.ts.
- **Recommended Fix:** Add complete, safe security headers in next.config.ts without breaking Zoho, Google Maps, or external fonts.
- **Files to Modify:** `next.config.ts`
- **Testing Method:** Inspect HTTP response headers on static and dynamic routes.
- **Sample Affected URLs (205 total):**
  - `https://officebazzar.com/`
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/about`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - *... and 200 additional URLs documented in `officebazzar.com-security-set-content-security-policy.csv`*

### Check 10: [SECURITY] `set-permissions-policy`

- **Failure Count:** 205 / 205 URLs (`officebazzar.com-security-set-permissions-policy.csv`)
- **Severity:** Low
- **Root Cause:** Standard HTTP security headers (CSP, Permissions-Policy, Referrer-Policy, HSTS preload) not comprehensively declared in next.config.ts.
- **Recommended Fix:** Add complete, safe security headers in next.config.ts without breaking Zoho, Google Maps, or external fonts.
- **Files to Modify:** `next.config.ts`
- **Testing Method:** Inspect HTTP response headers on static and dynamic routes.
- **Sample Affected URLs (205 total):**
  - `https://officebazzar.com/`
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/about`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - *... and 200 additional URLs documented in `officebazzar.com-security-set-permissions-policy.csv`*

### Check 11: [SECURITY] `set-referrer-policy`

- **Failure Count:** 205 / 205 URLs (`officebazzar.com-security-set-referrer-policy.csv`)
- **Severity:** Low
- **Root Cause:** Standard HTTP security headers (CSP, Permissions-Policy, Referrer-Policy, HSTS preload) not comprehensively declared in next.config.ts.
- **Recommended Fix:** Add complete, safe security headers in next.config.ts without breaking Zoho, Google Maps, or external fonts.
- **Files to Modify:** `next.config.ts`
- **Testing Method:** Inspect HTTP response headers on static and dynamic routes.
- **Sample Affected URLs (205 total):**
  - `https://officebazzar.com/`
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/about`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - *... and 200 additional URLs documented in `officebazzar.com-security-set-referrer-policy.csv`*

### Check 12: [SECURITY] `hide-server-version-data`

- **Failure Count:** 181 / 274 URLs (`officebazzar.com-security-hide-server-version-data.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags hide-server-version-data based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize hide-server-version-data in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (181 total):**
  - `https://officebazzar.com/category/office-stationery`
  - `https://officebazzar.com/categories`
  - `https://officebazzar.com/category/housekeeping-hygiene`
  - `https://officebazzar.com/products`
  - `https://officebazzar.com/category/printers-technology`
  - *... and 176 additional URLs documented in `officebazzar.com-security-hide-server-version-data.csv`*

### Check 13: [SEO] `use-optimal-length-titles`

- **Failure Count:** 205 / 205 URLs (`officebazzar.com-seo-use-optimal-length-titles.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags use-optimal-length-titles based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize use-optimal-length-titles in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (205 total):**
  - `https://officebazzar.com/`
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/about`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - *... and 200 additional URLs documented in `officebazzar.com-seo-use-optimal-length-titles.csv`*

### Check 14: [SEO] `avoid-thin-content-pages`

- **Failure Count:** 175 / 205 URLs (`officebazzar.com-seo-avoid-thin-content-pages.csv`)
- **Severity:** Low
- **Root Cause:** Contact, FAQ, Careers and some category views have low text word counts (< 300 words).
- **Recommended Fix:** Add helpful B2B procurement guidance, corporate service details, and FAQ accordion content.
- **Files to Modify:** `src/app/contact/page.tsx`, `src/app/faq/page.tsx`, `src/app/careers/page.tsx`
- **Testing Method:** Word count check on page text content (> 350 words).
- **Sample Affected URLs (175 total):**
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - `https://officebazzar.com/request-quote`
  - `https://officebazzar.com/category/office-stationery`
  - *... and 170 additional URLs documented in `officebazzar.com-seo-avoid-thin-content-pages.csv`*

### Check 15: [SEO] `avoid-url-parameters`

- **Failure Count:** 72 / 205 URLs (`officebazzar.com-seo-avoid-url-parameters.csv`)
- **Severity:** Low
- **Root Cause:** Category and search filters use query parameters (?sub=, ?brand=) which were crawled as distinct URLs.
- **Recommended Fix:** Ensure canonical tags point to clean canonical category URLs; keep query URLs noindex, follow where applicable.
- **Files to Modify:** `src/app/category/[slug]/page.tsx`, `src/app/products/page.tsx`
- **Testing Method:** Inspect <link rel="canonical"> in generated HTML for parameterized URLs.
- **Sample Affected URLs (72 total):**
  - `https://officebazzar.com/category/office-stationery?sub=writing-instruments`
  - `https://officebazzar.com/category/office-stationery?sub=paper-notebooks`
  - `https://officebazzar.com/category/office-stationery?sub=cleaning-hygiene-essentials`
  - `https://officebazzar.com/category/office-stationery?sub=files-office-organization`
  - `https://officebazzar.com/category/office-stationery?sub=office-pantry-essentials`
  - *... and 67 additional URLs documented in `officebazzar.com-seo-avoid-url-parameters.csv`*

### Check 16: [SEO] `use-unique-descriptions`

- **Failure Count:** 40 / 166 URLs (`officebazzar.com-seo-use-unique-descriptions.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags use-unique-descriptions based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize use-unique-descriptions in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (40 total):**
  - `https://officebazzar.com/product/kangaro-staplers-hd-10d`
  - `https://officebazzar.com/product/tissue-paper-napkin`
  - `https://officebazzar.com/product/kangaro-staplers-hd-10d-1`
  - `https://officebazzar.com/product/tissue-paper-napkin-1`
  - `https://officebazzar.com/category/office-stationery?sub=writing-instruments`
  - *... and 35 additional URLs documented in `officebazzar.com-seo-use-unique-descriptions.csv`*

### Check 17: [SEO] `use-unique-h1-headings`

- **Failure Count:** 40 / 166 URLs (`officebazzar.com-seo-use-unique-h1-headings.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags use-unique-h1-headings based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize use-unique-h1-headings in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (40 total):**
  - `https://officebazzar.com/product/kangaro-staplers-hd-10d`
  - `https://officebazzar.com/product/tissue-paper-napkin`
  - `https://officebazzar.com/product/kangaro-staplers-hd-10d-1`
  - `https://officebazzar.com/product/tissue-paper-napkin-1`
  - `https://officebazzar.com/category/office-stationery?sub=writing-instruments`
  - *... and 35 additional URLs documented in `officebazzar.com-seo-use-unique-h1-headings.csv`*

### Check 18: [SEO] `use-optimal-length-descriptions`

- **Failure Count:** 38 / 205 URLs (`officebazzar.com-seo-use-optimal-length-descriptions.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags use-optimal-length-descriptions based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize use-optimal-length-descriptions in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (38 total):**
  - `https://officebazzar.com/request-quote`
  - `https://officebazzar.com/categories`
  - `https://officebazzar.com/category/office-stationery?sub=writing-instruments`
  - `https://officebazzar.com/category/office-stationery?sub=paper-notebooks`
  - `https://officebazzar.com/category/office-stationery?sub=cleaning-hygiene-essentials`
  - *... and 33 additional URLs documented in `officebazzar.com-seo-use-optimal-length-descriptions.csv`*

### Check 19: [SEO] `include-pages-in-sitemap`

- **Failure Count:** 36 / 166 URLs (`officebazzar.com-seo-include-pages-in-sitemap.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags include-pages-in-sitemap based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize include-pages-in-sitemap in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (36 total):**
  - `https://officebazzar.com/category/office-stationery?sub=writing-instruments`
  - `https://officebazzar.com/category/office-stationery?sub=paper-notebooks`
  - `https://officebazzar.com/category/office-stationery?sub=cleaning-hygiene-essentials`
  - `https://officebazzar.com/category/office-stationery?sub=files-office-organization`
  - `https://officebazzar.com/category/office-stationery?sub=office-pantry-essentials`
  - *... and 31 additional URLs documented in `officebazzar.com-seo-include-pages-in-sitemap.csv`*

### Check 20: [SEO] `set-open-graph-tags`

- **Failure Count:** 23 / 205 URLs (`officebazzar.com-seo-set-open-graph-tags.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags set-open-graph-tags based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize set-open-graph-tags in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (23 total):**
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/categories`
  - `https://officebazzar.com/products`
  - `https://officebazzar.com/faq`
  - `https://officebazzar.com/products?brand=officebazzar`
  - *... and 18 additional URLs documented in `officebazzar.com-seo-set-open-graph-tags.csv`*

### Check 21: [SEO] `are-file-sizes-large`

- **Failure Count:** 19 / 32 URLs (`officebazzar.com-seo-are-file-sizes-large.csv`)
- **Severity:** High
- **Root Cause:** Large uncompressed assets such as /assets/bazzar-ai-avatar.png (524 KB) and hero collage JPGs (400–570 KB) served without modern WebP compression.
- **Recommended Fix:** Convert /assets/bazzar-ai-avatar.png and hero collage images to optimized WebP, target < 100 KB while preserving retina quality.
- **Files to Modify:** `public/assets/bazzar-ai-avatar.png`, `public/images/hero-collage/*`, `next.config.ts`
- **Testing Method:** Inspect file sizes via fs.statSync; verify visual clarity via image inspection.
- **Sample Affected URLs (19 total):**
  - `https://officebazzar.com/images/hero-collage/pen-stand.jpg`
  - `https://officebazzar.com/images/hero-collage/carton-box.jpg`
  - `https://officebazzar.com/images/hero-collage/colored-pens.jpg`
  - `https://officebazzar.com/images/hero-collage/copy-paper.jpg`
  - `https://officebazzar.com/images/hero-collage/green-bin.jpg`
  - *... and 14 additional URLs documented in `officebazzar.com-seo-are-file-sizes-large.csv`*

### Check 22: [SEO] `avoid-orphan-pages`

- **Failure Count:** 10 / 130 URLs (`officebazzar.com-seo-avoid-orphan-pages.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags avoid-orphan-pages based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize avoid-orphan-pages in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (10 total):**
  - `https://officebazzar.com/bulk-orders`
  - `https://officebazzar.com/faq`
  - `https://officebazzar.com/cancellation-policy`
  - `https://officebazzar.com/blogs/how-to-choose-the-best-office-stationery-supplier-in-chennai`
  - `https://officebazzar.com/blogs/complete-guide-to-housekeeping-products-for-offices-and-commercial-buildings`
  - *... and 5 additional URLs documented in `officebazzar.com-seo-avoid-orphan-pages.csv`*

### Check 23: [SEO] `use-unique-titles`

- **Failure Count:** 4 / 166 URLs (`officebazzar.com-seo-use-unique-titles.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags use-unique-titles based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize use-unique-titles in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (4 total):**
  - `https://officebazzar.com/product/kangaro-staplers-hd-10d`
  - `https://officebazzar.com/product/tissue-paper-napkin`
  - `https://officebazzar.com/product/kangaro-staplers-hd-10d-1`
  - `https://officebazzar.com/product/tissue-paper-napkin-1`

### Check 24: [SEO] `use-optimal-length-h1-headings`

- **Failure Count:** 2 / 205 URLs (`officebazzar.com-seo-use-optimal-length-h1-headings.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags use-optimal-length-h1-headings based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize use-optimal-length-h1-headings in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (2 total):**
  - `https://officebazzar.com/track-order`
  - `https://officebazzar.com/blogs/complete-guide-to-housekeeping-products-for-offices-and-commercial-buildings`

### Check 25: [SEO] `are-resolutions-too-high`

- **Failure Count:** 1 / 32 URLs (`officebazzar.com-seo-are-resolutions-too-high.csv`)
- **Severity:** Low
- **Root Cause:** /assets/brands/roots.png is 3014 × 1924 px for a tiny brand logo slot.
- **Recommended Fix:** Downsample roots.png to 400x256 px WebP/PNG and serve responsive srcset.
- **Files to Modify:** `public/assets/brands/roots.png`
- **Testing Method:** sharp(file).metadata() confirms dimensions <= 600px width.
- **Sample Affected URLs (1 total):**
  - `https://officebazzar.com/assets/brands/roots.png`

### Check 26: [SEO] `set-h1-headings`

- **Failure Count:** 1 / 205 URLs (`officebazzar.com-seo-set-h1-headings.csv`)
- **Severity:** Medium
- **Root Cause:** /track-order loaded its H1 inside a client-side Suspense boundary, so initial SSR HTML had no <h1> tag.
- **Recommended Fix:** Render static <h1>Track Your Order</h1> in the server component shell outside Suspense.
- **Files to Modify:** `src/app/track-order/page.tsx`
- **Testing Method:** curl https://localhost:3000/track-order | grep "<h1"
- **Sample Affected URLs (1 total):**
  - `https://officebazzar.com/track-order`

### Check 27: [SEO] `use-one-h1-heading-per-page`

- **Failure Count:** 1 / 205 URLs (`officebazzar.com-seo-use-one-h1-heading-per-page.csv`)
- **Severity:** Low
- **Root Cause:** /track-order loaded its H1 inside a client-side Suspense boundary, so initial SSR HTML had no <h1> tag.
- **Recommended Fix:** Render static <h1>Track Your Order</h1> in the server component shell outside Suspense.
- **Files to Modify:** `src/app/track-order/page.tsx`
- **Testing Method:** curl https://localhost:3000/track-order | grep "<h1"
- **Sample Affected URLs (1 total):**
  - `https://officebazzar.com/track-order`

### Check 28: [SEO] `use-short-urls`

- **Failure Count:** 1 / 205 URLs (`officebazzar.com-seo-use-short-urls.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags use-short-urls based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize use-short-urls in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (1 total):**
  - `https://officebazzar.com/blogs/complete-guide-to-housekeeping-products-for-offices-and-commercial-buildings`

### Check 29: [SPEED] `avoid-inline-javascript`

- **Failure Count:** 205 / 205 URLs (`officebazzar.com-speed-avoid-inline-javascript.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags avoid-inline-javascript based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize avoid-inline-javascript in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (205 total):**
  - `https://officebazzar.com/`
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/about`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - *... and 200 additional URLs documented in `officebazzar.com-speed-avoid-inline-javascript.csv`*

### Check 30: [SPEED] `avoid-resource-redirects`

- **Failure Count:** 205 / 205 URLs (`officebazzar.com-speed-avoid-resource-redirects.csv`)
- **Severity:** Low
- **Root Cause:** Google Maps iframe in Footer.tsx points to http://maps.google.com/maps?... which 301-redirects to https://www.google.com/maps?...
- **Recommended Fix:** Update iframe src in Footer.tsx directly to https://www.google.com/maps/embed?...
- **Files to Modify:** `src/components/layout/Footer.tsx`
- **Testing Method:** Verify network tab has 0 redirects for the maps embed.
- **Sample Affected URLs (205 total):**
  - `https://officebazzar.com/`
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/about`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - *... and 200 additional URLs documented in `officebazzar.com-speed-avoid-resource-redirects.csv`*

### Check 31: [SPEED] `defer-javascript-loading`

- **Failure Count:** 205 / 205 URLs (`officebazzar.com-speed-defer-javascript-loading.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags defer-javascript-loading based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize defer-javascript-loading in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (205 total):**
  - `https://officebazzar.com/`
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/about`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - *... and 200 additional URLs documented in `officebazzar.com-speed-defer-javascript-loading.csv`*

### Check 32: [SPEED] `optimize-ttfb`

- **Failure Count:** 35 / 205 URLs (`officebazzar.com-speed-optimize-ttfb.csv`)
- **Severity:** High
- **Root Cause:** Product pages and category listings execute multiple sequential, unmemoized calls to Zoho CRM APIs and lack edge/ISR caching. On Vercel serverless cold starts, token verification and paginated product syncing add 2.2s–2.9s latency.
- **Recommended Fix:** Implement React cache() request-memoization, add unstable_cache / ISR caching with revalidation, parallelize independent database lookups, and add request timeouts.
- **Files to Modify:** `src/app/product/[slug]/page.tsx`, `src/lib/db/store.ts`, `src/lib/zoho/products.ts`, `src/lib/zoho/client.ts`
- **Testing Method:** Measure local and production TTFB with curl and Lighthouse; verify response time is < 500ms.
- **Sample Affected URLs (35 total):**
  - `https://officebazzar.com/blogs`
  - `https://officebazzar.com/about`
  - `https://officebazzar.com/contact`
  - `https://officebazzar.com/careers`
  - `https://officebazzar.com/request-quote`
  - *... and 30 additional URLs documented in `officebazzar.com-speed-optimize-ttfb.csv`*

### Check 33: [SPEED] `use-long-caching-times`

- **Failure Count:** 32 / 57 URLs (`officebazzar.com-speed-use-long-caching-times.csv`)
- **Severity:** Low
- **Root Cause:** Static images and logos in /images/ served without explicit Cache-Control headers.
- **Recommended Fix:** Add Cache-Control: public, max-age=31536000, immutable for /images/* and /assets/* in next.config.ts.
- **Files to Modify:** `next.config.ts`
- **Testing Method:** curl -I http://localhost:3000/images/... and check Cache-Control header.
- **Sample Affected URLs (32 total):**
  - `https://officebazzar.com/images/officebazzar-logo-transparent.png`
  - `https://officebazzar.com/images/hero-collage/pen-stand.jpg`
  - `https://officebazzar.com/images/hero-collage/carton-box.jpg`
  - `https://officebazzar.com/images/hero-collage/colored-pens.jpg`
  - `https://officebazzar.com/images/hero-collage/copy-paper.jpg`
  - *... and 27 additional URLs documented in `officebazzar.com-speed-use-long-caching-times.csv`*

### Check 34: [SPEED] `avoid-internal-link-redirects`

- **Failure Count:** 1 / 205 URLs (`officebazzar.com-speed-avoid-internal-link-redirects.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags avoid-internal-link-redirects based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize avoid-internal-link-redirects in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (1 total):**
  - `https://officebazzar.com/categories`

### Check 35: [SPEED] `minify-files`

- **Failure Count:** 1 / 25 URLs (`officebazzar.com-speed-minify-files.csv`)
- **Severity:** Low
- **Root Cause:** Audit flags minify-files based on automated crawler heuristics.
- **Recommended Fix:** Review and optimize minify-files in application code.
- **Files to Modify:** `src/lib/seo/config.ts`, `next.config.ts`
- **Testing Method:** Code review and automated test validation.
- **Sample Affected URLs (1 total):**
  - `https://officebazzar.com/_next/static/immutable/chunks/1nmtffg-szbie.js`

---

## 4. Phase-by-Phase Implementation Roadmap

1. **Phase 2 – Product Page Performance (Top Priority)**:
   - React `cache()` request memoization in `src/lib/db/store.ts`.
   - Next.js `unstable_cache` / ISR for product catalog and product detail pages (`revalidate = 3600`).
   - SWR (stale-while-revalidate) background sync for Zoho CRM product updates.
   - Timeout and fallback error handling in `src/lib/zoho/client.ts`.

2. **Phase 3 – JavaScript & Next.js Optimization**:
   - Dynamic imports for heavy non-critical components (CartDrawer, QuotationModal, BazzarAI widget).
   - Server Component isolation for product descriptions and specs.
   - Remove unused dependencies / code.

3. **Phase 4 – Image Optimization**:
   - Compress `/assets/bazzar-ai-avatar.png` from 524 KB to < 60 KB WebP.
   - Resize `/assets/brands/roots.png` from 3014px to 400px.
   - Compress hero collage JPGs into optimized WebP.

4. **Phase 5 – Content & H1**:
   - Add permanent SSR `<h1>Track Your Order</h1>` to `/track-order`.
   - Enrich thin-content pages (`/contact`, `/faq`, `/careers`) with genuine B2B procurement information.

5. **Phase 6 – URL & Canonical Strategy**:
   - Enforce clean canonical URLs on parameterized routes (`?sub=`, `?brand=`).
   - Verify internal links in navigation and footer.

6. **Phase 7 – Security Headers**:
   - Add `X-Content-Type-Options: nosniff`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy` in `next.config.ts`.

7. **Phase 8 – Cache Optimization**:
   - Configure immutable `Cache-Control` for `/assets/*` and `/images/*`.

8. **Phase 9 – SEO & Structured Data**:
   - Validate BreadcrumbList, Product JSON-LD, Organization JSON-LD, and approved Homepage metadata.

9. **Phase 10 – LLM Crawlability**:
   - Enhance `public/llms.txt` and robots.txt.

10. **Phase 11 & 12 – Final Validation & Reporting**:
    - `npx tsc --noEmit` + `npm run build`.
    - Generate `seo_optimization_final_report.md`.
