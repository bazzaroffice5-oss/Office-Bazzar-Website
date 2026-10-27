import { NextResponse } from 'next/server';
import { updateQuotation, getQuotationById } from '@/lib/db/store';
import { QuotationStatus } from '@/types';

const VALID_STATUSES: QuotationStatus[] = [
  'new',
  'under_review',
  'quotation_prepared',
  'sent_to_customer',
  'accepted',
  'rejected',
  'closed',
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, status, assignedTo, internalNotes, quotedAmount, quotationDocumentUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'Quotation ID is required for update' }, { status: 400 });
    }

    const existing = await getQuotationById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status "${status}". Allowed values: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updates: Parameters<typeof updateQuotation>[1] = {};
    if (status !== undefined) updates.status = status;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo ? String(assignedTo).trim() : undefined;
    if (internalNotes !== undefined) updates.internalNotes = internalNotes ? String(internalNotes).trim() : undefined;
    if (quotedAmount !== undefined) {
      const parsedAmount = Number(quotedAmount);
      updates.quotedAmount = isNaN(parsedAmount) ? undefined : parsedAmount;
    }
    if (quotationDocumentUrl !== undefined) {
      updates.quotationDocumentUrl = quotationDocumentUrl ? String(quotationDocumentUrl).trim() : undefined;
    }

    const updated = await updateQuotation(id, updates);
    return NextResponse.json({
      success: true,
      quotation: updated,
      message: 'Quotation updated successfully',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update quotation' },
      { status: 500 }
    );
  }
}
