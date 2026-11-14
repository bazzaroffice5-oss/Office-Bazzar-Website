import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OfficeBazzar Product Admin | Standalone Catalog Dashboard',
  description: 'Enterprise Product Management Dashboard for OfficeBazzar',
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

export default function ProductAdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 antialiased font-sans selection:bg-[#2563EB] selection:text-white">
      {children}
    </div>
  );
}
