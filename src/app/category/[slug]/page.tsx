import React from 'react';
import { notFound } from 'next/navigation';
import CategoryLandingClient from '@/components/category/CategoryLandingClient';
import { getProducts, getCategoryBySlug, getCatalogFilterMetadata } from '@/lib/db/store';
import { getCanonicalUrl, getBreadcrumbJsonLd, SITE_CONFIG, formatSeoTitle } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const revalidate = 3600;

export async function generateStaticParams() {
  return [
    { slug: 'office-stationery' },
    { slug: 'housekeeping-hygiene' },
    { slug: 'printers-technology' },
    { slug: 'packaging-supplies' },
  ];
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ sub?: string; view?: string; page?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found | OfficeBazzar',
      robots: { index: false, follow: false },
    };
  }

  const matchedSub = category.subcategories?.find(
    (s) => s.slug === slug || s.id === slug
  );
  const effectiveSub = resolvedSearchParams?.sub || matchedSub?.slug;

  const activeSub = category.subcategories?.find(
    (s) => s.slug === effectiveSub || s.id === effectiveSub
  );

  const rawTitle = activeSub
    ? `${activeSub.name} - ${category.name}`
    : `${category.name} - Corporate Procurement`;
  const metaTitle = activeSub ? formatSeoTitle(rawTitle) : rawTitle;
  const metaDescription = activeSub?.description
    ? activeSub.description
    : `${category.description} Request bulk B2B quotes and GST tax invoicing across India.`;

  // Always canonicalize ?sub= filter views to the primary category URL present in sitemap.xml
  const canonicalUrl = getCanonicalUrl(`/category/${category.slug}`);

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: category.imageUrl?.startsWith('http')
            ? category.imageUrl
            : `${SITE_CONFIG.url}${SITE_CONFIG.defaultOgImage}`,
          width: 800,
          height: 600,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ sub?: string; view?: string; page?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const matchedSub = category.subcategories?.find(
    (s) => s.slug === slug || s.id === slug
  );
  const effectiveSub = resolvedSearchParams?.sub || matchedSub?.slug;
  const isProductListingOpen = Boolean(
    resolvedSearchParams?.view === 'all' ||
    resolvedSearchParams?.view === 'products' ||
    effectiveSub
  );

  const parsedPage = resolvedSearchParams?.page ? parseInt(resolvedSearchParams.page, 10) : 1;
  const currentPage = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = 24;

  // Fetch filter metadata (subcategory counts) and paginated products if listing view is open
  const [filterMetadata, productsData] = await Promise.all([
    getCatalogFilterMetadata(),
    isProductListingOpen
      ? getProducts({
          category: category.slug,
          subcategory: effectiveSub,
          page: currentPage,
          limit,
        })
      : Promise.resolve({ products: [], total: 0 }),
  ]);

  const totalProducts = productsData.total;
  const totalPages = Math.max(1, Math.ceil(totalProducts / limit));
  const categoryProductCount =
    filterMetadata.categoryCounts[category.id] ||
    filterMetadata.categoryCounts[category.slug] ||
    0;

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: category.name, url: `/category/${category.slug}` },
  ];

  if (effectiveSub) {
    const activeSub = category.subcategories?.find(
      (s) => s.slug === effectiveSub || s.id === effectiveSub
    );
    if (activeSub) {
      breadcrumbItems.push({
        name: activeSub.name,
        url: `/category/${category.slug}?sub=${activeSub.slug}`,
      });
    }
  } else if (resolvedSearchParams?.view === 'all') {
    breadcrumbItems.push({
      name: 'All Products',
      url: `/category/${category.slug}?view=all`,
    });
  }

  const breadcrumbJsonLd = getBreadcrumbJsonLd(breadcrumbItems);

  return (
    <main className="min-h-screen bg-[#F5FAF6]">
      <JsonLd data={breadcrumbJsonLd} />
      <CategoryLandingClient
        category={category}
        initialProducts={productsData.products}
        totalProducts={totalProducts}
        currentPage={currentPage}
        totalPages={totalPages}
        subcategoryCounts={filterMetadata.subcategoryCounts}
        categoryProductCount={categoryProductCount}
        initialView={resolvedSearchParams?.view}
        initialSub={effectiveSub}
        baseRoute="/category"
      />
    </main>
  );
}
