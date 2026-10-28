-- ====================================================================
-- RLS POLICIES FOR RFQ QUOTATIONS, ITEMS, AND NOTIFICATION LOGS
-- Allows unauthenticated website visitors to submit Request for Quote (RFQ)
-- and Contact Us enquiries, while allowing service_role full administrative access.
-- ====================================================================

-- 1. Quotations Table RLS
ALTER TABLE IF EXISTS quotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit quotations" ON quotations;
CREATE POLICY "Anyone can submit quotations" ON quotations
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Anyone can view own quotation by ID or reference" ON quotations;
CREATE POLICY "Anyone can view own quotation by ID or reference" ON quotations
    FOR SELECT USING (TRUE);

-- 2. Quotation Line Items Table RLS
ALTER TABLE IF EXISTS quotation_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert quotation items" ON quotation_items;
CREATE POLICY "Anyone can insert quotation items" ON quotation_items
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Anyone can view quotation items" ON quotation_items;
CREATE POLICY "Anyone can view quotation items" ON quotation_items
    FOR SELECT USING (TRUE);

-- 3. Notification Logs Table RLS
ALTER TABLE IF EXISTS notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert notification logs" ON notification_logs;
CREATE POLICY "Anyone can insert notification logs" ON notification_logs
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Anyone can update notification logs" ON notification_logs;
CREATE POLICY "Anyone can update notification logs" ON notification_logs
    FOR UPDATE USING (TRUE);

DROP POLICY IF EXISTS "Anyone can view notification logs" ON notification_logs;
CREATE POLICY "Anyone can view notification logs" ON notification_logs
    FOR SELECT USING (TRUE);

-- 4. Bulk Enquiries (Contact Us) Table RLS
ALTER TABLE IF EXISTS bulk_enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit bulk enquiries" ON bulk_enquiries;
CREATE POLICY "Anyone can submit bulk enquiries" ON bulk_enquiries
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Anyone can view bulk enquiries" ON bulk_enquiries;
CREATE POLICY "Anyone can view bulk enquiries" ON bulk_enquiries
    FOR SELECT USING (TRUE);

