import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/db/store';
import { verifyRazorpaySignature, isRazorpayConfigured } from '@/lib/payments/razorpay';
import { updateZohoSalesOrderStatus, syncOrderToZohoSalesOrder } from '@/lib/zoho/orders';

export async function POST(req: Request) {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing mandatory payment verification parameters.' },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (!isRazorpayConfigured) {
      return NextResponse.json(
        { error: 'Razorpay secret key is not configured in server environment.' },
        { status: 503 }
      );
    }

    // Fast idempotency: If order was already confirmed and paid, return success immediately
    if (order.paymentStatus === 'paid' && order.orderStatus === 'confirmed') {
      return NextResponse.json({
        success: true,
        verified: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: order.paymentId || razorpay_payment_id,
        idempotent: true,
      });
    }

    // Cryptographic verification using HMAC SHA256
    const isValid = verifyRazorpaySignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!isValid) {
      // Do NOT cancel an order if it was already marked paid by concurrent webhook
      if (order.paymentStatus === 'paid' || order.orderStatus === 'confirmed') {
        return NextResponse.json(
          { verified: false, error: 'Signature mismatch, but order is already verified.' },
          { status: 400 }
        );
      }

      // Record failed payment attempt
      order.paymentStatus = 'failed';
      order.notes = `Payment verification failed at ${new Date().toISOString()} (signature mismatch)`;
      order.updatedAt = new Date().toISOString();

      updateZohoSalesOrderStatus(order.orderNumber, 'cancelled', 'failed', undefined, order.customerName).catch((e) =>
        console.warn('[Razorpay Verify] Zoho Sales Order update error:', e)
      );

      return NextResponse.json(
        { verified: false, error: 'Cryptographic signature mismatch. Payment cannot be verified.' },
        { status: 400 }
      );
    }

    // Mark as PAID only upon verified gateway confirmation
    order.paymentStatus = 'paid';
    order.paymentId = razorpay_payment_id;
    order.orderStatus = 'confirmed';
    order.notes = `Verified Razorpay payment captured: ${razorpay_payment_id}`;
    order.updatedAt = new Date().toISOString();

    await updateOrderStatus(orderId, 'confirmed');

    // Update authoritative Sales Order in Zoho CRM with paid status, or create if missing
    updateZohoSalesOrderStatus(order.orderNumber, 'confirmed', 'paid', razorpay_payment_id, order.customerName)
      .then(async (updated) => {
        if (!updated) {
          console.log(`[Razorpay Verify] Sales Order #${order.orderNumber} not found to update. Creating authoritative Sales Order in Zoho CRM now...`);
          await syncOrderToZohoSalesOrder(order);
        }
      })
      .catch((e) =>
        console.warn('[Razorpay Verify] Zoho Sales Order sync error:', e)
      );

    return NextResponse.json({
      success: true,
      verified: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: razorpay_payment_id,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error during payment verification.' },
      { status: 500 }
    );
  }
}
