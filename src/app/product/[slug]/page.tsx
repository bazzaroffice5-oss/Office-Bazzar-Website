import React from 'react';
import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import { getProductBySlug, getRelatedProducts, getBrands } from '@/lib/db/store';
import { getProductJsonLd, getBreadcrumbJsonLd, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo/config';
import { CATEGORY_MAP } from '@/lib/data/catalog';
import JsonLd from '@/components/seo/JsonLd';

function resolveCanonicalCategory(product: { categoryId?: string; subcategoryId?: string; categoryName?: string }) {
  const mapped =
    (product.subcategoryId && CATEGORY_MAP[product.subcategoryId]) ||
    (product.categoryId && CATEGORY_MAP[product.categoryId]);

  if (mapped) {
    return {
      slug: mapped.mainSlug,
      name: mapped.mainName,
    };
  }

  const validMainSlugs = ['office-stationery', 'housekeeping-hygiene', 'printers-technology', 'packaging-supplies'];
  if (product.categoryId && validMainSlugs.includes(product.categoryId)) {
    return {
      slug: product.categoryId,
      name: product.categoryName || 'Office Stationery',
    };
  }

  return {
    slug: 'office-stationery',
    name: product.categoryName || 'Office Stationery',
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: { absolute: 'Product Not Found | Office Bazzar' },
      robots: { index: false, follow: false },
    };
  }

  const metaTitle =
    product.metaTitle ||
    `${product.name} | Bulk Corporate Supply India | Office Bazzar`;

  const brandPart = product.brandName ? ` (${product.brandName})` : '';
  const packPart = product.packSize ? ` Pack size: ${product.packSize}.` : '';
  const metaDescription =
    product.metaDescription ||
    product.shortDescription ||
    `Procure ${product.name}${brandPart} in bulk for corporate and institutional offices across India.${packPart} Includes ${product.gstPercent || 18}% GST tax invoice for 100% Input Tax Credit.`;

  const canonicalUrl = getCanonicalUrl(`/product/${product.slug}`);
  const rawOgImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : SITE_CONFIG.defaultOgImage;
  const ogImage = rawOgImage.startsWith('http') ? rawOgImage : getCanonicalUrl(rawOgImage);

  return {
    title: {
      absolute: metaTitle,
    },
    description: metaDescription,
    keywords: [
      product.name,
      `${product.name} Wholesale India`,
      product.brandName ? `${product.brandName} Supplier India` : 'Corporate Office Supplies India',
      product.categoryName || 'Office Supplies Supplier India',
      'Bulk Office Supplies India',
      'Office Bazzar',
    ],
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
          url: ogImage,
          width: 800,
          height: 800,
          alt: `${product.name} — Corporate Procurement India | Office Bazzar`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, brands] = await Promise.all([
    getRelatedProducts(product.id, 12),
    getBrands(),
  ]);

  const brand =
    brands.find(
      (b) =>
        b.id === product.brandId ||
        b.slug.toLowerCase() === product.brandName.toLowerCase().replace(/\s+/g, '-') ||
        b.name.toLowerCase() === product.brandName.toLowerCase()
    ) || null;

  const resolvedCategory = resolveCanonicalCategory(product);

  // Authentic Schema.org Product & Breadcrumb Structured Data
  const productJsonLd = getProductJsonLd(product);
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: resolvedCategory.name, url: `/category/${resolvedCategory.slug}` },
    { name: product.name, url: `/product/${product.slug}` },
  ]);

  return (
    <main className="min-h-screen bg-white">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
        brand={brand}
      />
    </main>
  );
}
