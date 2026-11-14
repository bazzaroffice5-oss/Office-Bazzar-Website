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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased font-sans selection:bg-[#ea580c] selection:text-white">
      {children}
    </div>
  );
}
