import React from 'react';
import { getCategories, getProducts } from '@/lib/db/store';
import { CATEGORY_MAP } from '@/lib/data/catalog';
import ShopPageClient from '@/components/shop/ShopPageClient';
import { getCanonicalUrl, SITE_CONFIG } from '@/lib/seo/config';

export async function generateMetadata() {
  const metaTitle = 'Shop Workplace Solutions | Corporate Procurement | OfficeBazzar Chennai';
  const metaDescription =
    'Browse our complete range of corporate office supplies, housekeeping chemicals, technology consumables, and packaging materials at wholesale rates.';
  const canonical = getCanonicalUrl('/shop');

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonical,
      siteName: SITE_CONFIG.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
    },
  };
}

const APPROVED_CATEGORIES = [
  'office-stationery',
  'housekeeping-hygiene',
  'printers-technology',
  'packaging-supplies',
];

export default async function ShopPage() {
  // 1. Fetch products and calculate accurate counts and brand counts
  const { products: allProducts } = await getProducts();
  const allCategories = await getCategories();

  // 2. Strictly filter to the 4 approved categories
  const categories = APPROVED_CATEGORIES.map((slug) =>
    allCategories.find((c) => c.slug === slug)
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));

  // 3. Compute accurate product counts & distinct brand counts
  const categoryStats: Record<string, { productCount: number; brandCount: number }> = {};
  categories.forEach((cat) => {
    const catProducts = allProducts.filter((p) => {
      if (!p.isActive) return false;
      if (p.categoryId === cat.id || p.categoryId === cat.slug) return true;
      if (p.categoryName?.toLowerCase() === cat.name.toLowerCase()) return true;
      const mapped = CATEGORY_MAP[p.subcategoryId || ''] || CATEGORY_MAP[p.categoryId || ''];
      if (mapped && (mapped.mainId === cat.id || mapped.mainSlug === cat.slug)) {
        return true;
      }
      return false;
    });

    const distinctBrands = new Set(
      catProducts.map((p) => p.brandName || p.brandId).filter(Boolean)
    );

    const productCount = catProducts.length || cat.itemCount || 0;
    const brandCount = distinctBrands.size || 5;

    categoryStats[cat.id] = { productCount, brandCount };
    categoryStats[cat.slug] = categoryStats[cat.id];
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <ShopPageClient
        categories={categories}
        categoryStats={categoryStats}
      />
    </main>
  );
}
