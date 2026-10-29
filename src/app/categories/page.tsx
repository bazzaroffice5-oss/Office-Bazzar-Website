import React from 'react';
import { redirect } from 'next/navigation';
import { getCategories, getProducts } from '@/lib/db/store';
import { CATEGORY_MAP, APPROVED_CATEGORIES } from '@/lib/data/catalog';
import AllCategoriesClient from '@/components/category/AllCategoriesClient';
import { getCanonicalUrl, SITE_CONFIG } from '@/lib/seo/config';

export async function generateMetadata() {
  const metaTitle = 'All Categories | Workplace Procurement | OfficeBazzar Chennai';
  const metaDescription =
    'Explore all 4 corporate procurement categories at OfficeBazzar: Office Stationery, Housekeeping & Hygiene, Printers & Technology, and Packaging Supplies.';
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

  // 2. Filter and order strictly to the 9 approved categories
  const categories = APPROVED_CATEGORIES.map((slug) =>
    allCategories.find((c) => c.slug === slug || c.id === slug)
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));

  // 3. Compute accurate product counts based on actual active products
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
      if (cat.id === 'files-office-organization' && (p.categoryId === 'office-stationery' || mapped?.mainId === 'office-stationery')) {
        return true;
      }
      if (cat.id === 'printing-it-supplies' && (p.categoryId === 'printers-technology' || mapped?.mainId === 'printers-technology')) {
        return true;
      }
      if (cat.id === 'packaging-dispatch' && (p.categoryId === 'packaging-supplies' || mapped?.mainId === 'packaging-supplies')) {
        return true;
      }
      return false;
    }).length;
    productCounts[cat.id] = count;
    productCounts[cat.slug] = count;
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
