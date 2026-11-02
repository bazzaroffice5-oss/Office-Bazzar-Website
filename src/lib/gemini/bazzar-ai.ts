/**
 * Bazzar AI – Intelligent, Context-Aware, Multilingual Assistant for OfficeBazzar
 * Powered by Google Gemini 3.6 Flash & Official @google/genai SDK
 */

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

// In-memory sliding window rate limiter (30 requests/minute per client IP)
const ipRateMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 30;

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
        name: 'search_catalog',
        description:
          'Search the authentic OfficeBazzar catalog for products: copier papers (JK, TNPL, bond, photo paper), files, folders, registers, pens, staplers, paper shredders, housekeeping chemicals (Taski, Hi-Clean, phenyl), dustbins, cleaning mops, wipers, dispensers, road safety cones, barriers, and office furniture. Always translate search terms into English keywords.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description:
                'Search keywords in English (e.g. "copier paper", "A4 paper", "JK copier", "dustbin", "shredder", "file folder", "taski", "cleaning chemical", "chair")',
            },
            category: {
              type: Type.STRING,
              description:
                'Optional category filter: "Office Stationery", "Housekeeping & Hygiene", "Printers & Technology", "Packaging Supplies", "Road Safety"',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_product_details',
        description:
          'Get specifications, SKU, pack size, price, and stock for a specific product by SKU or exact name.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            skuOrName: {
              type: Type.STRING,
              description: 'Product SKU (e.g. OB-STA-1009) or product title',
            },
          },
          required: ['skuOrName'],
        },
      },
      {
        name: 'submit_bulk_enquiry',
        description:
          'Register an official corporate quotation request / bulk RFQ into OfficeBazzar Zoho CRM. ONLY call this when the customer has provided their contact person name and a valid 10-digit phone number or email, along with requested items.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING, description: 'Customer / contact person full name' },
            phone: { type: Type.STRING, description: '10-digit mobile or contact telephone number' },
            email: { type: Type.STRING, description: 'Customer corporate email address (optional if phone provided)' },
            companyName: { type: Type.STRING, description: 'Company, institution, or school name' },
            deliveryLocation: { type: Type.STRING, description: 'City, area or PIN code for delivery' },
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
            notes: { type: Type.STRING, description: 'Specific requirements or notes' },
          },
          required: ['customerName', 'phone'],
        },
      },
    ],
  },
];

const BAZZAR_AI_SYSTEM_INSTRUCTION = `You are Bazzar AI, the friendly, intelligent corporate procurement assistant for OfficeBazzar (Officebazzar E-Store Private Limited, Royapettah, Chennai, Tamil Nadu).

CORE MISSION & PERSONALITY:
- You are conversational, helpful, natural, and dynamic—never sound like a rigid robotic script or a repetitive FAQ bot.
- You listen closely to what the customer actually asked and respond specifically to their intent.
- Do NOT repeat the exact same sentences, greetings, or contact info in every turn.
- Do NOT force every casual question immediately into a sales lead form.

1. DYNAMIC LANGUAGE DETECTION & MIRRORING:
- Automatically detect the customer's language and respond naturally in that EXACT language and dialect:
  * English -> Natural, professional English.
  * Tamil (தமிழ்) -> Natural Tamil (e.g. "வணக்கம்! உங்களுக்கு எத்தனை ரீம் A4 பேப்பர் தேவைப்படுகிறது?").
  * Tanglish (Tamil in English letters) -> Natural Tanglish (e.g. "A4 paper-oda current price check pannuren. Ungalukku ethana reams venum?").
  * Hindi (हिंदी) -> Natural Hindi (e.g. "नमस्ते! आपको किस प्रकार की ऑफिस फाइलें चाहिए?").
  * Malayalam (മലയാളം) -> Natural Malayalam.
  * Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Bengali (বাংলা), Marathi, Gujarati, Urdu, Punjabi, etc.
- For mixed-language messages, match the customer's blend naturally, keeping commonly mixed corporate terms like "A4 paper", "reams", "dustbin", "box", "price", "quotation", "GST bill".
- Never ask the user to choose or switch languages.

2. CONTEXT-AWARE CONVERSATION MEMORY:
- Maintain full awareness of earlier conversation turns.
- When the customer provides a short reply (e.g. "20", "blue", "ergonomic", "yes", "pedal bin"), resolve it in the context of what was just discussed:
  * Example: Customer asked for A4 paper -> AI asked for quantity -> Customer said "20" -> AI understands "20 reams of A4 paper".
  * Example: Customer asked about dustbins -> AI mentioned options -> Customer asked "What sizes?" -> AI explains the sizes of dustbins available (e.g. 10L, 50L, 120L, 240L pedal/push/swing bins).
  * Example: Customer asked for chairs -> AI asked style -> Customer said "ergonomic" -> AI continues specifically about ergonomic office chairs.
- NEVER ask the customer to repeat information they already shared.

3. PRODUCT CATALOG INTELLIGENCE:
- OfficeBazzar is Chennai and South India's premier B2B corporate supplies portal providing:
  * Copier Paper: JK Copier (75/80 GSM), JK Max, JK Easy Copier, TNPL (70/75/80 GSM), bond papers, photo papers.
  * Office Stationery: Files (box files, ring files, expanding files, stick files, report files), registers, notebooks, pens (gel, ballpoint, Pilot, Rorito, Cello), markers, staplers, punch machines, scissors, desk trays, Casio calculators, envelopes.
  * Housekeeping & Hygiene: Taski chemicals (R1 to R9, Sumo Inox), Hi-Clean floor cleaners, phenoyl, toilet cleaners, glass cleaners, hand washes (Lifebuoy, Dettol, Hi-Clean), urinal screens, duster cloths, microfibre cloths, banian cloth, scourers, cleaning brushes, mops, wipers, wringer trolleys.
  * Dustbins: Plastic pedal bins, swing bins, SS perforated bins, SS pedal bins, mesh bins, 120L & 240L heavy-duty wheeled outdoor bins.
  * Tissue Papers & Dispensers: C-fold towels, M-fold towels, HRT roll towels, toilet rolls, tissue dispensers, automatic sensor dispensers.
  * Printers & Technology: Gobbler commercial heavy-duty paper shredders, compatible printer cartridges, barcode printers.
  * Packaging Supplies: BOPP brown/transparent tapes, strapping rolls, bubble wrap, stretch film.
  * Road Safety: Traffic cones, convex mirrors, rumble strips, speed breakers, warning bollards, Q-managers, queue barriers.
  * Office Furniture: Executive chairs, ergonomic mesh chairs, visitor chairs, workstation seating, conference tables (provided on customized corporate wholesale volume quotation).
- Call 'search_catalog' whenever the customer asks about products, availability, or prices. Translate search terms into English keywords for the tool.
- If products are found, present their authentic names and pack sizes.
- For prices: Wholesale B2B corporate supplies offer volume tiered pricing. Explain that exact institutional prices are customized per order volume with GST invoices.
- If an item is not found, state that OfficeBazzar's dedicated procurement desk sources non-catalog corporate supplies upon request.

4. STRICT DOMAIN BOUNDARY:
- Only answer questions related to OfficeBazzar, office procurement, B2B supplies, orders, delivery, quotations, and corporate services.
- If asked about non-workplace or off-topic subjects (politics, movies, recipes, general coding, sports, competitor brands), politely steer the conversation back to office supplies in the customer's language.

5. RFQ & QUOTATION REGISTRATION:
- When a customer wants a quote or bulk order, collect:
  1. Contact Name
  2. 10-digit Phone Number (or Email)
  3. Product & Quantity
  4. Delivery Location (City / PIN)
- Call 'submit_bulk_enquiry' only when name and phone/email are provided.
- Quote the generated quotation number (e.g. OB-RFQ-...) and assigned sales manager on successful submission.`;

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

    // Format previous turns for Gemini Chat ensuring valid alternating sequence:
    // User -> Model -> User -> Model
    const validHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    const rawHistory = history
      .slice(-10)
      .filter((h) => h && typeof h.content === 'string' && h.content.trim());

    for (const h of rawHistory) {
      const role = h.role === 'assistant' ? 'model' : 'user';
      // Ensure alternation: do not push consecutive identical roles
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === role) {
        // Append text to previous turn
        validHistory[validHistory.length - 1].parts[0].text += `\n${h.content.trim()}`;
      } else {
        validHistory.push({
          role,
          parts: [{ text: h.content.trim() }],
        });
      }
    }

    // Ensure history starts with 'user'
    while (validHistory.length > 0 && validHistory[0].role !== 'user') {
      validHistory.shift();
    }

    const chat = ai.chats.create({
      model: modelName,
      history: validHistory,
      config: {
        systemInstruction: BAZZAR_AI_SYSTEM_INSTRUCTION,
        tools: bazzarAITools,
        temperature: 0.6,
      },
    });

    let currentResponse = await chat.sendMessage({ message: trimmed });

    // Multi-turn tool execution loop (up to 3 tool iterations)
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

      if (fnName === 'search_catalog') {
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
              price: p.price && p.price > 0 ? `₹${p.price}` : 'Institutional wholesale quotation pricing',
              stockStatus: p.stockQuantity > 0 ? 'In Stock (Chennai & Bangalore Hubs)' : 'Available on Corporate Order',
              slug: p.slug || p.id,
            })),
          };
        } else {
          toolResult = {
            found: false,
            count: 0,
            message: `No exact catalog entries matching "${query}" were found. OfficeBazzar procures this directly for corporate clients on request.`,
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
        const phone = String(args.phone || '').trim().replace(/\D/g, '');
        const email = String(args.email || '').trim();
        const companyName = String(args.companyName || 'Institutional Customer').trim();
        const deliveryLocation = String(args.deliveryLocation || 'Chennai').trim();
        const requestedItems = Array.isArray(args.requestedItems) ? args.requestedItems : [];
        const notes = String(args.notes || '').trim();

        if (!customerName || phone.length < 10) {
          toolResult = {
            success: false,
            error: 'Customer name and a valid 10-digit mobile number are required to submit an official quotation request.',
          };
        } else {
          try {
            const assignedAdmin = await getNextLeadAssignee();

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
              phone: phone.startsWith('91') && phone.length === 12 ? `+${phone}` : `+91 ${phone}`,
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

            syncQuotationToZoho(newQuote).catch((err) =>
              console.error('[Bazzar AI] Zoho CRM sync notice:', err)
            );

            dispatchQuotationNotifications(newQuote).catch((err) =>
              console.error('[Bazzar AI] Notification dispatch notice:', err)
            );

            toolResult = {
              success: true,
              quotationNumber: newQuote.quotationNumber,
              assignedAdmin: assignedAdmin.name,
              assignedEmail: assignedAdmin.email,
              message: `Your quotation request is registered under reference ${newQuote.quotationNumber} and assigned to ${assignedAdmin.name} (${assignedAdmin.email}).`,
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

    // Safely extract text from response (handling both response.text and candidate parts)
    let replyText = '';
    if (typeof currentResponse.text === 'string' && currentResponse.text.trim()) {
      replyText = currentResponse.text.trim();
    } else {
      const parts = (currentResponse as any)?.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        const textParts = parts
          .filter((p: any) => typeof p?.text === 'string' && p.text.trim())
          .map((p: any) => p.text.trim());
        if (textParts.length > 0) {
          replyText = textParts.join('\n\n');
        }
      }
    }

    if (!replyText) {
      replyText = "I'm here to assist you with office stationery, cleaning supplies, and corporate quotations. How can I help you today?";
    }

    // Dynamically derive suggested actions based on context and language
    const suggestedActions = generateDynamicSuggestions(trimmed, replyText);

    return {
      reply: replyText,
      productCards: accumulatedCards.length > 0 ? accumulatedCards : undefined,
      suggestedActions,
      quickLinks: [
        { title: 'Browse Catalog', url: '/categories' },
        { title: 'Request Bulk Quote', url: '/request-quote' },
        { title: 'Call Chennai Hub', url: 'tel:7200800040', external: true },
      ],
    };
  } catch (error: any) {
    console.error('[Bazzar AI Gemini API Error]:', error);

    // Fallback on quota or unexpected error
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

      // Detect language for fallback response
      const isTamil = /[\u0B80-\u0BFF]/.test(trimmed);
      const isHindi = /[\u0900-\u097F]/.test(trimmed);
      const isMalayalam = /[\u0D00-\u0D7F]/.test(trimmed);
      const isTelugu = /[\u0C00-\u0C7F]/.test(trimmed);

      let reply = '';
      if (isTamil) {
        reply = `OfficeBazzar-ல் தங்களை வரவேற்கிறோம்! உங்கள் கேள்விக்கு எங்கள் விற்பனைக் குழு நேரடி விலைப்புள்ளி (Quote) வழங்க தயாராக உள்ளது. எங்களைத் தொடர்பு கொள்ளவும்: **+91 7200800040** அல்லது **sales4@officebazzar.com**.`;
      } else if (isHindi) {
        reply = `OfficeBazzar में आपका स्वागत है! आपके अनुरोध के लिए हमारी बिक्री टीम सर्वोत्तम कॉर्पोरेट मूल्य उद्धरण (Quote) प्रदान करने के लिए तैयार है। संपर्क करें: **+91 7200800040** या **sales4@officebazzar.com**.`;
      } else if (isMalayalam) {
        reply = `OfficeBazzar-ലേക്ക് സ്വാഗതം! നിങ്ങളുടെ ആവശ്യങ്ങൾക്കായുള്ള മികച്ച കോർപ്പറേറ്റ് നിരക്കുകൾ നൽകാൻ ഞങ്ങളുടെ ടീം സന്നദ്ധമാണ്. ബന്ധപ്പെടുക: **+91 7200800040** അല്ലെങ്കിൽ **sales4@officebazzar.com**.`;
      } else if (isTelugu) {
        reply = `OfficeBazzar కు స్వాగతం! మీ అవసరాలకు తగిన ఉత్తమ కార్పొరేట్ కొటేషన్ అందించడానికి మా బృందం సిద్ధంగా ఉంది. సంప్రదించండి: **+91 7200800040** లేదా **sales4@officebazzar.com**.`;
      } else {
        reply = `Thank you for reaching out to **OfficeBazzar**. Our procurement desk in Chennai is ready to assist you with verified pricing and corporate supplies at **+91 7200800040** or **sales4@officebazzar.com**.`;
      }

      return {
        reply,
        productCards: fallbackCards.length > 0 ? fallbackCards : undefined,
        suggestedActions: isTamil
          ? ['பொருட்கள் தேட', 'மொத்த ஆர்டர்', 'தொடர்பு கொள்ள']
          : isHindi
          ? ['उत्पाद खोजें', 'थोक कोटेशन', 'संपर्क करें']
          : ['Find Products', 'Get a Quotation', 'Contact Support'],
        quickLinks: [
          { title: 'Catalog', url: '/categories' },
          { title: 'Call 7200800040', url: 'tel:7200800040', external: true },
        ],
      };
    } catch {
      return {
        reply: "Welcome to OfficeBazzar. How can I assist you with corporate office supplies and bulk quotations today?",
        suggestedActions: ['Find Products', 'Get a Quotation', 'Contact Support'],
      };
    }
  }
}

/**
 * Generate contextual suggestions based on message contents and language
 */
function generateDynamicSuggestions(userMsg: string, replyMsg: string): string[] {
  const combined = `${userMsg} ${replyMsg}`.toLowerCase();
  const isTamil = /[\u0B80-\u0BFF]/.test(userMsg);
  const isHindi = /[\u0900-\u097F]/.test(userMsg);

  if (isTamil) {
    if (combined.includes('paper') || combined.includes('பேப்பர்')) {
      return ['A4 Copier Paper', '75 GSM Paper', 'மொத்த விலை (Bulk Price)', 'ஆர்டர் செய்ய'];
    }
    if (combined.includes('chair') || combined.includes('நாற்காலி') || combined.includes('furniture')) {
      return ['Ergonomic Chairs', 'Executive Chairs', 'விலை விவரம் (Price)'];
    }
    if (combined.includes('clean') || combined.includes('துப்புரவு') || combined.includes('dustbin')) {
      return ['Housekeeping Supplies', 'Floor Cleaners', 'Dustbins 120L'];
    }
    return ['பொருட்கள் தேட (Find Products)', 'மொத்த ஆர்டர் (Bulk Quote)', 'தொடர்பு கொள்ள (Contact)'];
  }

  if (isHindi) {
    if (combined.includes('paper') || combined.includes('पेपर')) {
      return ['A4 Copier Paper', '75 GSM Paper', 'थोक भाव (Bulk Price)', 'कोटेशन प्राप्त करें'];
    }
    return ['उत्पाद खोजें (Find Products)', 'थोक कोटेशन (Bulk Quote)', 'सहायता (Help)'];
  }

  // English / Tanglish / Global
  if (combined.includes('paper') || combined.includes('copier') || combined.includes('gsm') || combined.includes('ream')) {
    return ['JK Copier 75 GSM', 'TNPL Copier A4', 'Get Quote for 20 Reams', 'Delivery Details'];
  }
  if (combined.includes('chair') || combined.includes('furniture') || combined.includes('ergonomic')) {
    return ['Ergonomic Mesh Chairs', 'Executive Chairs', 'Get Chair Quotation', 'Visitor Chairs'];
  }
  if (combined.includes('dustbin') || combined.includes('bin') || combined.includes('waste')) {
    return ['Stainless Steel Bins', '120L Wheeled Bin', 'Pedal Bins', 'Get Bin Quote'];
  }
  if (combined.includes('clean') || combined.includes('chemical') || combined.includes('taski') || combined.includes('housekeeping')) {
    return ['Taski Chemicals', 'Hi-Clean Floor Cleaner', 'Wringer Trolley', 'Microfibre Cloths'];
  }
  if (combined.includes('quote') || combined.includes('rfq') || combined.includes('bulk') || combined.includes('price')) {
    return ['Submit RFQ Details', 'Corporate Volume Discount', 'Speak to Sales Desk', 'GST Invoicing Info'];
  }

  return ['Find Products', 'Bulk Order Enquiry', 'Get a Quotation', 'Corporate Pricing'];
}
