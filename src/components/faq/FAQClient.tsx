'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, ArrowRight } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
  category: 'gst' | 'orders' | 'bulk' | 'products';
}

interface FAQClientProps {
  faqs: FAQItem[];
}

export default function FAQClient({ faqs }: FAQClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs =
    activeCategory === 'all'
      ? faqs
      : faqs.filter((f) => f.category === activeCategory);

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-[#004b87] rounded-full text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            How Can We Help Your Business?
          </h1>
          <p className="text-slate-600 text-sm md:text-base mt-2 max-w-xl mx-auto">
            Find immediate answers regarding 18% GST invoicing, Royapettah warehouse delivery, corporate bulk RFQs, and OEM product guarantees.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'gst', label: '18% GST & Invoicing' },
            { id: 'orders', label: 'Shipping & Tracking' },
            { id: 'bulk', label: 'Bulk Orders & RFQs' },
            { id: 'products', label: 'Products & Warranty' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setOpenIndex(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[#004b87] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 text-sm md:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-[#004b87]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Callout */}
        <div className="mt-12 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 text-center shadow-sm">
          <h2 className="font-semibold text-slate-900 text-base md:text-lg mb-1">
            Still Have Questions About Your Procurement?
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mb-5">
            Our procurement specialists at Officebazzar Tower, Royapettah are available Monday through Saturday.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="px-5 py-2.5 bg-[#004b87] hover:bg-[#003866] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
            >
              Contact Support Desk
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="tel:+917200800040"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
            >
              Call: +91 72008 00040
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
