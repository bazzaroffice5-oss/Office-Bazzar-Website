import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/config';

export const metadata: Metadata = constructMetadata({
  title: 'Request a Corporate Quotation (RFQ) | Bulk Office Supplies India | Office Bazzar',
  description:
    'Submit a corporate Request for Quotation (RFQ) to Office Bazzar for bulk office stationery, housekeeping products, printer consumables, and packaging supplies across India.',
  path: '/request-quote',
  noIndex: false,
  keywords: [
    'Request a Quote Office Supplies India',
    'Corporate RFQ Office Stationery',
    'Bulk Office Supplies Quotation India',
    'Corporate Procurement Solutions India',
    'Office Bazzar RFQ',
  ],
});

export default function RequestQuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
