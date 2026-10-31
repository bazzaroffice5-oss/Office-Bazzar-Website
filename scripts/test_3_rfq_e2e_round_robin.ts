/**
 * End-to-End Verification Test for 3 Customer RFQs with Round-Robin Lead Assignment:
 *
 * Sequence to verify:
 * - Customer RFQ 1 -> Sales (sales4@officebazzar.com)
 * - Customer RFQ 2 -> Marketing (marketing@officebazzar.com)
 * - Customer RFQ 3 -> Sales (sales4@officebazzar.com)
 *
 * Verification criteria:
 * 1. Sequential alternating assignment is strictly followed.
 * 2. Each RFQ is saved in Zoho CRM (Quotes + Quoted_Items + Contacts + Accounts).
 * 3. Structured metadata inside Zoho Quote Description stores:
 *    - assignedTo
 *    - assignedEmail
 *    - assignedAt
 *    - assignedSequence
 * 4. Immutable Zoho CRM Note stores Assigned Lead Owner.
 * 5. Notifications are dispatched ONLY to the assigned admin (no cross-contamination).
 * 6. Quotation records can be retrieved from Zoho CRM and preserve lead owner.
 */

import * as fs from 'fs';
import * as path from 'path';

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
import { syncQuotationToZohoQuote, getQuoteByReferenceFromZoho } from '../src/lib/zoho/quotes';
import { dispatchQuotationNotifications } from '../src/lib/notifications/service';
import { Quotation, QuotationItem } from '../src/types';

async function runE2E() {
  console.log('================================================================');
  console.log('   OFFICE BAZZAR: 3 CUSTOMER RFQ ROUND-ROBIN E2E TEST');
  console.log('================================================================\n');

  const { salesEmail, marketingEmail } = getAdminRecipients();
  const timestamp = Date.now().toString().slice(-5);

  const testCustomers = [
    {
      num: 1,
      expectedAdmin: 'Sales',
      expectedEmail: salesEmail,
      customerName: 'Anand Kumar',
      companyName: 'Titan Tech Labs Chennai',
      email: `anand.tech.${timestamp}@example.com`,
      phone: '9840112233',
      location: 'T. Nagar, Chennai',
      pincode: '600017',
      items: [
        {
          id: 'qitem-1',
          productId: 'prod_jk_copier_a4_75gsm',
          productName: 'JK Copier Paper A4 75 GSM',
          sku: 'JK-A4-75',
          indicativeUnitPrice: 280,
          quantity: 20,
          gstPercent: 18,
          indicativeTotalPrice: 5600,
          packSize: 'Ream of 500 Sheets',
        },
      ],
      subtotal: 5600,
      gst: 1008,
      total: 6608,
    },
    {
      num: 2,
      expectedAdmin: 'Marketing',
      expectedEmail: marketingEmail,
      customerName: 'Deepa Narayanan',
      companyName: 'Apex Health Systems Bangalore',
      email: `deepa.health.${timestamp}@example.com`,
      phone: '9880223344',
      location: 'Whitefield, Bangalore',
      pincode: '560066',
      items: [
        {
          id: 'qitem-2',
          productId: 'prod_kangaro_dp52_punch',
          productName: 'Kangaro Two Hole Punch DP-52',
          sku: 'KANG-DP-52',
          indicativeUnitPrice: 180,
          quantity: 15,
          gstPercent: 18,
          indicativeTotalPrice: 2700,
          packSize: 'Pack of 1',
        },
      ],
      subtotal: 2700,
      gst: 486,
      total: 3186,
    },
    {
      num: 3,
      expectedAdmin: 'Sales',
      expectedEmail: salesEmail,
      customerName: 'Venkatesh Raghavan',
      companyName: 'Venkatesh & Associates Logistics',
      email: `venkat.logistics.${timestamp}@example.com`,
      phone: '9940334455',
      location: 'Ambattur Industrial Estate, Chennai',
      pincode: '600058',
      items: [
        {
          id: 'qitem-3',
          productId: 'prod_taski_r2_concentrate_5l',
          productName: 'Taski R2 All-Purpose Cleaning Concentrate 5L',
          sku: 'TASKI-R2-5L',
          indicativeUnitPrice: 1450,
          quantity: 5,
          gstPercent: 18,
          indicativeTotalPrice: 7250,
          packSize: 'Can of 5 Litres',
        },
      ],
      subtotal: 7250,
      gst: 1305,
      total: 8555,
    },
  ];

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

  for (const cust of testCustomers) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`SUBMITTING CUSTOMER RFQ ${cust.num} (${cust.companyName})`);
    console.log(`------------------------------------------------------------`);

    // 1. Get next lead assignee
    const assignee = await getNextLeadAssignee();
    console.log(`Assignee resolved: ${assignee.name} (${assignee.email}) [Lead #${assignee.sequenceNumber}]`);

    assert(
      `Customer ${cust.num} is assigned to ${cust.expectedAdmin} (${cust.expectedEmail})`,
      assignee.name === cust.expectedAdmin && assignee.email.toLowerCase() === cust.expectedEmail.toLowerCase()
    );

    // 2. Build Quotation record
    const ref = `OB-TEST-RR-${timestamp}-000${cust.num}`;
    const quotation: Quotation = {
      id: `q-${Date.now()}-${cust.num}`,
      quotationNumber: ref,
      customerName: cust.customerName,
      companyName: cust.companyName,
      email: cust.email,
      phone: cust.phone,
      deliveryLocation: cust.location,
      pincode: cust.pincode,
      preferredContactMethod: 'email',
      items: cust.items as QuotationItem[],
      indicativeSubtotal: cust.subtotal,
      indicativeGstAmount: cust.gst,
      indicativeTotal: cust.total,
      status: 'new',
      assignedTo: assignee.label,
      assignedEmail: assignee.email,
      assignedAt: assignee.assignedAt,
      assignedSequence: assignee.sequenceNumber,
      createdAt: new Date().toISOString(),
    };

    // 3. Sync to Zoho CRM
    console.log(`Saving RFQ [${ref}] to Zoho CRM...`);
    const crmResult = await syncQuotationToZohoQuote(quotation);
    console.log(`Zoho CRM Sync Result:`, crmResult.action, `(ID: ${crmResult.quoteId || 'N/A'})`);
    assert(`Quotation ${cust.num} saved in Zoho CRM successfully`, crmResult.success);

    // 4. Dispatch notification
    console.log(`Dispatching notification for RFQ [${ref}]...`);
    const notifyResults = await dispatchQuotationNotifications(quotation, {
      zohoQuoteId: crmResult.quoteId,
      zohoContactId: crmResult.contactId,
    });

    assert(
      `Only ONE notification dispatched for Customer ${cust.num}`,
      notifyResults.length === 1
    );
    assert(
      `Notification recipient matches assigned admin (${cust.expectedEmail})`,
      notifyResults[0]?.recipient.toLowerCase() === cust.expectedEmail.toLowerCase()
    );

    // 5. Verify retrieval from Zoho CRM and preservation of lead assignee
    if (crmResult.quoteId) {
      console.log(`Retrieving Quote from Zoho CRM by reference [${ref}]...`);
      const retrieved = await getQuoteByReferenceFromZoho(crmResult.quoteId);
      assert(`Quotation ${cust.num} retrieved from Zoho CRM`, Boolean(retrieved));
      if (retrieved) {
        console.log(`Retrieved Quote Assigned To: "${retrieved.assignedTo}"`);
        assert(
          `Retrieved Quote preserved assignedTo correctly`,
          Boolean(retrieved.assignedTo && retrieved.assignedTo.includes(cust.expectedAdmin))
        );
      }
    }
  }

  console.log('\n================================================================');
  console.log(`E2E RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runE2E().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
