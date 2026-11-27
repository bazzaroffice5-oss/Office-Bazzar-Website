export type DateRangePreset = 'today' | '7d' | '30d' | 'all';

export interface ProductItemSummary {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  packSize?: string;
}

export interface QuoteLogRecord {
  id: string; // Quotation number or internal ID
  quotation_number: string;
  created_at: string; // ISO 8601 UTC string
  created_at_ist: string; // Formatted IST (Asia/Kolkata) string
  customer_name: string;
  phone: string;
  email: string;
  company_name?: string;
  delivery_location?: string;
  pincode?: string;
  message?: string;
  products: ProductItemSummary[];
  total_amount?: number;
  recipient_1_email: string;
  recipient_1_status: 'sent' | 'failed' | 'skipped' | 'pending';
  recipient_1_error?: string;
  recipient_2_email: string;
  recipient_2_status: 'sent' | 'failed' | 'skipped' | 'pending';
  recipient_2_error?: string;
  customer_email_status?: 'sent' | 'failed' | 'skipped' | 'pending';
  sync_status?: string;
}

export interface PageViewRecord {
  id?: string;
  page_path: string;
  visitor_hash: string;
  referrer?: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  visited_at: string; // ISO 8601 UTC string
  visited_at_ist: string;
}

export interface PageBreakdownItem {
  path: string;
  views: number;
  uniqueVisitors: number;
  percentage: number;
}

export interface RecipientStats {
  email: string;
  role: string;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  totalDispatched: number;
  successRate: number;
}

export interface AnalyticsKPIs {
  totalPageViews: number;
  uniqueVisitors: number;
  totalQuoteRequests: number;
  recipient1: RecipientStats;
  recipient2: RecipientStats;
  dateRange: DateRangePreset;
  quotes: QuoteLogRecord[];
  pageBreakdown: PageBreakdownItem[];
  recentVisitorsCount: number;
}

export interface AnalyticsAdminSession {
  authenticated: boolean;
  email?: string;
  expiresAt?: number;
}
