/**
 * Razorpay Payment Reconciliation Service
 *
 * Implements scheduled and on-demand payment reconciliation:
 * 1. Queries pending online orders directly against Razorpay API servers.
 * 2. Fetches recently captured gateway payments to recover missed or delayed webhook events.
 * 3. Enforces verified gateway confirmation (status === 'captured') before marking any order as paid.
 * 4. Ensures exactly one Zoho CRM Sales Order is updated per payment reference without duplication.
 * 5. Records immutable audit trail entries for administrative oversight.
 */

import { getAllOrders, updateOrderStatus } from '@/lib/db/store';
import { razorpayInstance, isRazorpayConfigured } from '@/lib/payments/razorpay';
import {
  updateZohoSalesOrderStatus,
  syncOrderToZohoSalesOrder,
  reconcileDuplicateSalesOrdersSafely,
  normalizeOrderReference,
} from '@/lib/zoho/orders';

export interface ReconciliationResult {
  timestamp: string;
  isGatewayConfigured: boolean;
  totalOrdersScanned: number;
  pendingOrdersEvaluated: number;
  reconciledCount: number;
  alreadyPaidCount: number;
  unresolvedCount: number;
  reconciledOrders: Array<{
    orderNumber: string;
    orderId: string;
    paymentId: string;
    razorpayOrderId?: string;
    amount: number;
    zohoSalesOrderId?: string;
    recoverySource: 'payment_collection' | 'order_payments';
  }>;
  errors: string[];
}

/**
 * Reconcile all pending online orders against Razorpay.
 * Can be triggered via scheduled Vercel Cron, administrative API, or health monitor.
 */
export async function reconcilePendingPayments(): Promise<ReconciliationResult> {
  const timestamp = new Date().toISOString();

  const summary: ReconciliationResult = {
    timestamp,
    isGatewayConfigured: isRazorpayConfigured,
    totalOrdersScanned: 0,
    pendingOrdersEvaluated: 0,
    reconciledCount: 0,
    alreadyPaidCount: 0,
    unresolvedCount: 0,
    reconciledOrders: [],
    errors: [],
  };

  if (!isRazorpayConfigured || !razorpayInstance) {
    summary.errors.push('Razorpay gateway credentials are not configured in environment.');
    return summary;
  }

  try {
    const allOrders = await getAllOrders();
    summary.totalOrdersScanned = allOrders.length;

    // Filter to online orders that are pending payment
    const pendingOrders = allOrders.filter(
      (o) =>
        (o.paymentMethod === 'online_razorpay' || !o.paymentMethod) &&
        o.paymentStatus !== 'paid' &&
        o.orderStatus !== 'cancelled'
    );

    summary.pendingOrdersEvaluated = pendingOrders.length;

    // 1. Fetch recent captured payments directly from Razorpay (recovering missed webhooks)
    let recentPayments: any[] = [];
    try {
      const response = await razorpayInstance.payments.all({ count: 50 });
      if (Array.isArray(response?.items)) {
        recentPayments = response.items;
      }
    } catch (err: any) {
      summary.errors.push(`Failed to fetch recent payments from Razorpay: ${err?.message || err}`);
    }

    // Process recent captured payments
    for (const payment of recentPayments) {
      if (payment.status !== 'captured') continue;

      const paymentId = payment.id;
      const rzpOrderId = payment.order_id;
      const receipt = payment.notes?.receipt || payment.notes?.orderNumber;
      const internalOrderId = payment.notes?.orderId;

      // Find matching pending order in system
      const matchedOrder = pendingOrders.find((o) => {
        if (internalOrderId && o.id === internalOrderId) return true;
        if (receipt && normalizeOrderReference(o.orderNumber) === normalizeOrderReference(receipt)) return true;
        if (rzpOrderId && o.razorpayOrderId === rzpOrderId) return true;
        return false;
      });

      if (matchedOrder && matchedOrder.paymentStatus !== 'paid') {
        const expectedPaise = Math.round(matchedOrder.totalAmount * 100);
        // Verify payment amount matches order (allow up to ₹1.00 tolerance for rounding differences)
        if (Math.abs(payment.amount - expectedPaise) > 100) {
          summary.errors.push(
            `Amount mismatch for order #${matchedOrder.orderNumber}: Expected ₹${matchedOrder.totalAmount} (${expectedPaise} paise), Gateway captured: ${payment.amount} paise.`
          );
          continue;
        }

        console.log(
          `[Payment Reconciliation] Verified captured gateway payment ${paymentId} for pending Order #${matchedOrder.orderNumber}`
        );

        // Update Order safely with verified gateway confirmation
        matchedOrder.paymentStatus = 'paid';
        matchedOrder.paymentId = paymentId;
        matchedOrder.orderStatus = 'confirmed';
        matchedOrder.updatedAt = timestamp;
        matchedOrder.notes = `[Reconciled via Razorpay API ${timestamp}]: Captured payment ${paymentId}`;

        if (!matchedOrder.auditTrail) matchedOrder.auditTrail = [];
        matchedOrder.auditTrail.push({
          timestamp,
          action: 'payment_reconciliation_gateway_recovery',
          previousValue: 'pending',
          newValue: 'paid',
          reason: `Recovered missed webhook from Razorpay API. Captured Payment: ${paymentId}`,
          actor: 'razorpay_reconciliation_worker',
        });

        await updateOrderStatus(matchedOrder.id, 'confirmed');

        // Synchronize and update authoritative Sales Order in Zoho CRM
        let zohoSalesOrderId = matchedOrder.zohoSalesOrderId;
        try {
          const zohoTarget = zohoSalesOrderId || matchedOrder.orderNumber;
          const updated = await updateZohoSalesOrderStatus(
            zohoTarget,
            'confirmed',
            'paid',
            paymentId,
            matchedOrder.customerName
          );

          if (!updated) {
            const syncRes = await syncOrderToZohoSalesOrder(matchedOrder);
            if (syncRes.salesOrderId) {
              matchedOrder.zohoSalesOrderId = syncRes.salesOrderId;
              zohoSalesOrderId = syncRes.salesOrderId;
            }
          }

          if (zohoSalesOrderId) {
            await reconcileDuplicateSalesOrdersSafely(
              matchedOrder.orderNumber,
              zohoSalesOrderId,
              matchedOrder
            );
          }
        } catch (crmErr: any) {
          summary.errors.push(
            `CRM sync warning for reconciled order #${matchedOrder.orderNumber}: ${crmErr?.message || crmErr}`
          );
        }

        summary.reconciledCount++;
        summary.reconciledOrders.push({
          orderNumber: matchedOrder.orderNumber,
          orderId: matchedOrder.id,
          paymentId,
          razorpayOrderId: rzpOrderId,
          amount: matchedOrder.totalAmount,
          zohoSalesOrderId,
          recoverySource: 'payment_collection',
        });
      }
    }

    // 2. For remaining pending orders with known razorpayOrderId, check order payments directly
    for (const pendingOrder of pendingOrders) {
      if (pendingOrder.paymentStatus === 'paid') {
        summary.alreadyPaidCount++;
        continue;
      }

      if (!pendingOrder.razorpayOrderId) {
        summary.unresolvedCount++;
        continue;
      }

      try {
        const orderPayments = await razorpayInstance.orders.fetchPayments(pendingOrder.razorpayOrderId);
        const paymentsList: any[] = Array.isArray(orderPayments?.items) ? orderPayments.items : [];

        const captured = paymentsList.find((p: any) => p.status === 'captured');
        if (captured) {
          const paymentId = captured.id;
          const expectedPaise = Math.round(pendingOrder.totalAmount * 100);

          if (Math.abs(captured.amount - expectedPaise) <= 100) {
            console.log(
              `[Payment Reconciliation] Order-level check found captured payment ${paymentId} for Order #${pendingOrder.orderNumber}`
            );

            pendingOrder.paymentStatus = 'paid';
            pendingOrder.paymentId = paymentId;
            pendingOrder.orderStatus = 'confirmed';
            pendingOrder.updatedAt = timestamp;
            pendingOrder.notes = `[Reconciled via Razorpay Order Payments ${timestamp}]: Captured ${paymentId}`;

            if (!pendingOrder.auditTrail) pendingOrder.auditTrail = [];
            pendingOrder.auditTrail.push({
              timestamp,
              action: 'payment_reconciliation_gateway_recovery',
              previousValue: 'pending',
              newValue: 'paid',
              reason: `Recovered via Razorpay order payments check. Payment: ${paymentId}`,
              actor: 'razorpay_reconciliation_worker',
            });

            await updateOrderStatus(pendingOrder.id, 'confirmed');

            let zohoSalesOrderId = pendingOrder.zohoSalesOrderId;
            try {
              const zohoTarget = zohoSalesOrderId || pendingOrder.orderNumber;
              const updated = await updateZohoSalesOrderStatus(
                zohoTarget,
                'confirmed',
                'paid',
                paymentId,
                pendingOrder.customerName
              );

              if (!updated) {
                const syncRes = await syncOrderToZohoSalesOrder(pendingOrder);
                if (syncRes.salesOrderId) {
                  pendingOrder.zohoSalesOrderId = syncRes.salesOrderId;
                  zohoSalesOrderId = syncRes.salesOrderId;
                }
              }

              if (zohoSalesOrderId) {
                await reconcileDuplicateSalesOrdersSafely(
                  pendingOrder.orderNumber,
                  zohoSalesOrderId,
                  pendingOrder
                );
              }
            } catch (crmErr: any) {
              summary.errors.push(
                `CRM sync warning for order #${pendingOrder.orderNumber}: ${crmErr?.message || crmErr}`
              );
            }

            summary.reconciledCount++;
            summary.reconciledOrders.push({
              orderNumber: pendingOrder.orderNumber,
              orderId: pendingOrder.id,
              paymentId,
              razorpayOrderId: pendingOrder.razorpayOrderId,
              amount: pendingOrder.totalAmount,
              zohoSalesOrderId,
              recoverySource: 'order_payments',
            });
            continue;
          }
        }

        summary.unresolvedCount++;
      } catch (err: any) {
        summary.unresolvedCount++;
        summary.errors.push(
          `Failed fetching payments for Razorpay order ${pendingOrder.razorpayOrderId}: ${err?.message || err}`
        );
      }
    }
  } catch (err: any) {
    summary.errors.push(`Critical reconciliation failure: ${err?.message || err}`);
  }

  return summary;
}

