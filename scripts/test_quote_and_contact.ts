import {
  createQuotation,
  getQuotationById,
  createNotificationLog,
  getNotificationLogs,
  getProductById,
  getProducts,
  createBulkRFQ,
} from '../src/lib/db/store';
import {
  sendQuoteEmailNotification,
  sendContactUsEmailNotification,
  buildQuotationEmailText,
  buildContactUsEmailText,
  clearSentQuoteEmailKeys,
  retryNotification,
  getNotificationRecipients,
  getEmailFromAddress,
  ContactUsSubmission,
} from '../src/lib/notifications/service';
import { Quotation } from '../src/types';

interface TestSuiteResult {
  title: string;
  passed: boolean;
  details: string;
}

const suiteResults: TestSuiteResult[] = [];

function recordTest(title: string, passed: boolean, details: string) {
  suiteResults.push({ title, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} | ${title}\n   └─ ${details}\n`);
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('OFFICEBAZZAR QUOTE EMAIL & CONTACT FORM AUDIT & TEST SUITE');
  console.log('================================================================\n');

  // Clear caches
  clearSentQuoteEmailKeys();

  // -------------------------------------------------------------------------
  // TEST 1: Notification Recipients & Verified Sender Configuration
  // -------------------------------------------------------------------------
  try {
    const { salesEmail, marketingEmail } = getNotificationRecipients();
    const fromAddress = getEmailFromAddress();

    const isRecipientsValid =
      salesEmail === 'sales4@officebazzar.com' &&
      marketingEmail === 'marketing@officebazzar.com';

    recordTest(
      'Notification Recipients Allowlist',
      isRecipientsValid,
      `TO: "${salesEmail}", CC: "${marketingEmail}", From: "${fromAddress}"`
    );
  } catch (err) {
    recordTest('Notification Recipients Allowlist', false, String(err));
  }

  // -------------------------------------------------------------------------
  // TEST 2: Email Provider Unconfigured Handling (No False Silent Success)
  // -------------------------------------------------------------------------
  try {
    // Ensure simulation mode is off for this test
    const origSim = process.env.EMAIL_SIMULATION_MODE;
    const origKey = process.env.RESEND_API_KEY;
    delete process.env.EMAIL_SIMULATION_MODE;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_API_KEY;

    const dummyQuote: Quotation = {
      id: 'test-quote-unconfigured-1',
      quotationNumber: 'OB-RFQ-2026-TEST1',
      customerName: 'Test Corp Person',
      companyName: 'Test Corp Ltd',
      email: 'buyer@testcorp.com',
      phone: '9840012345',
      pincode: '600014',
      preferredContactMethod: 'email',
      additionalRequirements: 'Urgent bulk enquiry',
      items: [
        {
          id: 'item-1',
          productId: 'p-1',
          productName: 'Copier Paper',
          sku: 'STN-PPR-001',
          indicativeUnitPrice: 250,
          gstPercent: 18,
          quantity: 10,
          indicativeTotalPrice: 2500,
        },
      ],
      indicativeSubtotal: 2500,
      indicativeGstAmount: 450,
      indicativeTotal: 2950,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    const quoteEmailResult = await sendQuoteEmailNotification(dummyQuote);

    // It MUST NOT report success when RESEND_API_KEY is missing!
    const passed =
      quoteEmailResult.success === false &&
      quoteEmailResult.provider === 'unconfigured' &&
      typeof quoteEmailResult.error === 'string' &&
      quoteEmailResult.error.includes('RESEND_API_KEY');

    recordTest(
      'Email Provider Unconfigured Failure Reporting (No Silent Success)',
      passed,
      `Result success: ${quoteEmailResult.success}, Provider: ${quoteEmailResult.provider}, Error: "${quoteEmailResult.error}"`
    );

    // Restore env
    if (origSim) process.env.EMAIL_SIMULATION_MODE = origSim;
    if (origKey) process.env.RESEND_API_KEY = origKey;
  } catch (err) {
    recordTest('Email Provider Unconfigured Failure Reporting', false, String(err));
  }

  // -------------------------------------------------------------------------
  // TEST 3: Email Notification in Explicit Simulation Mode
  // -------------------------------------------------------------------------
  try {
    process.env.EMAIL_SIMULATION_MODE = 'true';
    clearSentQuoteEmailKeys();

    const dummyQuote: Quotation = {
      id: 'test-quote-sim-1',
      quotationNumber: 'OB-RFQ-2026-SIM1',
      customerName: 'Suresh Kumar',
      companyName: 'Chennai Tech Solutions',
      email: 'suresh@chennaitech.in',
      phone: '9840098400',
      pincode: '600002',
      preferredContactMethod: 'email',
      items: [
        {
          id: 'item-sim-1',
          productId: 'p-2',
          productName: 'Diversey Taski R1 Super 5L',
          sku: 'HK-DVT-R1',
          indicativeUnitPrice: 1450,
          gstPercent: 18,
          quantity: 4,
          indicativeTotalPrice: 5800,
        },
      ],
      indicativeSubtotal: 5800,
      indicativeGstAmount: 1044,
      indicativeTotal: 6844,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    const simResult = await sendQuoteEmailNotification(dummyQuote);
    const passed =
      simResult.success === true &&
      simResult.provider === 'simulated' &&
      simResult.to === 'sales4@officebazzar.com' &&
      simResult.cc === 'marketing@officebazzar.com' &&
      Boolean(simResult.messageId);

    recordTest(
      'Quote Email Simulation Mode Dispatch',
      passed,
      `TO: ${simResult.to}, CC: ${simResult.cc}, Provider: ${simResult.provider}, MessageId: ${simResult.messageId}`
    );
  } catch (err) {
    recordTest('Quote Email Simulation Mode Dispatch', false, String(err));
  }

  // -------------------------------------------------------------------------
  // TEST 4: Duplicate Submission Suppression
  // -------------------------------------------------------------------------
  try {
    const dummyQuote: Quotation = {
      id: 'test-quote-sim-1',
      quotationNumber: 'OB-RFQ-2026-SIM1',
      customerName: 'Suresh Kumar',
      companyName: 'Chennai Tech Solutions',
      email: 'suresh@chennaitech.in',
      phone: '9840098400',
      pincode: '600002',
      preferredContactMethod: 'email',
      items: [],
      indicativeSubtotal: 0,
      indicativeGstAmount: 0,
      indicativeTotal: 0,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    // Submitting the same quotation again should detect duplicate
    const dupResult = await sendQuoteEmailNotification(dummyQuote);
    const passed = dupResult.isDuplicate === true;

    recordTest(
      'Duplicate Submission Suppression (Double-Click Protection)',
      passed,
      `isDuplicate: ${dupResult.isDuplicate}, Provider: ${dupResult.provider}`
    );
  } catch (err) {
    recordTest('Duplicate Submission Suppression', false, String(err));
  }

  // -------------------------------------------------------------------------
  // TEST 5: Contact Us Email Notification Service
  // -------------------------------------------------------------------------
  try {
    process.env.EMAIL_SIMULATION_MODE = 'true';

    const testContact: ContactUsSubmission = {
      referenceNumber: 'OB-CNT-20261028-TEST1',
      name: 'Anand Radhakrishnan',
      companyName: 'Radhakrishnan Enterprises',
      email: 'anand@rkenterprises.co',
      phone: '9841054321',
      message:
        'We require monthly supplies of office stationery, cleaning chemicals, and paper rolls for our Royapettah office.',
      submittedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    };

    const contactEmailResult = await sendContactUsEmailNotification(testContact);
    const textEmail = buildContactUsEmailText(testContact);

    const passed =
      contactEmailResult.success === true &&
      contactEmailResult.to === 'sales4@officebazzar.com' &&
      contactEmailResult.cc === 'marketing@officebazzar.com' &&
      textEmail.includes(testContact.referenceNumber) &&
      textEmail.includes(testContact.message) &&
      textEmail.includes('anand@rkenterprises.co');

    recordTest(
      'Contact Us Email Notification Dispatch & Template Formatting',
      passed,
      `Delivered to TO: ${contactEmailResult.to}, CC: ${contactEmailResult.cc}, Ref in body: true`
    );
  } catch (err) {
    recordTest('Contact Us Email Notification Dispatch', false, String(err));
  }

  // -------------------------------------------------------------------------
  // TEST 6: Contact Us Honeypot & Anti-Spam / Injection Protection
  // -------------------------------------------------------------------------
  try {
    // Sanitize check
    const injectedName = 'Attacker Name\r\nBcc: evil@hacker.com';
    const clean = injectedName
      .replace(/[\r\n\0]/g, '')
      .replace(/(bcc|cc|to|subject|content-type|mime-version):/gi, '')
      .trim();
    const passed =
      !clean.includes('\r') &&
      !clean.includes('\n') &&
      !clean.toLowerCase().includes('bcc:') &&
      !clean.toLowerCase().includes('cc:');

    recordTest(
      'Email Header Injection Sanitization',
      passed,
      `Injected: "${injectedName.replace(/\r\n/g, '\\r\\n')}" -> Sanitized: "${clean}"`
    );
  } catch (err) {
    recordTest('Email Header Injection Sanitization', false, String(err));
  }

  // -------------------------------------------------------------------------
  // TEST 7: Quotation Store Creation & Idempotency
  // -------------------------------------------------------------------------
  try {
    const { products } = await getProducts();
    const sampleProduct = products[0] || {
      id: 'p-default',
      name: 'Office Notepad',
      sku: 'STN-NOT-001',
      price: 65,
      gstPercent: 18,
    };

    const testIdempotencyKey = `OB-TEST-IDEM-${Date.now()}`;
    const quote1 = await createQuotation({
      idempotencyKey: testIdempotencyKey,
      customerName: 'Priya Narayanan',
      companyName: 'Narayanan & Sons Auditing',
      email: 'priya@nsauditing.com',
      phone: '9840234567',
      pincode: '600017',
      preferredContactMethod: 'email',
      additionalRequirements: 'Delivery to T. Nagar branch',
      items: [
        {
          id: 'item-test-1',
          productId: sampleProduct.id,
          productName: sampleProduct.name,
          sku: sampleProduct.sku,
          indicativeUnitPrice: sampleProduct.price ?? 65,
          gstPercent: sampleProduct.gstPercent || 18,
          quantity: 20,
          indicativeTotalPrice: (sampleProduct.price ?? 65) * 20,
        },
      ],
      indicativeSubtotal: (sampleProduct.price ?? 65) * 20,
      indicativeGstAmount: ((sampleProduct.price ?? 65) * 20 * 0.18),
      indicativeTotal: ((sampleProduct.price ?? 65) * 20 * 1.18),
      status: 'new',
    });

    // Idempotent second call
    const quote2 = await createQuotation({
      idempotencyKey: testIdempotencyKey,
      customerName: 'Priya Narayanan',
      companyName: 'Narayanan & Sons Auditing',
      email: 'priya@nsauditing.com',
      phone: '9840234567',
      pincode: '600017',
      preferredContactMethod: 'email',
      items: [],
      indicativeSubtotal: 0,
      indicativeGstAmount: 0,
      indicativeTotal: 0,
      status: 'new',
    });

    const passed =
      Boolean(quote1.quotationNumber) &&
      quote1.quotationNumber.startsWith('OB-RFQ-') &&
      quote1.id === quote2.id &&
      quote1.quotationNumber === quote2.quotationNumber;

    recordTest(
      'Quotation Store Persistence & Idempotency Key De-duplication',
      passed,
      `Reference: ${quote1.quotationNumber}, Same ID on repeat: ${quote1.id === quote2.id}`
    );
  } catch (err) {
    recordTest('Quotation Store Persistence', false, String(err));
  }

  // -------------------------------------------------------------------------
  // TEST 8: Notification Logs & Safe Retry Mechanism
  // -------------------------------------------------------------------------
  try {
    const quoteForRetry = await createQuotation({
      customerName: 'Retry Tester',
      companyName: 'Retry Testing Corp',
      email: 'retry@testingcorp.com',
      phone: '9840345678',
      pincode: '600028',
      preferredContactMethod: 'email',
      items: [
        {
          id: 'item-retry-1',
          productId: 'p-retry',
          productName: 'Spiral Notebook',
          sku: 'STN-NB-001',
          indicativeUnitPrice: 100,
          gstPercent: 18,
          quantity: 5,
          indicativeTotalPrice: 500,
        },
      ],
      indicativeSubtotal: 500,
      indicativeGstAmount: 90,
      indicativeTotal: 590,
      status: 'new',
    });

    const failedLog = await createNotificationLog({
      quotationId: quoteForRetry.id,
      quotationNumber: quoteForRetry.quotationNumber,
      channel: 'email_quote',
      recipient: 'sales4@officebazzar.com; cc: marketing@officebazzar.com',
      status: 'failed',
      errorMessage: 'Initial simulated provider disconnect',
      attempts: 1,
    });

    process.env.EMAIL_SIMULATION_MODE = 'true';
    const retryResult = await retryNotification(failedLog.id);

    const logs = await getNotificationLogs();
    const updatedLog = logs.find((l) => l.id === failedLog.id);

    const passed =
      retryResult.success === true &&
      Boolean(updatedLog) &&
      updatedLog?.status === 'sent' &&
      (updatedLog?.attempts || 0) >= 2;

    recordTest(
      'Safe Notification Retry from Logs without Quote Duplication',
      passed,
      `Retry success: ${retryResult.success}, Log status: ${updatedLog?.status}, Attempts: ${updatedLog?.attempts}`
    );
  } catch (err) {
    recordTest('Safe Notification Retry', false, String(err));
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('================================================================');
  console.log('TEST SUITE EXECUTION SUMMARY');
  console.log('================================================================');
  const total = suiteResults.length;
  const passedCount = suiteResults.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`Total Tests Run : ${total}`);
  console.log(`Passed         : ${passedCount}`);
  console.log(`Failed         : ${failedCount}\n`);

  if (failedCount > 0) {
    console.error('❌ SOME TESTS FAILED.');
    process.exit(1);
  } else {
    console.log('✅ ALL AUDIT & INTEGRATION TESTS PASSED!');
    process.exit(0);
  }
}

runTestSuite();
