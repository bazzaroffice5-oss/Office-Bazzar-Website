import { NextResponse } from 'next/server';
import { getQuoteByReferenceFromZoho } from '@/lib/zoho/quotes';
import { getQuotationById, getQuotationByNumber } from '@/lib/db/store';
import { Quotation } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Quotation reference is required' }, { status: 400 });
    }

    const cleanId = decodeURIComponent(id).trim();

    // 1. Primary: Look up directly from Zoho CRM Quotes
    let quotation: Quotation | null = null;
    try {
      quotation = await getQuoteByReferenceFromZoho(cleanId);
    } catch (crmErr) {
      console.warn('[Quotation API] Zoho CRM lookup error:', crmErr);
    }

    // 2. Secondary: Fallback to local store
    if (!quotation) {
      quotation = await getQuotationById(cleanId);
      if (!quotation) {
        quotation = await getQuotationByNumber(cleanId);
      }
    }

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Check if staff/admin authentication header is present
    const authHeader = req.headers.get('Authorization');
    const adminKey = process.env.ADMIN_SECRET_KEY;
    const isStaff = adminKey && authHeader === `Bearer ${adminKey}`;

    if (!isStaff) {
      // Strip internal notes and sensitive staff assignments for customer view
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { internalNotes, ...safeQuotation } = quotation;
      return NextResponse.json({ quotation: safeQuotation });
    }

    return NextResponse.json({ quotation });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error retrieving quotation' },
      { status: 500 }
    );
  }
}
