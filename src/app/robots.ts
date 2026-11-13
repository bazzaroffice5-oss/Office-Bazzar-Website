import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/blog-admin-panel',
          '/blog-admin-panel/',
          '/admin',
          '/admin/',
          '/account',
          '/account/',
          '/checkout',
          '/checkout/',
          '/cart',
          '/cart/',
          '/quote-cart',
          '/quote-cart/',
          '/quotation',
          '/quotation/',
          '/quotation-success',
          '/quotation-success/',
          '/order-success',
          '/order-success/',
          '/login',
          '/register',
          '/api/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/blog-admin-panel',
          '/blog-admin-panel/',
          '/admin/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/quotation/',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  };
}
