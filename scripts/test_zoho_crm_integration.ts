/**
 * Office Bazzar — Zoho CRM Server-Side Integration Test Suite
 *
 * Verifies:
 * 1. OAuth 2.0 configuration diagnostics & domain resolution.
 * 2. Name parsing (strict Zoho Last_Name requirement).
 * 3. Graceful fallback when Zoho credentials are not configured.
 * 4. End-to-end quotation syncing logic & Quotes module skip condition.
 * 5. Contact enquiry syncing logic & description manifest.
 * 6. Mocked OAuth 2.0 token caching and authenticated request dispatch.
 */

import {
  isZohoConfigured,
  getZohoConfigDiagnostics,
  getZohoAccountsUrl,
  getZohoApiDomain,
  clearZohoTokenCache,
  exchangeAuthorizationCode,
  getZohoAccessToken,
} from '../src/lib/zoho/client';
import {
  persistZohoRefreshToken,
  getPersistedZohoRefreshToken,
  clearTokenStoreCache,
} from '../src/lib/zoho/token-store';
import { GET as zohoCallbackHandler } from '../src/app/api/zoho/callback/route';
import {
  parseCustomerName,
  syncContactEnquiryToZoho,
  syncQuotationToZoho,
  ContactEnquiryPayload,
} from '../src/lib/zoho/crm';
import { Quotation } from '../src/types';

interface TestResult {
  title: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, title: string, message: string) {
  results.push({ title, passed: condition, message });
  const icon = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} | ${title}\n   └─ ${message}\n`);
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('OFFICE BAZZAR — ZOHO CRM INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // TEST 1: Environment Diagnostics & Defaults
  // ---------------------------------------------------------------------------
  try {
    const diag = await getZohoConfigDiagnostics();
    const accountsUrl = getZohoAccountsUrl();
    const apiDomain = getZohoApiDomain();

    assert(
      accountsUrl === 'https://accounts.zoho.in' || accountsUrl === 'https://accounts.zoho.com',
      'Zoho Accounts URL Resolution',
      `Resolved to ${accountsUrl}`
    );

    assert(
      apiDomain === 'https://www.zohoapis.in' || apiDomain === 'https://www.zohoapis.com',
      'Zoho API Domain Resolution',
      `Resolved to ${apiDomain}`
    );

    assert(
      typeof diag.isConfigured === 'boolean',
      'Zoho Diagnostics Status',
      `isConfigured: ${diag.isConfigured}, hasClientId: ${diag.hasClientId}`
    );
  } catch (err) {
    assert(false, 'Environment Diagnostics & Defaults', String(err));
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Customer Name Parsing (Strict Zoho Last_Name Requirement)
  // ---------------------------------------------------------------------------
  try {
    const twoWords = parseCustomerName('Ajith Kumar');
    assert(
      twoWords.firstName === 'Ajith' && twoWords.lastName === 'Kumar',
      'Name Parsing: Two Words',
      `"Ajith Kumar" -> First: "${twoWords.firstName}", Last: "${twoWords.lastName}"`
    );

    const singleWord = parseCustomerName('Pachamuthu');
    assert(
      singleWord.firstName === '' && singleWord.lastName === 'Pachamuthu',
      'Name Parsing: Single Word (Mandatory Last_Name)',
      `"Pachamuthu" -> First: "${singleWord.firstName}", Last: "${singleWord.lastName}"`
    );

    const multiWord = parseCustomerName('Ajith P Dhedhi');
    assert(
      multiWord.firstName === 'Ajith P' && multiWord.lastName === 'Dhedhi',
      'Name Parsing: Multi-word Enterprise Name',
      `"Ajith P Dhedhi" -> First: "${multiWord.firstName}", Last: "${multiWord.lastName}"`
    );

    const emptyName = parseCustomerName('   ');
    assert(
      emptyName.lastName === 'Valued Customer',
      'Name Parsing: Empty Fallback',
      `Fallback applied: "${emptyName.lastName}"`
    );
  } catch (err) {
    assert(false, 'Customer Name Parsing', String(err));
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Graceful Unconfigured Sync (Non-blocking Website Safety)
  // ---------------------------------------------------------------------------
  try {
    // Ensure we test the unconfigured state safely
    const originalClientId = process.env.ZOHO_CLIENT_ID;
    delete process.env.ZOHO_CLIENT_ID;
    clearZohoTokenCache();

    const contactPayload: ContactEnquiryPayload = {
      referenceNumber: 'OB-CNT-TEST-001',
      name: 'Ramesh Corporate Procurement',
      companyName: 'Infosys BPM Chennai',
      email: 'procurement@infosys.com',
      phone: '9840123456',
      message: 'Need monthly contract for JK Copier A4 paper and Diversey Taski R1/R2 chemicals.',
      submittedAt: '30/10/2026, 11:30:00 AM IST',
    };

    const contactResult = await syncContactEnquiryToZoho(contactPayload);
    assert(
      contactResult.success === false && contactResult.action === 'skipped',
      'Contact Sync: Safe Skip When Unconfigured',
      `Skipped gracefully: ${contactResult.reason}`
    );

    const mockQuotation: Quotation = {
      id: 'quote-test-123',
      quotationNumber: 'OB-RFQ-2026-00099',
      customerName: 'Ajith Kumar',
      companyName: 'Wipro Technologies',
      email: 'ajith@wipro.com',
      phone: '9840011223',
      gstin: '33AABCO1234F1Z5',
      pincode: '600014',
      deliveryLocation: 'Royapettah, Chennai',
      preferredContactMethod: 'email',
      additionalRequirements: 'Urgent delivery required within 24 hours.',
      indicativeSubtotal: 10500,
      indicativeGstAmount: 1890,
      indicativeTotal: 12390,
      status: 'new',
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 'item-1',
          productId: 'prod-jk-copier-75gsm',
          productName: 'JK Copier Paper 75 GSM A4',
          sku: 'JK-COP-75-A4',
          indicativeUnitPrice: 350,
          gstPercent: 18,
          quantity: 20,
          indicativeTotalPrice: 7000,
          packSize: 'Ream of 500 Sheets',
        },
        {
          id: 'item-2',
          productId: 'prod-taski-r2-cleaner',
          productName: 'Taski R2 All-Purpose Floor Cleaner 5L',
          sku: 'DIV-TASKI-R2-5L',
          indicativeUnitPrice: 1750,
          gstPercent: 18,
          quantity: 2,
          indicativeTotalPrice: 3500,
          packSize: '5 Litre Can',
        },
      ],
    };

    const quoteResult = await syncQuotationToZoho(mockQuotation);
    assert(
      quoteResult.success === false && quoteResult.action === 'skipped',
      'Quotation Sync: Safe Skip When Unconfigured',
      `Skipped gracefully: ${quoteResult.reason}`
    );

    // Restore env
    if (originalClientId) {
      process.env.ZOHO_CLIENT_ID = originalClientId;
    }
  } catch (err) {
    assert(false, 'Graceful Unconfigured Sync', String(err));
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Formal Zoho Quotes Skip Condition (Requirement 9)
  // ---------------------------------------------------------------------------
  try {
    // Simulate configured environment with mock fetch to test mapping logic
    const origFetch = global.fetch;
    const interceptedCalls: { url: string; method?: string; body?: string }[] = [];

    // Mock fetch for Zoho OAuth token and Lead creation
    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      interceptedCalls.push({ url, method: init?.method, body: init?.body ? String(init.body) : undefined });

      if (url.includes('/oauth/v2/token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'mock_zoho_access_token_xyz_123',
            expires_in: 3600,
            token_type: 'Bearer',
          }),
        } as Response;
      }

      if (url.includes('/crm/v6/Contacts')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              data: [
                {
                  code: 'SUCCESS',
                  status: 'success',
                  message: 'contact created',
                  details: { id: 'zoho_contact_9876543210' },
                },
              ],
            }),
        } as Response;
      }

      if (url.includes('/crm/v6/Accounts')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              data: [
                {
                  code: 'SUCCESS',
                  status: 'success',
                  message: 'account created',
                  details: { id: 'zoho_account_9876543210' },
                },
              ],
            }),
        } as Response;
      }

      if (url.includes('/crm/v6/Leads')) {
        return {
          ok: true,
          status: 201,
          text: async () =>
            JSON.stringify({
              data: [
                {
                  code: 'SUCCESS',
                  status: 'success',
                  message: 'lead created',
                  details: { id: 'zoho_lead_9876543210' },
                },
              ],
            }),
        } as Response;
      }

      if (url.includes('/crm/v6/Quotes')) {
        return {
          ok: true,
          status: 201,
          text: async () =>
            JSON.stringify({
              data: [
                {
                  code: 'SUCCESS',
                  status: 'success',
                  message: 'quote created',
                  details: { id: 'zoho_quote_1122334455' },
                },
              ],
            }),
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: 'unhandled mock' }),
      } as Response;
    }) as typeof fetch;

    process.env.ZOHO_CLIENT_ID = 'mock_client_id';
    process.env.ZOHO_CLIENT_SECRET = 'mock_client_secret';
    process.env.ZOHO_REFRESH_TOKEN = 'mock_refresh_token';
    clearZohoTokenCache();

    const mockQuotation: Quotation = {
      id: 'quote-test-456',
      quotationNumber: 'OB-RFQ-2026-00100',
      customerName: 'Pachamuthu S',
      companyName: 'Office Bazzar Enterprise',
      email: 'pacha@officebazzar.com',
      phone: '7200800040',
      pincode: '600014',
      deliveryLocation: 'Royapettah, Chennai',
      preferredContactMethod: 'email',
      indicativeSubtotal: 5000,
      indicativeGstAmount: 900,
      indicativeTotal: 5900,
      status: 'new',
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 'item-1',
          productId: 'prod-copier',
          productName: 'Copier Paper',
          sku: 'COP-A4',
          indicativeUnitPrice: 500,
          gstPercent: 18,
          quantity: 10,
          indicativeTotalPrice: 5000,
        },
      ],
    };

    // Formal Quote Creation with line items and contact linking
    const resultSync = await syncQuotationToZoho(mockQuotation);
    assert(
      resultSync.success === true &&
        resultSync.quoteId === 'zoho_quote_1122334455',
      'Phase 3: Formal Zoho Quote Created for RFQ',
      `Quote ID: ${resultSync.quoteId}`
    );

    // Restore original fetch and clean test env
    global.fetch = origFetch;
    delete process.env.ZOHO_CLIENT_ID;
    delete process.env.ZOHO_CLIENT_SECRET;
    delete process.env.ZOHO_REFRESH_TOKEN;
    clearZohoTokenCache();
  } catch (err) {
    assert(false, 'Formal Zoho Quotes Skip Condition', String(err));
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Zoho OAuth Callback Route & Code Exchange (/api/zoho/callback)
  // ---------------------------------------------------------------------------
  try {
    // 5A: Missing Code / Error Handling
    const errorReq = new Request('https://officebazzar.com/api/zoho/callback?error=access_denied');
    const errorRes = await zohoCallbackHandler(errorReq);
    const errorHtml = await errorRes.text();
    assert(
      errorRes.status === 400 && errorHtml.includes('Zoho Authorization Cancelled'),
      'Callback Route: User Cancellation Handled',
      `HTTP ${errorRes.status} returned clean cancellation notice without leaks`
    );

    // 5B: No Code Provided
    const missingReq = new Request('https://officebazzar.com/api/zoho/callback');
    const missingRes = await zohoCallbackHandler(missingReq);
    const missingHtml = await missingRes.text();
    assert(
      missingRes.status === 400 && missingHtml.includes('Authorization Code Missing'),
      'Callback Route: Missing Code Handled',
      `HTTP ${missingRes.status} returned missing code notice`
    );

    // 5C: Successful Code Exchange (Mocked Token Exchange)
    const origFetch = global.fetch;
    global.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/oauth/v2/token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'secret_mock_access_token_123',
            refresh_token: 'secret_mock_refresh_token_456',
            api_domain: 'https://www.zohoapis.in',
            expires_in: 3600,
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    }) as typeof fetch;

    process.env.ZOHO_CLIENT_ID = 'mock_client_id';
    process.env.ZOHO_CLIENT_SECRET = 'mock_client_secret';

    // Test JSON Accept header
    const successJsonReq = new Request('https://officebazzar.com/api/zoho/callback?code=mock_grant_code_789', {
      headers: { accept: 'application/json' },
    });
    const successJsonRes = await zohoCallbackHandler(successJsonReq);
    const successJsonData = await successJsonRes.json();

    assert(
      successJsonRes.status === 200 &&
        successJsonData.success === true &&
        !('access_token' in successJsonData) &&
        !('refresh_token' in successJsonData),
      'Callback Route: JSON Success Without Exposing Tokens',
      `HTTP 200 returned clean JSON without secrets: ${JSON.stringify(successJsonData)}`
    );

    // Test HTML response
    const successHtmlReq = new Request('https://officebazzar.com/api/zoho/callback?code=mock_grant_code_789');
    const successHtmlRes = await zohoCallbackHandler(successHtmlReq);
    const successHtml = await successHtmlRes.text();

    assert(
      successHtmlRes.status === 200 &&
        successHtml.includes('Zoho CRM Authorization Successful') &&
        !successHtml.includes('secret_mock_access_token') &&
        !successHtml.includes('secret_mock_refresh_token'),
      'Callback Route: HTML Success Page Renders Without Leaking Credentials',
      `HTTP 200 rendered Office Bazzar branded success card with 0 token leaks`
    );

    global.fetch = origFetch;
    delete process.env.ZOHO_CLIENT_ID;
    delete process.env.ZOHO_CLIENT_SECRET;
  } catch (err) {
    assert(false, 'Zoho OAuth Callback Route & Code Exchange', String(err));
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Vercel Server-Side Persistent Refresh Token & Runtime Cache
  // ---------------------------------------------------------------------------
  try {
    process.env.ZOHO_REFRESH_TOKEN = 'zoho_persistent_refresh_xyz_888';

    // 6A: Cold Start Simulation (Memory Cleared)
    clearZohoTokenCache(); // Clears all runtime RAM

    // Retrieve from authoritative persistent environment variable (simulates fresh serverless container)
    const recoveredToken = await getPersistedZohoRefreshToken();
    assert(
      recoveredToken === 'zoho_persistent_refresh_xyz_888',
      'Token Store: Recovered Refresh Token on Cold Start',
      `Recovered token directly from persistent Vercel environment: ${Boolean(recoveredToken)}`
    );

    // 6B: Runtime Token Caching
    const persistRes = await persistZohoRefreshToken('zoho_runtime_override_999');
    assert(
      persistRes.success === true && persistRes.source === 'runtime_memory',
      'Token Store: Refresh Token Cached in Runtime Memory',
      `Persistence source: ${persistRes.source}`
    );

    const memoryToken = await getPersistedZohoRefreshToken();
    assert(
      memoryToken === 'zoho_runtime_override_999',
      'Token Store: In-Memory Fast Path Retrieval',
      `Retrieved cached runtime token: ${Boolean(memoryToken)}`
    );

    // 6C: Access Token Refresh and In-Memory Optimization
    let tokenFetchCount = 0;
    const origFetch = global.fetch;
    global.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/oauth/v2/token')) {
        tokenFetchCount++;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'fresh_access_token_cold_start',
            expires_in: 3600,
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    }) as typeof fetch;

    process.env.ZOHO_CLIENT_ID = 'mock_client_id';
    process.env.ZOHO_CLIENT_SECRET = 'mock_client_secret';
    process.env.ZOHO_REFRESH_TOKEN = 'zoho_persistent_refresh_xyz_888';

    clearZohoTokenCache();

    // First call (cold start) -> must fetch new access token using recovered refresh token
    const access1 = await getZohoAccessToken();
    assert(
      access1 === 'fresh_access_token_cold_start' && tokenFetchCount === 1,
      'Token Store: Generates Fresh Access Token After Cold Start',
      `Access token generated on demand via recovered refresh token (fetches: ${tokenFetchCount})`
    );

    // Second call -> must use cached access token (in-memory optimization)
    const access2 = await getZohoAccessToken();
    assert(
      access2 === 'fresh_access_token_cold_start' && tokenFetchCount === 1,
      'Token Store: Access Token Cached as Optimization (No Extra Fetch)',
      `Used cached access token without hitting Zoho refresh endpoint again (fetches: ${tokenFetchCount})`
    );

    global.fetch = origFetch;
    delete process.env.ZOHO_CLIENT_ID;
    delete process.env.ZOHO_CLIENT_SECRET;
    delete process.env.ZOHO_REFRESH_TOKEN;
    clearZohoTokenCache();
  } catch (err) {
    assert(false, 'Persistent Refresh Token Across Cold Starts', String(err));
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('================================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log('================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runTestSuite();
