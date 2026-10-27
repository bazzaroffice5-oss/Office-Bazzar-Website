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
    question: 'What products does Office Bazzar supply?',
    answer:
      'Office Bazzar supplies workplace essentials, including office stationery, housekeeping and hygiene products, printers and technology supplies, packaging materials, and other business essentials.',
  },
  {
    id: 'faq-2',
    question: 'Do you provide bulk purchasing for businesses?',
    answer:
      'Yes. Businesses can enquire about bulk quantities and request a quotation based on their product requirements. Availability and pricing are confirmed during the quotation process.',
  },
  {
    id: 'faq-3',
    question: 'How can I request a quotation?',
    answer:
      'Browse the available products, add the required items to your quote cart, and submit a quote request with your business contact details. The team can then review your requirements.',
  },
  {
    id: 'faq-4',
    question: 'Which locations do you serve?',
    answer:
      'Office Bazzar operates from its Central Logistics Hub in Royapettah, Chennai. Confirm the actual delivery service areas with the business before displaying specific delivery coverage or guarantees.',
  },
  {
    id: 'faq-5',
    question: 'Can I request multiple products in one quotation?',
    answer:
      'Yes. Add the required products and quantities to your quote cart and submit them together in a single quotation request, provided the existing website supports this workflow.',
  },
  {
    id: 'faq-6',
    question: 'How can I contact Office Bazzar?',
    answer:
      'You can contact the team at +91 72008 00040 or sales4@officebazzar.com for product enquiries and quotation assistance.',
  },
  {
    id: 'faq-7',
    question: 'Do you supply products for different workplace requirements?',
    answer:
      'Yes. Businesses can explore the available product categories to find stationery, housekeeping, technology, and packaging supplies suited to their workplace needs.',
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
      className="w-full py-14 sm:py-16 lg:py-20 bg-white border-b border-slate-100"
    >
      <div className="w-full max-w-[800px] mx-auto px-4 sm:px-6">
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
