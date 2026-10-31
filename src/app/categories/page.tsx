import React from 'react';
import { redirect } from 'next/navigation';
import { getProducts } from '@/lib/db/store';
import {
  NINE_SUBCATEGORIES,
  isProductInSubcategory,
} from '@/lib/data/catalog';
import AllCategoriesClient from '@/components/category/AllCategoriesClient';
import { getCanonicalUrl, SITE_CONFIG } from '@/lib/seo/config';
import { Subcategory } from '@/types';

export const ALL_PRODUCTS_CARD: Subcategory = {
  id: 'all-products',
  name: 'All Products',
  slug: 'all-products',
  categoryId: 'all',
  description: 'Browse our complete workplace catalogue across all 9 categories with direct wholesale pricing and GST input credit.',
  imageUrl: '/images/categories/office-supplies-stationery.jpg',
  itemCount: 0,
};

export async function generateMetadata() {
  const metaTitle = 'All Categories & Products | Workplace Procurement | OfficeBazzar Chennai';
  const metaDescription =
    'Explore our complete workplace procurement catalog and 9 specialized categories at OfficeBazzar: All Products, Writing Instruments, Paper & Notebooks, Files & Office Organization, Printing & IT Supplies, Cleaning & Hygiene Essentials, Packaging & Dispatch, Office Pantry Essentials, Office Furniture & Accessories, and Safety & Maintenance.';
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

  // 1. Fetch products
  const { products: allProducts } = await getProducts();

  // 2. The 10 cards: All Products first, followed by the 9 categories
  const categories = [ALL_PRODUCTS_CARD, ...NINE_SUBCATEGORIES];

  // 3. Compute accurate product counts based on actual active products
  const productCounts: Record<string, number> = {};
  categories.forEach((sub) => {
    const count = allProducts.filter((p) => isProductInSubcategory(p, sub.slug)).length;
    const resolvedCount = count > 0 ? count : (sub.itemCount || 0);
    productCounts[sub.id] = resolvedCount;
    productCounts[sub.slug] = resolvedCount;
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
