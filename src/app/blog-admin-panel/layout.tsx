import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OfficeBazzar Blog Admin | Professional CMS Dashboard',
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
    <div className="min-h-screen bg-[#f0f2f5] text-slate-800 antialiased font-sans selection:bg-[#004b87] selection:text-white">
      {children}
    </div>
  );
}
