import { GoogleGenAI, Type } from '@google/genai';
import { getProducts, createQuotation } from '@/lib/db/store';
import { Product } from '@/types';
import { syncQuotationToZoho } from '@/lib/zoho/crm';
import { dispatchQuotationNotifications } from '@/lib/notifications/service';
import { getNextLeadAssignee } from '@/lib/zoho/round-robin';

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

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

// In-memory sliding window rate limiter
const ipRateMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 20;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const history = ipRateMap.get(ip) || [];
  const valid = history.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (valid.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  valid.push(now);
  ipRateMap.set(ip, valid);
  return true;
}

// Function Declarations for Gemini
const bazzarAITools: any[] = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description:
          'Search the authentic OfficeBazzar catalog for office stationery, files, folders, housekeeping cleaning chemicals, dustbins, tissue paper, paper shredders, packaging, etc. Returns real matched products with SKU, name, price, pack size, stock, category and product URL.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: 'Product name, brand, or keywords (e.g. "stapler", "dustbin", "shredder", "file", "cleaning chemical")',
            },
            category: {
              type: Type.STRING,
              description: 'Optional category name (e.g. "Office Stationery", "Housekeeping & Hygiene", "Packaging Supplies", "Printers & Technology")',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_product_details',
        description:
          'Get full authentic specifications, price, pack size and stock of a specific product by its exact SKU or name.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            skuOrName: {
              type: Type.STRING,
              description: 'Exact product SKU (e.g. OB-STA-1009) or product name',
            },
          },
          required: ['skuOrName'],
        },
      },
      {
        name: 'submit_bulk_enquiry',
        description:
          'Submit an official corporate quotation request / bulk RFQ to OfficeBazzar sales desk in Zoho CRM. Call this only when the customer has provided their contact details (name and email or phone) and requested products/quantities.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING, description: 'Customer or contact person full name' },
            email: { type: Type.STRING, description: 'Corporate email address' },
            phone: { type: Type.STRING, description: '10-digit mobile or contact number' },
            companyName: { type: Type.STRING, description: 'Company or institution name' },
            deliveryLocation: { type: Type.STRING, description: 'City or delivery PIN code' },
            requestedItems: {
              type: Type.ARRAY,
              description: 'List of requested items and quantities',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Product name or SKU' },
                  quantity: { type: Type.INTEGER, description: 'Required quantity' },
                },
                required: ['name', 'quantity'],
              },
            },
            notes: { type: Type.STRING, description: 'Additional instructions or requirements' },
          },
          required: ['customerName', 'phone'],
        },
      },
    ],
  },
];

const BAZZAR_AI_SYSTEM_INSTRUCTION = `You are Bazzar AI, the official intelligent corporate assistant for OfficeBazzar (Officebazzar E-Store Private Limited) — India's premier B2B corporate supplies portal located at Royapettah, Chennai.

CRITICAL OPERATIONAL RULES:
1. STRICT DOMAIN RESTRICTION: You ONLY answer queries directly related to OfficeBazzar: corporate office stationery, files and folders, housekeeping chemicals (Hi-Clean formulations, commercial sanitizers), mobile dustbins, tissue paper, shredding machines, packaging materials, quotation requests, bulk order pricing, GST invoicing, shipping, delivery and branch contact details.
   - If asked about ANY unrelated subject (e.g. sports, politics, general coding, homework, cooking recipes, personal opinions, world news, or non-workplace items), politely decline and steer them back: "I am specialized only in OfficeBazzar corporate supplies and procurement. How can I assist with your office requirements today?"
2. MULTILINGUAL SUPPORT: You seamlessly understand and converse in:
   - English (professional, courteous B2B tone)
   - Tamil (தமிழ்) (e.g. "வணக்கம்! OfficeBazzar-க்கு வரவேற்கிறோம். உங்களுக்கு என்ன ஆபீஸ் பொருட்கள் தேவை?")
   - Tanglish (Tamil in Latin script, e.g. "Vanakkam! Ungal office-ku enna stationery venum?")
   Always reply in the language or blend of languages the user initiated with.
3. ZERO HALLUCINATION (NEVER INVENT DATA):
   - NEVER invent product names, prices, stock levels, or technical specifications.
   - ALWAYS call 'search_products' or 'get_product_details' to look up products in the authentic database before quoting product info.
   - In our B2B catalog, items with price ₹0 or unlisted price indicate institutional wholesale pricing. Explain that exact corporate pricing is provided based on order quantity via quotation.
   - If a product is not found in the search results, honestly state: "We do not currently have [item] in our live catalog. However, our dedicated procurement desk at sales4@officebazzar.com / +91 7200800040 can source this directly for your corporate account."
4. STRICT RFQ CONFIRMATION RULE:
   - NEVER confirm that a bulk enquiry or quotation has been submitted unless the 'submit_bulk_enquiry' tool was executed and returned success=true.
   - Quote the returned Quotation Number (OB-RFQ-...) and assigned sales email upon confirmation.
5. NO EXTERNAL WEB SEARCH: Strictly rely on your internal tools and authentic OfficeBazzar company facts.`;

export async function processBazzarAIChat(
  userMessage: string,
  history: ConversationTurn[] = [],
  clientIp: string = '127.0.0.1'
): Promise<ChatResponsePayload> {
  const accumulatedCards: ProductCardSuggestion[] = [];

  // 1. Input Validation
  const trimmed = userMessage.trim();
  if (!trimmed || trimmed.length > 1000) {
    return {
      reply: 'Please provide a valid message between 1 and 1000 characters.',
      suggestedActions: ['Find Products', 'Bulk Order Enquiry', 'Get a Quotation', 'Contact Support'],
    };
  }

  // 2. Rate Limiting Check
  if (!checkRateLimit(clientIp)) {
    return {
      reply: 'You are sending messages too quickly. Please wait a few seconds before trying again.',
      suggestedActions: ['Find Products', 'Contact Support'],
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Format previous turns for Gemini Chat
    // Take only the last 6 valid turns for conversation context
    const validHistory = history
      .slice(-6)
      .filter((h) => h.content && h.content.trim())
      .map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

    const chat = ai.chats.create({
      model: modelName,
      history: validHistory,
      config: {
        systemInstruction: BAZZAR_AI_SYSTEM_INSTRUCTION,
        tools: bazzarAITools,
      },
    });

    let currentResponse = await chat.sendMessage({ message: trimmed });

    // Multi-turn tool execution loop (max 3 tool iterations)
    let iterations = 0;
    while (
      currentResponse.functionCalls &&
      currentResponse.functionCalls.length > 0 &&
      iterations < 3
    ) {
      iterations++;
      const toolCall = currentResponse.functionCalls[0];
      const fnName = toolCall.name;
      const args = (toolCall.args || {}) as Record<string, any>;

      let toolResult: any = { error: 'Unknown function' };

      if (fnName === 'search_products') {
        const query = String(args.query || '').trim().toLowerCase();
        const categoryFilter = args.category ? String(args.category).toLowerCase() : undefined;
        const { products } = await getProducts();

        const searchTokens = query
          .split(/[\s,+/&.-]+/)
          .map((t) => t.trim())
          .filter((t) => t.length >= 2 && !['and', 'for', 'the', 'with', 'item', 'items', 'please'].includes(t));

        // Score products by relevance
        const scored = products
          .map((p) => {
            const pName = p.name.toLowerCase();
            const pSku = p.sku.toLowerCase();
            const pCat = (p.categoryName || '').toLowerCase();
            const pDesc = (p.description || '').toLowerCase();
            let score = 0;

            if (categoryFilter && pCat.includes(categoryFilter)) score += 5;
            if (pName.includes(query)) score += 10;
            if (pSku.includes(query)) score += 12;

            for (const token of searchTokens) {
              if (pName.includes(token)) score += 4;
              if (pSku.includes(token)) score += 6;
              if (pCat.includes(token)) score += 2;
              if (pDesc.includes(token)) score += 1;
            }

            return { product: p, score };
          })
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((item) => item.product);

        if (scored.length > 0) {
          // Add to accumulated product cards for frontend display
          for (const sp of scored) {
            if (!accumulatedCards.some((c) => c.sku === sp.sku)) {
              accumulatedCards.push({
                id: sp.id,
                name: sp.name,
                sku: sp.sku,
                price: sp.price && sp.price > 0 ? sp.price : null,
                packSize: sp.packSize || '1 Unit',
                categoryName: sp.categoryName,
                imageUrl: sp.images && sp.images.length > 0 ? sp.images[0] : undefined,
                url: `/product/${sp.slug || sp.id}`,
              });
            }
          }

          toolResult = {
            found: true,
            count: scored.length,
            products: scored.map((p) => ({
              sku: p.sku,
              name: p.name,
              category: p.categoryName,
              packSize: p.packSize,
              price: p.price && p.price > 0 ? `₹${p.price}` : 'Institutional wholesale pricing available on quotation',
              stockStatus: p.stockQuantity > 0 ? 'In Stock (Chennai & Bangalore Hubs)' : 'Available on Corporate Order',
              slug: p.slug || p.id,
            })),
          };
        } else {
          toolResult = {
            found: false,
            count: 0,
            message: `No products matching "${query}" were found in the live OfficeBazzar catalog. Our procurement desk can source this item upon request.`,
          };
        }
      } else if (fnName === 'get_product_details') {
        const query = String(args.skuOrName || '').trim().toLowerCase();
        const { products } = await getProducts();
        const match = products.find(
          (p) =>
            p.sku.toLowerCase() === query ||
            p.name.toLowerCase() === query ||
            (p.slug && p.slug.toLowerCase() === query) ||
            p.name.toLowerCase().includes(query)
        );

        if (match) {
          if (!accumulatedCards.some((c) => c.sku === match.sku)) {
            accumulatedCards.push({
              id: match.id,
              name: match.name,
              sku: match.sku,
              price: match.price && match.price > 0 ? match.price : null,
              packSize: match.packSize || '1 Unit',
              categoryName: match.categoryName,
              imageUrl: match.images && match.images.length > 0 ? match.images[0] : undefined,
              url: `/product/${match.slug || match.id}`,
            });
          }

          toolResult = {
            found: true,
            sku: match.sku,
            name: match.name,
            category: match.categoryName,
            packSize: match.packSize,
            price: match.price && match.price > 0 ? `₹${match.price}` : 'Wholesale pricing available on quotation',
            description: match.description,
            hsnCode: match.hsnCode,
            gstPercent: match.gstPercent || 18,
            stockStatus: match.stockQuantity > 0 ? 'Available for immediate dispatch' : 'Corporate order on demand',
          };
        } else {
          toolResult = {
            found: false,
            message: `Product "${query}" was not found in the live database.`,
          };
        }
      } else if (fnName === 'submit_bulk_enquiry') {
        const customerName = String(args.customerName || '').trim();
        const phone = String(args.phone || '').trim();
        const email = String(args.email || '').trim();
        const companyName = String(args.companyName || 'Institutional Customer').trim();
        const deliveryLocation = String(args.deliveryLocation || 'India').trim();
        const requestedItems = Array.isArray(args.requestedItems) ? args.requestedItems : [];
        const notes = String(args.notes || '').trim();

        if (!customerName || (!phone && !email)) {
          toolResult = {
            success: false,
            error: 'Customer name and at least one contact channel (phone or email) are required to register an official RFQ.',
          };
        } else {
          try {
            // Determine round-robin assigned admin
            const assignedAdmin = await getNextLeadAssignee();

            // Construct quotation record
            const items = requestedItems.map((it: any, idx: number) => ({
              id: `rfq-item-${Date.now()}-${idx}`,
              productId: `custom-${idx}`,
              productName: it.name || 'Catalog Item',
              sku: 'OB-CUSTOM-RFQ',
              packSize: 'Standard',
              quantity: Number(it.quantity) || 1,
              indicativeUnitPrice: 0,
              gstPercent: 18,
              indicativeTotalPrice: 0,
            }));

            const newQuote = await createQuotation({
              customerName,
              companyName,
              email: email || 'enquiry@officebazzar.com',
              phone: phone || '+91 7200800040',
              deliveryLocation,
              pincode: '600014',
              preferredContactMethod: 'phone',
              items: items.length > 0 ? items : [
                {
                  id: `rfq-item-${Date.now()}-0`,
                  productId: 'custom-general',
                  productName: 'General Corporate Supplies RFQ',
                  sku: 'OB-RFQ-GEN',
                  packSize: 'Bulk',
                  quantity: 1,
                  indicativeUnitPrice: 0,
                  gstPercent: 18,
                  indicativeTotalPrice: 0,
                },
              ],
              indicativeSubtotal: 0,
              indicativeGstAmount: 0,
              indicativeTotal: 0,
              status: 'new',
              additionalRequirements: notes ? `[Bazzar AI Submission] ${notes}` : '[Bazzar AI Customer Chatbot RFQ]',
              assignedTo: assignedAdmin.name,
              assignedEmail: assignedAdmin.email,
              assignedAt: new Date().toISOString(),
              assignedSequence: assignedAdmin.sequenceNumber,
            });

            // Async sync to Zoho CRM in background
            syncQuotationToZoho(newQuote).catch((err) =>
              console.error('[Bazzar AI] Zoho CRM sync notice:', err)
            );

            // Dispatch admin notification
            dispatchQuotationNotifications(newQuote).catch((err) =>
              console.error('[Bazzar AI] Notification dispatch notice:', err)
            );

            toolResult = {
              success: true,
              quotationNumber: newQuote.quotationNumber,
              assignedAdmin: assignedAdmin.name,
              assignedEmail: assignedAdmin.email,
              message: `Your RFQ has been successfully registered under reference ${newQuote.quotationNumber} and assigned to ${assignedAdmin.name} (${assignedAdmin.email}).`,
            };
          } catch (err: any) {
            console.error('[Bazzar AI] Quotation creation error:', err);
            toolResult = {
              success: false,
              error: 'Failed to create quotation record in database. Please contact sales4@officebazzar.com directly.',
            };
          }
        }
      }

      // Send function response back to the model
      currentResponse = await chat.sendMessage({
        message: [
          {
            functionResponse: {
              name: fnName,
              response: toolResult,
            },
          },
        ],
      });
    }

    const replyText =
      currentResponse.text ||
      "I'm here to assist you with office supplies, quotations, and corporate catalog orders. How can I help you today?";

    return {
      reply: replyText,
      productCards: accumulatedCards.length > 0 ? accumulatedCards : undefined,
      suggestedActions: [
        'Find Products',
        'Bulk Order Enquiry',
        'Get a Quotation',
        'Contact Support',
      ],
      quickLinks: [
        { title: 'Explore All Categories', url: '/categories' },
        { title: 'Request Bulk Quote', url: '/request-quote' },
        { title: 'Call Sales: 7200800040', url: 'tel:7200800040', external: true },
      ],
    };
  } catch (error: any) {
    console.error('[Bazzar AI Gemini API Error]:', error);

    // Handle Quota Exhaustion (429) or Service Outage gracefully with local database fallback
    const isQuotaError =
      error?.status === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.message?.includes('quota');

    // Run local keyword search as fallback
    try {
      const { products } = await getProducts();
      const qTokens = trimmed
        .toLowerCase()
        .split(/[\s,+/&.-]+/)
        .filter((t) => t.length >= 2);

      const localMatches = products
        .filter((p) => {
          const text = `${p.name} ${p.sku} ${p.categoryName || ''}`.toLowerCase();
          return qTokens.some((t) => text.includes(t));
        })
        .slice(0, 4);

      const fallbackCards: ProductCardSuggestion[] = localMatches.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price && p.price > 0 ? p.price : null,
        packSize: p.packSize || '1 Unit',
        categoryName: p.categoryName,
        imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined,
        url: `/product/${p.slug || p.id}`,
      }));

      let reply = '';
      if (isQuotaError) {
        reply =
          "⚡ **Bazzar AI** is currently experiencing high corporate enquiry traffic. " +
          "Here are the direct catalog matches from our authentic live inventory:\n\n" +
          "For immediate custom volume pricing, please connect with our Chennai sales desk at **+91 7200800040** or **sales4@officebazzar.com**.";
      } else {
        reply =
          `Here are the verified items from our corporate catalog for **"${trimmed}"**:\n\n` +
          "You can request an official bulk quotation or speak directly with our team at **+91 7200800040**.";
      }

      return {
        reply,
        productCards: fallbackCards.length > 0 ? fallbackCards : undefined,
        suggestedActions: [
          'Find Products',
          'Get a Quotation',
          'Bulk Order Enquiry',
          'Contact Support',
        ],
        quickLinks: [
          { title: 'All Categories', url: '/categories' },
          { title: 'Request Quote', url: '/request-quote' },
          { title: 'Call 7200800040', url: 'tel:7200800040', external: true },
        ],
      };
    } catch {
      return {
        reply:
          "Welcome to **OfficeBazzar**. How can I assist you with office supplies, corporate stationery, or bulk quotations today?",
        suggestedActions: ['Find Products', 'Get a Quotation', 'Contact Support'],
        quickLinks: [{ title: 'All Categories', url: '/categories' }],
      };
    }
  }
}

