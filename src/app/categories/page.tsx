import React from 'react';
import { redirect } from 'next/navigation';
import { getProducts } from '@/lib/db/store';
import {
  NINE_SUBCATEGORIES,
  isProductInSubcategory,
} from '@/lib/data/catalog';
import AllCategoriesClient from '@/components/category/AllCategoriesClient';
import { getCanonicalUrl, getBreadcrumbJsonLd, SITE_CONFIG, formatSeoTitle } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';
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
  const metaTitle = formatSeoTitle('Workplace Procurement Categories');
  const metaDescription =
    'Explore Office Bazzar workplace procurement categories: Office Stationery, Housekeeping & Hygiene, Printers & Technology, and Packaging Supplies across India.';
  const canonical = getCanonicalUrl('/categories');
  const ogImageUrl = `${SITE_CONFIG.url}${SITE_CONFIG.defaultOgImage}`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonical,
      siteName: SITE_CONFIG.name,
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [ogImageUrl],
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
    redirect(`/category/${targetSlug}${query}`);
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
      <JsonLd data={getBreadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: 'All Categories', url: '/categories' }])} />
      <AllCategoriesClient
        categories={categories}
        productCounts={productCounts}
      />
    </main>
  );
}
