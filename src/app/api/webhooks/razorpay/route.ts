import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay';
import { getOrderByNumber, getOrderById, updateOrderStatus } from '@/lib/db/store';
import { updateZohoSalesOrderStatus, syncOrderToZohoSalesOrder } from '@/lib/zoho/orders';

// In-memory set of processed webhook event IDs to guarantee idempotency across retries
const processedEvents = new Set<string>();

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header.' }, { status: 400 });
    }

    // Verify HMAC SHA256 webhook signature
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.payload?.payment?.entity?.id;

    // Idempotency check: Ignore duplicate events already handled
    if (eventId && processedEvents.has(eventId)) {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const receipt = orderEntity?.receipt || paymentEntity?.notes?.receipt;
    const internalOrderId = paymentEntity?.notes?.orderId;

    if (internalOrderId || receipt) {
      const order = internalOrderId
        ? await getOrderById(internalOrderId)
        : receipt
        ? await getOrderByNumber(receipt)
        : null;

      if (order) {
        if (event === 'payment.captured' || event === 'order.paid') {
          const paymentId = paymentEntity?.id || orderEntity?.id;

          // If order is already paid, idempotently ensure Zoho CRM status is synced without state duplication
          const wasAlreadyPaid = order.paymentStatus === 'paid' && order.orderStatus === 'confirmed';

          order.paymentStatus = 'paid';
          order.paymentId = paymentId;
          order.orderStatus = 'confirmed';
          order.notes = wasAlreadyPaid
            ? order.notes || `Payment confirmed: ${paymentId}`
            : `Payment captured via Razorpay webhook: ${paymentId}`;
          order.updatedAt = new Date().toISOString();

          await updateOrderStatus(order.id, 'confirmed');

          // Ensure authoritative Sales Order exists in Zoho CRM with paid status (prefer direct zohoSalesOrderId if present)
          const zohoTarget = order.zohoSalesOrderId || order.orderNumber;
          updateZohoSalesOrderStatus(zohoTarget, 'confirmed', 'paid', paymentId, order.customerName)
            .then(async (updated) => {
              if (!updated) {
                console.log(`[Razorpay Webhook] Sales Order #${order.orderNumber} not found to update. Creating authoritative Sales Order in Zoho CRM now...`);
                const res = await syncOrderToZohoSalesOrder(order);
                if (res.salesOrderId) {
                  order.zohoSalesOrderId = res.salesOrderId;
                }
              }
            })
            .catch((e) =>
              console.warn('[Razorpay Webhook] Zoho Sales Order update error:', e)
            );
        } else if (event === 'payment.failed') {
          // CRITICAL: Never downgrade an already confirmed or paid order to failed
          if (order.paymentStatus === 'paid' || order.orderStatus === 'confirmed') {
            console.log(`[Razorpay Webhook] Ignoring delayed payment.failed event for already paid/confirmed order #${order.orderNumber}`);
            return NextResponse.json({ received: true, ignored: true, reason: 'Order already paid/confirmed' });
          }

          const reason = paymentEntity?.error_description || 'Payment transaction failed';
          order.paymentStatus = 'failed';
          order.notes = `Payment failed: ${reason}`;
          order.updatedAt = new Date().toISOString();

          updateZohoSalesOrderStatus(order.orderNumber, 'cancelled', 'failed', undefined, order.customerName).catch((e) =>
            console.warn('[Razorpay Webhook] Zoho Sales Order update error:', e)
          );
        }
      }
    }

    if (eventId) {
      processedEvents.add(eventId);
    }

    return NextResponse.json({ status: 'ok', event });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error processing webhook event.' },
      { status: 500 }
    );
  }
}
