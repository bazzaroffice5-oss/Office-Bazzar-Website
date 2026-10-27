import { NextResponse } from 'next/server';
import { getQuotationById, getQuotationByNumber } from '@/lib/db/store';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Quotation reference is required' }, { status: 400 });
    }

    let quotation = await getQuotationById(id);
    if (!quotation) {
      quotation = await getQuotationByNumber(id);
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
