import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/config';

export const metadata: Metadata = constructMetadata({
  title: 'Checkout | Office Bazzar',
  description: 'Complete your procurement order or quotation request.',
  path: '/checkout',
  noIndex: true,
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
