import React from 'react';
import ProductListingClient from '@/components/product/ProductListingClient';
import { getProducts, getCategories, getBrands } from '@/lib/db/store';
import { getCanonicalUrl, getBreadcrumbJsonLd, SITE_CONFIG, formatSeoTitle } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string; brand?: string; sub?: string }>;
}) {
  const resolved = await searchParams;
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

  const title = formatSeoTitle(rawTitle);
  const canonicalUrl = getCanonicalUrl('/products');
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
