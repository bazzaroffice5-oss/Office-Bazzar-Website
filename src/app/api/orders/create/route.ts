import { NextResponse } from 'next/server';
import { createOrder, getProductById, validateCoupon } from '@/lib/db/store';
import { OrderItem, Address, PaymentMethod } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idempotencyHeader = req.headers.get('Idempotency-Key') || req.headers.get('x-idempotency-key');
    const idempotencyKey = idempotencyHeader || body.idempotencyKey;

    const {
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      gstin,
      shippingAddress,
      billingAddress,
      items,
      couponCode,
      paymentMethod,
      notes,
    } = body;

    // Contact & Address Validation
    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer contact details (name, email, and mobile phone) are mandatory.' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.pincode) {
      return NextResponse.json(
        { error: 'Valid delivery address and postal PIN code are required.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Shopping cart is empty. Cannot create order without items.' },
        { status: 400 }
      );
    }

    // Revalidate items against server catalogue (authoritative pricing & inventory check)
    const validatedItems: OrderItem[] = [];
    let subtotal = 0;
    let computedGst = 0;

    for (const rawItem of items) {
      const prod = await getProductById(rawItem.productId);
      if (!prod) {
        return NextResponse.json(
          { error: `Product with ID "${rawItem.productId}" is no longer available in catalog.` },
          { status: 400 }
        );
      }

      if (prod.stockQuantity < rawItem.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient inventory for "${prod.name}". Available: ${prod.stockQuantity}, Requested: ${rawItem.quantity}.`,
          },
          { status: 400 }
        );
      }

      const unitPrice = prod.price ?? 0;
      const itemTotal = unitPrice * rawItem.quantity;
      const itemGstRate = prod.gstPercent || 18;
      const itemGst = (itemTotal * itemGstRate) / 100;

      subtotal += itemTotal;
      computedGst += itemGst;

      validatedItems.push({
        id: `ord-item-${Date.now()}-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unitPrice: unitPrice,
        gstPercent: itemGstRate,
        hsnCode: prod.hsnCode,
        quantity: rawItem.quantity,
        totalPrice: itemTotal,
        productImage: prod.images[0] || '',
        packSize: prod.packSize,
      });
    }

    // Coupon discount calculation
    let discountAmount = 0;
    if (couponCode) {
      const couponRes = await validateCoupon(couponCode, subtotal);
      if (couponRes.valid && couponRes.coupon) {
        const c = couponRes.coupon;
        if (c.discountType === 'percentage') {
          discountAmount = (subtotal * c.discountValue) / 100;
          if (c.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, c.maxDiscountAmount);
          }
        } else {
          discountAmount = c.discountValue;
        }
      }
    }

    // Taxes & Shipping
    // If discount was applied, adjust GST proportionately
    const discountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;
    const gstAmount = Math.round(computedGst * discountRatio * 100) / 100;
    const shippingCharge = subtotal >= 999 ? 0 : 99;
    const totalAmount = Math.round((subtotal - discountAmount + gstAmount + shippingCharge) * 100) / 100;

    // Create Order with Idempotency Key
    const newOrder = await createOrder({
      idempotencyKey,
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      gstin,
      shippingAddress: shippingAddress as Address,
      billingAddress: (billingAddress || shippingAddress) as Address,
      items: validatedItems,
      subtotal,
      gstAmount,
      discountAmount,
      shippingCharge,
      totalAmount,
      couponCode: couponCode || undefined,
      paymentMethod: (paymentMethod || 'online_razorpay') as PaymentMethod,
      paymentStatus: 'pending',
      paymentId: undefined,
      orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending',
      notes: notes
        ? `${notes} (${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'bank_transfer' ? 'Awaiting NEFT/RTGS bank transfer credit' : 'Awaiting Razorpay gateway capture / verification'})`
        : paymentMethod === 'cod'
        ? 'Cash on Delivery — pay on receipt'
        : paymentMethod === 'bank_transfer'
        ? 'Awaiting NEFT/RTGS bank transfer credit'
        : 'Awaiting Razorpay gateway capture / verification',
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error creating order.' },
      { status: 500 }
    );
  }
}
