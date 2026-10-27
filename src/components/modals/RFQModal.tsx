'use client';

import React, { useState } from 'react';
import { X, Send, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { createBulkRFQ } from '@/lib/db/store';
import { CATEGORIES } from '@/lib/data/catalog';

interface RFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledProduct?: string;
}

export default function RFQModal({ isOpen, onClose, prefilledProduct }: RFQModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]?.name || 'Office Supplies');
  const [requirements, setRequirements] = useState(
    prefilledProduct ? `Requirement inquiry for: ${prefilledProduct}` : ''
  );
  const [estimatedQuantity, setEstimatedQuantity] = useState('Bulk / 100+ units');
  const [deliveryLocation, setDeliveryLocation] = useState('Chennai, Tamil Nadu');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

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

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-500 rounded-sm text-slate-950 font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Corporate Bulk Quotation (RFQ)</h3>
              <p className="text-[11px] text-slate-300">Direct institutional pricing with GST invoices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close RFQ modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">RFQ Request Submitted Successfully!</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{contactPerson}</strong>. Our enterprise sales desk at <strong>OfficeBazzar Tower, Chennai</strong> has received your quotation request for <strong>{companyName}</strong>. We will contact you at <strong>{email}</strong> or <strong>{phone}</strong> within 2 business hours with wholesale rate contracts.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleReset}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
                >
                  Close &amp; Continue Browsing
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Larsen & Toubro / IT Park"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Suresh Kumar (Procurement Manager)"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="purchase@company.com"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="33AAAAA0000A1Z5"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 uppercase focus:outline-hidden focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-900"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Requirements &amp; Quantities *</label>
                <textarea
                  required
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Specify SKU, brand preference, quantity (e.g. 50 Cartons of JK Copier Paper, 20 cans of Taski R2 5L, 100 wheelie bins)..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Purchase Volume</label>
                  <input
                    type="text"
                    value={estimatedQuantity}
                    onChange={(e) => setEstimatedQuantity(e.target.value)}
                    placeholder="e.g. 100+ units / Recurring Monthly"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Destination Pin / City *</label>
                  <input
                    type="text"
                    required
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="e.g. Guindy / OMR Chennai - 600032"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  <span>Confidential corporate pricing</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-1.5 bg-[#d9232d] hover:bg-[#b81822] disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit RFQ'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
