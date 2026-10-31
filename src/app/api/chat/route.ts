import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/db/store';
import { Product } from '@/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProductCardSuggestion {
  id: string;
  name: string;
  sku: string;
  price?: number | null;
  packSize: string;
  categoryName: string;
  imageUrl?: string;
  url: string;
}

export interface ChatResponsePayload {
  reply: string;
  suggestedActions?: string[];
  productCards?: ProductCardSuggestion[];
  quickLinks?: Array<{ title: string; url: string; external?: boolean }>;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message content is required.' },
        { status: 400 }
      );
    }

    const query = message.trim().toLowerCase();
    const { products } = await getProducts();

    // 1. FAQ / Intent Matchers
    // A. Greeting
    const isGreeting =
      query === 'hi' ||
      query === 'hello' ||
      query === 'hey' ||
      query.startsWith('hello') ||
      query.startsWith('hi ') ||
      query.startsWith('hey ') ||
      query.includes('good morning') ||
      query.includes('good afternoon');

    if (isGreeting) {
      return NextResponse.json<ChatResponsePayload>({
        reply:
          "Hello! 👋 Welcome to **OfficeBazzar** — India's premier corporate office supplies and institutional procurement portal. How can I assist you with your workplace requirements today?",
        suggestedActions: [
          'Find Products',
          'Bulk Order Enquiry',
          'Get a Quotation',
          'Contact Support',
        ],
        quickLinks: [
          { title: 'Explore All Categories', url: '/categories' },
          { title: 'Bulk Order Quotation', url: '/bulk-orders' },
          { title: 'Track Live Order', url: '/track-order' },
        ],
      });
    }

    // B. Find Products / Explore Catalog
    if (
      query.includes('find product') ||
      query.includes('browse') ||
      query.includes('explore product') ||
      query === 'find products' ||
      query.includes('categories')
    ) {
      return NextResponse.json<ChatResponsePayload>({
        reply:
          "Here are our primary office supply categories for corporate and bulk procurement:\n\n" +
          "• **Copy & Printing Paper**: JK Copier A4/FS 75 & 80 GSM reams\n" +
          "• **Office Stationery**: Kangaro staplers, punching machines, files, folders, registers\n" +
          "• **Housekeeping & Facility Care**: Taski Diversey chemicals, wringer trolleys, microfiber mops\n" +
          "• **Waste Management**: Heavy-duty industrial mobile garbage bins (120L & 240L)\n" +
          "• **Printer Consumables**: Original HP, Canon, Epson laser toners & ink cartridges\n" +
          "• **Office Machines**: Lamination machines, paper shredders, binding machines\n" +
          "• **Packaging Supplies**: Corrugated boxes, bubble wrap rolls, stretch films, BOPP tapes\n\n" +
          "What specific item or category would you like to explore?",
        suggestedActions: [
          'Copy Paper',
          'Kangaro Stationery',
          'Taski Cleaning Chemicals',
          'Industrial Dustbins',
          'Printer Toners',
        ],
        quickLinks: [
          { title: 'All Categories', url: '/categories' },
          { title: 'Stationery Catalog', url: '/category/office-supplies-stationery' },
          { title: 'Housekeeping Equipment', url: '/category/housekeeping-facility' },
        ],
      });
    }

    // C. Bulk Order Enquiry / Corporate Procurement
    if (
      query.includes('bulk') ||
      query.includes('wholesale') ||
      query.includes('corporate') ||
      query.includes('enterprise') ||
      query.includes('volume')
    ) {
      return NextResponse.json<ChatResponsePayload>({
        reply:
          "### 🏢 OfficeBazzar Corporate Bulk Procurement\n\n" +
          "We offer direct enterprise distribution benefits for companies, IT parks, factories, and institutions across India:\n\n" +
          "• **Tiered Volume Pricing**: Competitive commercial discounts on carton and pallet orders.\n" +
          "• **GST Input Tax Credit**: 100% authentic B2B tax invoices with verified HSN codes.\n" +
          "• **Rapid Hub Delivery**: 24–48 business hours fulfillment across our Chennai & Bangalore distribution centers.\n" +
          "• **Dedicated Account Manager**: Single-point support for contract pricing and monthly replenishment.\n" +
          "• **Flexible Payment Terms**: Proforma invoice, NEFT/RTGS, and 15–30 days credit terms for approved corporate accounts.\n\n" +
          "Would you like to submit your bulk bill of materials (BOM) or talk directly with our sales desk?",
        suggestedActions: [
          'Submit Bulk RFQ',
          'Get a Quotation',
          'Call Sales: 7200800040',
          'Contact Support',
        ],
        quickLinks: [
          { title: 'Submit Bulk Order Form', url: '/bulk-orders' },
          { title: 'Request Formal Quotation', url: '/request-quote' },
        ],
      });
    }

    // D. Get a Quotation / RFQ Process
    if (
      query.includes('quotation') ||
      query.includes('quote') ||
      query.includes('rfq') ||
      query.includes('estimate') ||
      query.includes('price list')
    ) {
      return NextResponse.json<ChatResponsePayload>({
        reply:
          "### 📋 How to Request a Formal Quotation:\n\n" +
          "1. **Browse Products**: Select required items from our catalog and click **'Add to Quote'**.\n" +
          "2. **Review Quote Cart**: Adjust quantities for each line item in your Quote Cart.\n" +
          "3. **Submit RFQ Details**: Enter your corporate email, GSTIN, and delivery PIN code.\n" +
          "4. **Zoho CRM Registration**: Your request is registered and assigned to a dedicated corporate manager.\n" +
          "5. **Receive Official PDF**: You will receive a customized OfficeBazzar quotation with applicable volume discounts.\n\n" +
          "You can submit a custom quotation cart right now or upload your product list.",
        suggestedActions: [
          'Open Quote Cart',
          'Create Custom RFQ',
          'Find Products',
          'Contact Support',
        ],
        quickLinks: [
          { title: 'Open Quotation Cart', url: '/quote-cart' },
          { title: 'Direct RFQ Submission', url: '/request-quote' },
          { title: 'Bulk Order Portal', url: '/bulk-orders' },
        ],
      });
    }

    // E. Contact Support / Office Locations / Phone
    if (
      query.includes('contact') ||
      query.includes('phone') ||
      query.includes('call') ||
      query.includes('support') ||
      query.includes('address') ||
      query.includes('branch') ||
      query.includes('chennai') ||
      query.includes('bangalore') ||
      query.includes('headquarters') ||
      query.includes('office')
    ) {
      return NextResponse.json<ChatResponsePayload>({
        reply:
          "### 📍 OfficeBazzar Corporate Contact & Branch Directory\n\n" +
          "**Chennai Branch (Regional Hub):**\n" +
          "Royapettah, Chennai – 600014\n" +
          "📞 Phone: **+91 7200800040**\n\n" +
          "**Bangalore Branch:**\n" +
          "Koramangala 4th Block, Bangalore – 560034\n\n" +
          "**Mumbai Branch:**\n" +
          "Andheri East, Mumbai – 400069\n\n" +
          "**Hyderabad Branch:**\n" +
          "Hitec City, Madhapur, Hyderabad – 500081\n\n" +
          "**Registered Corporate Headquarters:**\n" +
          "Plot No. 12, Industrial Logistics Hub, Ambattur Industrial Estate, Chennai – 600058\n\n" +
          "📧 **Sales & Quotes**: [sales4@officebazzar.com](mailto:sales4@officebazzar.com)\n" +
          "📧 **General Enquiries**: [contact@officebazzar.com](mailto:contact@officebazzar.com)\n" +
          "⏰ **Support Hours**: Monday – Saturday, 9:00 AM – 7:00 PM IST",
        suggestedActions: [
          'Call: 7200800040',
          'Email Sales Team',
          'Get a Quotation',
          'Find Products',
        ],
        quickLinks: [
          { title: 'Contact Us Page', url: '/contact' },
          { title: 'Call Chennai Branch', url: 'tel:7200800040', external: true },
          { title: 'Email Sales', url: 'mailto:sales4@officebazzar.com', external: true },
        ],
      });
    }

    // F. Track Order / Shipping / Delivery
    if (
      query.includes('track') ||
      query.includes('order status') ||
      query.includes('where is my order') ||
      query.includes('delivery') ||
      query.includes('shipping') ||
      query.includes('dispatch')
    ) {
      return NextResponse.json<ChatResponsePayload>({
        reply:
          "### 🚚 Shipping & Order Tracking\n\n" +
          "• **Standard Delivery Time**: 24–48 business hours across Chennai and Bangalore metropolitan hubs; 3–5 business days across Pan-India via surface express.\n" +
          "• **Tracking**: You can track live consignments anytime using your Order Number or AWB.\n" +
          "• **GST Delivery Challan**: Delivered with official physical invoice copies for company gate entry and materials inwards inspection.\n\n" +
          "Click below to look up your order status:",
        suggestedActions: [
          'Track My Order',
          'Contact Support',
          'Return & Refund Policy',
        ],
        quickLinks: [
          { title: 'Track Order Page', url: '/track-order' },
          { title: 'Shipping Policy', url: '/shipping-policy' },
        ],
      });
    }

    // G. GST / Invoicing / Payment Options
    if (
      query.includes('gst') ||
      query.includes('tax') ||
      query.includes('invoice') ||
      query.includes('payment') ||
      query.includes('neft') ||
      query.includes('credit')
    ) {
      return NextResponse.json<ChatResponsePayload>({
        reply:
          "### 💼 GST Invoicing & Payment Terms\n\n" +
          "• **GST Input Tax Credit (ITC)**: Every delivery includes an official GST Tax Invoice containing your company's 15-digit GSTIN, state code, and relevant product HSN codes.\n" +
          "• **Standard GST Rate**: 18% GST applicable across stationery, cleaning chemicals, toners, and packaging items; 12% on specific paper lines.\n" +
          "• **Accepted Payment Modes**:\n" +
          "  - **Online**: UPI, Netbanking, Corporate Credit & Debit Cards (secured by Razorpay)\n" +
          "  - **NEFT / RTGS**: Direct bank transfer against official Proforma Invoice\n" +
          "  - **Corporate Credit Terms**: 15 to 30 days credit available for verified institutional accounts.\n\n" +
          "Would you like to speak with our finance desk or submit an RFQ?",
        suggestedActions: [
          'Submit Bulk RFQ',
          'Get a Quotation',
          'Contact Support',
        ],
        quickLinks: [
          { title: 'Corporate FAQ', url: '/faq' },
          { title: 'Terms & Conditions', url: '/terms' },
        ],
      });
    }

    // 2. Product Search in Authentic Catalog
    const searchTokens = query
      .split(/[\s,+/&.-]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !['and', 'for', 'the', 'with', 'item', 'items', 'please'].includes(t));

    const matchedProducts = products.filter((p: Product) => {
      const pName = p.name.toLowerCase();
      const pSku = p.sku.toLowerCase();
      const pCat = (p.categoryName || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      const fullText = `${pName} ${pSku} ${pCat} ${pDesc}`;

      if (fullText.includes(query)) return true;

      // Check if at least one meaningful token matches
      return searchTokens.some((token) => fullText.includes(token));
    });

    if (matchedProducts.length > 0) {
      const topMatches = matchedProducts.slice(0, 4);
      const productCards: ProductCardSuggestion[] = topMatches.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        packSize: p.packSize || '1 Unit',
        categoryName: p.categoryName,
        imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined,
        url: `/product/${p.slug || p.id}`,
      }));

      const reply = `I found **${matchedProducts.length}** product(s) matching your search for **"${message.trim()}"**. Here are the top recommendations from our live corporate catalog:`;

      return NextResponse.json<ChatResponsePayload>({
        reply,
        productCards,
        suggestedActions: [
          'Get a Quotation',
          'Bulk Order Enquiry',
          'View More Categories',
          'Contact Support',
        ],
        quickLinks: [
          { title: 'Explore All Products', url: '/products' },
          { title: 'Request Bulk Quote', url: '/request-quote' },
        ],
      });
    }

    // 3. Fallback Contextual Response
    return NextResponse.json<ChatResponsePayload>({
      reply:
        `Thank you for asking about **"${message.trim()}"**. As your OfficeBazzar assistant, I can help you source office supplies, housekeeping chemicals, toners, packaging, and commercial equipment.\n\n` +
        "You can search our catalog, request an official bulk quotation, or speak directly with our Chennai sales team at **+91 7200800040**.",
      suggestedActions: [
        'Find Products',
        'Bulk Order Enquiry',
        'Get a Quotation',
        'Contact Support',
      ],
      quickLinks: [
        { title: 'All Categories', url: '/categories' },
        { title: 'Request Quote', url: '/request-quote' },
        { title: 'Call 7200800040', url: 'tel:7200800040', external: true },
      ],
    });
  } catch (error: unknown) {
    console.error('[Chat API Error]:', error);
    return NextResponse.json<ChatResponsePayload>(
      {
        reply:
          "I'm here to assist you with office supplies, catalog pricing, and quotations. How can I help you today?",
        suggestedActions: [
          'Find Products',
          'Bulk Order Enquiry',
          'Get a Quotation',
          'Contact Support',
        ],
      },
      { status: 200 }
    );
  }
}
