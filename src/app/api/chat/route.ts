import { NextResponse } from 'next/server';
import { processBazzarAIChat, ConversationTurn, ProductCardSuggestion } from '@/lib/gemini/bazzar-ai';

export type { ProductCardSuggestion };

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const body = await req.json();
    const { message, history } = body;

    console.log(
      `[Chat API Incoming] IP: ${clientIp} | MsgLen: ${message?.length || 0} | HistoryTurns: ${
        Array.isArray(history) ? history.length : 0
      }`
    );

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message content is required.' },
        { status: 400 }
      );
    }

    const conversationHistory: ConversationTurn[] = Array.isArray(history)
      ? history
          .filter(
            (h: any) =>
              h &&
              (h.role === 'user' || h.role === 'assistant') &&
              typeof h.content === 'string' &&
              h.content.trim()
          )
          .map((h: any) => ({
            role: h.role,
            content: h.content.trim(),
          }))
      : [];

    const result = await processBazzarAIChat(message, conversationHistory, clientIp);
    const duration = Date.now() - startTime;
    console.log(
      `[Chat API Response] Success 200 in ${duration}ms | ReplyLen: ${result.reply?.length || 0} | Cards: ${
        result.productCards?.length || 0
      }`
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Chat API Error] Failed after ${duration}ms:`, error?.message || error);
    return NextResponse.json(
      {
        reply:
          "I am ready to help you with corporate office supplies, chairs, paper, and quotations. Please tell me which items you need, or contact our sales desk at **+91 7200800040** or **sales4@officebazzar.com**.",
        suggestedActions: [
          'Office Chairs',
          'A4 Copier Paper',
          'Housekeeping Supplies',
          'Contact Support',
        ],
        quickLinks: [
          { title: 'Explore Catalog', url: '/categories' },
          { title: 'Request Bulk Quote', url: '/request-quote' },
        ],
      },
      { status: 200 }
    );
  }
}
