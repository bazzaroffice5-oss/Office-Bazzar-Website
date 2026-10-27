import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import {
  SITE_CONFIG,
  getOrganizationJsonLd,
  getWebSiteJsonLd,
  getLocalBusinessJsonLd,
} from '@/lib/seo/config';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['Arial', 'Helvetica', 'sans-serif'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: 'OfficeBazzar | Office Supplies & Corporate Procurement Partner',
    template: '%s | OfficeBazzar India',
  },
  description: SITE_CONFIG.description,
  keywords: [
    'Office Stationery Chennai',
    'Housekeeping Materials Chennai',
    'Industrial Dustbin Suppliers',
    'Office Supplies Wholesale',
    'JK Copier Paper',
    'Taski Chemicals Supplier Chennai',
    'Computer Consumables',
    'OfficeBazzar',
    'Corporate Procurement Partner',
  ],
  authors: [{ name: SITE_CONFIG.legalName, url: SITE_CONFIG.url }],
  creator: SITE_CONFIG.legalName,
  publisher: SITE_CONFIG.legalName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  robots: {
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
  openGraph: {
    title: 'OfficeBazzar — Dynamic Workplace E-Commerce & Corporate Procurement',
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}${SITE_CONFIG.defaultOgImage}`,
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} Corporate Procurement`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OfficeBazzar — Corporate Procurement Partner',
    description: SITE_CONFIG.description,
    images: [`${SITE_CONFIG.url}${SITE_CONFIG.defaultOgImage}`],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = getOrganizationJsonLd();
  const websiteSchema = getWebSiteJsonLd();
  const localBusinessSchema = getLocalBusinessJsonLd();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body
        className="min-h-full flex flex-col font-sans bg-white text-slate-900 selection:bg-emerald-500 selection:text-white"
      >
        <JsonLd data={organizationSchema} id="organization-schema-root" />
        <JsonLd data={websiteSchema} id="website-schema-root" />
        <JsonLd data={localBusinessSchema} id="local-business-schema-root" />
        <Providers>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
