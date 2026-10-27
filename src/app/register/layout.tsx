import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/config';

export const metadata: Metadata = constructMetadata({
  title: 'Create Corporate Account | Office Bazzar',
  description: 'Register for an Office Bazzar corporate account to access institutional rates.',
  path: '/register',
  noIndex: true,
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
