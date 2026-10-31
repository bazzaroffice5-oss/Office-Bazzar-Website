'use client';

import React, { useState } from 'react';
import {
  Building2,
  Send,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  Percent,
} from 'lucide-react';
import { createBulkRFQ } from '@/lib/db/store';
import { CATEGORIES } from '@/lib/data/catalog';

export default function BulkOrdersClient() {
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]?.name || 'Office Supplies');
  const [requirements, setRequirements] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('100+ units / Recurring');
  const [deliveryLocation, setDeliveryLocation] = useState('Chennai, Tamil Nadu');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !email || !phone) return;

    setIsSubmitting(true);
    await createBulkRFQ({
      companyName,
      contactPerson,
      email,
      phone,
      gstin,
      category,
      requirements,
      estimatedQuantity,
      deliveryLocation,
    });
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <Percent className="w-3.5 h-3.5 text-amber-600" />
            <span>Institutional Procurement</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Corporate Bulk Orders &amp; Contract Sourcing
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Partner with OfficeBazzar E-Store Private Limited for contract-rate supply of copier paper, housekeeping chemicals, waste management equipment, and office consumables.
          </p>

          <div className="space-y-4 pt-2">
            {[
              {
                title: 'Direct Wholesale Pricing',
                desc: 'Tiered wholesale discounts for monthly enterprise consumption, pallet deliveries, and multi-branch rollouts.',
                icon: Percent,
              },
              {
                title: '100% Verified GSTITC Invoices',
                desc: 'Digital invoices with full HSN code classification and state-specific tax breakdown for seamless Input Tax Credit.',
                icon: ShieldCheck,
              },
              {
                title: 'Dedicated Account Manager',
                desc: 'Single point of contact at Officebazzar Tower, Royapettah with tailored billing cycles and credit arrangements.',
                icon: Building2,
              },
              {
                title: 'Warehouse Fleet Dispatch',
                desc: 'Same-day to 24-hour fleet delivery across Chennai industrial estates, IT corridors, and manufacturing hubs.',
                icon: PackageCheck,
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="flex items-start space-x-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="p-2 bg-white rounded-lg text-primary-600 shadow-2xs border border-slate-200/60 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-slate-900">{feat.title}</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 bg-gradient-to-br from-primary-900 to-slate-900 text-white rounded-2xl shadow-sm space-y-3">
            <h2 className="text-xs font-semibold text-amber-400">Direct Institutional Desk</h2>
            <p className="text-xs text-slate-200 leading-relaxed">
              Require an urgent bulk quotation within 2 hours? Reach out directly to our institutional procurement team in Royapettah.
            </p>
            <div className="pt-1 flex flex-col space-y-1.5 text-xs font-medium">
              <a href="tel:+917200800040" className="flex items-center space-x-2 text-white hover:text-amber-400 transition-colors">
                <Phone className="w-3.5 h-3.5" />
                <span>+91 72008 00040</span>
              </a>
              <a href="mailto:sales4@officebazzar.com" className="flex items-center space-x-2 text-white hover:text-amber-400 transition-colors">
                <Mail className="w-3.5 h-3.5" />
                <span>sales4@officebazzar.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">RFQ Submitted Successfully!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you, <span className="font-semibold text-slate-900">{contactPerson}</span>. Our corporate procurement specialists are reviewing your requirements for <span className="font-semibold text-slate-900">{companyName}</span> and will share an official commercial quotation shortly.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 underline"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h2 className="text-base font-bold text-slate-900">Request Formal Institutional Quotation</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Fill out your company details to receive official wholesale rates with GST compliance.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bulk-company-name" className="block text-xs font-bold text-slate-700 mb-1">Company / Organization *</label>
                    <input
                      id="bulk-company-name"
                      type="text"
                      required
                      placeholder="e.g., Tech Solutions Pvt Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="bulk-contact-person" className="block text-xs font-bold text-slate-700 mb-1">Contact Person *</label>
                    <input
                      id="bulk-contact-person"
                      type="text"
                      required
                      placeholder="e.g., Rajesh Kumar (Procurement Mgr)"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bulk-official-email" className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
                    <input
                      id="bulk-official-email"
                      type="email"
                      required
                      placeholder="procurement@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="bulk-phone" className="block text-xs font-bold text-slate-700 mb-1">Direct Phone / Mobile *</label>
                    <input
                      id="bulk-phone"
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bulk-gstin" className="block text-xs font-bold text-slate-700 mb-1">Corporate GSTIN (Optional)</label>
                    <input
                      id="bulk-gstin"
                      type="text"
                      placeholder="33AAAAA0000A1Z5"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label htmlFor="bulk-primary-category" className="block text-xs font-bold text-slate-700 mb-1">Primary Category</label>
                    <select
                      id="bulk-primary-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="Multi-Category Corporate Setup">Full Facility Package (Multi-Category)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="bulk-requirements" className="block text-xs font-bold text-slate-700 mb-1">Specific SKUs / Quantities / Brands *</label>
                  <textarea
                    id="bulk-requirements"
                    required
                    rows={4}
                    placeholder="List required items, pack sizes, and brands (e.g. 100 Cartons JK Copier Paper A4, 20 Units Taski R2 5L, 10 Units 120L Mobile Garbage Bins...)"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bulk-estimated-quantity" className="block text-xs font-bold text-slate-700 mb-1">Estimated Quantity / Frequency</label>
                    <input
                      id="bulk-estimated-quantity"
                      type="text"
                      value={estimatedQuantity}
                      onChange={(e) => setEstimatedQuantity(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="bulk-delivery-destination" className="block text-xs font-bold text-slate-700 mb-1">Delivery Destination</label>
                    <input
                      id="bulk-delivery-destination"
                      type="text"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Sending Request...' : 'Submit Institutional RFQ'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
