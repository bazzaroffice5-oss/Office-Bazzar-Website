import Razorpay from 'razorpay';
import crypto from 'crypto';

const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export const isRazorpayConfigured = Boolean(
  keyId &&
  keySecret &&
  !keyId.includes('your_key_id') &&
  !keySecret.includes('your_razorpay_secret')
);

// Initialize Razorpay SDK instance if configured
export const razorpayInstance = isRazorpayConfigured
  ? new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  : null;

/**
 * Creates an official Razorpay order on Razorpay servers
 * @param amountInRupees Total amount in INR
 * @param receipt Internal receipt / order reference
 * @param notes Key-value pairs for merchant context
 */
export async function createRazorpayOrder(
  amountInRupees: number,
  receipt: string,
  notes?: Record<string, string>
) {
  if (!razorpayInstance) {
    throw new Error('Razorpay is not configured. Missing valid RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.');
  }

  const amountInPaise = Math.round(amountInRupees * 100);

  const order = await razorpayInstance.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: receipt.slice(0, 40), // Razorpay limits receipt to 40 chars
    notes: notes || {},
  });

  return order;
}

/**
 * Cryptographically verifies Razorpay Checkout payment signature using HMAC SHA256
 */
export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  if (!keySecret) {
    return false;
  }

  const payload = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex');

  return expectedSignature === params.razorpaySignature;
}

/**
 * Cryptographically verifies asynchronous Razorpay Webhook signature
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  receivedSignature: string
): boolean {
  const secret = webhookSecret || keySecret;
  if (!secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === receivedSignature;
}
