import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/db/store';
import { verifyRazorpaySignature, isRazorpayConfigured } from '@/lib/payments/razorpay';
import { supabaseAdmin, supabase, isSupabaseConfigured } from '@/lib/db/supabase';

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

    // Cryptographic verification using HMAC SHA256
    const isValid = verifyRazorpaySignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!isValid) {
      // Record failed payment attempt
      if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
        const client = supabaseAdmin || supabase!;
        await client
          .from('orders')
          .update({
            payment_status: 'failed',
            notes: `Payment verification failed at ${new Date().toISOString()} (signature mismatch)`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }
      return NextResponse.json(
        { verified: false, error: 'Cryptographic signature mismatch. Payment cannot be verified.' },
        { status: 400 }
      );
    }

    // Mark as PAID only upon verified gateway confirmation
    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      const client = supabaseAdmin || supabase!;
      await client
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_id: razorpay_payment_id,
          order_status: 'confirmed',
          notes: `Verified Razorpay payment captured: ${razorpay_payment_id}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    } else {
      order.paymentStatus = 'paid';
      order.paymentId = razorpay_payment_id;
      order.orderStatus = 'confirmed';
      order.notes = `Verified Razorpay payment captured: ${razorpay_payment_id}`;
    }

    await updateOrderStatus(orderId, 'confirmed');

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
