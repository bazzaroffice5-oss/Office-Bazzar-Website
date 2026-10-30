import { NextResponse } from 'next/server';
import { exchangeAuthorizationCode } from '@/lib/zoho/client';

export const dynamic = 'force-dynamic';

function renderHtmlResponse(
  status: 'success' | 'error',
  title: string,
  message: string,
  httpStatus: number = 200
): Response {
  const isSuccess = status === 'success';
  const iconColor = isSuccess ? '#059669' : '#dc2626';
  const iconBg = isSuccess ? '#ecfdf5' : '#fef2f2';
  const iconSvg = isSuccess
    ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'
    : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Office Bazzar</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
    }
    .card {
      background: #ffffff;
      max-width: 500px;
      width: 100%;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      border: 1px solid #e2e8f0;
      padding: 40px 32px;
      text-align: center;
    }
    .icon {
      width: 60px;
      height: 60px;
      margin: 0 auto 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${iconBg};
      color: ${iconColor};
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 12px;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 28px;
    }
    .btn {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.2s ease, transform 0.1s ease;
    }
    .btn:hover {
      background: #0369a1;
    }
    .btn:active {
      transform: scale(0.98);
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      ${iconSvg}
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/" class="btn">Return to Office Bazzar</a>
    <div class="footer">
      Officebazzar E-Store Private Limited &bull; Secure Backend Integration
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: httpStatus,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}

function resolveRedirectUri(req: Request): string {
  // If explicitly configured in environment, prefer it
  if (process.env.ZOHO_REDIRECT_URI?.trim()) {
    return process.env.ZOHO_REDIRECT_URI.trim();
  }

  // Registered production redirect URI
  const defaultProductionUri = 'https://officebazzar.com/api/zoho/callback';

  const host = req.headers.get('host') || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const proto = host.includes('localhost') ? 'http' : 'http';
    return `${proto}://${host}/api/zoho/callback`;
  }

  return defaultProductionUri;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const accountsServer = searchParams.get('accounts-server');
    const acceptsJson = req.headers.get('accept')?.includes('application/json');

    // 1. Handle user cancellation or Zoho OAuth errors
    if (error) {
      console.warn(`[Zoho OAuth Callback] Error reported by Zoho: ${error}`);
      if (acceptsJson) {
        return NextResponse.json(
          { success: false, error: 'The authorization request was cancelled or encountered an error.' },
          { status: 400 }
        );
      }
      return renderHtmlResponse(
        'error',
        'Zoho Authorization Cancelled',
        'The Zoho CRM authorization request was cancelled or denied. Please retry authorization from the Zoho API Console if this was unexpected.',
        400
      );
    }

    // 2. Validate authorization code
    if (!code || !code.trim()) {
      console.warn('[Zoho OAuth Callback] Callback invoked without authorization code.');
      if (acceptsJson) {
        return NextResponse.json(
          { success: false, error: 'Missing authorization code in request.' },
          { status: 400 }
        );
      }
      return renderHtmlResponse(
        'error',
        'Authorization Code Missing',
        'No authorization grant code was provided in the callback. Please initiate authorization from your Zoho Developer Console.',
        400
      );
    }

    // 3. Resolve registered redirect URI
    const redirectUri = resolveRedirectUri(req);

    // 4. Server-side token exchange
    const exchangeResult = await exchangeAuthorizationCode(
      code,
      redirectUri,
      accountsServer || undefined
    );

    if (!exchangeResult.success) {
      console.error('[Zoho OAuth Callback] Exchange failed:', exchangeResult.error);
      if (acceptsJson) {
        return NextResponse.json(
          { success: false, error: 'Token exchange failed. Check server logs for details.' },
          { status: 502 }
        );
      }
      return renderHtmlResponse(
        'error',
        'Zoho Authorization Failed',
        'We were unable to exchange the authorization code with Zoho CRM. Please verify that your Client ID, Client Secret, and Registered Redirect URI match the Zoho API Console settings.',
        502
      );
    }

    // 5. Successful authorization
    console.log('[Zoho OAuth Callback] Authorization code successfully exchanged for tokens.');

    if (acceptsJson) {
      return NextResponse.json(
        {
          success: true,
          message: 'Zoho CRM authorization successfully completed and verified.',
        },
        { status: 200 }
      );
    }

    return renderHtmlResponse(
      'success',
      'Zoho CRM Authorization Successful',
      'Office Bazzar has been successfully connected with Zoho CRM. The authorization grant has been securely exchanged and synchronized with the backend.',
      200
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Zoho OAuth Callback] Unexpected handler exception:', errorMsg);

    if (req.headers.get('accept')?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Internal server error processing Zoho authorization callback.' },
        { status: 500 }
      );
    }

    return renderHtmlResponse(
      'error',
      'Authorization Error',
      'An unexpected error occurred while processing the Zoho CRM authorization. Please check server logs and try again.',
      500
    );
  }
}

export async function POST(req: Request) {
  // Delegate POST to same handler logic in case token/code is forwarded as form-data
  return GET(req);
}

