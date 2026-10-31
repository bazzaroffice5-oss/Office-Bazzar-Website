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
  name: 'Office Bazzar',
  brandAlias: 'OfficeBazzar',
  legalName: 'Officebazzar E-Store Private Limited',
  url: resolveProductionSiteUrl(),
  defaultTitle: 'Office Bazzar | Office Supplies & Corporate Procurement India',
  description:
    'Office Bazzar provides office stationery, housekeeping and hygiene products, printer consumables and packaging supplies for businesses across India. Explore corporate and bulk procurement solutions.',
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
  primaryKeywords: [
    'Office Supplies Supplier India',
    'Office Stationery Supplier India',
    'Corporate Office Supplies India',
    'Housekeeping Products Supplier India',
    'Cleaning Materials Supplier India',
    'Printer Consumables Supplier India',
    'Packaging Materials Supplier India',
    'Bulk Office Supplies India',
    'Corporate Procurement Solutions India',
  ],
};

/**
 * Category-Specific SEO Configuration (Phase 6)
 */
export const CATEGORY_SEO_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    h1: string;
    keywords: string[];
  }
> = {
  'office-stationery': {
    title: 'Office Stationery Supplier India | Bulk Corporate Stationery | Office Bazzar',
    description:
      'Leading office stationery supplier in India for corporate offices and institutions. Procure bulk JK Copier paper, box files, registers, writing instruments, and desk organizers with GST tax invoices.',
    h1: 'Office Stationery & Workplace Organization Supplies',
    keywords: [
      'Office Stationery Supplier India',
      'Bulk Office Stationery India',
      'Corporate Office Supplies India',
      'JK Copier Paper Supplier India',
      'Box Files Wholesale India',
      'Office Desk Organizers B2B',
    ],
  },
  'housekeeping-hygiene': {
    title: 'Housekeeping Products & Cleaning Materials Supplier India | Office Bazzar',
    description:
      'Trusted housekeeping products and cleaning materials supplier across India. Source Diversey Taski chemicals, Hi-Clean floor cleaners, tissue paper napkins, wringer trolleys, and industrial dustbins in bulk.',
    h1: 'Housekeeping & Hygiene Products for Corporate Facilities',
    keywords: [
      'Housekeeping Products Supplier India',
      'Cleaning Materials Supplier India',
      'Diversey Taski Chemicals Supplier India',
      'Hi-Clean Cleaning Products',
      'Industrial Dustbins Wholesale India',
      'Commercial Hygiene Supplies B2B',
    ],
  },
  'printers-technology': {
    title: 'Printer Consumables & Office Technology Supplier India | Office Bazzar',
    description:
      'Corporate printer consumables supplier in India. Procure genuine HP, Canon, Epson, and compatible laser toner cartridges, ink supplies, heavy-duty paper shredders, and IT accessories with GST invoicing.',
    h1: 'Printer Consumables & Office Technology Solutions',
    keywords: [
      'Printer Consumables Supplier India',
      'Laser Toner Cartridges Wholesale India',
      'Corporate IT Consumables India',
      'Heavy Duty Paper Shredders Supplier',
      'Currency Counting Machines India',
      'Bulk Printer Ink & Toner B2B',
    ],
  },
  'packaging-supplies': {
    title: 'Packaging Materials & Dispatch Supplies Supplier India | Office Bazzar',
    description:
      'Bulk packaging materials supplier across India for warehouses and corporate dispatch hubs. Order BOPP brown packing tapes, floor marking tapes, bubble wrap rolls, corrugated cartons, and strapping rolls.',
    h1: 'Packaging Supplies & Warehouse Dispatch Materials',
    keywords: [
      'Packaging Materials Supplier India',
      'BOPP Packing Tape Wholesale India',
      'Bubble Wrap Rolls Supplier India',
      'Corrugated Shipping Boxes B2B',
      'Warehouse Packaging Supplies India',
      'Floor Marking Tape Supplier',
    ],
  },
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
 * Reusable metadata constructor adhering to Next.js Metadata API.
 * Uses { absolute: metaTitle } so root layout template never creates duplicate brand suffixes.
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
  const hasBrandSuffix =
    title && (/office\s*bazzar/i.test(title) || title.includes('|'));
  const metaTitle = !title
    ? SITE_CONFIG.defaultTitle
    : hasBrandSuffix
    ? title
    : `${title} | Office Bazzar`;

  const metaDescription = description || SITE_CONFIG.description;
  const canonicalUrl = getCanonicalUrl(path);
  const ogImageUrl = image?.startsWith('http')
    ? image
    : getCanonicalUrl(image || SITE_CONFIG.defaultOgImage);

  return {
    title: {
      absolute: metaTitle,
    },
    description: metaDescription,
    keywords: keywords || SITE_CONFIG.primaryKeywords,
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
    alternateName: [SITE_CONFIG.name, SITE_CONFIG.brandAlias],
    url: `${SITE_CONFIG.url}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.url}${SITE_CONFIG.logoUrl}`,
    },
    description: SITE_CONFIG.description,
    foundingDate: `${SITE_CONFIG.foundingYear}`,
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: SITE_CONFIG.contact.phone,
        email: SITE_CONFIG.contact.email,
        contactType: 'sales',
        areaServed: 'IN',
        availableLanguage: ['English', 'Tamil', 'Hindi'],
      },
      {
        '@type': 'ContactPoint',
        telephone: SITE_CONFIG.contact.phoneSecondary,
        email: SITE_CONFIG.contact.corporateEmail,
        contactType: 'customer support',
        areaServed: 'IN',
        availableLanguage: ['English', 'Tamil', 'Hindi'],
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
 * OnlineStore & LocalBusiness Schema (schema.org/OnlineStore)
 */
export function getLocalBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['OnlineStore', 'LocalBusiness'],
    '@id': `${SITE_CONFIG.url}/#localbusiness`,
    name: SITE_CONFIG.legalName,
    alternateName: SITE_CONFIG.name,
    image: `${SITE_CONFIG.url}${SITE_CONFIG.defaultOgImage}`,
    url: `${SITE_CONFIG.url}/`,
    telephone: SITE_CONFIG.contact.phone,
    email: SITE_CONFIG.contact.email,
    priceRange: '₹₹',
    areaServed: 'IN',
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
        opens: '09:30',
        closes: '18:30',
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
    url: `${SITE_CONFIG.url}/`,
    name: SITE_CONFIG.name,
    alternateName: [SITE_CONFIG.legalName, SITE_CONFIG.brandAlias],
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
 * Strictly adheres to Google Merchant/Product structured data requirements:
 * - Only emits valid price when actual price (> 0) is available.
 * - Never emits fake star ratings or fabricated reviews.
 */
export function getProductJsonLd(product: Product) {
  const images =
    product.images && product.images.length > 0
      ? product.images.map((img) => (img.startsWith('http') ? img : getCanonicalUrl(img)))
      : [`${SITE_CONFIG.url}/images/brand-logo.svg`];

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images,
    description:
      product.description ||
      product.shortDescription ||
      `${product.name} (${product.brandName || 'Office Bazzar'}) available for bulk corporate procurement across India with GST tax invoice.`,
    sku: product.sku || product.id,
    mpn: product.sku || product.id,
    category: product.categoryName || 'Office Supplies',
    url: getCanonicalUrl(`/product/${product.slug}`),
    brand: {
      '@type': 'Brand',
      name: product.brandName || SITE_CONFIG.name,
    },
  };

  if (typeof product.price === 'number' && product.price > 0) {
    schema.offers = {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price.toFixed(2),
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stockQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: getCanonicalUrl(`/product/${product.slug}`),
      seller: {
        '@type': 'Organization',
        name: SITE_CONFIG.legalName,
      },
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
