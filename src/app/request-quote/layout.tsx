import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/config';

export const metadata: Metadata = constructMetadata({
  title: 'Request a Corporate Quote & B2B RFQ',
  description:
    'Submit a corporate Request for Quotation (RFQ) for office stationery, housekeeping chemicals, printer toners, and bulk B2B supplies with GST billing in India.',
  path: '/request-quote',
  noIndex: true,
});

export default function RequestQuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
