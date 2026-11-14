import React from 'react';
import ProductListingClient from '@/components/product/ProductListingClient';
import { getProducts, getCategories, getBrands, getCatalogFilterMetadata } from '@/lib/db/store';
import { FilterParams } from '@/types';
import { getCanonicalUrl, getBreadcrumbJsonLd, SITE_CONFIG, formatSeoTitle } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string; brand?: string; sub?: string; page?: string; sort?: string }>;
}) {
  const resolved = await searchParams;
  const parsedPage = resolved?.page ? parseInt(resolved.page, 10) : 1;
  const isPaginated = !isNaN(parsedPage) && parsedPage > 1;

  let rawTitle = 'Corporate Office Supplies & B2B Catalogue';
  let description =
    'Browse 100+ verified corporate office stationery, housekeeping chemicals, printer toners, tissue napkins, and packaging supplies with bulk GST billing in India.';

  if (resolved?.brand) {
    const cleanBrand = resolved.brand.replace(/^brand-/, '').replace(/-/g, ' ');
    const brandTitle = cleanBrand.replace(/\b\w/g, (c) => c.toUpperCase());
    rawTitle = `${brandTitle} Office & Facility Supplies`;
    description = `Explore genuine ${brandTitle} corporate supplies, office stationery, and facility products at Office Bazzar. Request bulk B2B quotes with GST billing across India.`;
  } else if (resolved?.query) {
    rawTitle = `Search: "${resolved.query}" - Corporate Supplies`;
    description = `Explore wholesale pricing and bulk corporate packaging for "${resolved.query}" at Office Bazzar with 100% GST input tax credit across India.`;
  }

  if (isPaginated) {
    rawTitle = `${rawTitle} - Page ${parsedPage}`;
  }

  const title = formatSeoTitle(rawTitle);
  const canonicalPath = isPaginated ? `/products?page=${parsedPage}` : '/products';
  const canonicalUrl = getCanonicalUrl(canonicalPath);
  const ogImageUrl = `${SITE_CONFIG.url}${SITE_CONFIG.defaultOgImage}`;

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
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
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
  searchParams: Promise<{ query?: string; category?: string; brand?: string; sub?: string; page?: string; sort?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const parsedPage = resolvedSearchParams?.page ? parseInt(resolvedSearchParams.page, 10) : 1;
  const currentPage = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = 24;

  const [filterMetadata, { products: paginatedProducts, total: totalProducts }, allCategories, brands] =
    await Promise.all([
      getCatalogFilterMetadata(),
      getProducts({
        query: resolvedSearchParams?.query,
        category: resolvedSearchParams?.category,
        subcategory: resolvedSearchParams?.sub,
        brand: resolvedSearchParams?.brand,
        sortBy: resolvedSearchParams?.sort as FilterParams['sortBy'],
        page: currentPage,
        limit,
      }),
      getCategories(),
      getBrands(),
    ]);

  const categories = APPROVED_CATEGORIES.map((slug) =>
    allCategories.find((c) => c.slug === slug)
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));

  const totalPages = Math.max(1, Math.ceil(totalProducts / limit));

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'All Products', url: '/products' },
  ]);

  return (
    <main className="min-h-screen bg-[#F5FAF6]">
      <JsonLd data={breadcrumbJsonLd} />
      <ProductListingClient
        initialProducts={paginatedProducts}
        totalProducts={totalProducts}
        currentPage={currentPage}
        totalPages={totalPages}
        categories={categories}
        brands={brands}
        availableBrands={filterMetadata.availableBrands}
        categoryCounts={filterMetadata.categoryCounts}
        subcategoryCounts={filterMetadata.subcategoryCounts}
        brandCounts={filterMetadata.brandCounts}
        totalActiveProducts={filterMetadata.totalActiveProducts}
        initialQuery={resolvedSearchParams?.query || ''}
        initialCategorySlug={resolvedSearchParams?.category || ''}
        initialSubcategorySlug={resolvedSearchParams?.sub || ''}
        initialBrandSlug={resolvedSearchParams?.brand || ''}
        initialSort={resolvedSearchParams?.sort as 'relevance' | 'price-low' | 'price-high' | 'rating' | 'name' || 'relevance'}
      />
    </main>
  );
}
