import { NextResponse } from 'next/server';
import { getQuotationsByCustomer } from '@/lib/db/store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const customerId = searchParams.get('customerId');

    const identifier = customerId || email;
    if (!identifier) {
      return NextResponse.json(
        { error: 'Customer identifier (email or customerId) is required' },
        { status: 400 }
      );
    }

    const quotations = await getQuotationsByCustomer(identifier);

    // Filter out internal notes and staff notes from customer responses
    const safeQuotations = quotations.map((q) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { internalNotes, ...safe } = q;
      return safe;
    });

    return NextResponse.json({ quotations: safeQuotations });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retrieve quotation history' },
      { status: 500 }
    );
  }
}
