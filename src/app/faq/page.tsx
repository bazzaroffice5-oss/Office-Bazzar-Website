import React from 'react';
import { Metadata } from 'next';
import FAQClient, { FAQItem } from '@/components/faq/FAQClient';
import { constructMetadata, getFaqJsonLd, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

const faqs: FAQItem[] = [
  {
    category: 'gst',
    question: 'How do I claim 18% GST Input Tax Credit (ITC) on my orders?',
    answer:
      'Simply enter your company name and 15-digit Corporate GSTIN (e.g. 33AAAAA0000A1Z5) during checkout or in your Account Profile. Every shipment comes accompanied by a digitally signed Tax Invoice detailing HSN/SAC codes, taxable amounts, and CGST/SGST/IGST breakdown so your accounting department can seamlessly claim Input Tax Credit on the GST portal.',
  },
  {
    category: 'gst',
    question: 'Can I get invoices with state-specific billing addresses?',
    answer:
      'Yes. Our checkout system allows you to specify distinct billing addresses and shipping addresses with corporate GSTIN details matching the respective state jurisdiction.',
  },
  {
    category: 'orders',
    question: 'What is the delivery timeline for Chennai and other parts of India?',
    answer:
      'Orders placed before 1:00 PM IST for in-stock items are dispatched the same day from our Royapettah, Chennai warehouse. Delivery across Chennai metro, Guindy, Tidel Park, and OMR IT corridor takes Same-Day to 24 Hours. Tamil Nadu tier-1/tier-2 cities take 1-2 business days. Major metropolitan cities across India take 2-4 business days.',
  },
  {
    category: 'orders',
    question: 'What are the delivery charges and is there a free shipping threshold?',
    answer:
      'Orders with a subtotal value of ₹999 and above qualify for Free Doorstep Delivery. For smaller orders below ₹999, a flat delivery fee of ₹99 is applied to cover handling and courier freight.',
  },
  {
    category: 'orders',
    question: 'How do I track my active order?',
    answer:
      'You can track your order at any time using our "Track Order" portal located in the header. Enter your unique Order Number (e.g., OB-2026-1001) or registered phone number to view real-time courier AWB milestones and expected delivery time.',
  },
  {
    category: 'bulk',
    question: 'How does the Corporate RFQ / Bulk Quotation process work?',
    answer:
      'For large quantity procurement (such as monthly supplies of copier paper cartons, full-floor housekeeping packages, or annual contracts), click on "Bulk Orders / RFQ" or use the instant RFQ button on any product page. Submit your target quantities, and our corporate sales team in Royapettah will prepare a formal discounted quotation within 2 to 4 business hours.',
  },
  {
    category: 'bulk',
    question: 'Do you offer credit terms or scheduled monthly supply contracts?',
    answer:
      'Yes. Established corporate institutions, IT companies, and educational organizations can enroll in our Corporate Credit Program upon submission of statutory KYC documents, offering 15-day or 30-day payment cycles.',
  },
  {
    category: 'products',
    question: 'Are all products 100% genuine OEM items?',
    answer:
      'Absolutely. OfficeBazzar operates direct institutional distribution relationships with major OEMs including Diversey (Taski), JK Paper, Kangaro, Kimberly-Clark, Camlin, HP, and Bambalio. We never supply refurbished, counterfeit, or diluted products.',
  },
  {
    category: 'products',
    question: 'What if a product arrives damaged or defective?',
    answer:
      'We provide a hassle-free 7-day institutional return policy for transit-damaged, mechanically defective, or incorrect units. Notify our support desk with a photo of the item, and we will arrange a zero-cost courier reverse pickup and prompt replacement or refund.',
  },
];

export const metadata: Metadata = constructMetadata({
  title: 'Frequently Asked Questions (FAQ)',
  description:
    'Find clear answers on 18% GST Input Tax Credit invoicing, corporate bulk order quotations, warehouse dispatch timelines across India, and our 7-day return policy.',
  path: '/faq',
});

export default function FAQPage() {
  const faqJsonLd = getFaqJsonLd(faqs);
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Frequently Asked Questions', url: '/faq' },
  ]);

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <FAQClient faqs={faqs} />
    </>
  );
}
