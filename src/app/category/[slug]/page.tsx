import React from 'react';
import { notFound } from 'next/navigation';
import CategoryLandingClient from '@/components/category/CategoryLandingClient';
import { getProducts, getCategoryBySlug } from '@/lib/db/store';
import {
  getCanonicalUrl,
  getBreadcrumbJsonLd,
  SITE_CONFIG,
  CATEGORY_SEO_CONFIG,
} from '@/lib/seo/config';
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
      title: { absolute: 'Category Not Found | Office Bazzar' },
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

  const catSeo = CATEGORY_SEO_CONFIG[category.slug];

  const metaTitle = activeSub
    ? `${activeSub.name} — ${category.name} Supplier India | Office Bazzar`
    : catSeo?.title || `${category.name} Supplier India | Bulk Corporate Procurement | Office Bazzar`;

  const metaDescription =
    activeSub?.description
      ? `${activeSub.description} Procure bulk ${activeSub.name.toLowerCase()} across India from Office Bazzar with 100% GST Input Tax Credit.`
      : catSeo?.description ||
        category.description ||
        `Procure bulk ${category.name} for corporate offices, IT parks, and institutions across India. Guaranteed 100% GST input tax credit and pan-India dispatch.`;

  const canonicalUrl = getCanonicalUrl(
    activeSub
      ? `/category/${category.slug}?sub=${activeSub.slug}`
      : `/category/${category.slug}`
  );

  return {
    title: {
      absolute: metaTitle,
    },
    description: metaDescription,
    keywords: catSeo?.keywords || SITE_CONFIG.primaryKeywords,
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
            : `${SITE_CONFIG.url}${category.imageUrl || SITE_CONFIG.defaultOgImage}`,
          width: 1200,
          height: 630,
          alt: `${category.name} Supplier India — Office Bazzar`,
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
    { name: 'Categories', url: '/categories' },
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
    <main className="min-h-screen bg-slate-50">
      <JsonLd data={breadcrumbJsonLd} />
      <CategoryLandingClient
        category={category}
        allProducts={allProducts}
        initialView={resolvedSearchParams?.view}
        initialSub={effectiveSub}
        baseRoute="/category"
      />
    </main>
  );
}
