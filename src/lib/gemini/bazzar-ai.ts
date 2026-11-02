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
            phone: { type: Type.STRING, description: '10-digit mobile number' },
            email: { type: Type.STRING, description: 'Corporate email address' },
            companyName: { type: Type.STRING, description: 'Company or institution name' },
            deliveryLocation: { type: Type.STRING, description: 'City or delivery pincode (e.g. Chennai)' },
            notes: { type: Type.STRING, description: 'Product list, quantities, specifications' },
          },
          required: ['customerName', 'phone', 'notes'],
        },
      },
    ],
  },
];

const BAZZAR_AI_SYSTEM_INSTRUCTION = `You are "Bazzar AI", the intelligent, courteous, and efficient corporate procurement assistant for OfficeBazzar (https://officebazzar.com).

Company Context:
- OfficeBazzar is Chennai's premier B2B corporate supplies partner.
- We supply Office Stationery, Copier Papers (JK Copier, TNPL, etc.), Ergonomic Office Chairs & Furniture, Housekeeping & Hygiene Chemicals (Taski, Hi-Clean), Commercial Dustbins (Stainless Steel, 60L/120L/240L Wheeled Bins), Packing Materials, and Road Safety Equipment.
- Direct corporate desk: +91 7200800040 | sales4@officebazzar.com | Chennai Hub.

Core Conversational Guidelines:
1. Dynamic Natural Conversation:
   - Understand the customer's actual intent and reply specifically to their question.
   - Do NOT repeat the welcome message. The welcome message is only for session start.
   - Ask only ONE relevant follow-up clarification question at a time (e.g. asking for chair type, paper ream count, or delivery city).
   - If the user provides a follow-up answer (e.g. "ergonomic" or "20 pieces"), link it directly to the previous product in conversation history.

2. Multilingual Fluency:
   - Automatically detect the customer's language and respond in the same language and style.
   - English -> Clear, professional English.
   - Tamil (தமிழ்) -> Natural, polite Tamil.
   - Tanglish (Tamil in English letters) -> Natural, friendly Tanglish.
   - Hindi (हिंदी), Malayalam (മലയാളം), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), etc. -> Mirror their language fluently.

3. Product Catalog & Recommendations:
   - When users inquire about items, use 'search_catalog' with English keywords to verify live items.
   - For office chairs and furniture: explain options (Ergonomic mesh chairs with lumbar support, Executive high-back chairs, Visitor chairs) and ask for the quantity/specification needed.
   - Never invent fake SKU codes or incorrect technical claims.

4. Quotations & Bulk Inquiries:
   - If the customer wants pricing or a quote for specific quantities, offer to prepare an official GST quote.
   - When name and contact number/email are provided, submit a bulk RFQ via 'submit_bulk_enquiry'.`;

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

  console.log(
    `[Bazzar AI Request] IP: ${clientIp} | MsgLen: ${trimmed.length} | HistoryTurns: ${history.length} | TargetModel: ${modelName}`
  );

  try {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment');
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format previous turns for Gemini Chat ensuring valid alternating sequence: User -> Model -> User -> Model
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

      let toolResult: any;

      if (fnName === 'search_catalog') {
        const queryTerm = (args.query || '').trim();
        const categoryFilter = (args.category || '').trim();

        const { products } = await getProducts();
        const qTokens = queryTerm
          .toLowerCase()
          .split(/[\s,+/&.-]+/)
          .filter((t: string) => t.length >= 2);

        const matches = products.filter((p) => {
          const matchCat =
            !categoryFilter ||
            p.categoryName?.toLowerCase().includes(categoryFilter.toLowerCase());
          const text = `${p.name} ${p.sku} ${p.categoryName || ''}`.toLowerCase();
          const matchTokens =
            qTokens.length === 0 || qTokens.some((t: string) => text.includes(t));
          return matchCat && matchTokens;
        });

        const sliced = matches.slice(0, 5);
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
          totalFound: matches.length,
          returned: sliced.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            price: p.price,
            packSize: p.packSize,
            category: p.categoryName,
          })),
        };
      } else if (fnName === 'get_product_details') {
        const query = (args.skuOrName || '').toLowerCase().trim();
        const { products } = await getProducts();
        const product = products.find(
          (p) =>
            p.sku.toLowerCase() === query ||
            p.name.toLowerCase().includes(query) ||
            p.slug.toLowerCase() === query
        );

        if (product) {
          if (!accumulatedCards.some((c) => c.id === product.id)) {
            accumulatedCards.push({
              id: product.id,
              name: product.name,
              sku: product.sku,
              price: product.price && product.price > 0 ? product.price : null,
              packSize: product.packSize || '1 Unit',
              categoryName: product.categoryName,
              imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined,
              url: `/product/${product.slug || product.id}`,
            });
          }
          toolResult = {
            found: true,
            sku: product.sku,
            name: product.name,
            price: product.price,
            packSize: product.packSize,
            category: product.categoryName,
            description: product.description,
            stockQuantity: product.stockQuantity,
          };
        } else {
          toolResult = { found: false, message: 'Item not found in current inventory.' };
        }
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

    // Extract text safely from response parts
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

    if (!replyText) {
      replyText =
        'Sure! We can help you with that. Could you please specify the approximate quantity or model you need?';
    }

    console.log(
      `[Bazzar AI Gemini Success] Model: ${modelName} | ReplyLen: ${replyText.length} | Cards: ${accumulatedCards.length}`
    );

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
    console.error(
      `[Bazzar AI Gemini Call Failed] Model: ${modelName} | Status: ${error?.status || 'ERR'} | Error:`,
      error?.message?.substring(0, 150)
    );

    // Fallback: Use context-aware conversation responder with live catalog
    try {
      const { products } = await getProducts();
      return generateContextualConversationFallback(trimmed, history, products, accumulatedCards);
    } catch (fallbackErr: any) {
      console.error('[Bazzar AI Fallback Store Error]:', fallbackErr?.message);
      return generateContextualConversationFallback(trimmed, history, [], accumulatedCards);
    }
  }
}

/**
 * Intelligent, context-aware conversation fallback.
 * Understands customer intent, remembers previous conversation turns, asks only 1 clarification question,
 * and NEVER repeats the initial welcome greeting.
 */
function generateContextualConversationFallback(
  userMsg: string,
  history: ConversationTurn[],
  products: Product[],
  existingCards: ProductCardSuggestion[] = []
): ChatResponsePayload {
  const trimmed = userMsg.trim();
  const lower = trimmed.toLowerCase();

  // Combine history to maintain multi-turn context
  const historyText = history
    .filter((h) => h.content)
    .map((h) => h.content.toLowerCase())
    .join(' ');
  const fullContext = `${historyText} ${lower}`;

  // Language detection
  const isTamil = /[\u0B80-\u0BFF]/.test(userMsg);
  const isTanglish =
    /\b(venum|irukka|evlo|kedaikkuma|vilai|theva|enakku|ungalukku|solunga|kudunga|pannunga)\b/i.test(
      trimmed
    );
  const isHindi = /[\u0900-\u097F]/.test(userMsg);

  // Entities & Categories
  const hasChairs =
    fullContext.includes('chair') ||
    fullContext.includes('நாற்காலி') ||
    fullContext.includes('kursi');
  const hasPaper =
    fullContext.includes('paper') ||
    fullContext.includes('copier') ||
    fullContext.includes('a4') ||
    fullContext.includes('gsm') ||
    fullContext.includes('ream') ||
    fullContext.includes('பேப்பர்');
  const hasDustbin =
    fullContext.includes('dustbin') ||
    fullContext.includes('bin') ||
    fullContext.includes('குப்பை');
  const hasCleaning =
    fullContext.includes('clean') ||
    fullContext.includes('taski') ||
    fullContext.includes('chemical') ||
    fullContext.includes('mop') ||
    fullContext.includes('wiper') ||
    fullContext.includes('துப்புரவு');
  const hasFiles =
    fullContext.includes('file') ||
    fullContext.includes('folder') ||
    fullContext.includes('register') ||
    fullContext.includes('stationery');
  const isGreeting = /^(hi|hello|hey|vanakkam|namaste|good\s*(morning|afternoon|evening))\b/i.test(
    trimmed
  );

  // Attributes
  const isErgonomic =
    fullContext.includes('ergonomic') ||
    fullContext.includes('lumbar') ||
    fullContext.includes('mesh');
  const isExecutive =
    fullContext.includes('executive') ||
    fullContext.includes('leather') ||
    fullContext.includes('high back');
  const isVisitor = fullContext.includes('visitor') || fullContext.includes('waiting');

  // Quantity detection (e.g. "20", "20 pieces", "50 reams", "10 units")
  const qtyMatch = trimmed.match(
    /\b(\d+)\s*(pieces|piece|pcs|nos|units|reams|ream|chairs|chair|boxes|box)?\b/i
  );
  const qtyNum = qtyMatch ? qtyMatch[1] : null;

  // Search product matches for cards
  const qTokens = lower
    .split(/[\s,+/&.-]+/)
    .filter(
      (t) =>
        t.length >= 2 &&
        !['need', 'want', 'have', 'with', 'what', 'price', 'tell', 'about', 'some', 'give'].includes(
          t
        )
    );

  const matchedProducts = products
    .filter((p) => {
      const pText = `${p.name} ${p.sku} ${p.categoryName || ''}`.toLowerCase();
      return qTokens.some((t) => pText.includes(t));
    })
    .slice(0, 4);

  const productCards: ProductCardSuggestion[] =
    existingCards.length > 0
      ? existingCards
      : matchedProducts.map((p) => ({
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

  // 1. CHAIRS CONVERSATION FLOW
  if (hasChairs) {
    if (qtyNum) {
      if (isErgonomic) {
        if (isTamil) {
          reply = `புரிந்துகொண்டேன். தங்களுக்கு ${qtyNum} Ergonomic chairs தேவைப்படுகிறது. சென்னை மற்றும் பிற இடங்களுக்கு GST பில்லுடன் உடனடி மொத்த விலைப்புள்ளி (Bulk Quote) வழங்க எங்கள் விற்பனை மேசை தயாராக உள்ளது. டெலிவரி செய்ய வேண்டிய இடம் எது?`;
        } else if (isTanglish) {
          reply = `Purinjidhu! Ungalukku ${qtyNum} Ergonomic chairs theva. Direct corporate GST bulk quotation tharom. Endha location-ku delivery venum?`;
        } else {
          reply = `Understood. You're looking for ${qtyNum} ergonomic chairs. Let me help you find suitable options from our catalogue. Our corporate procurement desk can also provide volume pricing with GST invoicing. Which city or delivery location is this for?`;
        }
      } else {
        if (isTamil) {
          reply = `புரிந்துகொண்டேன். தங்களுக்கு ${qtyNum} நாற்காலிகள் தேவைப்படுகிறது. Ergonomic mesh chairs, Executive chairs அல்லது Visitor chairs-ல் எது தேவை?`;
        } else if (isTanglish) {
          reply = `Purinjidhu! Ungalukku ${qtyNum} chairs theva. Ergonomic mesh chairs venuma, Executive chairs venuma, illa Visitor chairs venuma?`;
        } else {
          reply = `Understood. You're looking for ${qtyNum} chairs. Are you looking for ergonomic mesh chairs, executive chairs, or visitor chairs?`;
        }
      }
    } else if (isErgonomic) {
      if (isTamil) {
        reply = `நிச்சயமாக! எத்தனை Ergonomic chairs உங்களுக்குத் தேவைப்படுகிறது?`;
      } else if (isTanglish) {
        reply = `Kandippa! Ungalukku ethana Ergonomic chairs theva paduthu?`;
      } else {
        reply = `Certainly! How many ergonomic chairs do you need?`;
      }
    } else if (isExecutive) {
      if (isTamil) {
        reply = `நிச்சயமாக! எத்தனை Executive chairs உங்களுக்குத் தேவைப்படுகிறது?`;
      } else if (isTanglish) {
        reply = `Kandippa! Ungalukku ethana Executive chairs venum?`;
      } else {
        reply = `Certainly! How many executive chairs do you need?`;
      }
    } else {
      // User says "i need chairs"
      if (isTamil) {
        reply = `கண்டிப்பாக! உங்களுக்கான Office Chairs வழங்க நாங்கள் தயாராக உள்ளோம். உங்களுக்கு Ergonomic chairs, Executive chairs அல்லது Visitor chairs தேவையா?`;
      } else if (isTanglish) {
        reply = `Sure! Ungalukku office chairs kandippa provide panrom. Ergonomic chairs venuma, Executive chairs venuma, illa Visitor chairs venuma?`;
      } else {
        reply = `Sure! We can help you find office chairs. Are you looking for ergonomic chairs, executive chairs, or visitor chairs?`;
      }
    }
  }
  // 2. COPIER PAPER FLOW
  else if (hasPaper) {
    if (qtyNum) {
      if (isTamil) {
        reply = `புரிந்துகொண்டேன். ${qtyNum} reams பேப்பருக்கு சென்னை மற்றும் பிற பகுதிகளுக்கு மொத்த விலை மற்றும் உடனடி டெலிவரி வழங்குகிறோம். JK Copier 75 GSM அல்லது TNPL-ல் எது வேண்டும்?`;
      } else if (isTanglish) {
        reply = `Purinjidhu! ${qtyNum} reams paper-ku best corporate bulk rate tharom. JK Copier 75 GSM venuma illa TNPL venuma?`;
      } else {
        reply = `Understood. For ${qtyNum} reams of copier paper, we provide corporate wholesale rates and fast delivery in Chennai. Which brand do you prefer (JK Copier 75 GSM, TNPL, or Bilt)?`;
      }
    } else {
      if (isTamil) {
        reply = `எங்களிடம் JK Copier 75 GSM மற்றும் TNPL உயர்தர A4 பேப்பர்கள் உள்ளன. தோராயமாக எத்தனை reams அல்லது boxes தேவைப்படுகிறது?`;
      } else if (isTanglish) {
        reply = `Enga kitta JK Copier 75 GSM and TNPL Copier A4 paper irukku. Ungalukku ethana reams theva?`;
      } else {
        reply = `We supply premium copier papers including JK Copier 75 GSM, TNPL Copier, and Bilt. Approximately how many reams or boxes do you need?`;
      }
    }
  }
  // 3. DUSTBINS & HOUSEKEEPING FLOW
  else if (hasDustbin || hasCleaning) {
    if (qtyNum) {
      if (isTamil) {
        reply = `புரிந்துகொண்டேன். ${qtyNum} யூனிட்கள் துப்புரவு பொருட்கள் / குப்பைத் தொட்டிகளுக்கு உடனடி கார்ப்பரேட் விலைப்புள்ளி வழங்குகிறோம். டெலிவரி இடம் எது?`;
      } else {
        reply = `Understood. For ${qtyNum} units of commercial cleaning supplies / dustbins, we offer direct volume quotes. Which delivery location is this for?`;
      }
    } else {
      if (isTamil) {
        reply = `எங்களிடம் 60L, 120L, 240L சக்கர குப்பைத் தொட்டிகள் மற்றும் Taski துப்புரவு கெமிக்கல்கள் உள்ளன. தங்களுக்கு எந்த அளவு அல்லது பொருள் தேவைப்படுகிறது?`;
      } else {
        reply = `We supply heavy-duty commercial dustbins (60L, 120L, 240L wheeled bins, stainless steel pedal bins) and Taski housekeeping chemicals. Which specific size or item do you need?`;
      }
    }
  }
  // 4. FILES & STATIONERY FLOW
  else if (hasFiles) {
    if (isTamil) {
      reply = `எங்களிடம் Box Files, Cobra Files, நோட்புக் மற்றும் அனைத்து அலுவலக எழுதுபொருட்களும் மொத்த விலையில் கிடைக்கின்றன. எத்தனை எண்ணிக்கையில் தேவைப்படுகிறது?`;
    } else {
      reply = `We provide complete corporate office stationery including lever arch box files, cobra spring files, punching machines, and registers. How many units do you need?`;
    }
  }
  // 5. GREETING
  else if (isGreeting) {
    if (isTamil) {
      reply = `வணக்கம்! OfficeBazzar-க்கு தங்களை வரவேற்கிறோம். இன்று தங்களுக்கு அலுவலக பொருட்களில் எவ்வாறு உதவ முடியும்?`;
    } else if (isTanglish) {
      reply = `Hello! Welcome to OfficeBazzar. Ungalukku enna office supplies venum?`;
    } else {
      reply = `Hello! Welcome to OfficeBazzar. How can I help you today?`;
    }
  }
  // 6. DEFAULT / SEARCH MATCHES
  else {
    if (productCards.length > 0) {
      if (isTamil) {
        reply = `எங்கள் பட்டியலிலிருந்து பொருந்தக்கூடிய பொருட்கள் கீழே உள்ளன. தங்களுக்குத் தேவையான அளவைக் கூறினால் உடனடி விலைப்புள்ளி வழங்கப்படும்.`;
      } else {
        reply = `Here are suitable options from our catalogue matching your query. Let me know the quantities you require or if you would like an official quotation.`;
      }
    } else {
      if (isTamil) {
        reply = `தங்களுக்குத் தேவையான பொருளின் அளவு மற்றும் விவரங்களைக் கூறினால், எங்கள் விற்பனை மேசை உடனடி விலையை வழங்கும்.`;
      } else {
        reply = `I can help you procure that. Could you share the approximate quantity and specifications you need so our procurement desk can check availability and pricing?`;
      }
    }
  }

  const suggestedActions = generateDynamicSuggestions(trimmed, reply);

  return {
    reply,
    productCards: productCards.length > 0 ? productCards : undefined,
    suggestedActions,
    quickLinks: [
      { title: 'Browse Catalog', url: '/categories' },
      { title: 'Request Bulk Quote', url: '/request-quote' },
      { title: 'Call 7200800040', url: 'tel:7200800040', external: true },
    ],
  };
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
