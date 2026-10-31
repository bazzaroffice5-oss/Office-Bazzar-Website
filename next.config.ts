import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'officebazzar.co.in',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "frame-src 'self' https://www.google.com https://maps.google.com",
              "connect-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  async redirects() {
    const legacyCategoryMap: Record<string, string> = {
      'office-supplies-stationery': 'office-stationery',
      'paper-products-copier-reams': 'office-stationery',
      'files-folders-archival': 'office-stationery',
      'whiteboards-notice-display': 'office-stationery',
      'housekeeping-facility-supplies': 'housekeeping-hygiene',
      'cleaning-chemicals-sanitizers': 'housekeeping-hygiene',
      'tissue-paper-dispensers': 'housekeeping-hygiene',
      'pantry-cafeteria-supplies': 'housekeeping-hygiene',
      'safety-ppe-equipment': 'housekeeping-hygiene',
      'printer-supplies-toner': 'printers-technology',
      'office-machines-automation': 'printers-technology',
      'packaging-tape-dispatch': 'packaging-supplies',
    };

    const legacyRedirects = Object.entries(legacyCategoryMap).flatMap(([oldSlug, newSlug]) => [
      {
        source: `/category/${oldSlug}`,
        destination: `/category/${newSlug}`,
        permanent: true,
      },
      {
        source: `/categories/${oldSlug}`,
        destination: `/category/${newSlug}`,
        permanent: true,
      },
    ]);

    const mainCategoryAliases = [
      'office-stationery',
      'housekeeping-hygiene',
      'printers-technology',
      'packaging-supplies',
    ].map((slug) => ({
      source: `/categories/${slug}`,
      destination: `/category/${slug}`,
      permanent: true,
    }));

    const duplicateProductRedirects = [
      {
        source: '/product/kangaro-staplers-hd-10d-1',
        destination: '/product/kangaro-staplers-hd-10d',
        permanent: true,
      },
      {
        source: '/product/tissue-paper-napkin-1',
        destination: '/product/tissue-paper-napkin',
        permanent: true,
      },
    ];

    return [...legacyRedirects, ...mainCategoryAliases, ...duplicateProductRedirects];
  },
};

export default nextConfig;
