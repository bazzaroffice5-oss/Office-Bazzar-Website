import React from 'react';
import { redirect } from 'next/navigation';
import { getCategories, getProducts } from '@/lib/db/store';
import {
  CATEGORY_MAP,
  APPROVED_CATEGORIES,
  NINE_SUBCATEGORIES,
  isProductInSubcategory,
} from '@/lib/data/catalog';
import AllCategoriesClient from '@/components/category/AllCategoriesClient';
import { getCanonicalUrl, SITE_CONFIG } from '@/lib/seo/config';

export async function generateMetadata() {
  const metaTitle = 'All Categories | Workplace Procurement | OfficeBazzar Chennai';
  const metaDescription =
    'Explore all 4 core procurement divisions and 9 specialized workplace categories at OfficeBazzar: Writing Instruments, Paper & Notebooks, Files & Office Organization, Printing & IT Supplies, Cleaning & Hygiene Essentials, Packaging & Dispatch, Pantry, Furniture, and Safety.';
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

  // 1. Fetch products and categories
  const { products: allProducts } = await getProducts();
  const allCategories = await getCategories();

  // 2. The 4 approved main categories
  const categories = APPROVED_CATEGORIES.map((slug) =>
    allCategories.find((c) => c.slug === slug || c.id === slug)
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));

  // 3. The 9 specialized categories
  const subcategories = NINE_SUBCATEGORIES;

  // 4. Compute accurate product counts for main categories AND subcategories
  const productCounts: Record<string, number> = {};

  // Counts for 4 main categories
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
    productCounts[cat.id] = count;
    productCounts[cat.slug] = count;
  });

  // Counts for 9 subcategories
  subcategories.forEach((sub) => {
    const count = allProducts.filter((p) => isProductInSubcategory(p, sub.slug)).length;
    productCounts[sub.id] = count;
    productCounts[sub.slug] = count;
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <AllCategoriesClient
        categories={categories}
        subcategories={subcategories}
        productCounts={productCounts}
      />
    </main>
  );
}
