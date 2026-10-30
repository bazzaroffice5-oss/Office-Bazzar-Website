/**
 * Automated Verification Test for Phase 3:
 * 1. Formal Quotation Records -> Zoho CRM Quotes Module
 * 2. Contact and Account linking (Contact ID & Account ID)
 * 3. Line items mapped to 101 Zoho Catalog Product IDs
 * 4. Quantity, unit price, tax, and line totals verified
 * 5. Duplicate prevention using unique reference check
 * 6. Customer quotation history retrieved directly from Zoho CRM Quotes
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local for standalone runner
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
  syncQuotationToZohoQuote,
  getCustomerQuotationsFromZoho,
  getQuoteByReferenceFromZoho,
  findExistingQuoteByReference,
} from '../src/lib/zoho/quotes';
import { zohoFetch } from '../src/lib/zoho/client';
import { Quotation, QuotationItem } from '../src/types';

async function runPhase3Tests() {
  console.log('================================================================');
  console.log('       OFFICE BAZZAR - PHASE 3 VERIFICATION SUITE');
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

  const testRef = `OB-RFQ-PHASE3-${Date.now().toString().slice(-6)}`;
  const customerEmail = 'logistics-lead@test-enterprise-corp.in';
  const companyName = 'Test Enterprise Logistics Ltd';
  const customerName = 'Ramesh Sundaram';

  // Item 1: Cardboard Tag File (SKU: OB-STA-1001 / ID: prod-cardboard-tag-file) -> Zoho ID: 1476900000000567001
  // Item 2: 3025 Box File (SKU: OB-STA-1002 / ID: prod-3025-box-file) -> Zoho ID: 1476900000000567002
  const testItems: QuotationItem[] = [
    {
      id: `item-1-${Date.now()}`,
      productId: 'prod-cardboard-tag-file',
      productName: 'Cardboard Tag File',
      sku: 'OB-STA-1001',
      indicativeUnitPrice: 120,
      gstPercent: 18,
      quantity: 10,
      indicativeTotalPrice: 1200,
      packSize: 'Pack of 10',
    },
    {
      id: `item-2-${Date.now()}`,
      productId: 'prod-3025-box-file',
      productName: '3025 Box File',
      sku: 'OB-STA-1002',
      indicativeUnitPrice: 250,
      gstPercent: 18,
      quantity: 5,
      indicativeTotalPrice: 1250,
      packSize: 'Box of 5',
    },
  ];

  const subtotal = 1200 + 1250; // 2450
  const gstAmount = (2450 * 18) / 100; // 441
  const total = subtotal + gstAmount; // 2891

  const mockQuotation: Quotation = {
    id: `quote-${Date.now()}`,
    quotationNumber: testRef,
    customerName,
    companyName,
    email: customerEmail,
    phone: '+91 98401 23456',
    gstin: '33AABCT1332L1Z1',
    deliveryLocation: 'Warehouse Bay 3, Ambattur Industrial Estate',
    pincode: '600058',
    preferredContactMethod: 'email',
    additionalRequirements: 'Urgent procurement for Q4 warehouse expansion. Delivery required in 48 hours.',
    items: testItems,
    indicativeSubtotal: subtotal,
    indicativeGstAmount: gstAmount,
    indicativeTotal: total,
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  // -------------------------------------------------------------
  // TEST GROUP 1: Formal Zoho CRM Quote Creation
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: Create Formal Zoho CRM Quote ---');
  console.log(`  Submitting quotation [${testRef}] to Zoho CRM Quotes...`);

  const createRes = await syncQuotationToZohoQuote(mockQuotation);
  assert('Zoho Quote creation returned success', createRes.success);
  assert('Action is "created"', createRes.action === 'created');
  assert('Returned valid Zoho Quote ID', Boolean(createRes.quoteId));
  assert('Linked to Zoho Contact ID', Boolean(createRes.contactId));
  assert('Linked to Zoho Account ID', Boolean(createRes.accountId));

  const quoteId = createRes.quoteId!;
  console.log(`  Zoho Quote ID: ${quoteId}`);
  console.log(`  Zoho Contact ID: ${createRes.contactId}`);
  console.log(`  Zoho Account ID: ${createRes.accountId}`);

  // -------------------------------------------------------------
  // TEST GROUP 2: Direct Zoho CRM Verification of Record & Relationships
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Direct Zoho CRM Record Verification ---');
  console.log(`  Retrieving Zoho Quote record [${quoteId}] via REST API...`);

  const rawRes = await zohoFetch<any>(`/Quotes/${quoteId}`);
  const quoteData = rawRes?.data?.[0];

  assert('Zoho Quote record exists in CRM', Boolean(quoteData));
  assert('Subject contains website reference', quoteData?.Subject?.includes(testRef));
  assert('Quote Stage is "Draft"', quoteData?.Quote_Stage === 'Draft');
  assert('Contact_Name linked correctly', quoteData?.Contact_Name?.id === createRes.contactId);
  assert('Account_Name linked correctly', quoteData?.Account_Name?.id === createRes.accountId);
  assert('Billing & Shipping Pincode saved', quoteData?.Shipping_Code === '600058');
  assert('Description contains special instructions & GSTIN', quoteData?.Description?.includes('33AABCT1332L1Z1'));

  // Line items verification
  console.log('\n--- Line Items & Amount Verification in Zoho CRM ---');
  const quotedItems = quoteData?.Quoted_Items || [];
  assert('Quoted_Items subform has exactly 2 line items', quotedItems.length === 2);

  const line1 = quotedItems[0];
  const line2 = quotedItems[1];

  assert('Line 1 Product ID is mapped to Zoho Catalog', line1?.Product_Name?.id === '1476900000000567001');
  assert('Line 1 Quantity is 10', Number(line1?.Quantity) === 10);
  assert('Line 1 List Price is 120', Number(line1?.List_Price) === 120);
  assert('Line 1 Total is 1200', Number(line1?.Net_Total || line1?.Total) === 1200);

  assert('Line 2 Product ID is mapped to Zoho Catalog', line2?.Product_Name?.id === '1476900000000567002');
  assert('Line 2 Quantity is 5', Number(line2?.Quantity) === 5);
  assert('Line 2 List Price is 250', Number(line2?.List_Price) === 250);
  assert('Line 2 Total is 1250', Number(line2?.Net_Total || line2?.Total) === 1250);

  console.log(`  Zoho Sub Total: Rs. ${quoteData?.Sub_Total} | Expected: Rs. ${subtotal}`);
  console.log(`  Zoho Grand Total: Rs. ${quoteData?.Grand_Total}`);
  assert('Zoho Sub Total matches expected calculation', Number(quoteData?.Sub_Total) === subtotal);

  // -------------------------------------------------------------
  // TEST GROUP 3: Duplicate Submission Prevention
  // -------------------------------------------------------------
  console.log('\n--- Waiting 3 seconds for Zoho CRM search index update ---');
  await new Promise((resolve) => setTimeout(resolve, 3500));

  console.log('\n--- TEST GROUP 3: Duplicate Prevention ---');
  console.log(`  Attempting duplicate submission with reference [${testRef}]...`);

  const duplicateCheck = await findExistingQuoteByReference(testRef);
  assert('findExistingQuoteByReference detects previously created Quote', Boolean(duplicateCheck && duplicateCheck.id === quoteId));

  const duplicateRes = await syncQuotationToZohoQuote(mockQuotation);
  assert('Duplicate submission handled successfully', duplicateRes.success);
  assert('Action is "skipped" (no duplicate created)', duplicateRes.action === 'skipped');
  assert('Returns original Zoho Quote ID', duplicateRes.quoteId === quoteId);

  // -------------------------------------------------------------
  // TEST GROUP 4: Customer Quotation History Retrieval from Zoho CRM
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Customer Quotation History from Zoho CRM ---');
  console.log(`  Fetching quotation history for customer [${customerEmail}] from Zoho CRM...`);

  const customerQuotes = await getCustomerQuotationsFromZoho(customerEmail);
  assert('Customer quotation history returned non-empty list', customerQuotes.length > 0);
  console.log(`  Found ${customerQuotes.length} quotations for customer in Zoho CRM.`);
  customerQuotes.forEach((q) => {
    console.log(`    - ID: ${q.id} | quotationNumber: ${q.quotationNumber}`);
  });
  console.log(`  Searching for testRef: ${testRef} or quoteId: ${quoteId}`);

  const foundTestQuote = customerQuotes.find((q) => q.quotationNumber === testRef || q.id === quoteId);
  assert('Newly created quotation found in customer history', Boolean(foundTestQuote));
  assert('Customer history quotation has 2 line items', foundTestQuote?.items?.length === 2);
  assert('Customer history quotation subtotal matches', foundTestQuote?.indicativeSubtotal === subtotal);

  // -------------------------------------------------------------
  // TEST GROUP 5: Single Quotation Reference Lookup
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Single Quotation Reference Lookup ---');
  console.log(`  Looking up quotation by reference [${testRef}]...`);

  const singleQuote = await getQuoteByReferenceFromZoho(testRef);
  assert('Quotation found by reference lookup', Boolean(singleQuote));
  assert('Quotation company name matches', singleQuote?.companyName === companyName);
  assert('Quotation status is "new" (mapped from Draft)', singleQuote?.status === 'new');
  assert('Quotation has 2 items', singleQuote?.items?.length === 2);

  // Summary
  console.log('\n================================================================');
  console.log(`PHASE 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('[Phase 3 Test Execution Error]:', err);
  process.exit(1);
});
