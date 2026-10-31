export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  parentId?: string | null;
  subcategories?: Subcategory[];
  itemCount?: number;
  featured?: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  itemCount?: number;
  imageUrl?: string;
  description?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  productCount?: number;
  featured?: boolean;
}

export interface ProductSpecification {
  [key: string]: string | number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  brandId: string;
  brandName: string;
  description: string;
  shortDescription?: string;
  specifications: ProductSpecification;
  price?: number | null; // Nullable for B2B RFQ products where pricing is provided on quotation
  mrp?: number | null;
  gstPercent: number; // e.g. 18 for 18% GST
  stockQuantity: number;
  minOrderQuantity: number;
  packSize: string; // e.g. "Pack of 10", "Box of 100", "5 Litres"
  hsnCode?: string; // Harmonized System of Nomenclature code for GST classification
  images: string[];
  featured?: boolean;
  bestseller?: boolean;
  rating?: number | null;
  reviewCount: number;
  isActive: boolean;
  isPriceVerified?: boolean;
  requiresManualReview?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
}

export interface CartItem {
  id: string; // cart item id
  product: Product;
  quantity: number;
  selectedPackSize?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  shippingCharge: number;
  total: number;
  appliedCoupon?: Coupon | null;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minCartAmount: number;
  maxDiscountAmount?: number;
  description: string;
}

export interface Address {
  fullName: string;
  phone: string;
  companyName?: string;
  gstin?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'online_razorpay' | 'cod' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  gstPercent: number;
  hsnCode?: string;
  quantity: number;
  totalPrice: number;
  productImage: string;
  packSize?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  idempotencyKey?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  gstin?: string;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  shippingCharge: number;
  totalAmount: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  orderStatus: OrderStatus;
  trackingNumber?: string;
  courierName?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BulkRFQ {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin?: string;
  category: string;
  requirements: string;
  estimatedQuantity: string;
  deliveryLocation: string;
  createdAt: string;
  status: 'pending' | 'in_review' | 'quoted' | 'closed';
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  gstin?: string;
  role: 'customer' | 'admin';
}

export interface FilterParams {
  query?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

// ==============================================================================
// CORPORATE QUOTATION (RFQ) SYSTEM TYPES
// ==============================================================================

export type QuotationStatus =
  | 'new'
  | 'under_review'
  | 'quotation_prepared'
  | 'approved'
  | 'sent_to_customer'
  | 'accepted'
  | 'rejected'
  | 'closed';

export interface OriginalRFQItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  hsnCode?: string;
  packSize?: string;
  originalQuantity: number;
  indicativeUnitPrice: number;
  gstPercent: number;
  indicativeTotalPrice: number;
}

export interface QuotationAuditEntry {
  version: number;
  timestamp: string;
  action: 'rfq_submitted' | 'draft_saved' | 'quotation_edited' | 'approved' | 'sent_to_customer';
  actor: string;
  summary: string;
  grandTotal: number;
  itemSnapshot?: Array<{
    sku: string;
    productName: string;
    originalQuantity: number;
    quotedQuantity: number;
    unitPrice: number;
    discountPercent: number;
    gstPercent: number;
    lineTotal: number;
  }>;
}

export interface QuotationItem {
  id: string;
  quotationId?: string;
  productId: string;
  productName: string;
  sku: string;
  indicativeUnitPrice: number;
  originalUnitPrice?: number;
  hsnCode?: string;
  gstPercent: number;
  quantity: number;
  originalQuantity?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxAmount?: number;
  lineSubtotal?: number;
  lineTaxableAmount?: number;
  lineGrandTotal?: number;
  indicativeTotalPrice: number;
  productImage?: string;
  packSize?: string;
}

export interface Quotation {
  id: string;
  zohoQuoteId?: string;
  zohoContactId?: string;
  zohoAccountId?: string;
  quotationNumber: string; // Sequential identifier e.g. OB-RFQ-2026-00001
  idempotencyKey?: string;
  customerId?: string;
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  gstin?: string;
  deliveryLocation?: string;
  pincode: string;
  photoUrls?: string[];
  preferredContactMethod: 'phone' | 'whatsapp' | 'email';
  additionalRequirements?: string;
  items: QuotationItem[];
  originalItems?: OriginalRFQItem[];
  indicativeSubtotal: number;
  indicativeGstAmount: number;
  indicativeTotal: number;
  // Editable Final Quotation Commercial Breakdown
  subtotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  gstPercent?: number;
  gstAmount?: number;
  deliveryCharges?: number;
  additionalCharges?: number;
  grandTotal?: number;
  validUntil?: string;
  paymentTerms?: string;
  termsAndConditions?: string;
  status: QuotationStatus;
  assignedTo?: string; // Designated sales manager / rep (e.g. Sales or Marketing)
  assignedEmail?: string; // Designated admin email (sales4@officebazzar.com or marketing@officebazzar.com)
  assignedAt?: string; // ISO timestamp of initial lead assignment
  assignedSequence?: number; // Sequential assignment index
  internalNotes?: string; // Protected internal notes hidden from customers
  quotedAmount?: number; // Official final amount quoted by sales team
  quotationDocumentUrl?: string; // Link to generated quote document
  version?: number;
  approvedAt?: string;
  approvedBy?: string;
  sentAt?: string;
  sentBy?: string;
  sentMessageId?: string;
  auditHistory?: QuotationAuditEntry[];
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationLog {
  id: string;
  quotationId: string;
  quotationNumber: string;
  channel: 'email_admin' | 'email_sales' | 'email_quote' | 'whatsapp_admin' | 'whatsapp_sales';
  recipient: string;
  status: 'sent' | 'failed' | 'pending';
  attempts: number;
  lastAttemptAt: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
