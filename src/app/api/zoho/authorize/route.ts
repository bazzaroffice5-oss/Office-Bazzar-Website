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
  const host = req.headers.get('host') || '';
  let redirectUri: string | undefined = undefined;
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    redirectUri = `http://${host}/api/zoho/callback`;
  }

  const authUrl = buildZohoAuthorizationUrl(redirectUri);
  return NextResponse.redirect(authUrl, { status: 302 });
}

