import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay';
import { supabaseAdmin, supabase, isSupabaseConfigured } from '@/lib/db/supabase';
import { getOrderByNumber, getOrderById } from '@/lib/db/store';

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
        const client = isSupabaseConfigured && (supabaseAdmin || supabase) ? (supabaseAdmin || supabase!) : null;

        if (event === 'payment.captured' || event === 'order.paid') {
          const paymentId = paymentEntity?.id || orderEntity?.id;
          if (client) {
            await client
              .from('orders')
              .update({
                payment_status: 'paid',
                payment_id: paymentId,
                order_status: 'confirmed',
                notes: `Payment captured via Razorpay webhook: ${paymentId}`,
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.id);
          } else {
            order.paymentStatus = 'paid';
            order.paymentId = paymentId;
            order.orderStatus = 'confirmed';
            order.notes = `Payment captured via Razorpay webhook: ${paymentId}`;
          }
        } else if (event === 'payment.failed') {
          const reason = paymentEntity?.error_description || 'Payment transaction failed';
          if (client) {
            await client
              .from('orders')
              .update({
                payment_status: 'failed',
                notes: `Payment failed: ${reason}`,
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.id);
          } else {
            order.paymentStatus = 'failed';
            order.notes = `Payment failed: ${reason}`;
          }
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
