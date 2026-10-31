import { NextResponse } from 'next/server';
import { processBazzarAIChat, ConversationTurn, ProductCardSuggestion } from '@/lib/gemini/bazzar-ai';

export type { ProductCardSuggestion };

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const body = await req.json();
    const { message, history } = body;

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

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[API Chat Unhandled Error]:', error);
    return NextResponse.json(
      {
        reply:
          "Welcome to **OfficeBazzar**. Our customer procurement desk is ready to help at **+91 7200800040** or **sales4@officebazzar.com**.",
        suggestedActions: [
          'Find Products',
          'Bulk Order Enquiry',
          'Get a Quotation',
          'Contact Support',
        ],
        quickLinks: [
          { title: 'Explore All Categories', url: '/categories' },
          { title: 'Request Bulk Quote', url: '/request-quote' },
        ],
      },
      { status: 200 }
    );
  }
}
