import React from 'react';
import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import { getProductBySlug, getRelatedProducts, getBrands } from '@/lib/db/store';
import { getProductJsonLd, getBreadcrumbJsonLd, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | OfficeBazzar India',
      robots: { index: false, follow: false },
    };
  }

  const metaTitle = product.metaTitle || `${product.name} Wholesale Suppliers Chennai | OfficeBazzar`;
  const metaDescription =
    product.metaDescription ||
    product.shortDescription ||
    `Buy ${product.name} (${product.brandName}) in bulk wholesale packs. Includes ${product.gstPercent}% GST invoice for 100% Input Tax Credit. Fast dispatch across Chennai.`;

  const canonicalUrl = getCanonicalUrl(`/product/${product.slug}`);
  const ogImage = product.images && product.images.length > 0 ? product.images[0] : `${SITE_CONFIG.url}${SITE_CONFIG.defaultOgImage}`;

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
          url: ogImage,
          width: 800,
          height: 800,
          alt: product.name,
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

  // Authentic Schema.org Product & Breadcrumb Structured Data
  const productJsonLd = getProductJsonLd(product);
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: product.categoryName || 'Office Supplies', url: `/category/${product.categoryId || 'office-supplies-stationery'}` },
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
