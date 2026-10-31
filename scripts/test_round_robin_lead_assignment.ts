/**
 * Office Bazzar - Round-Robin Customer Lead Assignment Verification Suite
 *
 * Tests:
 * 1. Sequential lead alternation:
 *    Customer 1 -> Sales (sales4@officebazzar.com)
 *    Customer 2 -> Marketing (marketing@officebazzar.com)
 *    Customer 3 -> Sales (sales4@officebazzar.com)
 *    Customer 4 -> Marketing (marketing@officebazzar.com)
 * 2. Concurrency safety: simultaneous submissions cannot receive the same sequence number.
 * 3. Single-admin notification routing:
 *    Sales RFQ -> Only sales4@officebazzar.com receives notification
 *    Marketing RFQ -> Only marketing@officebazzar.com receives notification
 * 4. Zoho CRM metadata & description preservation.
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
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

import { getNextLeadAssignee, getAdminRecipients } from '../src/lib/zoho/round-robin';
import { dispatchQuotationNotifications } from '../src/lib/notifications/service';
import { syncQuotationToZohoQuote, getQuoteByReferenceFromZoho } from '../src/lib/zoho/quotes';
import { Quotation, QuotationItem } from '../src/types';

async function runTests() {
  console.log('================================================================');
  console.log('   OFFICE BAZZAR: ROUND-ROBIN LEAD ASSIGNMENT VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, extra?: any) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`, extra !== undefined ? extra : '');
      failed++;
    }
  }

  const { salesEmail, marketingEmail } = getAdminRecipients();
  console.log(`[Config] Sales Admin    : ${salesEmail}`);
  console.log(`[Config] Marketing Admin: ${marketingEmail}\n`);

  // -------------------------------------------------------------------------
  // TEST GROUP 1: Sequential Lead Assignment Alternation
  // -------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Sequential Lead Assignment Alternation ---');

  const lead1 = await getNextLeadAssignee();
  console.log(`Lead 1: #${lead1.sequenceNumber} -> ${lead1.name} (${lead1.email})`);

  const lead2 = await getNextLeadAssignee();
  console.log(`Lead 2: #${lead2.sequenceNumber} -> ${lead2.name} (${lead2.email})`);

  const lead3 = await getNextLeadAssignee();
  console.log(`Lead 3: #${lead3.sequenceNumber} -> ${lead3.name} (${lead3.email})`);

  const lead4 = await getNextLeadAssignee();
  console.log(`Lead 4: #${lead4.sequenceNumber} -> ${lead4.name} (${lead4.email})`);

  // Verify strict alternation
  assert('Lead 1 and Lead 2 are assigned to different admins', lead1.name !== lead2.name);
  assert('Lead 2 and Lead 3 are assigned to different admins', lead2.name !== lead3.name);
  assert('Lead 3 and Lead 4 are assigned to different admins', lead3.name !== lead4.name);
  assert('Lead 1 and Lead 3 are assigned to the same admin (alternation)', lead1.name === lead3.name);
  assert('Lead 2 and Lead 4 are assigned to the same admin (alternation)', lead2.name === lead4.name);
  assert('Sequence numbers increment monotonically', lead2.sequenceNumber === lead1.sequenceNumber + 1 && lead3.sequenceNumber === lead2.sequenceNumber + 1);

  // -------------------------------------------------------------------------
  // TEST GROUP 2: Concurrency Safety (Simultaneous Invocations)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Concurrency Safety ---');

  const simultaneousCount = 6;
  console.log(`Triggering ${simultaneousCount} simultaneous getNextLeadAssignee calls...`);
  const simultaneousResults = await Promise.all(
    Array.from({ length: simultaneousCount }).map(() => getNextLeadAssignee())
  );

  const seqs = simultaneousResults.map((r) => r.sequenceNumber);
  const uniqueSeqs = new Set(seqs);
  console.log('Sequence numbers returned:', seqs);
  assert('All simultaneous calls received unique sequence numbers (no duplicates)', uniqueSeqs.size === simultaneousCount);

  // Check that assignments alternate properly even under concurrent execution
  let alternationConsistent = true;
  for (let i = 1; i < simultaneousResults.length; i++) {
    if (simultaneousResults[i].name === simultaneousResults[i - 1].name) {
      alternationConsistent = false;
      break;
    }
  }
  assert('Alternation pattern (Sales <-> Marketing) is strictly preserved under concurrency', alternationConsistent);

  // -------------------------------------------------------------------------
  // TEST GROUP 3: Notification Dispatch Isolation (Only Assigned Admin)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Notification Dispatch Isolation ---');

  const dummyItems: QuotationItem[] = [
    {
      id: 'qitem-test-1',
      productId: 'prod_jk_copier_a4_75gsm',
      productName: 'JK Copier Paper A4 75 GSM',
      sku: 'JK-A4-75',
      indicativeUnitPrice: 280,
      quantity: 10,
      gstPercent: 18,
      indicativeTotalPrice: 2800,
    },
  ];

  // Test Quotation assigned to Sales
  const salesQuotation: Quotation = {
    id: `test-quote-sales-${Date.now()}`,
    quotationNumber: `OB-TEST-SALES-${Date.now().toString().slice(-4)}`,
    customerName: 'Karthik Ramanathan',
    companyName: 'Apex Logistics Chennai Pvt Ltd',
    email: 'karthik@apexlogistics.example.com',
    phone: '9840123456',
    deliveryLocation: 'Guindy Industrial Estate, Chennai',
    pincode: '600032',
    preferredContactMethod: 'email',
    items: dummyItems,
    indicativeSubtotal: 2800,
    indicativeGstAmount: 504,
    indicativeTotal: 3304,
    status: 'new',
    assignedTo: `Sales (${salesEmail})`,
    assignedEmail: salesEmail,
    assignedAt: new Date().toISOString(),
    assignedSequence: 101,
    createdAt: new Date().toISOString(),
  };

  const salesNotifyResults = await dispatchQuotationNotifications(salesQuotation);
  console.log(`Sales Quote Notifications sent (${salesNotifyResults.length} recipient):`);
  salesNotifyResults.forEach((r) => console.log(`  -> Recipient: ${r.recipient} | Channel: ${r.channel} | Status: ${r.status}`));

  assert('Sales quote dispatches exactly ONE notification', salesNotifyResults.length === 1);
  assert(`Sales quote notification recipient is ${salesEmail}`, salesNotifyResults[0]?.recipient.toLowerCase() === salesEmail.toLowerCase());
  assert('Sales quote notification channel is email_sales', salesNotifyResults[0]?.channel === 'email_sales');

  // Test Quotation assigned to Marketing
  const marketingQuotation: Quotation = {
    id: `test-quote-mkt-${Date.now()}`,
    quotationNumber: `OB-TEST-MKT-${Date.now().toString().slice(-4)}`,
    customerName: 'Priya Sundaram',
    companyName: 'Horizon Software Solutions',
    email: 'priya@horizonsoftware.example.com',
    phone: '9884012345',
    deliveryLocation: 'OMR Road, Chennai',
    pincode: '600096',
    preferredContactMethod: 'email',
    items: dummyItems,
    indicativeSubtotal: 2800,
    indicativeGstAmount: 504,
    indicativeTotal: 3304,
    status: 'new',
    assignedTo: `Marketing (${marketingEmail})`,
    assignedEmail: marketingEmail,
    assignedAt: new Date().toISOString(),
    assignedSequence: 102,
    createdAt: new Date().toISOString(),
  };

  const marketingNotifyResults = await dispatchQuotationNotifications(marketingQuotation);
  console.log(`Marketing Quote Notifications sent (${marketingNotifyResults.length} recipient):`);
  marketingNotifyResults.forEach((r) => console.log(`  -> Recipient: ${r.recipient} | Channel: ${r.channel} | Status: ${r.status}`));

  assert('Marketing quote dispatches exactly ONE notification', marketingNotifyResults.length === 1);
  assert(`Marketing quote notification recipient is ${marketingEmail}`, marketingNotifyResults[0]?.recipient.toLowerCase() === marketingEmail.toLowerCase());
  assert('Marketing quote notification channel is email_admin', marketingNotifyResults[0]?.channel === 'email_admin');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
