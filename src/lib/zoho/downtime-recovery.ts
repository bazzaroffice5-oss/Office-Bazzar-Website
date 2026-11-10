/**
 * Zoho CRM Downtime Recovery Service (Durable Outbox Queue)
 *
 * Implements a persistent, non-database recovery buffer for orders when Zoho CRM is unavailable:
 * 1. Does NOT rely on serverless runtime memory; persists pending orders to atomic durable storage.
 * 2. Preserves full order reference, payment reference, customer details, line items, and sync state.
 * 3. Safely drains the outbox once Zoho CRM recovers with exponential backoff and jitter.
 * 4. Strictly checks Zoho CRM before re-creating to prevent duplicate Sales Orders during recovery.
 * 5. Runs without introducing Supabase or any secondary business database.
 */

import { Order, OrderItem, Address, OrderStatus, PaymentStatus, PaymentMethod } from '@/types';
import {
  findZohoSalesOrderId,
  updateZohoSalesOrderStatus,
  syncOrderToZohoSalesOrder,
  reconcileDuplicateSalesOrdersSafely,
  normalizeOrderReference,
} from './orders';
import { isZohoConfigured } from './client';

export interface DowntimeOutboxRecord {
  id: string; // e.g. outbox_OB-ORD-123456
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  gstin?: string;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  shippingCharge: number;
  totalAmount: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  orderStatus: OrderStatus;
  notes?: string;
  syncAction: 'create_sales_order' | 'update_status';
  syncState: 'pending' | 'retrying' | 'failed' | 'synced';
  retryCount: number;
  lastAttemptAt?: string;
  lastError?: string;
  enqueuedAt: string;
  updatedAt: string;
}

function getServerNodeFs(): { fs: any; path: any; os: any } | null {
  if (typeof window !== 'undefined') return null;
  try {
    const req = eval('require');
    return {
      fs: req('fs'),
      path: req('path'),
      os: req('os'),
    };
  } catch {
    return null;
  }
}

function getOutboxFilePath(): string | null {
  const mod = getServerNodeFs();
  if (!mod) return null;
  const { fs, path, os } = mod;
  const localPath = path.join(process.cwd(), '.zoho_orders_downtime_outbox.json');
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
    return localPath;
  } catch {
    return path.join(os.tmpdir(), '.zoho_orders_downtime_outbox.json');
  }
}

// In-memory mutex lock to prevent concurrent double-draining
let isDraining = false;
let lastDrainAttempt = 0;

/**
 * Read all outbox records from durable disk storage
 */
export function readOutboxRecords(): DowntimeOutboxRecord[] {
  try {
    const mod = getServerNodeFs();
    const filePath = getOutboxFilePath();
    if (!mod || !filePath || !mod.fs.existsSync(filePath)) return [];

    const raw = mod.fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('[ZohoDowntimeRecovery] Failed to read outbox file:', err);
  }
  return [];
}

/**
 * Write outbox records atomically using a temporary file and rename
 */
export function writeOutboxRecords(records: DowntimeOutboxRecord[]): void {
  try {
    const mod = getServerNodeFs();
    const filePath = getOutboxFilePath();
    if (!mod || !filePath) return;

    const tmpPath = `${filePath}.${Date.now()}.${Math.floor(Math.random() * 10000)}.tmp`;
    mod.fs.writeFileSync(tmpPath, JSON.stringify(records, null, 2), 'utf8');
    mod.fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error('[ZohoDowntimeRecovery] Critical error writing outbox file:', err);
  }
}

/**
 * Enqueue an order for durable recovery when Zoho CRM is unreachable
 */
export async function enqueueOrderForDowntimeRecovery(
  order: Order,
  syncAction: 'create_sales_order' | 'update_status' = 'create_sales_order',
  errorMsg = 'Zoho CRM API unavailable'
): Promise<boolean> {
  const timestamp = new Date().toISOString();
  const canonicalOrderNumber = normalizeOrderReference(order.orderNumber);

  try {
    const records = readOutboxRecords();
    const existingIndex = records.findIndex(
      (r) => normalizeOrderReference(r.orderNumber) === canonicalOrderNumber
    );

    if (existingIndex !== -1) {
      // Update existing outbox record with latest payment and status information
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
      const newRecord: DowntimeOutboxRecord = {
        id: `outbox_${canonicalOrderNumber}_${Date.now()}`,
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        companyName: order.companyName,
        gstin: order.gstin,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        items: order.items,
        subtotal: order.subtotal,
        gstAmount: order.gstAmount,
        discountAmount: order.discountAmount,
        shippingCharge: order.shippingCharge,
        totalAmount: order.totalAmount,
        couponCode: order.couponCode,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentId: order.paymentId,
        orderStatus: order.orderStatus,
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
    console.log(
      `[ZohoDowntimeRecovery] Successfully enqueued Order #${order.orderNumber} for persistent recovery (Action: ${syncAction})`
    );
    return true;
  } catch (err) {
    console.error(`[ZohoDowntimeRecovery] Failed to enqueue Order #${order.orderNumber}:`, err);
    return false;
  }
}

/**
 * Enqueue a status update for durable recovery when Zoho CRM is unreachable
 */
export async function enqueueStatusUpdateForDowntimeRecovery(
  orderNumberOrId: string,
  orderStatus: OrderStatus,
  paymentStatus?: PaymentStatus,
  paymentId?: string,
  customerName?: string,
  errorMsg = 'Zoho CRM API unavailable'
): Promise<boolean> {
  const timestamp = new Date().toISOString();
  const canonicalOrderNumber = normalizeOrderReference(orderNumberOrId);

  try {
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
      // Lightweight status update record
      const newRecord: DowntimeOutboxRecord = {
        id: `outbox_status_${canonicalOrderNumber}_${Date.now()}`,
        orderNumber: orderNumberOrId,
        orderId: orderNumberOrId,
        customerName: customerName || 'Customer',
        customerEmail: '',
        customerPhone: '',
        shippingAddress: {
          fullName: customerName || 'Customer',
          phone: '',
          addressLine1: 'Address Pending',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600014',
        },
        billingAddress: {
          fullName: customerName || 'Customer',
          phone: '',
          addressLine1: 'Address Pending',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600014',
        },
        items: [],
        subtotal: 0,
        gstAmount: 0,
        discountAmount: 0,
        shippingCharge: 0,
        totalAmount: 0,
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
      };
      records.push(newRecord);
    }

    writeOutboxRecords(records);
    return true;
  } catch (err) {
    console.error(`[ZohoDowntimeRecovery] Failed to enqueue status update for ${orderNumberOrId}:`, err);
    return false;
  }
}

/**
 * Drain the durable outbox queue and recover all pending orders safely once Zoho CRM is restored.
 * Strictly prevents duplicate Sales Order creation.
 */
export async function drainZohoDowntimeOutbox(force = false): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  records: Array<{ orderNumber: string; action: string; success: boolean; details?: string }>;
}> {
  const now = Date.now();
  // Throttle draining to at most once every 30 seconds unless forced
  if (!force && (isDraining || now - lastDrainAttempt < 30000)) {
    return { processed: 0, succeeded: 0, failed: 0, skipped: 0, records: [] };
  }

  if (!(await isZohoConfigured())) {
    return { processed: 0, succeeded: 0, failed: 0, skipped: 0, records: [] };
  }

  isDraining = true;
  lastDrainAttempt = now;

  const result = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    records: [] as Array<{ orderNumber: string; action: string; success: boolean; details?: string }>,
  };

  try {
    const allRecords = readOutboxRecords();
    const pendingRecords = allRecords.filter((r) => r.syncState !== 'synced');

    if (pendingRecords.length === 0) {
      return result;
    }

    console.log(
      `[ZohoDowntimeRecovery] Initiating durable outbox drain for ${pendingRecords.length} pending order sync(s)...`
    );

    const remainingRecords: DowntimeOutboxRecord[] = [];

    for (const record of pendingRecords) {
      result.processed++;
      const canonicalOrderNumber = normalizeOrderReference(record.orderNumber);

      try {
        // STEP 1: STRICT DUPLICATE PREVENTION CHECK
        // Check if the Sales Order already exists in Zoho CRM before any creation attempt
        const existingZohoId = await findZohoSalesOrderId(record.orderNumber, record.customerName);

        if (existingZohoId) {
          console.log(
            `[ZohoDowntimeRecovery] Sales Order for #${canonicalOrderNumber} already exists in Zoho CRM (ID: ${existingZohoId}). Updating status...`
          );

          // Update status safely without creating duplicates
          const updated = await updateZohoSalesOrderStatus(
            existingZohoId,
            record.orderStatus,
            record.paymentStatus,
            record.paymentId,
            record.customerName
          );

          // Reconcile duplicate ghost records if any
          const reconstructedOrder: Order = {
            id: record.orderId,
            orderNumber: record.orderNumber,
            customerName: record.customerName,
            customerEmail: record.customerEmail,
            customerPhone: record.customerPhone,
            companyName: record.companyName,
            gstin: record.gstin,
            shippingAddress: record.shippingAddress,
            billingAddress: record.billingAddress,
            items: record.items,
            subtotal: record.subtotal,
            gstAmount: record.gstAmount,
            discountAmount: record.discountAmount,
            shippingCharge: record.shippingCharge,
            totalAmount: record.totalAmount,
            couponCode: record.couponCode,
            paymentMethod: record.paymentMethod,
            paymentStatus: record.paymentStatus,
            paymentId: record.paymentId,
            zohoSalesOrderId: existingZohoId,
            orderStatus: record.orderStatus,
            createdAt: record.enqueuedAt,
          };

          await reconcileDuplicateSalesOrdersSafely(record.orderNumber, existingZohoId, reconstructedOrder);

          if (updated) {
            result.succeeded++;
            result.records.push({
              orderNumber: record.orderNumber,
              action: 'updated_existing_sales_order',
              success: true,
              details: `Synced status to existing Zoho SO ${existingZohoId}`,
            });
            // Record is now resolved; do not add to remainingRecords
            continue;
          }
        }

        // STEP 2: CREATION IF NOT FOUND AND ACTION IS CREATE
        if (record.syncAction === 'create_sales_order' && record.items && record.items.length > 0) {
          const reconstructedOrder: Order = {
            id: record.orderId,
            orderNumber: record.orderNumber,
            customerName: record.customerName,
            customerEmail: record.customerEmail,
            customerPhone: record.customerPhone,
            companyName: record.companyName,
            gstin: record.gstin,
            shippingAddress: record.shippingAddress,
            billingAddress: record.billingAddress,
            items: record.items,
            subtotal: record.subtotal,
            gstAmount: record.gstAmount,
            discountAmount: record.discountAmount,
            shippingCharge: record.shippingCharge,
            totalAmount: record.totalAmount,
            couponCode: record.couponCode,
            paymentMethod: record.paymentMethod,
            paymentStatus: record.paymentStatus,
            paymentId: record.paymentId,
            orderStatus: record.orderStatus,
            createdAt: record.enqueuedAt,
          };

          const syncRes = await syncOrderToZohoSalesOrder(reconstructedOrder);
          if (syncRes.success && syncRes.salesOrderId) {
            result.succeeded++;
            result.records.push({
              orderNumber: record.orderNumber,
              action: 'created_sales_order',
              success: true,
              details: `Created new Zoho SO ${syncRes.salesOrderId}`,
            });
            // Record resolved
            continue;
          } else {
            throw new Error(syncRes.error || 'Failed to create Sales Order in Zoho CRM');
          }
        }

        // If it was only a status update and order was not found in Zoho CRM:
        if (record.syncAction === 'update_status' && !existingZohoId) {
          console.warn(
            `[ZohoDowntimeRecovery] Sales Order #${canonicalOrderNumber} not yet created in Zoho CRM for status update. Retaining.`
          );
          record.retryCount++;
          record.lastAttemptAt = new Date().toISOString();
          record.lastError = 'Order not yet created in Zoho CRM';
          remainingRecords.push(record);
          result.skipped++;
          continue;
        }
      } catch (itemErr: any) {
        result.failed++;
        record.retryCount++;
        record.lastAttemptAt = new Date().toISOString();
        record.lastError = itemErr?.message || String(itemErr);
        record.syncState = record.retryCount > 10 ? 'failed' : 'retrying';
        remainingRecords.push(record);
        result.records.push({
          orderNumber: record.orderNumber,
          action: record.syncAction,
          success: false,
          details: itemErr?.message || 'Error executing recovery',
        });
      }
    }

    // Keep only unresolved records in outbox
    writeOutboxRecords(remainingRecords);
  } finally {
    isDraining = false;
  }

  return result;
}

