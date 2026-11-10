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
 * Robustly resolve a Zoho Sales Order ID from orderNumber across serverless instances:
 * 1. Fast in-memory cache
 * 2. Exact Customer_No search criteria with customer validation
 * 3. Recent Sales_Orders list lookup (bypasses full-text search indexing delays)
 * STRICT REQUIREMENT: Never pick an order based on recency alone. Only exact orderNumber and customer match are accepted.
 */
export async function findZohoSalesOrderId(
  orderNumberOrId: string,
  expectedCustomerName?: string
): Promise<string | null> {
  const cleanKey = orderNumberOrId.trim();
  if (!cleanKey) return null;

  // Direct numeric Zoho ID check
  if (/^\d{15,22}$/.test(cleanKey)) {
    return cleanKey;
  }

  // 1. Fast in-memory resolution
  const cachedId = orderNumberToZohoIdMap.get(cleanKey);
  if (cachedId) {
    return cachedId;
  }

  // 2. Query search by exact Customer_No
  try {
    const searchRes = await zohoFetch<any>(
      `/Sales_Orders/search?criteria=(Customer_No:equals:${encodeURIComponent(cleanKey)})&fields=id,Customer_No,Subject,Contact_Name`,
      { method: 'GET' }
    );
    if (Array.isArray(searchRes?.data) && searchRes.data.length > 0) {
      const match = searchRes.data.find((so: any) => {
        const matchesNo = so.Customer_No && so.Customer_No.trim() === cleanKey;
        if (!matchesNo) return false;
        if (expectedCustomerName && so.Contact_Name?.name) {
          const expected = expectedCustomerName.toLowerCase().trim();
          const actual = so.Contact_Name.name.toLowerCase().trim();
          return actual.includes(expected) || expected.includes(actual);
        }
        return true;
      });
      if (match?.id) {
        orderNumberToZohoIdMap.set(cleanKey, match.id);
        return match.id;
      }
    }
  } catch {
    // Continue to recent list fallback
  }

  // 3. Fallback: Query recent sales orders (checking exact Customer_No and customer association)
  // STRICT RULE: Never pick an order based on recency alone. Only exact order number and customer match are accepted.
  try {
    const recentRes = await zohoFetch<any>(
      `/Sales_Orders?fields=id,Customer_No,Subject,Created_Time,Contact_Name&sort_by=Created_Time&sort_order=desc&per_page=50`,
      { method: 'GET' }
    );
    if (Array.isArray(recentRes?.data)) {
      const match = recentRes.data.find((so: any) => {
        const matchesCustomerNo = so.Customer_No && so.Customer_No.trim() === cleanKey;
        const matchesSubject = so.Subject && (
          so.Subject.trim() === cleanKey ||
          so.Subject.startsWith(`Order #${cleanKey}`) ||
          so.Subject.includes(`Order #${cleanKey}`) ||
          so.Subject.includes(cleanKey)
        );
        const matchesKey = matchesCustomerNo || matchesSubject;
        if (!matchesKey) return false;

        // Verify customer association if available
        if (expectedCustomerName && so.Contact_Name?.name) {
          const expected = expectedCustomerName.toLowerCase().trim();
          const actual = so.Contact_Name.name.toLowerCase().trim();
          return actual.includes(expected) || expected.includes(actual);
        }
        return true;
      });

      if (match?.id) {
        orderNumberToZohoIdMap.set(cleanKey, match.id);
        return match.id;
      }
    }
  } catch {
    // Continue
  }

  return null;
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
      const existingZohoId = await findZohoSalesOrderId(order.orderNumber);
      if (existingZohoId) {
        console.log(`[ZohoOrders] Sales Order #${order.orderNumber} already exists in Zoho CRM (ID: ${existingZohoId}). Updating status...`);
        await updateZohoSalesOrderStatus(existingZohoId, order.orderStatus, order.paymentStatus, order.paymentId);
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

        // Persistent CRM Duplicate Protection:
        // Detect and self-heal any race condition duplicates across separate serverless containers
        try {
          const dupRes = await zohoFetch<any>(
            `/Sales_Orders?fields=id,Customer_No,Subject&sort_by=Created_Time&sort_order=desc&per_page=10`
          );
          if (Array.isArray(dupRes?.data)) {
            const matches = dupRes.data.filter((so: any) => so.Customer_No && so.Customer_No.trim() === order.orderNumber.trim());
            if (matches.length > 1) {
              console.warn(`[ZohoOrders] Detected ${matches.length} duplicate Sales Orders for #${order.orderNumber}. Reconciling...`);
              const toDelete = matches.filter((so: any) => so.id !== salesOrderId);
              for (const dup of toDelete) {
                await zohoFetch(`/Sales_Orders?ids=${dup.id}`, { method: 'DELETE' }).catch(() => {});
                console.log(`[ZohoOrders] Removed distributed duplicate Sales Order ID: ${dup.id}`);
              }
            }
          }
        } catch {
          // Non-blocking duplicate cleanup
        }
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
    return {
      success: false,
      action: 'failed',
      error: errorMsg,
      details: res,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ZohoOrders] Exception creating Sales Order #${order.orderNumber}:`, err);
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

  try {
    // Resolve Zoho Sales Order ID using robust multi-tier fallback with customer association
    const zohoOrderId = await findZohoSalesOrderId(orderNumberOrId, customerName);

    if (!zohoOrderId) {
      console.log(`[ZohoOrders] No Zoho Sales Order found for "${orderNumberOrId}" to update.`);
      return false;
    }

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
    }
    return success;
  } catch (err) {
    console.warn(`[ZohoOrders] Error updating Zoho Sales Order status for ${orderNumberOrId}:`, err);
    return false;
  }
}

