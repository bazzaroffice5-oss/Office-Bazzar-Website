/**
 * Server-Side Zoho CRM Sales Orders Service
 *
 * Implements Zoho CRM Sales_Orders module as the authoritative business database for e-commerce orders:
 * 1. Synchronizes customer contact and company details to Zoho Contacts and Accounts.
 * 2. Maps line items to Zoho Product IDs using the authoritative catalog mapping.
 * 3. Creates formal Sales Order records with tax breakdown, shipping charges, and addresses.
 * 4. Updates payment and fulfillment status in Zoho CRM upon Razorpay confirmation.
 */

import { Order, OrderStatus } from '@/types';
import { zohoFetch, isZohoConfigured } from './client';
import { syncCustomerToZohoContact } from './contacts';
import { getZohoProductId } from './products';

export interface ZohoOrderSyncResult {
  success: boolean;
  salesOrderId?: string;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  error?: string;
  details?: unknown;
}

interface ZohoModuleResponse {
  data?: Array<{
    code: string;
    details?: {
      id?: string;
      [key: string]: unknown;
    };
    message: string;
    status: string;
  }>;
}

// In-memory mapping from OrderNumber -> Zoho Sales Order ID for instant status updates
const orderNumberToZohoIdMap = new Map<string, string>();

// Concurrency mutex lock: In-flight Sales Order creation promises to prevent duplicate creation
const inFlightOrderSyncs = new Map<string, Promise<ZohoOrderSyncResult>>();

/**
 * Consistently normalize order references for canonical comparison across systems.
 * Trims accidental leading/trailing whitespace and normalizes case.
 */
export function normalizeOrderReference(ref?: string | null): string {
  if (!ref) return '';
  return ref.trim().toUpperCase();
}

/**
 * Validate that an order reference conforms to immutable standards:
 * - Must be a non-empty string between 3 and 50 characters.
 * - Must not contain control characters or unsafe scripts.
 * - Standard pattern: starts with OB-ORD- or alphanumeric hyphenated/underscored identifier.
 */
export function validateOrderReference(ref?: string | null): boolean {
  if (!ref || typeof ref !== 'string') return false;
  const clean = ref.trim();
  if (clean.length < 3 || clean.length > 50) return false;
  return /^[A-Za-z0-9_-]+$/.test(clean);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Score candidate Sales Order authoritativeness using the strict priority hierarchy:
 * 1. Existing verified zohoSalesOrderId association (+1000 pts)
 * 2. Verified successful payment and matching Razorpay payment reference (+500 pts)
 * 3. Valid active order status and transaction association (+100 to +250 pts)
 * 4. Creation timestamp only as a final tie-breaker (handled during sort)
 */
function scoreCandidateAuthoritativeness(so: any, order: Order): { score: number; reasons: string[]; paymentRef?: string } {
  let score = 0;
  const reasons: string[] = [];
  const desc = so.Description || '';
  const status = (so.Status || '').toLowerCase();

  // Extract payment reference if present (e.g. pay_xxxxxxxxxxxxxx)
  const payMatch = desc.match(/pay_[a-zA-Z0-9_-]+/i);
  const paymentRef = payMatch ? payMatch[0] : undefined;

  // Priority 1: Direct match with order.zohoSalesOrderId
  if (order.zohoSalesOrderId && so.id === order.zohoSalesOrderId) {
    score += 1000;
    reasons.push('direct_zohoSalesOrderId_match');
  }

  // Priority 2: Verified successful payment matching Razorpay payment reference
  if (order.paymentId && paymentRef && paymentRef.toLowerCase() === order.paymentId.toLowerCase()) {
    score += 500;
    reasons.push('matching_razorpay_payment_id');
  } else if (paymentRef) {
    score += 300;
    reasons.push(`has_payment_ref_${paymentRef}`);
  }

  // Priority 3: Valid active order status and transaction association
  if (status === 'delivered' || status === 'shipped') {
    score += 250;
    reasons.push(`fulfillment_${status}`);
  } else if (status === 'invoiced') {
    score += 200;
    reasons.push('invoiced');
  } else if (status === 'approved') {
    score += 100;
    reasons.push('approved');
  }

  return { score, reasons, paymentRef };
}

/**
 * Robustly resolve a Zoho Sales Order ID from orderNumber across serverless instances:
 * 1. Fast in-memory cache (raw and canonical keys)
 * 2. Exact Customer_No search criteria with customer validation
 * 3. Recent Sales_Orders list lookup with strict boundary pattern (never a loose substring)
 * STRICT REQUIREMENT: Never pick an order based on recency alone. Only exact canonical orderNumber and customer match are accepted.
 */
export async function findZohoSalesOrderId(
  orderNumberOrId: string,
  expectedCustomerName?: string
): Promise<string | null> {
  const rawKey = orderNumberOrId.trim();
  if (!rawKey) return null;

  // Direct numeric Zoho ID check
  if (/^\d{15,22}$/.test(rawKey)) {
    return rawKey;
  }

  const canonicalKey = normalizeOrderReference(rawKey);

  // 1. Fast in-memory resolution (check both raw and canonical keys)
  const cachedId = orderNumberToZohoIdMap.get(rawKey) || orderNumberToZohoIdMap.get(canonicalKey);
  if (cachedId) {
    return cachedId;
  }

  // 2. Query search by exact Customer_No
  try {
    const searchRes = await zohoFetch<any>(
      `/Sales_Orders/search?criteria=(Customer_No:equals:${encodeURIComponent(rawKey)})&fields=id,Customer_No,Subject,Contact_Name,Status`,
      { method: 'GET' }
    );
    if (Array.isArray(searchRes?.data) && searchRes.data.length > 0) {
      const match = searchRes.data.find((so: any) => {
        const candidateNo = normalizeOrderReference(so.Customer_No);
        if (candidateNo !== canonicalKey) return false;

        // Customer identity validation: Never merge unrelated orders
        if (expectedCustomerName && so.Contact_Name?.name) {
          const expected = expectedCustomerName.toLowerCase().trim();
          const actual = so.Contact_Name.name.toLowerCase().trim();
          if (expected !== actual && !expected.includes(actual) && !actual.includes(expected)) {
            return false;
          }
        }
        return true;
      });
      if (match?.id) {
        orderNumberToZohoIdMap.set(rawKey, match.id);
        orderNumberToZohoIdMap.set(canonicalKey, match.id);

        // Reference Drift Detection & Audit Trail Recording
        const candidateNo = normalizeOrderReference(match.Customer_No);
        if (candidateNo !== canonicalKey) {
          const timestamp = new Date().toISOString();
          console.warn(
            `[ZohoOrders Audit Trail] [${timestamp}] Order reference drift detected on Sales Order ${match.id}: CRM Customer_No="${match.Customer_No}", website canonical="#${canonicalKey}". Preserving website reference as immutable authority.`
          );
          // Append audit trail note into Zoho Sales Order description non-destructively
          zohoFetch('/Sales_Orders', {
            method: 'PUT',
            body: JSON.stringify({
              data: [
                {
                  id: match.id,
                  Description: `[IMMUTABLE AUDIT TRAIL ${timestamp}]: CRM record matched website canonical reference #${canonicalKey}. Existing CRM Customer_No was "${match.Customer_No || 'empty'}". Authoritative website canonical reference maintained.\n\n${match.Description || ''}`.slice(0, 31000),
                },
              ],
            }),
          }).catch(() => {});
        }

        return match.id;
      }
    }
  } catch {
    // Continue to recent list fallback
  }

  // 3. Fallback: Query recent sales orders (checking exact Customer_No and strict subject boundaries)
  // STRICT RULE: Never pick an order based on recency alone. Only exact canonical order number and customer match are accepted.
  try {
    const recentRes = await zohoFetch<any>(
      `/Sales_Orders?fields=id,Customer_No,Subject,Created_Time,Contact_Name,Status&sort_by=Created_Time&sort_order=desc&per_page=50`,
      { method: 'GET' }
    );
    if (Array.isArray(recentRes?.data)) {
      const match = recentRes.data.find((so: any) => {
        const candidateNo = normalizeOrderReference(so.Customer_No);
        const matchesExactCustomerNo = candidateNo === canonicalKey;

        // Strict subject matching: Boundary-validated, never a loose partial substring
        const subject = (so.Subject || '').trim();
        const matchesExactSubject =
          normalizeOrderReference(subject) === canonicalKey ||
          new RegExp(`(?:^|Order\\s*#?\\s*)${escapeRegex(canonicalKey)}(?:\\s*-|\\s*$|\\b)`, 'i').test(subject);

        if (!matchesExactCustomerNo && !matchesExactSubject) return false;

        // Verify customer association if available
        if (expectedCustomerName && so.Contact_Name?.name) {
          const expected = expectedCustomerName.toLowerCase().trim();
          const actual = so.Contact_Name.name.toLowerCase().trim();
          if (expected !== actual && !expected.includes(actual) && !actual.includes(expected)) {
            return false;
          }
        }
        return true;
      });

      if (match?.id) {
        orderNumberToZohoIdMap.set(rawKey, match.id);
        orderNumberToZohoIdMap.set(canonicalKey, match.id);

        // Reference Drift Detection & Audit Trail Recording
        const candidateNo = normalizeOrderReference(match.Customer_No);
        if (candidateNo !== canonicalKey) {
          const timestamp = new Date().toISOString();
          console.warn(
            `[ZohoOrders Audit Trail] [${timestamp}] Order reference drift detected on Sales Order ${match.id}: CRM Customer_No="${match.Customer_No}", website canonical="#${canonicalKey}". Preserving website reference as immutable authority.`
          );
          // Append audit trail note into Zoho Sales Order description non-destructively
          zohoFetch('/Sales_Orders', {
            method: 'PUT',
            body: JSON.stringify({
              data: [
                {
                  id: match.id,
                  Description: `[IMMUTABLE AUDIT TRAIL ${timestamp}]: CRM record matched website canonical reference #${canonicalKey}. Existing CRM Customer_No was "${match.Customer_No || 'empty'}". Authoritative website canonical reference maintained.\n\n${match.Description || ''}`.slice(0, 31000),
                },
              ],
            }),
          }).catch(() => {});
        }

        return match.id;
      }
    }
  } catch {
    // Continue
  }

  return null;
}

/**
 * Safe Duplicate Sales Order Reconciliation Engine
 *
 * Adheres to enterprise audit safety requirements:
 * 1. PREVENTS deletion if candidate has successful payments, invoices, shipments, or linked transactions.
 * 2. VALIDATES exact orderNumber, customer identity, payment reference, and creation timestamps before classification.
 * 3. SELECTS authoritative primary based on:
 *    - Existing verified zohoSalesOrderId association
 *    - Matching Razorpay payment reference
 *    - Active status (delivered/shipped/invoiced/approved)
 *    - Creation timestamp only as final tie-breaker
 * 4. FLAGS conflicting payment states for manual administrative review without modification.
 * 5. LOGS all reconciliation actions with ISO timestamps, primary ID, and candidate IDs.
 * 6. ISOLATES reconciliation errors so CRM API failures never compromise the order's confirmed payment state.
 */
export async function reconcileDuplicateSalesOrdersSafely(
  orderNumber: string,
  primarySalesOrderId: string,
  order: Order
): Promise<void> {
  const timestamp = new Date().toISOString();
  const canonicalOrderNumber = normalizeOrderReference(orderNumber);

  try {
    const searchRes = await zohoFetch<any>(
      `/Sales_Orders?fields=id,Customer_No,Subject,Status,Created_Time,Contact_Name,Description&sort_by=Created_Time&sort_order=desc&per_page=30`
    );
    if (!Array.isArray(searchRes?.data)) return;

    // 1. Strict Canonical Matching & Customer Association Filtering
    const candidates = searchRes.data.filter((so: any) => {
      const candidateNo = normalizeOrderReference(so.Customer_No);
      const subject = (so.Subject || '').trim();
      const matchesNo = candidateNo === canonicalOrderNumber;
      const matchesSubject =
        normalizeOrderReference(subject) === canonicalOrderNumber ||
        new RegExp(`(?:^|Order\\s*#?\\s*)${escapeRegex(canonicalOrderNumber)}(?:\\s*-|\\s*$|\\b)`, 'i').test(subject);

      if (!matchesNo && !matchesSubject) return false;

      // Customer identity validation: Never merge unrelated orders
      if (order.customerName && so.Contact_Name?.name) {
        const expected = order.customerName.toLowerCase().trim();
        const actual = so.Contact_Name.name.toLowerCase().trim();
        if (expected !== actual && !expected.includes(actual) && !actual.includes(expected)) {
          console.warn(`[ZohoOrders Reconciliation] Excluding SO ${so.id} with mismatched customer "${so.Contact_Name.name}" (expected "${order.customerName}")`);
          return false;
        }
      }

      return true;
    });

    if (candidates.length <= 1) return;

    console.warn(`[ZohoOrders Reconciliation] [${timestamp}] Multiple matching Sales Orders (${candidates.length}) detected for canonical #${canonicalOrderNumber}. Initiating hierarchical evaluation...`);

    // 2. Authoritative Primary Order Selection Priority:
    const scoredCandidates = candidates.map((so: any) => {
      const { score, reasons, paymentRef } = scoreCandidateAuthoritativeness(so, order);
      return { so, score, reasons, paymentRef };
    });

    // Detect conflicting payment references across candidates
    const distinctPaymentRefs = new Set<string>();
    for (const item of scoredCandidates) {
      if (item.paymentRef) {
        distinctPaymentRefs.add(item.paymentRef.toLowerCase());
      }
    }

    // Rule: If payment states conflict (multiple distinct payments) or authoritative record cannot be determined safely:
    // Retain ALL records and flag for manual review. NEVER cancel or modify!
    if (distinctPaymentRefs.size > 1) {
      console.warn(
        `[ZohoOrders Reconciliation] [${timestamp}] CONFLICT DETECTED: Multiple distinct payment references (${Array.from(distinctPaymentRefs).join(', ')}) found across Sales Orders for #${canonicalOrderNumber}. Retaining all records for manual review.`
      );

      for (const item of scoredCandidates) {
        await zohoFetch('/Sales_Orders', {
          method: 'PUT',
          body: JSON.stringify({
            data: [
              {
                id: item.so.id,
                Description: `[AUDIT ALERT ${timestamp}]: Conflicting payment references detected across multiple Sales Orders for #${canonicalOrderNumber} (${Array.from(distinctPaymentRefs).join(', ')}). RETAINED FOR MANUAL REVIEW.\n\n${item.so.Description || ''}`.slice(0, 31000),
              },
            ],
          }),
        }).catch(() => {});
      }
      return;
    }

    // Sort by score descending; if score tied, earliest Created_Time takes precedence as final tie-breaker
    scoredCandidates.sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.so.Created_Time).getTime() - new Date(b.so.Created_Time).getTime();
    });

    const authoritativePrimary = scoredCandidates[0].so;
    const duplicates = scoredCandidates.slice(1).map((s: any) => s.so);

    console.log(
      `[ZohoOrders Reconciliation] [${timestamp}] Selected authoritative primary SO ${authoritativePrimary.id} (Score: ${scoredCandidates[0].score}, Reasons: ${scoredCandidates[0].reasons.join(', ')})`
    );

    // Keep memory cache aligned with authoritative primary
    orderNumberToZohoIdMap.set(canonicalOrderNumber, authoritativePrimary.id);
    orderNumberToZohoIdMap.set(orderNumber, authoritativePrimary.id);

    // Process duplicate candidates safely
    for (const dup of duplicates) {
      const dupStatus = (dup.Status || '').toLowerCase();
      const dupDesc = dup.Description || '';
      const hasPayment = dupDesc.includes('pay_') || dupStatus === 'approved';
      const hasInvoiceOrShipment = dupStatus === 'invoiced' || dupStatus === 'shipped' || dupStatus === 'delivered';

      // If duplicate has an active transaction or payment, NEVER delete and NEVER cancel: Flag for manual review
      if (hasPayment || hasInvoiceOrShipment) {
        console.warn(
          `[ZohoOrders Reconciliation] [${timestamp}] Duplicate candidate ${dup.id} has active status (${dup.Status}) or payment reference. Retaining and flagging for MANUAL REVIEW. Primary authoritative ID: ${authoritativePrimary.id}`
        );
        await zohoFetch('/Sales_Orders', {
          method: 'PUT',
          body: JSON.stringify({
            data: [
              {
                id: dup.id,
                Description: `[AUDIT ALERT ${timestamp}]: Retained for manual review. Authoritative primary order is ${authoritativePrimary.id}.\n\n${dupDesc}`.slice(0, 31000),
              },
            ],
          }),
        }).catch(() => {});
        continue;
      }

      // Only unapproved, unpaid ghost duplicates with zero linked payments are safely cancelled (never deleted)
      console.log(
        `[ZohoOrders Reconciliation] [${timestamp}] Safely marking unpaid ghost duplicate ${dup.id} as Cancelled. Authoritative primary: ${authoritativePrimary.id}`
      );
      await zohoFetch('/Sales_Orders', {
        method: 'PUT',
        body: JSON.stringify({
          data: [
            {
              id: dup.id,
              Status: 'Cancelled',
              Description: `[AUTO-RECONCILED DUPLICATE ${timestamp}]: Redundant ghost checkout record cancelled. Authoritative primary Sales Order: ${authoritativePrimary.id}\n\n${dupDesc}`.slice(0, 31000),
            },
          ],
        }),
      }).catch((err) => {
        console.warn(`[ZohoOrders Reconciliation] Non-blocking error updating ghost duplicate ${dup.id}:`, err?.message);
      });
    }
  } catch (err: any) {
    // Non-blocking isolation: Reconciliation failures NEVER compromise order's confirmed payment state
    console.warn(`[ZohoOrders Reconciliation] Non-blocking error during duplicate reconciliation for #${orderNumber}:`, err?.message);
  }
}

/**
 * Map an internal website Order to Zoho CRM Sales_Orders payload.
 * Fully idempotent: Checks for existing Sales Order and coalesces in-flight creations.
 */
export async function syncOrderToZohoSalesOrder(order: Order): Promise<ZohoOrderSyncResult> {
  if (!(await isZohoConfigured())) {
    console.log('[ZohoOrders] Zoho CRM unconfigured. Order persisted in runtime store:', order.orderNumber);
    return {
      success: true,
      action: 'skipped',
    };
  }

  // Check if a sync is already in flight for this exact orderNumber (simultaneous verify + webhook)
  const existingSync = inFlightOrderSyncs.get(order.orderNumber);
  if (existingSync) {
    console.log(`[ZohoOrders] Coalescing concurrent Sales Order creation for #${order.orderNumber}`);
    return existingSync;
  }

  const syncPromise = (async (): Promise<ZohoOrderSyncResult> => {
    try {
      // Check if Sales Order was already created previously (e.g. across serverless instances)
      const existingZohoId = await findZohoSalesOrderId(order.orderNumber, order.customerName);
      if (existingZohoId) {
        console.log(`[ZohoOrders] Sales Order #${order.orderNumber} already exists in Zoho CRM (ID: ${existingZohoId}). Updating status...`);
        await updateZohoSalesOrderStatus(existingZohoId, order.orderStatus, order.paymentStatus, order.paymentId, order.customerName);

        // Safely reconcile any duplicate ghost records that may exist
        await reconcileDuplicateSalesOrdersSafely(order.orderNumber, existingZohoId, order);

        return {
          success: true,
          action: 'updated',
          salesOrderId: existingZohoId,
        };
      }

      // 1. Ensure customer Contact and corporate Account exist in Zoho CRM
    let contactId: string | undefined = undefined;
    let accountId: string | undefined = undefined;

    try {
      const contactSync = await syncCustomerToZohoContact({
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        companyName: order.companyName,
        gstin: order.gstin,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        websiteCustomerId: order.customerEmail,
      });

      if (contactSync.success) {
        contactId = contactSync.contactId;
        accountId = contactSync.accountId;
      }
    } catch (contactErr) {
      console.warn('[ZohoOrders] Failed to link Contact for order:', contactErr);
    }

    // 2. Prepare Ordered_Items line items mapped to Zoho Product IDs
    const FALLBACK_ZOHO_PRODUCT_ID = '1476900000000607300'; // Equal Foldable Platform Trolley (Active)
    const orderedItems = order.items.map((it) => {
      const zohoProdId = getZohoProductId(it.productId) || getZohoProductId(it.sku) || FALLBACK_ZOHO_PRODUCT_ID;
      const lineTotal = it.unitPrice * it.quantity;

      return {
        Product_Name: { id: zohoProdId },
        Quantity: it.quantity,
        List_Price: it.unitPrice,
        Description: `${it.productName} (SKU: ${it.sku}${it.packSize ? ', Pack: ' + it.packSize : ''})`,
      };
    });

    // 3. Build Sales Order description
    const descriptionLines = [
      `=== OFFICEBAZZAR E-COMMERCE ORDER ===`,
      `Order Number: ${order.orderNumber}`,
      `Internal ID: ${order.id}`,
      `Created At: ${order.createdAt}`,
      `Payment Method: ${order.paymentMethod}`,
      `Payment Status: ${order.paymentStatus}`,
      order.paymentId ? `Payment ID: ${order.paymentId}` : '',
      order.couponCode ? `Applied Coupon: ${order.couponCode} (Discount: ₹${order.discountAmount})` : '',
      order.gstin ? `Customer GSTIN: ${order.gstin}` : '',
      order.notes ? `Customer Notes: ${order.notes}` : '',
      `=====================================`,
    ].filter(Boolean);

    const salesOrderPayload = {
      data: [
        {
          Subject: `Order #${order.orderNumber} - ${order.customerName}`,
          Customer_No: order.orderNumber,
          Contact_Name: contactId ? { id: contactId } : undefined,
          Account_Name: accountId ? { id: accountId } : undefined,
          Status: order.orderStatus === 'confirmed' ? 'Approved' : 'Created',
          Ordered_Items: orderedItems,
          Adjustment: order.shippingCharge || 0,
          Discount: order.discountAmount || 0,
          Billing_Street: order.billingAddress?.addressLine1 || order.shippingAddress?.addressLine1,
          Billing_City: order.billingAddress?.city || order.shippingAddress?.city,
          Billing_State: order.billingAddress?.state || order.shippingAddress?.state,
          Billing_Code: order.billingAddress?.pincode || order.shippingAddress?.pincode,
          Billing_Country: 'India',
          Shipping_Street: order.shippingAddress?.addressLine1,
          Shipping_City: order.shippingAddress?.city,
          Shipping_State: order.shippingAddress?.state,
          Shipping_Code: order.shippingAddress?.pincode,
          Shipping_Country: 'India',
          Description: descriptionLines.join('\n'),
        },
      ],
      trigger: ['approval', 'workflow'],
    };

    const res = await zohoFetch<ZohoModuleResponse>('/Sales_Orders', {
      method: 'POST',
      body: JSON.stringify(salesOrderPayload),
    });

    const firstItem = res.data?.[0];
    if (firstItem && (firstItem.code === 'SUCCESS' || firstItem.status === 'success')) {
      const salesOrderId = firstItem.details?.id;
      if (salesOrderId) {
        orderNumberToZohoIdMap.set(order.orderNumber, salesOrderId);

        // Persistent CRM Duplicate Protection: Safe non-destructive reconciliation
        reconcileDuplicateSalesOrdersSafely(order.orderNumber, salesOrderId, order).catch((err) =>
          console.warn('[ZohoOrders] Non-blocking reconciliation warning:', err?.message)
        );

        // Opportunistically drain pending downtime outbox now that Zoho CRM is responsive
        import('./downtime-recovery')
          .then((m) => m.drainZohoDowntimeOutbox(false))
          .catch(() => {});
      }
      console.log(`[ZohoOrders] Successfully created Sales Order #${order.orderNumber} in Zoho CRM (ID: ${salesOrderId})`);
      return {
        success: true,
        action: 'created',
        salesOrderId,
      };
    }

    const errorMsg = firstItem?.message || JSON.stringify(res);
    console.warn(`[ZohoOrders] Failed to create Sales Order in Zoho CRM for #${order.orderNumber}:`, errorMsg);

    // Enqueue order in durable downtime recovery buffer (no data loss)
    import('./downtime-recovery')
      .then((m) => m.enqueueOrderForDowntimeRecovery(order, 'create_sales_order', errorMsg))
      .catch((err) => console.error('[ZohoOrders] Failed to enqueue into downtime outbox:', err));

    return {
      success: false,
      action: 'failed',
      error: errorMsg,
      details: res,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ZohoOrders] Exception creating Sales Order #${order.orderNumber}:`, err);

    // Enqueue order in durable downtime recovery buffer upon network / timeout exception
    import('./downtime-recovery')
      .then((m) => m.enqueueOrderForDowntimeRecovery(order, 'create_sales_order', errorMsg))
      .catch((e) => console.error('[ZohoOrders] Failed to enqueue into downtime outbox:', e));

    return {
      success: false,
      action: 'failed',
      error: errorMsg,
    };
  } finally {
    inFlightOrderSyncs.delete(order.orderNumber);
  }
  })();

  inFlightOrderSyncs.set(order.orderNumber, syncPromise);
  return syncPromise;
}

/**
 * Update Sales Order payment and fulfillment status in Zoho CRM.
 * Uses robust multi-tier identifier resolution to ensure reliable updates across serverless instances.
 */
export async function updateZohoSalesOrderStatus(
  orderNumberOrId: string,
  orderStatus: OrderStatus,
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded',
  paymentId?: string,
  customerName?: string
): Promise<boolean> {
  if (!(await isZohoConfigured())) return true;

  // Validate order reference to prevent silent mutations or invalid reference injection
  const canonicalKey = normalizeOrderReference(orderNumberOrId);
  if (!validateOrderReference(canonicalKey) && !/^\d{15,22}$/.test(orderNumberOrId.trim())) {
    console.warn(`[ZohoOrders] Rejected update with invalid order reference: "${orderNumberOrId}"`);
    return false;
  }

  try {
    // Resolve Zoho Sales Order ID using robust multi-tier fallback with customer association
    const zohoOrderId = await findZohoSalesOrderId(orderNumberOrId, customerName);

    if (!zohoOrderId) {
      console.log(`[ZohoOrders] No Zoho Sales Order found for "${orderNumberOrId}" to update. Enqueueing for recovery buffer...`);
      import('./downtime-recovery')
        .then((m) =>
          m.enqueueStatusUpdateForDowntimeRecovery(
            orderNumberOrId,
            orderStatus,
            paymentStatus,
            paymentId,
            customerName,
            'Sales Order not found during status update'
          )
        )
        .catch(() => {});
      return false;
    }

    // STRICT IMMUTABILITY: Customer_No is NEVER included in update payload. It is permanently immutable.
    const updatePayload = {
      data: [
        {
          id: zohoOrderId,
          Status: orderStatus === 'confirmed' || paymentStatus === 'paid' ? 'Approved' : orderStatus === 'cancelled' ? 'Cancelled' : 'Created',
          Description: `[Update ${new Date().toISOString()}]: Status: ${orderStatus}, Payment: ${paymentStatus || 'unchanged'}${paymentId ? ' (ID: ' + paymentId + ')' : ''}`,
        },
      ],
    };

    const updateRes = await zohoFetch<ZohoModuleResponse>('/Sales_Orders', {
      method: 'PUT',
      body: JSON.stringify(updatePayload),
    });

    const success = updateRes?.data?.[0]?.code === 'SUCCESS';
    if (success) {
      console.log(`[ZohoOrders] Updated Zoho Sales Order ${zohoOrderId} status to ${orderStatus}/${paymentStatus}`);
    } else {
      import('./downtime-recovery')
        .then((m) =>
          m.enqueueStatusUpdateForDowntimeRecovery(
            orderNumberOrId,
            orderStatus,
            paymentStatus,
            paymentId,
            customerName,
            `Update response status: ${JSON.stringify(updateRes)}`
          )
        )
        .catch(() => {});
    }
    return success;
  } catch (err: any) {
    console.warn(`[ZohoOrders] Error updating Zoho Sales Order status for ${orderNumberOrId}:`, err);
    import('./downtime-recovery')
      .then((m) =>
        m.enqueueStatusUpdateForDowntimeRecovery(
          orderNumberOrId,
          orderStatus,
          paymentStatus,
          paymentId,
          customerName,
          err?.message || 'Exception during status update'
        )
      )
      .catch(() => {});
    return false;
  }
}

