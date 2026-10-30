import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/service';
import { saveCustomerAddressToZoho, getCustomerProfileFromZoho } from '@/lib/zoho/contacts';
import { Address } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = getSessionFromRequest(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const address: Address = await req.json();
    if (!address.addressLine1 || !address.city || !address.pincode) {
      return NextResponse.json(
        { success: false, error: 'Street address, city, and pincode are required.' },
        { status: 400 }
      );
    }

    const result = await saveCustomerAddressToZoho(sessionUser.email, address);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to save address in Zoho CRM' },
        { status: 500 }
      );
    }

    // Return the updated list of addresses from Zoho
    const profile = await getCustomerProfileFromZoho(sessionUser.email);
    return NextResponse.json({
      success: true,
      addresses: profile?.addresses || [address],
      message: 'Address saved to Zoho CRM successfully.',
    });
  } catch (err: any) {
    console.error('[Save Address API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to save address.' },
      { status: 500 }
    );
  }
}

