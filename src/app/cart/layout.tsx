import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/config';

export const metadata: Metadata = constructMetadata({
  title: 'Quote Cart | Office Bazzar',
  description: 'View and manage institutional procurement items in your Office Bazzar cart.',
  path: '/cart',
  noIndex: true,
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
