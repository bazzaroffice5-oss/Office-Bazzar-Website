import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { XCircle, ArrowLeft } from 'lucide-react';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Cancellation Policy | Officebazzar E-Store Private Limited',
  description:
    'Order cancellation rules prior to dispatch from our Royapettah Chennai warehouse, custom fabrication guidelines, and post-dispatch procedures.',
  path: '/cancellation-policy',
});

export default function CancellationPolicyPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Cancellation Policy', path: '/cancellation-policy' },
  ]);

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4">
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-cancellation" />
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
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Cancellation Policy</h1>
              <p className="text-xs text-slate-500 mt-1">
                Guidelines for modifying or cancelling corporate supply orders
              </p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-700 space-y-6 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Cancellation Prior to Warehouse Dispatch</h2>
              <p>
                Customers may cancel standard catalog orders at no penalty any time prior to the order being packed and handed over to our logistics courier. Because orders placed before 1:00 PM IST undergo expedited same-day fulfillment, cancellation requests should be initiated as early as possible by calling <strong>+91 72008 00040</strong> or emailing <strong>sales4@officebazzar.com</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. Cancellation After Dispatch</h2>
              <p>
                Once an order has been assigned an Air Waybill (AWB) number and dispatched via courier, real-time transit cancellation is not possible. In such instances, customers may decline delivery at the time of doorstep presentation, and the shipment will be returned to our Royapettah hub for return processing.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. Customized & Special Procurements</h2>
              <p>
                Bulk orders involving custom-printed stationery, company-branded letterheads, specific non-standard packaging tape sizes, or specially imported hardware items cannot be canceled once fabrication or manufacturer procurement has commenced.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Automatic Cancellation by OfficeBazzar</h2>
              <p>
                OfficeBazzar reserves the right to cancel an order under specific exceptional circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Unavailability of stock due to sudden OEM manufacturer disruption or discontinued product lines.</li>
                <li>Inability to obtain payment authorization or detection of fraudulent transaction characteristics.</li>
                <li>Incomplete or non-serviceable pin code / delivery address provided.</li>
              </ul>
              <p className="mt-2">
                In all such scenarios, the customer is notified immediately, and any collected funds are refunded 100% within 24 to 48 hours.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
