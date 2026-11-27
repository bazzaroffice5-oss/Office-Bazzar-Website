import { NextResponse } from 'next/server';
import { getQuoteByReferenceFromZoho } from '@/lib/zoho/quotes';
import { getDurableQuotationById } from '@/lib/durable-store';
import { getQuotationById, getQuotationByNumber } from '@/lib/db/store';
import { Quotation } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // 1. Primary: Lookup directly from authoritative Durable Store (KV / Cloudinary) with complete items
    let quotation: Quotation | null = await getDurableQuotationById(cleanId, true);

    // 2. Secondary: Fallback to in-memory store
    if (!quotation) {
      quotation = await getQuotationById(cleanId);
    }
    if (!quotation) {
      quotation = await getQuotationByNumber(cleanId);
    }

    // 3. Fallback to Zoho CRM ONLY if not found in durable store or if line items are missing
    if (!quotation || !quotation.items || quotation.items.length === 0) {
      try {
        const crmQuote = await getQuoteByReferenceFromZoho(cleanId);
        if (crmQuote) {
          if (!quotation) {
            quotation = crmQuote;
          } else if (crmQuote.items && crmQuote.items.length > 0) {
            quotation.items = crmQuote.items;
          }
        }
      } catch (crmErr) {
        console.warn('[Quotation API] Zoho CRM lookup error:', crmErr);
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
      return NextResponse.json(
        { quotation: safeQuotation },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
    }

    return NextResponse.json(
      { quotation },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error retrieving quotation' },
      { status: 500 }
    );
  }
}
