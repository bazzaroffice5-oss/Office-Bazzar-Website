import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OfficeBazzar Blog Admin | Standalone CMS',
  description: 'Private Blog Content Management System for OfficeBazzar',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function BlogAdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 antialiased font-sans">
      {children}
    </div>
  );
}
