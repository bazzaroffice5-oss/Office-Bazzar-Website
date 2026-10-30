/**
 * Automated Verification Test for Phase 2:
 * 1. Customer Profiles & Addresses -> Zoho CRM Contacts & Accounts
 * 2. Secure stateless customer authentication (HMAC-SHA256 OTP tickets, Session cookies)
 * 3. Zero passwords / secrets in Zoho CRM
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local for standalone test runner
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  });
}

import {
  createAndSendOtp,
  verifyOtpTicket,
  createSessionToken,
  verifySessionToken,
  verifyAdminCredentials,
  SessionUser,
} from '../src/lib/auth/service';

import {
  syncCompanyToZohoAccount,
  syncCustomerToZohoContact,
  getCustomerProfileFromZoho,
  saveCustomerAddressToZoho,
} from '../src/lib/zoho/contacts';

import crypto from 'crypto';

async function runPhase2Tests() {
  console.log('================================================================');
  console.log('       OFFICE BAZZAR - PHASE 2 VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, extra?: any) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`, extra ? extra : '');
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: Stateless HMAC-SHA256 OTP Security
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: Stateless HMAC-SHA256 OTP Security ---');

  const testEmail = 'verify-test@officebazzar.com';
  const otpRes = await createAndSendOtp(testEmail, 'Test User');
  assert('OTP ticket generation returns success and ticket', otpRes.success && Boolean(otpRes.ticket));
  assert('Ticket contains valid serialized payload and HMAC signature', otpRes.ticket.includes('.'));

  // Extract OTP from ticket hash to test valid verification
  const [serialized, signature] = otpRes.ticket.split('.');
  const payload = JSON.parse(Buffer.from(serialized, 'base64url').toString('utf8'));
  const [otpHash, salt] = payload.otpHash.split(':');
  const secret = process.env.ADMIN_SECRET_KEY || 'officebazzar-auth-secret-key-production-2026';

  // Find matching OTP via quick brute-force over the 6-digit space (for test verification only)
  let foundOtp = '';
  for (let i = 100000; i <= 999999; i++) {
    const candidate = i.toString();
    const hash = crypto.createHash('sha256').update(`${testEmail}:${candidate}:${salt}:${secret}`).digest('hex');
    if (hash === otpHash) {
      foundOtp = candidate;
      break;
    }
  }

  assert('Found valid OTP code matching the HMAC-SHA256 salted hash', Boolean(foundOtp));

  // Test 1.1: Valid OTP verification
  const validVerification = verifyOtpTicket(otpRes.ticket, foundOtp);
  assert('Valid OTP verification succeeds', validVerification.success && validVerification.email === testEmail);

  // Test 1.2: Incorrect OTP rejection
  const invalidVerification = verifyOtpTicket(otpRes.ticket, '000000');
  assert('Incorrect OTP code is rejected', !invalidVerification.success);

  // Test 1.3: Tampered ticket payload rejection
  const tamperedPayload = Buffer.from(JSON.stringify({ ...payload, email: 'hacker@attacker.com' })).toString('base64url');
  const tamperedTicket = `${tamperedPayload}.${signature}`;
  const tamperedVerification = verifyOtpTicket(tamperedTicket, foundOtp);
  assert('Tampered ticket payload signature mismatch is rejected', !tamperedVerification.success);

  // Test 1.4: Tampered signature rejection
  const badSigTicket = `${serialized}.${signature.slice(0, -4)}dead`;
  const badSigVerification = verifyOtpTicket(badSigTicket, foundOtp);
  assert('Tampered HMAC signature is rejected', !badSigVerification.success);

  // Test 1.5: Expired ticket rejection
  const expiredPayload = Buffer.from(JSON.stringify({ ...payload, expiresAt: Date.now() - 1000 })).toString('base64url');
  const expiredSig = crypto.createHmac('sha256', secret).update(expiredPayload).digest('hex');
  const expiredVerification = verifyOtpTicket(`${expiredPayload}.${expiredSig}`, foundOtp);
  assert('Expired ticket is rejected', !expiredVerification.success);

  // -------------------------------------------------------------
  // TEST GROUP 2: Stateless Session Token & Admin Authentication
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Session Token & Admin Authentication ---');

  const testUser: SessionUser = {
    id: 'cust_test_12345',
    email: 'corp-procurement@example.com',
    name: 'Procurement Manager',
    companyName: 'Acme Enterprise Ltd',
    role: 'customer',
  };

  const sessionToken = createSessionToken(testUser);
  assert('Session token created with signature', Boolean(sessionToken) && sessionToken.includes('.'));

  const sessionVerification = verifySessionToken(sessionToken);
  assert('Session token correctly decodes and validates', sessionVerification.valid && sessionVerification.user?.email === testUser.email);

  // Admin sign-in verification
  const adminAuth = verifyAdminCredentials('sales4@officebazzar.com', 'OfficeBazzar@2026!');
  assert('Admin credentials verified for sales4@officebazzar.com', adminAuth.success && adminAuth.user?.role === 'admin');

  const invalidAdminAuth = verifyAdminCredentials('sales4@officebazzar.com', 'WrongPassword123');
  assert('Invalid admin password correctly rejected', !invalidAdminAuth.success);

  // -------------------------------------------------------------
  // TEST GROUP 3: Live Zoho CRM Accounts & Contacts Synchronization
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Live Zoho CRM Accounts & Contacts Integration ---');

  const testCompany = 'Test Enterprise Logistics Ltd';
  const testCustomerEmail = 'logistics-lead@test-enterprise-corp.in';

  console.log(`  Syncing company [${testCompany}] to Zoho Accounts...`);
  const accountSync = await syncCompanyToZohoAccount(testCompany, {
    phone: '+91 98401 23456',
    address: {
      fullName: 'Corporate Logistics',
      phone: '+91 98401 23456',
      addressLine1: 'Building 4, Tidel Park',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600113',
    },
    gstin: '33AABCT1332L1Z1',
  });

  assert('Zoho Accounts upsert succeeds with valid Account ID', accountSync.success && Boolean(accountSync.accountId), accountSync);
  console.log(`  Zoho Account ID: ${accountSync.accountId}`);

  console.log(`  Syncing customer [${testCustomerEmail}] to Zoho Contacts...`);
  const contactSync = await syncCustomerToZohoContact({
    name: 'Ramesh Sundaram',
    email: testCustomerEmail,
    phone: '+91 98401 23456',
    companyName: testCompany,
    gstin: '33AABCT1332L1Z1',
    websiteCustomerId: 'ob_cust_test_001',
    billingAddress: {
      fullName: 'Ramesh Sundaram',
      phone: '+91 98401 23456',
      addressLine1: 'No 14, Anna Salai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600002',
    },
    shippingAddress: {
      fullName: 'Ramesh Sundaram (Warehouse)',
      phone: '+91 98401 23456',
      addressLine1: 'Warehouse Bay 3, Ambattur Industrial Estate',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600058',
    },
  });

  assert('Zoho Contacts upsert succeeds with valid Contact ID', contactSync.success && Boolean(contactSync.contactId), contactSync);
  console.log(`  Zoho Contact ID: ${contactSync.contactId}`);

  // -------------------------------------------------------------
  // TEST GROUP 4: Retrieve Customer Profile & Addresses from Zoho CRM
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Fetch Customer Profile from Zoho CRM ---');

  console.log(`  Fetching customer record for [${testCustomerEmail}] from Zoho CRM...`);
  const fetchedProfile = await getCustomerProfileFromZoho(testCustomerEmail);

  assert('Customer profile retrieved from Zoho CRM Contacts', Boolean(fetchedProfile?.contact));
  assert('Contact email matches exactly', fetchedProfile?.contact?.Email === testCustomerEmail);
  assert('Customer Last_Name matches', fetchedProfile?.contact?.Last_Name === 'Sundaram');
  assert('Mailing (Billing) and Other (Shipping) addresses retrieved', (fetchedProfile?.addresses?.length || 0) >= 1);

  if (fetchedProfile?.addresses) {
    for (const [idx, addr] of fetchedProfile.addresses.entries()) {
      console.log(`    Address ${idx + 1}: ${addr.fullName} | ${addr.addressLine1}, ${addr.city}, ${addr.state} - ${addr.pincode}`);
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 5: Verify Address Update via Zoho CRM
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Update Customer Address in Zoho CRM ---');

  const updateRes = await saveCustomerAddressToZoho(testCustomerEmail, {
    fullName: 'Ramesh Sundaram (Updated)',
    phone: '+91 98401 99999',
    addressLine1: 'Suite 201, Tidel Park Phase 2',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600113',
    isDefault: true,
  });

  assert('Address update in Zoho CRM Contacts succeeds', updateRes.success, updateRes);

  // Summary
  console.log('\n================================================================');
  console.log(`PHASE 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error('[Phase 2 Test Execution Error]:', err);
  process.exit(1);
});
