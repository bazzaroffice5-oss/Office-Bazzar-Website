import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OfficeBazzar Analytics Admin | Dedicated Performance & Quotes Portal',
  description: 'Enterprise Quote & Traffic Analytics Portal for OfficeBazzar',
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

export default function AnalyticsAdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-900 antialiased font-sans selection:bg-[#004b87] selection:text-white">
      {children}
    </div>
  );
}
