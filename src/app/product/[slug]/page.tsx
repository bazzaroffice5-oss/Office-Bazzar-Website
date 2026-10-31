import React from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import { getProductBySlug, getRelatedProducts, getBrands } from '@/lib/db/store';
import { getProductJsonLd, getBreadcrumbJsonLd, getCanonicalUrl, SITE_CONFIG, formatSeoTitle } from '@/lib/seo/config';

const DUPLICATE_PRODUCT_REDIRECTS: Record<string, string> = {
  'kangaro-staplers-hd-10d-1': '/product/kangaro-staplers-hd-10d',
  'tissue-paper-napkin-1': '/product/tissue-paper-napkin',
};
import JsonLd from '@/components/seo/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (DUPLICATE_PRODUCT_REDIRECTS[slug]) {
    return {
      alternates: {
        canonical: getCanonicalUrl(DUPLICATE_PRODUCT_REDIRECTS[slug]),
      },
    };
  }
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Office Bazzar',
      robots: { index: false, follow: false },
    };
  }

  const cleanName = product.name.trim();
  const brandName = (product.brandName || 'Office Bazzar').trim();
  const nameIncludesBrand = cleanName.toLowerCase().includes(brandName.toLowerCase());
  const rawTitle =
    !nameIncludesBrand && brandName.toLowerCase() !== 'officebazzar' && brandName.toLowerCase() !== 'office bazzar'
      ? `${cleanName} (${brandName})`
      : `${cleanName} (${product.sku})`;
  const metaTitle = formatSeoTitle(rawTitle);

  const rawDesc = `Buy ${cleanName} (SKU: ${product.sku}) by ${brandName} under ${product.categoryName}. ${product.packSize || 'Standard Pack'} with ${product.gstPercent}% GST invoice & bulk B2B supply in India.`;
  const metaDescription =
    rawDesc.length <= 158
      ? rawDesc
      : `Source ${cleanName} (${product.sku}) from ${brandName}. ${product.packSize || 'Standard Pack'}, ${product.gstPercent}% GST tax invoice, and bulk corporate supply across India.`.slice(0, 158);

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
  if (DUPLICATE_PRODUCT_REDIRECTS[slug]) {
    permanentRedirect(DUPLICATE_PRODUCT_REDIRECTS[slug]);
  }
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
