import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/service';
import { getCustomerProfileFromZoho, syncCustomerToZohoContact } from '@/lib/zoho/contacts';
import { CustomerUser, Address } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = getSessionFromRequest(req);
    if (!sessionUser) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        addresses: [],
      });
    }

    // If user is Admin, return admin profile directly
    if (sessionUser.role === 'admin') {
      const adminUser: CustomerUser = {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        companyName: sessionUser.companyName,
        role: 'admin',
      };
      return NextResponse.json({
        authenticated: true,
        user: adminUser,
        addresses: [],
      });
    }

    // Load live customer profile and addresses directly from Zoho CRM Contacts
    const zohoData = await getCustomerProfileFromZoho(sessionUser.email);
    const contact = zohoData?.contact;

    const customerUser: CustomerUser = {
      id: contact?.id || sessionUser.id,
      name:
        contact?.Full_Name ||
        `${contact?.First_Name || ''} ${contact?.Last_Name || ''}`.trim() ||
        sessionUser.name,
      email: sessionUser.email,
      phone: contact?.Phone || contact?.Mobile,
      companyName: contact?.Account_Name?.name || sessionUser.companyName,
      role: 'customer',
    };

    const addresses: Address[] = zohoData?.addresses || [];

    return NextResponse.json({
      authenticated: true,
      user: customerUser,
      addresses,
    });
  } catch (err: any) {
    console.error('[Session API Error]:', err);
    return NextResponse.json(
      { authenticated: false, user: null, addresses: [], error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = getSessionFromRequest(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, companyName, gstin, billingAddress, shippingAddress } = body;

    const result = await syncCustomerToZohoContact({
      name: name || sessionUser.name,
      email: sessionUser.email,
      phone,
      companyName,
      gstin,
      billingAddress,
      shippingAddress,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update profile in Zoho CRM' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully in Zoho CRM',
    });
  } catch (err: any) {
    console.error('[Session Update API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

