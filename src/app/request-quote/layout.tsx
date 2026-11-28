import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/config';

export const metadata: Metadata = constructMetadata({
  title: 'Request a Corporate Quotation & Bulk B2B Pricing',
  description:
    'Submit an institutional quotation request for office stationery, housekeeping chemicals, printer toners, and bulk B2B supplies with GST billing in India.',
  path: '/request-quote',
  noIndex: true,
});

export default function RequestQuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
