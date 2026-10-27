import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Returns & Refunds Policy | Officebazzar E-Store Private Limited',
  description:
    '7-day return policy for defective, transit-damaged, or incorrect office supplies and transparent credit note and refund processing.',
  path: '/returns-refunds',
});

export default function ReturnsRefundsPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Returns & Refunds', path: '/returns-refunds' },
  ]);

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4">
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-returns" />
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
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Returns & Refunds Policy</h1>
              <p className="text-xs text-slate-500 mt-1">
                Fair, transparent return terms for institutional workplace procurement
              </p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-700 space-y-6 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. 7-Day Institutional Return Window</h2>
              <p>
                We stand behind the quality and authenticity of every product dispatched. If your order arrives damaged, defective, or contains an incorrect item, you can initiate a return or replacement request within <strong>7 days of delivery</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. Eligible Reasons for Return</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Transit Damage:</strong> Outer container ruptured, leaking liquid chemicals, or broken structural components.</li>
                <li><strong>Defective Hardware:</strong> Heavy duty staplers, paper shredders, or whiteboards with functional mechanical defects.</li>
                <li><strong>Incorrect Item Received:</strong> Discrepancy between the SKU invoiced and the physical model delivered.</li>
                <li><strong>Dead on Arrival (DOA):</strong> Unopened toner cartridges throwing instant chip errors or manufacturing faults.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. Non-Returnable Items</h2>
              <p>
                For hygiene, safety, and brand warranty preservation, the following products cannot be accepted for return once the inner manufacturer seal has been unsealed:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Housekeeping liquid chemicals and disinfectants once the cap seal is opened.</li>
                <li>Tissue paper rolls and face masks with opened protective wrappers.</li>
                <li>Cut or custom-printed packaging tapes and tailored signage boards.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Return Pickup Process</h2>
              <p>
                To initiate a return, contact our institutional support desk at <strong>sales4@officebazzar.com</strong> or call <strong>+91 72008 00040</strong> with your Order Number (e.g., OB-2026-XXXXXX) and a photograph of the damaged or incorrect unit. Our team will schedule a reverse pickup through our courier network at zero cost to you.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. Refund Timelines</h2>
              <p>
                Once returned merchandise is received and verified at our Royapettah warehouse:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li><strong>Prepaid Online Orders:</strong> Refunds are credited back to the original payment source (Card, UPI, Net Banking) within <strong>3 to 5 business days</strong>.</li>
                <li><strong>NEFT/RTGS Bank Transfers:</strong> Direct bank account transfer credited within 2 business days following receipt of canceled invoice documentation.</li>
                <li><strong>Credit Adjustments:</strong> For corporate account holders, a Credit Note is issued against future procurement orders.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
