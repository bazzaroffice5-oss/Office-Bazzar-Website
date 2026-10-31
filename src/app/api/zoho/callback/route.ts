import { NextResponse } from 'next/server';
import { exchangeAuthorizationCode, buildZohoAuthorizationUrl, ZOHO_REQUIRED_SCOPES } from '@/lib/zoho/client';
import { getZohoTokenStoreStatus } from '@/lib/zoho/token-store';

export const dynamic = 'force-dynamic';

function renderHtmlResponse(
  status: 'success' | 'error',
  title: string,
  message: string,
  httpStatus: number = 200,
  actionUrl: string = '/',
  actionLabel: string = 'Return to Office Bazzar'
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
      max-width: 520px;
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
    <a href="${actionUrl}" class="btn">${actionLabel}</a>
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
  if (process.env.ZOHO_REDIRECT_URI?.trim()) {
    return process.env.ZOHO_REDIRECT_URI.trim();
  }

  const defaultProductionUri = 'https://officebazzar.com/api/zoho/callback';
  const host = req.headers.get('host') || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `http://${host}/api/zoho/callback`;
  }

  return defaultProductionUri;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const accountsServer = searchParams.get('accounts-server');
    const acceptsJson = req.headers.get('accept')?.includes('application/json');

    // Safe diagnostic status check (never exposes secret values)
    if (action === 'status') {
      const storeStatus = await getZohoTokenStoreStatus();
      return NextResponse.json({
        success: true,
        activeSource: storeStatus.activeSource,
        vaultUpdatedAt: storeStatus.vaultUpdatedAt,
        tokenFingerprint: storeStatus.tokenFingerprint,
        requiredScopes: ZOHO_REQUIRED_SCOPES,
        authorizeEndpoint: 'https://officebazzar.com/api/zoho/authorize',
      });
    }

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
        'The Zoho CRM authorization request was cancelled or denied. Click below to retry authorization with the required scopes.',
        400,
        '/api/zoho/authorize',
        'Retry Zoho Authorization'
      );
    }

    if (!code || !code.trim()) {
      const redirectUri = resolveRedirectUri(req);
      const authUrl = buildZohoAuthorizationUrl(redirectUri);
      if (acceptsJson) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing authorization code in request.',
            authorizeEndpoint: '/api/zoho/authorize',
          },
          { status: 400 }
        );
      }
      return renderHtmlResponse(
        'error',
        'Authorization Code Missing',
        'No authorization grant code was provided in the callback. Click the button below to initiate Zoho OAuth authorization with offline access and consent.',
        400,
        authUrl,
        'Authorize Zoho CRM Now'
      );
    }

    const redirectUri = resolveRedirectUri(req);
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
        'We were unable to exchange the authorization code with Zoho CRM. Click below to initiate a fresh authorization grant.',
        502,
        '/api/zoho/authorize',
        'Retry Zoho Authorization'
      );
    }

    const storeStatus = await getZohoTokenStoreStatus();

    if (acceptsJson) {
      return NextResponse.json(
        {
          success: true,
          hasNewRefreshToken: exchangeResult.hasNewRefreshToken,
          persistenceSource: exchangeResult.persistenceSource,
          activeSource: storeStatus.activeSource,
          tokenFingerprint: storeStatus.tokenFingerprint,
          message: 'Zoho CRM authorization successfully completed and persisted in encrypted vault.',
        },
        { status: 200 }
      );
    }

    const statusDetail = exchangeResult.hasNewRefreshToken
      ? `A new offline refresh token was issued and securely persisted in the encrypted backend vault (${exchangeResult.persistenceSource}). All serverless containers are now synchronized.`
      : `Access token synchronized (${exchangeResult.persistenceSource}). Note: Zoho did not return a new refresh_token because prompt=consent was not set on the authorization request. Use /api/zoho/authorize to force a new offline refresh token.`;

    return renderHtmlResponse(
      'success',
      'Zoho CRM Authorization Successful',
      `Office Bazzar has been connected with Zoho CRM. ${statusDetail}`,
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
      'An unexpected error occurred while processing the Zoho CRM authorization. Please try again.',
      500,
      '/api/zoho/authorize',
      'Retry Zoho Authorization'
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
