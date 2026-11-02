/**
 * Bazzar AI – Advanced Gemini-Style Conversational Intelligence for OfficeBazzar
 * Separates AI Conversation, Product Retrieval, Relevance Validation, and Response Composition.
 * Zero tolerance for unrelated product recommendations.
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

Company Capabilities & Rules:
1. Product Scope:
   - Office Stationery, Copier Papers (JK Copier 75 GSM, TNPL, etc.), Ergonomic Office Chairs & Seating, Housekeeping Chemicals (Taski, Hi-Clean), Commercial Dustbins (Stainless Steel, 60L/120L/240L Wheeled Bins), Packaging Materials, and Road Safety Equipment.
   - For office chairs: We supply corporate chairs (Ergonomic mesh chairs, Executive chairs, Visitor chairs) on customized corporate volume quotations. Note: Catalog self-checkout listings for chairs are not published on the website, so chairs are supplied through our dedicated procurement desk.
   - Delivery Policy: Free delivery within Chennai for corporate bulk orders. For locations outside Chennai or specific vehicle logistics, freight is arranged transparently based on actual destination. Never invent delivery fees.
   - Support Desk: Phone +91 7200800040 | Email sales4@officebazzar.com | Chennai Hub.

2. Critical Context & Conversation Intelligence Rules:
   - Price Follow-up Rule: When a customer asks "What is the price?" or "Show me the price" after previously providing a product and quantity (e.g., 20 ergonomic chairs), DO NOT ask for the quantity again! The quantity is already known. Directly answer that pricing for the requested quantity (e.g., 20 ergonomic chairs) is handled via customized corporate volume quotations with GST invoicing, and ask for their delivery location or contact details to prepare the quotation.
   - Multiple Products Rule: When a customer mentions multiple products (e.g. "I need chairs and copier paper"), track BOTH requirements independently. Do not discard one product. Acknowledge both requirements, ask clarification for chairs (e.g. ergonomic, executive, visitor), and then address copier paper (e.g. brand JK Copier/TNPL, GSM, and ream quantity).
   - Asking Questions: Ask only ONE useful clarification question at a time. Do NOT ask for information that the customer has already stated in previous turns.
   - Courtesy & Gratitude: When a user says "Thank you" or gives casual courtesies, reply naturally and warmly without resetting the conversation or repeating generic greetings.

3. Multilingual Excellence:
   - Automatically detect the customer's language and respond naturally in that language and style.
   - English -> Clear, natural English.
   - Tamil (தமிழ்) -> Natural, polite Tamil.
   - Tanglish (Tamil written in English) -> Fluent, natural Tanglish.
   - Hindi (हिंदी), Malayalam (മലയാളം), Telugu (తెలుగు), Kannada (ಕನ್ನಡ) -> Mirror their language fluently.

4. Product Recommendations:
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
    };
  }

  // Rate Limiting
  if (!checkRateLimit(clientIp)) {
    return {
      reply: 'You are sending messages too quickly. Please wait a few seconds before trying again.',
      suggestedActions: ['Find Products', 'Contact Support'],
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const configuredModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  console.log(
    `[Bazzar AI Request] IP: ${clientIp} | MsgLen: ${trimmed.length} | HistoryTurns: ${history.length} | PrimaryModel: ${configuredModel}`
  );

  // Fallback models in priority order if primary model hits 429 quota exhaustion
  const candidateModels = [configuredModel, 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];

  let finalReplyText: string | null = null;
  let activeModelUsed: string = configuredModel;

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

    // Try primary model, with automatic fallback to secondary flash-lite model if primary returns 429
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

        let currentResponse = await chat.sendMessage({ message: trimmed });

        // Tool execution loop
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
            const { products } = await getProducts();

            // Run candidates through Product Relevance Validator (Engine C)
            const validated = products.filter((p) =>
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
              const syncRes = await syncQuotationToZoho(quotation);
              zohoResult = {
                success: syncRes.success,
                rfqNumber: quotation.id,
                leadId: syncRes.leadId || null,
              };
            } catch {}

            const assignee = await getNextLeadAssignee();
            dispatchQuotationNotifications(quotation, {
              zohoQuoteId: zohoResult.leadId || undefined,
            }).catch(() => {});

            toolResult = {
              success: true,
              quotationNumber: quotation.id,
              assignedExecutive: assignee.name,
              email: assignee.email,
            };
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
          console.log(
            `[Bazzar AI Gemini Success] Model: ${modelName} | ReplyLen: ${replyText.length} | Cards: ${accumulatedCards.length}`
          );
          break; // Successfully got response from model
        }
      } catch (modelErr: any) {
        console.warn(
          `[Bazzar AI Model Failed] Model: ${modelName} | Status: ${modelErr?.status || 'ERR'} | Msg: ${modelErr?.message?.substring(0, 120)}`
        );
        // Continue to next candidate model
      }
    }
  }

  // If Gemini generated a reply, compose response
  if (finalReplyText) {
    return composeChatResponse(trimmed, finalReplyText, accumulatedCards);
  }

  // If Gemini was unreachable, use honest contextual conversation engine without unreliable product guessing
  console.log('[Bazzar AI] Using Contextual Conversation Engine Fallback');
  return await generateContextualConversationFallback(trimmed, history);
}

// ==============================================================================
// 4. RESPONSE COMPOSER (ENGINE D)
// ==============================================================================

function composeChatResponse(
  userMsg: string,
  replyText: string,
  productCards: ProductCardSuggestion[]
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
      let p = state.products.get('chairs') || { category: 'chairs', name: 'Office Chairs' };
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
      let p = state.products.get('chairs')!;
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
      let p = state.products.get('paper') || { category: 'paper', name: 'Copier Paper' };
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
      let p = state.products.get('paper')!;
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

  // Retrieve strictly validated product cards (if genuinely matching)
  let validatedCards: ProductCardSuggestion[] = [];
  try {
    const { products } = await getProducts();
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
  // 6. HOUSEKEEPING & DUSTBINS
  else if (
    lower.includes('clean') ||
    lower.includes('housekeeping') ||
    lower.includes('dustbin') ||
    lower.includes('taski')
  ) {
    reply = `We supply commercial housekeeping & hygiene supplies, including Taski cleaning chemicals, heavy-duty wheeled dustbins (60L, 120L, 240L), cleaning cloths, and wipers. Which specific item do you need?`;
  }
  // 7. GREETING
  else if (/^(hi|hello|hey|vanakkam|namaste)\b/i.test(trimmed)) {
    reply = `Hello! Welcome to OfficeBazzar. How can I help you today?`;
  }
  // 8. GENERAL
  else {
    reply = `I can help you procure that for your office. Could you share the approximate quantity and specifications you need so our procurement desk can check availability and pricing?`;
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
