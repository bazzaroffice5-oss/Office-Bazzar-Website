import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/config';

export const metadata: Metadata = constructMetadata({
  title: 'Quotation Submitted | Office Bazzar',
  description: 'Your corporate quotation request has been received.',
  path: '/request-quote',
  noIndex: true,
});

export default function QuotationSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
