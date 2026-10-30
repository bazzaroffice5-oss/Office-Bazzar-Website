import { NextRequest, NextResponse } from 'next/server';
import { getCustomerQuotationsFromZoho } from '@/lib/zoho/quotes';
import { getQuotationsByCustomer } from '@/lib/db/store';
import { getSessionFromRequest } from '@/lib/auth/service';
import { Quotation } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = getSessionFromRequest(req);
    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get('email')?.trim()?.toLowerCase();
    const queryCustomerId = searchParams.get('customerId')?.trim();

    // Data Isolation Enforcement:
    // If authenticated as a customer, they can ONLY view their own quotations.
    let targetEmail: string;
    let targetCustomerId: string | undefined = undefined;

    if (sessionUser) {
      if (sessionUser.role === 'admin') {
        // Admin can inspect any customer's quotations
        targetEmail = queryEmail || sessionUser.email;
        targetCustomerId = queryCustomerId;
      } else {
        // Regular customer: strictly bound to authenticated session identity
        targetEmail = sessionUser.email;
        targetCustomerId = sessionUser.id;
      }
    } else {
      // Unauthenticated request: require explicit identifier
      if (!queryEmail && !queryCustomerId) {
        return NextResponse.json(
          { error: 'Unauthorized: Authentication required to view quotation history.' },
          { status: 401 }
        );
      }
      targetEmail = queryEmail || '';
      targetCustomerId = queryCustomerId;
    }

    const primaryIdentifier = targetEmail || targetCustomerId || '';

    // 1. Primary: Read quotation history directly from Zoho CRM Quotes
    let quotations: Quotation[] = [];
    try {
      quotations = await getCustomerQuotationsFromZoho(primaryIdentifier);
    } catch (crmErr) {
      console.warn('[Customer Quotes API] Zoho CRM query error, falling back to local database:', crmErr);
    }

    // 2. Secondary / Fallback: If no records in Zoho CRM, query Supabase database
    if (quotations.length === 0) {
      try {
        const fallbackQuotes = await getQuotationsByCustomer(primaryIdentifier);
        if (fallbackQuotes && fallbackQuotes.length > 0) {
          quotations = fallbackQuotes;
        }
      } catch (dbErr) {
        console.warn('[Customer Quotes API] Database fallback error:', dbErr);
      }
    }

    // Filter out internal notes from customer-facing payload
    const safeQuotations = quotations.map((q) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { internalNotes, ...safe } = q;
      return safe;
    });

    return NextResponse.json({
      success: true,
      quotations: safeQuotations,
      count: safeQuotations.length,
    });
  } catch (err: unknown) {
    console.error('[Customer Quotations API Error]:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retrieve quotation history.' },
      { status: 500 }
    );
  }
}
