/**
 * Bazzar AI – Advanced Gemini-Style Conversational Intelligence for OfficeBazzar
 * Separates AI Conversation, Product Retrieval, Relevance Validation, and Response Composition.
 * Zero tolerance for unrelated product recommendations.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { getProducts, createQuotation } from '@/lib/db/store';
import { INITIAL_PRODUCTS } from '@/lib/data/catalog';
import { Product } from '@/types';
import { syncQuotationToZoho } from '@/lib/zoho/crm';
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

export interface ChatDiagnostics {
  engine: 'gemini' | 'contextual_fallback' | 'product_retrieval' | 'api_error';
  modelUsed: string | null;
  geminiCalled: boolean;
  geminiStatus: string | null;
  geminiValidText: boolean;
  fallbackActivated: boolean;
  fallbackReason?: string;
  productsAttached: number;
  historyTurnsReceived: number;
}

export interface ChatResponsePayload {
  reply: string;
  suggestedActions?: string[];
  productCards?: ProductCardSuggestion[];
  quickLinks?: Array<{ title: string; url: string; external?: boolean }>;
  diagnostics?: ChatDiagnostics;
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
  const timestamps = (ipRateMap.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  timestamps.push(now);
  ipRateMap.set(ip, timestamps);
  return true;
}

// ==============================================================================
// 1. RELEVANCE VALIDATION ENGINE (CRITICAL: PREVENTS UNRELATED RECOMMENDATIONS)
// ==============================================================================

const STOPWORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them',
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while',
  'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in',
  'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
  'don', 'should', 'now', 'need', 'want', 'looking', 'show', 'give', 'tell',
  'please', 'help', 'price', 'rate', 'cost', 'available', 'have', 'pieces', 'pcs',
  'nos', 'unit', 'units', 'box', 'boxes', 'pack', 'packs', 'item', 'items', 'product', 'products'
]);

interface DomainRule {
  categories: string[];
  positiveKeywords: string[];
  negativeKeywords: string[];
}

const DOMAIN_RULES: Record<string, DomainRule> = {
  chairs: {
    categories: ['furniture', 'chair', 'seating', 'office furniture'],
    positiveKeywords: [
      'chair',
      'chairs',
      'seating',
      'stool',
      'stools',
      'ergonomic chair',
      'executive chair',
      'mesh chair',
      'visitor chair',
      'workstation chair',
    ],
    negativeKeywords: [
      'thermocol',
      'tape',
      'bubble',
      'chemical',
      'phenyl',
      'mop',
      'bin',
      'paper',
      'file',
      'register',
      'stapler',
      'dispenser',
      'cleaner',
      'foam',
    ],
  },
  paper: {
    categories: ['paper', 'stationery', 'copier'],
    positiveKeywords: [
      'copier paper',
      'a4 paper',
      'a3 paper',
      '75 gsm',
      '70 gsm',
      '80 gsm',
      'xerox paper',
      'bond paper',
      'printing paper',
      'jk copier',
      'tnpl',
      'bilt',
      'paper rim',
      'paper ream',
      'paper bundle',
    ],
    negativeKeywords: [
      'chair',
      'thermocol',
      'bin',
      'mop',
      'trolley',
      'chemical',
      'cone',
      'shredder',
      'shredding',
      'cutter',
      'napkin',
      'tissue',
      'folder',
      'stand',
    ],
  },
  housekeeping: {
    categories: ['housekeeping', 'hygiene', 'cleaning', 'chemicals'],
    positiveKeywords: [
      'taski',
      'hi-clean',
      'cleaning chemical',
      'floor cleaner',
      'glass cleaner',
      'toilet cleaner',
      'handwash',
      'phenyl',
      'mop',
      'wiper',
      'wringer trolley',
      'dispenser',
      'caddy basket',
      'microfiber',
      'cloth',
    ],
    negativeKeywords: ['chair', 'thermocol', 'copier paper', 'shredder', 'stapler', 'calculator'],
  },
  dustbins: {
    categories: ['garbage bin', 'dustbin', 'waste bin', 'dustbins'],
    positiveKeywords: [
      'dustbin',
      'dustbins',
      'waste bin',
      'garbage bin',
      'pedal bin',
      'wheeled bin',
      '60l',
      '120l',
      '240l',
      'trash can',
      'ashtray bin',
    ],
    negativeKeywords: ['chair', 'paper', 'copier', 'thermocol', 'stapler', 'punching', 'chemical'],
  },
  stationery: {
    categories: ['stationery', 'office supplies'],
    positiveKeywords: [
      'stapler',
      'staple pin',
      'punching machine',
      'scissor',
      'glue',
      'fevistick',
      'tape dispenser',
      'cutter',
      'pen',
      'marker',
      'highlighter',
      'pencil',
      'eraser',
      'sharpener',
      'scale',
      'ruler',
    ],
    negativeKeywords: ['chair', 'thermocol', 'floor cleaner', 'dustbin', 'wringer trolley', 'tissue'],
  },
  files: {
    categories: ['stationery', 'files', 'folders', 'filing'],
    positiveKeywords: [
      'box file',
      'lever arch file',
      'cobra file',
      'spring file',
      'ring binder',
      'display folder',
      'expanding file',
      'paper tag file',
      'clear bag',
      'document folder',
    ],
    negativeKeywords: ['chair', 'thermocol', 'floor cleaner', 'dustbin', 'copier paper', 'chemical'],
  },
  packaging: {
    categories: ['packaging', 'packing', 'warehouse'],
    positiveKeywords: [
      'bopp tape',
      'brown tape',
      'transparent tape',
      'floor marking tape',
      'bubble roll',
      'bubble sheet',
      'stretch film',
      'corrugated box',
      'foam thermocol',
      'strapping roll',
      'gum tape',
    ],
    negativeKeywords: ['chair', 'copier paper', 'floor cleaner', 'lever arch file', 'dustbin'],
  },
  road_safety: {
    categories: ['road safety', 'safety', 'barriers'],
    positiveKeywords: [
      'traffic cone',
      'safety cone',
      'road barrier',
      'convex mirror',
      'speed breaker',
      'corner guard',
      'wheel stopper',
      'delineator',
      'safety vest',
      'reflective jacket',
    ],
    negativeKeywords: ['chair', 'copier paper', 'box file', 'stapler', 'thermocol', 'mop'],
  },
};

/**
 * Strict product relevance validator. Returns false if the product is unrelated to the user query.
 */
export function validateProductRelevance(product: Product, userQuery: string): boolean {
  const qLower = userQuery.toLowerCase();
  const pName = product.name.toLowerCase();
  const pCat = (product.categoryName || '').toLowerCase();

  // 1. Domain-specific check
  let detectedDomain: string | null = null;
  for (const [domainName, rule] of Object.entries(DOMAIN_RULES)) {
    if (rule.positiveKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(qLower))) {
      detectedDomain = domainName;
      break;
    }
  }

  if (detectedDomain) {
    const rule = DOMAIN_RULES[detectedDomain];

    // Reject if product contains negative keywords for this domain
    if (rule.negativeKeywords.some((neg) => new RegExp(`\\b${neg}\\b`, 'i').test(pName))) {
      return false;
    }

    // Require matching positive keyword in product name or category
    const hasMatch = rule.positiveKeywords.some(
      (pos) =>
        new RegExp(`\\b${pos}\\b`, 'i').test(pName) ||
        new RegExp(`\\b${pos}\\b`, 'i').test(pCat)
    );

    return hasMatch;
  }

  // 2. Generic query token validation
  const meaningfulTokens = qLower
    .split(/[\s,+/&.-]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));

  if (meaningfulTokens.length === 0) {
    return false;
  }

  // Must match as a whole word in product name, not a loose partial substring
  return meaningfulTokens.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(pName));
}

// ==============================================================================
// 2. GEMINI SYSTEM INSTRUCTION & TOOL DEFINITIONS
// ==============================================================================

const bazzarAITools: any[] = [
  {
    functionDeclarations: [
      {
        name: 'search_catalog',
        description:
          'Search the authentic OfficeBazzar product catalog. Only search for real items like housekeeping chemicals, dustbins, stationery, paper shredders, packaging, or safety items. Always use English keywords.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: 'Product keywords in English (e.g. "taski", "dustbin 120l", "shredder", "box file", "mop")',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'submit_bulk_enquiry',
        description:
          'Submit a formal bulk quotation request into OfficeBazzar Zoho CRM when customer provided their name, contact phone/email, and requirements.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING, description: 'Customer full name' },
            phone: { type: Type.STRING, description: 'Customer phone number' },
            email: { type: Type.STRING, description: 'Corporate email' },
            companyName: { type: Type.STRING, description: 'Company name' },
            deliveryLocation: { type: Type.STRING, description: 'City or delivery location' },
            notes: { type: Type.STRING, description: 'Product requirements, quantity, specifications' },
          },
          required: ['customerName', 'phone', 'notes'],
        },
      },
    ],
  },
];

const BAZZAR_AI_SYSTEM_INSTRUCTION = `You are "Bazzar AI", the intelligent corporate assistant for OfficeBazzar (https://officebazzar.com), Chennai's premier B2B corporate supplies partner.

AUTHORITATIVE COMPANY PROFILE & KNOWLEDGE BASE (Use these verified facts at all times):
1. Company Identity & Experience:
   - Official Name: Officebazzar E-Store Private Limited (CIN: U51909TN2021PTC142348).
   - Experience & Founding: Co-founded in 2005. OfficeBazzar has OVER 20+ YEARS of dedicated experience serving the corporate, institutional, and industrial sectors across India.
   - CRITICAL RULE ON EXPERIENCE / YEARS IN OPERATION:
     When asked "How many years has your company been operating?", "How many years of experience does OfficeBazzar have?", "Tell me about company history", or any question about company age or experience, ALWAYS explicitly state that OfficeBazzar has over 20+ years of experience (founded in 2005). NEVER say 10 years, 15 years, or guess any other number. OfficeBazzar has 20+ years of experience.
   - Leadership:
     - Founder & Chairman: Mr. Atul Patel (Pioneered office supplies and B2B corporate supply chain).
     - Managing Director: Mr. Ajith P Dhedhi (M.Com, joined in 2009, leading corporate expansion and operations).
   - Headquarters & Hubs:
     - Corporate Headquarters: Officebazzar Tower, No. 29/15, Subbedar Hussain Street, Royapettah, Chennai - 600014, Tamil Nadu, India.
     - Regional Branches & Distribution Hubs:
       * Chennai, Tamil Nadu (Corporate HQ & Central Distribution Hub)
       * Bangalore, Karnataka (Jeevan Bima Nagar)
       * Mumbai, Maharashtra (Andheri East)
       * Hyderabad, Telangana (Kishangunj)
       * Also serving West Bengal (Kolkata) and Pan-India.
   - Corporate Clientele: Over 5,000+ corporate clients, including enterprise leaders such as ITC, Sundaram Motors, Sundaram Clayton, FLSmidth, Brakes India, Empee Hotels, The Park, Hatsun Agro, and major MNCs.
   - In-House Brand:
     - "Hi-Clean": OfficeBazzar's proprietary in-house brand of certified commercial cleaning formulations, surface disinfectants, floor cleaners, and hygiene solutions, manufactured to deliver hospital-grade cleanliness at competitive bulk rates.

2. Comprehensive Product Portfolio:
   - Office Stationery & Desk Essentials: Lever arch files, ring binders, report files, stick files, gel & ball pens (Reynolds, Pilot, ADD Gel, Cello), markers (whiteboard, permanent, highlighters), staplers, scissors, paper shredders, calculators, desk organizers, measuring scales/rulers.
   - Copier Papers & Specialty Papers: Copier papers across 67, 70, 72, 75, 80, and 100 GSM in A4, A3, and FS sizes (JK Copier 75 GSM, JK Easy Copier, JK Max, JK Cmax, JK Eco Rise, TNPL Copier, JK Excel Bond Paper, Novajet photo paper, Compu Color paper, Kores carbon paper).
   - Ergonomic Office Chairs & Corporate Seating: Ergonomic mesh task chairs, high-back executive chairs, mid-back staff chairs, visitor chairs, and conference seating. Note: Chairs are supplied on custom corporate volume quotations through our procurement desk.
   - Housekeeping & Hygiene Supplies: Authentic Diversey Taski chemicals (R1 to R9), Hi-Clean commercial cleaning formulations, disinfectant floor cleaners, phenyls, hand washes, air fresheners, garbage bags, microfiber mops, and wipers.
   - Commercial Waste Management & Dustbins: Heavy-duty 60L, 120L, and 240L wheeled outdoor garbage bins (EN840 certified HDPE), pedal bins, stainless steel push bins, perforated waste baskets, and recycling segregation stations.
   - Packaging & Dispatch Supplies: BoPP brown/transparent packing tapes, printed security tapes, manual & machine stretch films, strapping rolls, air bubble rolls, and corrugated boxes.
   - Safety, Traffic & Facility Supplies: Retractable queue management stanchions (Q-managers), traffic cones, warning chains, floor caution stands, barricade tapes, PPE, and medical oxygen concentrators.
   - Presentation & Display Boards: Alkosign magnetic whiteboards, pin-up notice boards, motorized dependent up-down board systems, display stands, and conference easels.
   - Office Technology & Electronics: Conference projectors (HD/4K high-definition projectors), document laminators, binding machines, paper shredders, and currency counting machines.

3. Commercial Terms & Corporate Services:
   - 100% GST ITC Invoicing: Every B2B order comes with a legitimate GST tax invoice (18% for commercial supplies & hardware, 12% for paper products) guaranteeing 100% Input Tax Credit.
   - Corporate Credit Facilities: Flexible credit terms of 15-day and 30-day billing cycles available for registered and verified corporate accounts.
   - Fast RFQ & Turnaround: Official corporate quotations delivered within 2 to 4 business hours.
   - Delivery Policy:
     - Free delivery within Chennai, Bangalore, and Kolkata for corporate bulk orders.
     - Online catalog orders: Free delivery on orders of ₹999 and above (flat ₹99 shipping for orders below ₹999).
     - Same-Day Dispatch: Orders placed and confirmed before 1:00 PM IST receive same-day dispatch.
     - Transit Times: Next-day/24-hour delivery in Chennai metro; 1-2 business days across Tamil Nadu & major tier-1 industrial corridors; 2-4 business days pan-India.
   - Contact Details:
     - Procurement Hotline / WhatsApp: +91 7200800040 (or +91 72008 00040)
     - Landline: +91 78258 86622
     - Corporate Sales Email: sales4@officebazzar.com
     - Management / Escalations: dm@officebazzar.com
     - Office Hours: Monday to Saturday, 9:00 AM – 6:30 PM IST.

4. Critical Context & Conversation Intelligence Rules:
   - Price Follow-up Rule: When a customer asks "What is the price?" or "Show me the price" after previously providing a product and quantity (e.g., 20 ergonomic chairs), DO NOT ask for the quantity again! The quantity is already known. Directly answer that pricing for the requested quantity (e.g., 20 ergonomic chairs) is handled via customized corporate volume quotations with GST invoicing, and ask for their delivery location or contact details to prepare the quotation.
   - Multiple Products Rule: When a customer mentions multiple products (e.g. "I need chairs and copier paper"), track BOTH requirements independently. Do not discard one product. Acknowledge both requirements, ask clarification for chairs (e.g. ergonomic, executive, visitor), and then address copier paper (e.g. brand JK Copier/TNPL, GSM, and ream quantity).
   - Asking Questions: Ask only ONE useful clarification question at a time. Do NOT ask for information that the customer has already stated in previous turns.
   - Courtesy & Gratitude: When a user says "Thank you" or gives casual courtesies, reply naturally and warmly without resetting the conversation or repeating generic greetings.

5. Multilingual Excellence:
   - Automatically detect the customer's language and respond naturally in that language and style.
   - English -> Clear, natural English.
   - Tamil (தமிழ்) -> Natural, polite Tamil.
   - Tanglish (Tamil written in English) -> Fluent, natural Tanglish.
   - Hindi (हिंदी), Malayalam (മലയാളം), Telugu (తెలుగు), Kannada (ಕನ್ನಡ) -> Mirror their language fluently.

6. Product Recommendations:
   - NEVER recommend unrelated products.
   - If products are not found in the live catalog (e.g. chairs), explicitly state that they are provided on custom corporate quotation through our sales desk instead of showing unrelated products.`;

// ==============================================================================
// 3. MAIN CHAT PROCESSOR (ENGINE ARCHITECTURE)
// ==============================================================================

export async function processBazzarAIChat(
  userMessage: string,
  history: ConversationTurn[] = [],
  clientIp: string = '127.0.0.1'
): Promise<ChatResponsePayload> {
  const accumulatedCards: ProductCardSuggestion[] = [];

  // Input Validation
  const trimmed = userMessage.trim();
  if (!trimmed || trimmed.length > 1000) {
    return {
      reply: 'Please provide a valid message between 1 and 1000 characters.',
      suggestedActions: ['Find Products', 'Bulk Order Enquiry', 'Get a Quotation', 'Contact Support'],
      diagnostics: {
        engine: 'api_error',
        modelUsed: null,
        geminiCalled: false,
        geminiStatus: 'INVALID_INPUT',
        geminiValidText: false,
        fallbackActivated: false,
        fallbackReason: 'Invalid message length or empty',
        productsAttached: 0,
        historyTurnsReceived: history.length,
      },
    };
  }

  // Rate Limiting
  if (!checkRateLimit(clientIp)) {
    return {
      reply: 'You are sending messages too quickly. Please wait a few seconds before trying again.',
      suggestedActions: ['Find Products', 'Contact Support'],
      diagnostics: {
        engine: 'api_error',
        modelUsed: null,
        geminiCalled: false,
        geminiStatus: 'RATE_LIMITED',
        geminiValidText: false,
        fallbackActivated: false,
        fallbackReason: 'Rate limit exceeded for IP',
        productsAttached: 0,
        historyTurnsReceived: history.length,
      },
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const configuredModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

  console.log(
    `[Bazzar AI Request] IP: ${clientIp} | MsgLen: ${trimmed.length} | HistoryTurns: ${history.length} | PrimaryModel: ${configuredModel}`
  );

  // Models in priority order: prioritizing verified active flash-lite models
  const candidateModels = Array.from(
    new Set([
      configuredModel,
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash',
    ])
  ).filter(Boolean);

  let finalReplyText: string | null = null;
  let activeModelUsed: string | null = null;
  let lastGeminiStatus: string | null = null;
  let lastGeminiError: string | null = null;

  const executeWithTimeout = <T>(promise: Promise<T>, ms: number, desc: string): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${desc} timed out after ${ms}ms`)), ms)
      ),
    ]);

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });

    // Format previous turns ensuring alternating user -> model sequence
    const validHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    const rawHistory = history
      .slice(-10)
      .filter((h) => h && typeof h.content === 'string' && h.content.trim());

    for (const h of rawHistory) {
      const role = h.role === 'assistant' ? 'model' : 'user';
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === role) {
        validHistory[validHistory.length - 1].parts[0].text += `\n${h.content.trim()}`;
      } else {
        validHistory.push({
          role,
          parts: [{ text: h.content.trim() }],
        });
      }
    }

    while (validHistory.length > 0 && validHistory[0].role !== 'user') {
      validHistory.shift();
    }

    // Try primary models with strict 7s timeout per attempt
    for (const modelName of candidateModels) {
      try {
        const chat = ai.chats.create({
          model: modelName,
          history: validHistory,
          config: {
            systemInstruction: BAZZAR_AI_SYSTEM_INSTRUCTION,
            tools: bazzarAITools,
            temperature: 0.6,
          },
        });

        let currentResponse = await executeWithTimeout(
          chat.sendMessage({ message: trimmed }),
          7000,
          `Gemini [${modelName}] sendMessage`
        );

        // Tool execution loop with per-call timeout
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

          let toolResult: any;

          if (fnName === 'search_catalog') {
            const queryTerm = (args.query || '').trim();
            let catalogProducts: Product[] = [];
            try {
              const pRes = await executeWithTimeout(
                getProducts(),
                3000,
                'Catalog retrieval'
              );
              catalogProducts = pRes.products;
            } catch {
              catalogProducts = INITIAL_PRODUCTS.filter((p: Product) => p.isActive !== false);
            }

            // Run candidates through Product Relevance Validator (Engine C)
            const validated = catalogProducts.filter((p) =>
              validateProductRelevance(p, queryTerm || trimmed)
            );

            const sliced = validated.slice(0, 4);
            for (const p of sliced) {
              if (!accumulatedCards.some((c) => c.id === p.id)) {
                accumulatedCards.push({
                  id: p.id,
                  name: p.name,
                  sku: p.sku,
                  price: p.price && p.price > 0 ? p.price : null,
                  packSize: p.packSize || '1 Unit',
                  categoryName: p.categoryName,
                  imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined,
                  url: `/product/${p.slug || p.id}`,
                });
              }
            }

            toolResult = {
              totalFound: validated.length,
              items: sliced.map((p) => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                price: p.price,
                packSize: p.packSize,
              })),
            };
          } else if (fnName === 'submit_bulk_enquiry') {
            const customerName = (args.customerName || 'Corporate Customer').trim();
            const phone = (args.phone || '').trim();
            const email = (args.email || 'sales4@officebazzar.com').trim();
            const companyName = (args.companyName || 'Corporate Client').trim();
            const deliveryLocation = (args.deliveryLocation || 'Chennai').trim();
            const notes = (args.notes || 'Bulk Quotation Inquiry').trim();

            const quotation = await createQuotation({
              customerName,
              email,
              phone,
              companyName,
              pincode: '600001',
              deliveryLocation,
              preferredContactMethod: 'phone',
              additionalRequirements: notes,
              items: [],
              indicativeSubtotal: 0,
              indicativeGstAmount: 0,
              indicativeTotal: 0,
              status: 'new',
            });

            let zohoResult = { success: false, rfqNumber: quotation.id, leadId: null as string | null };
            try {
              const syncRes = await executeWithTimeout(
                syncQuotationToZoho(quotation),
                3000,
                'Zoho quotation sync'
              );
              zohoResult = {
                success: syncRes.success,
                rfqNumber: quotation.id,
                leadId: syncRes.leadId || null,
              };
            } catch {}

            const assignee = await getNextLeadAssignee();

            toolResult = {
              success: true,
              quotationNumber: quotation.id,
              leadId: zohoResult.leadId,
              assignedExecutive: assignee.name,
              email: assignee.email,
            };
          }

          currentResponse = await executeWithTimeout(
            chat.sendMessage({
              message: [
                {
                  functionResponse: {
                    name: fnName,
                    response: toolResult,
                  },
                },
              ],
            }),
            7000,
            `Gemini [${modelName}] functionResponse`
          );
        }

        // Safely extract text from candidate parts
        let replyText = '';
        const cand = currentResponse.candidates?.[0];
        if (cand?.content?.parts) {
          const texts = cand.content.parts
            .filter((p: any) => typeof p.text === 'string' && p.text.trim())
            .map((p: any) => p.text.trim());
          replyText = texts.join('\n\n');
        }

        if (!replyText && currentResponse.text) {
          replyText = currentResponse.text.trim();
        }

        if (replyText) {
          finalReplyText = replyText;
          activeModelUsed = modelName;
          lastGeminiStatus = '200';
          console.log(
            `[Bazzar AI Gemini Success] Model: ${modelName} | ReplyLen: ${replyText.length} | Cards: ${accumulatedCards.length}`
          );
          break; // Successfully got response from model
        }
      } catch (modelErr: any) {
        lastGeminiStatus = String(modelErr?.status || 'ERROR');
        lastGeminiError = modelErr?.message?.substring(0, 140) || 'Model failed';
        console.warn(
          `[Bazzar AI Model Failed] Model: ${modelName} | Status: ${lastGeminiStatus} | Msg: ${lastGeminiError}`
        );
        // Continue to next candidate model
      }
    }
  } else {
    lastGeminiStatus = 'KEY_MISSING';
    lastGeminiError = 'GEMINI_API_KEY environment variable not configured';
  }

  // If Gemini generated a reply, compose verified AI response
  if (finalReplyText) {
    return composeChatResponse(trimmed, finalReplyText, accumulatedCards, {
      engine: 'gemini',
      modelUsed: activeModelUsed,
      geminiCalled: true,
      geminiStatus: '200',
      geminiValidText: true,
      fallbackActivated: false,
      productsAttached: accumulatedCards.length,
      historyTurnsReceived: history.length,
    });
  }

  // If Gemini was unreachable, use honest contextual conversation engine
  console.log('[Bazzar AI] Using Contextual Conversation Engine Fallback');
  const fallbackResult = await generateContextualConversationFallback(trimmed, history);
  return {
    ...fallbackResult,
    diagnostics: {
      engine: 'contextual_fallback',
      modelUsed: null,
      geminiCalled: Boolean(apiKey),
      geminiStatus: lastGeminiStatus || (apiKey ? 'MODELS_EXHAUSTED' : 'KEY_MISSING'),
      geminiValidText: false,
      fallbackActivated: true,
      fallbackReason: lastGeminiError || 'Gemini API models unavailable or quota exhausted',
      productsAttached: fallbackResult.productCards?.length || 0,
      historyTurnsReceived: history.length,
    },
  };
}

// ==============================================================================
// 4. RESPONSE COMPOSER (ENGINE D)
// ==============================================================================

function composeChatResponse(
  userMsg: string,
  replyText: string,
  productCards: ProductCardSuggestion[],
  diagnostics?: ChatDiagnostics
): ChatResponsePayload {
  const suggestedActions = generateDynamicSuggestions(userMsg, replyText);

  return {
    reply: replyText,
    productCards: productCards.length > 0 ? productCards : undefined,
    suggestedActions,
    quickLinks: [
      { title: 'Browse Catalog', url: '/categories' },
      { title: 'Request Bulk Quote', url: '/request-quote' },
      { title: 'Call 7200800040', url: 'tel:7200800040', external: true },
    ],
    diagnostics,
  };
}

// ==============================================================================
// 5. STRUCTURED CONVERSATION STATE ENGINE
// ==============================================================================

export interface ProductRequirementState {
  category: 'chairs' | 'paper' | 'housekeeping' | 'dustbins' | 'stationery' | 'files' | 'packaging';
  name: string;
  type?: string;
  brand?: string;
  specification?: string;
  quantity?: number;
  quantityUnit?: string;
}

export interface ConversationState {
  products: Map<string, ProductRequirementState>;
  deliveryLocation?: string;
  isPriceInquiry: boolean;
}

export function parseConversationState(
  history: ConversationTurn[],
  currentMessage: string
): ConversationState {
  const state: ConversationState = {
    products: new Map(),
    isPriceInquiry: false,
  };

  // Only parse user messages for user requirements to avoid confusing bot questions with user specs
  const userTurns = history
    .filter((h) => h.role === 'user')
    .map((h) => h.content)
    .concat(currentMessage);

  for (const text of userTurns) {
    const lower = text.toLowerCase();

    // Price inquiry detection
    if (/\b(price|rate|cost|evlo|vilai|quotation|quote|how much|enna vilai)\b/i.test(lower)) {
      state.isPriceInquiry = true;
    }

    // Delivery location detection
    if (/\b(chennai|bangalore|bengaluru|coimbatore|madurai|hyderabad|trichy|salem)\b/i.test(lower)) {
      const lm = lower.match(/\b(chennai|bangalore|bengaluru|coimbatore|madurai|hyderabad|trichy|salem)\b/i);
      if (lm) {
        state.deliveryLocation = lm[1].charAt(0).toUpperCase() + lm[1].slice(1);
      }
    } else {
      const delMatch = lower.match(/\b(?:delivery\s*(?:in|to|at)?\s*([a-z]+)|([a-z]+)\s*delivery)\b/i);
      if (delMatch) {
        const candidate = (delMatch[1] || delMatch[2] || '').trim();
        if (candidate.length >= 3 && !['in', 'to', 'for', 'the', 'my', 'fast', 'quick', 'free'].includes(candidate)) {
          state.deliveryLocation = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        }
      }
    }

    // Chairs detection
    if (/\b(chair|chairs|நாற்காலி|kursi)\b/i.test(lower)) {
      const p = state.products.get('chairs') || { category: 'chairs', name: 'Office Chairs' };
      if (/\b(ergonomic|mesh|lumbar)\b/i.test(lower)) p.type = 'Ergonomic';
      if (/\b(executive|high\s*back)\b/i.test(lower)) p.type = 'Executive';
      if (/\b(visitor|waiting)\b/i.test(lower)) p.type = 'Visitor';

      const qm = lower.match(/\b(\d+)\s*(chairs|chair|pieces|piece|pcs|nos)?\b/i);
      if (qm) {
        p.quantity = parseInt(qm[1], 10);
        p.quantityUnit = qm[2] || 'pieces';
      }
      state.products.set('chairs', p);
    } else if (state.products.has('chairs')) {
      const p = state.products.get('chairs')!;
      if (/\b(ergonomic|mesh|lumbar)\b/i.test(lower)) p.type = 'Ergonomic';
      if (/\b(executive|high\s*back)\b/i.test(lower)) p.type = 'Executive';
      if (/\b(visitor|waiting)\b/i.test(lower)) p.type = 'Visitor';

      const qm = lower.match(/\b(\d+)\s*(chairs|chair|pieces|piece|pcs|nos)?\b/i);
      if (qm && !lower.includes('ream') && !lower.includes('paper')) {
        p.quantity = parseInt(qm[1], 10);
        p.quantityUnit = qm[2] || 'pieces';
      }
      state.products.set('chairs', p);
    }

    // Copier Paper detection
    if (/\b(paper|copier|ream|reams|பேப்பர்)\b/i.test(lower) && !/\b(shredder|cutter|napkin|tissue)\b/i.test(lower)) {
      const p = state.products.get('paper') || { category: 'paper', name: 'Copier Paper' };
      if (/\b(jk|jk copier)\b/i.test(lower)) p.brand = 'JK Copier';
      if (/\btnpl\b/i.test(lower)) p.brand = 'TNPL';
      if (/\bbilt\b/i.test(lower)) p.brand = 'Bilt';
      if (/\b(75\s*gsm|70\s*gsm|80\s*gsm)\b/i.test(lower)) {
        const sm = lower.match(/\b(75|70|80)\s*gsm\b/i);
        if (sm) p.specification = `${sm[1]} GSM`;
      }
      const qm = lower.match(/\b(\d+)\s*(reams|ream|boxes|box|packets|bundles)?\b/i);
      if (qm && (lower.includes('ream') || lower.includes('paper') || lower.includes('box') || !qm[2])) {
        p.quantity = parseInt(qm[1], 10);
        p.quantityUnit = qm[2] || 'reams';
      }
      state.products.set('paper', p);
    } else if (state.products.has('paper')) {
      const p = state.products.get('paper')!;
      if (/\b(jk|jk copier)\b/i.test(lower)) p.brand = 'JK Copier';
      if (/\btnpl\b/i.test(lower)) p.brand = 'TNPL';
      if (/\b(75\s*gsm|70\s*gsm|80\s*gsm)\b/i.test(lower)) {
        const sm = lower.match(/\b(75|70|80)\s*gsm\b/i);
        if (sm) p.specification = `${sm[1]} GSM`;
      }
      const qm = lower.match(/\b(\d+)\s*(reams|ream|boxes|box|packets|bundles)?\b/i);
      if (qm && (lower.includes('ream') || lower.includes('paper') || lower.includes('box') || !qm[2])) {
        p.quantity = parseInt(qm[1], 10);
        p.quantityUnit = qm[2] || 'reams';
      }
      state.products.set('paper', p);
    }
  }

  return state;
}

// ==============================================================================
// 6. CONTEXTUAL CONVERSATION FALLBACK (NO RANDOM OR UNRELATED PRODUCTS)
// ==============================================================================

async function generateContextualConversationFallback(
  userMsg: string,
  history: ConversationTurn[]
): Promise<ChatResponsePayload> {
  const trimmed = userMsg.trim();
  const lower = trimmed.toLowerCase();

  const state = parseConversationState(history, trimmed);

  // Retrieve strictly validated product cards (with fast 2.5s timeout)
  let validatedCards: ProductCardSuggestion[] = [];
  try {
    let products: Product[] = [];
    try {
      const pRes = await Promise.race([
        getProducts(),
        new Promise<{ products: Product[]; total: number }>((_, reject) =>
          setTimeout(() => reject(new Error('getProducts timeout')), 2500)
        ),
      ]);
      products = pRes.products;
    } catch {
      products = INITIAL_PRODUCTS.filter((p: Product) => p.isActive !== false);
    }

    const matches = products.filter((p) => validateProductRelevance(p, trimmed));
    validatedCards = matches.slice(0, 4).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price && p.price > 0 ? p.price : null,
      packSize: p.packSize || '1 Unit',
      categoryName: p.categoryName,
      imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined,
      url: `/product/${p.slug || p.id}`,
    }));
  } catch {}

  const isTamil = /[\u0B80-\u0BFF]/.test(userMsg);
  const isTanglish =
    /\b(venum|irukka|evlo|kedaikkuma|vilai|theva|enakku|ungalukku|solunga|kudunga|pannunga|enna)\b/i.test(
      userMsg
    );
  const isThanks = /\b(thank\s*you|thanks|nandri|dhanyavad|shukriya)\b/i.test(trimmed);
  const isDeliveryOnly =
    /\b(what\s*(is|are)\s*the\s*delivery\s*charge|delivery\s*charges|shipping\s*cost)\b/i.test(trimmed);

  let reply = '';

  // 1. COURTESY / THANKS
  if (isThanks) {
    if (isTamil) {
      reply = `மிக்க மகிழ்ச்சி! தங்களுக்கு மேலும் ஏதேனும் அலுவலகப் பொருட்கள் தேவையா?`;
    } else if (isTanglish) {
      reply = `Romba santhosham! Ungalukku vera edhavadhu office supplies theva padudha?`;
    } else {
      reply = `You're very welcome! Please let me know if you need any other office supplies or assistance.`;
    }
  }
  // 2. DELIVERY INQUIRY ALONE
  else if (isDeliveryOnly) {
    if (isTamil) {
      reply = `சென்னையில் கார்ப்பரேட் மொத்த ஆர்டர்களுக்கு இலவச டெலிவரி வழங்குகிறோம். பிற பகுதிகளுக்கு இடம் மற்றும் அளவுக்கு ஏற்ப நியாயமான போக்குவரத்து கட்டணம் இருக்கும். உங்கள் டெலிவரி லொகேஷன் எது?`;
    } else {
      reply = `We provide free delivery within Chennai for corporate bulk orders. For locations outside Chennai or specialized freight, transport is arranged at actual logistics rates. Which delivery location are you planning for?`;
    }
  }
  // 3. MULTIPLE PRODUCTS (CHAIRS AND PAPER)
  else if (state.products.has('chairs') && state.products.has('paper')) {
    const chair = state.products.get('chairs')!;
    const paper = state.products.get('paper')!;

    if (state.isPriceInquiry) {
      const chairText = chair.quantity ? `${chair.quantity} ${chair.type || ''} chairs` : 'office chairs';
      const paperText = paper.quantity ? `${paper.quantity} reams of ${paper.brand || ''} copier paper` : 'copier paper';
      if (isTanglish) {
        reply = `${chairText} matrum ${paperText}-ku corporate quotation ready panni tharom. ${
          state.deliveryLocation ? `Delivery in ${state.deliveryLocation} note pannitom.` : 'Delivery endha location-ku venum?'
        }`;
      } else {
        reply = `Pricing for ${chairText} and ${paperText} is consolidated into an official corporate quotation with volume discounts and GST billing. ${
          state.deliveryLocation
            ? `I have noted delivery in ${state.deliveryLocation}. May I know your name and company name to prepare the quotation?`
            : 'I can help arrange a quotation. May I know your delivery location?'
        }`;
      }
    } else if (!chair.quantity && !paper.quantity) {
      if (isTanglish) {
        reply = `Kandippa! Office chairs and copier paper rendume supply panrom. Chairs-la ergonomic venuma, executive venuma? Copier paper-la ethana reams theva?`;
      } else {
        reply = `Certainly! I can help with both office chairs and copier paper. For chairs, are you looking for ergonomic, executive, or visitor chairs? For copier paper, do you have a preferred brand or GSM, and how many reams do you need?`;
      }
    } else if (chair.quantity && !paper.quantity) {
      if (isTanglish) {
        reply = `Purinjidhu: ${chair.quantity} chairs note panniten. Copier paper-la ethana reams theva? JK Copier 75 GSM or TNPL?`;
      } else {
        reply = `Understood: ${chair.quantity} chairs noted. For copier paper, approximately how many reams or boxes do you need, and do you have a preferred brand like JK Copier 75 GSM or TNPL?`;
      }
    } else if (!chair.quantity && paper.quantity) {
      reply = `Understood: ${paper.quantity} reams of copier paper noted. For chairs, how many chairs do you need and are you looking for ergonomic or executive models?`;
    } else {
      // Both quantities known
      if (state.deliveryLocation) {
        reply = `Thank you! I have noted your requirement for ${chair.quantity} ${chair.type || ''} chairs and ${
          paper.quantity
        } reams of copier paper with delivery in ${
          state.deliveryLocation
        }. May I know your name and company name to prepare the official quotation?`;
      } else {
        reply = `Understood: ${chair.quantity} ${chair.type || ''} chairs and ${
          paper.quantity
        } reams of copier paper noted. Which delivery location should we consider for the quotation?`;
      }
    }
  }
  // 4. CHAIRS ONLY
  else if (state.products.has('chairs')) {
    const chair = state.products.get('chairs')!;
    const chairType = chair.type ? `${chair.type} chairs` : 'office chairs';

    if (state.isPriceInquiry) {
      if (chair.quantity) {
        if (isTanglish) {
          reply = `${chair.quantity} ${chairType}-ku pricing corporate quotation moolama tharuvom. Quotation arrange panna ${
            state.deliveryLocation
              ? `delivery in ${state.deliveryLocation} note pannitom.`
              : 'endha location-ku delivery venum nu solla mudiyuma?'
          }`;
        } else {
          reply = `Pricing for ${chair.quantity} ${chairType} is handled through our corporate quotation process with volume pricing and GST invoicing. ${
            state.deliveryLocation
              ? `I have noted delivery in ${state.deliveryLocation}. May I know your name and company name to prepare the quotation?`
              : 'I can help arrange a quotation. May I know your delivery location?'
          }`;
        }
      } else {
        reply = `Pricing for office chairs depends on the model and volume. How many chairs do you need so I can provide an accurate quotation?`;
      }
    } else if (state.deliveryLocation && chair.quantity) {
      if (isTanglish) {
        reply = `Nandri! ${state.deliveryLocation}-la ${chair.quantity} ${chairType} delivery requirement note panniten. Ungalukku corporate quotation ready panna unga name and phone number solla mudiyuma?`;
      } else {
        reply = `Thank you! I have your requirement for ${chair.quantity} ${chairType} in ${state.deliveryLocation}. I can help you submit a bulk quotation request. May I know your name and company name?`;
      }
    } else if (chair.quantity) {
      if (isTanglish) {
        reply = `Understood. Ungalukku ${chair.quantity} ${chairType} theva. Endha city or location-ku delivery venum?`;
      } else {
        reply = `Understood. You're looking for ${chair.quantity} ${chairType}. Which delivery location is this for?`;
      }
    } else if (chair.type) {
      reply = `Certainly! How many ${chair.type.toLowerCase()} chairs do you need?`;
    } else {
      if (isTanglish) {
        reply = `Sure! Ungalukku office chairs kandippa provide panrom. Ergonomic chairs venuma, Executive chairs venuma, illa Visitor chairs venuma?`;
      } else {
        reply = `Sure! We can help you find office chairs. Are you looking for ergonomic chairs, executive chairs, or visitor chairs?`;
      }
    }
  }
  // 5. COPIER PAPER ONLY
  else if (state.products.has('paper')) {
    const paper = state.products.get('paper')!;
    if (state.isPriceInquiry && paper.quantity) {
      reply = `Pricing for ${paper.quantity} reams of ${paper.brand || ''} copier paper is provided at wholesale corporate rates. Which delivery location should we consider?`;
    } else if (paper.quantity) {
      reply = `Understood. For ${paper.quantity} reams of copier paper, we provide corporate wholesale rates and fast delivery in Chennai. Which brand do you prefer (JK Copier 75 GSM, TNPL, or Bilt)?`;
    } else {
      reply = `We supply premium copier papers including JK Copier 75 GSM, TNPL Copier, and Bilt. Approximately how many reams or boxes do you need?`;
    }
  }
  // 6. HOUSEKEEPING & CHEMICALS
  else if (
    lower.includes('taski') ||
    lower.includes('clean') ||
    lower.includes('chemical') ||
    lower.includes('phenyl') ||
    lower.includes('mop') ||
    lower.includes('wiper') ||
    lower.includes('handwash')
  ) {
    const quantMatch = trimmed.match(/(\d+)\s*(ltr|liters|can|cans|pcs|pieces|units|packs)?/i);
    if (quantMatch && parseInt(quantMatch[1], 10) > 0) {
      reply = `I have noted your requirement for ${quantMatch[1]} ${quantMatch[2] || 'units'} of cleaning supplies. We supply Diversey Taski (R1 to R9) and commercial hygiene solutions. Which delivery location is this for?`;
    } else {
      reply = `We supply authentic commercial cleaning solutions including Diversey Taski (R1 to R9), floor cleaners, disinfectant phenyls, and microfiber mops. Which cleaning chemicals or equipment do you require?`;
    }
  }
  // 7. DUSTBINS & WASTE MANAGEMENT
  else if (lower.includes('dustbin') || lower.includes('bin') || lower.includes('garbage')) {
    const quantMatch = trimmed.match(/(\d+)\s*(pcs|pieces|units|nos)?/i);
    if (quantMatch && parseInt(quantMatch[1], 10) > 0) {
      reply = `Noted your requirement for ${quantMatch[1]} dustbins. We supply heavy-duty 60L, 120L, and 240L wheeled bins as well as pedal and stainless steel bins. Which delivery location should we quote for?`;
    } else {
      reply = `We supply industrial and office dustbins, including 60L/120L/240L wheeled bins, stainless steel pedal bins, and push-can bins. How many units and what capacity do you need?`;
    }
  }
  // 8. OFFICE STATIONERY, FILES & DESK SUPPLIES
  else if (
    lower.includes('stationery') ||
    lower.includes('file') ||
    lower.includes('folder') ||
    lower.includes('pen') ||
    lower.includes('marker') ||
    lower.includes('stapler') ||
    lower.includes('calculator') ||
    lower.includes('tape')
  ) {
    const quantMatch = trimmed.match(/(\d+)\s*(pcs|pieces|units|boxes|nos|packs)?/i);
    if (quantMatch && parseInt(quantMatch[1], 10) > 0) {
      reply = `I have noted your requirement for ${quantMatch[1]} ${quantMatch[2] || 'units'} of stationery items. We supply corporate box files, markers, desk supplies, and packaging materials. Would you like a formal quotation for Chennai delivery?`;
    } else {
      reply = `We supply comprehensive office stationery, including lever arch files, white board markers, heavy-duty staplers, and packaging tapes. Which specific supplies do you need?`;
    }
  }
  // 9. COMPANY EXPERIENCE, YEARS OPERATING & HISTORY
  else if (
    lower.includes('how many years') ||
    lower.includes('years of experience') ||
    lower.includes('how long has your company') ||
    lower.includes('how long have you been') ||
    lower.includes('company experience') ||
    lower.includes('when was officebazzar founded') ||
    lower.includes('founded') ||
    lower.includes('history of officebazzar') ||
    lower.includes('company history')
  ) {
    reply = `OfficeBazzar was co-founded in 2005 and has **over 20+ years of industry experience** as Chennai's premier B2B corporate supplies and procurement partner, proudly serving more than 5,000+ corporate clients across India.`;
  }
  // 10. ABOUT OFFICEBAZZAR / COMPANY PROFILE
  else if (
    lower.includes('tell me about officebazzar') ||
    lower.includes('about officebazzar') ||
    lower.includes('about us') ||
    lower.includes('who is officebazzar') ||
    lower.includes('who are you') ||
    lower.includes('company profile')
  ) {
    reply = `**OfficeBazzar** (Officebazzar E-Store Private Limited) is Chennai's leading B2B corporate supplies partner with **over 20+ years of dedicated service** (co-founded in 2005 by Founder & Chairman Mr. Atul Patel and Managing Director Mr. Ajith P Dhedhi). Headquartered at Officebazzar Tower in Royapettah, Chennai, with branches in Bangalore, Mumbai, and Hyderabad, we provide comprehensive office supplies, 100% GST ITC invoicing, tailored corporate credit, and dedicated account management to over 5,000+ corporate clients.`;
  }
  // 11. PRODUCTS OFFERED / PRODUCT RANGE
  else if (
    lower.includes('what products') ||
    lower.includes('products offered') ||
    lower.includes('product categories') ||
    lower.includes('what do you sell') ||
    lower.includes('range of products') ||
    lower.includes('product catalog')
  ) {
    reply = `OfficeBazzar offers a comprehensive B2B product range across 9 major categories:\n\n1. **Office Stationery & Desk Supplies:** Lever arch files, pens, staplers, calculators, desk organizers.\n2. **Copier Papers:** JK Copier 75 GSM, TNPL, Bond Paper, Glossy Photo Paper (67 to 100 GSM).\n3. **Ergonomic Office Chairs & Seating:** High-back executive, mesh task, and visitor chairs.\n4. **Housekeeping & Cleaning:** Diversey Taski (R1–R9) and in-house Hi-Clean formulations.\n5. **Waste Management & Dustbins:** 60L, 120L, and 240L wheeled bins, stainless steel pedal bins.\n6. **Packaging Materials:** BoPP tapes, stretch films, strapping rolls, and bubble wrap.\n7. **Safety & Facility Equipment:** Q-manager stanchions, traffic cones, barricade tapes, oxygen concentrators.\n8. **Display & Presentation Boards:** Alkosign magnetic whiteboards, pin-up boards, motorized boards.\n9. **Office Technology:** High-definition conference projectors, laminators, and paper shredders.\n\nWhich category would you like a quote for?`;
  }
  // 12. SERVICES PROVIDED / CORPORATE SOLUTIONS
  else if (
    lower.includes('what services') ||
    lower.includes('services provided') ||
    lower.includes('services do you provide') ||
    lower.includes('corporate services') ||
    lower.includes('solutions do you offer')
  ) {
    reply = `OfficeBazzar provides end-to-end B2B corporate procurement services including:\n\n* **Customized Corporate Bulk Pricing:** Volume-tiered quotations for enterprise and SME procurement.\n* **Fast RFQ Turnaround:** Official corporate quotations within 2 to 4 business hours.\n* **100% GST Tax Invoicing:** Full Input Tax Credit (ITC) compliance (18% commercial, 12% paper).\n* **Corporate Credit Facilities:** 15-day and 30-day payment cycles for pre-approved corporate accounts.\n* **Pan-India Logistics & Delivery:** Free delivery within Chennai, Bangalore, and Kolkata for corporate bulk orders, with same-day dispatch before 1:00 PM IST.\n* **Dedicated Relationship Managers:** Single-point procurement support for contracts and recurring orders.`;
  }
  // 13. DELIVERY / SHIPPING INQUIRIES
  else if (
    lower.includes('delivery') ||
    lower.includes('shipping') ||
    lower.includes('dispatch') ||
    lower.includes('do you deliver')
  ) {
    reply = `Yes, we provide fast and reliable delivery services:\n\n* **Free Delivery:** For all corporate bulk orders in Chennai, Bangalore, and Kolkata. Website catalog orders above ₹999 also get Free Delivery (flat ₹99 below ₹999).\n* **Same-Day Dispatch:** Orders confirmed before 1:00 PM IST are dispatched on the same day.\n* **Transit Timelines:** Next-day/24-hour delivery in Chennai metro; 1-2 business days across Tamil Nadu & major tier-1 hubs; 2-4 business days pan-India.`;
  }
  // 14. IN-HOUSE BRAND / HI-CLEAN
  else if (
    lower.includes('hi-clean') ||
    lower.includes('hiclean') ||
    lower.includes('in-house brand') ||
    lower.includes('own brand')
  ) {
    reply = `**Hi-Clean** is OfficeBazzar's proprietary in-house brand of certified commercial cleaning formulations, surface disinfectants, floor cleaners, and hygiene products, manufactured to deliver industrial-grade cleaning performance at competitive wholesale pricing.`;
  }
  // 15. FOUNDER / LEADERSHIP
  else if (
    lower.includes('founder') ||
    lower.includes('owner') ||
    lower.includes('managing director') ||
    lower.includes('leadership')
  ) {
    reply = `OfficeBazzar was co-founded in 2005. The leadership is headed by Founder & Chairman **Mr. Atul Patel** and Managing Director **Mr. Ajith P Dhedhi** (M.Com, joined 2009), who bring over two decades of corporate supply chain expertise.`;
  }
  // 16. FAQ / CORPORATE INQUIRIES
  else if (lower.includes('gst') || lower.includes('invoice') || lower.includes('tax')) {
    reply = `All corporate orders from OfficeBazzar are accompanied by official GST tax invoices with 100% Input Tax Credit (ITC) eligibility. We support standard 18% GST across supplies and 12% on paper lines.`;
  } else if (lower.includes('contact') || lower.includes('support') || lower.includes('call') || lower.includes('phone') || lower.includes('sales')) {
    reply = `You can reach our corporate procurement desk directly by phone at **+91 7200800040** or by email at **sales4@officebazzar.com** (Monday to Saturday, 9:00 AM - 6:30 PM).`;
  } else if (lower.includes('quotation') || lower.includes('quote') || lower.includes('rfq')) {
    reply = `I can help arrange an official corporate quotation. Please tell me which products and quantities you need, or share your company name and delivery location so our sales desk can generate it.`;
  }
  // 10. GREETING
  else if (/^(hi|hello|hey|vanakkam|namaste)\b/i.test(trimmed)) {
    reply = `Hello! Welcome to OfficeBazzar. How can I help you with your office supplies and corporate procurement today?`;
  }
  // 11. TRANSPARENT SPECIFIC FALLBACK (NEVER BLIND GENERIC PROCUREMENT TEMPLATE)
  else {
    reply = `I am ready to assist with your requirement for "${trimmed}". To ensure our procurement desk provides accurate availability and corporate pricing, could you specify which product or category you need?`;
  }

  // Returns ONLY strictly validated product cards (never unrelated products like Foam Thermocol)
  return {
    reply,
    productCards: validatedCards.length > 0 ? validatedCards : undefined,
    suggestedActions: generateDynamicSuggestions(trimmed, reply),
    quickLinks: [
      { title: 'Browse Catalog', url: '/categories' },
      { title: 'Request Bulk Quote', url: '/request-quote' },
      { title: 'Call 7200800040', url: 'tel:7200800040', external: true },
    ],
  };
}

// ==============================================================================
// 6. DYNAMIC SUGGESTIONS ENGINE
// ==============================================================================

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

  // English / Tanglish
  if (combined.includes('chair') || combined.includes('furniture') || combined.includes('ergonomic')) {
    return ['Ergonomic Chairs', 'Executive Chairs', 'Visitor Chairs', 'Get Chair Quote'];
  }
  if (combined.includes('paper') || combined.includes('copier') || combined.includes('gsm') || combined.includes('ream')) {
    return ['JK Copier 75 GSM', 'TNPL Copier A4', 'Get Quote for 20 Reams', 'Delivery Details'];
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
