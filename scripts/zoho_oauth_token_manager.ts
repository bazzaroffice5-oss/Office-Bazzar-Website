/**
 * Secure Local Zoho OAuth Token Manager & Admin Notification Retry Verifier
 *
 * Security Guarantees:
 * - NEVER prints Client Secret, authorization code, access token, or refresh token to stdout/logs.
 * - Uses SHA-256 10-char fingerprints solely to confirm token identity changes.
 * - Synchronizes the AES-256-GCM Encrypted Persistent Vault (`zoho-oauth-vault`) with local `.env.local`.
 * - Verifies `ZohoCRM.send_mail.all.CREATE` scope and retries `sales4@officebazzar.com` and
 *   `marketing@officebazzar.com` on existing Quote ID `1476900000000578010` without creating duplicates.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  clearZohoTokenCache,
  getZohoAccessToken,
  exchangeAuthorizationCode,
  ZOHO_REQUIRED_SCOPES,
} from '../src/lib/zoho/client';
import {
  readEncryptedVaultPayload,
  persistZohoRefreshToken,
  getZohoTokenStoreStatus,
} from '../src/lib/zoho/token-store';
import { getQuoteByReferenceFromZoho } from '../src/lib/zoho/quotes';
import { sendAdminQuotationEmail, clearSentQuoteEmailKeys } from '../src/lib/notifications/service';

function fingerprint(secret?: string | null): string {
  if (!secret) return 'none';
  return `sha256:${crypto.createHash('sha256').update(secret.trim()).digest('hex').slice(0, 10)}`;
}

function updateLocalEnvFile(newRefreshToken: string): boolean {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return false;

  const content = fs.readFileSync(envPath, 'utf8');
  const updated = content.match(/^ZOHO_REFRESH_TOKEN=/m)
    ? content.replace(/^ZOHO_REFRESH_TOKEN=.*$/m, `ZOHO_REFRESH_TOKEN=${newRefreshToken.trim()}`)
    : `${content.trimEnd()}\nZOHO_REFRESH_TOKEN=${newRefreshToken.trim()}\n`;

  fs.writeFileSync(envPath, updated, 'utf8');
  fs.writeFileSync(
    path.join(process.cwd(), '.zoho_vercel_refresh_token.txt'),
    newRefreshToken.trim(),
    'utf8'
  );
  process.env.ZOHO_REFRESH_TOKEN = newRefreshToken.trim();
  return true;
}

async function main() {
  console.log('=== OFFICE BAZZAR SECURE ZOHO OAUTH TOKEN MANAGER ===\n');

  // 1. Check if a local grant code file (.zoho_grant_code.txt) was provided for local exchange
  const grantFilePath = path.join(process.cwd(), '.zoho_grant_code.txt');
  if (fs.existsSync(grantFilePath)) {
    const rawCode = fs.readFileSync(grantFilePath, 'utf8').trim();
    fs.unlinkSync(grantFilePath);
    if (rawCode) {
      console.log('Found local .zoho_grant_code.txt — exchanging authorization code with Zoho...');
      const redirectUri =
        process.env.ZOHO_REDIRECT_URI?.trim() || 'https://officebazzar.com/api/zoho/callback';
      const exRes = await exchangeAuthorizationCode(rawCode, redirectUri);
      console.log('Exchange Result:', {
        success: exRes.success,
        hasNewRefreshToken: exRes.hasNewRefreshToken,
        persistenceSource: exRes.persistenceSource,
        error: exRes.error,
      });
    }
  }

  // 2. Inspect Encrypted Persistent Vault vs Local .env.local
  const envToken = process.env.ZOHO_REFRESH_TOKEN?.trim() || null;
  const vaultPayload = await readEncryptedVaultPayload();

  console.log('Token Store Diagnostics (Safe Fingerprints Only):');
  console.log(` - Local .env.local Fingerprint : ${fingerprint(envToken)}`);
  console.log(
    ` - Encrypted Vault Fingerprint  : ${fingerprint(vaultPayload?.refreshToken)} (Updated: ${
      vaultPayload?.updatedAt || 'never'
    })`
  );
  console.log(` - Required OAuth Scopes        : ${ZOHO_REQUIRED_SCOPES}`);
  console.log(` - Production Authorize URL     : https://officebazzar.com/api/zoho/authorize`);

  if (vaultPayload?.refreshToken && vaultPayload.refreshToken !== envToken) {
    console.log(
      '\n[Sync] Newer refresh token detected in AES-256-GCM Encrypted Vault! Syncing to .env.local...'
    );
    updateLocalEnvFile(vaultPayload.refreshToken);
    clearZohoTokenCache();
    console.log(`[Sync] .env.local updated to match vault (${fingerprint(vaultPayload.refreshToken)}).`);
  } else if (!vaultPayload?.refreshToken && envToken) {
    console.log(
      '\n[Init] Seeding AES-256-GCM Encrypted Persistent Vault (`ob_oauth_vault`) with current token...'
    );
    const seedRes = await persistZohoRefreshToken(envToken, { source: 'initial_seed' });
    console.log('[Init] Vault Seed Result:', seedRes);
  }

  const storeStatus = await getZohoTokenStoreStatus();
  console.log('\nActive Token Store Status:', storeStatus);

  // 3. Test Existing Quote ID 1476900000000578010 with Zoho CRM Send Mail API
  const existingQuoteId = '1476900000000578010';
  console.log(
    `\n--- Verifying Zoho CRM Send Mail API on Existing Quote ID ${existingQuoteId} ---`
  );

  clearSentQuoteEmailKeys();

  const token = await getZohoAccessToken();
  console.log(`Fresh Access Token Acquired: ${token ? 'Yes' : 'No'}`);

  const quote = await getQuoteByReferenceFromZoho(existingQuoteId);
  if (!quote) {
    throw new Error(`Existing Quote ${existingQuoteId} not found in Zoho CRM.`);
  }
  quote.email = quote.email || 'vikram.audit.test@officebazzar.com';
  quote.phone = quote.phone || '9840123456';

  console.log(
    `Loaded Existing Quote: ${quote.quotationNumber} (Quote ID: ${quote.id}, Items: ${quote.items.length})`
  );

  // Retry ADMIN 1 (sales4@officebazzar.com) independently
  console.log('\nRetrying ADMIN 1 (sales4@officebazzar.com)...');
  const admin1Res = await sendAdminQuotationEmail(
    quote,
    'sales4@officebazzar.com',
    'marketing@officebazzar.com',
    'ADMIN 1 (Sales)',
    { zohoQuoteId: existingQuoteId }
  );
  console.log('ADMIN 1 API Response:', JSON.stringify(admin1Res, null, 2));

  // Retry ADMIN 2 (marketing@officebazzar.com) independently
  console.log('\nRetrying ADMIN 2 (marketing@officebazzar.com)...');
  const admin2Res = await sendAdminQuotationEmail(
    quote,
    'marketing@officebazzar.com',
    'sales4@officebazzar.com',
    'ADMIN 2 (Marketing)',
    { zohoQuoteId: existingQuoteId }
  );
  console.log('ADMIN 2 API Response:', JSON.stringify(admin2Res, null, 2));
}

main().catch((err) => {
  console.error('Manager Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
