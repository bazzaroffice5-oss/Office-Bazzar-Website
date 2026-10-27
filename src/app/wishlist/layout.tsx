import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/config';

export const metadata: Metadata = constructMetadata({
  title: 'My Wishlist | Office Bazzar',
  description: 'View saved office supplies and institutional products.',
  path: '/wishlist',
  noIndex: true,
});

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
