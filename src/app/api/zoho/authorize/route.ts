import { NextResponse } from 'next/server';
import { buildZohoAuthorizationUrl } from '@/lib/zoho/client';

export const dynamic = 'force-dynamic';

/**
 * Initiates the Zoho OAuth 2.0 authorization flow for the existing
 * Office Bazzar Website Integration application with:
 * - scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.send_mail.all.CREATE
 * - access_type=offline
 * - prompt=consent
 */
export async function GET(req: Request) {
  try {
    const clientId = process.env.ZOHO_CLIENT_ID?.trim();
    if (!clientId) {
      return NextResponse.json(
        { error: 'Zoho CRM credentials (ZOHO_CLIENT_ID) not configured in environment variables.' },
        { status: 503 }
      );
    }

    const host = req.headers.get('host') || '';
    let redirectUri: string | undefined = undefined;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      redirectUri = `http://${host}/api/zoho/callback`;
    }

    const authUrl = buildZohoAuthorizationUrl(redirectUri);
    return NextResponse.redirect(authUrl, { status: 302 });
  } catch (error) {
    console.error('[Zoho Authorize] Error creating authorization URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initialize Zoho authorization' },
      { status: 500 }
    );
  }
}

