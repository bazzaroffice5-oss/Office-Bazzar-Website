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

/**
 * Map an internal website Order to Zoho CRM Sales_Orders payload
 */
export async function syncOrderToZohoSalesOrder(order: Order): Promise<ZohoOrderSyncResult> {
  if (!(await isZohoConfigured())) {
    console.log('[ZohoOrders] Zoho CRM unconfigured. Order persisted in runtime store:', order.orderNumber);
    return {
      success: true,
      action: 'skipped',
    };
  }

  try {
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

    // 2. Prepare Product_Details line items mapped to Zoho Product IDs
    const productDetails = order.items.map((it) => {
      const zohoProdId = getZohoProductId(it.productId) || getZohoProductId(it.sku);
      const lineTotal = it.unitPrice * it.quantity;
      const taxAmount = (lineTotal * (it.gstPercent || 18)) / 100;

      return {
        product: zohoProdId ? { id: zohoProdId } : undefined,
        product_description: `${it.productName} (SKU: ${it.sku}${it.packSize ? ', Pack: ' + it.packSize : ''})`,
        quantity: it.quantity,
        list_price: it.unitPrice,
        unit_price: it.unitPrice,
        total: lineTotal,
        net_total: lineTotal + taxAmount,
        Tax: taxAmount,
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
          Product_Details: productDetails,
          Sub_Total: order.subtotal,
          Tax: order.gstAmount,
          Discount: order.discountAmount || 0,
          Adjustment: order.shippingCharge || 0,
          Grand_Total: order.totalAmount,
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
  }
}

/**
 * Update Sales Order payment and fulfillment status in Zoho CRM
 */
export async function updateZohoSalesOrderStatus(
  orderNumberOrId: string,
  orderStatus: OrderStatus,
  paymentStatus?: 'paid' | 'pending' | 'failed',
  paymentId?: string
): Promise<boolean> {
  if (!(await isZohoConfigured())) return true;

  try {
    // Search for existing Sales Order by Customer_No or Subject
    const searchRes = await zohoFetch<any>(
      `/Sales_Orders/search?criteria=(Customer_No:equals:${encodeURIComponent(orderNumberOrId)})`,
      { method: 'GET' }
    );

    const zohoOrder = searchRes?.data?.[0];
    if (!zohoOrder?.id) {
      console.log(`[ZohoOrders] No Zoho Sales Order found with Customer_No "${orderNumberOrId}" to update.`);
      return false;
    }

    const updatePayload = {
      data: [
        {
          id: zohoOrder.id,
          Status: orderStatus === 'confirmed' || paymentStatus === 'paid' ? 'Approved' : orderStatus === 'cancelled' ? 'Cancelled' : 'Created',
          Description: `${zohoOrder.Description || ''}\n[Update ${new Date().toISOString()}]: Status: ${orderStatus}, Payment: ${paymentStatus || 'unchanged'}${paymentId ? ' (ID: ' + paymentId + ')' : ''}`,
        },
      ],
    };

    const updateRes = await zohoFetch<ZohoModuleResponse>('/Sales_Orders', {
      method: 'PUT',
      body: JSON.stringify(updatePayload),
    });

    const success = updateRes?.data?.[0]?.code === 'SUCCESS';
    if (success) {
      console.log(`[ZohoOrders] Updated Zoho Sales Order ${zohoOrder.id} status to ${orderStatus}/${paymentStatus}`);
    }
    return success;
  } catch (err) {
    console.warn(`[ZohoOrders] Error updating Zoho Sales Order status for ${orderNumberOrId}:`, err);
    return false;
  }
}

