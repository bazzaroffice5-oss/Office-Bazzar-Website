import React from 'react';
import { redirect } from 'next/navigation';
import { getCategories, getProducts } from '@/lib/db/store';
import { CATEGORY_MAP } from '@/lib/data/catalog';
import AllCategoriesClient from '@/components/category/AllCategoriesClient';
import { getCanonicalUrl, SITE_CONFIG } from '@/lib/seo/config';

export async function generateMetadata() {
  const metaTitle = 'All Categories | Workplace Procurement | OfficeBazzar Chennai';
  const metaDescription =
    'Explore all 4 corporate procurement categories at OfficeBazzar: Office Stationery, Housekeeping Chemicals & Hygiene, Printers & Technology, and Packaging Supplies.';
  const canonical = getCanonicalUrl('/categories');

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

export default async function AllCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; sub?: string; view?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  // Handle legacy query params by redirecting to category-specific landing page
  if (resolvedSearchParams?.category) {
    const targetSlug = resolvedSearchParams.category;
    const subQuery = resolvedSearchParams.sub ? `?sub=${resolvedSearchParams.sub}` : '';
    const viewQuery = resolvedSearchParams.view ? `?view=${resolvedSearchParams.view}` : '';
    const query = subQuery || viewQuery;
    redirect(`/categories/${targetSlug}${query}`);
  }

  // 1. Fetch products and calculate accurate counts per category
  const { products: allProducts } = await getProducts();
  const allCategories = await getCategories();

  // 2. Strictly filter to the 4 approved categories
  const categories = APPROVED_CATEGORIES.map((slug) =>
    allCategories.find((c) => c.slug === slug)
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));

  // 3. Compute accurate product counts (including subcategory assignments)
  const productCounts: Record<string, number> = {};
  categories.forEach((cat) => {
    const count = allProducts.filter((p) => {
      if (!p.isActive) return false;
      if (p.categoryId === cat.id || p.categoryId === cat.slug) return true;
      if (p.categoryName?.toLowerCase() === cat.name.toLowerCase()) return true;
      const mapped = CATEGORY_MAP[p.subcategoryId || ''] || CATEGORY_MAP[p.categoryId || ''];
      if (mapped && (mapped.mainId === cat.id || mapped.mainSlug === cat.slug)) {
        return true;
      }
      return false;
    }).length;
    productCounts[cat.id] = count || cat.itemCount || 0;
    productCounts[cat.slug] = productCounts[cat.id];
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <AllCategoriesClient
        categories={categories}
        productCounts={productCounts}
      />
    </main>
  );
}
