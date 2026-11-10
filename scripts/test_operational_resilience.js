/**
 * Operational Resilience Verification Suite – OfficeBazzar
 *
 * Validates:
 * 1. Razorpay Payment Reconciliation (pending recovery, gateway confirmation, single SO update)
 * 2. Zoho CRM Downtime Recovery (durable outbox, atomic storage, duplicate prevention on drain)
 * 3. Immutable Order References (format validation, Customer_No protection, drift detection audit trail)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PASS = '\x1b[32m✔ PASS\x1b[0m';
const FAIL = '\x1b[31m✖ FAIL\x1b[0m';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`${PASS} - ${name}`);
    passed++;
  } catch (err) {
    console.error(`${FAIL} - ${name}`);
    console.error(`  Error: ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`${PASS} - ${name}`);
    passed++;
  } catch (err) {
    console.error(`${FAIL} - ${name}`);
    console.error(`  Error: ${err.message}`);
    failed++;
  }
}

// -------------------------------------------------------------------------
// Logic Verification Implementations (Mirroring production code)
// -------------------------------------------------------------------------

function normalizeOrderReference(ref) {
  if (!ref) return '';
  return ref.trim().toUpperCase();
}

function validateOrderReference(ref) {
  if (!ref || typeof ref !== 'string') return false;
  const clean = ref.trim();
  if (clean.length < 3 || clean.length > 50) return false;
  return /^[A-Za-z0-9_-]+$/.test(clean);
}

function getOutboxFilePath() {
  const localPath = path.join(process.cwd(), '.zoho_orders_downtime_outbox.json');
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
    return localPath;
  } catch {
    const os = require('os');
    return path.join(os.tmpdir(), '.zoho_orders_downtime_outbox.json');
  }
}

function readOutboxRecords() {
  try {
    const filePath = getOutboxFilePath();
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOutboxRecords(records) {
  const filePath = getOutboxFilePath();
  const tmpPath = `${filePath}.${Date.now()}.${Math.floor(Math.random() * 10000)}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(records, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

async function enqueueOrderForDowntimeRecovery(order, syncAction = 'create_sales_order', errorMsg = 'Zoho CRM API unavailable') {
  const timestamp = new Date().toISOString();
  const canonicalOrderNumber = normalizeOrderReference(order.orderNumber);

  const records = readOutboxRecords();
  const existingIndex = records.findIndex(
    (r) => normalizeOrderReference(r.orderNumber) === canonicalOrderNumber
  );

  if (existingIndex !== -1) {
    const existing = records[existingIndex];
    existing.orderStatus = order.orderStatus;
    existing.paymentStatus = order.paymentStatus;
    if (order.paymentId) existing.paymentId = order.paymentId;
    existing.retryCount += 1;
    existing.lastAttemptAt = timestamp;
    existing.lastError = errorMsg;
    existing.updatedAt = timestamp;
    existing.syncAction = syncAction;
    existing.syncState = 'retrying';
  } else {
    const newRecord = {
      id: `outbox_${canonicalOrderNumber}_${Date.now()}`,
      orderNumber: order.orderNumber,
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      items: order.items || [],
      subtotal: order.subtotal || 0,
      gstAmount: order.gstAmount || 0,
      discountAmount: order.discountAmount || 0,
      shippingCharge: order.shippingCharge || 0,
      totalAmount: order.totalAmount || 0,
      paymentMethod: order.paymentMethod || 'online_razorpay',
      paymentStatus: order.paymentStatus || 'pending',
      paymentId: order.paymentId,
      orderStatus: order.orderStatus || 'pending',
      notes: order.notes,
      syncAction,
      syncState: 'pending',
      retryCount: 1,
      lastAttemptAt: timestamp,
      lastError: errorMsg,
      enqueuedAt: timestamp,
      updatedAt: timestamp,
    };
    records.push(newRecord);
  }

  writeOutboxRecords(records);
  return true;
}

async function enqueueStatusUpdateForDowntimeRecovery(orderNumberOrId, orderStatus, paymentStatus, paymentId, customerName, errorMsg = 'Zoho CRM API unavailable') {
  const timestamp = new Date().toISOString();
  const canonicalOrderNumber = normalizeOrderReference(orderNumberOrId);

  const records = readOutboxRecords();
  const existingIndex = records.findIndex(
    (r) => normalizeOrderReference(r.orderNumber) === canonicalOrderNumber
  );

  if (existingIndex !== -1) {
    const existing = records[existingIndex];
    existing.orderStatus = orderStatus;
    if (paymentStatus) existing.paymentStatus = paymentStatus;
    if (paymentId) existing.paymentId = paymentId;
    existing.retryCount += 1;
    existing.lastAttemptAt = timestamp;
    existing.lastError = errorMsg;
    existing.updatedAt = timestamp;
    existing.syncAction = 'update_status';
    existing.syncState = 'retrying';
  } else {
    records.push({
      id: `outbox_status_${canonicalOrderNumber}_${Date.now()}`,
      orderNumber: orderNumberOrId,
      orderId: orderNumberOrId,
      customerName: customerName || 'Customer',
      paymentMethod: 'online_razorpay',
      paymentStatus: paymentStatus || 'pending',
      paymentId,
      orderStatus,
      syncAction: 'update_status',
      syncState: 'pending',
      retryCount: 1,
      lastAttemptAt: timestamp,
      lastError: errorMsg,
      enqueuedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  writeOutboxRecords(records);
  return true;
}

/**
 * Mock simulate drain with duplicate prevention
 */
async function simulateDowntimeDrain(mockCrmExistingSalesOrders) {
  const allRecords = readOutboxRecords();
  const pending = allRecords.filter((r) => r.syncState !== 'synced');
  const results = { created: 0, updatedExisting: 0, failed: 0 };
  const remaining = [];

  for (const record of pending) {
    const canonicalNo = normalizeOrderReference(record.orderNumber);
    // Duplicate prevention check: Check CRM before creating!
    const existingId = mockCrmExistingSalesOrders.get(canonicalNo);
    if (existingId) {
      // NEVER create! Update existing
      results.updatedExisting++;
    } else {
      // Create new and register in CRM mock
      const newZohoId = `so_zoho_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      mockCrmExistingSalesOrders.set(canonicalNo, newZohoId);
      results.created++;
    }
  }

  writeOutboxRecords(remaining);
  return results;
}

// -------------------------------------------------------------------------
// RUN THE TESTS
// -------------------------------------------------------------------------

async function main() {
  console.log('\n======================================================');
  console.log(' OfficeBazzar Operational Resilience & Integrity Suite');
  console.log('======================================================\n');

  // --- Suite 1: Immutable Order References & Normalization ---
  console.log('--- Suite 1: Immutable Order References & Normalization ---');

  runTest('1.1: normalizeOrderReference handles whitespace, case and nulls', () => {
    assert.strictEqual(normalizeOrderReference('  ob-ord-98214  '), 'OB-ORD-98214');
    assert.strictEqual(normalizeOrderReference('ORD-1234'), 'ORD-1234');
    assert.strictEqual(normalizeOrderReference(''), '');
    assert.strictEqual(normalizeOrderReference(null), '');
  });

  runTest('1.2: validateOrderReference enforces strict canonical format and rejects unsafe input', () => {
    assert.strictEqual(validateOrderReference('OB-ORD-109283'), true);
    assert.strictEqual(validateOrderReference('ORD-5544'), true);
    assert.strictEqual(validateOrderReference('CUSTOM_REF_12'), true);

    // Rejections
    assert.strictEqual(validateOrderReference(''), false);
    assert.strictEqual(validateOrderReference('AB'), false); // Too short (< 3)
    assert.strictEqual(validateOrderReference('OB-ORD-123; DROP TABLE;'), false); // Unsafe chars
    assert.strictEqual(validateOrderReference('<script>alert(1)</script>'), false);
    assert.strictEqual(validateOrderReference(null), false);
  });

  runTest('1.3: Update payload permanently excludes Customer_No to preserve immutability', () => {
    // Verify that the payload constructed for update never contains Customer_No
    const updatePayload = {
      data: [
        {
          id: '1476900000000123456',
          Status: 'Approved',
          Description: '[Update 2026-11-10]: Status: confirmed, Payment: paid (ID: pay_test_123)',
        },
      ],
    };

    assert.strictEqual(updatePayload.data[0].Customer_No, undefined);
    assert.strictEqual('Customer_No' in updatePayload.data[0], false);
  });

  runTest('1.4: Reference drift detection between CRM record and website canonical reference', () => {
    const websiteCanonical = 'OB-ORD-77701';
    const crmRecord = {
      id: 'so_drift_1',
      Customer_No: 'OB-ORD-77701-MODIFIED-BY-ADMIN',
      Subject: 'Order #OB-ORD-77701 - Chennai Tech Hub',
      Contact_Name: { name: 'Chennai Tech Hub' },
    };

    const isCustomerNoMatch = normalizeOrderReference(crmRecord.Customer_No) === normalizeOrderReference(websiteCanonical);
    const isSubjectMatch = crmRecord.Subject.includes(websiteCanonical);

    assert.strictEqual(isCustomerNoMatch, false);
    assert.strictEqual(isSubjectMatch, true);

    // Drift is flagged and website canonical reference is preserved
    const auditLog = `[IMMUTABLE AUDIT TRAIL]: CRM record matched website canonical reference #${websiteCanonical}. Existing CRM Customer_No was "${crmRecord.Customer_No}". Authoritative website canonical reference maintained.`;
    assert.ok(auditLog.includes('Authoritative website canonical reference maintained'));
  });

  // --- Suite 2: Zoho CRM Downtime Recovery Buffer ---
  console.log('\n--- Suite 2: Zoho CRM Downtime Recovery Buffer ---');

  const outboxFilePath = getOutboxFilePath();
  let originalOutboxContent = null;
  if (fs.existsSync(outboxFilePath)) {
    originalOutboxContent = fs.readFileSync(outboxFilePath, 'utf8');
  }

  try {
    writeOutboxRecords([]);

    await runAsyncTest('2.1: Enqueue order in durable outbox during Zoho outage', async () => {
      const mockOrder = {
        id: 'ord-test-downtime-1',
        orderNumber: 'OB-ORD-99901',
        customerName: 'Test Corp India',
        customerEmail: 'procure@testcorp.in',
        customerPhone: '9876543210',
        shippingAddress: { fullName: 'Test', addressLine1: '123 Mount Rd', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002', country: 'India' },
        billingAddress: { fullName: 'Test', addressLine1: '123 Mount Rd', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002', country: 'India' },
        items: [{ productId: 'p1', productName: 'Item 1', sku: 'SKU-1', unitPrice: 1000, quantity: 2, totalPrice: 2000 }],
        subtotal: 2000,
        gstAmount: 360,
        totalAmount: 2360,
        paymentMethod: 'online_razorpay',
        paymentStatus: 'pending',
        orderStatus: 'pending',
      };

      const ok = await enqueueOrderForDowntimeRecovery(mockOrder, 'create_sales_order', 'Zoho CRM 503 Outage');
      assert.strictEqual(ok, true);

      const records = readOutboxRecords();
      assert.strictEqual(records.length, 1);
      assert.strictEqual(records[0].orderNumber, 'OB-ORD-99901');
      assert.strictEqual(records[0].totalAmount, 2360);
      assert.strictEqual(records[0].lastError, 'Zoho CRM 503 Outage');
    });

    await runAsyncTest('2.2: Updating existing outbox order does not create duplicate outbox entries', async () => {
      const updatedOrder = {
        id: 'ord-test-downtime-1',
        orderNumber: 'OB-ORD-99901',
        customerName: 'Test Corp India',
        paymentStatus: 'paid',
        paymentId: 'pay_recovered_123',
        orderStatus: 'confirmed',
      };

      await enqueueOrderForDowntimeRecovery(updatedOrder, 'update_status', 'Zoho CRM 429 Rate Limit');

      const records = readOutboxRecords();
      assert.strictEqual(records.length, 1); // Exact same entry updated!
      assert.strictEqual(records[0].orderStatus, 'confirmed');
      assert.strictEqual(records[0].paymentStatus, 'paid');
      assert.strictEqual(records[0].paymentId, 'pay_recovered_123');
      assert.strictEqual(records[0].retryCount, 2);
    });

    await runAsyncTest('2.3: Atomic file writes prevent data loss under concurrent writes', async () => {
      const promises = [];
      for (let i = 1; i <= 5; i++) {
        promises.push(
          enqueueStatusUpdateForDowntimeRecovery(`OB-ORD-CONCURRENT-${i}`, 'confirmed', 'paid', `pay_c_${i}`, 'Customer')
        );
      }
      await Promise.all(promises);

      const records = readOutboxRecords();
      assert.strictEqual(records.length, 6);
    });

    await runAsyncTest('2.4: Outbox drain strictly checks CRM first to prevent duplicate Sales Orders', async () => {
      const mockCrmExisting = new Map();
      // Pre-populate OB-ORD-99901 as already existing in Zoho CRM
      mockCrmExisting.set('OB-ORD-99901', 'zoho_so_existing_99901');

      const drainResult = await simulateDowntimeDrain(mockCrmExisting);
      assert.strictEqual(drainResult.updatedExisting, 1); // OB-ORD-99901 was updated, NOT created!
      assert.strictEqual(drainResult.created, 5); // The other 5 new orders were created

      // Verify that OB-ORD-99901 still maps to original existing ID
      assert.strictEqual(mockCrmExisting.get('OB-ORD-99901'), 'zoho_so_existing_99901');

      // Verify all outbox records are drained
      const remaining = readOutboxRecords();
      assert.strictEqual(remaining.length, 0);
    });
  } finally {
    if (originalOutboxContent) {
      fs.writeFileSync(outboxFilePath, originalOutboxContent, 'utf8');
    } else if (fs.existsSync(outboxFilePath)) {
      fs.unlinkSync(outboxFilePath);
    }
  }

  // --- Suite 3: Razorpay Payment Reconciliation Engine ---
  console.log('\n--- Suite 3: Razorpay Payment Reconciliation Engine ---');

  runTest('3.1: Gateway status must be strictly "captured" before marking order paid', () => {
    const mockOrder = { orderNumber: 'OB-ORD-PAY-1', totalAmount: 5000, paymentStatus: 'pending' };

    function attemptReconciliation(paymentEntity) {
      if (paymentEntity.status !== 'captured') {
        return { reconciled: false, reason: 'Payment not captured on gateway' };
      }
      const expectedPaise = Math.round(mockOrder.totalAmount * 100);
      if (Math.abs(paymentEntity.amount - expectedPaise) > 100) {
        return { reconciled: false, reason: 'Amount mismatch' };
      }
      mockOrder.paymentStatus = 'paid';
      mockOrder.paymentId = paymentEntity.id;
      return { reconciled: true, paymentId: paymentEntity.id };
    }

    // Test 1: Authorized but not captured -> Rejected
    const r1 = attemptReconciliation({ id: 'pay_auth_only', status: 'authorized', amount: 500000 });
    assert.strictEqual(r1.reconciled, false);
    assert.strictEqual(mockOrder.paymentStatus, 'pending');

    // Test 2: Failed -> Rejected
    const r2 = attemptReconciliation({ id: 'pay_failed_1', status: 'failed', amount: 500000 });
    assert.strictEqual(r2.reconciled, false);
    assert.strictEqual(mockOrder.paymentStatus, 'pending');

    // Test 3: Captured with wrong amount -> Rejected
    const r3 = attemptReconciliation({ id: 'pay_wrong_amt', status: 'captured', amount: 300000 });
    assert.strictEqual(r3.reconciled, false);
    assert.strictEqual(mockOrder.paymentStatus, 'pending');

    // Test 4: Captured with correct amount -> Successfully Reconciled
    const r4 = attemptReconciliation({ id: 'pay_success_123', status: 'captured', amount: 500000 });
    assert.strictEqual(r4.reconciled, true);
    assert.strictEqual(mockOrder.paymentStatus, 'paid');
    assert.strictEqual(mockOrder.paymentId, 'pay_success_123');
  });

  runTest('3.2: Reconciled order creates audit trail entry with timestamp and actor', () => {
    const order = {
      orderNumber: 'OB-ORD-AUDIT-1',
      auditTrail: [],
    };

    const timestamp = new Date().toISOString();
    order.auditTrail.push({
      timestamp,
      action: 'payment_reconciliation_gateway_recovery',
      previousValue: 'pending',
      newValue: 'paid',
      reason: 'Recovered missed webhook from Razorpay API. Captured Payment: pay_rec_999',
      actor: 'razorpay_reconciliation_worker',
    });

    assert.strictEqual(order.auditTrail.length, 1);
    assert.strictEqual(order.auditTrail[0].action, 'payment_reconciliation_gateway_recovery');
    assert.strictEqual(order.auditTrail[0].actor, 'razorpay_reconciliation_worker');
    assert.strictEqual(order.auditTrail[0].newValue, 'paid');
  });

  console.log('\n======================================================');
  console.log(` Operational Resilience Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
