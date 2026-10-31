import React from 'react';
import ProductListingClient from '@/components/product/ProductListingClient';
import { getProducts, getCategories, getBrands } from '@/lib/db/store';
import { getCanonicalUrl, getBreadcrumbJsonLd, SITE_CONFIG } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string; brand?: string; sub?: string }>;
}) {
  const resolved = await searchParams;
  let title = 'Office Supplies & Corporate Procurement Catalogue India | Office Bazzar';
  let description =
    'Browse the complete Office Bazzar B2B catalogue of office stationery, housekeeping & hygiene products, printer consumables, and packaging materials for corporate procurement across India.';

  if (resolved?.query) {
    title = `Search Results for "${resolved.query}" | Office Bazzar Catalogue`;
    description = `Explore corporate bulk procurement and wholesale packaging for ${resolved.query} at Office Bazzar India.`;
  }

  const canonicalUrl = getCanonicalUrl('/products');

  return {
    title: {
      absolute: title,
    },
    description,
    keywords: SITE_CONFIG.primaryKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

const APPROVED_CATEGORIES = [
  'office-stationery',
  'housekeeping-hygiene',
  'printers-technology',
  'packaging-supplies',
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string; brand?: string; sub?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { products } = await getProducts({ limit: 1000 });
  const allCategories = await getCategories();
  const categories = APPROVED_CATEGORIES.map((slug) =>
    allCategories.find((c) => c.slug === slug)
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const brands = await getBrands();

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'All Products', url: '/products' },
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <JsonLd data={breadcrumbJsonLd} />
      <ProductListingClient
        initialProducts={products}
        categories={categories}
        brands={brands}
        initialQuery={resolvedSearchParams?.query}
        initialCategorySlug={resolvedSearchParams?.category}
        initialSubcategorySlug={resolvedSearchParams?.sub}
        initialBrandSlug={resolvedSearchParams?.brand}
      />
    </main>
  );
}
