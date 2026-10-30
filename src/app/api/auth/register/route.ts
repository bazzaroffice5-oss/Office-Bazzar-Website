import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie, SessionUser } from '@/lib/auth/service';
import { syncCustomerToZohoContact } from '@/lib/zoho/contacts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body?.name?.trim();
    const email = body?.email?.trim()?.toLowerCase();
    const phone = body?.phone?.trim();
    const companyName = body?.companyName?.trim();
    const gstin = body?.gstin?.trim();

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Full name and business email are required.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Upsert Customer in Zoho CRM Contacts (and Accounts)
    const websiteCustomerId = `ob_cust_${Buffer.from(email).toString('hex').slice(0, 12)}`;
    const syncRes = await syncCustomerToZohoContact({
      name,
      email,
      phone,
      companyName,
      gstin,
      websiteCustomerId,
    });

    const sessionUser: SessionUser = {
      id: syncRes.contactId || websiteCustomerId,
      email,
      name,
      companyName,
      role: 'customer',
      zohoContactId: syncRes.contactId,
      zohoAccountId: syncRes.accountId,
    };

    const res = NextResponse.json({
      success: true,
      user: sessionUser,
      message: 'Account registered successfully in Zoho CRM.',
    });

    setSessionCookie(res, sessionUser);
    return res;
  } catch (err: any) {
    console.error('[Register API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}

