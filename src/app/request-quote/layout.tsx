import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/config';

export const metadata: Metadata = constructMetadata({
  title: 'Request a Quote | Office Bazzar',
  description: 'Submit a corporate quotation request for office supplies and institutional products.',
  path: '/request-quote',
  noIndex: true,
});

export default function RequestQuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
