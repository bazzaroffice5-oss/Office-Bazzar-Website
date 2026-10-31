import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Privacy Policy & Corporate Data Protection',
  description:
    'Read the Office Bazzar privacy policy covering corporate customer data protection, RFQ confidentiality, data retention, and secure B2B transaction protocols.',
  path: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
  ]);

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4">
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-privacy" />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Privacy Policy</h1>
              <p className="text-xs text-slate-500 mt-1">
                Effective Date: October 2026 • OFFICEBAZZAR E-STORE PRIVATE LIMITED
              </p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-700 space-y-6 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Overview & Commitment</h2>
              <p>
                At <strong>OfficeBazzar E-Store Private Limited</strong> (&quot;OfficeBazzar&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), having its registered office at Officebazzar Tower, No. 29/15, Subbedar Hussain Street, Royapettah, Chennai 600014, we respect your privacy and are committed to safeguarding corporate and individual personal information provided across our website.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Business & Account Information:</strong> Full name, authorized company name, corporate GSTIN, business email address, phone numbers, and designated delivery/billing addresses.
                </li>
                <li>
                  <strong>Transactional Data:</strong> Order history, itemized purchase manifests, tax invoice records, RFQ submissions, and preferred fulfillment methods.
                </li>
                <li>
                  <strong>Payment Security:</strong> We do not store sensitive payment card details or net banking credentials on our local servers. All digital payment transactions are securely routed through PCI-DSS Level 1 compliant gateway partners (e.g. Razorpay).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. Purpose of Processing</h2>
              <p>We process collected data exclusively for:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Processing, packing, and dispatching your office supply orders from our Royapettah fulfillment center.</li>
                <li>Generating certified GST tax invoices carrying correct HSN codes for your Input Tax Credit (ITC).</li>
                <li>Transmitting real-time shipment updates, courier AWB tracking links, and delivery notices.</li>
                <li>Facilitating corporate credit evaluations and customized bulk contract rate quotes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Data Sharing & Third Parties</h2>
              <p>
                We strictly do not rent, trade, or sell your corporate contact details or order volume data to third-party marketing companies. Data is disclosed solely to authorized fulfillment partners:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Logistics and courier partners (e.g., Blue Dart, Delhivery) for physical delivery execution.</li>
                <li>Statutory authorities when mandated under prevailing Indian taxation or legal compliance frameworks.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. Data Security</h2>
              <p>
                Our infrastructure employs industry-standard 256-bit SSL encryption, tokenized authentication, secure database access controls, and regular vulnerability audits to ensure your business data remains safeguarded against unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">6. Contacting the Grievance Officer</h2>
              <p>
                For questions regarding this privacy policy or to update your company details, reach out to our Grievance Officer:
                <br />
                <strong>Email:</strong> sales4@officebazzar.com / dm@officebazzar.com
                <br />
                <strong>Address:</strong> Officebazzar Tower, No. 29/15, Subbedar Hussain Street, Royapettah, Chennai 600014, Tamil Nadu.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
