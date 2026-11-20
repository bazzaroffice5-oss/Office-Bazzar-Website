'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: 'What products does OfficeBazzar supply for businesses?',
    answer:
      'OfficeBazzar is a complete B2B workplace supplier. We manufacture Hi-Clean commercial cleaning formulations in-house, and supply corporate office stationery, JK Copier paper, Diversey Taski hygiene products, laser printer toners, and packaging materials to corporate offices, IT parks, hospitals, and educational institutions across South India.',
  },
  {
    id: 'faq-2',
    question: 'Do you offer tiered wholesale pricing for corporate bulk orders?',
    answer:
      'Yes. We provide tiered wholesale slabs and Annual Rate Contracts (ARC) tailored for purchase managers and facility teams. Every bulk order is billed with 100% compliant GST input tax credit (ITC) invoices detailing exact HSN/SAC codes.',
  },
  {
    id: 'faq-3',
    question: 'How do I request a formal quotation?',
    answer:
      'Select your required items and quantities in the Quote Cart, then click "Submit Quote". Our Royapettah sales desk will verify inventory availability and email an official GST quotation with HSN breakdown within 2 to 4 business hours.',
  },
  {
    id: 'faq-4',
    question: 'Which locations do you deliver to?',
    answer:
      'We operate our central warehouse hub at Officebazzar Tower in Royapettah, Chennai, with daily dedicated fleet delivery across the Chennai metro (OMR, Guindy, Ambattur, Sriperumbudur). We also provide scheduled institutional dispatches to Bangalore, Hyderabad, Mumbai, and pan-India locations.',
  },
  {
    id: 'faq-5',
    question: 'Can I consolidate stationery, housekeeping, and IT consumables into one quote?',
    answer:
      'Yes. You can combine office stationery, housekeeping chemicals, printer cartridges, and packaging supplies into a single quote request. We consolidate billing and dispatch under one formal B2B invoice.',
  },
  {
    id: 'faq-6',
    question: 'How can purchase managers reach the sales desk directly?',
    answer:
      'You can contact our corporate procurement desk directly at +91 72008 00040 (Phone / WhatsApp) or email sales4@officebazzar.com. For vendor empanelment and escalations, write to dm@officebazzar.com.',
  },
  {
    id: 'faq-7',
    question: 'Do you offer 30-day corporate credit terms?',
    answer:
      'Yes. Established corporate institutions, hospitals, and educational campuses can enroll in our 15-day or 30-day institutional credit facility upon standard KYC and GSTIN verification.',
  },
];

interface HomeFaqSectionProps {
  defaultOpen?: boolean | string | null;
}

export default function HomeFaqSection({ defaultOpen = false }: HomeFaqSectionProps = {}) {
  const [openId, setOpenId] = useState<string | null>(
    typeof defaultOpen === 'string' ? defaultOpen : defaultOpen ? 'faq-1' : null
  );

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      aria-label="Frequently Asked Questions"
      className="w-full py-12 sm:py-16 lg:py-18 bg-white border-b border-slate-100"
    >
      <div className="w-full max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Heading */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1.5 font-normal">
            Common questions about our workplace supplies & corporate procurement.
          </p>
          <div className="w-8 h-0.5 bg-[#ea580c] mx-auto mt-2.5 rounded-full" />
        </div>

        {/* Accordion Container */}
        <div className="border-t border-slate-200/80 divide-y divide-slate-200/80">
          {FAQS.map((item) => {
            const isOpen = openId === item.id;

            return (
              <div key={item.id} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggleFAQ(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  id={`faq-question-${item.id}`}
                  className="group flex items-center justify-between gap-4 w-full py-4 sm:py-5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004b87] rounded-sm"
                >
                  <span
                    className={`text-sm sm:text-base font-semibold transition-colors pr-2 leading-snug ${
                      isOpen
                        ? 'text-[#004b87]'
                        : 'text-slate-900 group-hover:text-[#004b87]'
                    }`}
                  >
                    {item.question}
                  </span>

                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? 'rotate-180 text-[#ea580c]'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {/* Animated Expandable Answer Content */}
                <div
                  id={`faq-answer-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-question-${item.id}`}
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen
                      ? 'grid-rows-[1fr] opacity-100 pb-4 sm:pb-5'
                      : 'grid-rows-[0fr] opacity-0 pb-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
