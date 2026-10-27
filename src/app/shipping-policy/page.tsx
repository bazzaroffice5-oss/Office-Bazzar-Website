import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Truck, ArrowLeft } from 'lucide-react';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Shipping & Delivery Policy | Officebazzar E-Store Private Limited',
  description:
    'Dispatch timelines, free shipping thresholds, Royapettah Chennai hub dispatch schedules, and pan-India corporate logistics coverage.',
  path: '/shipping-policy',
});

export default function ShippingPolicyPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shipping Policy', path: '/shipping-policy' },
  ]);

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4">
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-shipping" />
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
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Shipping & Delivery Policy</h1>
              <p className="text-xs text-slate-500 mt-1">
                Reliable Corporate Dispatch from Officebazzar Tower, Royapettah, Chennai
              </p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-700 space-y-6 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Centralized Royapettah Dispatch Hub</h2>
              <p>
                All orders placed on OfficeBazzar are consolidated, quality-checked, and dispatched from our primary fulfillment facility located at:
                <br />
                <strong>Officebazzar Tower</strong>, No. 29/15, Subbedar Hussain Street, Royapettah, Chennai 600014, Tamil Nadu.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. Delivery Zones & Estimated Timelines</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose my-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-primary-600 font-bold text-sm mb-1">Chennai Metro & OMR</div>
                  <div className="text-xs text-slate-600">Same-Day / Next-Day Delivery</div>
                  <div className="text-[11px] text-slate-400 mt-1">For orders placed before 1:00 PM IST</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-primary-600 font-bold text-sm mb-1">Tamil Nadu Hubs</div>
                  <div className="text-xs text-slate-600">1 to 2 Business Days</div>
                  <div className="text-[11px] text-slate-400 mt-1">Coimbatore, Madurai, Trichy, Salem</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-primary-600 font-bold text-sm mb-1">Pan-India Capitals</div>
                  <div className="text-xs text-slate-600">2 to 4 Business Days</div>
                  <div className="text-[11px] text-slate-400 mt-1">Bengaluru, Hyderabad, Mumbai, Delhi</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. Shipping Fees & Free Delivery Threshold</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Free Doorstep Delivery:</strong> Applicable on standard parcel orders with a subtotal value of <strong>₹999 and above</strong>.
                </li>
                <li>
                  <strong>Nominal Flat Delivery Charge:</strong> A standard delivery fee of <strong>₹99</strong> is applied to orders below ₹999 to cover warehouse handling and parcel freight.
                </li>
                <li>
                  <strong>Heavyweight & Bulk Consignments:</strong> For bulk industrial paper consignments (e.g. 50+ cartons of copier paper) or oversized waste management bins, freight logistics charges are either waived under corporate quotation contracts or billed at actual transporter rates.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Courier Partners & Real-Time Tracking</h2>
              <p>
                We collaborate with premium logistics partners including Blue Dart, Delhivery, DTDC, and our in-house Chennai van delivery network. Once an order is handed over to the courier, an SMS and email notification containing the Waybill/AWB tracking number is automatically dispatched. You can track your shipment anytime via our{' '}
                <Link href="/track-order" className="text-primary-600 font-semibold hover:underline">
                  Track Order
                </Link>{' '}
                portal.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. Delivery Acceptance & Inspection</h2>
              <p>
                Please ensure corporate reception or security personnel inspect the outer carton seal prior to signing the delivery acknowledgment slip. If a parcel appears visibly crushed or the manufacturer tape is broken, kindly record a remark on the courier manifest or contact our support team immediately at <strong>+91 72008 00040</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
