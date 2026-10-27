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
  let title = 'All Products & Wholesale Catalogue | OfficeBazzar Chennai';
  let description =
    'Browse our comprehensive catalog of 8000+ corporate office supplies, stationery, Diversey Taski chemicals, mobile dustbins, and toner cartridges in Chennai with 100% GST ITC.';

  if (resolved?.query) {
    title = `Search results for "${resolved.query}" | OfficeBazzar Products`;
    description = `Explore wholesale pricing and bulk packaging for ${resolved.query} at OfficeBazzar India.`;
  }

  const canonicalUrl = getCanonicalUrl('/products');

  return {
    title,
    description,
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
  const { products } = await getProducts();
  const allCategories = await getCategories();
  const categories = APPROVED_CATEGORIES.map((slug) =>
    allCategories.find((c) => c.slug === slug)
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const brands = await getBrands();

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <JsonLd data={breadcrumbJsonLd} />
      <ProductListingClient
        initialProducts={products}
        categories={categories}
        brands={brands}
        initialQuery={resolvedSearchParams.query}
        initialCategorySlug={resolvedSearchParams.category}
        initialSubcategorySlug={resolvedSearchParams.sub}
        initialBrandSlug={resolvedSearchParams.brand}
        showAllCategoriesHeader
      />
    </main>
  );
}
