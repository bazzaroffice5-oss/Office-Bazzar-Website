-- ============================================================================
-- Office Bazzar: Quote & Traffic Analytics Schema
-- Migration: 20261127_analytics_and_quotes.sql
-- ============================================================================

-- 1. Quote Submissions & 2-Email Delivery Logs Table
CREATE TABLE IF NOT EXISTS public.quote_logs (
    id VARCHAR(120) PRIMARY KEY, -- Quotation number or unique ID (e.g. OB-RFQ-2026-00001)
    quotation_number VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at_ist VARCHAR(80) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    delivery_location TEXT,
    pincode VARCHAR(20),
    message TEXT,
    products JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    recipient_1_email VARCHAR(255) NOT NULL,
    recipient_1_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'sent', 'failed', 'skipped', 'pending'
    recipient_1_error TEXT,
    recipient_2_email VARCHAR(255) NOT NULL,
    recipient_2_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'sent', 'failed', 'skipped', 'pending'
    recipient_2_error TEXT,
    customer_email_status VARCHAR(50) DEFAULT 'pending',
    sync_status VARCHAR(50) DEFAULT 'SYNCED',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for lightning-fast queries by date, customer, and quote number
CREATE INDEX IF NOT EXISTS idx_quote_logs_created_at ON public.quote_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_logs_quotation_number ON public.quote_logs (quotation_number);
CREATE INDEX IF NOT EXISTS idx_quote_logs_email ON public.quote_logs (email);
CREATE INDEX IF NOT EXISTS idx_quote_logs_phone ON public.quote_logs (phone);

-- 2. Real Visitor & Page View Logs Table
CREATE TABLE IF NOT EXISTS public.page_view_logs (
    id BIGSERIAL PRIMARY KEY,
    page_path VARCHAR(500) NOT NULL,
    visitor_hash VARCHAR(64) NOT NULL, -- Daily unique anonymous hash (IP + User-Agent + date salt)
    referrer VARCHAR(500),
    device_type VARCHAR(50) NOT NULL DEFAULT 'desktop', -- 'desktop', 'mobile', 'tablet', 'unknown'
    visited_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    visited_at_ist VARCHAR(80) NOT NULL
);

-- Indexes for path, date range, and unique visitor aggregations
CREATE INDEX IF NOT EXISTS idx_page_view_logs_visited_at ON public.page_view_logs (visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_view_logs_page_path ON public.page_view_logs (page_path);
CREATE INDEX IF NOT EXISTS idx_page_view_logs_visitor_hash ON public.page_view_logs (visitor_hash, visited_at);

-- 3. Row Level Security (RLS) Settings
ALTER TABLE public.quote_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_view_logs ENABLE ROW LEVEL SECURITY;

-- Allow read/write access via Supabase Service Role and Authenticated API
CREATE POLICY "Allow service role full access on quote_logs"
    ON public.quote_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service role full access on page_view_logs"
    ON public.page_view_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);
