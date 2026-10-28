import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OfficeBazzar Control Center',
  description: 'Private administrative console.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function OfficeControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased selection:bg-orange-500 selection:text-white">
      {children}
    </div>
  );
}
