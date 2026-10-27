-- ====================================================================
-- OFFICEBAZZAR E-COMMERCE DATABASE SCHEMA (PostgreSQL / Supabase)
-- Production Schema with Complete Row Level Security (RLS) & Performance Indexes
-- ====================================================================

-- 1. Profiles & Customer Details
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    company_name TEXT,
    gstin TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customer Saved Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    address_type TEXT DEFAULT 'office' CHECK (address_type IN ('office', 'warehouse', 'home', 'billing')),
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    company_name TEXT,
    gstin TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories & Subcategories (Supports both UUID and alphanumeric category identifiers)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    icon TEXT,
    parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Brands
CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    category_name TEXT,
    subcategory_id TEXT,
    subcategory_name TEXT,
    brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
    brand_name TEXT,
    description TEXT NOT NULL,
    short_description TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    price NUMERIC(10, 2) CHECK (price >= 0), -- Nullable for quotation/B2B products without published prices
    mrp NUMERIC(10, 2) CHECK (mrp IS NULL OR price IS NULL OR mrp >= price),
    gst_percent NUMERIC(4, 2) DEFAULT 18.00,
    hsn_code TEXT, -- Harmonized System Nomenclature code for GST reporting
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    min_order_quantity INT DEFAULT 1,
    pack_size TEXT DEFAULT '1 Piece',
    images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
    is_featured BOOLEAN DEFAULT FALSE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_price_verified BOOLEAN DEFAULT FALSE,
    requires_manual_review BOOLEAN DEFAULT TRUE,
    rating NUMERIC(2, 1) DEFAULT NULL,
    review_count INT DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backward-compatible migration if table was already created
ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
ALTER TABLE products ALTER COLUMN mrp DROP NOT NULL;
ALTER TABLE products ALTER COLUMN rating DROP NOT NULL;
ALTER TABLE products ALTER COLUMN rating SET DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_price_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN DEFAULT TRUE;

-- 6. Coupons & Discounts
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_cart_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount_amount NUMERIC(10, 2),
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    usage_limit INT,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    idempotency_key TEXT UNIQUE, -- Prevents duplicate checkouts
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    company_name TEXT,
    gstin TEXT,
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    gst_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    shipping_charge NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    coupon_code TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('online_razorpay', 'cod', 'bank_transfer')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_id TEXT,
    order_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    tracking_number TEXT,
    courier_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Order Items (Preserving historical pricing, SKU, and HSN)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    gst_percent NUMERIC(4, 2) NOT NULL,
    hsn_code TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL,
    product_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATOMIC INVENTORY DECREMENT FUNCTION
-- Performs check-and-decrement with row lock to prevent race conditions and overselling
CREATE OR REPLACE FUNCTION decrement_product_stock_atomic(
    p_product_id TEXT,
    p_quantity INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_stock INT;
BEGIN
    SELECT stock_quantity INTO v_current_stock
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_current_stock < p_quantity THEN
        RETURN FALSE;
    END IF;

    UPDATE products
    SET stock_quantity = stock_quantity - p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;

    RETURN TRUE;
END;
$$;

-- 9. Bulk Quotation Enquiries (RFQ)
CREATE TABLE IF NOT EXISTS bulk_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    gstin TEXT,
    product_categories TEXT[] DEFAULT '{}',
    requirements TEXT NOT NULL,
    estimated_monthly_spend TEXT,
    delivery_location TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'closed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Homepage Banners & Dynamic Content
CREATE TABLE IF NOT EXISTS homepage_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    tag TEXT,
    cta_text TEXT DEFAULT 'Shop Now',
    cta_link TEXT NOT NULL,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active_bestseller ON products(is_active, is_bestseller);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- RLS (ROW LEVEL SECURITY) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_enquiries ENABLE ROW LEVEL SECURITY;

-- Public read for products, categories, brands, banners
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public products viewable by everyone" ON products FOR SELECT USING (is_active = TRUE);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public categories viewable by everyone" ON categories FOR SELECT USING (is_active = TRUE);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public brands viewable by everyone" ON brands FOR SELECT USING (TRUE);
ALTER TABLE homepage_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public banners viewable by everyone" ON homepage_banners FOR SELECT USING (is_active = TRUE);

-- Customer Profiles RLS
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Customer Addresses RLS
CREATE POLICY "Users can view own addresses" ON customer_addresses FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own addresses" ON customer_addresses FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own addresses" ON customer_addresses FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users can delete own addresses" ON customer_addresses FOR DELETE USING (auth.uid() = profile_id);

-- Orders RLS (Users see own orders; anyone can insert checkout order)
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (TRUE);

-- Order Items RLS
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.customer_id = auth.uid() OR auth.uid() IS NULL))
);
CREATE POLICY "Anyone can insert order items" ON order_items FOR INSERT WITH CHECK (TRUE);

-- Bulk Enquiries (RFQ) RLS
CREATE POLICY "Anyone can submit bulk enquiries" ON bulk_enquiries FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can view bulk enquiries" ON bulk_enquiries FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ====================================================================
-- 11. B2B CART-TO-QUOTATION (RFQ) SYSTEM
-- ====================================================================

-- Reliable sequence for quotation references
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'OB-RFQ-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(NEXTVAL('quotation_number_seq')::TEXT, 5, '0');
END;
$$;

-- Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number TEXT UNIQUE NOT NULL DEFAULT generate_quotation_number(),
    idempotency_key TEXT UNIQUE,
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    gstin TEXT,
    delivery_location TEXT,
    pincode TEXT NOT NULL,
    photo_urls TEXT[] DEFAULT '{}',
    preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('phone', 'whatsapp', 'email')),
    additional_requirements TEXT,
    indicative_subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    indicative_gst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    indicative_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'quotation_prepared', 'sent_to_customer', 'accepted', 'rejected', 'closed')),
    assigned_to TEXT,
    internal_notes TEXT, -- Hidden from customers
    quoted_amount NUMERIC(10, 2),
    quotation_document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotation Line Items Table
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    indicative_unit_price NUMERIC(10, 2) NOT NULL,
    hsn_code TEXT,
    gst_percent NUMERIC(4, 2) NOT NULL DEFAULT 18.00,
    quantity INT NOT NULL CHECK (quantity > 0),
    indicative_total_price NUMERIC(10, 2) NOT NULL,
    product_image TEXT,
    pack_size TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Logs Table (For retries & audit logging)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    quotation_number TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email_admin', 'email_sales', 'email_quote', 'whatsapp_admin', 'whatsapp_sales')),
    recipient TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
    attempts INT DEFAULT 1,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotation Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_quotation ON notification_logs(quotation_id);

-- Quotations RLS Policies
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can submit a quote request
CREATE POLICY "Anyone can submit quotations" ON quotations
    FOR INSERT WITH CHECK (TRUE);

-- 2. Customers can view only their own quotations
CREATE POLICY "Customers view own quotations" ON quotations
    FOR SELECT USING (
        auth.uid() = customer_id 
        OR (auth.uid() IS NULL AND FALSE)
    );

-- 3. Staff and Admin can view and update all quotations
CREATE POLICY "Staff can view all quotations" ON quotations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
    );

CREATE POLICY "Staff can update quotations" ON quotations
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
    );

-- Quotation Items RLS Policies
CREATE POLICY "Anyone can insert quotation items" ON quotation_items
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Customers view own quotation items" ON quotation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quotations 
            WHERE quotations.id = quotation_items.quotation_id 
            AND (quotations.customer_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- Notification Logs RLS Policies (Staff/Admin only)
CREATE POLICY "Staff can manage notification logs" ON notification_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
    );
