import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/config';

export const metadata: Metadata = constructMetadata({
  title: 'My Corporate Account | Office Bazzar',
  description: 'Manage your corporate procurement orders, GST profiles, and delivery addresses.',
  path: '/account',
  noIndex: true,
});

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
