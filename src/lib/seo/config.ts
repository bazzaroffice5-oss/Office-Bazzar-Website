import { Metadata } from 'next';
import { Product } from '@/types';
import { BlogPost } from '@/lib/data/blog';

/**
 * Resolves the verified production domain:
 * 1. Honors process.env.NEXT_PUBLIC_SITE_URL if configured.
 * 2. Intercepts and excludes deprecated domains (e.g. officebazzar.co.in).
 * 3. Enforces primary production domain fallback: https://officebazzar.com
 * 4. Ensures no trailing slash on the base URL.
 */
function resolveProductionSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl && !envUrl.includes('officebazzar.co.in')) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://officebazzar.com';
}

export const SITE_CONFIG = {
  name: 'OfficeBazzar',
  legalName: 'Officebazzar E-Store Private Limited',
  url: resolveProductionSiteUrl(),
  description:
    'Officebazzar E-Store Private Limited is Chennai’s leading corporate procurement partner for office stationery, Diversey Taski housekeeping chemicals, mobile garbage bins, toner cartridges, and paper shredders with 100% GST input tax credit.',
  foundingYear: 2005,
  corporateHeadquarters: {
    building: 'Officebazzar Tower',
    streetAddress: 'No. 29/15, Subbedar Hussain Street',
    locality: 'Royapettah',
    city: 'Chennai',
    region: 'Tamil Nadu',
    postalCode: '600014',
    country: 'IN',
  },
  contact: {
    phone: '+91 72008 00040',
    phoneSecondary: '+91 78258 86622',
    landline: '044 4858 8662',
    email: 'sales4@officebazzar.com',
    corporateEmail: 'dm@officebazzar.com',
  },
  social: {
    linkedin: 'https://www.linkedin.com/company/officebazzar',
    facebook: 'https://www.facebook.com/officebazzar',
    instagram: 'https://www.instagram.com/officebazzar',
  },
  defaultOgImage: '/android-chrome-512x512.png',
  logoUrl: '/images/brand-logo.svg',
};

/**
 * Normalizes any route path into an absolute canonical URL on the verified production domain.
 * - Homepage ('/' or '') -> https://officebazzar.com/
 * - Subpages ('/products', '/product/xyz') -> https://officebazzar.com/products, https://officebazzar.com/product/xyz
 */
export function getCanonicalUrl(path: string = ''): string {
  if (!path || path === '/' || path.trim() === '') {
    return `${SITE_CONFIG.url}/`;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Strip trailing slashes for subpages to avoid duplicate canonical variations
  const normalized = cleanPath.replace(/\/+$/, '');
  return `${SITE_CONFIG.url}${normalized}`;
}

/**
 * Reusable metadata constructor adhering to Next.js Metadata API
 */
export function constructMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
  type = 'website',
  keywords,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
  keywords?: string[];
}): Metadata {
  const metaTitle = title
    ? `${title} | OfficeBazzar India`
    : 'OfficeBazzar | Corporate Procurement Partner for Office Supplies & Housekeeping';

  const metaDescription = description || SITE_CONFIG.description;
  const canonicalUrl = getCanonicalUrl(path);
  const ogImageUrl = image?.startsWith('http') ? image : getCanonicalUrl(image || SITE_CONFIG.defaultOgImage);

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords || [
      'Office Supplies Chennai',
      'Corporate Stationery Wholesale',
      'Taski Chemicals Chennai',
      'Industrial Dustbin Suppliers',
      'GST Invoice Procurement',
      'OfficeBazzar',
    ],
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: 'en_IN',
      type,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title || SITE_CONFIG.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [ogImageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };
}

/**
 * Organization Schema (schema.org/Organization)
 */
export function getOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.legalName,
    alternateName: SITE_CONFIG.name,
    url: `${SITE_CONFIG.url}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.url}${SITE_CONFIG.logoUrl}`,
    },
    description: SITE_CONFIG.description,
    foundingDate: `${SITE_CONFIG.foundingYear}`,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: SITE_CONFIG.contact.phone,
        contactType: 'sales',
        areaServed: 'IN',
        availableLanguage: ['English', 'Tamil', 'Hindi'],
      },
      {
        '@type': 'ContactPoint',
        telephone: SITE_CONFIG.contact.phoneSecondary,
        contactType: 'customer support',
        areaServed: 'IN',
        availableLanguage: ['English', 'Tamil'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${SITE_CONFIG.corporateHeadquarters.building}, ${SITE_CONFIG.corporateHeadquarters.streetAddress}`,
      addressLocality: SITE_CONFIG.corporateHeadquarters.locality,
      addressRegion: SITE_CONFIG.corporateHeadquarters.region,
      postalCode: SITE_CONFIG.corporateHeadquarters.postalCode,
      addressCountry: SITE_CONFIG.corporateHeadquarters.country,
    },
    sameAs: [
      SITE_CONFIG.social.linkedin,
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.instagram,
    ].filter(Boolean),
  };
}

/**
 * LocalBusiness Schema (schema.org/LocalBusiness)
 */
export function getLocalBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_CONFIG.url}/#localbusiness`,
    name: SITE_CONFIG.legalName,
    alternateName: SITE_CONFIG.name,
    image: `${SITE_CONFIG.url}${SITE_CONFIG.defaultOgImage}`,
    url: `${SITE_CONFIG.url}/`,
    telephone: SITE_CONFIG.contact.phone,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${SITE_CONFIG.corporateHeadquarters.building}, ${SITE_CONFIG.corporateHeadquarters.streetAddress}`,
      addressLocality: SITE_CONFIG.corporateHeadquarters.locality,
      addressRegion: SITE_CONFIG.corporateHeadquarters.region,
      postalCode: SITE_CONFIG.corporateHeadquarters.postalCode,
      addressCountry: SITE_CONFIG.corporateHeadquarters.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '13.0537',
      longitude: '80.2618',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '19:00',
      },
    ],
  };
}

/**
 * WebSite Schema with SearchAction (schema.org/WebSite)
 */
export function getWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_CONFIG.url}/#website`,
    url: SITE_CONFIG.url,
    name: SITE_CONFIG.name,
    publisher: {
      '@id': `${SITE_CONFIG.url}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/products?query={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * BreadcrumbList Schema (schema.org/BreadcrumbList)
 */
export function getBreadcrumbJsonLd(
  items: { name: string; url?: string; path?: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const link = item.url || item.path || '/';
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: link.startsWith('http') ? link : getCanonicalUrl(link),
      };
    }),
  };
}

/**
 * Product Schema (schema.org/Product)
 * Strictly adheres to verified data without fake review counts or credentials
 */
export function getProductJsonLd(product: Product) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images && product.images.length > 0 ? product.images : [`${SITE_CONFIG.url}/images/brand-logo.svg`],
    description: product.description || product.shortDescription || `${product.name} wholesale supply in Chennai.`,
    sku: product.sku || product.id,
    url: getCanonicalUrl(`/product/${product.slug}`),
    brand: {
      '@type': 'Brand',
      name: product.brandName || SITE_CONFIG.name,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: getCanonicalUrl(`/product/${product.slug}`),
      seller: {
        '@type': 'Organization',
        name: SITE_CONFIG.legalName,
      },
    },
  };

  // Only attach AggregateRating if authentic rating and reviews exist (no fake 25 review defaults!)
  if (product.rating && product.reviewCount && product.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    };
  }

  return schema;
}

/**
 * Article Schema (schema.org/BlogPosting)
 */
export function getArticleJsonLd(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.imageUrl ? [post.imageUrl] : [`${SITE_CONFIG.url}${SITE_CONFIG.defaultOgImage}`],
    datePublished: new Date(post.publishedDate).toISOString(),
    dateModified: new Date(post.publishedDate).toISOString(),
    author: {
      '@type': 'Person',
      name: post.author || 'Office Bazzar Editorial Team',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.legalName,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}${SITE_CONFIG.logoUrl}`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': getCanonicalUrl(`/blogs/${post.slug}`),
    },
  };
}

/**
 * FAQPage Schema (schema.org/FAQPage)
 */
export function getFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
