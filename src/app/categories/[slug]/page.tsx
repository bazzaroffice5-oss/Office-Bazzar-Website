import React from 'react';
import { notFound } from 'next/navigation';
import CategoryLandingClient from '@/components/category/CategoryLandingClient';
import { getProducts, getCategoryBySlug } from '@/lib/db/store';
import { getCanonicalUrl, getBreadcrumbJsonLd, SITE_CONFIG } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ sub?: string; view?: string }>;
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

  const titlePrefix = activeSub ? `${activeSub.name} - ` : '';
  const metaTitle = `${titlePrefix}${category.name} Wholesale Suppliers in Chennai | OfficeBazzar`;
  const metaDescription =
    activeSub?.description ||
    category.description ||
    `Procure bulk ${category.name} for corporate offices, IT parks, and institutions in Chennai. Guaranteed 100% GST input tax credit with same-day dispatch.`;

  const canonicalUrl = getCanonicalUrl(
    activeSub
      ? `/categories/${category.slug}?sub=${activeSub.slug}`
      : `/categories/${category.slug}`
  );

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
  searchParams?: Promise<{ sub?: string; view?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  // Fetch all products across database
  const { products: allProducts } = await getProducts();

  const matchedSub = category.subcategories?.find(
    (s) => s.slug === slug || s.id === slug
  );
  const effectiveSub = resolvedSearchParams?.sub || matchedSub?.slug;

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'All Categories', url: '/categories' },
    { name: category.name, url: `/categories/${category.slug}` },
  ];

  if (effectiveSub) {
    const activeSub = category.subcategories?.find(
      (s) => s.slug === effectiveSub || s.id === effectiveSub
    );
    if (activeSub) {
      breadcrumbItems.push({
        name: activeSub.name,
        url: `/categories/${category.slug}?sub=${activeSub.slug}`,
      });
    }
  } else if (resolvedSearchParams?.view === 'all') {
    breadcrumbItems.push({
      name: 'All Products',
      url: `/categories/${category.slug}?view=all`,
    });
  }

  const breadcrumbJsonLd = getBreadcrumbJsonLd(breadcrumbItems);

  return (
    <main className="min-h-screen bg-slate-50">
      <JsonLd data={breadcrumbJsonLd} />
      <CategoryLandingClient
        category={category}
        allProducts={allProducts}
        initialView={resolvedSearchParams?.view}
        initialSub={effectiveSub}
        baseRoute="/categories"
      />
    </main>
  );
}
