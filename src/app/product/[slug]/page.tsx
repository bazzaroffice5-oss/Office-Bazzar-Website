import React from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import { getProductBySlug, getRelatedProducts, getBrands, getProducts } from '@/lib/db/store';
import { getVersionedImageUrl } from '@/lib/utils/image';
import {
  getProductJsonLd,
  getBreadcrumbJsonLd,
  getCanonicalUrl,
  SITE_CONFIG,
  formatProductSeoTitle,
  formatProductSeoDescription,
} from '@/lib/seo/config';

export const revalidate = 3600;

export async function generateStaticParams() {
  const { products } = await getProducts();
  return products.map((p) => ({
    slug: p.slug,
  }));
}

const DUPLICATE_PRODUCT_REDIRECTS: Record<string, string> = {
  'tissue-paper-napkin-1': '/product/tissue-paper-napkin',
};
import JsonLd from '@/components/seo/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === 'kangaro-staplers-hd-10d' || slug === 'kangaro-staplers-hd-10d-1') {
    return {
      title: 'Product Not Found | Office Bazzar',
      robots: { index: false, follow: false },
    };
  }
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

  const metaTitle = formatProductSeoTitle(product);
  const metaDescription = formatProductSeoDescription(product);

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
  if (slug === 'kangaro-staplers-hd-10d' || slug === 'kangaro-staplers-hd-10d-1') {
    notFound();
  }
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

  // Primary LCP Hero Image Preload
  const primaryImage =
    product.images && product.images.length > 0
      ? getVersionedImageUrl(product.images[0])
      : getVersionedImageUrl('/assets/placeholder-product.svg');

  return (
    <main className="min-h-screen bg-[#F5FAF6]">
      <link rel="preload" as="image" href={primaryImage} fetchPriority="high" />
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
