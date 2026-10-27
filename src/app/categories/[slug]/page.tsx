import React from 'react';
import { notFound } from 'next/navigation';
import CategoryLandingClient from '@/components/category/CategoryLandingClient';
import { getProducts, getCategories, getCategoryBySlug } from '@/lib/db/store';
import { CATEGORY_MAP } from '@/lib/data/catalog';
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


  const activeSub = category.subcategories?.find(
    (s) => s.slug === resolvedSearchParams?.sub || s.id === resolvedSearchParams?.sub
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
  const allCategories = await getCategories();

  const APPROVED_CATEGORIES = [
    'office-stationery',
    'housekeeping-hygiene',
    'printers-technology',
    'packaging-supplies',
  ];

  const categories = APPROVED_CATEGORIES.map((s) =>
    allCategories.find((c) => c.slug === s)
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));

  // Compute product counts for the 4 main categories
  const productCounts: Record<string, number> = {};
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
    productCounts[cat.id] = count || cat.itemCount || 0;
    productCounts[cat.slug] = productCounts[cat.id];
  });


  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'All Categories', url: '/categories' },
    { name: category.name, url: `/categories/${category.slug}` },
  ];

  if (resolvedSearchParams?.sub) {
    const activeSub = category.subcategories?.find(
      (s) => s.slug === resolvedSearchParams.sub || s.id === resolvedSearchParams.sub
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
        initialSub={resolvedSearchParams?.sub}
        baseRoute="/categories"
      />
    </main>
  );
}
