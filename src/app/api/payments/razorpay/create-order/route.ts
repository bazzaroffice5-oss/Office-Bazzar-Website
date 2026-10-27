import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/db/store';
import { createRazorpayOrder, isRazorpayConfigured } from '@/lib/payments/razorpay';

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Order is already marked as paid.' }, { status: 400 });
    }

    if (!isRazorpayConfigured) {
      return NextResponse.json(
        {
          configured: false,
          error: 'Razorpay merchant credentials are not yet configured in environment variables (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET required).',
        },
        { status: 503 }
      );
    }

    const rzpOrder = await createRazorpayOrder(order.totalAmount, order.orderNumber, {
      orderId: order.id,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
    });

    return NextResponse.json({
      configured: true,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initialize payment gateway order.' },
      { status: 500 }
    );
  }
}
