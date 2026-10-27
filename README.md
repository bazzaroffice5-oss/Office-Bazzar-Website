# OfficeBazzar — Dynamic E-Commerce Platform

Production-ready enterprise e-commerce platform built for **OfficeBazzar E-Store Private Limited** (Royapettah, Chennai). Designed following the comprehensive information architecture, multi-tiered navigation, and product discovery patterns of **Moglix**, while retaining authentic OfficeBazzar corporate branding, verified 18% GST Input Tax Credit compliant invoicing, and real South Indian procurement logistics.

---

## 🏢 Company Profile & Credentials

- **Company Name:** OFFICEBAZZAR E-STORE PRIVATE LIMITED
- **Logistics Hub & HQ:** "Officebazzar Tower", No. 29/15, Subbedar Hussain Street, Royapettah, Chennai, Tamil Nadu - 600014
- **Phone:** +91 72008 00040 / +91 78258 86622
- **Email:** sales4@officebazzar.com / dm@officebazzar.com
- **Operational Heritage:** 17+ years in enterprise procurement (Est. 2007)
- **Key Offerings:** Office stationery, copier paper, commercial housekeeping chemicals (Diversey Taski), heavy duty hardware (Kangaro, Bambalio), printer consumables (HP), packaging tapes, and industrial waste bins.

---

## 🚀 Key Features

### 1. Moglix-Inspired Shopping Experience
- **Multi-Level Navigation Header:**
  - Announcement bar with customizable promos and corporate contact.
  - Indian PIN code delivery location estimator (Same-Day Royapettah / 1-2 day TN / 2-4 day pan-India).
  - Omnichannel search bar with real-time live product autosuggestions and category dropdown.
  - Quick action shortcuts for Track Order, Wishlist badge, Account drawer, and live Cart count.
- **Mega Menu Category Bar:** Deep-dive dropdown covering 6 primary divisions and 18 specialized subcategories.

### 2. High-Performance Product Catalogue
- **Faceted Product Discovery (`/products` and `/category/[slug]`):**
  - Instant filtering by Category, Subcategory, Brand, Price range slider, and In-Stock toggle.
  - Dynamic sorting (Relevance, Price Low-High, Price High-Low, Customer Rating).
  - Reusable product cards with MRP discounts, 18% GST notices, wishlist toggle, and quick add-to-cart.
- **Interactive Product Details (`/product/[slug]`):**
  - Multi-angle image gallery with thumbnail preview.
  - Real-time stock status, bulk pack size indicators, and quantity steppers.
  - Dedicated "Request Corporate Quotation (RFQ)" action.
  - Complete technical specifications table and related item recommendations.
  - JSON-LD Structured Data for search engine rich snippets.

### 3. Shopping Cart & Verified Indian Checkout
- **Slide-Over Cart Drawer & Dedicated Checkout:**
  - Free shipping progress indicator (Threshold: ₹999).
  - Active coupon discount verification (`WELCOME100`, `OFFICE10`, `CORP500`, `BULK5`).
  - Automatic 18% GST calculation (CGST + SGST for TN, IGST for interstate).
  - Validation of customer business name and 15-digit Corporate GSTIN for Input Tax Credit (ITC).
  - Flexible payment options: Secure Online Gateway (Razorpay), Direct NEFT/RTGS Bank Transfer, and Cash on Delivery.

### 4. Admin Management Console (`/admin`)
- Accessible management dashboard without editing code:
  - **Overview Analytics:** Total revenue, order count, active SKUs, and pending RFQs.
  - **Product Management:** Create, edit, and deactivate products with live image preview and specs editor.
  - **Order Fulfilment:** Update order state (Pending, Confirmed, Shipped, Delivered, Cancelled) and assign courier AWB numbers.
  - **Corporate Bulk RFQ Manager:** Review and quote institutional quotation submissions.
  - **Validated CSV Import/Export:** Download catalog CSV or upload bulk SKU spreadsheets.

### 5. Corporate Account & Shipment Tracking
- **Order Tracking (`/track-order`):** Visual 4-stage shipment milestone stepper with Blue Dart AWB integration.
- **Customer Profile (`/account`):** Saved delivery addresses, corporate GSTIN management, and order history.
- **Dedicated RFQ Portal (`/bulk-orders`):** Institutional procurement calculator and quotation submission.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16.4.1 (App Router with Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3
- **Icons:** Lucide React
- **Database:** Supabase PostgreSQL with in-memory stateful repository fallback
- **Payments:** Razorpay corporate payment gateway integration architecture

---

## 📂 Project Structure

```
├── public/                 # Static assets and icons
├── supabase/
│   └── schema.sql          # 10 relational tables, indexes, and RLS policies
├── src/
│   ├── app/                # App Router pages and API routes
│   │   ├── (catalog)       # /products, /category/[slug], /product/[slug]
│   │   ├── (checkout)      # /checkout, /order-success/[orderId]
│   │   ├── (account)       # /account, /wishlist, /track-order
│   │   ├── (corporate)     # /bulk-orders, /about, /contact, /faq
│   │   ├── (legal)         # /terms, /privacy-policy, /shipping-policy, /returns-refunds
│   │   ├── (content)       # /blog, /blog/[slug]
│   │   ├── admin/          # /admin management console
│   │   ├── api/orders/     # Server-side order creation & validation
│   │   ├── sitemap.ts      # Automated XML sitemap
│   │   └── robots.ts       # Search engine crawler directives
│   ├── components/         # Modular reusable components
│   │   ├── admin/          # Admin dashboard & management modals
│   │   ├── cart/           # Cart drawer & line item components
│   │   ├── home/           # Homepage sections (Hero, Bestsellers, RFQ, etc.)
│   │   ├── layout/         # Header, MegaMenu, TopBar, Footer
│   │   ├── modals/         # PinCodeModal, RFQModal
│   │   └── product/        # ProductCard, ProductListing, ProductDetail
│   ├── context/            # React state providers (Cart, Wishlist, Auth, Location)
│   ├── lib/
│   │   ├── data/           # Authentic OfficeBazzar catalog, categories & blogs
│   │   └── db/             # Supabase client & in-memory stateful repository
│   └── types/              # Comprehensive TypeScript interfaces
```

---

## ⚡ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Note: The application includes a self-contained in-memory database store, meaning it runs immediately with full stateful functionality without requiring Supabase or Razorpay credentials).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🔒 Security & Statutory Invoicing
- **18% GST Input Tax Credit (ITC):** Every invoice mathematically computes taxable base amounts, CGST (9%), SGST (9%), or IGST (18%) alongside appropriate HSN codes.
- **Idempotent Order Handling:** Orders generate unique sequential references (`OB-2026-XXXXXX`) and decrement warehouse stock in real time.
- **Server-Side Protection:** Admin routes and order creation APIs validate payload structures and prevent unauthorized state tampering.

---

© 2026 **OfficeBazzar E-Store Private Limited**. All rights reserved.
